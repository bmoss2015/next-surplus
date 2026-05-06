"""
Document parser that uses the Anthropic Claude API to extract structured information
from raw text or PDF content retrieved by the scrapers.

Responsibilities (to be implemented):
    - Accept raw document text (case docket entries, land record instruments, SDAT
      assessment pages) and send them to Claude with a structured extraction prompt.
    - Return strongly typed Python dicts (and eventually Pydantic models) containing
      fields such as: original loan amount, lender name, lien priority, sale date,
      surplus amount, redemption deadline, and identified claimants.
    - Support batch parsing of multiple documents in a single pipeline run, using
      prompt caching to reduce token costs on repeated boilerplate.
    - Log raw API responses alongside parsed output for audit purposes.

Usage example (future):
    parsed = await parse_document(raw_text="...", doc_type="mortgage_deed")
"""

import anthropic


async def parse_document(raw_text: str, doc_type: str) -> dict:
    """Send raw document text to Claude and return extracted structured fields."""
    raise NotImplementedError


async def parse_surplus_order(raw_text: str) -> dict:
    """Extract surplus amount, case reference, and deadline from an auditor's order."""
    raise NotImplementedError
