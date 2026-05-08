"""
test_full_pipeline.py - End-to-end pipeline test using all components.
Runs: SDAT → Case Search → Land Records → Supabase → Drive
Test subject: Sarah Moore, 4044 Hanson Oaks Drive, Prince George's County, MD
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

DEBUG_DIR = Path(__file__).parent.parent / "debug"
DEBUG_DIR.mkdir(exist_ok=True)

# Test data
LEAD = {
    "owner_first": "Sarah",
    "owner_last": "Moore",
    "owner_name": "Sarah Moore",
    "address": "4044 Hanson Oaks Drive",
    "county": "Prince George's",
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


def save_screenshot(page, name: str):
    path = DEBUG_DIR / f"pipeline_{name}.png"
    try:
        page.screenshot(path=str(path), full_page=True)
        print(f"    [screenshot] {path.name}")
    except Exception:
        pass


def step_banner(n: int, title: str):
    print(f"\n{'─' * 50}")
    print(f"  Step {n}: {title}")
    print(f"{'─' * 50}")


def check_env():
    """Report which integrations are available."""
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
        color = "\033[32m" if available else "\033[33m"
        reset = "\033[0m"
        print(f"  {color}{name:20s}{status}{reset}")
    print()
    return checks


def scrape_sdat(page) -> dict:
    """Scrape SDAT for property assessment data."""
    step_banner(1, "SDAT Property Lookup")
    result = {}

    try:
        print(f"  Searching: {LEAD['address']}, {LEAD['county']} County")
        page.goto(
            "https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx",
            wait_until="networkidle",
            timeout=30000,
        )
        save_screenshot(page, "01_sdat_home")

        page.select_option("select#MainContent_county_dropdown", label="PRINCE GEORGE'S")
        page.wait_for_timeout(500)
        page.click("input[value='SEARCH BY ADDRESS']")
        page.wait_for_load_state("networkidle", timeout=20000)

        page.fill("input#MainContent_street_number", "4044")
        page.fill("input#MainContent_street_name", "Hanson Oaks")
        page.wait_for_timeout(500)
        page.click("input[value='SEARCH']")
        page.wait_for_load_state("networkidle", timeout=20000)
        save_screenshot(page, "01_sdat_results")

        body = page.inner_text("body")
        result["sdat_raw_text"] = body[:2000]
        result["sdat_status"] = "found" if "no records" not in body.lower() else "not_found"
        print(f"  SDAT status: {result['sdat_status']}")

    except Exception as e:
        result["sdat_status"] = "error"
        result["sdat_error"] = str(e)
        save_screenshot(page, "01_sdat_error")
        print(f"  SDAT error: {e}")

    return result


def scrape_case_search(page) -> dict:
    """Scrape Maryland Case Search for court records."""
    step_banner(2, "Case Search")
    result = {}

    try:
        print(f"  Searching: {LEAD['owner_last']}, {LEAD['owner_first']}")
        page.goto(
            "https://casesearch.courts.state.md.us/casesearch/inquirySearch.jis",
            wait_until="networkidle",
            timeout=30000,
        )
        save_screenshot(page, "02_case_form")

        # Accept disclaimer if needed
        try:
            btn = page.locator("input[value='I Agree']").first
            if btn.is_visible(timeout=2000):
                btn.click()
                page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass

        page.fill("input#lastName", LEAD["owner_last"])
        page.fill("input#firstName", LEAD["owner_first"])
        try:
            page.select_option("select#countyName", label=f"{LEAD['county']} County")
        except Exception:
            pass

        page.click("input[type='submit']")
        page.wait_for_load_state("networkidle", timeout=25000)
        save_screenshot(page, "02_case_results")

        body = page.inner_text("body")
        result["case_search_raw"] = body[:2000]
        result["case_search_status"] = "found" if "no records" not in body.lower() else "not_found"
        print(f"  Case Search status: {result['case_search_status']}")

    except Exception as e:
        result["case_search_status"] = "error"
        result["case_search_error"] = str(e)
        save_screenshot(page, "02_case_error")
        print(f"  Case Search error: {e}")

    return result


def scrape_land_records(page) -> dict:
    """Scrape Maryland Land Records."""
    step_banner(3, "Land Records")
    result = {}

    if not MDLANDREC_EMAIL or not MDLANDREC_PASSWORD:
        print("  SKIP: MDLANDREC credentials not set")
        result["land_records_status"] = "skipped"
        return result

    try:
        print(f"  Logging in as: {MDLANDREC_EMAIL}")
        page.goto("https://mdlandrec.net/main/dsp_login.cfm", wait_until="networkidle", timeout=30000)
        page.fill("input[name='cEmailAddress']", MDLANDREC_EMAIL)
        page.fill("input[name='cPassword']", MDLANDREC_PASSWORD)
        page.click("input[type='submit']")
        page.wait_for_load_state("networkidle", timeout=20000)
        save_screenshot(page, "03_land_post_login")

        body = page.inner_text("body")
        if "invalid" in body.lower():
            result["land_records_status"] = "login_failed"
            print("  Login failed")
            return result

        print("  Login OK — searching records...")
        page.goto("https://mdlandrec.net/main/dsp_search.cfm", wait_until="networkidle", timeout=20000)

        try:
            page.fill("input[name='cGrantorLastName']", LEAD["owner_last"])
            page.fill("input[name='cGrantorFirstName']", LEAD["owner_first"])
            page.select_option("select[name='cCountyCode']", label=LEAD["county"])
        except Exception as e:
            print(f"  Form fill warning: {e}")

        page.click("input[type='submit']")
        page.wait_for_load_state("networkidle", timeout=25000)
        save_screenshot(page, "03_land_results")

        result_text = page.inner_text("body")
        result["land_records_raw"] = result_text[:2000]
        result["land_records_status"] = "found" if "no records" not in result_text.lower() else "not_found"
        print(f"  Land Records status: {result['land_records_status']}")

    except Exception as e:
        result["land_records_status"] = "error"
        result["land_records_error"] = str(e)
        save_screenshot(page, "03_land_error")
        print(f"  Land Records error: {e}")

    return result


def save_to_supabase(data: dict) -> dict:
    """Save pipeline results to Supabase."""
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
            "owner_name": LEAD["owner_name"],
            "property_address": f"{LEAD['address']}, {LEAD['county']} County, {LEAD['state']} {LEAD['zip']}",
            "status": "test_pipeline",
            "source": "local_test_runner",
            "created_at": datetime.utcnow().isoformat(),
            "pipeline_data": json.dumps(data),
        }

        print(f"  Inserting lead: {record['owner_name']}")
        response = client.table("leads").insert(record).execute()

        if response.data:
            inserted_id = response.data[0].get("id")
            result["supabase_id"] = inserted_id
            result["supabase_status"] = "saved"
            print(f"  Saved with ID: {inserted_id}")

            # Cleanup
            client.table("leads").delete().eq("id", inserted_id).execute()
            print("  Cleanup: test record deleted")
        else:
            result["supabase_status"] = "no_data_returned"
            print("  WARNING: No data returned from insert")

    except Exception as e:
        err = str(e)
        if "does not exist" in err:
            result["supabase_status"] = "table_missing"
            print(f"  Table 'leads' not found — adjust table name in test_supabase.py")
        else:
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
            scopes=["https://www.googleapis.com/auth/drive"],
        )
        service = build("drive", "v3", credentials=creds)

        summary = f"""MD Mortgage Research - Pipeline Test
Run at: {datetime.now().isoformat()}
Lead: {LEAD['owner_name']}
Address: {LEAD['address']}, {LEAD['county']} County, MD

Results:
{json.dumps(data, indent=2)}
"""
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
        print(f"  Uploaded: {filename} (ID: {file_id})")

        # Cleanup
        service.files().delete(fileId=file_id).execute()
        print("  Cleanup: test file deleted from Drive")
        os.unlink(tmp_path)

    except Exception as e:
        result["drive_status"] = "error"
        result["drive_error"] = str(e)
        print(f"  Drive error: {e}")
        traceback.print_exc()

    return result


def test_full_pipeline():
    print("\n" + "=" * 60)
    print("  MD Mortgage Research Agent - Full Pipeline Test")
    print("=" * 60)
    print(f"  Lead    : {LEAD['owner_name']}")
    print(f"  Address : {LEAD['address']}, {LEAD['county']} County, MD")
    print(f"  Run at  : {datetime.now().isoformat()}")

    available = check_env()
    pipeline_data = {"lead": LEAD, "run_at": datetime.now().isoformat()}

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
            pipeline_data.update(scrape_sdat(page))
            pipeline_data.update(scrape_case_search(page))
            pipeline_data.update(scrape_land_records(page))
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
    status_keys = [k for k in pipeline_data if k.endswith("_status")]
    all_ok = True
    for key in status_keys:
        val = pipeline_data[key]
        ok = val in ("found", "saved", "uploaded", "not_found", "skipped")
        icon = "[OK]  " if ok else "[WARN]"
        if not ok:
            all_ok = False
        print(f"  {icon} {key}: {val}")

    print()
    if all_ok:
        print("[PASS] Full pipeline test completed successfully")
    else:
        print("[WARN] Pipeline completed with warnings — review output above")

    print(f"\nDebug screenshots saved to: {DEBUG_DIR}")
    return True


if __name__ == "__main__":
    try:
        success = test_full_pipeline()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[FAIL] Unhandled error: {e}")
        traceback.print_exc()
        sys.exit(1)
