# PowerShell Rollback Script
$ErrorActionPreference = "Continue"

Write-Host "[!] ROLLBACK: Reverting markdown migration..." -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Are you sure? This will move all files back to root. (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "[i] Rollback cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host "[*] Moving all markdown files back to root..." -ForegroundColor Yellow
Write-Host ""

# Find all .md files in docs/ and move them back
$docsFiles = Get-ChildItem -Path "docs" -Filter "*.md" -Recurse -File -ErrorAction SilentlyContinue

$movedCount = 0
$skippedCount = 0

foreach ($file in $docsFiles) {
    $basename = $file.Name
    $targetPath = Join-Path "." $basename

    # Check if target already exists
    if (Test-Path $targetPath) {
        Write-Host "  [!] Skipped: $basename (already exists in root)" -ForegroundColor Yellow
        $skippedCount++
    } else {
        git mv $file.FullName $targetPath
        Write-Host "  [+] Moved: $($file.FullName) -> ./$basename" -ForegroundColor Green
        $movedCount++
    }
}

Write-Host ""
Write-Host "[*] Restoring original links..." -ForegroundColor Yellow

# Reset to state before link updates
git checkout HEAD~1 -- .

git commit -m "revert: rollback markdown migration

- Moved all files back to root directory
- Restored original link structure
- Files moved: $movedCount
- Files skipped: $skippedCount
"

Write-Host ""
Write-Host "[OK] Rollback complete!" -ForegroundColor Green
Write-Host "[i] Files moved: $movedCount" -ForegroundColor Cyan
Write-Host "[i] Files skipped: $skippedCount" -ForegroundColor Cyan
Write-Host ""
Write-Host "If needed, force push: git push origin main --force" -ForegroundColor Yellow
Write-Host ""
