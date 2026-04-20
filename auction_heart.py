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
ACTION_DELAY_MS = 300
SCROLL_DELAY_MS = 1200
SCROLL_PX       = 500

# JS: find the virtual-list scroll container and return it
FIND_CONTAINER_JS = """
() => {
    var cards = document.querySelectorAll('[data-elm-id^="asset_"][data-elm-id$="_root"]');
    if (!cards.length) return null;
    var el = cards[0].parentElement;
    while (el && el !== document.body) {
        var st = window.getComputedStyle(el);
        if ((st.overflow === 'auto' || st.overflowY === 'auto') &&
             el.scrollHeight > el.clientHeight + 10) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}
"""


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
                await page.wait_for_timeout(400)
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


async def heart_visible(page: Page, seen: set) -> int:
    """Click every un-hearted heart currently rendered in the DOM."""
    hearts = await page.query_selector_all('i[data-elm-id^="save_property_icon_asset_"]')
    clicked = 0
    for heart in hearts:
        elm_id = await heart.get_attribute("data-elm-id")
        if not elm_id or elm_id in seen:
            continue
        try:
            cls = await heart.get_attribute("class") or ""
            if "fas" in cls:        # already saved — solid heart
                seen.add(elm_id)
                continue
            await heart.click(force=True)
            seen.add(elm_id)
            clicked += 1
            await page.wait_for_timeout(ACTION_DELAY_MS)
        except Exception:
            pass    # element removed from DOM during virtual scroll — skip
    return clicked


async def scroll_and_heart(page: Page, context) -> int:
    # Close any new tab that opens when clicking hearts
    def _close_tab(p):
        asyncio.ensure_future(p.close())
    context.on("page", _close_tab)

    total = 0
    seen  = set()

    # --- Get a stable JS handle to the scroll container ---
    # We hold a reference to the DOM element directly so mouse position
    # and popups can never interfere with our scrolling.
    container = await page.evaluate_handle(FIND_CONTAINER_JS)
    is_null   = await page.evaluate("(el) => el === null", container)

    if is_null:
        print("[!] Could not find scroll container — cannot proceed.")
        return 0

    info = await page.evaluate(
        "(el) => ({st: el.scrollTop, sh: el.scrollHeight, ch: el.clientHeight})",
        container
    )
    print(f"    [i] List: {info['sh']}px tall, {info['ch']}px visible window\n")

    no_progress = 0
    last_top    = -1

    while no_progress < 5:
        # Heart everything currently visible
        n = await heart_visible(page, seen)
        if n:
            total += n
            print(f"    +{n} hearted  (total: {total})")

        # Read current scroll state from the stored element reference
        info = await page.evaluate(
            "(el) => ({st: el.scrollTop, sh: el.scrollHeight, ch: el.clientHeight})",
            container
        )

        if info['st'] + info['ch'] >= info['sh'] - 20:
            print(f"    [i] Reached bottom ({info['st']:.0f}px / {info['sh']}px)")
            break

        if info['st'] == last_top:
            no_progress += 1
            # Try dismissing a popup that might be blocking
            if no_progress == 1:
                await dismiss_popups(page)
            print(f"    [i] No scroll movement ({no_progress}/5) at {info['st']:.0f}px")
        else:
            no_progress = 0

        last_top = info['st']

        # Scroll the container directly — no mouse involved
        await page.evaluate("(el) => { el.scrollTop += " + str(SCROLL_PX) + "; }", container)
        await page.wait_for_timeout(SCROLL_DELAY_MS)

    # Final heart pass after stopping
    n = await heart_visible(page, seen)
    if n:
        total += n
        print(f"    +{n} hearted  (total: {total})")

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
        total = await scroll_and_heart(page, context)
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
