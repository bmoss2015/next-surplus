"""Dump mdlandrec.net login page form inputs."""
from playwright.sync_api import sync_playwright

URLS = [
    "https://mdlandrec.net/main/dsp_login.cfm",
    "https://mdlandrec.net/",
    "https://mdlandrec.net/main/",
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1200})
    for u in URLS:
        try:
            page.goto(u, wait_until="networkidle", timeout=30000)
            print(f"\n=== {u} ===")
            print(f"  final URL: {page.url}")
            print(f"  title: {page.title()}")
            # Dump inputs
            inputs = page.query_selector_all("input")
            print(f"  inputs ({len(inputs)}):")
            for inp in inputs:
                t = inp.get_attribute("type") or "?"
                n = inp.get_attribute("name") or ""
                i = inp.get_attribute("id") or ""
                ph = inp.get_attribute("placeholder") or ""
                vis = inp.is_visible()
                if t != "hidden":
                    print(f"    type={t:8s} visible={vis} name='{n}' id='{i}' placeholder='{ph}'")
            # Dump links to login pages
            for a in page.query_selector_all("a"):
                href = a.get_attribute("href") or ""
                txt = a.inner_text().strip()[:60]
                if "login" in href.lower() or "log in" in txt.lower() or "sign in" in txt.lower():
                    print(f"    LOGIN LINK: '{txt}' -> {href[:120]}")
        except Exception as e:
            print(f"  ERROR: {e}")
    browser.close()
