#!/bin/bash
# Step 1: Create directory structure for markdown migration
set -euo pipefail

echo "[*] Creating directory structure..."

mkdir -p docs/01-baslangic
mkdir -p docs/02-kullanim-kilavuzlari/sifre-sifirlama
mkdir -p docs/03-test-raporlari/supply-chain
mkdir -p docs/04-surum-yonetimi
mkdir -p docs/05-acil-durum
mkdir -p docs/06-deployment
mkdir -p docs/07-raporlar/2026-01

echo "[OK] Directory structure created"
echo "[i] Next: Run migrate-markdown-step2-batch1.sh"
