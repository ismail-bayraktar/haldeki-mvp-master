# PowerShell version - Master script for markdown migration
# Run on Windows when bash is not available

$ErrorActionPreference = "Continue"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  MARKDOWN MIGRATION (PowerShell)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "scripts")) {
    Write-Host "[!] Error: Run from project root directory" -ForegroundColor Red
    exit 1
}

# Prerequisites check
Write-Host "[*] Checking prerequisites..." -ForegroundColor Yellow

# Check git status
$status = git status --porcelain 2>$null
if ($status) {
    Write-Host "[!] Warning: You have uncommitted changes" -ForegroundColor Red
    $confirm = Read-Host "Continue anyway? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "[i] Migration cancelled" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "[OK] Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Create backup branch
Write-Host "[*] Creating backup branch..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBranch = "pre-migration-backup-$timestamp"

git branch $backupBranch
Write-Host "[OK] Backup branch created: $backupBranch" -ForegroundColor Green
Write-Host ""

# Step 1: Create directories
Write-Host "[*] Step 1: Creating directory structure..." -ForegroundColor Yellow

$dirs = @(
    "docs/01-baslangic",
    "docs/02-kullanim-kilavuzlari/sifre-sifirlama",
    "docs/03-test-raporlari/supply-chain",
    "docs/04-surum-yonetimi",
    "docs/05-acil-durum",
    "docs/06-deployment",
    "docs/07-raporlar/2026-01"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  [+] Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  [i] Exists: $dir" -ForegroundColor Cyan
    }
}

Write-Host "[OK] Directory structure created" -ForegroundColor Green
Write-Host ""

# Step 2: Move files (Batch 1 - Getting Started)
Write-Host "[*] Step 2: Moving Batch 1 (Getting Started)..." -ForegroundColor Yellow

$batch1 = @{
    "README.md" = "docs/01-baslangic/proje-genel-bakis.md"
    "QUICK_REFERENCE.md" = "docs/01-baslangic/hizli-referans.md"
    "RECOVERY_README.md" = "docs/01-baslangic/acil-durum-kurtarma.md"
}

foreach ($src in $batch1.Keys) {
    $dest = $batch1[$src]
    if (Test-Path $src) {
        git mv $src $dest
        Write-Host "  [+] Moved: $src -> $dest" -ForegroundColor Green
    } else {
        Write-Host "  [!] Not found: $src" -ForegroundColor Yellow
    }
}

git commit -m "docs: move getting started files to docs/01-baslangic

- Move README.md -> docs/01-baslangic/proje-genel-bakis.md
- Move QUICK_REFERENCE.md -> docs/01-baslangic/hizli-referans.md
- Move RECOVERY_README.md -> docs/01-baslangic/acil-durum-kurtarma.md

Part 1 of markdown reorganization (Batch 1/6)
"

Write-Host "[OK] Batch 1 complete" -ForegroundColor Green
Write-Host ""

# Step 3: Move files (Batch 2 - User Guides)
Write-Host "[*] Step 3: Moving Batch 2 (User Guides)..." -ForegroundColor Yellow

$batch2 = @{
    "PASSWORD_RESET_FINAL_REPORT.md" = "docs/02-kullanim-kilavuzlari/sifre-sifirlama/son-rapor.md"
    "PASSWORD_RESET_FINAL_SUMMARY.md" = "docs/02-kullanim-kilavuzlari/sifre-sifirlama/ozet.md"
    "PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md" = "docs/02-kullanim-kilavuzlari/sifre-sifirlama/uygulama-tamamlandi.md"
    "QUICK_STORAGE_SETUP.md" = "docs/02-kullanim-kilavuzlari/depolama-kurulumu.md"
    "global-product-catalog.md" = "docs/02-kullanim-kilavuzlari/urun-katalogu.md"
    "supplier-product-readiness-analysis.md" = "docs/02-kullanim-kilavuzlari/tedarikci-urun-hazirligi.md"
}

foreach ($src in $batch2.Keys) {
    $dest = $batch2[$src]
    if (Test-Path $src) {
        git mv $src $dest
        Write-Host "  [+] Moved: $src -> $dest" -ForegroundColor Green
    } else {
        Write-Host "  [!] Not found: $src" -ForegroundColor Yellow
    }
}

git commit -m "docs: move user guides to docs/02-kullanim-kilavuzlari

- Organize password reset docs under sifre-sifirlama/
- Move storage and product catalog guides

Part 2 of markdown reorganization (Batch 2/6)
"

Write-Host "[OK] Batch 2 complete" -ForegroundColor Green
Write-Host ""

# Step 4: Move files (Batch 3 - Test Reports)
Write-Host "[*] Step 4: Moving Batch 3 (Test Reports)..." -ForegroundColor Yellow

$batch3 = @{
    "TEST_RESULTS_SUMMARY.md" = "docs/03-test-raporlari/genel-ozet.md"
    "TEST_RESULTS_ADMIN.md" = "docs/03-test-raporlari/admin-panel-testleri.md"
    "TEST_RESULTS_CUSTOMER.md" = "docs/03-test-raporlari/musteri-testleri.md"
    "TEST_RESULTS_DISTRIBUTION.md" = "docs/03-test-raporlari/dagitim-testleri.md"
    "TEST_RESULTS_SUPPLY_CHAIN.md" = "docs/03-test-raporlari/supply-chain-testleri.md"
    "TESTING_GUIDE_GUEST_UX.md" = "docs/03-test-raporlari/misafir-ux-rehberi.md"
    "TEST_REPORT_SUPPLIER_PRODUCTS_UI.md" = "docs/03-test-raporlari/tedarikci-ui-testleri.md"
    "PHASE2_WHITELIST_TEST_REPORT.md" = "docs/03-test-raporlari/whitelist-test-raporu.md"
    "PHASE3_MIGRATION_STATUS_REPORT.md" = "docs/03-test-raporlari/migrasyon-durumu.md"
    "PHASE3_TECHNICAL_DEBT_REPORT.md" = "docs/03-test-raporlari/teknik-borclanma-raporu.md"
    "PHASE4_TESTING_VERIFICATION_REPORT.md" = "docs/03-test-raporlari/dogrulama-raporu.md"
}

foreach ($src in $batch3.Keys) {
    $dest = $batch3[$src]
    if (Test-Path $src) {
        git mv $src $dest
        Write-Host "  [+] Moved: $src -> $dest" -ForegroundColor Green
    } else {
        Write-Host "  [!] Not found: $src" -ForegroundColor Yellow
    }
}

git commit -m "docs: move test reports to docs/03-test-raporlari

- Organize all test reports under dedicated directory
- Separate by functional area (admin, customer, distribution)

Part 3 of markdown reorganization (Batch 3/6)
"

Write-Host "[OK] Batch 3 complete" -ForegroundColor Green
Write-Host ""

# Step 5: Move files (Batch 4 - Release Management & Supply Chain)
Write-Host "[*] Step 5: Moving Batch 4 (Release Management & Supply Chain)..." -ForegroundColor Yellow

$batch4_release = @{
    "PHASE3_DEPLOYMENT_EXECUTE.md" = "docs/04-surum-yonetimi/phase3-uygulama.md"
    "PHASE3_DEPLOYMENT_GUIDE.md" = "docs/04-surum-yonetimi/phase3-rehber.md"
    "PHASE4_FINAL_SUMMARY.md" = "docs/04-surum-yonetimi/phase4-ozet.md"
    "PHASE4_UI_IMPROVEMENTS.md" = "docs/04-surum-yonetimi/phase4-ui-gelistirmeleri.md"
    "SUPABASE_VERIFICATION_REPORT.md" = "docs/04-surum-yonetimi/supabase-dogrulama.md"
    "STORAGE_SETUP_REPORT.md" = "docs/04-surum-yonetimi/depolama-kurulum-raporu.md"
    "WHITELIST_SYSTEM_COMPLETE_REPORT.md" = "docs/04-surum-yonetimi/whitelist-sistemi-tamamlandi.md"
}

$batch4_supply = @{
    "SUPPLY_CHAIN_TEST_DELIVERY_SUMMARY.md" = "docs/03-test-raporlari/supply-chain/teslimat-ozeti.md"
    "SUPPLY_CHAIN_TEST_EXECUTION_CHECKLIST.md" = "docs/03-test-raporlari/supply-chain/uygulama-checklist.md"
    "SUPPLY_CHAIN_TEST_MATRIX.md" = "docs/03-test-raporlari/supply-chain/test-matrix.md"
    "SUPPLY_CHAIN_TEST_QUICK_REFERENCE.md" = "docs/03-test-raporlari/supply-chain/hizli-referans.md"
}

$batch4 = $batch4_release + $batch4_supply

foreach ($src in $batch4.Keys) {
    $dest = $batch4[$src]
    if (Test-Path $src) {
        git mv $src $dest
        Write-Host "  [+] Moved: $src -> $dest" -ForegroundColor Green
    } else {
        Write-Host "  [!] Not found: $src" -ForegroundColor Yellow
    }
}

git commit -m "docs: move release management and supply chain tests

- Move deployment and phase docs to docs/04-surum-yonetimi
- Organize supply chain tests under docs/03-test-raporlari/supply-chain/

Part 4 of markdown reorganization (Batch 4/6)
"

Write-Host "[OK] Batch 4 complete" -ForegroundColor Green
Write-Host ""

# Step 6: Move files (Batch 5 - Emergency & Deployment)
Write-Host "[*] Step 6: Moving Batch 5 (Emergency & Deployment)..." -ForegroundColor Yellow

$batch5 = @{
    "EMERGENCY_RECOVERY_GUIDE.md" = "docs/05-acil-durum/kurtarma-rehberi.md"
    "RECOVERY_STATUS.md" = "docs/05-acil-durum/kurtarma-durumu.md"
    "RECOVERY_SUMMARY.md" = "docs/05-acil-durum/kurtarma-ozeti.md"
    "RECOVERY_TEST_RESULTS.md" = "docs/05-acil-durum/kurtarma-test-sonuclari.md"
    "DEPLOYMENT_SECURITY_CHECKLIST.md" = "docs/06-deployment/guvenlik-checklist.md"
    "DEPLOYMENT_VERIFICATION.md" = "docs/06-deployment/dogrulama.md"
}

foreach ($src in $batch5.Keys) {
    $dest = $batch5[$src]
    if (Test-Path $src) {
        git mv $src $dest
        Write-Host "  [+] Moved: $src -> $dest" -ForegroundColor Green
    } else {
        Write-Host "  [!] Not found: $src" -ForegroundColor Yellow
    }
}

git commit -m "docs: move emergency and deployment files

- Move emergency recovery docs to docs/05-acil-durum
- Move deployment docs to docs/06-deployment

Part 5 of markdown reorganization (Batch 5/6)
"

Write-Host "[OK] Batch 5 complete" -ForegroundColor Green
Write-Host ""

# Step 7: Move files (Batch 6 - Reports)
Write-Host "[*] Step 7: Moving Batch 6 (Reports 2026-01)..." -ForegroundColor Yellow

$batch6 = @{
    "PERFORMANCE_OPTIMIZATION_REPORT.md" = "docs/07-raporlar/2026-01/performans-optimizasyonu.md"
    "SECURITY_VERIFICATION_REPORT_2026-01-09.md" = "docs/07-raporlar/2026-01/guvenlik-dogrulama-2026-01-09.md"
    "SEO_PERFORMANCE_FIXES.md" = "docs/07-raporlar/2026-01/seo-performans-duzeltmeleri.md"
    "SPRINT2_BREADCRUMBS_IMPLEMENTATION.md" = "docs/07-raporlar/2026-01/sprint2-breadcrumb.md"
    "SUPERSCRIPT_BADGE_SAFE_MODERN.md" = "docs/07-raporlar/2026-01/superscript-badge.md"
    "TEST_INFRASTRUCTURE_P0_P1_REPORT.md" = "docs/07-raporlar/2026-01/test-altyapisi-p0-p1.md"
    "TEST_INFRASTRUCTURE_P2_REPORT.md" = "docs/07-raporlar/2026-01/test-altyapisi-p2.md"
    "TEST_INFRASTRUCTURE_P3_REPORT.md" = "docs/07-raporlar/2026-01/test-altyapisi-p3.md"
    "TEST_INFRASTRUCTURE_FIX_GUIDE.md" = "docs/07-raporlar/2026-01/test-altyapisi-duzeltme-rehberi.md"
}

foreach ($src in $batch6.Keys) {
    $dest = $batch6[$src]
    if (Test-Path $src) {
        git mv $src $dest
        Write-Host "  [+] Moved: $src -> $dest" -ForegroundColor Green
    } else {
        Write-Host "  [!] Not found: $src" -ForegroundColor Yellow
    }
}

git commit -m "docs: move 2026-01 reports to docs/07-raporlar/2026-01

- Organize all January 2026 reports by date
- Include performance, security, SEO, and test infrastructure reports

Part 6 of markdown reorganization (Batch 6/6)
"

Write-Host "[OK] Batch 6 complete - All files moved!" -ForegroundColor Green
Write-Host ""

# Step 8: Update links
Write-Host "[*] Step 8: Updating internal links..." -ForegroundColor Yellow

$linkMap = @{
    "README.md" = "docs/01-baslangic/proje-genel-bakis.md"
    "QUICK_REFERENCE.md" = "docs/01-baslangic/hizli-referans.md"
    "RECOVERY_README.md" = "docs/01-baslangic/acil-durum-kurtarma.md"
    "PASSWORD_RESET_FINAL_REPORT.md" = "docs/02-kullanim-kilavuzlari/sifre-sifirlama/son-rapor.md"
    "PASSWORD_RESET_FINAL_SUMMARY.md" = "docs/02-kullanim-kilavuzlari/sifre-sifirlama/ozet.md"
    "PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md" = "docs/02-kullanim-kilavuzlari/sifre-sifirlama/uygulama-tamamlandi.md"
    "QUICK_STORAGE_SETUP.md" = "docs/02-kullanim-kilavuzlari/depolama-kurulumu.md"
    "DEPLOYMENT_SECURITY_CHECKLIST.md" = "docs/06-deployment/guvenlik-checklist.md"
    "DEPLOYMENT_VERIFICATION.md" = "docs/06-deployment/dogrulama.md"
    "EMERGENCY_RECOVERY_GUIDE.md" = "docs/05-acil-durum/kurtarma-rehberi.md"
}

$files = Get-ChildItem -Path . -Filter "*.md" -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.git" }

$linkCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $updated = $false

    foreach ($oldLink in $linkMap.Keys) {
        $newLink = $linkMap[$oldLink]
        if ($content -match "\]($oldLink)") {
            $content = $content -replace "\]($oldLink)", "]($newLink)"
            $updated = $true
            Write-Host "  [+] Updated in $($file.Name): $oldLink -> $newLink" -ForegroundColor Green
            $linkCount++
        }
    }

    if ($updated) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    }
}

git add .
git commit -m "docs: update internal markdown links

- Update all internal markdown links to new paths
- Processed links in $($files.Count) files, updated $linkCount links

Part 7 of markdown reorganization
"

Write-Host "[OK] Links updated: $linkCount links" -ForegroundColor Green
Write-Host ""

# Step 9: Verification
Write-Host "[*] Step 9: Verifying links..." -ForegroundColor Yellow

$brokenCount = 0
$validCount = 0

$mdFiles = Get-ChildItem -Path . -Filter "*.md" -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch "\.git" }

foreach ($file in $mdFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    if ($content -match '\[([^\]]+)\]\(([^)]+\.md)\)') {
        $link = $matches[2]

        # Skip absolute URLs
        if ($link -match "^https?://") {
            continue
        }

        # Resolve path
        $targetPath = Join-Path $file.DirectoryName $link

        if (Test-Path $targetPath) {
            $validCount++
        } else {
            $brokenCount++
            Write-Host "  [!] BROKEN: $($file.Name) -> $link" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Link Verification Report ===" -ForegroundColor Cyan
Write-Host "Valid links: $validCount" -ForegroundColor Green
Write-Host "Broken links: $brokenCount" -ForegroundColor $(if ($brokenCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($brokenCount -gt 0) {
    Write-Host "[!] WARNING: Found $brokenCount broken links!" -ForegroundColor Red
    Write-Host "[i] Please review and fix before pushing to main" -ForegroundColor Yellow
} else {
    Write-Host "[OK] All links are valid!" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes: git log --oneline -10" -ForegroundColor White
Write-Host "  2. Test application locally" -ForegroundColor White
Write-Host "  3. Push to remote: git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "Backup branch: $backupBranch" -ForegroundColor Cyan
Write-Host "If issues occur, restore: git checkout $backupBranch" -ForegroundColor Yellow
Write-Host ""
