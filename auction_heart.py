"""
auction.com property hearter
Logs in, paginates through search results, and hearts every listed property.

Requirements:
    pip install playwright python-dotenv
    playwright install chromium
"""

import asyncio
import os
import time
from dotenv import load_dotenv
from playwright.async_api import async_playwright, Page, TimeoutError as PWTimeout

load_dotenv()

EMAIL    = os.getenv("AUCTION_EMAIL", "")
PASSWORD = os.getenv("AUCTION_PASSWORD", "")
BASE_URL = "https://www.auction.com"
HEADLESS        = False   # set to True to run without a visible browser window
PAGE_DELAY_S    = 2
ACTION_DELAY_MS = 400


async def login(page: Page) -> None:
    if not EMAIL or not PASSWORD:
        print("[!] No credentials found in .env — running without login.")
        return

    print("[*] Logging in …")
    await page.goto(f"{BASE_URL}/login/", wait_until="networkidle")
    await page.fill('input[type="email"], input[name="email"], #email', EMAIL)
    await page.fill('input[type="password"], input[name="password"], #password', PASSWORD)
    await page.click('button[type="submit"], input[type="submit"], .login-btn')

    try:
        await page.wait_for_url(lambda u: "/login" not in u, timeout=15_000)
        print("[+] Logged in successfully.")
    except PWTimeout:
        print("[!] Login redirect timed out — continuing anyway.")


async def heart_all_on_page(page: Page) -> int:
    HEART_SELECTORS = [
        'button[aria-label*="favorite" i]:not([aria-pressed="true"])',
        'button[aria-label*="save" i]:not([aria-pressed="true"])',
        '[data-testid*="favorite"]:not(.active):not(.hearted)',
        '.heart-icon:not(.active)',
        '.favorite-btn:not(.active)',
        'button.save-property:not(.saved)',
    ]

    clicked = 0
    for selector in HEART_SELECTORS:
        buttons = await page.query_selector_all(selector)
        for btn in buttons:
            try:
                if await btn.is_visible():
                    await btn.scroll_into_view_if_needed()
                    await btn.click()
                    clicked += 1
                    await page.wait_for_timeout(ACTION_DELAY_MS)
            except Exception as exc:
                print(f"    [!] Could not click heart button: {exc}")
        if clicked:
            break

    return clicked


async def get_next_page_url(page: Page) -> str | None:
    NEXT_SELECTORS = [
        'a[aria-label="Next page"]',
        'a[rel="next"]',
        '.pagination-next:not(.disabled) a',
        'button[aria-label="Next page"]:not(:disabled)',
        '[data-testid="pagination-next"]:not(:disabled)',
    ]
    for sel in NEXT_SELECTORS:
        el = await page.query_selector(sel)
        if el:
            href = await el.get_attribute("href")
            if href:
                return href if href.startswith("http") else BASE_URL + href
            return "__click__"
    return None


async def run(search_url: str) -> None:
    total_hearted = 0
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=HEADLESS)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()

        await login(page)

        current_url = search_url
        page_num = 1

        while current_url:
            print(f"\n[*] Page {page_num}: {current_url}")
            await page.goto(current_url, wait_until="networkidle", timeout=30_000)
            await page.wait_for_timeout(1_500)

            hearted = await heart_all_on_page(page)
            total_hearted += hearted
            print(f"    Hearted {hearted} properties  |  Running total: {total_hearted}")

            next_url = await get_next_page_url(page)
            if next_url == "__click__":
                for sel in [
                    'button[aria-label="Next page"]',
                    '[data-testid="pagination-next"]',
                ]:
                    el = await page.query_selector(sel)
                    if el:
                        await el.click()
                        await page.wait_for_load_state("networkidle")
                        current_url = page.url
                        break
                else:
                    break
            else:
                current_url = next_url

            page_num += 1
            time.sleep(PAGE_DELAY_S)

        await browser.close()

    print(f"\n[+] Done! Total properties hearted: {total_hearted}")


if __name__ == "__main__":
    print("=" * 50)
    print("  auction.com Bulk Hearter")
    print("=" * 50)
    print()
    url = input("Paste the auction.com search URL and press Enter:\n> ").strip()
    if not url:
        url = f"{BASE_URL}/real-estate-foreclosures/"
        print(f"No URL entered — using default: {url}")
    print()
    asyncio.run(run(url))
