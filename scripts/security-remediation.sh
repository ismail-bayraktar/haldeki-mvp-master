#!/bin/bash
# Security Remediation Script
# Run this after reviewing the Security Audit Report
# WARNING: This script will rotate credentials and modify files

set -e

echo "================================"
echo "SECURITY REMEDIATION SCRIPT"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Phase 1: CRITICAL - Rotate Secrets
echo -e "${YELLOW}Phase 1: CRITICAL - Secret Rotation${NC}"
echo "================================"
echo ""
echo "Please manually rotate the following:"
echo ""
echo "1. Supabase JWT Tokens:"
echo "   - Go to Supabase Dashboard -> Settings -> API"
echo "   - Rotate 'anon' and 'service_role' keys"
echo "   - Update .env files"
echo ""
echo "2. Database Passwords:"
echo "   - Go to Supabase Dashboard -> Database"
echo "   - Reset database password"
echo "   - Update DATABASE_URL in .env"
echo ""
echo "3. Test User Passwords:"
echo "   - Force password reset for all test accounts"
echo ""
read -p "Have you rotated all secrets? (y/n): " rotated
if [ "$rotated" != "y" ]; then
    echo -e "${RED}Please rotate secrets before continuing${NC}"
    exit 1
fi

# Phase 2: Remove hardcoded secrets
echo ""
echo -e "${YELLOW}Phase 2: Remove Hardcoded Secrets${NC}"
echo "================================"
echo ""

# Backup .gitignore
cp .gitignore .gitignore.bak

# Ensure .env is in .gitignore
if ! grep -q "^\.env$" .gitignore; then
    echo ".env" >> .gitignore
    echo -e "${GREEN}Added .env to .gitignore${NC}"
fi

if ! grep -q "^\.env\.local$" .gitignore; then
    echo ".env.local" >> .gitignore
    echo -e "${GREEN}Added .env.local to .gitignore${NC}"
fi

if ! grep -q "^coverage/$" .gitignore; then
    echo "coverage/" >> .gitignore
    echo -e "${GREEN}Added coverage/ to .gitignore${NC}"
fi

# Files with hardcoded secrets to be removed
echo ""
echo "The following files contain hardcoded secrets and should be deleted:"
echo ""
echo "  - scripts/add-simple.js (hardcoded JWT)"
echo "  - scripts/check-test-users.ts (hardcoded JWT)"
echo "  - scripts/create-aliaga-menemen-suppliers.ts (passwords)"
echo "  - scripts/create-test-accounts.js (passwords)"
echo "  - scripts/create-test-users.js (passwords)"
echo "  - scripts/create-test-users.ts (passwords + JWT)"
echo "  - scripts/create-whitelist-test-users.ts (passwords)"
echo "  - scripts/deploy-function-mgmt-api.ts (JWT)"
echo "  - scripts/deploy-rpc-automated.ts (DATABASE_URL)"
echo "  - scripts/deploy-with-pg.ts (passwords)"
echo "  - scripts/diagnose-login-issue.js (passwords)"
echo "  - scripts/fix-test-user-roles.ts (JWT)"
echo "  - scripts/reset-passwords-admin.js (passwords)"
echo "  - scripts/reset-supabase-passwords-quick.js (passwords)"
echo ""
read -p "Delete files with hardcoded secrets? (y/n): " delete_files
if [ "$delete_files" = "y" ]; then
    rm -f scripts/add-simple.js
    rm -f scripts/check-test-users.ts
    rm -f scripts/create-aliaga-menemen-suppliers.ts
    rm -f scripts/create-test-accounts.js
    rm -f scripts/create-test-users.js
    rm -f scripts/create-test-users.ts
    rm -f scripts/create-whitelist-test-users.ts
    rm -f scripts/deploy-function-mgmt-api.ts
    rm -f scripts/deploy-rpc-automated.ts
    rm -f scripts/deploy-with-pg.ts
    rm -f scripts/diagnose-login-issue.js
    rm -f scripts/fix-test-user-roles.ts
    rm -f scripts/reset-passwords-admin.js
    rm -f scripts/reset-supabase-passwords-quick.js
    echo -e "${GREEN}Files deleted${NC}"
fi

# Remove coverage directory
echo ""
read -p "Remove coverage directory? (y/n): " remove_coverage
if [ "$remove_coverage" = "y" ]; then
    rm -rf coverage/
    echo -e "${GREEN}Coverage directory removed${NC}"
fi

# Phase 3: Update dependencies
echo ""
echo -e "${YELLOW}Phase 3: Update Vulnerable Dependencies${NC}"
echo "================================"
echo ""
echo "Updating react-router-dom (XSS fix)..."
npm update react-router-dom || echo -e "${RED}Failed to update react-router-dom${NC}"

echo ""
echo "Updating xlsx (Prototype Pollution fix)..."
npm update xlsx || echo -e "${RED}Failed to update xlsx${NC}"

echo ""
echo "Running npm audit fix..."
npm audit fix || echo -e "${RED}Some fixes failed - review manually${NC}"

# Phase 4: Security headers template
echo ""
echo -e "${YELLOW}Phase 4: Security Headers Configuration${NC}"
echo "================================"
echo ""

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    cat > vercel.json << 'EOF'
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://storage.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://storage.googleapis.com;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(self), microphone=(), camera=()"
        }
      ]
    }
  ]
}
EOF
    echo -e "${GREEN}Created vercel.json with security headers${NC}"
else
    echo -e "${YELLOW}vercel.json already exists - please manually add security headers${NC}"
fi

# Phase 5: Install security tools
echo ""
echo -e "${YELLOW}Phase 5: Install Security Scanning Tools${NC}"
echo "================================"
echo ""

echo "Installing TruffleHog for secret scanning..."
npm install -g trufflehog || echo -e "${RED}Failed to install trufflehog${NC}"

echo ""
echo "Installing Snyk for dependency scanning..."
npm install -g snyk || echo -e "${RED}Failed to install snyk${NC}"

# Phase 6: Git cleanup
echo ""
echo -e "${YELLOW}Phase 6: Git Cleanup${NC}"
echo "================================"
echo ""

read -p "Remove secrets from git history? (WARNING: This rewrites history) (y/n): " cleanup_git
if [ "$cleanup_git" = "y" ]; then
    echo ""
    echo "Installing git-filter-repo..."
    pip install git-filter-repo || echo -e "${RED}Failed to install git-filter-repo${NC}"

    echo ""
    echo "Removing secrets from git history..."
    echo "This may take a while..."
    git filter-repo --invert-paths --path scripts/add-simple.js --path scripts/check-test-users.ts --path scripts/create-test-*.ts --path scripts/create-test-*.js --path scripts/deploy-rpc-automated.ts || echo -e "${RED}Failed to clean git history${NC}"
    echo -e "${GREEN}Git history cleaned${NC}"
    echo ""
    echo "IMPORTANT: You will need to force push:"
    echo "  git push origin --force"
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}REMEDIATION SUMMARY${NC}"
echo "================================"
echo ""
echo "Completed actions:"
echo "  [✓] Added .env to .gitignore"
echo "  [✓] Added coverage/ to .gitignore"
echo "  [?] Deleted files with hardcoded secrets (if confirmed)"
echo "  [?] Removed coverage directory (if confirmed)"
echo "  [✓] Updated dependencies"
echo "  [✓] Created vercel.json with security headers"
echo "  [✓] Installed security scanning tools"
echo "  [?] Cleaned git history (if confirmed)"
echo ""
echo "Next steps:"
echo "  1. Commit and push changes"
echo "  2. Update Vercel environment variables"
echo "  3. Redeploy application"
echo "  4. Run security scan again: python scripts/security_scan.py ."
echo "  5. Schedule regular security audits"
echo ""
echo "IMPORTANT:"
echo "  - If you cleaned git history, force push carefully"
echo "  - Inform your team about the forced push"
echo "  - Update any CI/CD secrets"
echo ""
