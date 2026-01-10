# Documentation Migration with Git History Preservation
# Run this script from the project root directory

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = "F:\donusum\haldeki-love\haldeki-market"
$DocsDir = Join-Path $ProjectRoot "docs"
$LogDir = Join-Path $ProjectRoot "logs"
$LogFile = Join-Path $LogDir "migration-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Log-Message {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $logEntry
    Write-Host $logEntry
}

function Test-GitChanges {
    $status = git -C $ProjectRoot status --porcelain 2>&1
    return -not [string]::IsNullOrEmpty($status)
}

function Backup-Branch {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $branchName = "backup-docs-migration-$timestamp"

    Log-Message "Creating backup branch: $branchName"

    try {
        # Create backup branch from current state
        git -C $ProjectRoot checkout -b $branchName 2>&1 | Out-Null
        git -C $ProjectRoot checkout main 2>&1 | Out-Null

        Log-Message "Backup branch created successfully" "SUCCESS"
        return $branchName
    }
    catch {
        Log-Message "Failed to create backup branch: $_" "ERROR"
        throw
    }
}

# Phase 2A Merger Function
function Merge-Phase2A {
    Log-Message "=== PHASE 2A MERGE START ===" "INFO"

    $targetFile = Join-Path $DocsDir "05-fazlar\phase-2a-bolge-sistemi.md"
    $sources = @(
        "phases\phase-2a1-regioncontext.md",
        "phases\phase-2a2-region-products.md",
        "phases\phase-2a3-cart-region.md",
        "phases\phase-2a4-delivery-slots.md"
    )

    $combinedContent = @"
# Phase 2A: Bölge Sistemi

> Tüm bölgesel özelliklerin entegre dokümantasyonu

---

## Bölüm 1: RegionContext
"@

    foreach ($source in $sources) {
        $sourcePath = Join-Path $DocsDir $source
        if (Test-Path $sourcePath) {
            $content = Get-Content $sourcePath -Raw
            $combinedContent += "`n`n---`n`n## $($source -replace 'phases\\phase-2a\d+-', '')`n`n$content"
            Log-Message "Merged: $source" "INFO"
        }
    }

    Set-Content -Path $targetFile -Value $combinedContent -Encoding UTF8
    Log-Message "Phase 2A merge complete: $targetFile" "SUCCESS"
}

# Batch Migration: Reports (Batch 1)
function Migrate-Batch1-Reports {
    Log-Message "=== BATCH 1: REPORTS MIGRATION ===" "INFO"

    $migrations = @(
        @{From="reports\*.md"; To="09-raporlar\2026-01\"},
        @{From="security\*.md"; To="09-raporlar\guvenlik\"},
        @{From="fixes\*.md"; To="09-raporlar\fixler\"},
        @{From="reviews\*.md"; To="09-raporlar\code-reviews\"},
        @{From="speed-test-sonuc\*.pdf"; To="09-raporlar\2026-01\performans\"}
    )

    foreach ($migration in $migrations) {
        $fromPath = Join-Path $DocsDir $migration.From
        $toPath = Join-Path $DocsDir $migration.To

        # Ensure target directory exists
        if (-not (Test-Path $toPath)) {
            New-Item -ItemType Directory -Path $toPath -Force | Out-Null
        }

        $files = Get-ChildItem -Path $fromPath -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $targetPath = Join-Path $toPath $file.Name
            git -C $ProjectRoot mv ($file.FullName) $targetPath 2>&1 | Out-Null
            Log-Message "Moved: $($file.Name) -> $($migration.To)" "INFO"
        }
    }
}

# Batch Migration: Business Logic (Batch 2)
function Migrate-Batch2-Business {
    Log-Message "=== BATCH 2: BUSINESS LOGIC MIGRATION ===" "INFO"

    $migrations = @(
        @{From="business\*"; To="04-is-mantigi\"},
        @{From="diagrams\*"; To="04-is-mantigi\diyagramlar\"}
    )

    foreach ($migration in $migrations) {
        $fromPath = Join-Path $DocsDir $migration.From
        $toPath = Join-Path $DocsDir $migration.To

        if (-not (Test-Path $toPath)) {
            New-Item -ItemType Directory -Path $toPath -Force | Out-Null
        }

        $items = Get-ChildItem -Path $fromPath -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            $targetPath = Join-Path $toPath $item.Name
            git -C $ProjectRoot mv ($item.FullName) $targetPath 2>&1 | Out-Null
            Log-Message "Moved: $($item.Name) -> $($migration.To)" "INFO"
        }
    }
}

# Batch Migration: Testing (Batch 3)
function Migrate-Batch3-Testing {
    Log-Message "=== BATCH 3: TESTING MIGRATION ===" "INFO"

    $fromPath = Join-Path $DocsDir "testing\*"
    $toPath = Join-Path $DocsDir "07-test\"

    if (-not (Test-Path $toPath)) {
        New-Item -ItemType Directory -Path $toPath -Force | Out-Null
    }

    $files = Get-ChildItem -Path $fromPath -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $targetPath = Join-Path $toPath $file.Name
        git -C $ProjectRoot mv ($file.FullName) $targetPath 2>&1 | Out-Null
        Log-Message "Moved: $($file.Name) -> 07-test\" "INFO"
    }

    # Rename BETA-TESTING-GUIDE.md
    $betaGuide = Join-Path $DocsDir "BETA-TESTING-GUIDE.md"
    if (Test-Path $betaGuide) {
        $targetPath = Join-Path $toPath "beta-testing-rehberi.md"
        git -C $ProjectRoot mv $betaGuide $targetPath 2>&1 | Out-Null
        Log-Message "Renamed: BETA-TESTING-GUIDE.md -> beta-testing-rehberi.md" "INFO"
    }
}

# Batch Migration: Development (Batch 4)
function Migrate-Batch4-Development {
    Log-Message "=== BATCH 4: DEVELOPMENT MIGRATION ===" "INFO"

    $migrations = @(
        @{From="development\*"; To="06-gelistirme\"},
        @{From="technical-debt\*"; To="10-bakim\teknik-borc\"},
        @{From="notes\*"; To="06-gelistirme\notlar\"},
        @{From="checklists\*"; To="06-gelistirme\kontroller\"}
    )

    foreach ($migration in $migrations) {
        $fromPath = Join-Path $DocsDir $migration.From
        $toPath = Join-Path $DocsDir $migration.To

        if (-not (Test-Path $toPath)) {
            New-Item -ItemType Directory -Path $toPath -Force | Out-Null
        }

        $items = Get-ChildItem -Path $fromPath -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            $targetPath = Join-Path $toPath $item.Name
            git -C $ProjectRoot mv ($item.FullName) $targetPath 2>&1 | Out-Null
            Log-Message "Moved: $($item.Name) -> $($migration.To)" "INFO"
        }
    }
}

# Batch Migration: Architecture (Batch 5)
function Migrate-Batch5-Architecture {
    Log-Message "=== BATCH 5: ARCHITECTURE MIGRATION ===" "INFO"

    $migrations = @(
        @{From="api\*"; To="03-mimari\api\"},
        @{From="architecture\*"; To="03-mimari\veritabani-semasi.md"}
    )

    foreach ($migration in $migrations) {
        $fromPath = Join-Path $DocsDir $migration.From
        $toPath = Join-Path $DocsDir $migration.To

        if (-not (Test-Path (Split-Path $toPath -Parent))) {
            New-Item -ItemType Directory -Path (Split-Path $toPath -Parent) -Force | Out-Null
        }

        $items = Get-ChildItem -Path $fromPath -ErrorAction SilentlyContinue
        foreach ($item in $items) {
            $targetPath = Join-Path $DocsDir $migration.To
            git -C $ProjectRoot mv ($item.FullName) $targetPath 2>&1 | Out-Null
            Log-Message "Moved: $($item.Name) -> $($migration.To)" "INFO"
        }
    }
}

# Batch Migration: Usage Guides (Batch 6)
function Migrate-Batch6-Guides {
    Log-Message "=== BATCH 6: GUIDES MIGRATION ===" "INFO"

    $migrations = @(
        @{From="guides\*"; To="12-referanslar\supabase\"},
        @{From="SUPERADMIN-*.md"; To="02-kullanim-kilavuzlari\"},
        @{From="PASSWORD_RESET_GUIDE.md"; To="02-kullanim-kilavuzlari\"},
        @{From="TEDARIKCI_KULLANUM_KILAVUZU.md"; To="02-kullanim-kilavuzlari\tedarikci-paneli.md"}
    )

    foreach ($migration in $migrations) {
        $fromPath = Join-Path $DocsDir $migration.From
        $toDir = Join-Path $DocsDir $migration.To
        $toParent = Split-Path $toDir -Parent

        if (-not (Test-Path $toParent)) {
            New-Item -ItemType Directory -Path $toParent -Force | Out-Null
        }

        $files = Get-ChildItem -Path $fromPath -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $targetPath = if ($migration.To -match "\.md$") {
                Join-Path $DocsDir $migration.To
            } else {
                Join-Path $toDir $file.Name
            }

            git -C $ProjectRoot mv ($file.FullName) $targetPath 2>&1 | Out-Null
            Log-Message "Moved: $($file.Name) -> $($migration.To)" "INFO"
        }
    }

    # Merge UPDATE-TEST-ACCOUNTS.md into 01-baslangic/test-hesaplar.md
    $updateTestFile = Join-Path $DocsDir "UPDATE-TEST-ACCOUNTS.md"
    if (Test-Path $updateTestFile) {
        $targetPath = Join-Path $DocsDir "01-baslangic\test-hesaplar.md"
        git -C $ProjectRoot mv $updateTestFile $targetPath 2>&1 | Out-Null
        Log-Message "Moved: UPDATE-TEST-ACCOUNTS.md -> 01-baslangic/test-hesaplar.md" "INFO"
    }
}

# Batch Migration: Deployment (Batch 7)
function Migrate-Batch7-Deployment {
    Log-Message "=== BATCH 7: DEPLOYMENT MIGRATION ===" "INFO"

    $files = Get-ChildItem -Path (Join-Path $DocsDir "MIGRATION_*.md") -ErrorAction SilentlyContinue
    $toDir = Join-Path $DocsDir "08-deployment\"

    if (-not (Test-Path $toDir)) {
        New-Item -ItemType Directory -Path $toDir -Force | Out-Null
    }

    foreach ($file in $files) {
        $newName = $file.Name -replace "^MIGRATION_", "migrasyon-"
        $targetPath = Join-Path $toDir $newName
        git -C $ProjectRoot mv ($file.FullName) $targetPath 2>&1 | Out-Null
        Log-Message "Moved: $($file.Name) -> 08-deployment/$newName" "INFO"
    }
}

# Batch Migration: Technical & References (Batch 8)
function Migrate-Batch8-Technical {
    Log-Message "=== BATCH 8: TECHNICAL & REFERENCES MIGRATION ===" "INFO"

    # TARGET_KEYWORDS.md -> 11-teknik/seo-keywords.md
    $keywordsFile = Join-Path $DocsDir "TARGET_KEYWORDS.md"
    if (Test-Path $keywordsFile) {
        $targetPath = Join-Path $DocsDir "11-teknik\seo-keywords.md"
        git -C $ProjectRoot mv $keywordsFile $targetPath 2>&1 | Out-Null
        Log-Message "Moved: TARGET_KEYWORDS.md -> 11-teknik/seo-keywords.md" "INFO"
    }

    # img-ref -> 12-referanslar/gorsel-referanslar
    $fromPath = Join-Path $DocsDir "img-ref\*"
    $toPath = Join-Path $DocsDir "12-referanslar\gorsel-referanslar\"

    if (-not (Test-Path $toPath)) {
        New-Item -ItemType Directory -Path $toPath -Force | Out-Null
    }

    $items = Get-ChildItem -Path $fromPath -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        $targetPath = Join-Path $toPath $item.Name
        git -C $ProjectRoot mv ($item.FullName) $targetPath 2>&1 | Out-Null
        Log-Message "Moved: $($item.Name) -> 12-referanslar/gorsel-referanslar/" "INFO"
    }
}

# Phase Files Migration (Excluding 2A)
function Migrate-PhaseFiles {
    Log-Message "=== PHASE FILES MIGRATION ===" "INFO"

    $phaseRenames = @{
        "phase-10-import-export.md" = "phase-10-excel.md"
        "phase-11-warehouse-mvp.md" = "phase-11-depo.md"
        "phase-12-multi-supplier.md" = "phase-12-coklu-tedarikci.md"
        "phase-5-approval-system.md" = "phase-5-onay-sistemi.md"
        "phase-6-order-delivery.md" = "phase-6-siparis-teslimat.md"
        "phase-7-payment-system.md" = "phase-7-odeme.md"
        "phase-8-business-panel.md" = "phase-8-b2b-panel.md"
        "phase-9-supplier-panel.md" = "phase-9-mobil-tedarikci.md"
    }

    $phasesDir = Join-Path $DocsDir "phases"
    $targetDir = Join-Path $DocsDir "05-fazlar"

    foreach ($oldName in $phaseRenames.Keys) {
        $fromPath = Join-Path $phasesDir $oldName
        if (Test-Path $fromPath) {
            $newName = $phaseRenames[$oldName]
            $targetPath = Join-Path $targetDir $newName
            git -C $ProjectRoot mv $fromPath $targetPath 2>&1 | Out-Null
            Log-Message "Moved: $oldName -> $newName" "INFO"
        }
    }

    # Direct moves for phases without rename
    $directMoves = @(
        "phase-3-rbac.md",
        "phase-4-email.md"
    )

    foreach ($fileName in $directMoves) {
        $fromPath = Join-Path $phasesDir $fileName
        if (Test-Path $fromPath) {
            $targetPath = Join-Path $targetDir $fileName
            git -C $ProjectRoot mv $fromPath $targetPath 2>&1 | Out-Null
            Log-Message "Moved: $fileName -> 05-fazlar/" "INFO"
        }
    }
}

# Verification Function
function Invoke-Verification {
    Log-Message "=== MIGRATION VERIFICATION ===" "INFO"

    $issues = @()

    # Check for empty old folders
    $oldFolders = @("phases", "reports", "business", "testing", "development", "guides", "api", "architecture", "diagrams", "checklists", "fixes", "notes", "reviews", "security", "technical-debt", "img-ref", "speed-test-sonuc")

    foreach ($folder in $oldFolders) {
        $folderPath = Join-Path $DocsDir $folder
        if (Test-Path $folderPath) {
            $items = Get-ChildItem -Path $folderPath
            if ($items.Count -gt 0) {
                $issues += "Old folder not empty: $folder ($($items.Count) items remaining)"
            }
        }
    }

    # Verify target folders exist
    $targetFolders = @("01-baslangic", "02-kullanim-kilavuzlari", "03-mimari", "04-is-mantigi", "05-fazlar", "06-gelistirme", "07-test", "08-deployment", "09-raporlar", "10-bakim", "11-teknik", "12-referanslar")

    foreach ($folder in $targetFolders) {
        $folderPath = Join-Path $DocsDir $folder
        if (-not (Test-Path $folderPath)) {
            $issues += "Target folder missing: $folder"
        }
    }

    if ($issues.Count -gt 0) {
        Log-Message "=== VERIFICATION ISSUES FOUND ===" "WARNING"
        foreach ($issue in $issues) {
            Log-Message $issue "WARNING"
        }
        return $false
    }
    else {
        Log-Message "=== VERIFICATION PASSED ===" "SUCCESS"
        return $true
    }
}

# Main Execution
function Main {
    Log-Message "=== DOCUMENTATION GIT MIGRATION START ===" "INFO"
    Log-Message "Project Root: $ProjectRoot" "INFO"

    # Check for existing changes
    if (Test-GitChanges) {
        Log-Message "WARNING: Uncommitted changes detected!" "WARNING"
        $response = Read-Host "Continue anyway? (Y/N)"
        if ($response -ne "Y") {
            Log-Message "Migration cancelled by user" "INFO"
            return
        }
    }

    # Create backup branch
    $backupBranch = Backup-Branch

    try {
        # Execute migrations in batches
        Merge-Phase2A
        Migrate-Batch1-Reports
        Migrate-Batch2-Business
        Migrate-Batch3-Testing
        Migrate-Batch4-Development
        Migrate-Batch5-Architecture
        Migrate-Batch6-Guides
        Migrate-Batch7-Deployment
        Migrate-Batch8-Technical
        Migrate-PhaseFiles

        # Verification
        $verified = Invoke-Verification

        if ($verified) {
            Log-Message "=== MIGRATION COMPLETE ===" "SUCCESS"
            Log-Message "Please review changes and commit" "INFO"
            Log-Message "Backup branch: $backupBranch" "INFO"
            Log-Message "Log file: $LogFile" "INFO"
        }
        else {
            Log-Message "=== MIGRATION COMPLETE WITH ISSUES ===" "WARNING"
            Log-Message "Please review verification output" "WARNING"
        }
    }
    catch {
        Log-Message "Migration failed: $_" "ERROR"
        Log-Message "To rollback: git checkout $backupBranch" "ERROR"
        throw
    }
}

# Run main function
Main
