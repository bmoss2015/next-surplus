$tmpEnv = Join-Path $env:TEMP "moss-cron-secret.env"

Write-Host "Pulling prod env to $tmpEnv ..."
npx vercel env pull --environment=production --yes $tmpEnv | Out-Null

if (-not (Test-Path $tmpEnv)) {
    Write-Error "vercel env pull failed."
    exit 1
}

$raw = Get-Content $tmpEnv -Raw
$lines = $raw -split "`r?`n"
$line = $lines | Where-Object { $_ -match '^CRON_SECRET=' } | Select-Object -First 1

if (-not $line) {
    Write-Error "CRON_SECRET line not found."
    Write-Host "Lines with C in them:"
    $lines | Where-Object { $_ -match '^C' } | ForEach-Object { Write-Host "  [$_]" }
    Remove-Item $tmpEnv -Force
    exit 1
}

Write-Host "Raw line: [$line]"
Write-Host "Raw line length: $($line.Length)"

# Extract everything after first =
$equalsPos = $line.IndexOf('=')
$rawValue = $line.Substring($equalsPos + 1)
Write-Host "Raw value: [$rawValue]"
Write-Host "Raw value length: $($rawValue.Length)"

# Strip surrounding quotes if present (could be single or double)
$secret = $rawValue
if ($secret.StartsWith('"') -and $secret.EndsWith('"')) {
    $secret = $secret.Substring(1, $secret.Length - 2)
} elseif ($secret.StartsWith("'") -and $secret.EndsWith("'")) {
    $secret = $secret.Substring(1, $secret.Length - 2)
}
$secret = $secret.Trim()

Remove-Item $tmpEnv -Force

$len = $secret.Length
$first4 = if ($len -ge 4) { $secret.Substring(0, 4) } else { $secret }
$last4 = if ($len -ge 4) { $secret.Substring($len - 4, 4) } else { "" }
Write-Host "Parsed CRON_SECRET length: $len  (first4=[$first4] last4=[$last4])"

if ($len -eq 0) {
    Write-Error "Parsed secret is empty. Stopping."
    exit 1
}

$uri = 'https://moss-equity-portal.vercel.app/api/cron/reconcile-mail'
Write-Host "GET $uri"

try {
    $response = Invoke-RestMethod -Uri $uri -Headers @{ Authorization = "Bearer $secret" } -Method Get
    $response | ConvertTo-Json -Depth 6
} catch {
    $statusCode = $null
    $body = $null
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
        } catch { }
    }
    Write-Host "Request failed: HTTP $statusCode"
    if ($body) { Write-Host "Body: $body" }
    Write-Host "Exception: $($_.Exception.Message)"
}
