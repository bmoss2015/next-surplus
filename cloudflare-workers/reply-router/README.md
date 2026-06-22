# Next Surplus Reply Router

Cloudflare Email Worker that catches inbound mail at
`ticket-*@replies.nextsurplus.com`, parses the MIME body, and POSTs a JSON
payload to the portal's `/api/webhooks/email-inbound` route. The portal extracts
the ticket UUID from the recipient address and appends the body as an inbound
`feedback_messages` row, so the customer's reply shows up inside the ticket
thread.

Free, no Resend Inbound dependency. Sits in the same Cloudflare account that
already hosts DNS and the existing email-poller worker.

## One-time setup

1. **Enable Cloudflare Email Routing for the zone** if it isn't already.
   Cloudflare Dashboard → `nextsurplus.com` zone → Email → Email Routing →
   Get started.
2. **Add the subdomain.** Email Routing → Settings → Custom addresses → add
   `replies.nextsurplus.com`. Cloudflare prompts you to add the MX +
   verification records to the zone; accept the auto-add. Existing
   `nextsurplus.com` MX records are not touched, so `support@nextsurplus.com`
   keeps routing to Gmail.
3. **Generate a shared secret.** Pick a long random string (e.g.
   `openssl rand -hex 32`). You will set it in two places below.
4. **Deploy this worker:**
   ```bash
   cd C:\Users\info\next-surplus-feedback\cloudflare-workers\reply-router
   npm install
   npx wrangler login            # if not already authenticated
   npx wrangler secret put EMAIL_INBOUND_SECRET
   # paste the secret from step 3
   npx wrangler deploy
   ```
5. **Set the same secret in the portal.** In Vercel project
   `moss-equity-portal`, add an env var:
   - Name: `EMAIL_INBOUND_SECRET`
   - Value: the same string from step 3
   - Scope: Production, Preview, Development
6. **Wire the catch-all route to this worker.** Cloudflare Email Routing →
   Routes → Create catch-all → match `*@replies.nextsurplus.com` → Action:
   Send to a Worker → `next-surplus-reply-router`.

## Verifying

Send a test email to `ticket-00000000-0000-0000-0000-000000000000@replies.nextsurplus.com`.
The worker will POST to the portal webhook; the webhook responds
`{ ok: true, skipped: "ticket_not_found" }` because no such ticket exists.
Tail the worker logs while you send:

```bash
npx wrangler tail
```

If you see `webhook POST failed: 401` the secret in Vercel doesn't match the
worker secret. Re-set both to the same value.

## Updating

- Bump the parser, env vars, or POST shape and run `npx wrangler deploy`
  again. No DNS changes required.
- `PORTAL_WEBHOOK_URL` lives in `wrangler.toml` as a plain var so you can
  point at a staging deploy URL during testing.
