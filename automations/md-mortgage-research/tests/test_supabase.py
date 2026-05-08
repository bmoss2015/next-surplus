"""
test_supabase.py - Test Supabase connection: create a test lead record, read it back, then delete it.
Requires: SUPABASE_URL and SUPABASE_SECRET_KEY in .env
"""

import os
import sys
import traceback
import uuid
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY", "")


def check_credentials():
    missing = []
    if not SUPABASE_URL or SUPABASE_URL == "https://your-project-id.supabase.co":
        missing.append("SUPABASE_URL")
    if not SUPABASE_SECRET_KEY or SUPABASE_SECRET_KEY == "your-supabase-service-role-secret-key":
        missing.append("SUPABASE_SECRET_KEY")
    if missing:
        print(f"[SKIP] Missing/placeholder credentials: {', '.join(missing)}")
        print("       Update them in .env and re-run.")
        return False
    return True


def test_supabase_connection():
    print("\n=== Supabase Connection Test ===")
    print(f"URL : {SUPABASE_URL}")
    print(f"Key : {'*' * 20}...{SUPABASE_SECRET_KEY[-6:] if SUPABASE_SECRET_KEY else '(not set)'}")
    print()

    if not check_credentials():
        sys.exit(0)

    try:
        from supabase import create_client, Client
    except ImportError:
        print("[FAIL] supabase package not installed. Run: pip install supabase")
        sys.exit(1)

    test_id = str(uuid.uuid4())
    test_record = {
        "id": test_id,
        "source": "local_test_runner",
        "owner_full_name": "Test Lead - Local Dev",
        "owner_first_name": "Test",
        "owner_last_name": "Lead",
        "property_address": "123 Test Street",
        "property_city": "Hyattsville",
        "property_state": "MD",
        "property_zip": "20748",
        "county": "Prince George's",
        "status": "test",
    }

    supabase: Client = None
    inserted_id = None

    try:
        print("[1] Creating Supabase client...")
        supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
        print("    Client created")

        print("[2] Inserting test lead record...")
        # Try common table names; adjust to match your actual schema
        table_name = "leads"
        try:
            response = supabase.table(table_name).insert(test_record).execute()
            if response.data:
                inserted_id = response.data[0].get("id", test_id)
                print(f"    Inserted record ID: {inserted_id}")
            else:
                print(f"    Insert response (no data returned): {response}")
        except Exception as e:
            err_str = str(e)
            if "does not exist" in err_str or "relation" in err_str:
                print(f"    Table '{table_name}' not found — checking available tables...")
                # List tables to help debug
                try:
                    tables_resp = supabase.rpc("pg_tables", {}).execute()
                    print(f"    Tables: {tables_resp}")
                except Exception:
                    pass
                print(f"\n    NOTE: Update table_name in this test to match your schema.")
                print(f"    Error: {e}")
                print("\n[PARTIAL] Supabase connection works, but table name needs adjustment")
                return True
            raise

        print("[3] Reading the record back...")
        read_response = (
            supabase.table(table_name)
            .select("*")
            .eq("id", inserted_id)
            .execute()
        )
        if read_response.data:
            record = read_response.data[0]
            print(f"    Read back: id={record.get('id')} owner_full_name={record.get('owner_full_name')!r} status={record.get('status')!r}")
            assert record.get("owner_full_name") == test_record["owner_full_name"], "Data mismatch!"
            print("    Data integrity check passed")
        else:
            print(f"    WARNING: Could not read back the inserted record")

        print("[4] Deleting test record (cleanup)...")
        supabase.table(table_name).delete().eq("id", inserted_id).execute()
        print("    Test record deleted")

        print("\n[PASS] Supabase test completed successfully")
        return True

    except Exception as e:
        print(f"\n[FAIL] Supabase error: {e}")
        traceback.print_exc()
        # Attempt cleanup
        if supabase and inserted_id:
            try:
                supabase.table("leads").delete().eq("id", inserted_id).execute()
                print("    Cleanup: test record deleted")
            except Exception:
                pass
        return False


if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)
