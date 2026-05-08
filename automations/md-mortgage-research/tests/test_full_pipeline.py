"""
test_full_pipeline.py - End-to-end pipeline test using all components.
Runs: SDAT -> Case Search -> Land Records -> Supabase -> Drive
Test subject: Sarah Moore, 4044 Hanson Oaks Drive, Prince George's County, MD

Uses playwright-stealth for all browser steps (matches the per-component tests).
Case Search will fail/skip cleanly if MD Judiciary's IP-level WAF blocks the
host's IP -- that's a known limitation of running locally; Railway egress IPs
are usually clean.
"""

import os
import sys
import json
import traceback
import uuid
from pathlib import Path
from datetime import datetime

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

# Test data
LEAD = {
    "owner_first": "Sarah",
    "owner_last": "Moore",
    "owner_name": "Sarah Moore",
    "address": "4044 Hanson Oaks Drive",
    "street_number": "4044",
    "street_name": "Hanson Oaks",
    "county": "Prince George's",
    "county_option": "PRINCE GEORGE'S COUNTY",
    "zip": "20748",
    "state": "MD",
}

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GOOGLE_OAUTH_CREDENTIALS_JSON = os.environ.get("GOOGLE_OAUTH_CREDENTIALS_JSON", "")
GOOGLE_REFRESH_TOKEN = os.environ.get("GOOGLE_REFRESH_TOKEN", "")
MDLANDREC_EMAIL = os.environ.get("MDLANDREC_EMAIL", "")
MDLANDREC_PASSWORD = os.environ.get("MDLANDREC_PASSWORD", "")

# SDAT selectors (post-2026 wizard redesign)
SDAT_COUNTY = "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlCounty"
SDAT_TYPE = "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlSearchType"
SDAT_CONTINUE = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StartNavigationTemplateContainerID_btnContinue"
SDAT_NUM = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreenNumber"
SDAT_NAME = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreetName"
SDAT_NEXT = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StepNavigationTemplateContainerID_btnStepNextButton"

# MDLandRec selectors (post-2025 migration)
LAND_URL = "https://landrec.msa.maryland.gov/Pages/Login.aspx"
LAND_USER = "input#body_tbUsername"
LAND_PASS = "input#body_tbPassword"
LAND_SUBMIT = "input#body_btnSubmit"
LAND_USERCODE = "input#body_tbUsercode"


def save_screenshot(page, name: str):
    path = DEBUG_DIR / f"pipeline_{name}.png"
    try:
        page.screenshot(path=str(path), full_page=True)
        print(f"    [screenshot] {path.name}")
    except Exception:
        pass


def step_banner(n: int, title: str):
    print(f"\n{'-' * 50}")
    print(f"  Step {n}: {title}")
    print(f"{'-' * 50}")


def is_md_judiciary_blocked(page) -> bool:
    try:
        body = page.inner_text("body").lower()
    except Exception:
        return False
    return "access is temporarily restricted" in body or "we detected unusual activity" in body


def check_env():
    print("\n=== Environment Check ===")
    checks = {
        "Supabase": bool(SUPABASE_URL and "your-project" not in SUPABASE_URL and SUPABASE_SECRET_KEY),
        "Anthropic": bool(ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "sk-ant-your-key-here"),
        "Google Drive": bool(
            GOOGLE_OAUTH_CREDENTIALS_JSON
            and "REPLACE_ME" not in GOOGLE_OAUTH_CREDENTIALS_JSON
            and GOOGLE_REFRESH_TOKEN
            and GOOGLE_REFRESH_TOKEN != "your-google-refresh-token-here"
        ),
        "Land Records": bool(MDLANDREC_EMAIL and MDLANDREC_PASSWORD),
    }
    for name, available in checks.items():
        status = "AVAILABLE" if available else "SKIP (credentials not set)"
        print(f"  {name:20s}{status}")
    print()
    return checks


def scrape_sdat(browser) -> dict:
    """Scrape SDAT for property assessment data using stealth."""
    step_banner(1, "SDAT Property Lookup (stealth)")
    result = {}
    context = make_stealth_context(browser, "sdat")
    page = context.new_page()

    try:
        print(f"  Searching: {LEAD['address']}, {LEAD['county']} County")
        page.goto(
            "https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx",
            wait_until="networkidle",
            timeout=30000,
        )
        maryland_initial_wait()
        save_screenshot(page, "01_sdat_home")

        human_pause()
        page.select_option(SDAT_COUNTY, label=LEAD["county_option"])
        field_pause()
        page.select_option(SDAT_TYPE, label="STREET ADDRESS")
        field_pause()
        human_click(page, SDAT_CONTINUE)
        page.wait_for_load_state("networkidle", timeout=20000)
        page.wait_for_selector(SDAT_NUM, state="attached", timeout=20000)
        maryland_initial_wait()

        human_type(page, SDAT_NUM, LEAD["street_number"])
        field_pause()
        human_type(page, SDAT_NAME, LEAD["street_name"])
        field_pause()
        human_click(page, SDAT_NEXT)
        page.wait_for_load_state("networkidle", timeout=20000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "01_sdat_results")

        body = page.inner_text("body")
        result["sdat_raw_text"] = body[:2000]
        if "Enter Premises Address" in body:
            result["sdat_status"] = "wizard_stuck"
            print("  SDAT status: wizard did not advance (bot detection or transient)")
        elif "no records" in body.lower() or "no real property" in body.lower():
            result["sdat_status"] = "not_found"
            print("  SDAT status: not_found")
        else:
            result["sdat_status"] = "found"
            print("  SDAT status: found")
            # Pull a few key fields if present
            for line in body.splitlines():
                if "Owner Name:" in line or "Premises Address:" in line or "Account Number:" in line:
                    print(f"    {line.strip()[:120]}")
        save_cookies(context, "sdat")
    except Exception as e:
        result["sdat_status"] = "error"
        result["sdat_error"] = str(e)
        save_screenshot(page, "01_sdat_error")
        print(f"  SDAT error: {e}")
    finally:
        context.close()
    return result


def scrape_case_search(browser) -> dict:
    """Scrape Maryland Case Search for court records using stealth."""
    step_banner(2, "Case Search (stealth)")
    result = {}
    context = make_stealth_context(browser, "case_search")
    page = context.new_page()

    try:
        print(f"  Searching: {LEAD['owner_last']}, {LEAD['owner_first']}")
        page.goto(
            "https://casesearch.courts.state.md.us/casesearch/inquiry-index.jsp",
            wait_until="networkidle",
            timeout=30000,
        )
        maryland_initial_wait()
        save_screenshot(page, "02_case_home")

        if is_md_judiciary_blocked(page):
            result["case_search_status"] = "ip_blocked"
            print("  Case Search: IP-blocked by MD Judiciary WAF (run on Railway / use VPN)")
            save_cookies(context, "case_search")
            return result

        human_pause()
        try:
            btn = page.locator("input[value='I Agree']").first
            if btn.is_visible(timeout=2000):
                human_click(page, "input[value='I Agree']")
                page.wait_for_load_state("networkidle", timeout=15000)
                maryland_initial_wait()
        except Exception:
            pass

        page.goto(
            "https://casesearch.courts.state.md.us/casesearch/inquirySearch.jis",
            wait_until="networkidle",
            timeout=20000,
        )
        maryland_initial_wait()
        save_screenshot(page, "02_case_form")

        if is_md_judiciary_blocked(page):
            result["case_search_status"] = "ip_blocked"
            print("  Case Search: IP-blocked at search-form page")
            save_cookies(context, "case_search")
            return result

        # The block page has 0 form inputs — detect that case before timing out for 30s
        try:
            page.wait_for_selector("input#lastName", state="attached", timeout=5000)
        except PlaywrightTimeoutError:
            # Either bot-blocked (most likely) or selectors changed
            visible_inputs = [
                i for i in page.query_selector_all("input")
                if (i.get_attribute("type") or "") not in ("hidden",)
            ]
            if len(visible_inputs) == 0 or is_md_judiciary_blocked(page):
                result["case_search_status"] = "ip_blocked"
                print("  Case Search: IP-blocked (no form inputs on page)")
                save_cookies(context, "case_search")
                return result
            result["case_search_status"] = "selectors_changed"
            print("  Case Search: form selectors changed (or unknown state)")
            save_cookies(context, "case_search")
            return result

        human_type(page, "input#lastName", LEAD["owner_last"])
        field_pause()
        human_type(page, "input#firstName", LEAD["owner_first"])
        try:
            page.select_option("select#countyName", label=f"{LEAD['county']} County")
        except Exception:
            pass

        field_pause()
        human_click(page, "input[type='submit']")
        page.wait_for_load_state("networkidle", timeout=25000)
        page.wait_for_timeout(2000)
        save_screenshot(page, "02_case_results")

        if is_md_judiciary_blocked(page):
            result["case_search_status"] = "ip_blocked_on_submit"
            print("  Case Search: IP-blocked on submit")
            save_cookies(context, "case_search")
            return result

        body = page.inner_text("body")
        result["case_search_raw"] = body[:2000]
        result["case_search_status"] = "found" if "no records" not in body.lower() else "not_found"
        print(f"  Case Search status: {result['case_search_status']}")
        save_cookies(context, "case_search")
    except Exception as e:
        result["case_search_status"] = "error"
        result["case_search_error"] = str(e)
        save_screenshot(page, "02_case_error")
        print(f"  Case Search error: {e}")
    finally:
        context.close()
    return result


def scrape_land_records(browser) -> dict:
    """MDLandRec login smoke test (full search needs Gmail 2FA integration)."""
    step_banner(3, "Land Records Login (stealth)")
    result = {}

    if not MDLANDREC_EMAIL or not MDLANDREC_PASSWORD:
        print("  SKIP: MDLANDREC credentials not set")
        result["land_records_status"] = "skipped"
        return result

    context = make_stealth_context(browser, "land_records")
    page = context.new_page()

    try:
        print(f"  Logging in as: {MDLANDREC_EMAIL}")
        page.goto(LAND_URL, wait_until="networkidle", timeout=30000)
        maryland_initial_wait()

        human_type(page, LAND_USER, MDLANDREC_EMAIL)
        field_pause()
        human_type(page, LAND_PASS, MDLANDREC_PASSWORD)
        field_pause()
        human_click(page, LAND_SUBMIT)
        page.wait_for_load_state("networkidle", timeout=20000)
        page.wait_for_timeout(3000)
        save_screenshot(page, "03_land_post_login")

        body = page.inner_text("body")
        if "invalid" in body.lower() or "incorrect" in body.lower():
            result["land_records_status"] = "login_failed"
            print("  Land Records: login failed (creds rejected)")
        elif page.locator(LAND_USERCODE).is_visible():
            result["land_records_status"] = "creds_accepted_2fa_pending"
            print("  Land Records: creds accepted, 2FA prompt visible (full search needs Gmail integration)")
        elif "logout" in body.lower():
            result["land_records_status"] = "logged_in"
            print("  Land Records: logged in directly")
        else:
            result["land_records_status"] = "unknown_state"
            print("  Land Records: post-submit page state unclear")
        save_cookies(context, "land_records")
    except Exception as e:
        result["land_records_status"] = "error"
        result["land_records_error"] = str(e)
        save_screenshot(page, "03_land_error")
        print(f"  Land Records error: {e}")
    finally:
        context.close()
    return result


def save_to_supabase(data: dict) -> dict:
    """Save pipeline results to Supabase using the actual schema."""
    step_banner(4, "Supabase Save")
    result = {}

    if not SUPABASE_URL or "your-project" in SUPABASE_URL:
        print("  SKIP: Supabase credentials not set")
        result["supabase_status"] = "skipped"
        return result

    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

        record = {
            "id": str(uuid.uuid4()),
            "source": "local_test_runner",
            "owner_first_name": LEAD["owner_first"],
            "owner_last_name": LEAD["owner_last"],
            "owner_full_name": LEAD["owner_name"],
            "property_address": LEAD["address"],
            "property_city": "Hyattsville",
            "property_state": LEAD["state"],
            "property_zip": LEAD["zip"],
            "county": LEAD["county"],
            "status": "test_pipeline",
            "notes": json.dumps({k: v for k, v in data.items() if not k.endswith("_raw") and not k.endswith("_raw_text")})[:8000],
        }

        print(f"  Inserting lead: {record['owner_full_name']}")
        response = client.table("leads").insert(record).execute()

        if response.data:
            inserted_id = response.data[0].get("id")
            result["supabase_id"] = inserted_id
            result["supabase_status"] = "saved"
            print(f"  Saved with ID: {inserted_id}")

            client.table("leads").delete().eq("id", inserted_id).execute()
            print("  Cleanup: test record deleted")
        else:
            result["supabase_status"] = "no_data_returned"
            print("  WARNING: No data returned from insert")
    except Exception as e:
        err = str(e)
        result["supabase_status"] = "error"
        result["supabase_error"] = err
        print(f"  Supabase error: {e}")
        traceback.print_exc()
    return result


def upload_to_drive(data: dict) -> dict:
    """Upload pipeline result summary to Google Drive."""
    step_banner(5, "Google Drive Upload")
    result = {}

    if not GOOGLE_OAUTH_CREDENTIALS_JSON or "REPLACE_ME" in GOOGLE_OAUTH_CREDENTIALS_JSON:
        print("  SKIP: Google Drive credentials not set")
        result["drive_status"] = "skipped"
        return result

    try:
        import tempfile
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload

        creds_data = json.loads(GOOGLE_OAUTH_CREDENTIALS_JSON)
        client_info = creds_data.get("installed") or creds_data.get("web") or creds_data

        creds = Credentials(
            token=None,
            refresh_token=GOOGLE_REFRESH_TOKEN,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_info["client_id"],
            client_secret=client_info["client_secret"],
            scopes=[
                "https://www.googleapis.com/auth/drive.file",
                "https://www.googleapis.com/auth/gmail.compose",
                "https://www.googleapis.com/auth/gmail.readonly",
            ],
        )
        service = build("drive", "v3", credentials=creds)

        summary = (
            f"MD Mortgage Research - Pipeline Test\n"
            f"Run at: {datetime.now().isoformat()}\n"
            f"Lead: {LEAD['owner_name']}\n"
            f"Address: {LEAD['address']}, {LEAD['county']} County, MD\n\n"
            f"Results:\n{json.dumps(data, indent=2)[:6000]}\n"
        )
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as tmp:
            tmp.write(summary)
            tmp_path = tmp.name

        filename = f"pipeline-test-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"
        media = MediaFileUpload(tmp_path, mimetype="text/plain")
        uploaded = service.files().create(
            body={"name": filename},
            media_body=media,
            fields="id, name, webViewLink",
        ).execute()

        file_id = uploaded.get("id")
        result["drive_file_id"] = file_id
        result["drive_status"] = "uploaded"
        result["drive_view_link"] = uploaded.get("webViewLink")
        print(f"  Uploaded: {filename} (ID: {file_id})")

        service.files().delete(fileId=file_id).execute()
        print("  Cleanup: test file deleted from Drive")
        # Drop Playwright/MediaFileUpload's lingering reference before unlinking on Windows
        del media
        del uploaded
        try:
            os.unlink(tmp_path)
        except OSError:
            # Windows sometimes holds the temp file briefly after MediaFileUpload close;
            # not worth failing the pipeline over a 184-byte temp file.
            pass
    except Exception as e:
        result["drive_status"] = "error"
        result["drive_error"] = str(e)
        print(f"  Drive error: {e}")
        traceback.print_exc()
    return result


def test_full_pipeline():
    print("\n" + "=" * 60)
    print("  MD Mortgage Research Agent - Full Pipeline Test (stealth)")
    print("=" * 60)
    print(f"  Lead    : {LEAD['owner_name']}")
    print(f"  Address : {LEAD['address']}, {LEAD['county']} County, MD")
    print(f"  Run at  : {datetime.now().isoformat()}")

    available = check_env()
    pipeline_data = {"lead": LEAD, "run_at": datetime.now().isoformat()}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            pipeline_data.update(scrape_sdat(browser))
            pipeline_data.update(scrape_case_search(browser))
            if available["Land Records"]:
                pipeline_data.update(scrape_land_records(browser))
            else:
                pipeline_data["land_records_status"] = "skipped"
        finally:
            browser.close()

    if available["Supabase"]:
        pipeline_data.update(save_to_supabase(pipeline_data))

    if available["Google Drive"]:
        pipeline_data.update(upload_to_drive(pipeline_data))

    # Final summary
    print("\n" + "=" * 60)
    print("  Pipeline Summary")
    print("=" * 60)
    status_keys = sorted(k for k in pipeline_data if k.endswith("_status"))
    pass_count = 0
    warn_count = 0
    for key in status_keys:
        val = pipeline_data[key]
        ok = val in ("found", "saved", "uploaded", "creds_accepted_2fa_pending", "logged_in", "skipped", "not_found", "ip_blocked")
        icon = "[OK]  " if ok else "[WARN]"
        if ok:
            pass_count += 1
        else:
            warn_count += 1
        print(f"  {icon} {key}: {val}")

    print()
    print(f"  Components OK: {pass_count}")
    print(f"  Components WARN: {warn_count}")

    if warn_count == 0:
        print("\n[PASS] Full pipeline test completed successfully")
    else:
        print(f"\n[WARN] Pipeline completed with {warn_count} warnings -- review above")

    print(f"\nDebug screenshots saved to: {DEBUG_DIR}")
    return warn_count == 0


if __name__ == "__main__":
    try:
        success = test_full_pipeline()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[FAIL] Unhandled error: {e}")
        traceback.print_exc()
        sys.exit(1)
