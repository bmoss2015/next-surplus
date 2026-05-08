"""Shared anti-bot stealth helpers for Playwright scrapers.

Use:
    from _stealth_setup import (
        make_stealth_context, save_cookies,
        human_pause, field_pause, human_click, human_type,
        maryland_initial_wait,
    )
"""
import random
import time
from pathlib import Path

from playwright.sync_api import Browser, BrowserContext
from playwright_stealth import Stealth

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
VIEWPORT = {"width": 1920, "height": 1080}
LOCALE = "en-US"
TIMEZONE = "America/New_York"

CACHE_DIR = Path(__file__).parent.parent / ".cache"
CACHE_DIR.mkdir(exist_ok=True)


def cookie_path(site_key: str) -> Path:
    return CACHE_DIR / f"{site_key}_storage.json"


def make_stealth_context(browser: Browser, site_key: str) -> BrowserContext:
    """Create a stealth-enabled BrowserContext, loading saved cookies if present."""
    storage_state = None
    cp = cookie_path(site_key)
    if cp.exists():
        storage_state = str(cp)
        print(f"  [stealth] Loading cookies from {cp.name}")

    context = browser.new_context(
        user_agent=USER_AGENT,
        viewport=VIEWPORT,
        locale=LOCALE,
        timezone_id=TIMEZONE,
        storage_state=storage_state,
    )

    Stealth(
        navigator_user_agent_override=USER_AGENT,
        navigator_languages_override=("en-US", "en"),
    ).apply_stealth_sync(context)
    return context


def save_cookies(context: BrowserContext, site_key: str) -> None:
    cp = cookie_path(site_key)
    try:
        context.storage_state(path=str(cp))
        print(f"  [stealth] Saved cookies to {cp.name}")
    except Exception as e:
        print(f"  [stealth] Could not save cookies: {e}")


def human_pause(min_s: float = 2.0, max_s: float = 5.0) -> None:
    """Random delay simulating human reaction time before first action on a page."""
    time.sleep(random.uniform(min_s, max_s))


def field_pause(min_s: float = 1.0, max_s: float = 3.0) -> None:
    """Shorter pause between filling separate form fields."""
    time.sleep(random.uniform(min_s, max_s))


def human_click(page, selector: str) -> None:
    """Mouse-move with small random offset, then click (avoids instant-teleport pattern)."""
    el = page.locator(selector)
    box = el.bounding_box()
    if not box:
        el.click()
        return

    target_x = box["x"] + box["width"] / 2 + random.uniform(-4, 4)
    target_y = box["y"] + box["height"] / 2 + random.uniform(-4, 4)
    mid_x = box["x"] + random.uniform(0, box["width"])
    mid_y = box["y"] - random.uniform(20, 60)

    page.mouse.move(mid_x, mid_y, steps=10)
    time.sleep(random.uniform(0.1, 0.3))
    page.mouse.move(target_x, target_y, steps=15)
    time.sleep(random.uniform(0.05, 0.15))
    page.mouse.click(target_x, target_y)


def human_type(page, selector: str, text: str) -> None:
    """Click into field, then keystroke-by-keystroke type with random delay."""
    el = page.locator(selector)
    box = el.bounding_box()
    if box:
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=8)
        time.sleep(random.uniform(0.1, 0.2))
    el.click()
    time.sleep(random.uniform(0.15, 0.35))
    for ch in text:
        page.keyboard.type(ch, delay=random.uniform(50, 150))


def maryland_initial_wait() -> None:
    """Maryland state sites are slow — wait 5-10s after page load before interacting."""
    time.sleep(random.uniform(5, 10))
