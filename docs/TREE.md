# Dokümantasyon Yapısı

```
docs/
├── 01-baslangic/
│   ├── kurulum.md
│   ├── projeye-giris.md
│   ├── README.md
│   ├── test-hesaplar-guncelleme.md
│   └── test-hesaplar.md
├── 02-kullanim-kilavuzlari/
│   ├── README.md
│   ├── SUPERADMIN-DOCUMENTATION-SUMMARY.md
│   ├── SUPERADMIN-QUICK-REFERENCE.md
│   └── tedarikci-paneli.md
├── 03-mimari/
│   ├── api/
│   │   ├── index.md
│   │   ├── otomatik-index.md
│   │   └── README.md
│   ├── genel-bakis.md
│   ├── README.md
│   └── veritabani-semasi.md
├── 04-is-mantigi/
│   ├── diyagramlar/
│   │   ├── admin-registration-flow-diagram.md
│   │   └── invite-lifecycle-diagram.md
│   ├── admin-panel-features.md
│   ├── dealer-supplier-flow.md
│   ├── direct-registration-flow.md
│   ├── invite-filtering-logic.md
│   ├── invite-lifecycle.md
│   ├── password-change-flow.md
│   └── README.md
├── 05-fazlar/
│   ├── phase-10-excel.md
│   ├── phase-11-depo.md
│   ├── phase-12-coklu-tedarikci.md
│   ├── phase-2a-bolge-sistemi.md
│   ├── phase-3-rbac.md
│   ├── phase-4-email.md
│   ├── phase-5-onay-sistemi.md
│   ├── phase-6-siparis-teslimat.md
│   ├── phase-7-odeme.md
│   ├── phase-8-b2b-panel.md
│   ├── phase-9-mobil-tedarikci.md
│   └── README.md
├── 06-ai/
│   ├── agents/
│   │   ├── 01_IS_MANTIGI_KILAVUZU_AI.md
│   │   ├── 02_DOC_AUDITOR_AI.md
│   │   ├── 03_PRODUCT_MANAGER_AI.md
│   │   ├── 04_TECH_ARCHITECT_AI.md
│   │   ├── 05_SUPABASE_ENGINEER_AI.md
│   │   └── 06_QA_ANALYST_AI.md
│   ├── knowledge/
│   │   ├── DIGITAL_HAL_PLAYBOOK.md
│   │   ├── DOC_STYLE_GUIDE.md
│   │   ├── MULTI_AGENT_HANDOFF_GUIDE.md
│   │   └── SECURITY_BASELINE.md
│   ├── prompts/
│   │   ├── 00_MASTER_PROMPT.md
│   │   ├── 10_DISCOVERY_INTERVIEW.md
│   │   ├── 20_DOMAIN_MODELING.md
│   │   ├── 30_DOC_GENERATION.md
│   │   ├── 40_SUPABASE_CLI_TASKS.md
│   │   └── 50_DOC_AUDIT.md
│   ├── templates/
│   │   ├── ADR_TEMPLATE.md
│   │   ├── API_CONTRACT_TEMPLATE.md
│   │   ├── BUSINESS_RULES_TEMPLATE.md
│   │   ├── DOMAIN_MODEL_TEMPLATE.md
│   │   ├── PRD_TEMPLATE.md
│   │   ├── RBAC_TEMPLATE.md
│   │   ├── RLS_POLICY_TEMPLATE.md
│   │   ├── SUPABASE_SCHEMA_TEMPLATE.md
│   │   └── TEST_PLAN_TEMPLATE.md
│   ├── workflows/
│   │   ├── 00_END_TO_END_WORKFLOW.md
│   │   ├── 10_DISCOVERY_TO_DOMAIN.md
│   │   ├── 20_DOMAIN_TO_TECH_SPECS.md
│   │   ├── 30_TECH_SPECS_TO_TASKS.md
│   │   └── 40_RELEASE_READINESS.md
│   └── START_HERE.md
├── 06-gelistirme/
│   ├── kontroller/
│   │   ├── HERO_SECTION_TODOS.md
│   │   ├── SEO_TODOS.md
│   │   └── SITE_STATUS.md
│   ├── notlar/
│   │   └── VARYASYON-FIYAT-ISSUE.md
│   ├── development-README.md
│   ├── documentation-sync.md
│   ├── PLAYGROUND_IMPLEMENTATION_PLAN.md
│   ├── README.md
│   ├── SUPERADMIN-CREDENTIALS.md
│   └── TEST_ACCOUNTS.md
├── 07-test/
│   ├── beta-testing-rehberi.md
│   ├── e2e-getting-started-guide.md
│   ├── e2e-implementation-summary.md
│   ├── e2e-quick-reference.md
│   ├── e2e-troubleshooting-visual.md
│   ├── README.md
│   └── test-data-attributes.md
├── 08-deployment/
│   ├── MIGRATION_EXECUTION_GUIDE.md
│   ├── MIGRATION_PLAN.md
│   ├── MIGRATION_QUICK_START.md
│   ├── MIGRATION_README.md
│   └── README.md
├── 09-raporlar/
│   ├── 2026-01/
│   │   ├── audits/

│   │   ├── daily/

│   │   ├── weekly/

│   │   ├── AUTH_FIX_SUMMARY.md
│   │   ├── BACKEND_SECURITY_AUDIT_REPORT.md
│   │   ├── CORNER_RIBBON_BADGE_REPORT.md
│   │   ├── CUSTOMER_TEST_FIX_GUIDE.md
│   │   ├── CUSTOMER_TEST_QUICK_SUMMARY.md
│   │   ├── DISTRIBUTION_TEST_SUMMARY.md
│   │   ├── E2E_TEST_SUITE_SUMMARY.md
│   │   ├── E2E_TEST_USERS_DEPLOYMENT_COMPLETE.md
│   │   ├── FAVICON_FIX_SUMMARY.md
│   │   ├── GUEST_UX_IMPROVEMENTS_REPORT.md
│   │   ├── HEADER_BADGE_UPDATE_REPORT.md
│   │   ├── MASTER_ORCHESTRATION_REPORT.md
│   │   ├── PASSWORD_RESET_REPORT.md
│   │   ├── PHASE1_TECHNICAL_DEBT_REPORT.md
│   │   ├── PHASE1-2-3_TECHNICAL_DEBT_STATUS.md
│   │   ├── PHASE12_CART_UI_MIGRATION_REPORT.md
│   │   ├── PHASE12_CRITICAL_ANALYSIS.md
│   │   ├── PHASE12_VERIFICATION_REPORT.md
│   │   ├── PHASE2_DEPLOYMENT_REPORT.md
│   │   ├── PHASE2_FIXES_SUMMARY.md
│   │   ├── PHASE2_FIXES_TEST_GUIDE.md
│   │   ├── PHASE2_INTEGRATION_TEST_REPORT.md
│   │   ├── PHASE2_MANUAL_TESTING_GUIDE.md
│   │   ├── PHASE2_TECHNICAL_DEBT_REPORT.md
│   │   ├── PHASE2_TEST_SUMMARY.md
│   │   ├── PHASE2_TESTING_SUMMARY.md
│   │   ├── SEO_GEO_SUMMARY.md
│   │   └── SUPPLIER_PRODUCT_VISIBILITY_ANALYSIS.md
│   ├── code-reviews/
│   │   ├── CODE_REVIEW_2026-01-09.md
│   │   └── README.md
│   ├── fixler/
│   │   ├── README.md
│   │   └── WAREHOUSE_STAFF_FIXES_2026-01-09.md
│   ├── guvenlik/
│   │   ├── SECURITY_FIX_ACTION_PLAN.md
│   │   ├── SECURITY_FIX_SUMMARY.md
│   │   ├── TEST_ACCOUNTS_AUDIT.md
│   │   └── TEST_ACCOUNTS_REPORT.md
│   ├── performans/
│   │   ├── haldeki-desktop-speed-test-result.pdf
│   │   └── haldeki-mobil-speed-test-result.pdf
│   └── README.md
├── 10-bakim/
│   ├── teknik-borc/
│   │   ├── CART_MIGRATION_DEBT.md
│   │   └── README.md
│   └── README.md
├── 11-teknik/
│   ├── README.md
│   └── seo-keywords.md
├── 12-referanslar/
│   ├── gorsel-referanslar/
│   │   ├── image.png
│   │   ├── prd-list.png
│   │   ├── tedarikci-paneli-toplam-urun-siparisi.png
│   │   └── urun-quick-edit-add-varyasyon.png
│   ├── supabase/
│   │   ├── 01-supabase-migration.md
│   │   ├── 02-supabase-auth-setup.md
│   │   ├── 03-auth-troubleshooting.md
│   │   └── 04-supabase-cli-setup.md
│   └── README.md
├── api/
│   └── index.md
├── deployment/
│   └── BETA_SECURITY_CHECKLIST.md
├── DOKUMAN_STANDARTLAMA_RAPORU.md
├── dokuman-migrasyon-plani.md
├── DOKUMASYON_YAPILANDIRMA_PLAN.md
├── INDEKS-GUNCEL.md
├── INDEKS.md
├── INDEX.md
├── MIGRATION_COMPLETE_REPORT.md
├── MIGRATION_SUMMARY.md
├── PASSWORD_RESET_GUIDE.md
├── PLAN.md
├── PLAYGROUND-TEST-DELIVERY.md
├── PLAYGROUND-TESTING-SETUP.md
├── README.md
├── ROADMAP.md
├── supplier-catalog-optimization.md
├── TEMPLATE.md
├── TESTING-STRATEGY.md
└── TREE.md
```

**Son güncelleme:** 2026-01-10T16:02:50.387Z