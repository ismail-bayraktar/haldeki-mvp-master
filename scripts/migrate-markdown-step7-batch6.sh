#!/bin/bash
# Step 7: Batch 6 - Move report files (2026-01)
set -euo pipefail

echo "[*] Moving Batch 6: Report files (2026-01)..."

git mv PERFORMANCE_OPTIMIZATION_REPORT.md docs/07-raporlar/2026-01/performans-optimizasyonu.md 2>/dev/null || echo "[!] PERFORMANCE_OPTIMIZATION_REPORT.md already moved"
git mv SECURITY_VERIFICATION_REPORT_2026-01-09.md docs/07-raporlar/2026-01/guvenlik-dogrulama-2026-01-09.md 2>/dev/null || echo "[!] SECURITY_VERIFICATION_REPORT_2026-01-09.md already moved"
git mv SEO_PERFORMANCE_FIXES.md docs/07-raporlar/2026-01/seo-performans-duzeltmeleri.md 2>/dev/null || echo "[!] SEO_PERFORMANCE_FIXES.md already moved"
git mv SPRINT2_BREADCRUMBS_IMPLEMENTATION.md docs/07-raporlar/2026-01/sprint2-breadcrumb.md 2>/dev/null || echo "[!] SPRINT2_BREADCRUMBS_IMPLEMENTATION.md already moved"
git mv SUPERSCRIPT_BADGE_SAFE_MODERN.md docs/07-raporlar/2026-01/superscript-badge.md 2>/dev/null || echo "[!] SUPERSCRIPT_BADGE_SAFE_MODERN.md already moved"
git mv TEST_INFRASTRUCTURE_P0_P1_REPORT.md docs/07-raporlar/2026-01/test-altyapisi-p0-p1.md 2>/dev/null || echo "[!] TEST_INFRASTRUCTURE_P0_P1_REPORT.md already moved"
git mv TEST_INFRASTRUCTURE_P2_REPORT.md docs/07-raporlar/2026-01/test-altyapisi-p2.md 2>/dev/null || echo "[!] TEST_INFRASTRUCTURE_P2_REPORT.md already moved"
git mv TEST_INFRASTRUCTURE_P3_REPORT.md docs/07-raporlar/2026-01/test-altyapisi-p3.md 2>/dev/null || echo "[!] TEST_INFRASTRUCTURE_P3_REPORT.md already moved"
git mv TEST_INFRASTRUCTURE_FIX_GUIDE.md docs/07-raporlar/2026-01/test-altyapisi-duzeltme-rehberi.md 2>/dev/null || echo "[!] TEST_INFRASTRUCTURE_FIX_GUIDE.md already moved"

git commit -m "docs: move 2026-01 reports to docs/07-raporlar/2026-01

- Organize all January 2026 reports by date
- Include performance, security, SEO, and test infrastructure reports

Part 6 of markdown reorganization (Batch 6/6)
"

echo "[OK] Batch 6 complete - All files moved!"
echo "[i] Next: Run migrate-markdown-step8-update-links.sh"
