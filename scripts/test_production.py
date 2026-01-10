#!/usr/bin/env python3
"""
Production Site Testing Script
Tests security headers, image optimization, and functionality
"""
import sys
import json
import requests
from datetime import datetime

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


def check_security_headers(url: str) -> dict:
    """Check security headers of the production site."""
    try:
        response = requests.get(url, timeout=10)
        headers = dict(response.headers)

        security_checks = {
            "content_security_policy": "Content-Security-Policy" in headers,
            "x_frame_options": "X-Frame-Options" in headers,
            "x_content_type_options": "X-Content-Type-Options" in headers,
            "strict_transport_security": "Strict-Transport-Security" in headers,
            "x_xss_protection": "X-XSS-Protection" in headers,
            "referrer_policy": "Referrer-Policy" in headers,
            "permissions_policy": "Permissions-Policy" in headers,
        }

        actual_headers = {
            k: v for k, v in headers.items()
            if any(sec in k for sec in ["Content", "X-", "Strict", "Referrer", "Permissions"])
        }

        return {
            "status": "success",
            "url": url,
            "checks": security_checks,
            "actual_headers": actual_headers,
            "score": sum(security_checks.values()) / len(security_checks) * 100
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def check_image_optimization(url: str) -> dict:
    """Check image formats and sizes."""
    if not PLAYWRIGHT_AVAILABLE:
        return {"error": "Playwright not installed"}

    result = {"url": url, "images": []}

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Track network requests
            images = []
            page.on("response", lambda response: images.append({
                "url": response.url,
                "status": response.status,
                "headers": dict(response.headers)
            }) if response.url.endswith((".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif")) else None)

            page.goto(url, wait_until="networkidle", timeout=30000)

            # Analyze images
            webp_count = sum(1 for img in images if ".webp" in img["url"])
            avif_count = sum(1 for img in images if ".avif" in img["url"])
            png_count = sum(1 for img in images if ".png" in img["url"])
            jpg_count = sum(1 for img in images if ".jpg" in img["url"] or ".jpeg" in img["url"])

            result["summary"] = {
                "total_images": len(images),
                "webp": webp_count,
                "avif": avif_count,
                "png": png_count,
                "jpg": jpg_count,
                "modern_format_percent": (webp_count + avif_count) / len(images) * 100 if images else 0
            }
            result["sample_images"] = images[:5]

            browser.close()
            result["status"] = "success"

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result


def check_lazy_loading(url: str) -> dict:
    """Check lazy loading implementation."""
    if not PLAYWRIGHT_AVAILABLE:
        return {"error": "Playwright not installed"}

    result = {"url": url}

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.goto(url, wait_until="networkidle", timeout=30000)

            # Check for loading attributes
            lazy_images = page.locator("img[loading='lazy']").count()
            eager_images = page.locator("img[loading='eager']").count()
            no_attr = page.locator("img:not([loading])").count()
            total_images = page.locator("img").count()

            result["summary"] = {
                "total_images": total_images,
                "lazy_loaded": lazy_images,
                "eager_loaded": eager_images,
                "no_loading_attr": no_attr
            }
            result["lazy_loading_percent"] = (lazy_images / total_images * 100) if total_images > 0 else 0

            browser.close()
            result["status"] = "success"

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result


def check_console_errors(url: str) -> dict:
    """Check for JavaScript console errors."""
    if not PLAYWRIGHT_AVAILABLE:
        return {"error": "Playwright not installed"}

    result = {"url": url, "errors": [], "warnings": []}

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Capture console messages
            page.on("console", lambda msg: (
                result["errors"].append({"text": msg.text, "type": msg.type}) if msg.type == "error" else
                result["warnings"].append({"text": msg.text, "type": msg.type}) if msg.type == "warning" else None
            ))

            page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait a bit for delayed errors
            page.wait_for_timeout(2000)

            browser.close()
            result["status"] = "success"
            result["has_errors"] = len(result["errors"]) > 0
            result["error_count"] = len(result["errors"])
            result["warning_count"] = len(result["warnings"])

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    return result


def run_all_tests(url: str) -> dict:
    """Run all production tests."""
    report = {
        "url": url,
        "timestamp": datetime.now().isoformat(),
        "tests": {}
    }

    print(f"\n=== Testing Production Site: {url} ===\n")

    # Test 1: Security Headers
    print("1. Checking Security Headers...")
    report["tests"]["security_headers"] = check_security_headers(url)
    print(f"   Score: {report['tests']['security_headers'].get('score', 'N/A')}%")

    # Test 2: Image Optimization
    print("2. Checking Image Optimization...")
    report["tests"]["image_optimization"] = check_image_optimization(url)
    summary = report["tests"]["image_optimization"].get("summary", {})
    print(f"   Modern formats: {summary.get('modern_format_percent', 0):.1f}%")

    # Test 3: Lazy Loading
    print("3. Checking Lazy Loading...")
    report["tests"]["lazy_loading"] = check_lazy_loading(url)
    lazy_summary = report["tests"]["lazy_loading"].get("summary", {})
    print(f"   Lazy loaded: {lazy_summary.get('lazy_loaded', 0)} / {lazy_summary.get('total_images', 0)}")

    # Test 4: Console Errors
    print("4. Checking Console Errors...")
    report["tests"]["console_errors"] = check_console_errors(url)
    console_summary = report["tests"]["console_errors"]
    print(f"   Errors: {console_summary.get('error_count', 0)}, Warnings: {console_summary.get('warning_count', 0)}")

    # Overall assessment
    report["overall"] = {
        "status": "passed" if not report["tests"]["console_errors"].get("has_errors", False) else "needs_review",
        "recommendations": []
    }

    if report["tests"]["security_headers"].get("score", 0) < 50:
        report["overall"]["recommendations"].append("Add missing security headers")

    if report["tests"]["image_optimization"].get("summary", {}).get("modern_format_percent", 0) < 50:
        report["overall"]["recommendations"].append("Consider using WebP/AVIF for more images")

    if report["tests"]["console_errors"].get("has_errors", False):
        report["overall"]["recommendations"].append("Fix JavaScript console errors")

    return report


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "https://haldeki.com"

    report = run_all_tests(url)

    # Save report
    report_path = "F:\\donusum\\haldeki-love\\haldeki-market\\docs\\PRODUCTION-TEST-REPORT.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n=== Test Complete ===")
    print(f"Report saved to: {report_path}")
    print(f"Overall Status: {report['overall']['status']}")

    if report["overall"]["recommendations"]:
        print("\nRecommendations:")
        for rec in report["overall"]["recommendations"]:
            print(f"  - {rec}")
