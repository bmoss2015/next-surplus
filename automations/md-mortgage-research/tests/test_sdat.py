"""
test_sdat.py - Test the SDAT (State Department of Assessments and Taxation) scraper.
Test subject: 4044 Hanson Oaks Drive, Prince George's County, MD
"""

import os
import sys
import traceback
from pathlib import Path

# Load .env from parent directory (automations/md-mortgage-research/.env)
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

DEBUG_DIR = Path(__file__).parent.parent / "debug"
DEBUG_DIR.mkdir(exist_ok=True)

TEST_ADDRESS = "4044 Hanson Oaks Drive"
TEST_COUNTY = "Prince George's"
TEST_ZIP = "20748"

def save_screenshot(page, name: str):
    path = DEBUG_DIR / f"{name}.png"
    try:
        page.screenshot(path=str(path), full_page=True)
        print(f"  [screenshot] Saved: {path}")
    except Exception:
        print(f"  [screenshot] Could not save {name}")


def test_sdat_lookup():
    print("\n=== SDAT Scraper Test ===")
    print(f"Address : {TEST_ADDRESS}")
    print(f"County  : {TEST_COUNTY}")
    print(f"ZIP     : {TEST_ZIP}")
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
            print("[1] Navigating to SDAT Real Property Search...")
            page.goto(
                "https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx",
                wait_until="networkidle",
                timeout=30000,
            )
            save_screenshot(page, "sdat_01_home")
            print("    Loaded homepage")

            print("[2] Selecting county: Prince George's...")
            # Select county from dropdown
            page.select_option(
                "select#MainContent_county_dropdown",
                label="PRINCE GEORGE'S",
            )
            page.wait_for_timeout(500)
            save_screenshot(page, "sdat_02_county_selected")
            print("    County selected")

            print("[3] Clicking Search by Address...")
            page.click("input[value='SEARCH BY ADDRESS']")
            page.wait_for_load_state("networkidle", timeout=20000)
            save_screenshot(page, "sdat_03_address_form")
            print("    Address form loaded")

            print(f"[4] Entering address: {TEST_ADDRESS}...")
            # Fill street number and name separately if needed, or combined
            # SDAT splits into house number + street name
            # "4044 Hanson Oaks Drive" → house# 4044, street name "Hanson Oaks"
            try:
                page.fill("input#MainContent_street_number", "4044")
                page.fill("input#MainContent_street_name", "Hanson Oaks")
            except Exception:
                # Fallback: try a unified search field
                page.fill("input[name*='street']", TEST_ADDRESS)

            page.wait_for_timeout(500)
            save_screenshot(page, "sdat_04_address_filled")

            print("[5] Submitting address search...")
            page.click("input[value='SEARCH']")
            page.wait_for_load_state("networkidle", timeout=20000)
            save_screenshot(page, "sdat_05_results")

            # Check for results
            body_text = page.inner_text("body")
            print("[6] Checking results...")

            if "no records" in body_text.lower() or "0 results" in body_text.lower():
                print("    WARNING: No results found — address may need adjustment")
            else:
                print("    Results page loaded successfully")

                # Try to click first result
                try:
                    first_link = page.locator("table a").first
                    href = first_link.get_attribute("href")
                    print(f"    First result link: {href}")
                    first_link.click()
                    page.wait_for_load_state("networkidle", timeout=20000)
                    save_screenshot(page, "sdat_06_property_detail")
                    print("    Property detail page loaded")

                    detail_text = page.inner_text("body")
                    print("\n--- Property Detail Snippet (first 800 chars) ---")
                    print(detail_text[:800])
                    print("---")

                except Exception as e:
                    print(f"    Could not click first result: {e}")
                    save_screenshot(page, "sdat_06_results_fallback")
                    print("    Results text (first 800 chars):")
                    print(body_text[:800])

            print("\n[PASS] SDAT test completed successfully")
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
