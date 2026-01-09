# Check Storage Bucket Status for product-images
# Usage: pwsh -File scripts/check-storage-bucket.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# Configuration
$ProjectId = "ynatuiwdvkxcmmnmejkl"
$ProjectUrl = "https://$ProjectId.supabase.co"
$BucketName = "product-images"

Write-Output "[INFO] Checking storage bucket: $BucketName"
Write-Output "[INFO] Project: $ProjectUrl"
Write-Output ""

# Check if .env file exists
$EnvPath = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $EnvPath)) {
    Write-Output "[ERROR] .env file not found at: $EnvPath"
    exit 1
}

# Read anon key from .env
$AnonKey = Select-String -Path $EnvPath -Pattern "VITE_SUPABASE_ANON_KEY" |
    ForEach-Object { $_.Line.Split('"', [StringSplitOptions]::RemoveEmptyEntries)[1] }

if (-not $AnonKey) {
    Write-Output "[ERROR] VITE_SUPABASE_ANON_KEY not found in .env"
    exit 1
}

# Test 1: Check if bucket exists (via public endpoint)
Write-Output "[TEST 1] Checking if bucket exists..."
$BucketCheckUrl = "$ProjectUrl/storage/v1/bucket?name=$BucketName"

try {
    $Response = Invoke-RestMethod -Uri $BucketCheckUrl -Method GET `
        -Headers @{ "apikey" = $AnonKey; "Authorization" = "Bearer $AnonKey" } `
        -ErrorAction Stop

    if ($Response.id -eq $BucketName) {
        Write-Output "[OK] Bucket exists: $($Response.id)"
        Write-Output "    - Public: $($Response.public)"
        Write-Output "    - File Size Limit: $($Response.file_size_limit) bytes"
        Write-Output "    - Allowed MIME Types: $($Response.allowed_mime_types -join ', ')"
    } else {
        Write-Output "[WARN] Bucket response doesn't match expected name"
    }
} catch {
    $Err = $_
    if ($Err.ErrorDetails.Message -match "not found") {
        Write-Output "[FAIL] Bucket does NOT exist"
        Write-Output "       Run migration: supabase/migrations/20260109150000_storage_product_images.sql"
    } else {
        Write-Output "[ERROR] Failed to check bucket: $Err"
    }
    Write-Output ""
    Write-Output "[SUMMARY]"
    Write-Output "  Status: BUCKET MISSING"
    Write-Output "  Action Required: Apply migration script"
    exit 1
}

Write-Output ""

# Test 2: Check public access
Write-Output "[TEST 2] Testing public read access..."
$TestImageUrl = "$ProjectUrl/storage/v1/object/public/$BucketName/test/sample.jpg"

try {
    $Response = Invoke-WebRequest -Uri $TestImageUrl -Method HEAD -ErrorAction Stop
    if ($Response.StatusCode -eq 404) {
        Write-Output "[OK] Public access enabled (404 = no test file, but endpoint works)"
    } else {
        Write-Output "[OK] Public access enabled (Status: $($Response.StatusCode))"
    }
} catch {
    $Err = $_
    if ($Err.ErrorDetails.Message -match "not found") {
        Write-Output "[WARN] Bucket may not be public or RLS policy missing"
    } else {
        Write-Output "[WARN] Could not verify public access: $Err"
    }
}

Write-Output ""

# Test 3: Check migration file exists
Write-Output "[TEST 3] Checking migration file..."
$MigrationFile = Join-Path $PSScriptRoot "..\supabase\migrations\20260109150000_storage_product_images.sql"

if (Test-Path $MigrationFile) {
    Write-Output "[OK] Migration file exists"
    Write-Output "     Path: $MigrationFile"
} else {
    Write-Output "[WARN] Migration file not found"
    Write-Output "       Expected: $MigrationFile"
}

Write-Output ""

# Final summary
Write-Output "[SUMMARY]"
Write-Output "  Bucket: $BucketName"
Write-Output "  Status: CHECK COMPLETE"
Write-Output ""
Write-Output "[NEXT STEPS]"
Write-Output "  1. If bucket missing: Apply migration via Supabase Dashboard SQL Editor"
Write-Output "  2. Test upload: Create a test product as a supplier user"
Write-Output "  3. Verify images display: Check product page shows uploaded images"
Write-Output ""
Write-Output "[DOCUMENTATION]"
Write-Output "  See: STORAGE_SETUP_REPORT.md for detailed instructions"

exit 0
