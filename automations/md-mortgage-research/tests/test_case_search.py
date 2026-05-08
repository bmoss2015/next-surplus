"""
test_case_search.py - Maryland Case Search (court records) scraper test.
Test subject: Sarah Moore, Prince George's County

Now uses playwright-stealth + human-like timing + persisted cookies.
MD Judiciary explicitly bot-blocked us before stealth: "Access is temporarily
restricted -- We detected unusual activity from your device or network."
"""

import sys
import traceback
from pathlib import Path

from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

sys.path.insert(0, str(Path(__file__).parent))
from _stealth_setup import (
    make_stealth_context, save_cookies,
    human_pause, field_pause, human_click, human_type,
    maryland_initial_wait,
)

DEBUG_DIR = Path(__file__).parent.parent / "debug"
DEBUG_DIR.mkdir(exist_ok=True)

TEST_FIRST_NAME = "Sarah"
TEST_LAST_NAME = "Moore"
TEST_COUNTY = "Prince George's County"


def save_screenshot(page, name: str):
    path = DEBUG_DIR / f"{name}.png"
    try:
        page.screenshot(path=str(path), full_page=True)
        print(f"  [screenshot] Saved: {path}")
    except Exception:
        print(f"  [screenshot] Could not save {name}")


def is_bot_blocked(page) -> bool:
    """Detect MD Judiciary's 'Access is temporarily restricted' bot-block page."""
    try:
        body = page.inner_text("body").lower()
    except Exception:
        return False
    return (
        "access is temporarily restricted" in body
        or "we detected unusual activity" in body
    )


def test_case_search():
    print("\n=== Maryland Case Search Test (with stealth) ===")
    print(f"Name   : {TEST_LAST_NAME}, {TEST_FIRST_NAME}")
    print(f"County : {TEST_COUNTY}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = make_stealth_context(browser, "case_search")
        page = context.new_page()

        try:
            print("[1] Navigating to Maryland Case Search...")
            page.goto(
                "https://casesearch.courts.state.md.us/casesearch/inquiry-index.jsp",
                wait_until="networkidle",
                timeout=30000,
            )
            print("    Waiting 5-10s after load...")
            maryland_initial_wait()
            save_screenshot(page, "case_01_home")

            if is_bot_blocked(page):
                print("    [FAIL] Bot block detected on homepage -- stealth not enough yet")
                save_cookies(context, "case_search")
                return False
            print("    Homepage loaded clean (no bot block)")

            # Accept disclaimer if present
            human_pause()
            try:
                disclaimer_btn = page.locator("input[value='I Agree']").first
                if disclaimer_btn.is_visible(timeout=3000):
                    print("[2] Accepting disclaimer...")
                    human_click(page, "input[value='I Agree']")
                    page.wait_for_load_state("networkidle", timeout=15000)
                    maryland_initial_wait()
                    save_screenshot(page, "case_02_disclaimer_accepted")
                    print("    Disclaimer accepted")
                else:
                    print("[2] No disclaimer visible, continuing...")
            except Exception:
                print("[2] No disclaimer found, continuing...")

            print("[3] Navigating to Name Search...")
            page.goto(
                "https://casesearch.courts.state.md.us/casesearch/inquirySearch.jis",
                wait_until="networkidle",
                timeout=20000,
            )
            maryland_initial_wait()
            save_screenshot(page, "case_03_search_form")

            if is_bot_blocked(page):
                print("    [FAIL] Bot block detected on search-form page")
                save_cookies(context, "case_search")
                return False

            print(f"[4] Filling in name: {TEST_LAST_NAME}, {TEST_FIRST_NAME}...")
            # Try standard selectors; dump form if they fail
            try:
                human_type(page, "input#lastName", TEST_LAST_NAME)
                field_pause()
                human_type(page, "input#firstName", TEST_FIRST_NAME)
            except Exception as e:
                print(f"    [FAIL] Could not fill name fields: {e}")
                # Dump available inputs for diagnosis
                inputs = page.query_selector_all("input")
                print(f"    Available inputs ({len(inputs)}):")
                for inp in inputs[:30]:
                    t = inp.get_attribute("type") or "?"
                    n = inp.get_attribute("name") or ""
                    i = inp.get_attribute("id") or ""
                    if t != "hidden":
                        print(f"      type={t} name='{n}' id='{i}'")
                return False

            field_pause()
            try:
                page.select_option("select#countyName", label=TEST_COUNTY)
                print(f"    County set to: {TEST_COUNTY}")
            except Exception:
                print(f"    WARNING: Could not select county '{TEST_COUNTY}'")

            field_pause()
            try:
                page.select_option("select#site", value="CIVIL")
                print("    Case type set to: Civil")
            except Exception:
                print("    WARNING: Could not set case type")

            save_screenshot(page, "case_04_form_filled")

            print("[5] Submitting search (with mouse move)...")
            field_pause()
            human_click(page, "input[type='submit']")
            page.wait_for_load_state("networkidle", timeout=25000)
            page.wait_for_timeout(2000)
            save_screenshot(page, "case_05_results")

            if is_bot_blocked(page):
                print("    [FAIL] Bot block triggered on submit")
                save_cookies(context, "case_search")
                return False

            body_text = page.inner_text("body")
            print("[6] Checking results...")

            if "no records" in body_text.lower() or "no cases" in body_text.lower():
                print("    No cases found for this name/county combination")
            else:
                rows = page.locator("table tr").count()
                print(f"    Found approximately {max(0, rows - 1)} result rows")

                print("\n--- Results Snippet (first 600 chars) ---")
                print(body_text[:600])
                print("---")

                # Try clicking first case
                try:
                    first_case = page.locator("table a").first
                    case_text = first_case.inner_text()
                    print(f"\n    First case: {case_text}")
                    human_pause(min_s=1, max_s=2)
                    first_case.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    save_screenshot(page, "case_06_case_detail")
                    detail = page.inner_text("body")
                    print("\n--- Case Detail Snippet (first 800 chars) ---")
                    print(detail[:800])
                    print("---")
                except Exception as e:
                    print(f"    Could not open first case: {e}")

            save_cookies(context, "case_search")
            print("\n[PASS] Case Search test completed successfully")
            return True

        except PlaywrightTimeoutError as e:
            save_screenshot(page, "case_error_timeout")
            print(f"\n[FAIL] Timeout: {e}")
            traceback.print_exc()
            return False
        except Exception as e:
            save_screenshot(page, "case_error_general")
            print(f"\n[FAIL] Error: {e}")
            traceback.print_exc()
            return False
        finally:
            browser.close()


if __name__ == "__main__":
    success = test_case_search()
    sys.exit(0 if success else 1)
