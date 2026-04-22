# Moss Equity Partners — Command Reference

============================================================

## AUCTION.COM

```powershell
cd C:\Users\info\MossEquityPartners
python auction_heart.py
```
^ Hearts all properties on a search page

```powershell
cd C:\Users\info\gmail-ghl
python gmail_to_ghl.py
```
^ Checks Auction.com emails, creates GHL contact/task/note, moves email to Pushed to GHL

============================================================

---

## Script Documentation

### 1. auction_heart.py
**Location:** `C:\Users\info\MossEquityPartners`

Hearts all properties on an Auction.com search page automatically.

---

### 2. gmail_to_ghl.py
**Location:** `C:\Users\info\gmail-ghl`

Monitors the **Auction.com** Gmail label for unread emails and automatically:
- Creates a new **GHL contact** (First Name: date, Last Name: street address)
- Creates a **GHL task** assigned to Bree Moss
- Adds a **note to the activity feed** with sold date, address, sold amount, and link
- Moves the email to the **Pushed to GHL** Gmail label

**Scheduled via Windows Task Scheduler:**
- Runs daily at **8:00 AM CST**
- Runs daily at **12:00 PM CST**

**Setup files required:**

`.env` file at `C:\Users\info\gmail-ghl\.env`:
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

**To run manually:**
```powershell
cd C:\Users\info\gmail-ghl
python gmail_to_ghl.py
```
