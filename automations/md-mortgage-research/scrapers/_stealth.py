"""
Anti-bot stealth helpers for the production async scrapers.

Maryland state portals (SDAT, Case Search, MDLandRec) use silent and explicit
bot detection (Akamai-style fingerprinting + IP reputation). Hit /test/sdat in
production with raw Playwright and the wizard silently re-renders instead of
advancing -- looks like a 502 because the page never makes progress and the
endpoint times out.

Locally verified 2026-05-08: applying playwright-stealth + human-like timing +
realistic UA/viewport/locale fixes SDAT (was returning 'wizard_stuck'; now
returns Owner Name + assessment data).

Usage:

    from scrapers._stealth import make_stealth_context, maryland_initial_wait

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(...)
        context = await make_stealth_context(browser)
        page = await context.new_page()
        await page.goto(URL)
        await maryland_initial_wait()  # 5-10s before first interaction
        ...
"""

import asyncio
import random

from playwright.async_api import Browser, BrowserContext, Page
from playwright_stealth import Stealth

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)
VIEWPORT = {"width": 1920, "height": 1080}
LOCALE = "en-US"
TIMEZONE = "America/New_York"


async def make_stealth_context(browser: Browser) -> BrowserContext:
    """Create a stealth-patched BrowserContext with realistic fingerprint."""
    context = await browser.new_context(
        user_agent=USER_AGENT,
        viewport=VIEWPORT,
        locale=LOCALE,
        timezone_id=TIMEZONE,
        ignore_https_errors=True,
    )
    await Stealth(
        navigator_user_agent_override=USER_AGENT,
        navigator_languages_override=("en-US", "en"),
    ).apply_stealth_async(context)
    return context


async def human_pause(min_s: float = 2.0, max_s: float = 5.0) -> None:
    """Random delay simulating human reaction time before first action on a page."""
    await asyncio.sleep(random.uniform(min_s, max_s))


async def field_pause(min_s: float = 1.0, max_s: float = 3.0) -> None:
    """Shorter pause between filling separate form fields."""
    await asyncio.sleep(random.uniform(min_s, max_s))


async def maryland_initial_wait() -> None:
    """MD state sites are slow + bot-detect on instant interaction. Wait 5-10s."""
    await asyncio.sleep(random.uniform(5, 10))


async def human_click(page: Page, selector: str) -> None:
    """Mouse-move with small offset, then click. Avoids the instant-teleport pattern bot-detectors flag."""
    el = page.locator(selector)
    box = await el.bounding_box()
    if not box:
        await el.click()
        return

    target_x = box["x"] + box["width"] / 2 + random.uniform(-4, 4)
    target_y = box["y"] + box["height"] / 2 + random.uniform(-4, 4)
    mid_x = box["x"] + random.uniform(0, box["width"])
    mid_y = box["y"] - random.uniform(20, 60)

    await page.mouse.move(mid_x, mid_y, steps=10)
    await asyncio.sleep(random.uniform(0.1, 0.3))
    await page.mouse.move(target_x, target_y, steps=15)
    await asyncio.sleep(random.uniform(0.05, 0.15))
    await page.mouse.click(target_x, target_y)


async def human_type(page: Page, selector: str, text: str) -> None:
    """Click into field, type characters with random per-keystroke delay."""
    el = page.locator(selector)
    box = await el.bounding_box()
    if box:
        await page.mouse.move(
            box["x"] + box["width"] / 2,
            box["y"] + box["height"] / 2,
            steps=8,
        )
        await asyncio.sleep(random.uniform(0.1, 0.2))
    await el.click()
    await asyncio.sleep(random.uniform(0.15, 0.35))
    for ch in text:
        await page.keyboard.type(ch, delay=random.uniform(50, 150))


def is_md_judiciary_blocked(content: str) -> bool:
    """Return True if the response is MD Judiciary's WAF block page."""
    lower = content.lower()
    return (
        "access is temporarily restricted" in lower
        or "we detected unusual activity" in lower
    )
