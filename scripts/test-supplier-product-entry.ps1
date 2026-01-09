# Supplier Product Entry Smoke Test Script
# Tests supplier product entry functionality
# Usage: .\scripts\test-supplier-product-entry.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://haldeki-market.com",

    [Parameter(Mandatory=$false)]
    [string]$TestSupplierEmail = "test-supplier@example.com",

    [Parameter(Mandatory=$false)]
    [string]$TestSupplierPassword = "TestPassword123!",

    [Parameter(Mandatory=$false)]
    [switch]$SkipCleanup = $false
)

# Error handling
$ErrorActionPreference = "Stop"

# Color output function
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Test result tracker
$script:TestResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
    Total = 0
}

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$TestScript
    )

    $script:TestResults.Total++
    Write-ColorOutput "`n[TEST $($_.TestResults.Total)] $Name" "Cyan"

    try {
        $result = & $TestScript
        if ($result) {
            $script:TestResults.Passed++
            Write-ColorOutput "  ✓ PASSED" "Green"
            return $true
        } else {
            $script:TestResults.Failed++
            Write-ColorOutput "  ✗ FAILED" "Red"
            return $false
        }
    } catch {
        $script:TestResults.Failed++
        Write-ColorOutput "  ✗ ERROR: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Setup
Write-ColorOutput "=== Supplier Product Entry Smoke Test ===" "Yellow"
Write-ColorOutput "Base URL: $BaseUrl" "Gray"
Write-ColorOutput "Test Supplier: $TestSupplierEmail" "Gray"
Write-ColorOutput "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Gray"

# Prerequisites check
Write-ColorOutput "`n=== Prerequisites Check ===" "Yellow"

Test-Step "Check Node.js installation" {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-ColorOutput "  Node.js version: $nodeVersion" "Gray"
        return $true
    }
    return $false
}

Test-Step "Check npm installation" {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-ColorOutput "  npm version: $npmVersion" "Gray"
        return $true
    }
    return $false
}

Test-Step "Check if project dependencies installed" {
    Test-Path "node_modules"
}

Test-Step "Check if .env file exists" {
    Test-Path ".env"
}

Test-Step "Check Playwright installation" {
    $playwrightInstalled = npx playwright --version 2>$null
    if ($playwrightInstalled) {
        Write-ColorOutput "  Playwright version: $playwrightInstalled" "Gray"
        return $true
    }
    Write-ColorOutput "  Installing Playwright..." "Yellow"
    npx playwright install chromium
    $playwrightInstalled = npx playwright --version 2>$null
    return $null -ne $playwrightInstalled
}

# Test data preparation
Write-ColorOutput "`n=== Test Data Preparation ===" "Yellow"

$TestProducts = @{
    Product1 = @{
        name = "Test Domates"
        description = "Taze test domatesi"
        category = "Sebze"
        price = 25.50
        unit = "kg"
        stock = 100
    }
    Product2 = @{
        name = "Test Salatalık"
        description = "Taze test salatalığı"
        category = "Sebze"
        price = 15.00
        unit = "adet"
        stock = 50
        variations = @(
            @{ name = "1 kg"; price = 12.00; stock = 30 }
            @{ name = "5 kg"; price = 50.00; stock = 15 }
        )
    }
    Product3 = @{
        name = "Test Biber"
        description = "Dolu açıklama testi"
        category = "Sebze"
        price = 35.75
        unit = "kg"
        stock = 75
    }
}

# Create test image file
Test-Step "Create test image file" {
    $testImagePath = "tests\fixtures\test-product-image.jpg"
    $testImageDir = Split-Path $testImagePath -Parent

    if (-not (Test-Path $testImageDir)) {
        New-Item -ItemType Directory -Path $testImageDir -Force | Out-Null
    }

    # Create a simple 1x1 pixel JPEG (minimal valid image)
    $imageBytes = [byte[]](
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
        0x03, 0x03, 0x04, 0x05, 0x08, 0x05, 0x05, 0x04, 0x04, 0x05, 0x0A, 0x07,
        0x07, 0x06, 0x08, 0x0C, 0x0A, 0x0C, 0x0C, 0x0B, 0x0A, 0x0B, 0x0B, 0x0D,
        0x0E, 0x12, 0x10, 0x0D, 0x0E, 0x11, 0x0E, 0x0B, 0x0B, 0x10, 0x16, 0x10,
        0x11, 0x13, 0x14, 0x15, 0x15, 0x15, 0x0C, 0x0F, 0x17, 0x18, 0x16, 0x14,
        0x18, 0x12, 0x10, 0x15, 0x19, 0x1A, 0x18, 0x16, 0x17, 0x15, 0x18, 0xFF,
        0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0F, 0xFF, 0xDA,
        0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
    )

    [System.IO.File]::WriteAllBytes($testImagePath, $imageBytes)
    Test-Path $testImagePath
}

# Run E2E tests
Write-ColorOutput "`n=== Running E2E Tests ===" "Yellow"

Test-Step "Build project" {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "  Build successful" "Gray"
        return $true
    }
    Write-ColorOutput "  Build failed: $buildResult" "Red"
    return $false
}

Test-Step "Run TypeScript check" {
    $tsCheck = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "  TypeScript check passed" "Gray"
        return $true
    }
    Write-ColorOutput "  TypeScript errors found" "Red"
    return $false
}

Test-Step "Run supplier product E2E tests" {
    $testResult = npx playwright test tests/e2e/supplier/supplier-workflow.spec.ts --reporter=line 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "  E2E tests passed" "Gray"
        return $true
    }
    Write-ColorOutput "  E2E tests failed" "Red"
    Write-ColorOutput $testResult "Gray"
    return $false
}

# Manual test instructions
Write-ColorOutput "`n=== Manual Test Instructions ===" "Yellow"
Write-ColorOutput "Please complete the manual test checklist:" "Cyan"
Write-ColorOutput "  File: scripts/SUPPLIER_SMOKE_TEST_CHECKLIST.md" "Gray"
Write-ColorOutput "`nPress Enter when manual tests are complete..." "Gray"
Read-Host

# Database verification
Write-ColorOutput "`n=== Database Verification ===" "Yellow"

Test-Step "Check test products in database" {
    Write-ColorOutput "  Manual verification required:" "Gray"
    Write-ColorOutput "  1. Connect to Supabase dashboard" "Gray"
    Write-ColorOutput "  2. Navigate to Table Editor > products" "Gray"
    Write-ColorOutput "  3. Verify test products exist" "Gray"
    Write-ColorOutput "  4. Check supplier_id matches test supplier" "Gray"
    Write-ColorOutput "`nEnter 'y' if verified: " "NoNewline" -ForegroundColor Yellow

    $response = Read-Host
    return $response -eq 'y'
}

Test-Step "Check product variations in database" {
    Write-ColorOutput "  Manual verification required:" "Gray"
    Write-ColorOutput "  1. Navigate to Table Editor > product_variations" "Gray"
    Write-ColorOutput "  2. Verify variations for 'Test Salatalık'" "Gray"
    Write-ColorOutput "`nEnter 'y' if verified: " "NoNewline" -ForegroundColor Yellow

    $response = Read-Host
    return $response -eq 'y'
}

Test-Step "Check image storage" {
    Write-ColorOutput "  Manual verification required:" "Gray"
    Write-ColorOutput "  1. Navigate to Storage > product-images" "Gray"
    Write-ColorOutput "  2. Verify uploaded test images exist" "Gray"
    Write-ColorOutput "`nEnter 'y' if verified: " "NoNewline" -ForegroundColor Yellow

    $response = Read-Host
    return $response -eq 'y'
}

# Cleanup
if (-not $SkipCleanup) {
    Write-ColorOutput "`n=== Cleanup ===" "Yellow"

    Test-Step "Delete test products from database" {
        Write-ColorOutput "  Manual cleanup required:" "Gray"
        Write-ColorOutput "  1. Navigate to Supabase Table Editor" "Gray"
        Write-ColorOutput "  2. Delete test products (Test Domates, Test Salatalık, Test Biber)" "Gray"
        Write-ColorOutput "`nEnter 'y' when complete: " "NoNewline" -ForegroundColor Yellow

        $response = Read-Host
        return $response -eq 'y'
    }

    Test-Step "Delete test images from storage" {
        Write-ColorOutput "  Manual cleanup required:" "Gray"
        Write-ColorOutput "  1. Navigate to Supabase Storage > product-images" "Gray"
        Write-ColorOutput "  2. Delete test product images" "Gray"
        Write-ColorOutput "`nEnter 'y' when complete: " "NoNewline" -ForegroundColor Yellow

        $response = Read-Host
        return $response -eq 'y'
    }
}

# Summary
Write-ColorOutput "`n=== Test Summary ===" "Yellow"
Write-ColorOutput "Total Tests: $($TestResults.Total)" "White"
Write-ColorOutput "Passed: $($TestResults.Passed)" "Green"
Write-ColorOutput "Failed: $($TestResults.Failed)" "Red"
Write-ColorOutput "Skipped: $($TestResults.Skipped)" "Gray"

$successRate = if ($TestResults.Total -gt 0) {
    [math]::Round(($TestResults.Passed / $TestResults.Total) * 100, 2)
} else {
    0
}

Write-ColorOutput "Success Rate: $successRate%" "Cyan"

if ($successRate -ge 90) {
    Write-ColorOutput "`n✓ System is PRODUCTION READY" "Green"
    exit 0
} elseif ($successRate -ge 70) {
    Write-ColorOutput "`n⚠ System is PARTIALLY READY - Critical issues need fixing" "Yellow"
    exit 1
} else {
    Write-ColorOutput "`n✗ System is NOT READY - Major issues found" "Red"
    exit 2
}
