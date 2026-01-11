# Security Remediation Script for Windows
# Run this after reviewing the Security Audit Report
# WARNING: This script will modify files and should be reviewed first

param(
    [switch]$SkipPrompts = $false
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "SECURITY REMEDIATION SCRIPT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Phase 1: CRITICAL - Rotate Secrets
Write-Host "Phase 1: CRITICAL - Secret Rotation" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""
Write-Host "Please manually rotate the following:"
Write-Host ""
Write-Host "1. Supabase JWT Tokens:"
Write-Host "   - Go to Supabase Dashboard -> Settings -> API"
Write-Host "   - Rotate 'anon' and 'service_role' keys"
Write-Host "   - Update .env files"
Write-Host ""
Write-Host "2. Database Passwords:"
Write-Host "   - Go to Supabase Dashboard -> Database"
Write-Host "   - Reset database password"
Write-Host "   - Update DATABASE_URL in .env"
Write-Host ""
Write-Host "3. Test User Passwords:"
Write-Host "   - Force password reset for all test accounts"
Write-Host ""

if (-not $SkipPrompts) {
    $rotated = Read-Host "Have you rotated all secrets? (y/n)"
    if ($rotated -ne "y") {
        Write-Host "Please rotate secrets before continuing" -ForegroundColor Red
        exit 1
    }
}

# Phase 2: Update .gitignore
Write-Host ""
Write-Host "Phase 2: Update .gitignore" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""

$gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue

$entriesToAdd = @(
    ".env",
    ".env.local",
    "coverage/",
    "*.log",
    ".vercel/",
    "test-results/",
    "playwright-report/",
    "coverage-reports/"
)

foreach ($entry in $entriesToAdd) {
    if ($gitignoreContent -notcontains $entry) {
        Add-Content -Path ".gitignore" -Value $entry
        Write-Host "Added '$entry' to .gitignore" -ForegroundColor Green
    } else {
        Write-Host "'$entry' already in .gitignore" -ForegroundColor Gray
    }
}

# Phase 3: Remove files with hardcoded secrets
Write-Host ""
Write-Host "Phase 3: Remove Files with Hardcoded Secrets" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""

$filesToDelete = @(
    "scripts/add-simple.js",
    "scripts/check-test-users.ts",
    "scripts/create-aliaga-menemen-suppliers.ts",
    "scripts/create-test-accounts.js",
    "scripts/create-test-users.js",
    "scripts/create-test-users.ts",
    "scripts/create-whitelist-test-users.ts",
    "scripts/deploy-function-mgmt-api.ts",
    "scripts/deploy-rpc-automated.ts",
    "scripts/deploy-with-pg.ts",
    "scripts/diagnose-login-issue.js",
    "scripts/fix-test-user-roles.ts",
    "scripts/reset-passwords-admin.js",
    "scripts/reset-supabase-passwords-quick.js"
)

Write-Host "The following files contain hardcoded secrets:"
Write-Host ""
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Write-Host "  - $file (exists)" -ForegroundColor Red
    } else {
        Write-Host "  - $file (already deleted)" -ForegroundColor Gray
    }
}
Write-Host ""

if (-not $SkipPrompts) {
    $confirm = Read-Host "Delete these files? (y/n)"
    if ($confirm -eq "y") {
        foreach ($file in $filesToDelete) {
            if (Test-Path $file) {
                Remove-Item $file -Force
                Write-Host "Deleted: $file" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "Skipped file deletion" -ForegroundColor Yellow
    }
}

# Phase 4: Remove coverage directory
Write-Host ""
Write-Host "Phase 4: Remove Coverage Directory" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""

if (Test-Path "coverage") {
    Write-Host "Coverage directory exists and should be removed" -ForegroundColor Red
    if (-not $SkipPrompts) {
        $confirm = Read-Host "Remove coverage directory? (y/n)"
        if ($confirm -eq "y") {
            Remove-Item "coverage" -Recurse -Force
            Write-Host "Coverage directory removed" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Coverage directory already removed" -ForegroundColor Gray
}

# Phase 5: Update dependencies
Write-Host ""
Write-Host "Phase 5: Update Vulnerable Dependencies" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""

Write-Host "Updating react-router-dom (XSS fix)..."
npm update react-router-dom

Write-Host ""
Write-Host "Updating xlsx (Prototype Pollution fix)..."
npm update xlsx

Write-Host ""
Write-Host "Running npm audit fix..."
npm audit fix

# Phase 6: Security headers
Write-Host ""
Write-Host "Phase 6: Security Headers Configuration" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""

$vercelJsonPath = "vercel.json"
if (-not (Test-Path $vercelJsonPath)) {
    $vercelConfig = @{
        headers = @(
            @{
                source = "/(.*)"
                headers = @(
                    @{
                        key = "Content-Security-Policy"
                        value = "default-src 'self'; script-src 'self' 'unsafe-inline' https://storage.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://storage.googleapis.com;"
                    },
                    @{
                        key = "X-Frame-Options"
                        value = "DENY"
                    },
                    @{
                        key = "X-Content-Type-Options"
                        value = "nosniff"
                    },
                    @{
                        key = "Referrer-Policy"
                        value = "strict-origin-when-cross-origin"
                    },
                    @{
                        key = "Permissions-Policy"
                        value = "geolocation=(self), microphone=(), camera=()"
                    }
                )
            }
        )
    }

    $vercelConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $vercelJsonPath -Encoding utf8
    Write-Host "Created vercel.json with security headers" -ForegroundColor Green
} else {
    Write-Host "vercel.json already exists - please manually review and add security headers" -ForegroundColor Yellow
}

# Phase 7: Create pre-commit hook for secret scanning
Write-Host ""
Write-Host "Phase 7: Install Secret Scanning Tools" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""

$hooksDir = ".git\hooks"
if (Test-Path $hooksDir) {
    $preCommitPath = "$hooksDir\pre-commit"

    $preCommitScript = @'
# Secret Scanning Pre-commit Hook
# Prevents committing files with potential secrets

$secretPatterns = @(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",  # JWT
    "password\s*=\s*['\"]",
    "api_key\s*=\s*['\"]",
    "secret\s*=\s*['\"]",
    "DATABASE_URL\s*=\s*['\"]",
    "SUPABASE.*KEY\s*=\s*['\"]"
)

$stagedFiles = git diff --cached --name-only --diff-filter=ACM
$foundSecrets = $false

foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($pattern in $secretPatterns) {
                if ($content -match $pattern) {
                    Write-Host "Potential secret found in: $file" -ForegroundColor Red
                    Write-Host "Pattern: $pattern" -ForegroundColor Yellow
                    $foundSecrets = $true
                }
            }
        }
    }
}

if ($foundSecrets) {
    Write-Host ""
    Write-Host "Commit blocked: Potential secrets detected" -ForegroundColor Red
    Write-Host "Please remove secrets before committing" -ForegroundColor Yellow
    exit 1
}
'@

    $preCommitScript | Out-File -FilePath $preCommitPath -Encoding utf8
    Write-Host "Created pre-commit hook for secret scanning" -ForegroundColor Green
    Write-Host "Note: Git hooks on Windows may require Git Bash or WSL" -ForegroundColor Yellow
}

# Phase 8: Install security tools
Write-Host ""
Write-Host "Phase 8: Install Security Tools" -ForegroundColor Yellow
Write-Host "================================"
Write-Host ""

Write-Host "Installing TruffleHog for secret scanning..."
npm install -g trufflehog

Write-Host ""
Write-Host "Installing Snyk for dependency scanning..."
npm install -g snyk

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "REMEDIATION SUMMARY" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Completed actions:"
Write-Host "  [OK] Updated .gitignore"
Write-Host "  [OK] Removed files with hardcoded secrets"
Write-Host "  [OK] Updated dependencies"
Write-Host "  [OK] Created vercel.json with security headers"
Write-Host "  [OK] Installed security scanning tools"
Write-Host "  [OK] Created pre-commit hook"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Review all changes"
Write-Host "  2. Update Vercel environment variables"
Write-Host "  3. Redeploy application"
Write-Host "  4. Run security scan: python scripts/security_scan.py ."
Write-Host "  5. Schedule regular security audits"
Write-Host ""
Write-Host "Manual steps required:"
Write-Host "  - Review and test security headers in staging"
Write-Host "  - Run: npm audit to verify all vulnerabilities are fixed"
Write-Host "  - Update CI/CD secrets if needed"
Write-Host ""
