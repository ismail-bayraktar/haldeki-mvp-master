# Documentation Git Migration

Safe git-based documentation migration with history preservation.

## Overview

Migrates all documentation from old folder structure to new 12-category wiki structure while preserving git history using `git mv`.

## Old Structure

```
docs/
├── phases/
├── reports/
├── business/
├── testing/
├── development/
├── guides/
├── api/
├── architecture/
├── diagrams/
├── checklists/
├── fixes/
├── notes/
├── reviews/
├── security/
├── technical-debt/
├── img-ref/
└── speed-test-sonuc/
```

## New Structure

```
docs/
├── 01-baslangic/           # Getting Started
├── 02-kullanim-kilavuzlari/ # User Guides
├── 03-mimari/              # Architecture
├── 04-is-mantigi/          # Business Logic
├── 05-fazlar/              # Development Phases
├── 06-gelistirme/          # Development
├── 07-test/                # Testing
├── 08-deployment/          # Deployment
├── 09-raporlar/            # Reports
├── 10-bakim/               # Maintenance
├── 11-teknik/              # Technical
└── 12-referanslar/         # References
```

## Scripts

| Script | Platform | Purpose |
|--------|----------|---------|
| `docs-git-migration.ps1` | Windows PowerShell | Main migration script |
| `docs-git-migration.sh` | Linux/macOS/Git Bash | Main migration script |
| `verify-docs-migration.ps1` | Windows PowerShell | Verification script |
| `verify-docs-migration.sh` | Linux/macOS/Git Bash | Verification script |

## Migration Batches

The migration runs in 8 batches to ensure safe execution:

| Batch | Description | Files |
|-------|-------------|-------|
| 0 | Phase 2A Merge | 4 files -> 1 merged file |
| 1 | Reports | All report folders |
| 2 | Business Logic | business/, diagrams/ |
| 3 | Testing | testing/, BETA-TESTING-GUIDE.md |
| 4 | Development | development/, technical-debt/, notes/, checklists/ |
| 5 | Architecture | api/, architecture/ |
| 6 | User Guides | guides/, SUPERADMIN-*, PASSWORD_RESET_GUIDE.md, TEDARIKCI_* |
| 7 | Deployment | MIGRATION_*.md files |
| 8 | Technical & References | TARGET_KEYWORDS.md, img-ref/ |

## Usage

### Windows (PowerShell)

```powershell
# From project root
cd F:\donusum\haldeki-love\haldeki-market

# Run migration
.\scripts\docs-git-migration.ps1

# Verify migration
.\scripts\verify-docs-migration.ps1
```

### Linux/macOS/Git Bash

```bash
# From project root
cd /f/donusum/haldeki-love/haldeki-market

# Make script executable
chmod +x scripts/docs-git-migration.sh
chmod +x scripts/verify-docs-migration.sh

# Run migration
./scripts/docs-git-migration.sh

# Verify migration
./scripts/verify-docs-migration.sh
```

## Safety Features

1. **Backup Branch**: Creates timestamped backup branch before migration
2. **Git History Preservation**: Uses `git mv` to preserve file history
3. **Error Handling**: Comprehensive error handling and logging
4. **Verification**: Post-migration verification checks
5. **Rollback**: Easy rollback using backup branch

## What Gets Merged

### Phase 2A Files

Four phase-2a files are merged into one:
- `phase-2a1-regioncontext.md`
- `phase-2a2-region-products.md`
- `phase-2a3-cart-region.md`
- `phase-2a4-delivery-slots.md`

Becomes: `05-fazlar/phase-2a-bolge-sistemi.md`

### Test Accounts

`UPDATE-TEST-ACCOUNTS.md` is merged into `01-baslangic/test-hesaplar.md`

## What Gets Renamed

| Old Name | New Name |
|----------|----------|
| `phase-10-import-export.md` | `phase-10-excel.md` |
| `phase-11-warehouse-mvp.md` | `phase-11-depo.md` |
| `phase-12-multi-supplier.md` | `phase-12-coklu-tedarikci.md` |
| `phase-5-approval-system.md` | `phase-5-onay-sistemi.md` |
| `phase-6-order-delivery.md` | `phase-6-siparis-teslimat.md` |
| `phase-7-payment-system.md` | `phase-7-odeme.md` |
| `phase-8-business-panel.md` | `phase-8-b2b-panel.md` |
| `phase-9-supplier-panel.md` | `phase-9-mobil-tedarikci.md` |
| `BETA-TESTING-GUIDE.md` | `beta-testing-rehberi.md` |
| `TARGET_KEYWORDS.md` | `seo-keywords.md` |
| `MIGRATION_*.md` | `migrasyon-*.md` |

## Verification Checks

The verification script checks:

1. **Old folders empty**: All old folders should be empty or removed
2. **Target folders exist**: All 12 new folders should exist
3. **File migrations**: Specific key files are verified
4. **Git history**: Git history is accessible
5. **Broken links**: Internal markdown links are checked
6. **INDEKS.md**: Main index file exists

## Commit Strategy

After successful migration, commit in logical batches:

```bash
# Phase 2A merge
git add docs/05-fazlar/phase-2a-bolge-sistemi.md
git commit -m "docs: Merge Phase 2A files into single document"

# Batch 1: Reports
git add docs/09-raporlar/
git commit -m "docs: Migrate reports to 09-raporlar/"

# Batch 2: Business Logic
git add docs/04-is-mantigi/
git commit -m "docs: Migrate business logic to 04-is-mantigi/"

# Continue for each batch...
```

## Rollback Procedure

If something goes wrong:

```bash
# Checkout backup branch
git checkout backup-docs-migration-<timestamp>

# Or reset main to before migration
git reset --hard HEAD~1
```

## Log Files

All operations are logged to `logs/` directory:

- `migration-YYYYMMDD-HHmmss.log` - Migration execution log
- `verification-YYYYMMDD-HHmmss.log` - Verification results

## Post-Migration Tasks

1. **Update INDEKS.md** with new structure
2. **Fix broken links** in documentation
3. **Update cross-references** between documents
4. **Review commit history** to ensure clean migration
5. **Delete old empty folders** after verification

## Troubleshooting

### Script fails with permission error

- Run PowerShell as Administrator
- Or use Git Bash version

### Files not found

- Ensure you're in project root directory
- Check that old folders still exist

### Git history not preserved

- Ensure `git mv` is used, not `mv`
- Check git config for proper settings

### Verification fails

- Review log file for specific issues
- Fix manually and re-run verification
- Check for unexpected files in old folders

## Safety Reminders

- **Always create backup branch** before migration
- **Test on copy first** if uncertain
- **Review git status** between batches
- **Keep backups** until fully verified
- **Never force push** during migration

## Support

For issues or questions:
1. Check log files in `logs/` directory
2. Run verification script for detailed report
3. Review git status for uncommitted changes
