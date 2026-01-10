#!/bin/bash
# Step 2: Batch 1 - Move getting started files
set -euo pipefail

echo "[*] Moving Batch 1: Getting Started files..."

git mv README.md docs/01-baslangic/proje-genel-bakis.md 2>/dev/null || echo "[!] README.md already moved or not found"
git mv QUICK_REFERENCE.md docs/01-baslangic/hizli-referans.md 2>/dev/null || echo "[!] QUICK_REFERENCE.md already moved or not found"
git mv RECOVERY_README.md docs/01-baslangic/acil-durum-kurtarma.md 2>/dev/null || echo "[!] RECOVERY_README.md already moved or not found"

git commit -m "docs: move getting started files to docs/01-baslangic

- Move README.md -> docs/01-baslangic/proje-genel-bakis.md
- Move QUICK_REFERENCE.md -> docs/01-baslangic/hizli-referans.md
- Move RECOVERY_README.md -> docs/01-baslangic/acil-durum-kurtarma.md

Part 1 of markdown reorganization (Batch 1/6)
"

echo "[OK] Batch 1 complete"
echo "[i] Next: Run migrate-markdown-step3-batch2.sh"
