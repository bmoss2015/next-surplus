"""
test_case_search.py - Test the Maryland Case Search (court records) scraper.
Test subject: Sarah Moore, Prince George's County
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
TEST_COUNTY = "Prince George's County"
TEST_CASE_TYPE = "Civil"


def save_screenshot(page, name: str):
    path = DEBUG_DIR / f"{name}.png"
    try:
        page.screenshot(path=str(path), full_page=True)
        print(f"  [screenshot] Saved: {path}")
    except Exception:
        print(f"  [screenshot] Could not save {name}")


def test_case_search():
    print("\n=== Maryland Case Search Test ===")
    print(f"Name   : {TEST_LAST_NAME}, {TEST_FIRST_NAME}")
    print(f"County : {TEST_COUNTY}")
    print(f"Type   : {TEST_CASE_TYPE}")
    print()

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
            print("[1] Navigating to Maryland Case Search...")
            page.goto(
                "https://casesearch.courts.state.md.us/casesearch/inquiry-index.jsp",
                wait_until="networkidle",
                timeout=30000,
            )
            save_screenshot(page, "case_01_home")
            print("    Homepage loaded")

            # Accept disclaimer if present
            try:
                disclaimer_btn = page.locator("input[value='I Agree']").first
                if disclaimer_btn.is_visible(timeout=3000):
                    print("[2] Accepting disclaimer...")
                    disclaimer_btn.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    save_screenshot(page, "case_02_disclaimer_accepted")
                    print("    Disclaimer accepted")
            except Exception:
                print("[2] No disclaimer found, continuing...")

            print("[3] Navigating to Name Search...")
            page.goto(
                "https://casesearch.courts.state.md.us/casesearch/inquirySearch.jis",
                wait_until="networkidle",
                timeout=20000,
            )
            save_screenshot(page, "case_03_search_form")

            print(f"[4] Filling in name: {TEST_LAST_NAME}, {TEST_FIRST_NAME}...")
            page.fill("input#lastName", TEST_LAST_NAME)
            page.fill("input#firstName", TEST_FIRST_NAME)

            # Select county
            try:
                page.select_option("select#countyName", label=TEST_COUNTY)
                print(f"    County set to: {TEST_COUNTY}")
            except Exception:
                print(f"    WARNING: Could not select county '{TEST_COUNTY}'")

            # Select case type (civil = foreclosure cases)
            try:
                page.select_option("select#site", value="CIVIL")
                print("    Case type set to: Civil")
            except Exception:
                print("    WARNING: Could not set case type")

            page.wait_for_timeout(500)
            save_screenshot(page, "case_04_form_filled")

            print("[5] Submitting search...")
            page.click("input[type='submit']")
            page.wait_for_load_state("networkidle", timeout=25000)
            save_screenshot(page, "case_05_results")

            body_text = page.inner_text("body")
            print("[6] Checking results...")

            if "no records" in body_text.lower() or "no cases" in body_text.lower():
                print("    No cases found for this name/county combination")
            else:
                # Count results
                rows = page.locator("table tr").count()
                print(f"    Found approximately {max(0, rows - 1)} result rows")

                # Show snippet
                print("\n--- Results Snippet (first 600 chars) ---")
                print(body_text[:600])
                print("---")

                # Try clicking first case
                try:
                    first_case = page.locator("table a").first
                    case_text = first_case.inner_text()
                    print(f"\n    First case: {case_text}")
                    first_case.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    save_screenshot(page, "case_06_case_detail")
                    detail = page.inner_text("body")
                    print("\n--- Case Detail Snippet (first 600 chars) ---")
                    print(detail[:600])
                    print("---")
                except Exception as e:
                    print(f"    Could not open first case: {e}")

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
