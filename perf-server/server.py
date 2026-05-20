"""
Performance Metrics MCP Server
Captures network request timings from web applications using Playwright
and generates interactive HTML reports with bottleneck classification.
"""

import asyncio
import json
import os
import time
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Optional

from mcp.server.fastmcp import FastMCP
from playwright.async_api import async_playwright, Request, Response

mcp = FastMCP("perf-metrics")

REPORTS_DIR = Path(__file__).parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def classify_bottleneck(timing: dict) -> dict:
    """Classify where the bottleneck is based on timing breakdown."""
    dns = timing.get("domainLookupEnd", 0) - timing.get("domainLookupStart", 0)
    connect = timing.get("connectEnd", 0) - timing.get("connectStart", 0)
    tls = timing.get("connectEnd", 0) - timing.get("secureConnectionStart", -1)
    if timing.get("secureConnectionStart", -1) < 0:
        tls = 0
    ttfb = timing.get("responseStart", 0) - timing.get("requestStart", 0)
    download = timing.get("responseEnd", 0) - timing.get("responseStart", 0)
    total = timing.get("responseEnd", 0) - timing.get("startTime", 0)

    network_total = dns + connect + tls

    if total <= 0:
        label = "UNKNOWN"
        diagnosis = "Could not determine timing."
    elif ttfb > total * 0.6 and ttfb > 200:
        label = "API_BOTTLENECK"
        diagnosis = f"Server took {ttfb:.0f}ms before first byte. Likely slow DB query, unoptimized logic, or slow upstream service."
    elif download > total * 0.6 and download > 200:
        label = "LARGE_PAYLOAD"
        diagnosis = f"Download took {download:.0f}ms. Response payload may be too large — consider pagination, compression, or field filtering."
    elif network_total > total * 0.5 and network_total > 100:
        label = "NETWORK_LATENCY"
        diagnosis = f"Network overhead (DNS+Connect+TLS) was {network_total:.0f}ms. Infrastructure or distance issue."
    elif total < 100:
        label = "HEALTHY"
        diagnosis = "Request completed quickly."
    else:
        label = "MIXED"
        diagnosis = "No single dominant bottleneck. Multiple phases contributing."

    return {
        "dns_ms": round(dns, 2),
        "connect_ms": round(connect, 2),
        "tls_ms": round(tls, 2),
        "ttfb_ms": round(ttfb, 2),
        "download_ms": round(download, 2),
        "total_ms": round(total, 2),
        "network_overhead_ms": round(network_total, 2),
        "bottleneck": label,
        "diagnosis": diagnosis,
    }


async def _capture_metrics(
    url: str,
    wait_time: int = 3,
    actions: Optional[list[str]] = None,
    auth_token: Optional[str] = None,
    filter_resource_types: Optional[list[str]] = None,
) -> list[dict]:
    """Core capture logic — launches browser, navigates, records all network traffic."""
    requests_data: list[dict] = []
    pending_requests: dict[str, dict] = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        context_options = {}
        if auth_token:
            context_options["extra_http_headers"] = {
                "Authorization": f"Bearer {auth_token}"
            }

        context = await browser.new_context(**context_options)
        page = await context.new_page()

        def on_request(request: Request):
            pending_requests[request.url + request.method] = {
                "url": request.url,
                "method": request.method,
                "resource_type": request.resource_type,
                "start_time": time.time(),
            }

        async def on_response(response: Response):
            request = response.request
            key = request.url + request.method
            try:
                timing = await request.timing()
                sizes = await request.sizes()
            except Exception:
                timing = {}
                sizes = {}

            breakdown = classify_bottleneck(timing)

            entry = {
                "url": request.url,
                "method": request.method,
                "status": response.status,
                "status_text": response.status_text,
                "resource_type": request.resource_type,
                "timing_raw": timing,
                "sizes": sizes,
                "breakdown": breakdown,
            }

            if filter_resource_types:
                if request.resource_type in filter_resource_types:
                    requests_data.append(entry)
            else:
                requests_data.append(entry)

            pending_requests.pop(key, None)

        page.on("request", on_request)
        page.on("response", on_response)

        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception as e:
            # Even on timeout, we may have partial data
            pass

        # Execute user actions if provided
        if actions:
            for action in actions:
                try:
                    if action.startswith("click:"):
                        selector = action[6:]
                        await page.click(selector, timeout=10000)
                        await page.wait_for_load_state("networkidle", timeout=10000)
                    elif action.startswith("fill:"):
                        parts = action[5:].split("|", 1)
                        if len(parts) == 2:
                            await page.fill(parts[0], parts[1])
                    elif action.startswith("wait:"):
                        await asyncio.sleep(int(action[5:]))
                    elif action.startswith("goto:"):
                        await page.goto(action[5:], wait_until="networkidle", timeout=30000)
                except Exception:
                    pass

        # Wait for any remaining async requests
        await asyncio.sleep(wait_time)
        await browser.close()

    # Sort by total time descending
    requests_data.sort(key=lambda r: r["breakdown"]["total_ms"], reverse=True)
    return requests_data


def _build_summary(metrics: list[dict], url: str) -> dict:
    """Build aggregate summary statistics."""
    if not metrics:
        return {"total_requests": 0, "url": url}

    api_requests = [m for m in metrics if m["resource_type"] in ("fetch", "xhr")]
    total_times = [m["breakdown"]["total_ms"] for m in metrics]
    ttfb_times = [m["breakdown"]["ttfb_ms"] for m in metrics]
    api_ttfbs = [m["breakdown"]["ttfb_ms"] for m in api_requests] if api_requests else [0]

    bottleneck_counts = {}
    for m in metrics:
        b = m["breakdown"]["bottleneck"]
        bottleneck_counts[b] = bottleneck_counts.get(b, 0) + 1

    total_transfer = sum(
        m.get("sizes", {}).get("responseBodySize", 0) for m in metrics
    )

    slowest = metrics[0] if metrics else None

    return {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "total_requests": len(metrics),
        "api_requests": len(api_requests),
        "total_time_all_ms": round(sum(total_times), 2),
        "avg_response_time_ms": round(sum(total_times) / len(total_times), 2),
        "avg_ttfb_ms": round(sum(ttfb_times) / len(ttfb_times), 2),
        "avg_api_ttfb_ms": round(sum(api_ttfbs) / len(api_ttfbs), 2),
        "max_response_time_ms": round(max(total_times), 2),
        "slowest_url": slowest["url"] if slowest else "",
        "total_transfer_bytes": total_transfer,
        "total_transfer_kb": round(total_transfer / 1024, 2),
        "bottleneck_counts": bottleneck_counts,
    }


# ---------------------------------------------------------------------------
# HTML Report Generator
# ---------------------------------------------------------------------------

def _build_html_report(metrics: list[dict], url: str) -> str:
    """Generate an interactive HTML report and return the file path."""
    summary = _build_summary(metrics, url)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = REPORTS_DIR / f"perf_report_{timestamp}.html"

    # Build table rows
    rows_html = ""
    max_total = max((m["breakdown"]["total_ms"] for m in metrics), default=1)
    if max_total <= 0:
        max_total = 1

    for m in metrics:
        b = m["breakdown"]
        status = m["status"]
        status_class = "status-ok" if 200 <= status < 300 else "status-redirect" if 300 <= status < 400 else "status-error"

        # Bottleneck badge
        badge_class = {
            "API_BOTTLENECK": "badge-red",
            "LARGE_PAYLOAD": "badge-orange",
            "NETWORK_LATENCY": "badge-yellow",
            "HEALTHY": "badge-green",
            "MIXED": "badge-gray",
            "UNKNOWN": "badge-gray",
        }.get(b["bottleneck"], "badge-gray")

        # Waterfall bar widths (proportional)
        total = b["total_ms"] if b["total_ms"] > 0 else 1
        bar_width = (b["total_ms"] / max_total) * 100

        dns_pct = (b["dns_ms"] / total) * bar_width if total else 0
        connect_pct = (b["connect_ms"] / total) * bar_width if total else 0
        tls_pct = (b["tls_ms"] / total) * bar_width if total else 0
        ttfb_pct = (b["ttfb_ms"] / total) * bar_width if total else 0
        download_pct = (b["download_ms"] / total) * bar_width if total else 0

        # Truncate URL for display
        display_url = m["url"]
        if len(display_url) > 80:
            display_url = display_url[:77] + "..."

        req_size = m.get("sizes", {}).get("requestBodySize", 0)
        res_size = m.get("sizes", {}).get("responseBodySize", 0)

        row_class = "row-slow" if b["total_ms"] > 1000 else "row-warn" if b["total_ms"] > 500 else ""

        rows_html += f"""
        <tr class="{row_class}" data-total="{b['total_ms']}" data-ttfb="{b['ttfb_ms']}"
            data-type="{m['resource_type']}" data-bottleneck="{b['bottleneck']}">
            <td class="{status_class}">{status}</td>
            <td>{m['method']}</td>
            <td class="url-cell" title="{m['url']}">{display_url}</td>
            <td class="type-cell">{m['resource_type']}</td>
            <td class="num">{b['dns_ms']:.0f}</td>
            <td class="num">{b['connect_ms']:.0f}</td>
            <td class="num">{b['tls_ms']:.0f}</td>
            <td class="num ttfb-cell">{b['ttfb_ms']:.0f}</td>
            <td class="num">{b['download_ms']:.0f}</td>
            <td class="num total-cell">{b['total_ms']:.0f}</td>
            <td class="num">{res_size}</td>
            <td><span class="badge {badge_class}">{b['bottleneck']}</span></td>
            <td class="waterfall-cell">
                <div class="waterfall-bar">
                    <div class="bar-dns" style="width:{dns_pct}%" title="DNS: {b['dns_ms']:.0f}ms"></div>
                    <div class="bar-connect" style="width:{connect_pct}%" title="Connect: {b['connect_ms']:.0f}ms"></div>
                    <div class="bar-tls" style="width:{tls_pct}%" title="TLS: {b['tls_ms']:.0f}ms"></div>
                    <div class="bar-ttfb" style="width:{ttfb_pct}%" title="TTFB: {b['ttfb_ms']:.0f}ms"></div>
                    <div class="bar-download" style="width:{download_pct}%" title="Download: {b['download_ms']:.0f}ms"></div>
                </div>
            </td>
            <td class="diagnosis-cell" title="{b['diagnosis']}">{b['diagnosis'][:60]}...</td>
        </tr>"""

    # Bottleneck summary chips
    bottleneck_chips = ""
    for label, count in summary.get("bottleneck_counts", {}).items():
        chip_class = {
            "API_BOTTLENECK": "badge-red",
            "LARGE_PAYLOAD": "badge-orange",
            "NETWORK_LATENCY": "badge-yellow",
            "HEALTHY": "badge-green",
        }.get(label, "badge-gray")
        bottleneck_chips += f'<span class="badge {chip_class}">{label}: {count}</span> '

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Performance Report — {url}</title>
<style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #0f1117;
        color: #e1e4e8;
        padding: 20px;
    }}

    .header {{
        background: linear-gradient(135deg, #1a1e2e, #252a3a);
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 20px;
    }}
    .header h1 {{
        font-size: 22px;
        color: #58a6ff;
        margin-bottom: 8px;
    }}
    .header .url {{
        color: #8b949e;
        font-size: 14px;
        margin-bottom: 16px;
        word-break: break-all;
    }}

    .stats-grid {{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
    }}
    .stat-card {{
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
    }}
    .stat-card .value {{
        font-size: 28px;
        font-weight: 700;
        color: #58a6ff;
    }}
    .stat-card .value.warn {{ color: #d29922; }}
    .stat-card .value.bad {{ color: #f85149; }}
    .stat-card .label {{
        font-size: 12px;
        color: #8b949e;
        margin-top: 4px;
        text-transform: uppercase;
    }}

    .bottleneck-summary {{
        margin: 12px 0;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }}

    .filters {{
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }}
    .filter-btn {{
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid #30363d;
        background: #161b22;
        color: #c9d1d9;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
    }}
    .filter-btn:hover, .filter-btn.active {{
        background: #58a6ff;
        color: #0d1117;
        border-color: #58a6ff;
    }}

    .table-container {{
        overflow-x: auto;
        border: 1px solid #30363d;
        border-radius: 12px;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }}
    th {{
        background: #161b22;
        padding: 12px 10px;
        text-align: left;
        color: #8b949e;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 11px;
        cursor: pointer;
        user-select: none;
        border-bottom: 2px solid #30363d;
        white-space: nowrap;
    }}
    th:hover {{ color: #58a6ff; }}
    th .sort-arrow {{ margin-left: 4px; font-size: 10px; }}

    td {{
        padding: 10px;
        border-bottom: 1px solid #21262d;
        vertical-align: middle;
    }}
    tr:hover {{ background: #1c2128; }}

    .row-slow {{ border-left: 3px solid #f85149; }}
    .row-warn {{ border-left: 3px solid #d29922; }}

    .num {{ text-align: right; font-variant-numeric: tabular-nums; }}

    .status-ok {{ color: #3fb950; font-weight: 600; }}
    .status-redirect {{ color: #d29922; font-weight: 600; }}
    .status-error {{ color: #f85149; font-weight: 600; }}

    .url-cell {{
        max-width: 350px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        font-size: 12px;
    }}
    .type-cell {{
        color: #8b949e;
        font-size: 11px;
    }}
    .ttfb-cell {{ color: #f0883e; font-weight: 600; }}
    .total-cell {{ font-weight: 700; }}

    .diagnosis-cell {{
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #8b949e;
        font-size: 11px;
    }}

    .badge {{
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
    }}
    .badge-red {{ background: #f8514922; color: #f85149; border: 1px solid #f8514944; }}
    .badge-orange {{ background: #d2992222; color: #d29922; border: 1px solid #d2992244; }}
    .badge-yellow {{ background: #e3b34122; color: #e3b341; border: 1px solid #e3b34144; }}
    .badge-green {{ background: #3fb95022; color: #3fb950; border: 1px solid #3fb95044; }}
    .badge-gray {{ background: #8b949e22; color: #8b949e; border: 1px solid #8b949e44; }}

    .waterfall-cell {{ min-width: 200px; }}
    .waterfall-bar {{
        display: flex;
        height: 14px;
        border-radius: 3px;
        overflow: hidden;
        background: #21262d;
    }}
    .bar-dns {{ background: #79c0ff; }}
    .bar-connect {{ background: #56d364; }}
    .bar-tls {{ background: #d2a8ff; }}
    .bar-ttfb {{ background: #f0883e; }}
    .bar-download {{ background: #58a6ff; }}

    .legend {{
        display: flex;
        gap: 16px;
        margin: 16px 0;
        font-size: 12px;
        color: #8b949e;
    }}
    .legend-item {{
        display: flex;
        align-items: center;
        gap: 6px;
    }}
    .legend-swatch {{
        width: 12px;
        height: 12px;
        border-radius: 2px;
    }}

    .footer {{
        margin-top: 20px;
        padding: 16px;
        text-align: center;
        color: #484f58;
        font-size: 12px;
    }}
</style>
</head>
<body>

<div class="header">
    <h1>Performance Metrics Report</h1>
    <div class="url">{url} &mdash; {summary['timestamp']}</div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="value">{summary['total_requests']}</div>
            <div class="label">Total Requests</div>
        </div>
        <div class="stat-card">
            <div class="value">{summary['api_requests']}</div>
            <div class="label">API Requests (XHR/Fetch)</div>
        </div>
        <div class="stat-card">
            <div class="value {'bad' if summary['avg_ttfb_ms'] > 500 else 'warn' if summary['avg_ttfb_ms'] > 200 else ''}">{summary['avg_ttfb_ms']:.0f}ms</div>
            <div class="label">Avg TTFB</div>
        </div>
        <div class="stat-card">
            <div class="value {'bad' if summary['avg_api_ttfb_ms'] > 500 else 'warn' if summary['avg_api_ttfb_ms'] > 200 else ''}">{summary['avg_api_ttfb_ms']:.0f}ms</div>
            <div class="label">Avg API TTFB</div>
        </div>
        <div class="stat-card">
            <div class="value {'bad' if summary['max_response_time_ms'] > 2000 else 'warn' if summary['max_response_time_ms'] > 1000 else ''}">{summary['max_response_time_ms']:.0f}ms</div>
            <div class="label">Slowest Request</div>
        </div>
        <div class="stat-card">
            <div class="value">{summary['total_transfer_kb']:.1f} KB</div>
            <div class="label">Total Transfer</div>
        </div>
    </div>

    <div class="bottleneck-summary">
        <strong style="color:#8b949e;font-size:12px;align-self:center;">Bottlenecks:&nbsp;</strong>
        {bottleneck_chips}
    </div>
</div>

<div class="filters">
    <button class="filter-btn active" onclick="filterRows('all')">All</button>
    <button class="filter-btn" onclick="filterRows('api')">APIs Only</button>
    <button class="filter-btn" onclick="filterRows('slow')">Slow (&gt;500ms)</button>
    <button class="filter-btn" onclick="filterRows('bottleneck')">Bottlenecks Only</button>
    <button class="filter-btn" onclick="filterRows('static')">Static Assets</button>
</div>

<div class="legend">
    <div class="legend-item"><div class="legend-swatch" style="background:#79c0ff"></div> DNS</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#56d364"></div> Connect</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#d2a8ff"></div> TLS</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#f0883e"></div> TTFB (Server)</div>
    <div class="legend-item"><div class="legend-swatch" style="background:#58a6ff"></div> Download</div>
</div>

<div class="table-container">
<table id="perfTable">
    <thead>
        <tr>
            <th onclick="sortTable(0, 'num')">Status <span class="sort-arrow"></span></th>
            <th onclick="sortTable(1, 'str')">Method <span class="sort-arrow"></span></th>
            <th onclick="sortTable(2, 'str')">URL <span class="sort-arrow"></span></th>
            <th onclick="sortTable(3, 'str')">Type <span class="sort-arrow"></span></th>
            <th onclick="sortTable(4, 'num')">DNS <span class="sort-arrow"></span></th>
            <th onclick="sortTable(5, 'num')">Connect <span class="sort-arrow"></span></th>
            <th onclick="sortTable(6, 'num')">TLS <span class="sort-arrow"></span></th>
            <th onclick="sortTable(7, 'num')">TTFB <span class="sort-arrow"></span></th>
            <th onclick="sortTable(8, 'num')">Download <span class="sort-arrow"></span></th>
            <th onclick="sortTable(9, 'num')">Total (ms) <span class="sort-arrow"></span></th>
            <th onclick="sortTable(10, 'num')">Size (B) <span class="sort-arrow"></span></th>
            <th onclick="sortTable(11, 'str')">Bottleneck <span class="sort-arrow"></span></th>
            <th>Waterfall</th>
            <th>Diagnosis</th>
        </tr>
    </thead>
    <tbody>
        {rows_html}
    </tbody>
</table>
</div>

<div class="footer">
    Generated by perf-metrics MCP Server &mdash; Playwright + FastMCP
</div>

<script>
let sortDir = {{}};

function sortTable(colIdx, type) {{
    const table = document.getElementById('perfTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    sortDir[colIdx] = !sortDir[colIdx];
    const dir = sortDir[colIdx] ? 1 : -1;

    rows.sort((a, b) => {{
        let aVal = a.cells[colIdx]?.textContent.trim() || '';
        let bVal = b.cells[colIdx]?.textContent.trim() || '';
        if (type === 'num') {{
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
            return (aVal - bVal) * dir;
        }}
        return aVal.localeCompare(bVal) * dir;
    }});

    rows.forEach(row => tbody.appendChild(row));
}}

function filterRows(filter) {{
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    const rows = document.querySelectorAll('#perfTable tbody tr');
    rows.forEach(row => {{
        const type = row.dataset.type;
        const total = parseFloat(row.dataset.total);
        const bottleneck = row.dataset.bottleneck;

        let show = true;
        if (filter === 'api') show = (type === 'fetch' || type === 'xhr');
        else if (filter === 'slow') show = total > 500;
        else if (filter === 'bottleneck') show = (bottleneck === 'API_BOTTLENECK' || bottleneck === 'LARGE_PAYLOAD' || bottleneck === 'NETWORK_LATENCY');
        else if (filter === 'static') show = (type === 'script' || type === 'stylesheet' || type === 'image' || type === 'font');

        row.style.display = show ? '' : 'none';
    }});
}}
</script>

</body>
</html>"""

    report_file.write_text(html, encoding="utf-8")
    return str(report_file.resolve())


# ---------------------------------------------------------------------------
# MCP Tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def capture_network_metrics(
    url: str,
    wait_time: int = 3,
    auth_token: str = "",
) -> str:
    """
    Capture all network requests and their timing breakdown from a web page.

    Args:
        url: Full URL to profile (e.g. http://192.168.1.50:3000/builder)
        wait_time: Seconds to wait after page load for async APIs (default 3)
        auth_token: Optional Bearer token for authenticated pages

    Returns:
        JSON with all requests, timing breakdowns, and bottleneck classifications.
    """
    token = auth_token if auth_token else None
    metrics = await _capture_metrics(url, wait_time, auth_token=token)
    summary = _build_summary(metrics, url)

    return json.dumps({
        "summary": summary,
        "requests": metrics,
    }, indent=2, default=str)


@mcp.tool()
async def get_slow_requests(
    url: str,
    threshold_ms: int = 500,
    wait_time: int = 3,
    auth_token: str = "",
) -> str:
    """
    Capture network metrics and return only requests slower than the threshold.

    Args:
        url: Full URL to profile
        threshold_ms: Minimum total time in ms to include (default 500)
        wait_time: Seconds to wait after page load (default 3)
        auth_token: Optional Bearer token

    Returns:
        JSON list of slow requests with bottleneck classification.
    """
    token = auth_token if auth_token else None
    metrics = await _capture_metrics(url, wait_time, auth_token=token)
    slow = [m for m in metrics if m["breakdown"]["total_ms"] > threshold_ms]

    return json.dumps({
        "threshold_ms": threshold_ms,
        "total_requests_captured": len(metrics),
        "slow_requests_count": len(slow),
        "slow_requests": slow,
    }, indent=2, default=str)


@mcp.tool()
async def get_api_performance(
    url: str,
    wait_time: int = 3,
    auth_token: str = "",
) -> str:
    """
    Capture only API requests (XHR/Fetch) with detailed timing — filters out static assets.

    Args:
        url: Full URL to profile
        wait_time: Seconds to wait after page load (default 3)
        auth_token: Optional Bearer token

    Returns:
        JSON with only API requests and their bottleneck analysis.
    """
    token = auth_token if auth_token else None
    metrics = await _capture_metrics(
        url, wait_time, auth_token=token,
        filter_resource_types=["fetch", "xhr"],
    )
    summary = _build_summary(metrics, url)

    return json.dumps({
        "summary": summary,
        "api_requests": metrics,
    }, indent=2, default=str)


@mcp.tool()
async def capture_user_flow(
    url: str,
    actions: list[str],
    wait_time: int = 3,
    auth_token: str = "",
) -> str:
    """
    Navigate to a page, perform user actions, and capture all network traffic throughout.

    Args:
        url: Starting URL
        actions: List of actions to perform. Supported formats:
            - "click:#button-id" or "click:.class-name" — click an element
            - "fill:#input-id|text to type" — fill an input field
            - "wait:3" — wait 3 seconds
            - "goto:http://..." — navigate to another page
        wait_time: Seconds to wait after last action (default 3)
        auth_token: Optional Bearer token

    Returns:
        JSON with all captured requests during the entire flow.
    """
    token = auth_token if auth_token else None
    metrics = await _capture_metrics(url, wait_time, actions=actions, auth_token=token)
    summary = _build_summary(metrics, url)

    return json.dumps({
        "summary": summary,
        "flow_actions": actions,
        "requests": metrics,
    }, indent=2, default=str)


@mcp.tool()
async def generate_report(
    url: str,
    wait_time: int = 3,
    auth_token: str = "",
    open_browser: bool = True,
) -> str:
    """
    Capture network metrics and generate an interactive HTML report with sortable
    tables, waterfall visualization, bottleneck classification, and filtering.

    Args:
        url: Full URL to profile
        wait_time: Seconds to wait after page load (default 3)
        auth_token: Optional Bearer token
        open_browser: Auto-open report in browser (default True)

    Returns:
        Path to the generated HTML report file.
    """
    token = auth_token if auth_token else None
    metrics = await _capture_metrics(url, wait_time, auth_token=token)
    report_path = _build_html_report(metrics, url)

    if open_browser:
        webbrowser.open(f"file:///{report_path}")

    summary = _build_summary(metrics, url)
    return json.dumps({
        "report_path": report_path,
        "summary": summary,
        "message": f"HTML report generated with {len(metrics)} requests. "
                   f"Slowest: {summary.get('slowest_url', 'N/A')} at {summary.get('max_response_time_ms', 0)}ms",
    }, indent=2, default=str)


@mcp.tool()
async def compare_runs(
    url: str,
    runs: int = 3,
    wait_time: int = 3,
    auth_token: str = "",
) -> str:
    """
    Run multiple captures and return averaged metrics to reduce variance.

    Args:
        url: Full URL to profile
        runs: Number of runs to average (default 3)
        wait_time: Seconds to wait per run (default 3)
        auth_token: Optional Bearer token

    Returns:
        JSON with per-URL averaged timing across all runs.
    """
    token = auth_token if auth_token else None
    all_runs = []
    for i in range(runs):
        metrics = await _capture_metrics(url, wait_time, auth_token=token)
        all_runs.append(metrics)

    # Aggregate by URL+method
    aggregated: dict[str, list[dict]] = {}
    for run_metrics in all_runs:
        for m in run_metrics:
            key = f"{m['method']} {m['url']}"
            aggregated.setdefault(key, []).append(m["breakdown"])

    averaged = []
    for key, breakdowns in aggregated.items():
        n = len(breakdowns)
        averaged.append({
            "endpoint": key,
            "runs_captured": n,
            "avg_dns_ms": round(sum(b["dns_ms"] for b in breakdowns) / n, 2),
            "avg_connect_ms": round(sum(b["connect_ms"] for b in breakdowns) / n, 2),
            "avg_tls_ms": round(sum(b["tls_ms"] for b in breakdowns) / n, 2),
            "avg_ttfb_ms": round(sum(b["ttfb_ms"] for b in breakdowns) / n, 2),
            "avg_download_ms": round(sum(b["download_ms"] for b in breakdowns) / n, 2),
            "avg_total_ms": round(sum(b["total_ms"] for b in breakdowns) / n, 2),
            "max_total_ms": round(max(b["total_ms"] for b in breakdowns), 2),
            "min_total_ms": round(min(b["total_ms"] for b in breakdowns), 2),
        })

    averaged.sort(key=lambda x: x["avg_total_ms"], reverse=True)

    return json.dumps({
        "url": url,
        "total_runs": runs,
        "averaged_metrics": averaged,
    }, indent=2, default=str)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run(transport="stdio")
