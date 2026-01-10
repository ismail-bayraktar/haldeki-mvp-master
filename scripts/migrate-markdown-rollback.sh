#!/bin/bash
# Rollback script - Revert markdown migration
set -euo pipefail

echo "[!] ROLLBACK: Reverting markdown migration..."
read -p "Are you sure? This will move all files back to root. (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "[i] Rollback cancelled"
    exit 0
fi

echo "[*] Moving all markdown files back to root..."

# Find all .md files in docs/ and move them back
for file in $(find docs -name "*.md" -type f); do
    basename=$(basename "$file")
    echo "  Moving $file -> ./$basename"

    # Check if target already exists
    if [ -f "./$basename" ]; then
        echo "  [!] Warning: ./$basename already exists, skipping $file"
        continue
    fi

    git mv "$file" "./$basename"
done

echo "[*] Restoring original links..."
# Reset to state before link updates
git checkout HEAD~1 -- .

git commit -m "revert: rollback markdown migration

- Moved all files back to root directory
- Restored original link structure
"

echo "[OK] Rollback complete!"
echo "[i] All files restored to root"
echo "[i] If needed, force push: git push origin main --force"
