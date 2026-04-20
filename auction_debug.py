"""
auction.com DEBUG tool — saves screenshot + button dump to identify selectors.

Run:
    python auction_debug.py
"""

import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout


def _load_env():
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if line and "=" in line and not line.startswith("#"):
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

_load_env()

EMAIL    = os.getenv("AUCTION_EMAIL", "")
PASSWORD = os.getenv("AUCTION_PASSWORD", "")
BASE_URL = "https://www.auction.com"


async def dismiss_popups(page: Page) -> None:
    for sel in [
        'button.save-preference-btn-handler',
        'button.ot-pc-refuse-all-handler',
        '[data-elm-id="onboarding_drawer_get_started_button"]',
        '[aria-label="Close"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                await page.wait_for_timeout(600)
        except Exception:
            pass


async def login(page: Page) -> None:
    if not EMAIL or not PASSWORD:
        print("[!] No credentials found in .env — running without login.")
        return
    print(f"[*] Logging in as {EMAIL} …")
    await page.goto(f"{BASE_URL}/login/", wait_until="networkidle")
    await dismiss_popups(page)
    await page.fill('input[type="email"], input[name="email"], #email', EMAIL)
    await page.fill('input[type="password"], input[name="password"], #password', PASSWORD)
    await page.click('button[type="submit"], input[type="submit"], .login-btn')
    try:
        await page.wait_for_url(lambda u: "/login" not in u, timeout=15_000)
        print("[+] Logged in.")
    except PWTimeout:
        print("[!] Login timed out.")


async def debug(search_url: str) -> None:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()

        await login(page)

        print(f"\n[*] Loading: {search_url}")
        await page.goto(search_url, wait_until="networkidle", timeout=30_000)
        await page.wait_for_timeout(3_000)
        await dismiss_popups(page)
        await page.wait_for_timeout(1_000)

        await page.screenshot(path="debug_screenshot.png", full_page=False)
        print("[+] Screenshot saved: debug_screenshot.png")

        elements = await page.evaluate("""() => {
            const results = [];
            document.querySelectorAll('button, [data-elm-id]').forEach(el => {
                const elmId = el.getAttribute('data-elm-id') || '';
                const label = el.getAttribute('aria-label') || '';
                const title = el.getAttribute('title') || '';
                const text  = (el.innerText || '').trim().substring(0, 80);
                const cls   = el.className?.toString().substring(0, 120) || '';
                const tid   = el.getAttribute('data-testid') || '';
                results.push({
                    tag: el.tagName,
                    text, label, title, elmId, cls, tid,
                    html: el.outerHTML.substring(0, 350),
                });
            });
            return results;
        }""")

        out_path = Path("debug_elements.txt")
        with out_path.open("w", encoding="utf-8") as f:
            f.write(f"URL: {page.url}\n")
            f.write(f"Logged in as: {EMAIL or '(not logged in)'}\n")
            f.write(f"Total elements: {len(elements)}\n")
            f.write("=" * 80 + "\n\n")
            for i, el in enumerate(elements):
                f.write(f"[{i}] tag={el['tag']}\n")
                f.write(f"     text        : {el['text']}\n")
                f.write(f"     aria-label  : {el['label']}\n")
                f.write(f"     title       : {el['title']}\n")
                f.write(f"     data-elm-id : {el['elmId']}\n")
                f.write(f"     class       : {el['cls']}\n")
                f.write(f"     data-testid : {el['tid']}\n")
                f.write(f"     html        : {el['html']}\n\n")

        print(f"[+] debug_elements.txt saved  ({len(elements)} elements)")
        print("\nPaste the contents of debug_elements.txt here so the selector can be fixed.")
        await browser.close()


if __name__ == "__main__":
    print("=" * 50)
    print("  auction.com Selector Debugger")
    print("=" * 50)

    if not EMAIL:
        print("\n[!] No credentials in .env — will run without login\n")
    else:
        print(f"\n[+] Credentials loaded: {EMAIL}\n")

    url = input("Paste the auction.com search URL:\n> ").strip()
    if not url:
        url = f"{BASE_URL}/real-estate-foreclosures/"
    asyncio.run(debug(url))
