#!/bin/bash
# Step 4: Batch 3 - Move test report files
set -euo pipefail

echo "[*] Moving Batch 3: Test Report files..."

git mv TEST_RESULTS_SUMMARY.md docs/03-test-raporlari/genel-ozet.md 2>/dev/null || echo "[!] TEST_RESULTS_SUMMARY.md already moved"
git mv TEST_RESULTS_ADMIN.md docs/03-test-raporlari/admin-panel-testleri.md 2>/dev/null || echo "[!] TEST_RESULTS_ADMIN.md already moved"
git mv TEST_RESULTS_CUSTOMER.md docs/03-test-raporlari/musteri-testleri.md 2>/dev/null || echo "[!] TEST_RESULTS_CUSTOMER.md already moved"
git mv TEST_RESULTS_DISTRIBUTION.md docs/03-test-raporlari/dagitim-testleri.md 2>/dev/null || echo "[!] TEST_RESULTS_DISTRIBUTION.md already moved"
git mv TEST_RESULTS_SUPPLY_CHAIN.md docs/03-test-raporlari/supply-chain-testleri.md 2>/dev/null || echo "[!] TEST_RESULTS_SUPPLY_CHAIN.md already moved"
git mv TESTING_GUIDE_GUEST_UX.md docs/03-test-raporlari/misafir-ux-rehberi.md 2>/dev/null || echo "[!] TESTING_GUIDE_GUEST_UX.md already moved"
git mv TEST_REPORT_SUPPLIER_PRODUCTS_UI.md docs/03-test-raporlari/tedarikci-ui-testleri.md 2>/dev/null || echo "[!] TEST_REPORT_SUPPLIER_PRODUCTS_UI.md already moved"
git mv PHASE2_WHITELIST_TEST_REPORT.md docs/03-test-raporlari/whitelist-test-raporu.md 2>/dev/null || echo "[!] PHASE2_WHITELIST_TEST_REPORT.md already moved"
git mv PHASE3_MIGRATION_STATUS_REPORT.md docs/03-test-raporlari/migrasyon-durumu.md 2>/dev/null || echo "[!] PHASE3_MIGRATION_STATUS_REPORT.md already moved"
git mv PHASE3_TECHNICAL_DEBT_REPORT.md docs/03-test-raporlari/teknik-borclanma-raporu.md 2>/dev/null || echo "[!] PHASE3_TECHNICAL_DEBT_REPORT.md already moved"
git mv PHASE4_TESTING_VERIFICATION_REPORT.md docs/03-test-raporlari/dogrulama-raporu.md 2>/dev/null || echo "[!] PHASE4_TESTING_VERIFICATION_REPORT.md already moved"

git commit -m "docs: move test reports to docs/03-test-raporlari

- Organize all test reports under dedicated directory
- Separate by functional area (admin, customer, distribution)

Part 3 of markdown reorganization (Batch 3/6)
"

echo "[OK] Batch 3 complete"
echo "[i] Next: Run migrate-markdown-step5-batch4.sh"
