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


# Find the virtual scroll container by walking up from a property card
FIND_SCROLL_JS = """
() => {
    // Walk up from any property card root to find the scrollable container
    var card = document.querySelector('[data-elm-id^="asset_"][data-elm-id$="_root"]');
    if (!card) return null;
    var el = card.parentElement;
    while (el && el !== document.body) {
        var st = window.getComputedStyle(el);
        if ((st.overflow === 'auto' || st.overflowY === 'auto') && el.scrollHeight > el.clientHeight) {
            return true;   // found — we'll scroll it separately
        }
        el = el.parentElement;
    }
    return null;
}
"""

SCROLL_JS = f"""
() => {{
    var card = document.querySelector('[data-elm-id^="asset_"][data-elm-id$="_root"]');
    if (!card) return null;
    var el = card.parentElement;
    while (el && el !== document.body) {{
        var st = window.getComputedStyle(el);
        if ((st.overflow === 'auto' || st.overflowY === 'auto') && el.scrollHeight > el.clientHeight) {{
            var before = el.scrollTop;
            el.scrollTop += {SCROLL_PX};
            return {{
                before: before,
                after: el.scrollTop,
                scrollHeight: el.scrollHeight,
                clientHeight: el.clientHeight
            }};
        }}
        el = el.parentElement;
    }}
    return null;
}}
"""


async def heart_visible(page: Page, seen: set) -> int:
    """Click all un-hearted hearts currently in the DOM. Returns count clicked."""
    hearts = await page.query_selector_all('i[data-elm-id^="save_property_icon_asset_"]')
    clicked = 0
    for heart in hearts:
        elm_id = await heart.get_attribute("data-elm-id")
        if not elm_id or elm_id in seen:
            continue
        cls = await heart.get_attribute("class") or ""
        if "fas" in cls:        # solid heart = already saved
            seen.add(elm_id)
            continue
        try:
            await heart.click(force=True)   # force bypasses aria-hidden check
            seen.add(elm_id)
            clicked += 1
            await page.wait_for_timeout(ACTION_DELAY_MS)
        except Exception as exc:
            print(f"    [!] click error: {exc}")
    return clicked


async def scroll_and_heart(page: Page, context) -> int:
    # Instantly close any tab the click accidentally opens
    def _close_tab(p):
        asyncio.ensure_future(p.close())
    context.on("page", _close_tab)

    total = 0
    seen  = set()

    while True:
        await dismiss_popups(page)

        n = await heart_visible(page, seen)
        if n:
            total += n
            print(f"    +{n} hearted  (total: {total})")

        # Scroll the virtual list
        state = await page.evaluate(SCROLL_JS)

        if state is None:
            # No virtual scroll container found — nothing more to do
            print("    [!] Could not find scroll container — stopping.")
            break

        await page.wait_for_timeout(SCROLL_DELAY_MS)

        # If scroll position didn't move, we're at the bottom
        if state["after"] == state["before"]:
            # One final pass to catch the last visible cards
            n = await heart_visible(page, seen)
            if n:
                total += n
                print(f"    +{n} hearted  (total: {total})")
            break

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
