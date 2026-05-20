"""Quick test script — run this to verify the MCP server captures metrics correctly."""
import asyncio
import webbrowser
from server import _capture_metrics, _build_html_report, _build_summary


async def main():
    # Replace with your actual app URL
    url = "http://YOUR_IP:3000"

    print(f"Capturing metrics for {url} ...")
    metrics = await _capture_metrics(url, wait_time=3)

    summary = _build_summary(metrics, url)
    print(f"Captured {summary['total_requests']} requests")
    print(f"API requests: {summary['api_requests']}")
    print(f"Avg TTFB: {summary['avg_ttfb_ms']}ms")
    print(f"Slowest: {summary['slowest_url']} at {summary['max_response_time_ms']}ms")
    print(f"Transfer: {summary['total_transfer_kb']} KB")
    print(f"Bottlenecks: {summary['bottleneck_counts']}")

    report_path = _build_html_report(metrics, url)
    print(f"\nReport saved: {report_path}")
    webbrowser.open(f"file:///{report_path}")


if __name__ == "__main__":
    asyncio.run(main())
