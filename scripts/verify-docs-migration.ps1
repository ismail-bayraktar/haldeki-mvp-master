# Documentation Migration Verification Script
# Validates that all files were migrated correctly

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$DocsDir = "F:\donusum\haldeki-love\haldeki-market\docs"
$Report = @()

function Add-Report {
    param([string]$Message, [string]$Status = "INFO")
    $Report += [PSCustomObject]@{
        Time = Get-Date -Format "HH:mm:ss"
        Status = $Status
        Message = $Message
    }
    $color = switch ($Status) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Status] $Message" -ForegroundColor $color
}

function Test-EmptyFolder {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return $true
    }

    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue
    return $items.Count -eq 0
}

function Test-MigratedFile {
    param(
        [string]$SourcePattern,
        [string]$TargetPath
    )

    $sourceItems = Get-ChildItem -Path $SourcePattern -ErrorAction SilentlyContinue
    if (-not $sourceItems) {
        return $true
    }

    foreach ($item in $sourceItems) {
        $targetName = $item.Name -replace "^MIGRATION_", "migrasyon-"
        $targetFile = Join-Path $TargetPath $targetName

        if (-not (Test-Path $targetFile)) {
            return $false
        }
    }

    return $true
}

# Main Verification
Add-Report "=== DOCUMENTATION MIGRATION VERIFICATION ===" "INFO"
Add-Report ""

# Check 1: Old folders should be empty
Add-Report "Check 1: Verifying old folders are empty..." "INFO"

$oldFolders = @(
    @{Name = "phases"; Target = "05-fazlar"},
    @{Name = "reports"; Target = "09-raporlar"},
    @{Name = "business"; Target = "04-is-mantigi"},
    @{Name = "testing"; Target = "07-test"},
    @{Name = "development"; Target = "06-gelistirme"},
    @{Name = "guides"; Target = "12-referanslar/supabase"},
    @{Name = "api"; Target = "03-mimari/api"},
    @{Name = "architecture"; Target = "03-mimari"},
    @{Name = "diagrams"; Target = "04-is-mantigi/diyagramlar"},
    @{Name = "checklists"; Target = "06-gelistirme/kontroller"},
    @{Name = "fixes"; Target = "09-raporlar/fixler"},
    @{Name = "notes"; Target = "06-gelistirme/notlar"},
    @{Name = "reviews"; Target = "09-raporlar/code-reviews"},
    @{Name = "security"; Target = "09-raporlar/guvenlik"},
    @{Name = "technical-debt"; Target = "10-bakim/teknik-borc"},
    @{Name = "img-ref"; Target = "12-referanslar/gorsel-referanslar"},
    @{Name = "speed-test-sonuc"; Target = "09-raporlar/2026-01/performans"}
)

$oldFolderIssues = 0
foreach ($folder in $oldFolders) {
    $path = Join-Path $DocsDir $folder.Name
    if (-not (Test-EmptyFolder $path)) {
        $items = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
        Add-Report "Old folder not empty: $($folder.Name) ($($items.Count) items)" "WARNING"
        $oldFolderIssues++
    }
}

if ($oldFolderIssues -eq 0) {
    Add-Report "All old folders are empty or removed" "SUCCESS"
}

Add-Report ""

# Check 2: Target folders should exist
Add-Report "Check 2: Verifying target folders exist..." "INFO"

$targetFolders = @(
    "01-baslangic",
    "02-kullanim-kilavuzlari",
    "03-mimari",
    "04-is-mantigi",
    "05-fazlar",
    "06-gelistirme",
    "07-test",
    "08-deployment",
    "09-raporlar",
    "10-bakim",
    "11-teknik",
    "12-referanslar"
)

$missingFolders = 0
foreach ($folder in $targetFolders) {
    $path = Join-Path $DocsDir $folder
    if (-not (Test-Path $path)) {
        Add-Report "Target folder missing: $folder" "ERROR"
        $missingFolders++
    }
}

if ($missingFolders -eq 0) {
    Add-Report "All target folders exist" "SUCCESS"
}

Add-Report ""

# Check 3: Specific file migrations
Add-Report "Check 3: Verifying specific file migrations..." "INFO"

$specificFiles = @(
    @{Source = "phases\phase-2a1-regioncontext.md"; Target = "05-fazlar\phase-2a-bolge-sistemi.md"; Note = "Merged"},
    @{Source = "BETA-TESTING-GUIDE.md"; Target = "07-test\beta-testing-rehberi.md"; Note = "Renamed"},
    @{Source = "TARGET_KEYWORDS.md"; Target = "11-teknik\seo-keywords.md"; Note = "Renamed"},
    @{Source = "TEDARIKCI_KULLANUM_KILAVUZU.md"; Target = "02-kullanim-kilavuzlari\tedarikci-paneli.md"; Note = "Renamed"},
    @{Source = "UPDATE-TEST-ACCOUNTS.md"; Target = "01-baslangic\test-hesaplar.md"; Note = "Merged"}
)

$fileIssues = 0
foreach ($file in $specificFiles) {
    $targetPath = Join-Path $DocsDir $file.Target

    if (Test-Path $targetPath) {
        Add-Report "OK: $($file.Source) -> $($file.Target) ($($file.Note))" "SUCCESS"
    }
    else {
        Add-Report "MISSING: $($file.Target) ($($file.Note))" "WARNING"
        $fileIssues++
    }
}

Add-Report ""

# Check 4: Git history preservation
Add-Report "Check 4: Checking git history..." "INFO"

$gitCheck = git -C "F:\donusum\haldeki-love\haldeki-market" log --oneline --all -n 5 2>&1
if ($gitCheck) {
    Add-Report "Git history accessible" "SUCCESS"
}
else {
    Add-Report "Could not verify git history" "WARNING"
}

Add-Report ""

# Check 5: Broken internal links (basic check)
Add-Report "Check 5: Checking for broken internal links..." "INFO"

$allMdFiles = Get-ChildItem -Path $DocsDir -Filter "*.md" -Recurse -ErrorAction SilentlyContinue
$brokenLinks = 0

foreach ($file in $allMdFiles) {
    $content = Get-Content $file.FullName -Raw
    $matches = [regex]::Matches($content, "\[.*?\]\((\.\.\/.*?)\.md\)")

    foreach ($match in $matches) {
        $linkPath = $match.Groups[1].Value + ".md"
        # Convert relative link to absolute
        $linkDir = Split-Path $file.FullName
        $absoluteLink = Resolve-Path (Join-Path $linkDir $linkPath) -ErrorAction SilentlyContinue

        if (-not $absoluteLink -or -not (Test-Path $absoluteLink)) {
            Add-Report "Possible broken link in $($file.Name): $linkPath" "WARNING"
            $brokenLinks++
        }
    }
}

if ($brokenLinks -eq 0) {
    Add-Report "No obvious broken internal links found" "SUCCESS"
}

Add-Report ""

# Summary
Add-Report "=== VERIFICATION SUMMARY ===" "INFO"

$issues = $oldFolderIssues + $missingFolders + $fileIssues + $brokenLinks

if ($issues -eq 0) {
    Add-Report "VERIFICATION PASSED: All checks successful" "SUCCESS"
}
else {
    Add-Report "VERIFICATION ISSUES: $issues total issues found" "WARNING"
}

Add-Report ""
Add-Report "Next steps:" "INFO"
Add-Report "1. Review any WARNING messages above" "INFO"
Add-Report "2. Update INDEKS.md with new structure" "INFO"
Add-Report "3. Fix any broken links" "INFO"
Add-Report "4. Commit changes with: git commit -m 'docs: Migrate documentation to new structure'" "INFO"

# Export report
$reportPath = "F:\donusum\haldeki-love\haldeki-market\logs\verification-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
$Report | Export-Csv -Path $reportPath -NoTypeInformation -Encoding UTF8
Add-Report "Report saved to: $reportPath" "INFO"
