# Gmail to GoHighLevel

Monitors the **Auction.com** Gmail label for unread emails and automatically:
- Creates a new **GHL contact** (First Name: date, Last Name: street address)
- Creates a **GHL task** assigned to Bree Moss
- Adds a **note to the activity feed** with sold date, address, sold amount, and link
- Moves the email to the **Pushed to GHL** Gmail sublabel

---

## Run Manually

```powershell
cd C:\Users\info\gmail-ghl
python gmail_to_ghl.py
```

## Schedule

Runs automatically via Windows Task Scheduler:
- Daily at **8:00 AM CST**
- Daily at **12:00 PM CST**

---

## Setup

**1. Install dependencies**
```powershell
pip install requests python-dotenv
```

**2. Create `.env` file at `C:\Users\info\gmail-ghl\.env`**
```
GMAIL_ADDRESS=bree@mossequitypartners.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_FOLDER=Auction.com
GMAIL_PROCESSED_FOLDER=Auction.com/Pushed to GHL
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_location_id
GHL_ASSIGNED_EMAIL=bree@mossequitypartners.com
POLL_INTERVAL=300
```

**3. Enable IMAP in Gmail**
- Gmail Settings → Forwarding and POP/IMAP → Enable IMAP

**4. Gmail App Password**
- myaccount.google.com → Security → 2-Step Verification → App Passwords
