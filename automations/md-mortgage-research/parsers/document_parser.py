"""
Document parser: sends PDFs to the Claude API and returns structured data.

Uses pdfplumber for text extraction.  When a PDF has low text yield (scanned
image), falls back to the Claude vision API by rendering the PDF as images via
PyMuPDF (fitz).  If PyMuPDF is unavailable, returns a partial result with a
warning.

Each public function:
  1. Extracts text (or images) from the PDF
  2. Sends to Claude with a document-type-specific system prompt
  3. Returns structured fields + raw_text for audit purposes

Model: claude-sonnet-4-6  (update _MODEL if a newer Sonnet is preferred)
"""

import asyncio
import base64
import json
import logging
import re
from pathlib import Path
from typing import Optional

import anthropic

logger = logging.getLogger(__name__)

_MODEL = "claude-sonnet-4-6"
_LOW_TEXT_THRESHOLD = 100  # chars — below this we treat the PDF as scanned
_MAX_PAGES_FOR_VISION = 10  # cap vision fallback to avoid huge token bills


def _get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env


# ---------------------------------------------------------------------------
# PDF text / image extraction
# ---------------------------------------------------------------------------

def _extract_text(pdf_path: str) -> str:
    """Extract text from a PDF using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            pages = [p.extract_text() or "" for p in pdf.pages]
        return "\n\n".join(pages).strip()
    except ImportError:
        logger.warning("pdfplumber not installed; text extraction unavailable")
        return ""
    except Exception as exc:
        logger.warning("pdfplumber error on %s: %s", pdf_path, exc)
        return ""


def _pdf_to_images_b64(pdf_path: str, max_pages: int = _MAX_PAGES_FOR_VISION) -> list[str]:
    """
    Render each page of a PDF to a base64-encoded PNG using PyMuPDF.
    Returns empty list if PyMuPDF is unavailable.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        logger.warning("PyMuPDF not installed; vision fallback unavailable")
        return []
    try:
        doc = fitz.open(pdf_path)
        images: list[str] = []
        for page_num in range(min(len(doc), max_pages)):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=150)
            png_bytes = pix.tobytes("png")
            images.append(base64.standard_b64encode(png_bytes).decode())
        doc.close()
        return images
    except Exception as exc:
        logger.warning("PDF to image conversion failed: %s", exc)
        return []


def _build_content(pdf_path: str) -> tuple[list, str]:
    """
    Return (message_content_blocks, raw_text) for the given PDF.

    Tries text extraction first; falls back to vision if text is too short.
    """
    raw_text = _extract_text(pdf_path)

    if len(raw_text) >= _LOW_TEXT_THRESHOLD:
        content = [{"type": "text", "text": raw_text[:100_000]}]
        return content, raw_text

    logger.info("Low text yield (%d chars) — using vision fallback for %s", len(raw_text), pdf_path)
    images = _pdf_to_images_b64(pdf_path)
    if not images:
        content = [{"type": "text",
                    "text": raw_text or "(PDF text extraction failed — pdfplumber or PyMuPDF required)"}]
        return content, raw_text

    content = []
    for b64 in images:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": b64},
        })
    return content, raw_text


# ---------------------------------------------------------------------------
# Internal Claude call
# ---------------------------------------------------------------------------

async def _call_claude(system_prompt: str, content_blocks: list, extra_instruction: str = "") -> str:
    """Send content to Claude and return the raw text response."""
    client = _get_client()
    user_text = (
        "Extract the structured fields from this document and return them as a "
        "valid JSON object with no markdown fencing. " + extra_instruction
    )
    messages = [
        {
            "role": "user",
            "content": content_blocks + [{"type": "text", "text": user_text}],
        }
    ]

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.messages.create(
            model=_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        ),
    )
    return response.content[0].text.strip()


def _parse_json_response(raw: str) -> dict:
    """Strip markdown fences and parse JSON; return raw string on failure."""
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Claude returned non-JSON; wrapping in raw_response key")
        return {"raw_response": raw, "parse_error": "Claude response was not valid JSON"}


# ---------------------------------------------------------------------------
# Public parse functions
# ---------------------------------------------------------------------------

async def parse_deed_of_trust(pdf_path: str) -> dict:
    """
    Extract structured fields from a Deed of Trust / Mortgage instrument.

    Returns:
        ``original_loan_amount``, ``lender_name``, ``borrower_name``,
        ``note_date``, ``maturity_date``, ``original_trustee``,
        ``property_address``, ``raw_text``.
    """
    content_blocks, raw_text = _build_content(pdf_path)
    system = (
        "You are a real estate document analyst specializing in Maryland deeds of trust. "
        "Extract the following fields and return ONLY a JSON object:\n"
        "- original_loan_amount (string, include $ and commas)\n"
        "- lender_name (string)\n"
        "- borrower_name (string, full name)\n"
        "- note_date (string, MM/DD/YYYY)\n"
        "- maturity_date (string, MM/DD/YYYY or null)\n"
        "- original_trustee (string or null)\n"
        "- property_address (string, full address from legal description)\n"
        "Use null for any field not found in the document."
    )
    raw_response = await _call_claude(system, content_blocks)
    result = _parse_json_response(raw_response)
    result["raw_text"] = raw_text[:5000]
    return result


async def parse_substitution_of_trustee(pdf_path: str) -> dict:
    """
    Extract structured fields from a Substitution of Trustee document.

    Returns:
        ``substitute_trustees`` (list), ``original_lender``,
        ``current_holder``, ``file_number``,
        ``deed_of_trust_book_page_reference``, ``recording_date``,
        ``raw_text``.
    """
    content_blocks, raw_text = _build_content(pdf_path)
    system = (
        "You are a real estate document analyst specializing in Maryland foreclosure documents. "
        "Extract the following fields from this Substitution of Trustee and return ONLY a JSON object:\n"
        "- substitute_trustees (array of strings, full names)\n"
        "- original_lender (string)\n"
        "- current_holder (string, the current note/mortgage holder authorizing the substitution)\n"
        "- file_number (string, internal lender file or loan number)\n"
        "- deed_of_trust_book_page_reference (string, e.g. 'Book 12345 Page 678')\n"
        "- recording_date (string, MM/DD/YYYY or null)\n"
        "Use null for any field not found."
    )
    raw_response = await _call_claude(system, content_blocks)
    result = _parse_json_response(raw_response)
    result["raw_text"] = raw_text[:5000]
    return result


async def parse_trustees_deed(pdf_path: str) -> dict:
    """
    Extract structured fields from a Trustee's Deed (post-foreclosure sale).

    Returns:
        ``substitute_trustees`` (list), ``buyer_name``, ``sale_price``,
        ``sale_date``, ``property_legal_description``, ``case_number_referenced``,
        ``raw_text``.
    """
    content_blocks, raw_text = _build_content(pdf_path)
    system = (
        "You are a real estate document analyst specializing in Maryland foreclosure sales. "
        "Extract the following fields from this Trustee's Deed and return ONLY a JSON object:\n"
        "- substitute_trustees (array of strings, the grantors/trustees who conducted the sale)\n"
        "- buyer_name (string, the grantee/purchaser)\n"
        "- sale_price (string, include $ and commas; this is the recited consideration)\n"
        "- sale_date (string, MM/DD/YYYY, the date of the foreclosure auction)\n"
        "- property_legal_description (string, the full legal description)\n"
        "- case_number_referenced (string, the Circuit Court case number or null)\n"
        "Use null for any field not found."
    )
    raw_response = await _call_claude(system, content_blocks)
    result = _parse_json_response(raw_response)
    result["raw_text"] = raw_text[:5000]
    return result


async def parse_lien(pdf_path: str) -> dict:
    """
    Extract structured fields from a lien instrument (judgment, IRS, HOA, etc.).

    Returns:
        ``lien_holder``, ``lien_amount``, ``lien_type``, ``recorded_date``,
        ``debtor_name``, ``raw_text``.
    """
    content_blocks, raw_text = _build_content(pdf_path)
    system = (
        "You are a real estate document analyst specializing in Maryland lien instruments. "
        "Extract the following fields and return ONLY a JSON object:\n"
        "- lien_holder (string, creditor/plaintiff name)\n"
        "- lien_amount (string, include $ and commas)\n"
        "- lien_type (string, e.g. 'Judgment Lien', 'IRS Tax Lien', 'HOA Lien', 'Mechanics Lien')\n"
        "- recorded_date (string, MM/DD/YYYY)\n"
        "- debtor_name (string, the defendant or debtor)\n"
        "Use null for any field not found."
    )
    raw_response = await _call_claude(system, content_blocks)
    result = _parse_json_response(raw_response)
    result["raw_text"] = raw_text[:5000]
    return result


async def parse_auditor_report(pdf_path: str) -> dict:
    """
    Extract structured fields from a Maryland Circuit Court Auditor's Report.

    Returns:
        ``total_sale_proceeds``, ``trustee_commission``, ``attorney_fees``,
        ``court_costs``, ``mortgage_payoff``, ``junior_liens`` (list),
        ``surplus_to_owner``, ``distribution_summary``, ``raw_text``.
    """
    content_blocks, raw_text = _build_content(pdf_path)
    system = (
        "You are a real estate document analyst specializing in Maryland foreclosure auditor's reports. "
        "Extract the following fields and return ONLY a JSON object:\n"
        "- total_sale_proceeds (string, include $)\n"
        "- trustee_commission (string, include $)\n"
        "- attorney_fees (string, include $)\n"
        "- court_costs (string, include $)\n"
        "- mortgage_payoff (string, first mortgage payoff amount, include $)\n"
        "- junior_liens (array of objects with fields: creditor, amount, lien_type)\n"
        "- surplus_to_owner (string, balance due to former owner, include $)\n"
        "- distribution_summary (string, brief narrative)\n"
        "Use null for missing fields. Use '$0.00' for confirmed zeros."
    )
    raw_response = await _call_claude(system, content_blocks)
    result = _parse_json_response(raw_response)
    result["raw_text"] = raw_text[:5000]
    return result


# ---------------------------------------------------------------------------
# Convenience dispatcher
# ---------------------------------------------------------------------------

_PARSE_MAP = {
    "deed_of_trust": parse_deed_of_trust,
    "mortgage": parse_deed_of_trust,
    "substitution_of_trustee": parse_substitution_of_trustee,
    "trustees_deed": parse_trustees_deed,
    "lien": parse_lien,
    "auditor_report": parse_auditor_report,
}


async def parse_document(pdf_path: str, doc_type: str) -> dict:
    """
    Dispatch to the correct parser based on *doc_type*.

    Args:
        pdf_path: Path to a PDF file.
        doc_type: One of ``deed_of_trust``, ``mortgage``,
                  ``substitution_of_trustee``, ``trustees_deed``,
                  ``lien``, ``auditor_report``.
    """
    key = doc_type.lower().replace(" ", "_").replace("-", "_")
    fn = _PARSE_MAP.get(key)
    if fn is None:
        return {"error": "unknown_doc_type",
                "message": f"No parser for doc_type={doc_type!r}. "
                           f"Choose from: {list(_PARSE_MAP)}"}
    return await fn(pdf_path)
