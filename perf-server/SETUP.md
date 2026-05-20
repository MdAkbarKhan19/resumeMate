# Performance Metrics MCP Server — Setup Guide

## 1. Install Dependencies

```bash
cd perf-server

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Install Chromium browser for Playwright
playwright install chromium
```

## 2. Test Standalone

```bash
# Quick test — run the server directly (it uses stdio, so it will just wait for input)
python server.py
```

To test a capture manually (create a small test script):

```python
# test_capture.py
import asyncio
from server import _capture_metrics, _build_html_report, _build_summary

async def main():
    url = "http://YOUR_IP:3000"  # <-- replace with your app URL
    print(f"Capturing metrics for {url}...")
    metrics = await _capture_metrics(url, wait_time=3)
    
    summary = _build_summary(metrics, url)
    print(f"Captured {summary['total_requests']} requests")
    print(f"Slowest: {summary['slowest_url']} at {summary['max_response_time_ms']}ms")
    
    report_path = _build_html_report(metrics, url)
    print(f"Report: {report_path}")
    
    import webbrowser
    webbrowser.open(f"file:///{report_path}")

asyncio.run(main())
```

Run it:
```bash
python test_capture.py
```

## 3. Configure with Cline (VS Code)

Open Cline settings in VS Code and add this MCP server config:

```json
{
  "mcpServers": {
    "perf-metrics": {
      "command": "python",
      "args": ["C:\\Users\\akbar\\ResumeMate\\perf-server\\server.py"],
      "transport": "stdio"
    }
  }
}
```

> **Note:** Use the full absolute path to `server.py`. If using a venv, point
> `command` to the venv Python: `"C:\\Users\\akbar\\ResumeMate\\perf-server\\venv\\Scripts\\python.exe"`

## 4. Available MCP Tools

Once registered, Cline can call these tools:

| Tool | Purpose |
|------|---------|
| `capture_network_metrics` | Full capture of all network requests with timing breakdown |
| `get_slow_requests` | Filter to only slow requests (configurable threshold) |
| `get_api_performance` | API-only view (XHR/Fetch), excludes static assets |
| `capture_user_flow` | Simulate clicks/form fills and capture network during flow |
| `generate_report` | Generate interactive HTML report and open in browser |
| `compare_runs` | Average metrics across multiple runs to reduce variance |

## 5. Example Prompts for Cline

- "Run `generate_report` on http://192.168.x.x:3000/builder and tell me what's slow"
- "Use `get_api_performance` to check API response times and suggest code optimizations"
- "Run `compare_runs` with 5 runs and identify consistently slow endpoints"
- "Use `capture_user_flow` to test the save resume flow and find bottlenecks"

## 6. HTML Report Features

- **Sortable columns** — click any header to sort
- **Color-coded rows** — red border for >1s, yellow for >500ms
- **Filter buttons** — All, APIs Only, Slow, Bottlenecks, Static Assets
- **Waterfall bars** — visual breakdown of DNS/Connect/TLS/TTFB/Download
- **Bottleneck badges** — API_BOTTLENECK, LARGE_PAYLOAD, NETWORK_LATENCY, HEALTHY
- **Diagnosis column** — human-readable explanation of the bottleneck

Reports are saved to `perf-server/reports/` with timestamps.
