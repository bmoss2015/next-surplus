"""
auction.com DEBUG tool
Opens the search page, saves a screenshot, and dumps all button/link info
so we can identify the correct heart/save button selector.

Run:
    python auction_debug.py
"""

import asyncio
import os
from dotenv import load_dotenv
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout

load_dotenv()

EMAIL    = os.getenv("AUCTION_EMAIL", "")
PASSWORD = os.getenv("AUCTION_PASSWORD", "")
BASE_URL = "https://www.auction.com"


async def login(page: Page) -> None:
    if not EMAIL or not PASSWORD:
        print("[!] No credentials — skipping login.")
        return
    print("[*] Logging in …")
    await page.goto(f"{BASE_URL}/login/", wait_until="networkidle")
    await page.fill('input[type="email"], input[name="email"], #email', EMAIL)
    await page.fill('input[type="password"], input[name="password"], #password', PASSWORD)
    await page.click('button[type="submit"], input[type="submit"], .login-btn')
    try:
        await page.wait_for_url(lambda u: "/login" not in u, timeout=15_000)
        print("[+] Logged in.")
    except PWTimeout:
        print("[!] Login timed out — continuing.")


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
        await page.wait_for_timeout(3_000)  # extra wait for lazy content

        # Save screenshot
        await page.screenshot(path="debug_screenshot.png", full_page=False)
        print("[+] Screenshot saved: debug_screenshot.png")

        # Dump every button and svg-containing element to a file
        elements = await page.evaluate("""() => {
            const results = [];

            // All buttons
            document.querySelectorAll('button').forEach(el => {
                results.push({
                    tag: 'button',
                    text: el.innerText.trim().substring(0, 80),
                    ariaLabel: el.getAttribute('aria-label') || '',
                    ariaPressed: el.getAttribute('aria-pressed') || '',
                    className: el.className.toString().substring(0, 120),
                    dataTestId: el.getAttribute('data-testid') || '',
                    outerHTML: el.outerHTML.substring(0, 300),
                });
            });

            // All elements with data-testid containing save/heart/favorite/watch
            document.querySelectorAll('[data-testid]').forEach(el => {
                const tid = el.getAttribute('data-testid') || '';
                if (/save|heart|fav|watch/i.test(tid)) {
                    results.push({
                        tag: el.tagName,
                        text: el.innerText?.trim().substring(0, 80) || '',
                        ariaLabel: el.getAttribute('aria-label') || '',
                        ariaPressed: el.getAttribute('aria-pressed') || '',
                        className: el.className.toString().substring(0, 120),
                        dataTestId: tid,
                        outerHTML: el.outerHTML.substring(0, 300),
                    });
                }
            });

            return results;
        }""")

        with open("debug_elements.txt", "w", encoding="utf-8") as f:
            f.write(f"URL: {page.url}\n")
            f.write(f"Total elements found: {len(elements)}\n")
            f.write("=" * 80 + "\n\n")
            for i, el in enumerate(elements):
                f.write(f"[{i}] tag={el['tag']}\n")
                f.write(f"     text       : {el['text']}\n")
                f.write(f"     aria-label : {el['ariaLabel']}\n")
                f.write(f"     aria-pressed: {el['ariaPressed']}\n")
                f.write(f"     class      : {el['className']}\n")
                f.write(f"     data-testid: {el['dataTestId']}\n")
                f.write(f"     html       : {el['outerHTML']}\n\n")

        print(f"[+] Element dump saved: debug_elements.txt  ({len(elements)} elements)")
        print("\nOpen debug_screenshot.png to see the page.")
        print("Open debug_elements.txt and look for the heart/save button.")
        print("Share debug_elements.txt and I will fix the selector.\n")

        await browser.close()


if __name__ == "__main__":
    print("=" * 50)
    print("  auction.com Selector Debugger")
    print("=" * 50)
    url = input("\nPaste the auction.com search URL:\n> ").strip()
    if not url:
        url = f"{BASE_URL}/real-estate-foreclosures/"
    asyncio.run(debug(url))
