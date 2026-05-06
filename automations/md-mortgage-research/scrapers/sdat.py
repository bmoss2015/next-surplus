"""
Scraper for the Maryland State Department of Assessments and Taxation (SDAT) real property
search portal (https://sdat.dat.maryland.gov/RealProperty/).

Responsibilities (to be implemented):
    - Accept a property address or parcel ID and county.
    - Use Playwright to navigate SDAT's real property search, submit the query, and
      extract the full assessment record including owner name, mailing address, legal
      description, account identifier, and assessment history.
    - Return a structured dict suitable for downstream parsing and storage.
    - Handle CAPTCHA prompts, pagination, and session timeouts gracefully.

Usage example (future):
    record = await scrape_sdat(county="Baltimore City", address="123 Main St")
"""

from playwright.async_api import Page


async def scrape_sdat(county: str, address: str) -> dict:
    """Fetch SDAT real property record for the given county and address."""
    raise NotImplementedError
