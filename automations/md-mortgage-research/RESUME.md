# MD Mortgage Research — Resume Notes

_Last updated: 2026-05-11_

## Current state

All three scrapers are working:

| Scraper | Source | Status |
|---|---|---|
| `scrapers/sdat.py` | Maryland SDAT (real property assessments) | working |
| `scrapers/land_records.py` | mdlandrec.net (deeds, deeds of trust) | working — authenticated via `MDLANDREC_EMAIL` / `MDLANDREC_PASSWORD` |
| `scrapers/case_search.py` | Maryland Judiciary Case Search | **working** — rewritten 2026-05-11 |

### case_search.py — rewrite summary

The old `casesearch.courts.state.md.us/casesearch/*.jis` HTML pages are gone; the
site is now a React SPA ("Case Portal 1.1") backed by a small REST API. `case_search.py`
now calls two **public, no-auth** JSON endpoints, both verified live against case
`C-16-CV-24-005892`:

- **Docket / case detail:** `GET /api-casedetails/v1/public/cases/{caseNumber}` →
  used by `get_case_docket()`. Returns case title, type, status, parties, attorneys,
  judgment events, and the full docket (`caseEventInfo`, 52 entries for the test case).
- **Name search:** `POST /api-caselist/v1/cases` with JSON body
  `{searchPartyType:"Person", lastName, firstName, middleName, businessName, county}` →
  used by `search_by_owner()` / `search_by_trustee()`. County must be the descriptive
  upper-case name (e.g. `"PRINCE GEORGE'S COUNTY"`); falls back to unfiltered + client-side
  filter if rejected.

**DataDome** protects both endpoints (plain HTTP → 403 `geo.captcha-delivery.com`).
Solved by routing every request through **Scrape.do** with `?token=...&url=...&super=true`
(residential proxy). `render` is **not** used — these are JSON APIs, no headless browser
needed. Key: `SCRAPEDO_API_KEY` env var. Bright Data Web Unlocker remains the configured
fallback provider.

All public function signatures (`search_by_owner`, `search_by_trustee`, `get_case_docket`)
are unchanged, so `main.py` and the rest of the pipeline are unaffected.

(Full API details — payload shapes, error envelope, the `/secure/...` Azure-AD mirrors —
are in Claude Code project memory: `md-case-portal-api.md`.)

## Current blocker

**None** — all three scrapers are working.

## Next action

Run a full end-to-end pipeline test with one real Maryland lead (owner name + county +
property address) through `main.py`: SDAT → land records → case search → docket → PDF
parse → surplus estimate → decision logic. Confirm each stage produces sane output and
the Supabase writes land.
