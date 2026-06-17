# Changelog

All notable changes to Moss Equity Partners - Web App are tracked in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The Living Doc auto-generation worker (`moss-equity-living-doc` on Cloudflare) reads this file on a weekly cron and on manual `/regenerate` POSTs.

Versions below are grouped by day rather than semver release tags. Each `## [YYYY-MM-DD]` block represents the work merged to `main` on that calendar day. Backfilled from git log on 2026-05-26.


## [Unreleased]


### Added
- chore(brand): Next Surplus logo + favicon pack deployed to `public/`. Replaces the default Next.js mark in the browser tab and on home-screen installs. Favicon set (`favicon.ico`, `favicon-16/32/48.png`), Apple touch icon (`apple-touch-icon.png`), and Android home-screen icons (`android-chrome-192x192.png`, `android-chrome-512x512.png`) wired through `Metadata.icons` in `src/app/layout.tsx`. New `public/manifest.json` registers theme color #04261c and background #faf7f2 for PWA installs. Ten brand SVGs (icon, lockup horizontal/stacked, wordmark, circle marks in light + dark) staged at `public/brand/` for future component swaps. Open Graph block added pointing at `https://nextsurplus.com/og-image.png`; `public/og-image.png` (1200x630) now committed so social shares render. (2026-06-16T23:00:00-05:00)

### Removed
- Fix 14: Standard monthly tier ripped out of the codebase. `priceIdFor` no longer accepts `"standard"` and the `STRIPE_STANDARD_MONTHLY_PRICE_ID` env var is gone. `/api/cron/founder-lock-expiration` is now a renewal heads-up only, no auto-promotion at month 12. Landing mockup pricing blocks (v3, v4, v5) realigned to the $49 Founders Rate. `scripts/setup-stripe-products.mjs` provisions only `beta_founder_monthly` and `beta_founder_annual`. Stripe Dashboard `standard_monthly` price archived in live mode. (2026-06-16T22:30:00-05:00)


### Added
- Fix 10c: Landing v1 FAQ rewrite v6. Cuts the FAQ from nine questions to six and reframes every remaining question against Pipedrive, HubSpot, Monday CRM, Close, and Copper FAQ patterns. Drops every Q whose answer is already visible in the pricing card or feature grid above (Who Built This, Is The Development Team Active, How Much Does Next Surplus Cost, Is There A Free Trial, What Is Included). Drops the Email / Gmail question entirely; email sync is plumbing, not a landing-page differentiator. Adds How Quickly Can I Get Started, Can I Import Leads From My Current System, Are There Per Seat Fees Or Add Ons, and What Kind Of Support Do You Offer. Reframes How Is My Data Protected and Can I Cancel My Subscription. Title Case headers throughout per design rules; no "coming soon" language. (2026-06-16T21:30:00-05:00)
- Fix 13: Stripe billing integration. New `/api/stripe/create-checkout-session` creates a subscription Checkout Session at the price ID matching the org's `plan_tier` (founder or beta_founder monthly/annual) with a 14 day trial. `/api/webhooks/stripe` verifies `STRIPE_WEBHOOK_SECRET` and handles `customer.subscription.created/updated/deleted`, `invoice.paid`, and `invoice.payment_failed`, writing `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, and `last_invoice_paid_at` to `orgs`. `/api/stripe/create-portal-session` hands customers off to the Stripe Customer Portal. A daily cron at `/api/cron/founder-lock-expiration` (12:00 UTC) emails beta_founder admins at the 10 month mark as a renewal heads-up. Migration 0151 adds the Stripe columns + unique partial indexes; vercel.json registers the cron. (2026-06-16T20:00:00-05:00)
- Fix 12: plan_tier schema + Founder Rate cutoff. New `plan_tier_enum` (founder / beta_founder / standard) on `orgs` with a BEFORE INSERT trigger that reads `app_pricing_config.founder_cutoff_date` to assign beta_founder if the founder window is open and standard once it closes. `app_pricing_config.founder_cutoff_date` seeded to current_date + 60 days as a placeholder (Bree to confirm 30/45/60). Existing Moss Equity Partners org pinned to founder tier so the cron never auto-promotes it. Migration 0150. (2026-06-16T20:00:00-05:00)
- Fix 10b: Landing v1 FAQ rewritten to match shipped product reality. Removes the Physical Mail Q (feature retired) and the Data Isolation Q (engineering hygiene, not a customer benefit). Adds Founders Rate Q and Getting Started Q. Email Provider Q corrected to Gmail today with Outlook + IMAP next. Pricing block on `/landing/v1` updated to $49 / Founders Rate (Limited Window) with bullets aligned to current scope (no Plaid, no physical mail, Gmail only). (2026-06-16T20:00:00-05:00)

### Changed
- Fix 7: Legal pages (/privacy, /terms) pull subscription pricing from `app_pricing_config` at render time instead of hardcoding a dollar literal. Terms loses the Metered Billing for Physical Mail subsection (3.3), the Physical Mail section (6) entirely, and the 30 day read only window after cancellation, with subsequent sections renumbered. Section 7 Email becomes Email Integration with a Gmail-today / Outlook + IMAP coming statement. Privacy drops the Plaid subsection (1.3), the mail / sending-mail / bank-verification bullets in How We Use, the Plaid + Mail delivery rows in How We Share, the "Disconnect bank account" right, the Lead Data 30 day deletion promise (deletion flow not built), and the entire Account Deletion section, with subsequent sections renumbered. New CI workflow `legal-no-hardcoded-prices.yml` runs `scripts/check-legal-no-hardcoded-prices.mjs` on every PR touching `src/app/(legal)/**` and fails the build if any `$NN` literal sneaks back into the legal page sources. (2026-06-16T20:00:00-05:00)
- Fix 6: `app_pricing_config.subscription_monthly_cents` lowered from 7900 to 4900 for the Founders Rate window. Migration 0149. (2026-06-16T20:00:00-05:00)

- Fix YYYY4 part 9: Dashboard Pipeline Funnel adopts the narrowing-trapezoid layout (Option C from the mockup set). Open stages render as a centered top-to-bottom funnel with each row narrower than the last (100% to 38% width) and a petrol gradient. Won and Lost split out as separate outcome cards centered below the funnel so the visual stays honest, those are outcomes, not stages. Replaces the previous uniform horizontal-bar funnel. (2026-05-28T15:00:00-05:00)
- Fix YYYY4 part 3: Lead Kanban + advanceStage refactor for custom stages. `fetchKanbanLeads` returns the workspace's `org_stages` + leads grouped by `stage_id`. KanbanBoard renders dynamic columns from the configured stages, derives the column header dot color from `kind` (open=petrol, won=success, lost=gray), and tints Won/Lost column headers. Drag-and-drop now writes `stage_id`. `advanceStage` accepts either a stage UUID (new) or a legacy stage enum string (backward-compat for StageActions + StageProgressStrip until they're refactored next). Lead.stage enum column is still dual-written when the target maps to a known seed name, so any code still reading `lead.stage` keeps working. (2026-05-27T20:00:00-05:00)
- Fix YYYY4 part 2.2: Drop position unique constraint on `org_stages` so multi-row reorder updates don't trip duplicate-key errors. Position uniqueness is enforced by the app instead.
- Fix YYYY4 part 2: Settings stages manager with admin-only gating. New "Stages" card in the Settings → Leads → Pipeline panel (drag-reorder, inline rename, outcome dropdown, safe-delete that pre-counts affected leads and forces a "move to" pick when N > 0). `requireAdmin()` at the top of every CRUD action; UI hides write controls for non-admin viewers.

- Fix YYYY4 part 1: Custom stages schema + server query layer. New `org_stages` table (org_id, name, position, kind, is_active) with hidden `stage_kind` enum (open/won/lost). Migration seeds the 9 current default stages per existing org and adds a `stage_id` FK on the leads table backfilled from the existing enum. New `OrgStage` types, `fetchOrgStages` server query, and CRUD server actions (create/update/reorder/delete with safe-delete: blocks if leads use the stage unless caller provides a fallback stage; blocks deleting the only stage of a given kind). No UI yet. (2026-05-27T19:00:00-05:00)

### Removed
- Fix YYYY4 part 12: Pipeline Funnel section pulled from the dashboard. After multiple iterations (uniform bars, narrowing trapezoid v1, narrowing trapezoid v2 with proportional fills + Won-as-point), none of them landed. Section removed entirely, will revisit. The funnel-options.html mockup at moss-equity-mockups.vercel.app/funnel-options.html is kept (4 design directions + a 20-stage scaling check) for the future pass. KPI tiles (Pipeline Value, Won 30 Days, Win Rate, Overdue Tasks) and the rest of the dashboard are untouched. (2026-05-28T16:00:00-05:00)

### Fixed
- Fix AAAA5: `/inbox` is now scoped to the signed-in user's own connected accounts. Previously the global Inbox showed every conversation the org could see, so a teammate's lead-linked Gmail threads piled into other teammates' Inboxes (the RLS hybrid policy is correct for org-wide visibility on a lead's Conversations tab, but the global Inbox query was missing the per-user filter on `channel_account_id`). Adds `fetchOwnChannelAccountIds` and an `.in("channel_account_id", own)` constraint on `fetchInboxThreads` (when no `leadId`) and `fetchInboxFilterCounts`. Lead → Conversations tab is unaffected because it passes `leadId` and uses a separate lead-filtered messages query. Side benefit: silent click-no-op on shared threads is gone, since every thread shown in `/inbox` now matches an account in the caller's `fetchMyEmailAccounts` list, so `accountForReader` always resolves and the ThreadReader actually renders. (2026-05-28T20:00:00-05:00)
- Fix ZZZZ4: Deleting a saved bank account in Settings now propagates to Lob. Previously `deleteMailBankAccount` only removed the local `mail_bank_accounts` row, leaving the Lob bank account record alive on the provider side. Repeated add / delete cycles accumulated orphan accounts in Lob (visible in the Lob event log), and each orphan continued sending its own microdeposit pair to the customer's bank, making reconciliation impossible. New `lobDeleteBankAccount(bnkId)` helper calls `DELETE /v1/bank_accounts/{id}`. The settings action looks up the row first, calls Lob (treating 404 as success so already-cleaned-up accounts don't block), and only deletes the local row if Lob succeeded. Stub IDs from the test harness (prefix `bnk_stub_`) skip the API call. (2026-05-28T09:00:00-05:00)


### Changed
- Fix XXXX4: Lead-detail stage strip switches to a horizontally scrollable layout with the current stage auto-centered on mount. Current stage gets a larger ring + brand-color label so it reads instantly. Stages stay clickable for jump-to-stage. Works the same at 5 stages or 50, no auto-switching modes. Sets up custom stages (the next branch) to render correctly at any count without further work. (2026-05-27T18:00:00-05:00)

### Added
- Fix WWWW4: Playbooks board. Cross-lead Kanban view of any research template. `/playbooks` lists every template with its active lead count; `/playbooks/[id]` renders the per-template board with one column per step and cards for each lead currently sitting on that step. "Current step" = first incomplete step in the lead's snapshotted checklist. Days-in-step flags red past 7 days. No schema work, uses the existing `lead_research_templates` table. Preview via URL for now, no nav item yet. (2026-05-27T16:30:00-05:00)

### Fixed
- Fix WWWW5: drop orphan `lead_latest_activity` view from staging (left over from abandoned Branch 1) and renumber the stuck `0120_revert_clearout_validations.sql` to `0135_revert_clearout_validations.sql` so it can finally apply. Migration content is unchanged: same Clearout-validated phone reset. Both pushed to staging. (2026-05-27T12:00:00-05:00)


### Changed
- chore(docs): restructure roadmap with quarter labels, move technical content to ARCHITECTURE.md (2026-05-26T15:57:32-05:00)
- chore(docs): add Plaid bank verification to Q3 + ADR-015 for Plaid on Lob funding (2026-05-26T16:44:34-05:00)

### Changed
- chore(docs): add /roadmap and /architecture slash commands with skill (2026-05-26T16:04:31-05:00)

### Fixed
- fix: add required YAML frontmatter to roadmap skill (2026-05-26T16:21:07-05:00)
- Fix WWWW4 v2: Playbooks index Pattern C layout (2026-05-27T08:51:39-05:00)
- Fix WWWW4 v3: pack name+metrics, card-per-row Pattern C (2026-05-27T08:56:06-05:00)
- Fix WWWW4 v4: Add Playbooks to top nav (2026-05-27T09:00:09-05:00)
- Fix WWWW4 v5: Rename Research -> Playbook + lead-context View Board (2026-05-27T09:04:14-05:00)
- Fix: Restore useState import in MailBankAccountsSection (2026-05-27T08:30:08-05:00)
- Fix: In-app modal for bank account delete confirm (2026-05-27T08:37:16-05:00)
- Fix: Accept Account Holder placeholder with Right Arrow or Tab (2026-05-27T08:39:11-05:00)
- Fix: Accept Account Holder placeholder with Right Arrow or Tab (2026-05-27T08:39:11-05:00)

### Fixed
- Fix WWWW4: Playbooks board (cross-lead template-step Kanban) (2026-05-27T08:29:16-05:00)
- Fix: Confirm before deleting bank account (2026-05-27T07:57:56-05:00)

## [2026-05-26] - 2026-05-26

### Changed
- chore: bootstrap CHANGELOG.md and pending-living-doc-updates.txt

## [2026-05-25] - 2026-05-25

### Changed
- Gate Preview & Send button on unresolved address issues
- Block send on USPS auto-corrections; rename Verified pill to Auto-corrected
- Show "Verified" pill always; surface USPS auto-corrections on deliverable rows
- Restore on-open verification, cache-aware (Option B)
- Move address verification off the Send Mail hot path
- Per-contact address verification cache; remove Send anyway escape hatch
- "Send anyway" escape hatch + suppress bogus staging issue text

### Fixed
- Don't offer half-broken corrected addresses
- Bounce back to form + auto-open fix panel on undeliverable error
- Address-fix popover: show why + apply Lob's suggestion in one click

### Removed
- Strip provider name from user-facing copy; verify upfront; hide green pills

## [2026-05-24] - 2026-05-24

### Added
- Owner Reports + pre-flight verification toggle
- Migration 0127: bake address verification into customer pricing

### Changed
- Admin debug page: /admin/mail-debug shows real DB state of mail_jobs
- Webhook gate: ignore in-flight events arriving within 5min of sent_at
- Webhook ignores in-flight events in test mode
- Loosen check preview fetch: auth header + drop content-type gate
- Robust contact_id match for mail_count; sample-aware check preview
- Check sample full-width footer; always-processing on send; sticky 10s success banner; strip Lob refs
- Lead Mail tab sorts newest first; check sample memo + signature layout
- PDF cache for docx renders; mail_count for repeat-mail chip
- Unify "Processing" -> "Printing" everywhere; fix stale MailStatusPill labels
- Make preview letter page visible; left-align envelope recipient lines
- LetterThumbnail lazy fetch; check sample preview; pre-flight checks; View Letter + Track wiring
- Promote Processing to a real status; fix filter/pill/banner audit
- Audit fixes: View Letter + View Check, Processing pill, fixed status column, clean Send close
- Move Send Letter into preview pane; strip stray pricing labels
- Show seeded sample mail data; clarify CASS vs NCOA in pricing
- Reassign-and-remove flow for Lost Reasons + Contact Roles; pill in own column
- ci: make lint step non-blocking until pre-existing debt is cleared
- Outstanding items: notifications save bar, org roles, research desc + state dropdown, preflight toggle

### Fixed
- Fix MailStatus type drift; remove print-schedule promise; seeder batch -> processing
- Tolerate pre-migration state for PDF cache + mail_count
- Sticky error banners + auto-scroll on error; strip MICR dots overlapping memo
- Docx + check supported; preview pane error gets prominent banner
- Prominent error banner; clear on recipient toggle
- Fix Include Check crash: cn() called without import
- Simplify status meta line; preserve newlines / paragraph breaks in body_html
- Fix Word/.docx template sends - route through Gotenberg + Lob multipart
- fix: annotate React 19 hooks errors at every existing site (0 errors)
- fix: clear 50 lint errors (50 → 0), make CI lint step blocking
- Error preview harness; states combobox; remove multi-inbox button

### Removed
- Remove Certified mail class; strip Lob branding from check sample; fix field overlap; remove cost estimate
- Remove pre-flight verification toggle (always on); fix Send Mail bugs

## [2026-05-23] - 2026-05-23

### Added
- Customer Pricing module + Lob-only letter routing
- Owner role + /owner area with first panel (Provider Costs)

### Changed
- States picker; Attorney + Email + Lost Reasons UX
- Lob retries + plan-cap alerts + pill alignment
- Defaults panel into save bar; UX polish
- Status pill closer to name; /reports/mail back to customer view
- Save-bar wiring: Profile + Mail Settings; mail dashboard polish
- Friendly mail errors + reports margin view + errors-tracker stub
- HTML body > 6 sheets + View Letter docx wiring
- Production-readiness pass: idempotency, audit, self-heal, alerting
- Wire Company Profile to the global save bar
- Unified save bar + drop SuperDoc from preview path
- 6-sheet USPS surcharge: warn + bill end-to-end
- Mail + Customer Pricing polish per Bree's review
- Mail dashboard + Customer Pricing UI cleanup
- Fix certified pricing source + drop Quick Math footer
- Owner: simplify Customer Pricing panel, match Settings rail style

### Fixed
- Fix: letter_over_6_sheet_fee silently wiped on Save in Owner UI

## [2026-05-22] - 2026-05-22

### Added
- Phone validation: provider-scoped stats + env-driven cost + transient retry
- Phone validation: always trust provider's line_type over existing value
- Add: phone validation test harness + Other Contacts call/email links
- Phone validation: drop same-lead duplicate block, refresh Billing meter
- Phone validation: org-wide cache + same-lead duplicate block
- Phone validation: kill broken pre-check, add pre-count modal, scrub copy

### Changed
- mail: wire Fix & Resend, Lob address verify, Lob pricing settings, em dash sweep
- mail: filter toolbar on /mail + drop redundant V11 status pill + add V11 Fix & Resend
- mail(v11): color the lead Mail tab meta icons + make tracking number clickable
- mail(v6): use solid ink pill for In Transit (three distinct pill weights)
- Billing: strip provider-specific copy from the credit balance card
- Billing: live Clearout balance + intra-batch phone dedup + carded sections

### Fixed
- Fix 95: View Letter, Track, Fix & Resend share min-w-[110px] button family
- Fix 94: V6 + V11 pill sizes match MailStatusPill standard
- Fix 93: Real V6 + V11 build replacing /mail and lead MailTab
- Fix 92: V11 letter portrait + V6 batch row matches solo affordance
- Fix 91: V6 - strip onClick handlers from buttons inside Link wrapper
- Fix 90: V6 row info hierarchy, color separation, V11 lead combo
- Fix 89: V6 row legibility overhaul + batch grouping + Returned section
- Fix 88: V2 card meta + buttons anchored on Linear / Attio property style
- Fix 87: V6 drop Action Required, add V9 activity stream, V10 swimlanes
- Fix 86: V2 card uses horizontal space + tinted action buttons
- Fix 85: Apply V4's green button style + active-row highlight to V2 lead
- Fix 84: V2 card shrink, V6 deprorted
- Fix 83: V2 lead polish + V6/V7/V8 main /mail mockups
- Fix 82: V2 revised + V4 split-pane inbox + V5 timeline mockup
- Fix 81: Three from-scratch mail redesign mockups + delete Needs Attention subhead
- Fix 80: Auto-refreshing Lob pricing (weekly cron + drift alerts)
- Fix: Add Relative flow shows phone as Not Verified despite validation
- Fix 79: Drawer cleanup, address picker on resend, no delete button
- Fix: Add Owner flow shows phone as Not Verified despite successful validation
- Fix 78: Lead Mail tab gets its own design (compose + history sections)
- Fix 77: Match Settings Members pill style, kill scroll-to-top + redundant banner
- Fix 76: Lob admin-editable pricing + pre-send address verify utility
- Fix 75: Lead Mail tab redirect bug + drop avatars + typographic stat banner
- Fix 74: Failure-handling proposal + provider integration script
- Fix 73: Lob cost lookup + visual redesign + recipient subline + name strip
- Fix: Swap phone validation from Veriphone to Clearout Phone
- Fix 72: Drawer polish + Needs Attention scope + resend cancel/save
- Fix 0121: Note anchor highlight - brand emerald + inset ring + breathing padding
- Fix 0120: Mention email - switch teal to brand emerald (#0d4b3a)
- Fix 71: Sample data distributed across leads by stage
- Fix 70: Lob cost honesty + Needs Attention section + search polish
- Fix 69: Mail Activity report - accurate costs, range filter, transparency
- Fix 68: Seed bug + clean sample names + Linear-style status
- Fix 67: Drop Failed from UI, fix Tracking alignment, sweep stale rows
- Fix: Account popout escapes sidebar via portal
- Fix 66: Mail UX polish - sample data, no failed-spam, lead Mail tab
- Fix 65: Mail tracking - A-grade overhaul (drill-in, batches, resend, report)
- Fix 64: Mail send harness + bell notifications on mail status

### Removed
- Pause phone validation + revert Clearout-stamped rows

## [2026-05-21] - 2026-05-21

### Added
- Mailing Address: instant UI on save + visually attached to lead-party row
- + Add Mailing Address on every card (owner, relative, lead-party)
- Multi-address support for relatives + lead parties
- Settings clone · Phase E.7: admin vs member access model
- Settings clone · Phase E.4-E.6: signature upload + merge picker + backfill
- Settings clone · Phase E.3: wire avatar + logo + EIN + time zone
- Settings clone · Phase E.2: cleanup - drop dead routes, scaffolding, and orphaned components
- Settings clone · Phase E.1: swap /settings to the new UI (outside-AppShell)
- Settings clone · Phase D.4: Template editor drawer (Email / SMS / Research)
- Settings clone · Phase D.3: Bank Account add + verify-deposits + delete
- Settings clone · Phase D.2: Members invite drawer + per-row role/remove menu
- Settings clone · Phase D.1: shared Drawer shell + Attorney add/edit drawer
- Settings clone · Phase C.7b: Notifications wiring + Bank/Billing differentiation
- Settings clone · Phase C.7: Billing rebuild + Pipeline alignment fix
- Settings clone · Phase C.6b: unconstrain section-desc width
- Settings clone · Phase C.6: design fixes from first-round review
- Settings clone · Phase C.5: wire Mail Bank Accounts + Templates + Billing
- Settings clone · Phase C.4: wire Company Profile + Security + Mail Settings
- Global search: pro polish + net-payout column realigned (#1)
- Settings clone · Phase C.3: wire Attorneys + Members + Contact Roles + Email Accounts
- Settings clone · Phase C.2: wire Defaults + Pipeline & Lost Reasons
- Settings clone · Phase C.1: wire Profile to real data
- Settings clone · Phase B.4-B.20: all remaining panels as JSX
- Settings clone · Phase B.3: JSX shell + Profile panel at /settings-preview-jsx
- Settings clone · Phase B.2: lift mockup CSS into preview.css
- Settings clone · Phase A.1: silence hydration warning on preview
- Global search: phone-format flexibility + date parsing
- Global search: numeric amounts + enum labels + parcel_number
- Settings clone · Phase A: pixel clone via dangerouslySetInnerHTML
- Global search: full state names map to 2-letter codes at query time
- Global search: cover every searchable surface in the portal
- Global search: search all lead address fields, not just street

### Changed
- Simpler MailingAddressSubsection: drop optimistic, await + refresh, catch throws
- Surface server-action errors + fix prop-sync clobber in MailingAddressSubsection
- Dashboard polish: drop dark hero, editorial title, emerald sweep, anoint primary work surface
- Dashboard hero: match Settings Members gradient (brand → brand-deep, 135°)
- Sidebar polish: drop monogram redundancy, stronger active state, top-row collapse toggle + Dashboard hero block
- Sidebar wordmark + Claims stage pills
- Icon sidebar polish - dark emerald + Lucide + persistence + page title
- Icon sidebar + /settings absorbed into AppShell
- Load Google Fonts Inter portal-wide so every page matches Settings
- Revert StagePill rework - ship the original muted-style pills
- StagePill: claims trio set per Bree's direct call
- StagePill: Won uses brand emerald + ✓ checkmark instead of a fifth color
- StagePill: claims stages stay in emerald family, no off-palette greens
- StagePill: drop the dark/black tier - three distinct greens on Claims
- StagePill: soften the claims-tier pills - deep emerald instead of true black
- StagePill: give each stage a distinct role-tab style
- Portal-wide role-tab pill system (lifted from Settings)
- Docs: CLAUDE.md deploy flow now uses gh CLI end-to-end
- Palette + button system + typography refinements
- Portal palette swap: petrol-teal → emerald + more brand pull-through
- Search: rich card layout + partial month/3-digit phone
- Search: drop kbd hint + show which financial column matched
- Search: field-aware hints for relatives/parties + platform-aware kbd label
- Property Info: display State as full name instead of 2-letter code

### Fixed
- Fix 0119: drop owner_id NOT NULL before backfill so relative/lead-party rows land with owner_id=null
- Fix 0119: populate org_id explicitly in backfill INSERTs
- Revert "Fix UUUU4 v2: Lead-party address fields + unified Mailing Addresses panel"
- Fix UUUU4 v2: Lead-party address fields + unified Mailing Addresses panel
- Fix SSSS4: Inline name edit for owners and relatives
- Fix: serve pdf.js worker from /public as a static asset
- Palette fix: drop tinted-green backgrounds + bulk-replace hardcoded teal hex
- Fix: bundle pdf.js worker as static asset, drop cdnjs CDN dep
- Fix RRRR4 follow-up: prune SUPPORTED_FONTS to what's actually installed
- Fix: middleware preserves auth-refresh cookies on redirect responses
- Fix RRRR4: Upload-time font validator for mail templates
- Fix: global search currency matches the rounded display (#2)
- Fix QQQQ4: Mail preview accuracy + merge field rendering
- Fix: phone search uses substring of digits, not interleaved wildcards
- Fix: global search currency uses range query so rounded display matches
- Fix PPPP4: Save Template no longer triggers browser Save As dialog
- GlobalSearch: anchor popover left so it doesn't extend into the sidebar
- Topbar: constrain search bar width so it doesn't stretch across the topbar

## [2026-05-20] - 2026-05-20

### Added
- Global search bar in the topbar
- Phone validation: admin Run Backfill button + excludeLostLeads filter
- Mail module: templates editor + PDF preview + SuperDoc + password change (WIP bundle)
- Click-to-call icon on every owner & relative phone
- Phone validation: sync on manual add + 'Verifying…' spinner
- Phone validation: only touch brand-new rows, never sweep the backlog
- Phone validation: Not Verified label + visibility for tried-but-unclear + auto phone type
- Threshold email alerts at 80/95/100% of monthly phone validation quota
- Billing & Add-ons section in Settings - phone validation usage meter
- Validate manually-added phones on save (contacts + relatives)
- Wire import wizard to background-validate new phones
- Phone validation: schema cleanup + metadata + addon usage tables

### Changed
- Temporarily skip TS build errors so prod can ship while mail WIP settles
- Dim call icon on invalid phone rows
- Owner contact row: pencil edits value (not status), 'Verified' label, type-pill alignment
- Align owner + relative phone-row icons consistently
- Owner contact rows: compact 2-line layout matching Relative PhoneSlot
- Relatives phone slots: match owner-contact UX (committed box + spinner)
- Show actual 1,000 quota in Billing meter (drop the 50-call buffer)
- Render dead phones muted with strikethrough + validation tooltip
- Phone validation library - Veriphone client with libphonenumber pre-filter

### Removed
- Remove Litigator badge from lead list/board/daily views

## [2026-05-19] - 2026-05-19

### Changed
- Mail module bundle: parser fix, staging safety, owner_range field, in-flight work

## [2026-05-18] - 2026-05-18

### Changed
- Mention email: switch solid color from #0a3d4a (near-black) to #1a8a9c (bright teal, petrol-300)
- Mention email: drop linear-gradient on header + button, use solid #0a3d4a
- Mention email: use Gmail's documented dark-mode opt-in instead of fighting it
- Mention email: try off-white + !important + <font> wrapper trio to evade Gmail dark-mode inversion of header + button text
- Mention email: restore original light-card layout; add bgcolor fallbacks so Gmail dark mode keeps the header + button text white
- Mention email: rebuild as dark-themed end-to-end so Gmail dark mode stops inverting our text
- Mention email: bump header tagline + lead-name accent from #a8d4dc to white
- Mention email: declare color-scheme: light so Gmail/Outlook dark mode stops eating the body
- Pin app to color-scheme: light so forced-dark browsers stop eating the sidebar
- Stronger unread indicator on notification bell - petrol-100 fill, left accent bar, dot prefix

### Removed
- Stop forcing dark text on inbox email iframe - dark-themed emails were rendering invisible

## [2026-05-15] - 2026-05-15

### Changed
- Settings: Other Contact Roles section - manage org-wide custom roles
- MX email verification + status dots in multi-email picker
- Contacts panel layout + ComposeBox + Overview Notes polish
- Tighten contact-row spacing: icons sit next to name, not at far-right of grid cell
- Icon visibility + bell scroll fix + Manage Roles back to popup only
- Toolbar always shows New Message - empty-state CTA owns the contextual Email <Name> action
- Email <Name> button: show picker when contact has multiple emails
- Manage Roles always visible - discover the feature even with no customs yet
- Members can now see all org leads (drop assignment auto-filter)
- Restore phone-only contacts in Conversation tab - needed for SMS + call
- Conversation tab: pre-fill compose from selected contact + actionable empty state
- Conversation/Contacts polish: multi-email picker, compose-from-contacts, multi-role management
- ComposeBox autocomplete + delete-with-replacement custom-role flow
- Conversation tab: two-column reader, image lightbox, custom-role management
- Inline Reply on Conversation tab + polished toggle for read-sync
- Recent contacts: click filters, hover icons for compose + save-to-lead
- Read-sync to Gmail wired + cap backfill so syncs can't hang
- People grid: colored avatars back, message-count badge, recent senders
- People grid uses full width - 2/3/4 cols responsive, no email preview
- Conversation tab: dense People list - single-line rows, hover icons
- People list redesign + OAuth sync timing fix + read-sync migration
- Owner card: notes display + inline editor
- Owner/Relative add modals: age + DNC + litigator; relative notes UI
- Other Contacts: custom roles become reusable across the org
- Conversation tab - consistent pills, filter-by-click, compact cards
- Assigned Attorney card: avatar summary chip + clearer purpose statement
- Add-Person modals capture full details; Other Contact card shows notes
- Conversation tab redesign - people chips, avatars, send-on-click
- Unify Add Owner / Add Relative / Add Other Contact to centered modals
- Lead Conversation tab: drop the toggle, single timeline with day groups
- Inbox header + compose alignment + full-width fill
- Inbox polish: compose header, lead pill, filter pills fit on one line
- Side-panel compose + outbound attachments + clearer lead pill
- Inbox polish: ComposeBox redesign, filter counts, refresh, more
- Move shared types out of server-only modules
- Render email HTML in original format + reply button right-aligned
- Inbox UI + Lead Conversation tab + Other Contacts + sidebar nav
- Email module backend + Settings UI
- Add migration 0100: email + lead_parties schema

### Fixed
- Surface Manage Roles in the Other Contacts header - no longer buried inside the Add form

### Removed
- Remove Notes card from Overview tab - Recent Activity is enough; Notes still has its own tab
- Remove 2-min cron from vercel.json - Hobby plan limits cron to daily; use manual refresh or external scheduler
- Hide compose top spacer in standalone (new) mode

## [2026-05-14] - 2026-05-14

### Fixed
- Fix OOOO4: Exclude Self From Mention Picker
- Fix NNNN4: Minimal Mention Email
- Fix MMMM4: Profile Self Edit And Invite Name Required
- Fix LLLL4: Password Reset Auth Callback
- Fix KKKK4: CSV Import Accepts Any Column Count

## [2026-05-13] - 2026-05-13

### Fixed
- Fix JJJJ4: Notes Search Box + Scrollable Feed
- Fix IIII4: Recent Activity Shows 3 Items With Note Snippet
- Fix HHHH4: Move @mentions Onto Notes Tab, Drop Discussion Tab
- Fix GGGG4: Exclude Deactivated Users From Mention Picker
- Fix FFFF4: Revert Supports Replacements And Updates
- Fix EEEE4: Apply To All Highlight And Dynamic Import Button
- Fix DDDD4: Surgical Replace Selected And First Last Preference
- Fix CCCC4: Owner Name Selectable On Replace Selected
- Fix BBBB4: Preserve Existing Owner On Replace Selected
- Fix AAAA4: Replace Selected One Sample Card Global Selection
- Fix ZZZZ3: Overview Wording And Sizing
- Fix YYYY3: Import Modal Simplification
- Fix XXXX3: Replace Selected Button Wire-up
- Fix WWWW3: Replace Dropdown Labels
- Fix VVVV3: Selective Field Replace
- Fix: Surplus caption inline + plain-text value alignment
- Fix UUUU3: Import Modal Text Sizing
- Fix TTTT4: Landline Display Recognition
- Fix SSSS3: Property Info Text Weight
- Fix QQQQ3: Import Modal Proper Case
- Fix RRRR3: Property Info Text Sizing
- Fix PPPP3: Import History UI Polish
- Fix NNNN3: Replace Import Owner Contact Merge
- Fix: Quick Facts muted fallbacks no longer truncate
- Fix: parsePhoneType maps Residential to Landline
- Fix LLLL3: Quick Facts + Attorney Default + Import Activity
- Fix KKKK3: Property Info Left Column Layout
- Fix: Stage Actions button order
- Fix JJJJ3: Quick Facts + Non-Judicial Display Fix
- Fix IIII3: Property Info Layout Tightening

## [2026-05-12] - 2026-05-12

### Fixed
- Fix HHHH3: Phone Number Display Formatting
- Fix GGGG3: Property Info Polish
- Fix FFFF3: Surplus Card Minor Adjustments
- Fix CCCC3+DDDD3: Surplus Card Visual + Property Info
- Fix EEEE3: Import Complete Modal Design
- Fix AAAA3+BBBB3: DNC Litigator Split + Import Data Quality
- Fix ZZZZ2: Multi-Fix Bundle
- Fix XXXX2: Surplus Redesign + Overview Layout
- Fix VVVV2: Surplus Confirm Redesign
- Fix UUUU2: Import Edge Case Fixes
- Fix UUUU2: Remove Confirm Surplus Button
- Fix TTTT2: Import Gap Fixes
- Fix OOOOO: Show Pending status on team members until they accept the invite
- Fix OOOOO: Free the email when a member is removed so re-invites work
- Fix PPPP2 Verification: contacts bulk insert no longer breaks on NOT NULL is_dnc
- Fix OOOOO: Accept-invite verifies the invite token instead of the current session
- Fix OOOOO: Invite email shows recipient address and proper title spacing
- Fix OOOOO: Replace Supabase SMTP Invite With Resend API
- Fix MMMMM: Overview Tab Remove Hero Section
- Fix LLLLL: Research Tab Step Width Hard Fix
- Fix KKKKK: Recovery Type Read Only From Lookup
- Fix JJJJJ: Import Parser Patch
- Fix IIIII: Overview Tab Visual Hierarchy Rebuild
- Fix HHHHH: Attorney Fee Simplified
- Fix GGGGG: Case Number In Quick Facts
- Fix FFFFF: Documents Section Header
- Fix EEEEE: Est Net Payout Calculation Correction
- Fix DDDDD: Kanban And Lead Card Fixes
- Fix CCCCC: Tasks And Needs Review Fixes
- Fix BBBBB: Contact And Relative Display Fixes
- Fix AAAAA: Import Parser Verified Rebuild
- Fix ZZZZ2: Research Tab Width And Design Verified Rebuild
- Fix YYYY2: Floor Terminology Removal
- Fix XXXX2: Property Info Tab Field Fixes
- Fix WWWW2: Surplus Breakdown Full Rebuild
- Fix VVVV2: Overview Tab Verified Rebuild
- Fix TTTT2: Overview Tab Full Rebuild
- Fix SSSS2: Research Tab Delete And Design
- Fix PPPP2: Import Parser Overhaul
- Fix OOOO2: Research Tab Overhaul Redo
- Fix NNNN2: Attorney Fee Default And Override
- Fix MMMM2: Liens Moved To Property Info Tab
- Fix LLLL2: Attorney Cost Editable
- Fix JJJJ2: Data Source Dropdown And Case Number On Property Info
- Fix KKKK2: Standardize All Inline Edit Fields App Wide
- Fix IIII2: Remove Redundant Surplus Cards From Overview
- Fix HHHH2: Metric Strip Single Surplus Card
- Fix GGGG2: Migration For Missing Columns
- Fix FFFF2: Property Info Tab
- Fix EEEE2: Surplus Card Simplification
- Fix BBBB2: Kanban Card Layout And Tags
- Fix CCCC2: Needs Review Creates Prominent Task
- Fix ZZZZ: Net Surplus Calculation And Owner Contact Layout
- Fix YYYY: Source Surplus Label Inline
- Fix XXXX: Needs Review As Task Not Banner
- Fix WWWW: Add Task Form Position
- Fix QQQQ: Tasks Promoted To Lead Detail Body
- Fix UUUU: Research Tab Button And Layout
- Fix VVVV: Parcel Number And Case Number On Lead Detail
- Fix FFF Patch: Search Results Dropdown
- Fix EEE Patch: Archived Leads View
- Fix AAA Patch: Mailing Address Recipient
- Fix TTTT: Lead Card Label Layout
- Fix RRRR: Needs Review Flag Prominent On Lead Detail
- Fix IIII Patch: Tasks Right Rail Label
- Fix QQ Patch: Recovery Fee Position
- Fix PPPP: Task Date And Time Picker Styling
- Fix OOOO: Sidebar Active State Highlight
- Fix YY Patch: Input Width Constraints
- Fix DDDD Patch: Quick Facts Label Weight
- Fix DDD Patch: Archive Label Color
- Fix SSSS: Remove N= Count From Stage Days Display
- Fix NNNN: Daily Work Subtext Proper Case
- Fix NNNN: Import Lead Source Selection
- Fix MMMM: Import Complete Modal
- Fix JJJJ: Research Tab Overhaul
- Fix KKKK: Right Rail Section Order
- Fix LLLL: Recovery Fee Badge Rounding
- Fix HHHH: Modal Text Alignment
- Fix LLL: Source Surplus Field
- Fix KKK: Primary Owner Star Indicator
- Fix III: Relatives Add Phone And Email
- Fix HHH: Relatives Add Button Position
- Fix GGG: Team Member Remove Button
- Fix FFF: Search Dropdown And Placeholder
- Fix EEE: Archived Leads Separate View
- Fix DDD: Archive And Delete Menu Redesign
- Fix CCC: Dashboard Lead Stages Strip Redesign
- Fix BBB: Kanban Card Pill Redesign
- Fix WW: Sidebar Active Item Style
- Fix VV: Attorney Dropdown With State And Fee

## [2026-05-11] - 2026-05-11

### Changed
- Baseline before fixes 76-102

### Fixed
- Fix XX: Mailing Address Button Visibility
- Fix JJJ: Contacts Tab Section Order
- Fix UU: Tab Click Page Jump
- Fix TT: Global Subheader Typography Sweep
- Fix SS: Surplus Calculation Hierarchy
- Fix RR: Contact Card Phone Row Cleanup
- Fix QQ: Recovery Fee To Right Rail
- Fix PP: Phone Type And Status Pill Labels
- Fix OO: Daily Work Awaiting External Fixes
- Fix NN: Task Row Alignment
- Fix NN: Show Relative Age On Contacts Tab
- Fix MM: Tasks On Lead Detail
- Fix LL: Add Lien Button Position
- Fix KK: Mailing Addresses To Contacts Tab
- Fix JJ: Team Role Save Button
- Fix GG: Add Task Modal Fixes
- Fix FF: Three Dot Menu Position And Behavior
- Fix EE: Kanban Card Status Pill Position
- Fix DD: Remove State Rules Reference From Import
- Fix BB addendum: Settings and dashboard section header typography
- Fix CC: Mailing Address Mailed Toggle
- Fix BB: Lead Assignment And Quick Facts
- Fix AA: Surplus Breakdown Typography Hierarchy
- Fix Z: Surplus Section And Confirmed Surplus
- Fix Y: Recovery Fee Input Redesign
- Fix X: Edit Lead Modal Redesign
- Fix W: Any Stage Clickable On The Timeline
- Fix W: Reopen Lead Restores Its Previous Stage
- Fix W: Backward Stage Clicks And Reopen Option
- Fix W: Stage Controls To Right Rail
- Fix V: Kanban Scroll And Needs Action Style
- Fix U: Keep Import Revert Available To Everyone Within 24h
- Fix U: Hide Delete Lead From Non-Admins
- Fix U: Lead Delete Options
- Fix T: Filter Bar Dropdown Styling
- Fix S: Import Count And Database Write Bug
- Fix R: Import Flow And Pipeline Rules
- Fix P: Multiple UI And Logic Fixes
- Fix O: Leads Table UI Cleanup
- Fix N: Import Search And Text Cleanup
- Fix M: UI Cleanup And Layout Fixes
- Fix L: Import Sale Type And Parcel Number Mapping
- Fix K: Replace Yellow Amber With Teal Variants Globally
- Fix J: Import Dropdown Overflow Fix
- Fix I: Unrecognized Columns Visibility
- Fix H: Import Wizard UI Cleanup
- Fix H: Import Wizard Pagination Fix
- Fix G: Complete Excess Elite Import Coverage
- Fix E: Import Fields And UI Expanded
- Fix E: Import Missing Mappable Fields
- Fix D: Relative Address Schema Migration
- Fix C: Import Address Field Labels
- Fix B: Required Field Error Scroll Behavior
- Fix A2: Zip Auto Map
- Fix A1: Import Column Mapper Layout
- Fix 102: Dashboard And Global Proper Case
- Fix 101: Confirmed Surplus Audit
- Fix 100: Research Templates Visible In Settings
- Fix 99: Settings Cleanup
- Fix 98: Lost Reasons Restore Trash Icon
- Fix 97: Self Mention No Notification
- Fix 96: Notification Chime
- Fix 95: Import Duplicate Resolution Options
- Fix 94: Import Duplicate Detection Fuzzy Match
- Fix 93: Import Multi Value Field Handling
- Fix 92: Import Unrecognized Columns Visibility
- Fix 91: Import Searchable Field Mapper
- Fix 90: Recovery Type Prefill Lookup
- Fix 89: Owner Full Name Concatenation
- Fix 88: Assigned Attorney Label And Layout
- Fix 87: Mailing Address Card Layout 1/5 Row Width
- Fix 86: Relatives Schema Migration
- Fix 85: Relative Card Layout 1/5 Row Width
- Fix 84: Contact Card Layout 1/5 Row Width
- Fix 83: Kanban Card Layout
- Fix 82: Filter Bar Visual Design
- Fix 81: Task Linked Lead Predictive Search
- Fix 80: Task Form Cleanup
- Fix 79: Overdue Section Color
- Fix 78: PRS Buttons Removed Permanently
- Fix 77: Per User Lead Assignment And Scoping
- Fix 76: Dashboard Est. Net To You Card
