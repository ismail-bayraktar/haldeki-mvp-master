#!/bin/bash
# Step 8: Update internal markdown links
set -euo pipefail

echo "[*] Updating internal markdown links..."

# Define link mappings (declare -A is bash 4+)
# Using associative array for link translation
declare -A LINK_MAP=(
    [README.md]=docs/01-baslangic/proje-genel-bakis.md
    [QUICK_REFERENCE.md]=docs/01-baslangic/hizli-referans.md
    [RECOVERY_README.md]=docs/01-baslangic/acil-durum-kurtarma.md
    [PASSWORD_RESET_FINAL_REPORT.md]=docs/02-kullanim-kilavuzlari/sifre-sifirlama/son-rapor.md
    [PASSWORD_RESET_FINAL_SUMMARY.md]=docs/02-kullanim-kilavuzlari/sifre-sifirlama/ozet.md
    [PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md]=docs/02-kullanim-kilavuzlari/sifre-sifirlama/uygulama-tamamlandi.md
    [QUICK_STORAGE_SETUP.md]=docs/02-kullanim-kilavuzlari/depolama-kurulumu.md
    [DEPLOYMENT_SECURITY_CHECKLIST.md]=docs/06-deployment/guvenlik-checklist.md
    [DEPLOYMENT_VERIFICATION.md]=docs/06-deployment/dogrulama.md
    [EMERGENCY_RECOVERY_GUIDE.md]=docs/05-acil-durum/kurtarma-rehberi.md
)

# Create backup of original links
echo "[*] Creating backup of original links..."
grep -r "\[.*\](.*\.md)" --include="*.md" . 2>/dev/null | grep -v node_modules > /tmp/original_links_backup.txt || echo "[!] No links found"

# Update links in all .md files (excluding node_modules)
echo "[*] Processing files..."
file_count=0
link_count=0

for file in $(find . -name "*.md" -type f | grep -v node_modules | grep -v ".git"); do
    ((file_count++))
    file_updated=false

    for old in "${!LINK_MAP[@]}"; do
        new="${LINK_MAP[$old]}"

        # Check if file contains the old link
        if grep -q "\]($old)" "$file" 2>/dev/null; then
            # Update the link
            sed -i "s|]($old)|]($new)|g" "$file"
            echo "  [+] Updated in $file: $old -> $new"
            ((link_count++))
            file_updated=true
        fi
    done
done

echo "[OK] Links updated: $link_count links in $file_count files"

# Commit the changes
git add .
git commit -m "docs: update internal markdown links

- Update all internal markdown links to new paths
- Processed $file_count files, updated $link_count links
- Original links backed up to /tmp/original_links_backup.txt

Part 7 of markdown reorganization
"

echo "[OK] Link updates committed!"
echo "[i] Next: Run migrate-markdown-step9-verify.sh"
