"""
test_sdat.py - SDAT (State Department of Assessments and Taxation) scraper test.
Test subject: 4044 Hanson Oaks Drive, Prince George's County, MD

Now uses playwright-stealth + human-like timing + persisted cookies to test
whether anti-bot evasion lets the wizard advance past the address-entry step.

Wizard:
  1. Select county + search type, click Continue
  2. Enter street number + street name, click Next
  3. View results
"""

import sys
import traceback
from pathlib import Path

from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# Import shared stealth helpers
sys.path.insert(0, str(Path(__file__).parent))
from _stealth_setup import (
    make_stealth_context, save_cookies,
    human_pause, field_pause, human_click, human_type,
    maryland_initial_wait,
)

DEBUG_DIR = Path(__file__).parent.parent / "debug"
DEBUG_DIR.mkdir(exist_ok=True)

TEST_STREET_NUMBER = "4044"
TEST_STREET_NAME = "Hanson Oaks"
TEST_COUNTY_OPTION = "PRINCE GEORGE'S COUNTY"

SEL_COUNTY = "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlCounty"
SEL_SEARCH_TYPE = "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlSearchType"
SEL_CONTINUE = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StartNavigationTemplateContainerID_btnContinue"
SEL_STREET_NUMBER = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreenNumber"  # SDAT's typo, not ours
SEL_STREET_NAME = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreetName"
SEL_NEXT = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StepNavigationTemplateContainerID_btnStepNextButton"


def save_screenshot(page, name: str):
    path = DEBUG_DIR / f"{name}.png"
    try:
        page.screenshot(path=str(path), full_page=True)
        print(f"  [screenshot] Saved: {path}")
    except Exception:
        print(f"  [screenshot] Could not save {name}")


def test_sdat_lookup():
    print("\n=== SDAT Scraper Test (with stealth) ===")
    print(f"Address : {TEST_STREET_NUMBER} {TEST_STREET_NAME}")
    print(f"County  : {TEST_COUNTY_OPTION}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = make_stealth_context(browser, "sdat")
        page = context.new_page()

        try:
            print("[1] Navigating to SDAT Real Property Search...")
            page.goto(
                "https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx",
                wait_until="networkidle",
                timeout=30000,
            )
            print("    Waiting 5-10s after load (Maryland sites are slow)...")
            maryland_initial_wait()
            save_screenshot(page, "sdat_01_home")
            print("    Loaded homepage")

            print(f"[2] Selecting county: {TEST_COUNTY_OPTION}...")
            human_pause()  # 2-5s human reaction time
            page.select_option(SEL_COUNTY, label=TEST_COUNTY_OPTION)
            print("    County selected")

            field_pause()  # 1-3s between actions
            print("[3] Selecting search type: STREET ADDRESS...")
            page.select_option(SEL_SEARCH_TYPE, label="STREET ADDRESS")
            save_screenshot(page, "sdat_02_county_and_type_selected")
            print("    Search type selected")

            field_pause()
            print("[4] Clicking Continue (with mouse move) to load address-entry page...")
            human_click(page, SEL_CONTINUE)
            page.wait_for_load_state("networkidle", timeout=20000)
            page.wait_for_selector(SEL_STREET_NUMBER, state="attached", timeout=20000)
            maryland_initial_wait()
            save_screenshot(page, "sdat_03_address_form")
            print("    Address form loaded")

            print(f"[5] Typing street number ({TEST_STREET_NUMBER})...")
            human_type(page, SEL_STREET_NUMBER, TEST_STREET_NUMBER)
            field_pause()
            print(f"    Typing street name ({TEST_STREET_NAME})...")
            human_type(page, SEL_STREET_NAME, TEST_STREET_NAME)
            save_screenshot(page, "sdat_04_address_filled")

            field_pause()
            print("[6] Clicking Next (with mouse move) to submit search...")
            human_click(page, SEL_NEXT)
            page.wait_for_load_state("networkidle", timeout=20000)
            page.wait_for_timeout(3000)
            save_screenshot(page, "sdat_05_results")

            body_text = page.inner_text("body")
            print("[7] Checking results...")

            still_on_address_form = "Enter Premises Address" in body_text
            no_results_match = (
                "no records" in body_text.lower()
                or "0 results" in body_text.lower()
                or "no real property" in body_text.lower()
            )

            if still_on_address_form:
                print("    [WARN] Wizard did NOT advance past address form (same symptom as before stealth)")
                print("    This rules out simple bot detection; the issue is structural (ASP.NET wizard state).")
                print("\n--- Body snippet (first 800 chars) ---")
                print(body_text[:800])
                print("---")
                save_cookies(context, "sdat")
                return False

            if no_results_match:
                print("    Wizard advanced -- but no results for this address")
                print("\n--- Body snippet (first 800 chars) ---")
                print(body_text[:800])
                print("---")
            else:
                print("    [SUCCESS] Wizard advanced past address form -- stealth fixed it!")
                print("\n--- Body snippet (first 1500 chars) ---")
                print(body_text[:1500])
                print("---")

            save_cookies(context, "sdat")
            print("\n[PASS] SDAT test completed")
            return True

        except PlaywrightTimeoutError as e:
            save_screenshot(page, "sdat_error_timeout")
            print(f"\n[FAIL] Timeout: {e}")
            traceback.print_exc()
            return False
        except Exception as e:
            save_screenshot(page, "sdat_error_general")
            print(f"\n[FAIL] Error: {e}")
            traceback.print_exc()
            return False
        finally:
            browser.close()


if __name__ == "__main__":
    success = test_sdat_lookup()
    sys.exit(0 if success else 1)
