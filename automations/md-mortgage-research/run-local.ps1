# run-local.ps1 - Local development setup and test runner for MD Mortgage Research Agent
# Run from the project root: .\automations\md-mortgage-research\run-local.ps1

param(
    [string]$Command = "help"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = $ScriptDir
$VenvDir = Join-Path $ProjectRoot ".venv"
$EnvFile = Join-Path $ProjectRoot ".env"
$RequirementsFile = Join-Path $ProjectRoot "requirements.txt"
$TestsDir = Join-Path $ProjectRoot "tests"
$DebugDir = Join-Path $ProjectRoot "debug"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text)
    Write-Host "[+] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[!] $Text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Text)
    Write-Host "[x] $Text" -ForegroundColor Red
}

function Check-EnvFile {
    if (-not (Test-Path $EnvFile)) {
        Write-Err ".env file not found at: $EnvFile"
        Write-Warn "Copy .env.template to .env and fill in your credentials:"
        Write-Host "    Copy-Item '$ProjectRoot\.env.template' '$EnvFile'" -ForegroundColor Yellow
        exit 1
    }
}

function Activate-Venv {
    $ActivateScript = Join-Path $VenvDir "Scripts\Activate.ps1"
    if (-not (Test-Path $ActivateScript)) {
        Write-Err "Virtual environment not found. Run: .\run-local.ps1 setup"
        exit 1
    }
    & $ActivateScript
}

function Run-Setup {
    Write-Header "Setting Up Local Environment"

    # Check Python
    try {
        $PythonVersion = python --version 2>&1
        Write-Step "Found: $PythonVersion"
    } catch {
        Write-Err "Python not found. Install Python 3.11+ from https://python.org"
        exit 1
    }

    # Create virtual environment
    if (Test-Path $VenvDir) {
        Write-Warn "Virtual environment already exists at $VenvDir"
        $Overwrite = Read-Host "Recreate it? (y/N)"
        if ($Overwrite -eq "y" -or $Overwrite -eq "Y") {
            Remove-Item -Recurse -Force $VenvDir
        }
    }

    if (-not (Test-Path $VenvDir)) {
        Write-Step "Creating virtual environment..."
        python -m venv $VenvDir
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to create virtual environment"
            exit 1
        }
        Write-Step "Virtual environment created at $VenvDir"
    }

    # Activate and install dependencies
    Activate-Venv

    if (Test-Path $RequirementsFile) {
        Write-Step "Installing dependencies from requirements.txt..."
        pip install --upgrade pip -q
        pip install -r $RequirementsFile
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to install dependencies"
            exit 1
        }
    } else {
        Write-Warn "requirements.txt not found -- installing base packages..."
        pip install --upgrade pip -q
        pip install playwright python-dotenv supabase anthropic google-auth google-auth-oauthlib google-api-python-client
    }

    # Install Playwright browsers
    Write-Step "Installing Playwright Chromium browser..."
    playwright install chromium
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to install Playwright Chromium"
        exit 1
    }

    # Create debug directory
    if (-not (Test-Path $DebugDir)) {
        New-Item -ItemType Directory -Path $DebugDir | Out-Null
        Write-Step "Created debug/ folder for screenshots"
    }

    # Check for .env
    if (-not (Test-Path $EnvFile)) {
        Write-Warn ".env not found. Creating from template..."
        if (Test-Path "$ProjectRoot\.env.template") {
            Copy-Item "$ProjectRoot\.env.template" $EnvFile
            Write-Warn "Fill in your credentials in: $EnvFile"
        } else {
            Write-Err ".env.template also missing -- check your git pull"
        }
    }

    Write-Header "Setup Complete!"
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Fill in credentials: $EnvFile" -ForegroundColor White
    Write-Host "  2. Run a test:  .\run-local.ps1 sdat" -ForegroundColor White
    Write-Host "  3. Run all:     .\run-local.ps1 all" -ForegroundColor White
}

function Run-Test {
    param([string]$TestFile, [string]$Label)
    Write-Header "Running: $Label"
    Check-EnvFile
    Activate-Venv
    $TestPath = Join-Path $TestsDir $TestFile
    if (-not (Test-Path $TestPath)) {
        Write-Err "Test file not found: $TestPath"
        exit 1
    }
    python $TestPath
    if ($LASTEXITCODE -ne 0) {
        Write-Err "$Label FAILED (exit code $LASTEXITCODE)"
        Write-Warn "Check debug/ folder for screenshots"
        exit $LASTEXITCODE
    }
    Write-Step "$Label PASSED"
}

function Run-All {
    Write-Header "Running Full Test Suite"
    Check-EnvFile
    Activate-Venv

    $Tests = @(
        @{ File = "test_supabase.py";    Label = "Supabase Connection" },
        @{ File = "test_drive.py";       Label = "Google Drive Upload" },
        @{ File = "test_sdat.py";        Label = "SDAT Scraper" },
        @{ File = "test_case_search.py"; Label = "Case Search Scraper" },
        @{ File = "test_land_records.py";Label = "Land Records Scraper" },
        @{ File = "test_full_pipeline.py";Label = "Full Pipeline" }
    )

    $Passed = 0
    $Failed = 0
    $Results = @()

    foreach ($T in $Tests) {
        Write-Host ""
        Write-Host "--- $($T.Label) ---" -ForegroundColor Cyan
        $TestPath = Join-Path $TestsDir $T.File
        python $TestPath
        if ($LASTEXITCODE -eq 0) {
            $Results += "[PASS] $($T.Label)"
            $Passed++
        } else {
            $Results += "[FAIL] $($T.Label)"
            $Failed++
        }
    }

    Write-Header "Test Results"
    foreach ($R in $Results) {
        if ($R.StartsWith("[PASS]")) {
            Write-Host $R -ForegroundColor Green
        } else {
            Write-Host $R -ForegroundColor Red
        }
    }
    Write-Host ""
    Write-Host "Passed: $Passed  Failed: $Failed" -ForegroundColor White

    if ($Failed -gt 0) {
        Write-Warn "Check debug/ folder for failure screenshots"
        exit 1
    }
}

function Show-Help {
    Write-Header "MD Mortgage Research Agent - Local Test Runner"
    Write-Host "Usage:  .\run-local.ps1 <command>" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  setup        Create venv, install deps, install Playwright Chromium" -ForegroundColor Gray
    Write-Host "  sdat         Test SDAT property scraper (4044 Hanson Oaks Dr, PG County)" -ForegroundColor Gray
    Write-Host "  case         Test Case Search scraper (Sarah Moore, PG County)" -ForegroundColor Gray
    Write-Host "  land         Test Land Records scraper (Sarah Moore, PG County)" -ForegroundColor Gray
    Write-Host "  supabase     Test Supabase connection (create + read a lead)" -ForegroundColor Gray
    Write-Host "  drive        Test Google Drive upload (sample file)" -ForegroundColor Gray
    Write-Host "  pipeline     Run the full end-to-end pipeline locally" -ForegroundColor Gray
    Write-Host "  all          Run all tests in sequence" -ForegroundColor Gray
    Write-Host "  help         Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Quick start:" -ForegroundColor White
    Write-Host "  .\run-local.ps1 setup" -ForegroundColor Yellow
    Write-Host "  Copy-Item .env.template .env  # then fill in credentials" -ForegroundColor Yellow
    Write-Host "  .\run-local.ps1 sdat" -ForegroundColor Yellow
}

# --- Main dispatch ---
switch ($Command.ToLower()) {
    "setup"    { Run-Setup }
    "sdat"     { Run-Test "test_sdat.py"         "SDAT Scraper" }
    "case"     { Run-Test "test_case_search.py"  "Case Search Scraper" }
    "land"     { Run-Test "test_land_records.py" "Land Records Scraper" }
    "supabase" { Run-Test "test_supabase.py"     "Supabase Connection" }
    "drive"    { Run-Test "test_drive.py"         "Google Drive Upload" }
    "pipeline" { Run-Test "test_full_pipeline.py" "Full Pipeline" }
    "all"      { Run-All }
    default    { Show-Help }
}
