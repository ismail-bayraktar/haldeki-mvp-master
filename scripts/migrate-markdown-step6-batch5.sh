#!/bin/bash
# Step 6: Batch 5 - Move emergency and deployment files
set -euo pipefail

echo "[*] Moving Batch 5: Emergency & Deployment files..."

# Emergency
git mv EMERGENCY_RECOVERY_GUIDE.md docs/05-acil-durum/kurtarma-rehberi.md 2>/dev/null || echo "[!] EMERGENCY_RECOVERY_GUIDE.md already moved"
git mv RECOVERY_STATUS.md docs/05-acil-durum/kurtarma-durumu.md 2>/dev/null || echo "[!] RECOVERY_STATUS.md already moved"
git mv RECOVERY_SUMMARY.md docs/05-acil-durum/kurtarma-ozeti.md 2>/dev/null || echo "[!] RECOVERY_SUMMARY.md already moved"
git mv RECOVERY_TEST_RESULTS.md docs/05-acil-durum/kurtarma-test-sonuclari.md 2>/dev/null || echo "[!] RECOVERY_TEST_RESULTS.md already moved"

# Deployment
git mv DEPLOYMENT_SECURITY_CHECKLIST.md docs/06-deployment/guvenlik-checklist.md 2>/dev/null || echo "[!] DEPLOYMENT_SECURITY_CHECKLIST.md already moved"
git mv DEPLOYMENT_VERIFICATION.md docs/06-deployment/dogrulama.md 2>/dev/null || echo "[!] DEPLOYMENT_VERIFICATION.md already moved"

git commit -m "docs: move emergency and deployment files

- Move emergency recovery docs to docs/05-acil-durum
- Move deployment docs to docs/06-deployment

Part 5 of markdown reorganization (Batch 5/6)
"

echo "[OK] Batch 5 complete"
echo "[i] Next: Run migrate-markdown-step7-batch6.sh"
