"""
test_land_records.py - Smoke-test MDLandRec login (with stealth).

MDLandRec migrated from mdlandrec.net (ColdFusion) to landrec.msa.maryland.gov
(ASP.NET) with a 2FA flow: username+password POST triggers a 6-char code emailed
from msa.helpdesk@maryland.gov. The full automated login requires Gmail API
integration to retrieve the code; this test only validates step 1 (creds accepted,
access-code prompt appears).

Now uses playwright-stealth defensively (login page is the easiest place for a
state to bot-block credential-stuffing attempts).

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

sys.path.insert(0, str(Path(__file__).parent))
from _stealth_setup import (
    make_stealth_context, save_cookies,
    human_pause, field_pause, human_click, human_type,
    maryland_initial_wait,
)

DEBUG_DIR = Path(__file__).parent.parent / "debug"
DEBUG_DIR.mkdir(exist_ok=True)

LOGIN_URL = "https://landrec.msa.maryland.gov/Pages/Login.aspx"

SEL_USERNAME = "input#body_tbUsername"
SEL_PASSWORD = "input#body_tbPassword"
SEL_SUBMIT = "input#body_btnSubmit"
SEL_USERCODE = "input#body_tbUsercode"

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
    if not MDLANDREC_EMAIL or "your-email" in MDLANDREC_EMAIL:
        missing.append("MDLANDREC_EMAIL")
    if not MDLANDREC_PASSWORD or "your-mdlandrec" in MDLANDREC_PASSWORD:
        missing.append("MDLANDREC_PASSWORD")
    if missing:
        print(f"[SKIP] Missing credentials: {', '.join(missing)}")
        return False
    return True


def test_land_records():
    print("\n=== MDLandRec Login Smoke Test (with stealth) ===")
    print(f"Email : {MDLANDREC_EMAIL or '(not set)'}")
    print(f"URL   : {LOGIN_URL}")
    print()

    if not check_credentials():
        sys.exit(0)  # Skip gracefully

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = make_stealth_context(browser, "land_records")
        page = context.new_page()

        try:
            print("[1] Loading login page...")
            page.goto(LOGIN_URL, wait_until="networkidle", timeout=30000)
            maryland_initial_wait()
            save_screenshot(page, "land_01_login_page")
            print(f"    Final URL: {page.url}")
            print("    Login page loaded")

            print("[2] Filling credentials (human-like) and submitting...")
            human_type(page, SEL_USERNAME, MDLANDREC_EMAIL)
            field_pause()
            human_type(page, SEL_PASSWORD, MDLANDREC_PASSWORD)
            save_screenshot(page, "land_02_credentials_filled")
            field_pause()
            human_click(page, SEL_SUBMIT)
            page.wait_for_load_state("networkidle", timeout=20000)
            page.wait_for_timeout(3000)
            save_screenshot(page, "land_03_post_submit")

            print("[3] Checking response...")
            body = page.inner_text("body")

            # Bad credentials path
            if "invalid" in body.lower() or "incorrect" in body.lower() or "not found" in body.lower():
                print("[FAIL] Login rejected -- check MDLANDREC_EMAIL / MDLANDREC_PASSWORD")
                print("\n--- Body (first 600 chars) ---")
                print(body[:600])
                print("---")
                return False

            # Success path: usercode prompt appears (good -- creds accepted, 2FA initiated)
            usercode_visible = False
            try:
                usercode_visible = page.locator(SEL_USERCODE).is_visible()
            except Exception:
                pass

            if usercode_visible:
                print("    [PASS] Credentials accepted -- access-code prompt appeared")
                print("    Site sent a 6-char code to your email (from msa.helpdesk@maryland.gov)")
                print("    To complete login, retrieve via Gmail API + submit to body_btnSubUsercode")
                print("    (Skipping 2FA completion in this smoke test.)")
                save_cookies(context, "land_records")
                return True

            # Fully logged in (already had session?) -- also a pass
            if "logout" in body.lower() or "log out" in body.lower() or ("search" in body.lower() and "indices" in body.lower()):
                print("    [PASS] Logged in directly (session already active or 2FA bypassed)")
                save_cookies(context, "land_records")
                return True

            # Unexpected state
            print("[WARN] Unexpected post-submit page")
            print("\n--- Body (first 1200 chars) ---")
            print(body[:1200])
            print("---")
            save_cookies(context, "land_records")
            return False

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
