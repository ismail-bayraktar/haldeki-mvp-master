#!/bin/bash
# Master script - Run complete markdown migration
set -euo pipefail

echo "======================================"
echo "  MARKDOWN MIGRATION - MASTER SCRIPT"
echo "======================================"
echo ""
echo "This will migrate 50+ .md files from root to docs/ subdirectories"
echo ""
echo "Prerequisites:"
echo "  - Clean git status (no uncommitted changes)"
echo "  - All changes committed or stashed"
echo "  - Backup branch will be created automatically"
echo ""
read -p "Continue with migration? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "[i] Migration cancelled"
    exit 0
fi

# Create backup branch
echo ""
echo "[*] Creating backup branch..."
git branch pre-migration-backup-$(date +%Y%m%d-%H%M%S)
echo "[OK] Backup branch created"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute steps in order
echo ""
echo "[*] Step 1: Creating directory structure..."
bash "$SCRIPT_DIR/migrate-markdown-step1-dirs.sh"

echo ""
echo "[*] Step 2: Moving Batch 1 (Getting Started)..."
bash "$SCRIPT_DIR/migrate-markdown-step2-batch1.sh"

echo ""
echo "[*] Step 3: Moving Batch 2 (User Guides)..."
bash "$SCRIPT_DIR/migrate-markdown-step3-batch2.sh"

echo ""
echo "[*] Step 4: Moving Batch 3 (Test Reports)..."
bash "$SCRIPT_DIR/migrate-markdown-step4-batch3.sh"

echo ""
echo "[*] Step 5: Moving Batch 4 (Release Management)..."
bash "$SCRIPT_DIR/migrate-markdown-step5-batch4.sh"

echo ""
echo "[*] Step 6: Moving Batch 5 (Emergency & Deployment)..."
bash "$SCRIPT_DIR/migrate-markdown-step6-batch5.sh"

echo ""
echo "[*] Step 7: Moving Batch 6 (Reports 2026-01)..."
bash "$SCRIPT_DIR/migrate-markdown-step7-batch6.sh"

echo ""
echo "[*] Step 8: Updating internal links..."
bash "$SCRIPT_DIR/migrate-markdown-step8-update-links.sh"

echo ""
echo "[*] Step 9: Verifying all links..."
bash "$SCRIPT_DIR/migrate-markdown-step9-verify.sh"

echo ""
echo "======================================"
echo "  MIGRATION COMPLETE!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log --oneline -10"
echo "  2. Test the application locally"
echo "  3. Push to remote: git push origin main"
echo ""
echo "If issues occur, run: ./migrate-markdown-rollback.sh"
echo ""
