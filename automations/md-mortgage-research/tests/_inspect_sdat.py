"""Try different inputs: street name only, uppercase, etc."""
import time
from playwright.sync_api import sync_playwright

SEL_COUNTY = "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlCounty"
SEL_TYPE = "select#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucSearchType_ddlSearchType"
SEL_CONT = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StartNavigationTemplateContainerID_btnContinue"
SEL_NUM = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreenNumber"
SEL_NAME = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_ucEnterData_txtStreetName"
SEL_NEXT = "input#cphMainContentArea_ucSearchType_wzrdRealPropertySearch_StepNavigationTemplateContainerID_btnStepNextButton"

def attempt(label, num, name):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1200})
        page.goto("https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx", wait_until="networkidle", timeout=30000)
        time.sleep(1)
        page.select_option(SEL_COUNTY, label="PRINCE GEORGE'S COUNTY")
        page.select_option(SEL_TYPE, label="STREET ADDRESS")
        page.click(SEL_CONT)
        page.wait_for_load_state("networkidle", timeout=20000)
        time.sleep(1)
        page.locator(SEL_NUM).fill(num)
        page.locator(SEL_NAME).fill(name)
        page.locator(SEL_NEXT).click()
        page.wait_for_load_state("networkidle", timeout=15000)
        time.sleep(2)

        body = page.inner_text("body")
        # Indicators
        on_form = "Enter Premises Address" in body
        # Look for table results structure
        tables = page.query_selector_all("table")
        max_rows = max([len(t.query_selector_all("tr")) for t in tables], default=0)
        # Look for property identifier patterns
        has_property_link = bool(page.query_selector("a[href*='ViewMap']") or page.query_selector("a[href*='AccountDetails']") or page.query_selector("a[href*='ViewParcel']"))
        # Look for "no results" text
        has_no_results = "no records found" in body.lower() or "no real property" in body.lower() or "0 records" in body.lower()

        print(f"\n[{label}] num={num!r} name={name!r}")
        print(f"  on_address_form={on_form} max_table_rows={max_rows} has_property_link={has_property_link} has_no_results={has_no_results}")
        if "no record" in body.lower() or "not found" in body.lower():
            # find that snippet
            i = body.lower().find("no record")
            if i < 0:
                i = body.lower().find("not found")
            print(f"  context: ...{body[max(0,i-100):i+200]}...")

        # Also search for 'Hanson' in body
        if "Hanson" in body or "HANSON" in body:
            i = body.find("Hanson") if "Hanson" in body else body.find("HANSON")
            print(f"  HANSON mention: ...{body[max(0,i-100):i+200]}...")

        page.screenshot(path=f"C:\\Users\\info\\MossEquityPartners-repo\\automations\\md-mortgage-research\\debug\\debug_attempt_{label}.png", full_page=True)
        browser.close()

attempt("with_num", "4044", "Hanson Oaks")
attempt("name_only", "", "Hanson Oaks")
attempt("upper", "4044", "HANSON OAKS")
attempt("partial", "", "Hanson")
