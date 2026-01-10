#!/bin/bash
# Documentation Migration Verification Script
# Validates that all files were migrated correctly

set -euo pipefail

# Configuration
DOCS_DIR="/f/donusum/haldeki-love/haldeki-market/docs"
PROJECT_ROOT="/f/donusum/haldeki-love/haldeki-market"
LOG_DIR="${PROJECT_ROOT}/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

# Report array
declare -a REPORT

add_report() {
    local status="$1"
    local message="$2"
    local time=$(date '+%H:%M:%S')
    REPORT+=("[$time] [$status] $message")

    case "$status" in
        "SUCCESS")
            echo -e "${GREEN}[$time] [$status] $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[$time] [$status] $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$time] [$status] $message${NC}"
            ;;
        *)
            echo -e "[$time] [$status] $message"
            ;;
    esac
}

# Check if folder is empty
is_folder_empty() {
    local path="$1"
    if [[ ! -d "${path}" ]]; then
        return 0
    fi
    [[ -z "$(ls -A "${path}" 2>/dev/null)" ]]
}

# Main Verification
echo -e "${CYAN}=== DOCUMENTATION MIGRATION VERIFICATION ===${NC}\n"

# Check 1: Old folders should be empty
add_report "INFO" "Check 1: Verifying old folders are empty..."

declare -a old_folder_issues=()

# Old folders and their targets
declare -A folder_targets=(
    ["phases"]="05-fazlar"
    ["reports"]="09-raporlar"
    ["business"]="04-is-mantigi"
    ["testing"]="07-test"
    ["development"]="06-gelistirme"
    ["guides"]="12-referanslar/supabase"
    ["api"]="03-mimari/api"
    ["architecture"]="03-mimari"
    ["diagrams"]="04-is-mantigi/diyagramlar"
    ["checklists"]="06-gelistirme/kontroller"
    ["fixes"]="09-raporlar/fixler"
    ["notes"]="06-gelistirme/notlar"
    ["reviews"]="09-raporlar/code-reviews"
    ["security"]="09-raporlar/guvenlik"
    ["technical-debt"]="10-bakim/teknik-borc"
    ["img-ref"]="12-referanslar/gorsel-referanslar"
    ["speed-test-sonuc"]="09-raporlar/2026-01/performans"
)

for folder in "${!folder_targets[@]}"; do
    path="${DOCS_DIR}/${folder}"
    if ! is_folder_empty "${path}"; then
        count=$(find "${path}" -mindepth 1 2>/dev/null | wc -l)
        add_report "WARNING" "Old folder not empty: ${folder} (${count} items)"
        old_folder_issues+=("${folder}")
    fi
done

if [[ ${#old_folder_issues[@]} -eq 0 ]]; then
    add_report "SUCCESS" "All old folders are empty or removed"
fi

echo ""

# Check 2: Target folders should exist
add_report "INFO" "Check 2: Verifying target folders exist..."

declare -a missing_folders=()
declare -a target_folders=(
    "01-baslangic"
    "02-kullanim-kilavuzlari"
    "03-mimari"
    "04-is-mantigi"
    "05-fazlar"
    "06-gelistirme"
    "07-test"
    "08-deployment"
    "09-raporlar"
    "10-bakim"
    "11-teknik"
    "12-referanslar"
)

for folder in "${target_folders[@]}"; do
    path="${DOCS_DIR}/${folder}"
    if [[ ! -d "${path}" ]]; then
        add_report "ERROR" "Target folder missing: ${folder}"
        missing_folders+=("${folder}")
    fi
done

if [[ ${#missing_folders[@]} -eq 0 ]]; then
    add_report "SUCCESS" "All target folders exist"
fi

echo ""

# Check 3: Specific file migrations
add_report "INFO" "Check 3: Verifying specific file migrations..."

declare -a file_issues=()

# Specific files to verify (source -> target)
declare -A specific_files=(
    ["phases/phase-2a1-regioncontext.md"]="05-fazlar/phase-2a-bolge-sistemi.md"
    ["BETA-TESTING-GUIDE.md"]="07-test/beta-testing-rehberi.md"
    ["TARGET_KEYWORDS.md"]="11-teknik/seo-keywords.md"
    ["TEDARIKCI_KULLANUM_KILAVUZU.md"]="02-kullanim-kilavuzlari/tedarikci-paneli.md"
    ["UPDATE-TEST-ACCOUNTS.md"]="01-baslangic/test-hesaplar.md"
)

for source in "${!specific_files[@]}"; do
    target="${specific_files[$source]}"
    target_path="${DOCS_DIR}/${target}"

    if [[ -f "${target_path}" ]]; then
        add_report "SUCCESS" "OK: ${source} -> ${target}"
    else
        add_report "WARNING" "MISSING: ${target}"
        file_issues+=("${target}")
    fi
done

echo ""

# Check 4: Git history preservation
add_report "INFO" "Check 4: Checking git history..."

if git -C "${PROJECT_ROOT}" log --oneline --all -n 5 &>/dev/null; then
    add_report "SUCCESS" "Git history accessible"
else
    add_report "WARNING" "Could not verify git history"
fi

echo ""

# Check 5: File count verification
add_report "INFO" "Check 5: Verifying file counts..."

# Count markdown files in each target folder
declare -A folder_counts=()
total_files=0

for folder in "${target_folders[@]}"; do
    path="${DOCS_DIR}/${folder}"
    if [[ -d "${path}" ]]; then
        count=$(find "${path}" -name "*.md" -type f | wc -l)
        folder_counts["${folder}"]="${count}"
        total_files=$((total_files + count))
        if [[ ${count} -gt 0 ]]; then
            add_report "INFO" "${folder}: ${count} markdown files"
        fi
    fi
done

add_report "INFO" "Total markdown files migrated: ${total_files}"

echo ""

# Check 6: INDEKS.md exists and is updated
add_report "INFO" "Check 6: Verifying INDEKS.md..."

index_file="${DOCS_DIR}/INDEKS.md"
if [[ -f "${index_file}" ]]; then
    add_report "SUCCESS" "INDEKS.md exists"

    # Check if it references new structure
    if grep -q "01-baslangic\|02-kullanim-kilavuzlari\|03-mimari" "${index_file}"; then
        add_report "SUCCESS" "INDEKS.md references new structure"
    else
        add_report "WARNING" "INDEKS.md may need updating for new structure"
    fi
else
    add_report "ERROR" "INDEKS.md not found"
fi

echo ""

# Summary
echo -e "${CYAN}=== VERIFICATION SUMMARY ===${NC}"

total_issues=$((${#old_folder_issues[@]} + ${#missing_folders[@]} + ${#file_issues[@]}))

if [[ ${total_issues} -eq 0 ]]; then
    add_report "SUCCESS" "VERIFICATION PASSED: All checks successful"
    exit_code=0
else
    add_report "WARNING" "VERIFICATION ISSUES: ${total_issues} total issues found"
    echo -e "\n${YELLOW}Issues breakdown:${NC}"
    echo "  - Old folders not empty: ${#old_folder_issues[@]}"
    echo "  - Missing target folders: ${#missing_folders[@]}"
    echo "  - Missing files: ${#file_issues[@]}"
    exit_code=1
fi

echo ""
add_report "INFO" "Next steps:"
add_report "INFO" "  1. Review any WARNING messages above"
add_report "INFO" "  2. Update INDEKS.md with new structure"
add_report "INFO" "  3. Fix any broken links"
add_report "INFO" "  4. Commit changes with: git commit -m 'docs: Migrate documentation to new structure'"

# Save report to file
report_file="${LOG_DIR}/verification-${TIMESTAMP}.log"
printf '%s\n' "${REPORT[@]}" > "${report_file}"
add_report "INFO" "Report saved to: ${report_file}"

exit ${exit_code}
