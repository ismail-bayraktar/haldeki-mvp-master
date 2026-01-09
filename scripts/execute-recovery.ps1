# ============================================================================
# EMERGENCY USER RECOVERY - PowerShell Script
# ============================================================================
# This script helps execute the recovery SQL via Supabase CLI
# ============================================================================

# Error handling
$ErrorActionPreference = "Stop"

Write-Output "=================================="
Write-Output "EMERGENCY USER RECOVERY"
Write-Output "=================================="
Write-Output ""

# Check if Supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCmd) {
    Write-Warning "Supabase CLI not found"
    Write-Output ""
    Write-Output "INSTALL SUPABASE CLI:"
    Write-Output "  npm install -g supabase"
    Write-Output "  OR"
    Write-Output "  Visit: https://supabase.com/docs/guides/cli"
    Write-Output ""
    Write-Output "ALTERNATIVE:"
    Write-Output "  Copy the SQL from supabase/migrations/20260109200000_emergency_user_recreation.sql"
    Write-Output "  Paste it in Supabase Dashboard > SQL Editor"
    Write-Output "  Execute manually"
    exit 1
}

# Check if logged in
Write-Output "Checking Supabase login status..."
$loginCheck = supabase projects list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Not logged in to Supabase"
    Write-Output ""
    Write-Output "LOGIN REQUIRED:"
    Write-Output "  supabase login"
    Write-Output ""
    exit 1
}

# List projects
Write-Output ""
Write-Output "Available projects:"
supabase projects list

# Get project reference
Write-Output ""
$projectRef = Read-Host "Enter project reference (or press Enter to use: epuhjrdqotyrryvkjnrp)"

if ([string]::IsNullOrWhiteSpace($projectRef)) {
    $projectRef = "epuhjrdqotyrryvkjnrp"
}

# Verify
Write-Output ""
Write-Output "=================================="
Write-Output "RECOVERY SUMMARY"
Write-Output "=================================="
Write-Output "Project: $projectRef"
Write-Output "SQL File: supabase/migrations/20260109200000_emergency_user_recreation.sql"
Write-Output ""
Write-Output "This will CREATE the following users:"
Write-Output "  1. admin@haldeki.com (superadmin)"
Write-Output "  2. superadmin@test.haldeki.com (superadmin)"
Write-Output "  3. supplier-approved@test.haldeki.com (supplier)"
Write-Output ""
Write-Output "PASSWORDS (save these):"
Write-Output "  - AdminRecovery2025!"
Write-Output "  - TestSuperAdmin2025!"
Write-Output "  - TestSupplier2025!"
Write-Output ""

$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Output "Cancelled"
    exit 0
}

# Execute SQL
Write-Output ""
Write-Output "Executing recovery SQL..."

$sqlFile = Join-Path $PSScriptRoot "..\supabase\migrations\20260109200000_emergency_user_recreation.sql"
$sqlFile = Resolve-Path $sqlFile

if (-not (Test-Path $sqlFile)) {
    Write-Error "SQL file not found: $sqlFile"
    exit 1
}

try {
    supabase db execute --project-ref $projectRef --file $sqlFile

    Write-Output ""
    Write-Output "[OK] Recovery SQL executed successfully"
    Write-Output ""
    Write-Output "NEXT STEPS:"
    Write-Output "  1. Run: npm run auth:verify"
    Write-Output "  2. Login as admin@haldeki.com"
    Write-Output "  3. CHANGE PASSWORDS IMMEDIATELY"
}
catch {
    Write-Error "Error executing SQL: $_"
    Write-Output ""
    Write-Output "FALLBACK: Execute SQL manually in Supabase Dashboard"
    exit 1
}
