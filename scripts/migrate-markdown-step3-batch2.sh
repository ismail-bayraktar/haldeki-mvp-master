#!/bin/bash
# Step 3: Batch 2 - Move user guide files
set -euo pipefail

echo "[*] Moving Batch 2: User Guide files..."

git mv PASSWORD_RESET_FINAL_REPORT.md docs/02-kullanim-kilavuzlari/sifre-sifirlama/son-rapor.md 2>/dev/null || echo "[!] PASSWORD_RESET_FINAL_REPORT.md already moved"
git mv PASSWORD_RESET_FINAL_SUMMARY.md docs/02-kullanim-kilavuzlari/sifre-sifirlama/ozet.md 2>/dev/null || echo "[!] PASSWORD_RESET_FINAL_SUMMARY.md already moved"
git mv PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md docs/02-kullanim-kilavuzlari/sifre-sifirlama/uygulama-tamamlandi.md 2>/dev/null || echo "[!] PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md already moved"
git mv QUICK_STORAGE_SETUP.md docs/02-kullanim-kilavuzlari/depolama-kurulumu.md 2>/dev/null || echo "[!] QUICK_STORAGE_SETUP.md already moved"
git mv global-product-catalog.md docs/02-kullanim-kilavuzlari/urun-katalogu.md 2>/dev/null || echo "[!] global-product-catalog.md already moved"
git mv supplier-product-readiness-analysis.md docs/02-kullanim-kilavuzlari/tedarikci-urun-hazirligi.md 2>/dev/null || echo "[!] supplier-product-readiness-analysis.md already moved"

git commit -m "docs: move user guides to docs/02-kullanim-kilavuzlari

- Organize password reset docs under sifre-sifirlama/
- Move storage and product catalog guides

Part 2 of markdown reorganization (Batch 2/6)
"

echo "[OK] Batch 2 complete"
echo "[i] Next: Run migrate-markdown-step4-batch3.sh"
