#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
export $(grep '^OCW_API_KEY=' .env.local)
URLS=(
  "https://api.onlinecheckwriter.com/api/v3/user"
  "https://api.onlinecheckwriter.com/v3/user"
  "https://api.onlinecheckwriter.com/v1/user"
  "https://app.onlinecheckwriter.com/api/v3/user"
  "https://app.onlinecheckwriter.com/api/v1/user"
  "https://api.zilmoney.com/v3/user"
  "https://api.zilmoney.com/v3/me"
  "https://api.zilmoney.com/api/v3/user"
  "https://app.zilmoney.com/api/v3/user"
  "https://api.onlinecheckwriter.com/api/v3/check"
  "https://api.onlinecheckwriter.com/api/v3/banks"
  "https://api.onlinecheckwriter.com/api/v3/bank-accounts"
  "https://api.onlinecheckwriter.com/api/v3/account"
)
for u in "${URLS[@]}"; do
  echo "=== $u ==="
  curl -s -o /tmp/ocw_body -w "HTTP %{http_code} ct=%{content_type}\n" \
    -H "Authorization: Bearer $OCW_API_KEY" \
    -H "Accept: application/json" \
    --max-time 5 "$u"
  head -c 250 /tmp/ocw_body
  echo
done
