# Telnyx 10DLC API reference

Verified 2026-06-26 from https://developers.telnyx.com/docs/messaging/10dlc/quickstart

## Brand creation

**Endpoint:** `POST https://api.telnyx.com/v2/10dlc/brand`

**Required body fields:**

| Field | Type | Notes |
|---|---|---|
| entityType | string | `PRIVATE_PROFIT`, `PUBLIC_PROFIT`, `NON_PROFIT`, or `GOVERNMENT` |
| displayName | string | Public-facing brand name |
| companyName | string | Legal company name |
| ein | string | 9 digits, no dash |
| phone | string | E.164 format |
| street | string | |
| city | string | |
| state | string | 2-letter US |
| postalCode | string | |
| country | string | 2-letter (US) |
| email | string | Authorized rep email |
| vertical | string | TCR vertical enum |

**Response:** `data.brandId` (string) — store on `a2p_brand_registrations.telnyx_brand_id`.

## Campaign creation

**Endpoint:** `POST https://api.telnyx.com/v2/10dlc/campaignBuilder`

**Required body fields:**

| Field | Type | Notes |
|---|---|---|
| brandId | string | From the brand response |
| usecase | string | `CUSTOMER_CARE`, `MARKETING`, `ACCOUNT_NOTIFICATION`, `MIXED`, `LOW_VOLUME` |
| description | string | Campaign purpose |
| sample1 | string | Required sample message |
| sample2 | string | Required second sample message |
| messageFlow | string | Opt-in flow description |
| helpMessage | string | Response sent on HELP keyword |
| optinKeywords | string | Comma-separated, e.g. "START,YES" |
| optoutKeywords | string | Comma-separated, e.g. "STOP,END,CANCEL" |
| helpKeywords | string | Comma-separated, e.g. "HELP,INFO" |
| embeddedLink | boolean | true if messages contain URLs |
| numberPool | boolean | true if pool across many numbers |
| ageGated | boolean | true if 21+ content |

**Response:** `data.campaignId` (string) — store on `a2p_campaign_registrations.telnyx_campaign_id`.

## Reseller (Partner Campaign API) note

When the Reseller ID lands from Telnyx Partner enrollment, every brand + campaign POST should include the Reseller ID as a header or top-level field per Telnyx's Partner program docs (URL TBD). Until then, submissions go in under the parent Telnyx account directly.
