---
name: roadmap
description: Updates the Product Build Status & Roadmap and/or Architecture documentation when the user wants to record a feature, priority change, timeline, technical decision, or integration choice. Invoked via /roadmap, /architecture, or /docs slash commands. Classifies content as Roadmap-only, Architecture-only, or both. Shows a preview before committing.
---

# Roadmap and Architecture Doc Update Skill

## When this skill triggers

This skill activates when the user's message starts with any of these slash commands:

- `/roadmap` — add or update something in the Product Roadmap (and/or Architecture if technically warranted)
- `/architecture` — add or update something in the Architecture doc (pure tech decisions)
- `/docs` — alias for `/roadmap`, same behavior

The text AFTER the slash command is the content the user wants added.

## Product context

- **Product name:** Moss Equity Partners - Web App
- **Legal entity:** Moss Equity Partners LLC (NOT Mossy Land LLC)
- **Repo:** github.com/bmoss2015/MossEquityPartners
- **Two files this skill edits:**
  - `product-build-status-roadmap-content.md` (the Roadmap)
  - `ARCHITECTURE.md` (the Architecture doc)
- Both live at repo root on the `main` branch

## How to handle a slash command

### Step 0 (REQUIRED): Ground in current build state

Before classifying the user's input or generating any preview, read these files in order so the proposal reflects what is actually shipped:

1. `PROJECT-INVENTORY.md` — factual inventory of what exists in the product today (routes, features, settings sections, integrations, partials)
2. `product-build-status-roadmap-content.md` — what is currently on the roadmap by quarter
3. `ARCHITECTURE.md` — vendor and tech-stack decisions
4. The most recent 30 lines of `CHANGELOG.md` — what shipped most recently

**Conflict-flagging rules (apply during Step 2 preview generation, but driven by what you read in Step 0):**

- If the user's input references a feature that is NOT in `PROJECT-INVENTORY.md` AND NOT in the current roadmap, flag it in the preview: "I don't see X in the inventory or on the roadmap, is this a new initiative or did I miss something?" Do not silently invent wording.
- If the user's input describes something already listed in `PROJECT-INVENTORY.md` as built, point that out before treating it as a roadmap addition: "X is already shipped per the inventory, did you mean to refine the feature or remove the roadmap mention?"
- If a roadmap line you are reading or proposing references a vendor or feature that conflicts with the inventory (e.g., "replaces GoHighLevel" when GoHighLevel is not in the stack), flag the conflict and propose corrected wording.
- Never propose vendor names the user has not already chosen. Default to "(provider to be determined)" for unresolved choices.
- If `PROJECT-INVENTORY.md` looks stale (a Fix LABEL in recent CHANGELOG ships a user-visible feature that is not reflected in the inventory), say so in the preview and offer to refresh the inventory before continuing.

### Step 1: Parse the user's intent

Read the text after the slash command. Determine what they're describing:

**Roadmap-worthy** content includes:
- Features to be built (existing or new)
- Priority changes (move from Later to Now, etc.)
- Timeline commitments (Q3, Q4, end of year)
- Status updates ("we shipped X", "X is now live")
- Vision-level direction changes
- Things a non-technical person (investor, partner) would understand

**Architecture-worthy** content includes:
- New vendor or integration choices (e.g., "we're using Stripe for billing", "switched from Mailgun to Resend")
- Tech stack decisions (database choices, hosting changes, framework decisions)
- Data model decisions (multi-tenant approach, schema design)
- Infrastructure changes (CI/CD setup, deploy process changes)
- Security or compliance approaches (TCPA strategy, encryption choices)
- Things only a developer would understand

**Both** when the content describes a feature AND introduces new technical choices:
- "Add SMS using Twilio" → roadmap line + ADR for Twilio
- "Add billing with Stripe in Q2" → roadmap line + ADR for Stripe
- "Switch payment provider from Stripe to Paddle" → roadmap mention + new ADR

### Step 2: Generate preview output

ALWAYS preview before committing. Show the user:

1. Your classification (Roadmap, Architecture, or Both)
2. Exactly what text will be added and to which section of which file
3. The proposed commit message
4. Ask: "Confirm? (yes / edit / cancel)"

NEVER edit files or commit without explicit "yes" from the user.

Preview format:

```
I'm interpreting this as [ROADMAP / ARCHITECTURE / TWO UPDATES]:

1. ROADMAP (product-build-status-roadmap-content.md)
   Section: [Q2 2026 / Q3 2026 / Q4 2026 / 2027+ Vision]
   Adding:
   - [exact bullet text]

2. ARCHITECTURE (ARCHITECTURE.md)
   Section: [Architecture Decisions / RFCs Needed / Integrations]
   Adding new ADR-[NNN]:
   Title: [title]
   Decision: [one paragraph]
   Why: [one paragraph]
   Trade off: [one paragraph if applicable]
   Decided: YYYY-MM-DD

Commit message: "chore(docs): [concise summary]"

Confirm? (yes / edit / cancel)
```

### Step 3: Handle the user's response

When the user confirms with **"yes"** (or "confirm"), run the full ship flow end-to-end with no further prompts. The merge step is pre-authorized for branches matching `chore/docs-roadmap-*` via `.claude/settings.json` (`permissions.allow` + `autoMode.allow`).

1. **Verify clean tree.** `git status --short`. If dirty, stop and ask whether to stash or abort.
2. **Capture the current branch** for return at the end.
3. **Switch to main, pull latest.** `git checkout main && git pull --ff-only origin main`.
4. **Create a fresh branch** named `chore/docs-roadmap-<short-slug>` derived from the commit message (e.g. `chore/docs-roadmap-ss-grounding-lob-cert`). NEVER reuse an existing branch name; NEVER apply edits on a long-lived branch.
5. **Apply the edits** previewed in Step 2.
6. **Commit** with the proposed `chore(docs): …` message.
7. **Push.** `git push -u origin chore/docs-roadmap-<short-slug>`.
8. **Open PR** via `gh pr create --base main --head <branch> --title "..." --body "..."`. Body should include a Summary section listing what changed and a Test plan line for the Worker rebuild.
9. **Merge PR.** `gh pr merge <number> --merge --delete-branch`.
10. **Return to original branch.** `git checkout <original-branch>`.
11. **Report** PR URL, merge commit SHA, and a one-line confirmation that main now reflects the change.

**Why the fresh-branch pattern matters:** the `chore/docs-roadmap-*` naming is the safety boundary. Permission rules only pre-authorize merges on this naming convention. Merging from any other branch will still trigger the normal main-merge safety pause.

- **"edit [their corrections]"** → revise the preview based on feedback, show new preview, wait for confirmation again.
- **"cancel"** → do nothing, report cancelled.

### Step 4: After merging

Default behavior: **do not** trigger the Worker rebuild. The Monday 14:00 UTC auto-run will pick the change up.

Ask once: "Trigger Worker rebuild now to see the Roadmap in Drive? (yes / wait for Monday)"

If yes:
```
curl -X POST https://moss-equity-living-doc.holy-thunder-2538.workers.dev/regenerate
```

Report the JSON response. If `success: true`, the doc has been updated in the Shared Drive folder.

## File structure rules

### Roadmap file: `product-build-status-roadmap-content.md`

The file has fixed top-level sections. NEVER rename or remove these:

- `## Product Overview` (2-3 sentence statement at top, rarely changes)
- `## Current State` (current state of the product)
- `## Q2 2026` (April – June 2026)
- `## Q3 2026` (July – September 2026)
- `## Q4 2026` (October – December 2026)
- `## 2027+ Vision` (12+ months out, direction items)

The skill should auto-determine which quarter is "current" based on today's date. Each year, new quarter sections are added as needed (e.g., when 2027 begins, the skill creates `## Q1 2027` and migrates 2027+ Vision items into specific quarters as priorities clarify).

When adding to the roadmap, place the bullet in the most appropriate section based on timeline implied by the user. If unclear, default to the next upcoming quarter (e.g., Q3 2026 if currently in Q2 2026) and flag it in the preview for confirmation.

Use plain language. Avoid technical implementation detail. Examples of good roadmap bullets:

- ✓ "SMS outreach via Twilio (Q3 launch)"
- ✓ "Stripe billing integration"
- ✓ "Power dialer for outbound calls"
- ✓ "Public beta launch"

Examples of bad roadmap bullets (these belong in Architecture):

- ✗ "Implement Twilio webhook handler at /api/twilio/inbound with HMAC signature verification"
- ✗ "Add Stripe webhooks for subscription.created and subscription.updated events"

### Architecture file: `ARCHITECTURE.md`

The file has fixed top-level sections. NEVER rename or remove these:

- `## Tech Stack`
- `## Environments`
- `## Deploy Process`
- `## Integrations` (vendors and APIs)
- `## Architecture Decisions` (numbered ADRs)
- `## RFCs Needed` (design docs to write before building)

When adding an ADR, find the highest existing ADR number and increment by 1. ADR format:

```
### ADR-NNN: [Title]

**Decision:** [One paragraph stating what was decided]

**Why:** [One paragraph explaining the rationale]

**Trade off:** [One paragraph on what this makes worse — optional but recommended]

**Decided:** YYYY-MM-DD
```

When adding an RFC stub, append to the RFCs Needed section:

```
### RFC-NNN: [Title]

Open questions to answer before building:

- [Question 1]
- [Question 2]
- [Question 3]
```

## Commit conventions

- One commit per skill invocation
- Use prefix `chore(docs):` for commit messages
- Format: `chore(docs): [what was added or changed]`
- Examples:
  - `chore(docs): add SMS outreach to roadmap + ADR-013 for Twilio architecture`
  - `chore(docs): move billing from Later to This Quarter`
  - `chore(docs): add ADR-014 for shared Twilio number pooling decision`

After committing, push the branch, open a PR, and merge with `gh pr merge <number> --merge --delete-branch`. The Worker rebuild remains opt-in (see Step 4).

## Edge cases

**User uses slash command with no content after it:**
Ask: "What would you like to add to the [Roadmap / Architecture]?"

**User says something that's clearly NOT a doc update** (e.g. "/roadmap fix this bug"):
Respond: "That sounds like a code change, not a roadmap item. For small fixes, just describe the fix and I'll make the code change directly — the git hook will add it to CHANGELOG.md automatically. Should I do that instead?"

**User describes something already in the docs:**
Check the current files first. If the content already exists in some form, point that out: "This is similar to existing bullet 'X' in the [section]. Update that one, add as a new entry, or cancel?"

**User describes something ambiguous between Roadmap and Architecture:**
Default to your best judgment, show the preview, let the user correct via "edit" if wrong.

**Multiple unrelated items in one slash command:**
Split into separate updates within the preview. Example:
> "/roadmap We're adding SMS in Q3. Also we decided to use Resend instead of Mailgun."

Preview two distinct updates:
1. Roadmap: SMS outreach (Q3)
2. Architecture: ADR for Resend choice (move from Mailgun)

## What NOT to do

- Do NOT edit CHANGELOG.md from this skill. The git post-commit hook handles CHANGELOG automatically.
- Do NOT edit CLAUDE.md from this skill. That file has its own purpose.
- Do NOT auto-trigger a Worker rebuild without asking (Step 4).
- Do NOT skip the preview step. Always show what will be written before editing files.
- Do NOT apply edits on a long-lived branch — always cut a fresh `chore/docs-roadmap-<slug>` off main (Step 3).
- Do NOT reuse an existing branch name when creating the docs branch — pick a fresh slug derived from the commit message.
- Do NOT skip the PR step (no direct commits to main). The PR is the audit trail even when auto-merged.
- Do NOT invent ADR or RFC numbers — always check existing files for the highest used number.
- Do NOT reference Mossy Land LLC. The product is Moss Equity Partners - Web App, owned by Moss Equity Partners LLC.
