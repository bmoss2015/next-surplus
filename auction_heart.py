"""
auction.com property hearter
Logs in, scrolls the virtual property list, and hearts every listing.

Requirements:
    pip install playwright python-dotenv
    playwright install chromium
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
HEADLESS        = False
ACTION_DELAY_MS = 400   # ms between heart clicks
SCROLL_DELAY_MS = 800   # ms to wait after each scroll
SCROLL_PX       = 400   # pixels to scroll per step


async def dismiss_popups(page: Page) -> None:
    for sel in [
        'button.save-preference-btn-handler',
        'button.ot-pc-refuse-all-handler',
        '[data-elm-id="header_nudge_preferences_tooltip_close_icon"]',
        '[data-elm-id="onboarding_drawer_get_started_button"]',
    ]:
        try:
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                await el.click()
                await page.wait_for_timeout(500)
        except Exception:
            pass


async def login(page: Page) -> None:
    if not EMAIL or not PASSWORD:
        print("[!] No credentials in .env — cannot log in.")
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
        print("[!] Login timed out — continuing.")


async def scroll_and_heart(page: Page) -> int:
    """
    Scroll the virtual list container and heart every property.
    auction.com renders only visible cards; we must scroll to expose all of them.
    Heart icons:  i[data-elm-id^="save_property_icon_asset_"].far  = un-hearted
                  class changes to .fas after saving
    """
    HEART_SEL = 'i[data-elm-id^="save_property_icon_asset_"]'

    total   = 0
    seen    = set()   # track elm-ids we've already clicked

    # The virtual scroll container
    scroll_js = """
        (function() {
            var el = document.querySelector('.b__list--GbooP');
            if (!el) return null;
            el.scrollTop += """ + str(SCROLL_PX) + """;
            return {
                scrollTop:    el.scrollTop,
                scrollHeight: el.scrollHeight,
                clientHeight: el.clientHeight
            };
        })()
    """

    at_bottom = False
    stall_count = 0   # consecutive scrolls with 0 new hearts

    while stall_count < 4:
        await dismiss_popups(page)

        # Click all currently visible un-hearted hearts
        hearts = await page.query_selector_all(HEART_SEL)
        new_this_pass = 0

        for heart in hearts:
            elm_id = await heart.get_attribute("data-elm-id")
            if not elm_id or elm_id in seen:
                continue
            cls = await heart.get_attribute("class") or ""
            if "fas" in cls:          # already hearted (solid icon)
                seen.add(elm_id)
                continue
            try:
                # Force-click via JS to bypass pointer-events on the <i> tag
                await page.evaluate("(el) => el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}))", heart)
                seen.add(elm_id)
                new_this_pass += 1
                total += 1
                await page.wait_for_timeout(ACTION_DELAY_MS)
            except Exception as exc:
                print(f"    [!] {exc}")

        if new_this_pass:
            print(f"    +{new_this_pass} hearted  (running total: {total})")
            stall_count = 0
        else:
            stall_count += 1

        if at_bottom:
            break

        # Scroll the virtual list
        state = await page.evaluate(scroll_js)
        if state is None:
            # Fallback: scroll the window
            await page.evaluate(f"window.scrollBy(0, {SCROLL_PX})")
            at_bottom = await page.evaluate(
                "window.scrollY + window.innerHeight >= document.body.scrollHeight - 20"
            )
        else:
            at_bottom = (state["scrollTop"] + state["clientHeight"]) >= (state["scrollHeight"] - 20)

        await page.wait_for_timeout(SCROLL_DELAY_MS)

    return total


async def run(search_url: str) -> None:
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

        print(f"\n[*] Loading: {search_url}")
        await page.goto(search_url, wait_until="networkidle", timeout=30_000)
        await page.wait_for_timeout(2_500)
        await dismiss_popups(page)

        print("[*] Scrolling and hearting all properties …\n")
        total = await scroll_and_heart(page)

        await browser.close()

    print(f"\n[+] Done! Total properties hearted: {total}")


if __name__ == "__main__":
    print("=" * 50)
    print("  auction.com Bulk Hearter")
    print("=" * 50)

    if not EMAIL:
        print("\n[!] No credentials found — check your .env file.\n")
    else:
        print(f"\n[+] Credentials loaded: {EMAIL}")

    url = input("\nPaste the auction.com search URL and press Enter:\n> ").strip()
    if not url:
        url = f"{BASE_URL}/real-estate-foreclosures/"
        print(f"Using default: {url}")
    print()
    asyncio.run(run(url))
