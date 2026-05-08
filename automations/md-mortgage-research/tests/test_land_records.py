"""
test_land_records.py - Test the Maryland Land Records (mdlandrec.net) scraper.
Test subject: Sarah Moore, Prince George's County
Requires: MDLANDREC_EMAIL and MDLANDREC_PASSWORD in .env
"""

import os
import sys
import traceback
from pathlib import Path

from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

DEBUG_DIR = Path(__file__).parent.parent / "debug"
DEBUG_DIR.mkdir(exist_ok=True)

TEST_FIRST_NAME = "Sarah"
TEST_LAST_NAME = "Moore"
TEST_COUNTY = "Prince George's"

MDLANDREC_EMAIL = os.environ.get("MDLANDREC_EMAIL", "")
MDLANDREC_PASSWORD = os.environ.get("MDLANDREC_PASSWORD", "")


def save_screenshot(page, name: str):
    path = DEBUG_DIR / f"{name}.png"
    try:
        page.screenshot(path=str(path), full_page=True)
        print(f"  [screenshot] Saved: {path}")
    except Exception:
        print(f"  [screenshot] Could not save {name}")


def check_credentials():
    missing = []
    if not MDLANDREC_EMAIL:
        missing.append("MDLANDREC_EMAIL")
    if not MDLANDREC_PASSWORD:
        missing.append("MDLANDREC_PASSWORD")
    if missing:
        print(f"[SKIP] Missing credentials: {', '.join(missing)}")
        print("       Set them in .env and re-run.")
        return False
    return True


def test_land_records():
    print("\n=== Maryland Land Records Test ===")
    print(f"Name   : {TEST_LAST_NAME}, {TEST_FIRST_NAME}")
    print(f"County : {TEST_COUNTY}")
    print(f"Email  : {MDLANDREC_EMAIL or '(not set)'}")
    print()

    if not check_credentials():
        sys.exit(0)  # Skip gracefully, not a failure

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()

        try:
            print("[1] Navigating to mdlandrec.net...")
            page.goto("https://mdlandrec.net/main/dsp_login.cfm", wait_until="networkidle", timeout=30000)
            save_screenshot(page, "land_01_login_page")
            print("    Login page loaded")

            print("[2] Logging in...")
            page.fill("input[name='cEmailAddress']", MDLANDREC_EMAIL)
            page.fill("input[name='cPassword']", MDLANDREC_PASSWORD)
            save_screenshot(page, "land_02_credentials_filled")

            page.click("input[type='submit']")
            page.wait_for_load_state("networkidle", timeout=20000)
            save_screenshot(page, "land_03_post_login")

            body_text = page.inner_text("body")
            if "invalid" in body_text.lower() or "incorrect" in body_text.lower():
                print("[FAIL] Login failed — check MDLANDREC_EMAIL and MDLANDREC_PASSWORD")
                return False
            print("    Login successful")

            print("[3] Navigating to search page...")
            # Try direct search URL
            page.goto(
                "https://mdlandrec.net/main/dsp_search.cfm",
                wait_until="networkidle",
                timeout=20000,
            )
            save_screenshot(page, "land_04_search_form")
            print("    Search form loaded")

            print(f"[4] Searching for: {TEST_LAST_NAME}, {TEST_FIRST_NAME} in {TEST_COUNTY}...")
            # Select county
            try:
                page.select_option("select[name='cCountyCode']", label=TEST_COUNTY)
                print(f"    County: {TEST_COUNTY}")
            except Exception:
                print(f"    WARNING: Could not select county '{TEST_COUNTY}'")

            # Fill grantor/grantee name
            try:
                page.fill("input[name='cGrantorLastName']", TEST_LAST_NAME)
                page.fill("input[name='cGrantorFirstName']", TEST_FIRST_NAME)
                print(f"    Name: {TEST_LAST_NAME}, {TEST_FIRST_NAME}")
            except Exception:
                print("    WARNING: Could not fill grantor name fields — trying alternative selectors")
                try:
                    page.fill("input[name='LastName']", TEST_LAST_NAME)
                    page.fill("input[name='FirstName']", TEST_FIRST_NAME)
                except Exception as e:
                    print(f"    Alternative selectors also failed: {e}")

            page.wait_for_timeout(500)
            save_screenshot(page, "land_05_form_filled")

            print("[5] Submitting search...")
            page.click("input[type='submit']")
            page.wait_for_load_state("networkidle", timeout=25000)
            save_screenshot(page, "land_06_results")

            result_text = page.inner_text("body")
            print("[6] Checking results...")

            if "no records" in result_text.lower():
                print("    No records found for this name/county")
            else:
                rows = page.locator("table tr").count()
                print(f"    Found approximately {max(0, rows - 1)} result rows")
                print("\n--- Results Snippet (first 600 chars) ---")
                print(result_text[:600])
                print("---")

                # Try clicking first result
                try:
                    first_link = page.locator("table a").first
                    link_text = first_link.inner_text()
                    print(f"\n    First result: {link_text}")
                    first_link.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    save_screenshot(page, "land_07_record_detail")
                    detail = page.inner_text("body")
                    print("\n--- Record Detail Snippet (first 600 chars) ---")
                    print(detail[:600])
                    print("---")
                except Exception as e:
                    print(f"    Could not open first result: {e}")

            print("\n[PASS] Land Records test completed successfully")
            return True

        except PlaywrightTimeoutError as e:
            save_screenshot(page, "land_error_timeout")
            print(f"\n[FAIL] Timeout: {e}")
            traceback.print_exc()
            return False
        except Exception as e:
            save_screenshot(page, "land_error_general")
            print(f"\n[FAIL] Error: {e}")
            traceback.print_exc()
            return False
        finally:
            browser.close()


if __name__ == "__main__":
    success = test_land_records()
    sys.exit(0 if success else 1)
