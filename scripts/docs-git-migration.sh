#!/bin/bash
# Documentation Migration with Git History Preservation
# Run this script from the project root directory

set -euo pipefail

# Configuration
PROJECT_ROOT="/f/donusum/haldeki-love/haldeki-market"
DOCS_DIR="${PROJECT_ROOT}/docs"
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/migration-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_entry="[${timestamp}] [${level}] ${message}"
    echo "${log_entry}" | tee -a "${LOG_FILE}"
}

log_info() { log_message "INFO" "$1"; }
log_success() { log_message "SUCCESS" "$1"; }
log_warning() { log_message "WARNING" "$1"; }
log_error() { log_message "ERROR" "$1"; }

# Test for uncommitted changes
test_git_changes() {
    local status=$(cd "${PROJECT_ROOT}" && git status --porcelain 2>&1)
    [[ -n "${status}" ]]
}

# Create backup branch
backup_branch() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local branch_name="backup-docs-migration-${timestamp}"

    log_info "Creating backup branch: ${branch_name}"

    if (cd "${PROJECT_ROOT}" && git checkout -b "${branch_name}" && git checkout main); then
        log_success "Backup branch created successfully"
        echo "${branch_name}"
    else
        log_error "Failed to create backup branch"
        exit 1
    fi
}

# Phase 2A Merger
merge_phase2a() {
    log_info "=== PHASE 2A MERGE START ==="

    local target_file="${DOCS_DIR}/05-fazlar/phase-2a-bolge-sistemi.md"
    local sources=(
        "phases/phase-2a1-regioncontext.md"
        "phases/phase-2a2-region-products.md"
        "phases/phase-2a3-cart-region.md"
        "phases/phase-2a4-delivery-slots.md"
    )

    local combined_content="# Phase 2A: Bölge Sistemi

> Tüm bölgesel özelliklerin entegre dokümantasyonu

---

## Bölüm 1: RegionContext
"

    for source in "${sources[@]}"; do
        local source_path="${DOCS_DIR}/${source}"
        if [[ -f "${source_path}" ]]; then
            local content=$(cat "${source_path}")
            local section_name=$(basename "${source}" | sed 's/phases\///' | sed 's/phase-2a[0-9]-//')
            combined_content+="


---

## ${section_name}

${content}"
            log_info "Merged: ${source}"
        fi
    done

    echo "${combined_content}" > "${target_file}"
    log_success "Phase 2A merge complete: ${target_file}"
}

# Batch Migration: Reports (Batch 1)
migrate_batch1_reports() {
    log_info "=== BATCH 1: REPORTS MIGRATION ==="

    local migrations=(
        "reports/*.md:09-raporlar/2026-01/"
        "security/*.md:09-raporlar/guvenlik/"
        "fixes/*.md:09-raporlar/fixler/"
        "reviews/*.md:09-raporlar/code-reviews/"
        "speed-test-sonuc/*.pdf:09-raporlar/2026-01/performans/"
    )

    for migration in "${migrations[@]}"; do
        local from_pattern="${migration%%:*}"
        local to_dir="${migration##*:}"

        # Ensure target directory exists
        mkdir -p "${DOCS_DIR}/${to_dir}"

        # Move files
        for from_file in ${DOCS_DIR}/${from_pattern}; do
            if [[ -f "${from_file}" ]]; then
                local filename=$(basename "${from_file}")
                local target_path="${DOCS_DIR}/${to_dir}${filename}"
                (cd "${PROJECT_ROOT}" && git mv "${from_file}" "${target_path}")
                log_info "Moved: ${filename} -> ${to_dir}"
            fi
        done
    done
}

# Batch Migration: Business Logic (Batch 2)
migrate_batch2_business() {
    log_info "=== BATCH 2: BUSINESS LOGIC MIGRATION ==="

    local migrations=(
        "business/*:04-is-mantigi/"
        "diagrams/*:04-is-mantigi/diyagramlar/"
    )

    for migration in "${migrations[@]}"; do
        local from_pattern="${migration%%:*}"
        local to_dir="${migration##*:}"

        mkdir -p "${DOCS_DIR}/${to_dir}"

        for from_item in ${DOCS_DIR}/${from_pattern}; do
            if [[ -e "${from_item}" ]]; then
                local filename=$(basename "${from_item}")
                local target_path="${DOCS_DIR}/${to_dir}${filename}"
                (cd "${PROJECT_ROOT}" && git mv "${from_item}" "${target_path}")
                log_info "Moved: ${filename} -> ${to_dir}"
            fi
        done
    done
}

# Batch Migration: Testing (Batch 3)
migrate_batch3_testing() {
    log_info "=== BATCH 3: TESTING MIGRATION ==="

    local to_dir="07-test/"
    mkdir -p "${DOCS_DIR}/${to_dir}"

    # Move all testing files
    for from_file in ${DOCS_DIR}/testing/*.md; do
        if [[ -f "${from_file}" ]]; then
            local filename=$(basename "${from_file}")
            local target_path="${DOCS_DIR}/${to_dir}${filename}"
            (cd "${PROJECT_ROOT}" && git mv "${from_file}" "${target_path}")
            log_info "Moved: ${filename} -> ${to_dir}"
        fi
    done

    # Rename BETA-TESTING-GUIDE.md
    local beta_guide="${DOCS_DIR}/BETA-TESTING-GUIDE.md"
    if [[ -f "${beta_guide}" ]]; then
        local target_path="${DOCS_DIR}/${to_dir}beta-testing-rehberi.md"
        (cd "${PROJECT_ROOT}" && git mv "${beta_guide}" "${target_path}")
        log_info "Renamed: BETA-TESTING-GUIDE.md -> beta-testing-rehberi.md"
    fi
}

# Batch Migration: Development (Batch 4)
migrate_batch4_development() {
    log_info "=== BATCH 4: DEVELOPMENT MIGRATION ==="

    local migrations=(
        "development/*:06-gelistirme/"
        "technical-debt/*:10-bakim/teknik-borc/"
        "notes/*:06-gelistirme/notlar/"
        "checklists/*:06-gelistirme/kontroller/"
    )

    for migration in "${migrations[@]}"; do
        local from_pattern="${migration%%:*}"
        local to_dir="${migration##*:}"

        mkdir -p "${DOCS_DIR}/${to_dir}"

        for from_item in ${DOCS_DIR}/${from_pattern}; do
            if [[ -e "${from_item}" ]]; then
                local filename=$(basename "${from_item}")
                local target_path="${DOCS_DIR}/${to_dir}${filename}"
                (cd "${PROJECT_ROOT}" && git mv "${from_item}" "${target_path}")
                log_info "Moved: ${filename} -> ${to_dir}"
            fi
        done
    done
}

# Batch Migration: Architecture (Batch 5)
migrate_batch5_architecture() {
    log_info "=== BATCH 5: ARCHITECTURE MIGRATION ==="

    # API files
    mkdir -p "${DOCS_DIR}/03-mimari/api"
    for from_file in ${DOCS_DIR}/api/*.md; do
        if [[ -f "${from_file}" ]]; then
            local filename=$(basename "${from_file}")
            (cd "${PROJECT_ROOT}" && git mv "${from_file}" "${DOCS_DIR}/03-mimari/api/${filename}")
            log_info "Moved: ${filename} -> 03-mimari/api/"
        fi
    done

    # Architecture schema
    for from_file in ${DOCS_DIR}/architecture/*.md; do
        if [[ -f "${from_file}" ]]; then
            (cd "${PROJECT_ROOT}" && git mv "${from_file}" "${DOCS_DIR}/03-mimari/veritabani-semasi.md")
            log_info "Moved: architecture schema -> 03-mimari/veritabani-semasi.md"
        fi
    done
}

# Batch Migration: Usage Guides (Batch 6)
migrate_batch6_guides() {
    log_info "=== BATCH 6: GUIDES MIGRATION ==="

    # Guides -> references/supabase
    mkdir -p "${DOCS_DIR}/12-referanslar/supabase"
    for from_file in ${DOCS_DIR}/guides/*.md; do
        if [[ -f "${from_file}" ]]; then
            local filename=$(basename "${from_file}")
            (cd "${PROJECT_ROOT}" && git mv "${from_file}" "${DOCS_DIR}/12-referanslar/supabase/${filename}")
            log_info "Moved: ${filename} -> 12-referanslar/supabase/"
        fi
    done

    # SUPERADMIN files
    for from_file in ${DOCS_DIR}/SUPERADMIN-*.md; do
        if [[ -f "${from_file}" ]]; then
            local filename=$(basename "${from_file}")
            (cd "${PROJECT_ROOT}" && git mv "${from_file}" "${DOCS_DIR}/02-kullanim-kilavuzlari/${filename}")
            log_info "Moved: ${filename} -> 02-kullanim-kilavuzlari/"
        fi
    done

    # PASSWORD_RESET_GUIDE.md
    local password_guide="${DOCS_DIR}/PASSWORD_RESET_GUIDE.md"
    if [[ -f "${password_guide}" ]]; then
        (cd "${PROJECT_ROOT}" && git mv "${password_guide}" "${DOCS_DIR}/02-kullanim-kilavuzlari/")
        log_info "Moved: PASSWORD_RESET_GUIDE.md -> 02-kullanim-kilavuzlari/"
    fi

    # TEDARIKCI_KULLANIM_KILAVUZU.md
    local supplier_guide="${DOCS_DIR}/TEDARIKCI_KULLANIM_KILAVUZU.md"
    if [[ -f "${supplier_guide}" ]]; then
        (cd "${PROJECT_ROOT}" && git mv "${supplier_guide}" "${DOCS_DIR}/02-kullanim-kilavuzlari/tedarikci-paneli.md")
        log_info "Moved: TEDARIKCI_KULLANIM_KILAVUZU.md -> 02-kullanim-kilavuzlari/tedarikci-paneli.md"
    fi

    # UPDATE-TEST-ACCOUNTS.md
    local test_accounts="${DOCS_DIR}/UPDATE-TEST-ACCOUNTS.md"
    if [[ -f "${test_accounts}" ]]; then
        (cd "${PROJECT_ROOT}" && git mv "${test_accounts}" "${DOCS_DIR}/01-baslangic/test-hesaplar.md")
        log_info "Moved: UPDATE-TEST-ACCOUNTS.md -> 01-baslangic/test-hesaplar.md"
    fi
}

# Batch Migration: Deployment (Batch 7)
migrate_batch7_deployment() {
    log_info "=== BATCH 7: DEPLOYMENT MIGRATION ==="

    mkdir -p "${DOCS_DIR}/08-deployment"

    for from_file in ${DOCS_DIR}/MIGRATION_*.md; do
        if [[ -f "${from_file}" ]]; then
            local filename=$(basename "${from_file}")
            local new_name=$(echo "${filename}" | sed 's/^MIGRATION_/migrasyon-/')
            (cd "${PROJECT_ROOT}" && git mv "${from_file}" "${DOCS_DIR}/08-deployment/${new_name}")
            log_info "Moved: ${filename} -> 08-deployment/${new_name}"
        fi
    done
}

# Batch Migration: Technical & References (Batch 8)
migrate_batch8_technical() {
    log_info "=== BATCH 8: TECHNICAL & REFERENCES MIGRATION ==="

    # TARGET_KEYWORDS.md
    local keywords_file="${DOCS_DIR}/TARGET_KEYWORDS.md"
    if [[ -f "${keywords_file}" ]]; then
        (cd "${PROJECT_ROOT}" && git mv "${keywords_file}" "${DOCS_DIR}/11-teknik/seo-keywords.md")
        log_info "Moved: TARGET_KEYWORDS.md -> 11-teknik/seo-keywords.md"
    fi

    # img-ref -> references
    mkdir -p "${DOCS_DIR}/12-referanslar/gorsel-referanslar"
    for from_item in ${DOCS_DIR}/img-ref/*; do
        if [[ -e "${from_item}" ]]; then
            local filename=$(basename "${from_item}")
            (cd "${PROJECT_ROOT}" && git mv "${from_item}" "${DOCS_DIR}/12-referanslar/gorsel-referanslar/${filename}")
            log_info "Moved: ${filename} -> 12-referanslar/gorsel-referanslar/"
        fi
    done
}

# Phase Files Migration
migrate_phase_files() {
    log_info "=== PHASE FILES MIGRATION ==="

    local phase_renames=(
        "phase-10-import-export.md:phase-10-excel.md"
        "phase-11-warehouse-mvp.md:phase-11-depo.md"
        "phase-12-multi-supplier.md:phase-12-coklu-tedarikci.md"
        "phase-5-approval-system.md:phase-5-onay-sistemi.md"
        "phase-6-order-delivery.md:phase-6-siparis-teslimat.md"
        "phase-7-payment-system.md:phase-7-odeme.md"
        "phase-8-business-panel.md:phase-8-b2b-panel.md"
        "phase-9-supplier-panel.md:phase-9-mobil-tedarikci.md"
    )

    local phases_dir="${DOCS_DIR}/phases"
    local target_dir="${DOCS_DIR}/05-fazlar"

    for rename in "${phase_renames[@]}"; do
        local old_name="${rename%%:*}"
        local new_name="${rename##*:}"
        local from_path="${phases_dir}/${old_name}"

        if [[ -f "${from_path}" ]]; then
            (cd "${PROJECT_ROOT}" && git mv "${from_path}" "${target_dir}/${new_name}")
            log_info "Moved: ${old_name} -> ${new_name}"
        fi
    done

    # Direct moves
    local direct_moves=(
        "phase-3-rbac.md"
        "phase-4-email.md"
    )

    for file_name in "${direct_moves[@]}"; do
        local from_path="${phases_dir}/${file_name}"
        if [[ -f "${from_path}" ]]; then
            (cd "${PROJECT_ROOT}" && git mv "${from_path}" "${target_dir}/${file_name}")
            log_info "Moved: ${file_name} -> 05-fazlar/"
        fi
    done
}

# Verification
verify_migration() {
    log_info "=== MIGRATION VERIFICATION ==="

    local issues=0

    # Check old folders are empty
    local old_folders=("phases" "reports" "business" "testing" "development" "guides" "api" "architecture" "diagrams" "checklists" "fixes" "notes" "reviews" "security" "technical-debt" "img-ref" "speed-test-sonuc")

    for folder in "${old_folders[@]}"; do
        local folder_path="${DOCS_DIR}/${folder}"
        if [[ -d "${folder_path}" ]]; then
            local count=$(find "${folder_path}" -mindepth 1 | wc -l)
            if [[ ${count} -gt 0 ]]; then
                log_warning "Old folder not empty: ${folder} (${count} items remaining)"
                ((issues++))
            fi
        fi
    done

    # Check target folders exist
    local target_folders=("01-baslangic" "02-kullanim-kilavuzlari" "03-mimari" "04-is-mantigi" "05-fazlar" "06-gelistirme" "07-test" "08-deployment" "09-raporlar" "10-bakim" "11-teknik" "12-referanslar")

    for folder in "${target_folders[@]}"; do
        if [[ ! -d "${DOCS_DIR}/${folder}" ]]; then
            log_warning "Target folder missing: ${folder}"
            ((issues++))
        fi
    done

    if [[ ${issues} -gt 0 ]]; then
        log_warning "=== VERIFICATION ISSUES FOUND: ${issues} ==="
        return 1
    else
        log_success "=== VERIFICATION PASSED ==="
        return 0
    fi
}

# Main execution
main() {
    log_info "=== DOCUMENTATION GIT MIGRATION START ==="
    log_info "Project Root: ${PROJECT_ROOT}"

    # Ensure log directory exists
    mkdir -p "${LOG_DIR}"

    # Check for existing changes
    if test_git_changes; then
        log_warning "WARNING: Uncommitted changes detected!"
        read -p "Continue anyway? (Y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Migration cancelled by user"
            exit 0
        fi
    fi

    # Create backup branch
    local backup_branch=$(backup_branch)

    # Execute migrations
    merge_phase2a
    migrate_batch1_reports
    migrate_batch2_business
    migrate_batch3_testing
    migrate_batch4_development
    migrate_batch5_architecture
    migrate_batch6_guides
    migrate_batch7_deployment
    migrate_batch8_technical
    migrate_phase_files

    # Verification
    if verify_migration; then
        log_success "=== MIGRATION COMPLETE ==="
        log_info "Please review changes and commit"
        log_info "Backup branch: ${backup_branch}"
        log_info "Log file: ${LOG_FILE}"
    else
        log_warning "=== MIGRATION COMPLETE WITH ISSUES ==="
        log_info "Please review verification output"
        exit 1
    fi
}

# Run main
main "$@"
