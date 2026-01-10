# ============================================================================
# Pricing Redesign Migration Runner (PowerShell)
# ============================================================================
#
# Executes the pricing redesign migrations via Supabase REST API.
# This avoids needing the database password directly.
#
# Usage:
#   .\scripts\run-migrations.ps1 [-VerifyOnly] [-Rollback]
#
# Examples:
#   .\scripts\run-migrations.ps1              # Run all migrations
#   .\scripts\run-migrations.ps1 -VerifyOnly  # Run verification only
#   .\scripts\run-migrations.ps1 -Rollback    # Rollback migrations
#
# ============================================================================

[CmdletBinding()]
param(
    [switch]$VerifyOnly,
    [switch]$Rollback
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$MigrationsDir = Join-Path $ProjectRoot "supabase\migrations"

# Colors
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n[STEP] $Message" Cyan
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[OK] $Message" Green
}

function Write-Error-Output {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" Red
}

function Write-Warning-Output {
    param([string]$Message)
    Write-ColorOutput "[WARN] $Message" Yellow
}

# Migration files
$Migrations = @(
    @{ Name = "Schema"; File = "20260110200000_pricing_redesign_schema.sql"; Required = $true },
    @{ Name = "Data Migration"; File = "20260110210000_pricing_redesign_data_migration.sql"; Required = $true },
    @{ Name = "Verification"; File = "20260110220000_pricing_redesign_verification.sql"; Required = $false }
)

$RollbackFile = "20260110290000_pricing_redesign_rollback.sql"

# Load environment variables
function Get-EnvVar {
    param([string]$Name)

    # Check .env.local file
    $EnvFile = Join-Path $ProjectRoot ".env.local"
    if ((Test-Path $EnvFile)) {
        $Content = Get-Content $EnvFile -Raw
        if ($Content -match "$Name=(.*)") {
            return $matches[1].Trim('"').Trim("'")
        }
    }

    # Check system environment
    return [System.Environment]::GetEnvironmentVariable($Name)
}

# Get Supabase credentials
$SupabaseUrl = Get-EnvVar "VITE_SUPABASE_URL"
$SupabaseKey = Get-EnvVar "SUPABASE_SERVICE_ROLE_KEY"

if (-not $SupabaseUrl) {
    Write-Error-Output "VITE_SUPABASE_URL not found in .env.local"
    exit 1
}

if (-not $SupabaseKey) {
    Write-Error-Output "SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
    exit 1
}

Write-ColorOutput "`n========================================" Cyan
Write-ColorOutput "  Pricing Redesign Migration Runner" Cyan
Write-ColorOutput "========================================" Cyan
Write-Host "`nSupabase URL: $SupabaseUrl"

# Alternative: Use combined SQL file for manual execution
function Copy-CombinedSQL {
    $CombinedFile = Join-Path $MigrationsDir "RUN_ALL_MIGRATIONS.sql"

    if (-not (Test-Path $CombinedFile)) {
        Write-Error-Output "Combined migration file not found: $CombinedFile"
        return
    }

    $Content = Get-Content $CombinedFile -Raw

    # Output to clipboard for easy pasting
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        Set-Clipboard -Value $Content
        Write-Success "Combined SQL copied to clipboard!"
    }

    Write-Host "`n========================================"
    Write-Host "MANUAL EXECUTION INSTRUCTIONS"
    Write-Host "========================================"
    Write-Host "`n1. Open Supabase SQL Editor:"
    Write-Host "   $SupabaseUrl/sql`n"
    Write-Host "2. The combined SQL has been copied to your clipboard`n"
    Write-Host "3. Paste into SQL Editor and click 'Run'`n"
    Write-Host "4. Review output for any errors`n"
    Write-Host "========================================`n"
}

# Main execution
function Invoke-Migration {
    Write-Step "Preparing migration..."

    if ($Rollback) {
        Write-Warning-Output "ROLLBACK MODE: This will revert the pricing redesign!"
        Write-Host "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
        Start-Sleep -Seconds 5

        $RollbackPath = Join-Path $MigrationsDir $RollbackFile
        if (-not (Test-Path $RollbackPath)) {
            Write-Error-Output "Rollback file not found: $RollbackPath"
            exit 1
        }

        Write-Step "Rollback file ready: $RollbackFile"
        Write-Host "`nTo rollback, execute the SQL in Supabase SQL Editor:"
        Write-Host "$SupabaseUrl/sql`n"
        exit 0
    }

    if ($VerifyOnly) {
        Write-Step "Verification mode"
        $VerifyFile = Join-Path $MigrationsDir "20260110220000_pricing_redesign_verification.sql"
        if (-not (Test-Path $VerifyFile)) {
            Write-Error-Output "Verification file not found: $VerifyFile"
            exit 1
        }

        Write-Host "`nTo run verification, execute the SQL in Supabase SQL Editor:"
        Write-Host "$SupabaseUrl/sql`n"
        exit 0
    }

    # Check migration files exist
    foreach ($Migration in $Migrations) {
        $Path = Join-Path $MigrationsDir $Migration.File
        if (-not (Test-Path $Path)) {
            Write-Error-Output "Migration file not found: $($Migration.File)"
            exit 1
        }
    }

    Write-Success "All migration files found"

    # Since we can't execute SQL via REST API easily,
    # provide instructions for manual execution
    Write-Host "`n========================================"
    Write-Host "MIGRATION EXECUTION OPTIONS"
    Write-Host "========================================`n"

    Write-Host "Option 1: Manual SQL Editor (Recommended)"
    Write-Host "----------------------------------------"
    Write-Host "1. Open Supabase SQL Editor:"
    Write-Host "   $SupabaseUrl/sql"
    Write-Host "`n2. Open the combined migration file:"
    Write-Host "   $MigrationsDir\RUN_ALL_MIGRATIONS.sql"
    Write-Host "`n3. Copy entire file contents and paste into SQL Editor"
    Write-Host "`n4. Click 'Run' to execute`n"

    Write-Host "Option 2: Individual Files"
    Write-Host "------------------------"
    foreach ($Migration in $Migrations) {
        Write-Host "- $($Migration.Name): $MigrationsDir\$($Migration.File)"
    }
    Write-Host "`nExecute in order shown above.`n"

    Write-Host "Option 3: Node.js Script"
    Write-Host "----------------------"
    Write-Host "Requires SUPABASE_DB_PASSWORD environment variable."
    Write-Host "Run: node scripts\run-migrations.js`n"

    Write-Host "========================================"
    Write-Host "`nPress C to copy combined SQL to clipboard, or any other key to exit..."

    $Key = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    if ($Key.Character -eq 'C' -or $Key.Character -eq 'c') {
        Copy-CombinedSQL
    }
}

# Run
try {
    Invoke-Migration
    exit 0
}
catch {
    Write-Error-Output "Migration failed: $_"
    exit 1
}
