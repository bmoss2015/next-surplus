"""Ad-hoc smoke test: fetch one known MD case number via the Scrape.do provider.

Reports the HTTP status code Scrape.do passed through and whether the
DataDome disclaimer form / the case-search form inputs are present.
"""
import asyncio
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
sys.path.insert(0, str(ROOT))

from scrapers.case_search import (  # noqa: E402
    CASE_NUM_URL, SCRAPEDO_API_URL, _provider, _scrapedo_key,
)
from urllib.parse import urlencode  # noqa: E402

KNOWN_CASE = "C-16-CV-24-005892"  # Prince George's Co. circuit court


async def main() -> None:
    print(f"provider = {_provider()!r}")
    print(f"SCRAPEDO_API_KEY set = {bool(_scrapedo_key())}")

    params = {"caseId": KNOWN_CASE, "disclaimer": "Y", "action": "Search"}
    target_url = f"{CASE_NUM_URL}?{urlencode(params)}"
    print(f"target_url = {target_url}")

    sd_params = {
        "token": _scrapedo_key(),
        "url": target_url,
        "render": "true",
        "super": "true",
    }
    async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=30.0)) as c:
        r = await c.get(SCRAPEDO_API_URL, params=sd_params)

    print(f"\nHTTP status (Scrape.do passthrough) = {r.status_code}")
    print(f"response bytes = {len(r.content)}")
    body = r.text
    low = body.lower()

    disclaimer_markers = [
        "processdisclaimer", "i agree", "disclaimer", "name=\"disclaimer\"",
        "checkbox", "geo.captcha-delivery.com", "datadome",
    ]
    search_markers = [
        'name="caseid"', 'name="lastname"', 'name="firstname"',
        'name="countyname"', 'inquirysearch.jis', 'inquirybycasenum.jis',
    ]
    print("\n-- disclaimer / DataDome markers --")
    for m in disclaimer_markers:
        print(f"  {m:35s} {'PRESENT' if m in low else 'absent'}")
    print("\n-- search-form markers --")
    for m in search_markers:
        print(f"  {m:35s} {'PRESENT' if m in low else 'absent'}")

    print("\n-- first 600 chars of body --")
    print(body[:600])

    out = ROOT / "debug" / "scrapedo_case_response.html"
    out.write_text(body, encoding="utf-8", errors="replace")
    print(f"\nfull body written to {out}")


if __name__ == "__main__":
    asyncio.run(main())
