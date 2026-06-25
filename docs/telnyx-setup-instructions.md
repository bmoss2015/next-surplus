# Telnyx Setup Instructions

What you need to do in the Telnyx dashboard so Claude Code can wire the dialer. Three values come back to me. Five-ish minutes of clicks.

## Before You Start

- Confirm you're logged into the right Telnyx account at https://portal.telnyx.com
- Confirm a billing method is on file (Mission Control → Billing → Payment Methods). Calls and number purchases bill against this.

## Step 1 — Create An API V2 Key

1. Go to **Mission Control → API Keys** (https://portal.telnyx.com/#/account/api-keys)
2. Click **Create API Key**
3. Name it `Next Surplus Production`
4. Click **Create**
5. **Copy the key immediately** — it starts with `KEY...` and is shown only once.

**Give me:** the `KEY...` value. I'll paste it into `TELNYX_API_KEY` in `.env.local` and Vercel envs.

## Step 2 — Create The Call Control Application

This is what lets the dialer place outbound voice calls and receive webhook events back.

1. Go to **Mission Control → Voice → Programmable Voice → Call Control Applications** (https://portal.telnyx.com/#/app/call-control)
2. Click **Add new**
3. Application name: `Next Surplus Dialer`
4. Webhook URL: `https://app.nextsurplus.com/api/telnyx/webhook`
5. Webhook API Version: **v2**
6. Webhook Failover URL: leave blank for now
7. Leave the other defaults alone
8. Click **Save**
9. After save, the app's detail page shows a **Connection ID** (UUID format, like `2503xxxxxxxx`)

**Give me:** the Connection ID. I'll paste it into `TELNYX_CONNECTION_ID` in env.

## Step 3 — Grab The Webhook Public Key

This is what the app uses to verify incoming webhooks are really from Telnyx and not a spoof.

1. Go to **Mission Control → Account → Public Key** (https://portal.telnyx.com/#/account/public-key)
2. **Copy the entire public key** (it's a multi-line block starting with something like `-----BEGIN PUBLIC KEY-----` or an Ed25519 key string, depending on Telnyx's current format)

**Give me:** the public key. Pasted into `TELNYX_PUBLIC_KEY` in env.

## Step 4 — Buy The First Phone Number

This is what Rik will dial out from.

1. Go to **Mission Control → Numbers → Buy Numbers** (https://portal.telnyx.com/#/numbers/buy-numbers)
2. Search filter: **Local**, then enter an area code Rik works in (Austin TX = `512`, Houston TX = `713`, etc.)
3. Pick a memorable number from the list — click **Add to cart**
4. In the cart: **assign** the Call Control Application you just created (`Next Surplus Dialer`)
5. Click **Place Order**
6. After purchase, the number appears in **Mission Control → Numbers → My Numbers**
7. Click the number, confirm the Connection assignment is set to `Next Surplus Dialer`

**Give me:**
- The E.164 phone number (looks like `+15125550188`)
- The city / state it's based in
- The Telnyx phone number ID (UUID shown on the My Numbers detail page)

I'll insert the row into the `phone_numbers` table so the dialer can use it.

## Step 5 (Skip For Now) — A2P 10DLC Registration

SMS requires brand + campaign approval. This takes 1 to 3 weeks. Don't do it today unless you want SMS soon. Voice works on every number from the moment of purchase.

When you're ready: **Mission Control → Messaging → 10DLC Registration**.

## TL;DR

After you've done steps 1 to 4, paste these to me:

```
TELNYX_API_KEY        = KEY...
TELNYX_CONNECTION_ID  = (uuid)
TELNYX_PUBLIC_KEY     = (the public key block)
FIRST_NUMBER          = +1XXXXXXXXXX
FIRST_NUMBER_CITY     = (city name)
FIRST_NUMBER_STATE    = (state name)
FIRST_NUMBER_TELNYX_ID = (uuid)
```

I'll wire the env, insert the phone_numbers row, and start the WebRTC dialer integration.
