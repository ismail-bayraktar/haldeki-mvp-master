# Markdown Migration Plan

## Overview
Move 50+ .md files from root to organized `docs/` subdirectories while preserving git history and updating internal links.

## File Mapping Table

### 01 - Baslangic (Getting Started)
| Source | Target |
|--------|--------|
| `README.md` | `docs/01-baslangic/proje-genel-bakis.md` |
| `QUICK_REFERENCE.md` | `docs/01-baslangic/hizli-referans.md` |
| `RECOVERY_README.md` | `docs/01-baslangic/acil-durum-kurtarma.md` |

### 02 - Kullanim Kilavuzlari (User Guides)
| Source | Target |
|--------|--------|
| `PASSWORD_RESET_FINAL_REPORT.md` | `docs/02-kullanim-kilavuzlari/sifre-sifirlama/son-rapor.md` |
| `PASSWORD_RESET_FINAL_SUMMARY.md` | `docs/02-kullanim-kilavuzlari/sifre-sifirlama/ozet.md` |
| `PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md` | `docs/02-kullanim-kilavuzlari/sifre-sifirlama/uygulama-tamamlandi.md` |
| `QUICK_STORAGE_SETUP.md` | `docs/02-kullanim-kilavuzlari/depolama-kurulumu.md` |
| `global-product-catalog.md` | `docs/02-kullanim-kilavuzlari/urun-katalogu.md` |
| `supplier-product-readiness-analysis.md` | `docs/02-kullanim-kilavuzlari/tedarikci-urun-hazirligi.md` |

### 03 - Test Raporlari (Test Reports)
| Source | Target |
|--------|--------|
| `TEST_RESULTS_SUMMARY.md` | `docs/03-test-raporlari/genel-ozet.md` |
| `TEST_RESULTS_ADMIN.md` | `docs/03-test-raporlari/admin-panel-testleri.md` |
| `TEST_RESULTS_CUSTOMER.md` | `docs/03-test-raporlari/musteri-testleri.md` |
| `TEST_RESULTS_DISTRIBUTION.md` | `docs/03-test-raporlari/dagitim-testleri.md` |
| `TEST_RESULTS_SUPPLY_CHAIN.md` | `docs/03-test-raporlari/supply-chain-testleri.md` |
| `TESTING_GUIDE_GUEST_UX.md` | `docs/03-test-raporlari/misafir-ux-rehberi.md` |
| `TEST_REPORT_SUPPLIER_PRODUCTS_UI.md` | `docs/03-test-raporlari/tedarikci-ui-testleri.md` |
| `PHASE2_WHITELIST_TEST_REPORT.md` | `docs/03-test-raporlari/whitelist-test-raporu.md` |
| `PHASE3_MIGRATION_STATUS_REPORT.md` | `docs/03-test-raporlari/migrasyon-durumu.md` |
| `PHASE3_TECHNICAL_DEBT_REPORT.md` | `docs/03-test-raporlari/teknik-borclanma-raporu.md` |
| `PHASE4_TESTING_VERIFICATION_REPORT.md` | `docs/03-test-raporlari/dogrulama-raporu.md` |
| `SUPPLY_CHAIN_TEST_*.md` | `docs/03-test-raporlari/supply-chain/` |

### 04 - Surum Yonetimi (Release Management)
| Source | Target |
|--------|--------|
| `PHASE3_DEPLOYMENT_EXECUTE.md` | `docs/04-surum-yonetimi/phase3-uygulama.md` |
| `PHASE3_DEPLOYMENT_GUIDE.md` | `docs/04-surum-yonetimi/phase3-rehber.md` |
| `PHASE4_FINAL_SUMMARY.md` | `docs/04-surum-yonetimi/phase4-ozet.md` |
| `PHASE4_UI_IMPROVEMENTS.md` | `docs/04-surum-yonetimi/phase4-ui-gelistirmeleri.md` |
| `SUPABASE_VERIFICATION_REPORT.md` | `docs/04-surum-yonetimi/supabase-dogrulama.md` |
| `STORAGE_SETUP_REPORT.md` | `docs/04-surum-yonetimi/depolama-kurulum-raporu.md` |
| `WHITELIST_SYSTEM_COMPLETE_REPORT.md` | `docs/04-surum-yonetimi/whitelist-sistemi-tamamlandi.md` |

### 05 - Acil Durum (Emergency)
| Source | Target |
|--------|--------|
| `EMERGENCY_RECOVERY_GUIDE.md` | `docs/05-acil-durum/kurtarma-rehberi.md` |
| `RECOVERY_STATUS.md` | `docs/05-acil-durum/kurtarma-durumu.md` |
| `RECOVERY_SUMMARY.md` | `docs/05-acil-durum/kurtarma-ozeti.md` |
| `RECOVERY_TEST_RESULTS.md` | `docs/05-acil-durum/kurtarma-test-sonuclari.md` |

### 06 - Deployment (Deployment)
| Source | Target |
|--------|--------|
| `DEPLOYMENT_SECURITY_CHECKLIST.md` | `docs/06-deployment/guvenlik-checklist.md` |
| `DEPLOYMENT_VERIFICATION.md` | `docs/06-deployment/dogrulama.md` |

### 07 - Raporlar (Reports - 2026-01)
| Source | Target |
|--------|--------|
| `PERFORMANCE_OPTIMIZATION_REPORT.md` | `docs/07-raporlar/2026-01/performans-optimizasyonu.md` |
| `SECURITY_VERIFICATION_REPORT_2026-01-09.md` | `docs/07-raporlar/2026-01/guvenlik-dogrulama-2026-01-09.md` |
| `SEO_PERFORMANCE_FIXES.md` | `docs/07-raporlar/2026-01/seo-performans-duzeltmeleri.md` |
| `SPRINT2_BREADCRUMBS_IMPLEMENTATION.md` | `docs/07-raporlar/2026-01/sprint2-breadcrumb.md` |
| `SUPERSCRIPT_BADGE_SAFE_MODERN.md` | `docs/07-raporlar/2026-01/superscript-badge.md` |
| `TEST_INFRASTRUCTURE_P0_P1_REPORT.md` | `docs/07-raporlar/2026-01/test-altyapisi-p0-p1.md` |
| `TEST_INFRASTRUCTURE_P2_REPORT.md` | `docs/07-raporlar/2026-01/test-altyapisi-p2.md` |
| `TEST_INFRASTRUCTURE_P3_REPORT.md` | `docs/07-raporlar/2026-01/test-altyapisi-p3.md` |
| `TEST_INFRASTRUCTURE_FIX_GUIDE.md` | `docs/07-raporlar/2026-01/test-altyapisi-duzeltme-rehberi.md` |

## Internal Link Update Strategy

### Step 1: Find All Internal Links
```bash
# Find all markdown links in .md files
grep -r "\[.*\](.*\.md)" --include="*.md" . > internal_links.txt
```

### Step 2: Update Link Patterns
| Old Pattern | New Pattern |
|-------------|-------------|
| `](README.md)` | `](docs/01-baslangic/proje-genel-bakis.md)` |
| `](QUICK_REFERENCE.md)` | `](docs/01-baslangic/hizli-referans.md)` |
| `](PASSWORD_RESET_*.md)` | `](docs/02-kullanim-kilavuzlari/sifre-sifirlama/)` |
| `](TEST_RESULTS_*.md)` | `](docs/03-test-raporlari/)` |
| `](DEPLOYMENT_*.md)` | `](docs/06-deployment/)` |
| `](*_REPORT.md)` | `](docs/07-raporlar/2026-01/)` |

## Git-Safe Commands

### Phase 1: Prepare
```bash
# Create directory structure
mkdir -p docs/01-baslangic
mkdir -p docs/02-kullanim-kilavuzlari/sifre-sifirlama
mkdir -p docs/03-test-raporlari/supply-chain
mkdir -p docs/04-surum-yonetimi
mkdir -p docs/05-acil-durum
mkdir -p docs/06-deployment
mkdir -p docs/07-raporlar/2026-01
```

### Phase 2: Move Files (Batch 1 - Getting Started)
```bash
git mv README.md docs/01-baslangic/proje-genel-bakis.md
git mv QUICK_REFERENCE.md docs/01-baslangic/hizli-referans.md
git mv RECOVERY_README.md docs/01-baslangic/acil-durum-kurtarma.md

git commit -m "docs: move getting started files to docs/01-baslangic

- Move README.md -> docs/01-baslangic/proje-genel-bakis.md
- Move QUICK_REFERENCE.md -> docs/01-baslangic/hizli-referans.md
- Move RECOVERY_README.md -> docs/01-baslangic/acil-durum-kurtarma.md

Part 1 of markdown reorganization
"
```

### Phase 3: Move Files (Batch 2 - User Guides)
```bash
git mv PASSWORD_RESET_FINAL_REPORT.md docs/02-kullanim-kilavuzlari/sifre-sifirlama/son-rapor.md
git mv PASSWORD_RESET_FINAL_SUMMARY.md docs/02-kullanim-kilavuzlari/sifre-sifirlama/ozet.md
git mv PASSWORD_RESET_IMPLEMENTATION_COMPLETE.md docs/02-kullanim-kilavuzlari/sifre-sifirlama/uygulama-tamamlandi.md
git mv QUICK_STORAGE_SETUP.md docs/02-kullanim-kilavuzlari/depolama-kurulumu.md
git mv global-product-catalog.md docs/02-kullanim-kilavuzlari/urun-katalogu.md
git mv supplier-product-readiness-analysis.md docs/02-kullanim-kilavuzlari/tedarikci-urun-hazirligi.md

git commit -m "docs: move user guides to docs/02-kullanim-kilavuzlari

- Organize password reset docs under sifre-sifirlama/
- Move storage and product catalog guides

Part 2 of markdown reorganization
"
```

### Phase 4: Update Internal Links
```bash
# Create link update script
cat > update_links.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Define link mappings
declare -A LINK_MAP=(
    [README.md]=docs/01-baslangic/proje-genel-bakis.md
    [QUICK_REFERENCE.md]=docs/01-baslangic/hizli-referans.md
    [RECOVERY_README.md]=docs/01-baslangic/acil-durum-kurtarma.md
    [PASSWORD_RESET_FINAL_REPORT.md]=docs/02-kullanim-kilavuzlari/sifre-sifirlama/son-rapor.md
    [DEPLOYMENT_SECURITY_CHECKLIST.md]=docs/06-deployment/guvenlik-checklist.md
)

# Update links in all .md files
for file in $(find . -name "*.md" -type f); do
    for old in "${!LINK_MAP[@]}"; do
        new="${LINK_MAP[$old]}"
        sed -i "s|]($old)|]($new)|g" "$file"
    done
done

echo "Links updated successfully"
EOF

chmod +x update_links.sh
./update_links.sh
```

### Phase 5: Verify Links
```bash
# Test all internal links
grep -r "\[.*\](docs/.*\.md)" --include="*.md" . | while read line; do
    link=$(echo "$line" | grep -oP '(?<=\]\()(docs/[^)]+)(?=\))')
    if [ -n "$link" ] && [ ! -f "$link" ]; then
        echo "BROKEN: $link"
    fi
done
```

### Phase 6: Final Commit
```bash
git add .
git commit -m "docs: update internal links after markdown reorganization

- Update all internal markdown links to new paths
- Verify no broken links exist
- Complete migration of 50+ files to organized structure
"
```

## Rollback Plan

### If Something Goes Wrong

#### Option 1: Reset to Before Migration
```bash
# Reset everything to before migration started
git reset --hard HEAD~3
git push origin main --force
```

#### Option 2: Revert Specific Migration
```bash
# Move files back to root
find docs -name "*.md" -type f -exec sh -c 'git mv "$1" "./$(basename "$1")"' _ {} \;

# Restore old links
git checkout HEAD~1 -- .

git commit -m "revert: rollback markdown migration"
```

#### Option 3: Create Rescue Branch
```bash
# Before migration, create safety branch
git branch pre-migration-backup

# If needed, restore from backup
git checkout pre-migration-backup
git checkout -b recovery-branch
git merge main --strategy=ours
```

## Verification Checklist

- [ ] All files moved with `git mv` (history preserved)
- [ ] No broken internal links
- [ ] All commits have descriptive messages
- [ ] Directory structure created correctly
- [ ] `.gitignore` not affected
- [ ] No unintended files moved
- [ ] Link update script tested on sample
- [ ] Rollback procedure documented
- [ ] Backup branch created before start

## Execution Order

1. Create backup branch
2. Create directory structure
3. Move files in logical batches (6 commits)
4. Update internal links (1 commit)
5. Verify all links
6. Final verification commit
7. Test in staging/preview
8. Push to main

## Safety Precautions

1. **NEVER use `mv`** - Always use `git mv` for history preservation
2. **Batch commits** - Small, logical commits for easier rollback
3. **Test links** - Verify after each batch
4. **Backup first** - Always create pre-migration branch
5. **Communicate** - Notify team before migration
