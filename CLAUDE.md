# Moss Equity Partners — Master Command Reference

## New Computer Setup (run once)
```
pip install playwright python-dotenv
python -m playwright install chromium
```

## auction.com Bulk Hearter

### First time setup
```
mkdir MossEquityPartners
cd MossEquityPartners
Set-Content -Path ".env" -Value "AUCTION_EMAIL=auction.com@mossequitypartners.com`nAUCTION_PASSWORD=Tretre16!`$" -Encoding ASCII
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/bmoss2015/MossEquityPartners/claude/auction-heart-script-nlj4E/auction_heart.py" -OutFile "auction_heart.py"
```

### Run the script (every time)
```
cd C:\Users\info\MossEquityPartners
python auction_heart.py
```
Then paste your auction.com search URL when prompted.

### Re-download script after updates
```
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/bmoss2015/MossEquityPartners/claude/auction-heart-script-nlj4E/auction_heart.py" -OutFile "auction_heart.py"
```
