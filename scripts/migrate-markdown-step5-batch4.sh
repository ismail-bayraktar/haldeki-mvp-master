#!/bin/bash
# Step 5: Batch 4 - Move release management and supply chain test files
set -euo pipefail

echo "[*] Moving Batch 4: Release Management & Supply Chain Test files..."

# Release Management
git mv PHASE3_DEPLOYMENT_EXECUTE.md docs/04-surum-yonetimi/phase3-uygulama.md 2>/dev/null || echo "[!] PHASE3_DEPLOYMENT_EXECUTE.md already moved"
git mv PHASE3_DEPLOYMENT_GUIDE.md docs/04-surum-yonetimi/phase3-rehber.md 2>/dev/null || echo "[!] PHASE3_DEPLOYMENT_GUIDE.md already moved"
git mv PHASE4_FINAL_SUMMARY.md docs/04-surum-yonetimi/phase4-ozet.md 2>/dev/null || echo "[!] PHASE4_FINAL_SUMMARY.md already moved"
git mv PHASE4_UI_IMPROVEMENTS.md docs/04-surum-yonetimi/phase4-ui-gelistirmeleri.md 2>/dev/null || echo "[!] PHASE4_UI_IMPROVEMENTS.md already moved"
git mv SUPABASE_VERIFICATION_REPORT.md docs/04-surum-yonetimi/supabase-dogrulama.md 2>/dev/null || echo "[!] SUPABASE_VERIFICATION_REPORT.md already moved"
git mv STORAGE_SETUP_REPORT.md docs/04-surum-yonetimi/depolama-kurulum-raporu.md 2>/dev/null || echo "[!] STORAGE_SETUP_REPORT.md already moved"
git mv WHITELIST_SYSTEM_COMPLETE_REPORT.md docs/04-surum-yonetimi/whitelist-sistemi-tamamlandi.md 2>/dev/null || echo "[!] WHITELIST_SYSTEM_COMPLETE_REPORT.md already moved"

# Supply Chain Tests
git mv SUPPLY_CHAIN_TEST_DELIVERY_SUMMARY.md docs/03-test-raporlari/supply-chain/teslimat-ozeti.md 2>/dev/null || echo "[!] SUPPLY_CHAIN_TEST_DELIVERY_SUMMARY.md already moved"
git mv SUPPLY_CHAIN_TEST_EXECUTION_CHECKLIST.md docs/03-test-raporlari/supply-chain/uygulama-checklist.md 2>/dev/null || echo "[!] SUPPLY_CHAIN_TEST_EXECUTION_CHECKLIST.md already moved"
git mv SUPPLY_CHAIN_TEST_MATRIX.md docs/03-test-raporlari/supply-chain/test-matrix.md 2>/dev/null || echo "[!] SUPPLY_CHAIN_TEST_MATRIX.md already moved"
git mv SUPPLY_CHAIN_TEST_QUICK_REFERENCE.md docs/03-test-raporlari/supply-chain/hizli-referans.md 2>/dev/null || echo "[!] SUPPLY_CHAIN_TEST_QUICK_REFERENCE.md already moved"

git commit -m "docs: move release management and supply chain tests

- Move deployment and phase docs to docs/04-surum-yonetimi
- Organize supply chain tests under docs/03-test-raporlari/supply-chain/

Part 4 of markdown reorganization (Batch 4/6)
"

echo "[OK] Batch 4 complete"
echo "[i] Next: Run migrate-markdown-step6-batch5.sh"
