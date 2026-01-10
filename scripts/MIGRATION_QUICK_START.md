# Markdown Migration - Quick Start

## TL;DR

```bash
# Run complete migration
cd scripts
chmod +x migrate-markdown-*.sh
./migrate-markdown-all.sh
```

## Or Step-by-Step

```bash
# 1. Create directories
./migrate-markdown-step1-dirs.sh

# 2. Move files (batches 2-7)
./migrate-markdown-step2-batch1.sh   # Getting started
./migrate-markdown-step3-batch2.sh   # User guides
./migrate-markdown-step4-batch3.sh   # Test reports
./migrate-markdown-step5-batch4.sh   # Release management
./migrate-markdown-step6-batch5.sh   # Emergency & deployment
./migrate-markdown-step7-batch6.sh   # Reports

# 3. Update links
./migrate-markdown-step8-update-links.sh

# 4. Verify
./migrate-markdown-step9-verify.sh
```

## Rollback

```bash
./migrate-markdown-rollback.sh
```

## Files Created

| Script | Purpose |
|--------|---------|
| `migrate-markdown-all.sh` | Run complete migration |
| `migrate-markdown-step1-dirs.sh` | Create directory structure |
| `migrate-markdown-step2-batch1.sh` | Batch 1: Getting started |
| `migrate-markdown-step3-batch2.sh` | Batch 2: User guides |
| `migrate-markdown-step4-batch3.sh` | Batch 3: Test reports |
| `migrate-markdown-step5-batch4.sh` | Batch 4: Release management |
| `migrate-markdown-step6-batch5.sh` | Batch 5: Emergency & deployment |
| `migrate-markdown-step7-batch6.sh` | Batch 6: Reports |
| `migrate-markdown-step8-update-links.sh` | Update internal links |
| `migrate-markdown-step9-verify.sh` | Verify all links |
| `migrate-markdown-rollback.sh` | Rollback migration |

## Safety Features

- Auto-creates backup branch before starting
- Uses `git mv` to preserve history
- Batch commits for easy rollback
- Link verification before completion
- Rollback script if needed

## Directory Structure After Migration

```
docs/
├── 01-baslangic/
│   ├── proje-genel-bakis.md (ex-README.md)
│   ├── hizli-referans.md
│   └── acil-durum-kurtarma.md
├── 02-kullanim-kilavuzlari/
│   ├── sifre-sifirlama/
│   │   ├── son-rapor.md
│   │   ├── ozet.md
│   │   └── uygulama-tamamlandi.md
│   ├── depolama-kurulumu.md
│   ├── urun-katalogu.md
│   └── tedarikci-urun-hazirligi.md
├── 03-test-raporlari/
│   ├── supply-chain/
│   └── [test files]
├── 04-surum-yonetimi/
│   └── [release management files]
├── 05-acil-durum/
│   └── [emergency recovery files]
├── 06-deployment/
│   ├── guvenlik-checklist.md
│   └── dogrulama.md
└── 07-raporlar/
    └── 2026-01/
        └── [january reports]
```
