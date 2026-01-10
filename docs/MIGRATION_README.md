# Markdown Migration - Complete Package

## What Was Created

### Documentation
- **F:\donusum\haldeki-love\haldeki-market\docs\MIGRATION_PLAN.md** - Complete migration plan with file mapping table

### Bash Scripts (Linux/Git Bash)
All scripts located in: `F:\donusum\haldeki-love\haldeki-market\scripts\`

| Script | Purpose |
|--------|---------|
| `migrate-markdown-all.sh` | Run complete migration end-to-end |
| `migrate-markdown-step1-dirs.sh` | Create directory structure |
| `migrate-markdown-step2-batch1.sh` | Batch 1: Getting started files |
| `migrate-markdown-step3-batch2.sh` | Batch 2: User guides |
| `migrate-markdown-step4-batch3.sh` | Batch 3: Test reports |
| `migrate-markdown-step5-batch4.sh` | Batch 4: Release management & supply chain |
| `migrate-markdown-step6-batch5.sh` | Batch 5: Emergency & deployment |
| `migrate-markdown-step7-batch6.sh` | Batch 6: Reports (2026-01) |
| `migrate-markdown-step8-update-links.sh` | Update internal markdown links |
| `migrate-markdown-step9-verify.sh` | Verify all links work |
| `migrate-markdown-rollback.sh` | Rollback if something goes wrong |

### PowerShell Scripts (Windows)
| Script | Purpose |
|--------|---------|
| `migrate-markdown-all.ps1` | Complete migration on Windows |
| `migrate-markdown-rollback.ps1` | Rollback on Windows |

### Quick Reference
- **F:\donusum\haldeki-love\haldeki-market\scripts\MIGRATION_QUICK_START.md** - TL;DR instructions

## File Mapping Summary

| Category | Source Pattern | Target Directory |
|----------|----------------|------------------|
| Getting Started | README.md, QUICK_REFERENCE.md | docs/01-baslangic/ |
| User Guides | PASSWORD_RESET_*.md, QUICK_STORAGE_SETUP.md | docs/02-kullanim-kilavuzlari/ |
| Test Reports | TEST_RESULTS_*.md, PHASE*_TEST_*.md | docs/03-test-raporlari/ |
| Release Mgmt | PHASE*_DEPLOYMENT*.md, *_FINAL_SUMMARY.md | docs/04-surum-yonetimi/ |
| Emergency | EMERGENCY_*.md, RECOVERY_*.md | docs/05-acil-durum/ |
| Deployment | DEPLOYMENT_*.md | docs/06-deployment/ |
| Reports | *_REPORT.md, *_FIXES.md | docs/07-raporlar/2026-01/ |

## How to Execute

### Option 1: Quick & Easy (Recommended)
```bash
# Navigate to scripts directory
cd F:\donusum\haldeki-love\haldeki-market\scripts

# Make scripts executable (Linux/Mac/Git Bash)
chmod +x migrate-markdown-*.sh

# Run complete migration
./migrate-markdown-all.sh
```

### Option 2: Windows PowerShell
```powershell
# Navigate to project root
cd F:\donusum\haldeki-love\haldeki-market\scripts

# Run complete migration
.\migrate-markdown-all.ps1
```

### Option 3: Step-by-Step
Run scripts 1-9 in sequence if you want to pause and verify between batches.

## Safety Features

1. **Auto-backup**: Creates `pre-migration-backup-YYYYMMDD-HHMMSS` branch before starting
2. **Git history preserved**: Uses `git mv` instead of `mv`
3. **Batch commits**: Small logical commits for easy rollback
4. **Link verification**: Tests all internal links before completion
5. **Rollback script**: One-command restore if needed

## Rollback Procedure

If something goes wrong:

```bash
# Bash/Git Bash
cd scripts
./migrate-markdown-rollback.sh
```

Or manually:
```bash
git checkout pre-migration-backup-*
git branch -D main
git checkout -b main
git push origin main --force
```

## Verification After Migration

```bash
# Check migration commits
git log --oneline -10

# Verify no files left in root (except those intentionally kept)
ls *.md

# Test build locally (if applicable)
npm run build

# Verify links work
grep -r "\[.*\](docs/.*\.md)" --include="*.md" . | head -20
```

## What Gets Migrated (50+ Files)

### Root Files to be Moved:
- README.md
- QUICK_REFERENCE.md
- PASSWORD_RESET_*.md (3 files)
- TEST_RESULTS_*.md (5 files)
- PHASE*_DEPLOYMENT*.md (2 files)
- PHASE*_MIGRATION*.md (1 file)
- PHASE*_TECHNICAL*.md (1 file)
- PHASE4_*.md (2 files)
- SUPPLY_CHAIN_TEST_*.md (4 files)
- EMERGENCY_RECOVERY_GUIDE.md
- RECOVERY_*.md (3 files)
- DEPLOYMENT_*.md (2 files)
- *_REPORT.md (9 files)
- *_FIXES.md (1 file)
- *_GUIDE.md (2 files)
- And more...

### Files NOT Moved (Stay in Root):
- Files in `docs/` already
- Files in `node_modules/`
- Any .md files in other subdirectories

## Directory Structure After Migration

```
haldeki-market/
├── docs/
│   ├── 01-baslangic/
│   │   ├── proje-genel-bakis.md
│   │   ├── hizli-referans.md
│   │   └── acil-durum-kurtarma.md
│   ├── 02-kullanim-kilavuzlari/
│   │   ├── sifre-sifirlama/
│   │   │   ├── son-rapor.md
│   │   │   ├── ozet.md
│   │   │   └── uygulama-tamamlandi.md
│   │   ├── depolama-kurulumu.md
│   │   ├── urun-katalogu.md
│   │   └── tedarikci-urun-hazirligi.md
│   ├── 03-test-raporlari/
│   │   ├── supply-chain/
│   │   │   ├── teslimat-ozeti.md
│   │   │   ├── uygulama-checklist.md
│   │   │   ├── test-matrix.md
│   │   │   └── hizli-referans.md
│   │   ├── genel-ozet.md
│   │   ├── admin-panel-testleri.md
│   │   ├── musteri-testleri.md
│   │   └── [more test files...]
│   ├── 04-surum-yonetimi/
│   │   ├── phase3-uygulama.md
│   │   ├── phase3-rehber.md
│   │   └── [more release files...]
│   ├── 05-acil-durum/
│   │   ├── kurtarma-rehberi.md
│   │   ├── kurtarma-durumu.md
│   │   └── [more emergency files...]
│   ├── 06-deployment/
│   │   ├── guvenlik-checklist.md
│   │   └── dogrulama.md
│   ├── 07-raporlar/
│   │   └── 2026-01/
│   │       ├── performans-optimizasyonu.md
│   │       ├── guvenlik-dogrulama-2026-01-09.md
│   │       └── [more reports...]
│   ├── MIGRATION_PLAN.md
│   └── [existing docs/ files...]
├── scripts/
│   ├── migrate-markdown-all.sh
│   ├── migrate-markdown-all.ps1
│   ├── migrate-markdown-rollback.sh
│   ├── migrate-markdown-rollback.ps1
│   ├── MIGRATION_QUICK_START.md
│   └── [step scripts 1-9...]
└── [other project files...]
```

## Pre-Migration Checklist

- [ ] Clean git status (no uncommitted changes)
- [ ] Create backup branch (automatic in script)
- [ ] Verify you're on main branch
- [ ] Ensure you have write permissions
- [ ] Test rollback procedure (optional)

## Post-Migration Checklist

- [ ] All 50+ files moved successfully
- [ ] All internal links updated
- [ ] Link verification passes (0 broken links)
- [ ] Application builds/works locally
- [ ] Git history preserved for each file
- [ ] Backup branch created
- [ ] Ready to push to remote

## Troubleshooting

### Script won't run
```bash
# Make executable
chmod +x scripts/migrate-markdown-*.sh
```

### Git mv fails
```bash
# Check file exists
ls -la README.md

# Check git status
git status
```

### Link verification shows broken links
```bash
# Review broken links
grep "BROKEN" /tmp/verification_output.txt

# Manual fix
# Update the file with correct path
git add .
git commit -m "fix: correct broken link"
```

### Need to rollback
```bash
# Run rollback script
cd scripts
./migrate-markdown-rollback.sh
```

## Summary

This migration package provides:
- Complete file mapping for 50+ markdown files
- Organized directory structure (7 main categories)
- Safe migration with git history preservation
- Automatic internal link updates
- Link verification
- One-command rollback
- Bash and PowerShell support
- Step-by-step or all-at-once execution

All scripts follow deployment best practices:
- Backup before changes
- Small batch commits
- Verification after each step
- Clear rollback path
- No data loss risk
