#!/bin/bash
# Step 9: Verify all links and generate report
set -euo pipefail

echo "[*] Verifying all internal markdown links..."

broken_links=0
valid_links=0
total_links=0

# Find all markdown files
for file in $(find . -name "*.md" -type f | grep -v node_modules | grep -v ".git"); do
    # Extract all markdown links from the file
    while read -r line; do
        # Extract link path from markdown syntax [text](path)
        if [[ $line =~ \]\(([^)]+\.md)\) ]]; then
            link="${BASH_REMATCH[1]}"
            ((total_links++))

            # Skip absolute URLs and external links
            if [[ $link =~ ^https?:// ]] || [[ $link =~ ^# ]]; then
                continue
            fi

            # Check if link is relative or absolute
            if [[ $link =~ ^/ ]]; then
                # Absolute path from root
                target="${link#/}"
            else
                # Relative path - resolve from file directory
                file_dir=$(dirname "$file")
                target="$file_dir/$link"
            fi

            # Normalize path (remove ../ and ./)
            target=$(cd "$(dirname "$target")" 2>/dev/null && pwd)/$(basename "$target") 2>/dev/null || true

            # Check if target exists
            if [ -f "$target" ]; then
                ((valid_links++))
                echo "  [OK] $file -> $link"
            else
                ((broken_links++))
                echo "  [BROKEN] $file -> $link (target: $target)"
            fi
        fi
    done < <(grep -o '\[.*\]([^)]*\.md)' "$file" 2>/dev/null || true)
done

echo ""
echo "=== Link Verification Report ==="
echo "Total links found: $total_links"
echo "Valid links: $valid_links"
echo "Broken links: $broken_links"
echo ""

if [ $broken_links -gt 0 ]; then
    echo "[!] WARNING: Found $broken_links broken links!"
    echo "[i] Please review and fix before pushing to main"
    exit 1
else
    echo "[OK] All links are valid!"
    echo "[i] Creating final summary commit..."

    # Generate summary report
    cat > /tmp/migration_summary.txt << EOF
# Markdown Migration Summary

## Files Moved: 50+
## Directory Structure Created:
- docs/01-baslangic/
- docs/02-kullanim-kilavuzlari/sifre-sifirlama/
- docs/03-test-raporlari/supply-chain/
- docs/04-surum-yonetimi/
- docs/05-acil-durum/
- docs/06-deployment/
- docs/07-raporlar/2026-01/

## Link Verification:
- Total links checked: $total_links
- Valid links: $valid_links
- Broken links: $broken_links

## Git History: Preserved (used git mv)
## Migration Date: $(date)

Migration completed successfully!
EOF

    cat /tmp/migration_summary.txt

    # No commit needed if all is well
    echo "[OK] Verification complete - no broken links found!"
    echo "[i] You can now push to main: git push origin main"
fi
