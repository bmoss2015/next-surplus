"""
Scraper for the Maryland Judiciary Case Search portal (https://casesearch.courts.state.md.us/).

Responsibilities (to be implemented):
    - Accept a defendant name, case number, or property address to locate foreclosure
      (mortgage) cases filed in Maryland circuit courts.
    - Use Playwright to navigate the public case search interface, parse case metadata
      (filing date, parties, attorney info, case status), and collect all associated
      docket entries.
    - Follow links to retrieve individual docket entry documents where available.
    - Return a structured representation of the case suitable for surplus analysis.

Usage example (future):
    case = await scrape_case(case_number="C-03-CV-23-000123")
"""

from playwright.async_api import Page


async def scrape_case(case_number: str) -> dict:
    """Fetch case docket and metadata from Maryland Judiciary Case Search."""
    raise NotImplementedError


async def search_cases_by_name(defendant_name: str, county: str) -> list[dict]:
    """Search for foreclosure cases by defendant name and county."""
    raise NotImplementedError
