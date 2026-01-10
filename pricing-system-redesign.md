# Pricing/Product System Redesign - Haldeki Market

## Overview

Complete redesign of the pricing and product management system from scratch to simplify the complex 4-layer pricing structure and consolidate incompatible variant systems. The system will support B2B/B2C pricing with configurable commissions, regional pricing, and multi-supplier product catalog.

## Current Problems

### 4-Layer Pricing Complexity
1. products.price - Base product price
2. products.base_price - Supplier base price  
3. region_products.price - Regional retail price
4. region_products.business_price - Regional B2B price
5. supplier_products.price - Supplier-specific price
6. supplier_product_variations.price_adjustment - Variant price modifier

### 2 Incompatible Variant Systems
1. ProductVariant (legacy) - with priceMultiplier field
2. ProductVariation (Phase 12) - with price_adjustment field

### Business Requirements
- Digital marketplace (dijital hal) - B2B priority
- Commission structure: 30% for B2B, 50% for B2C (admin-adjustable)
- 2 existing regions with regional pricing requirements
- Suppliers update their own prices
- Stock tracking by supplier and warehouse
- MOQ (minimum order quantity) managed via admin panel
- Customer sees price, adds to cart, selects variations

## Success Criteria

1. Single Source of Truth for Pricing - One place to look for the correct price
2. Simple B2B/B2C Logic - Clear commission calculation, admin-adjustable rates
3. Unified Variant System - Only one variant mechanism in the entire system
4. Safe Migration - Zero data loss, rollback capability at every step
5. Clean Code - Remove all pricing ambiguity from codebase

## Task Breakdown

### Phase 1: Analysis & Design (NO CODE)
- Task 1.1: Document current pricing flow end-to-end
- Task 1.2: Design new pricing data model  
- Task 1.3: Design variant system consolidation
- Task 1.4: Design B2B/B2C pricing model

### Phase 2: Database Schema (NEW STRUCTURE)
- Task 2.1: Create pricing_config table
- Task 2.2: Simplify products table
- Task 2.3: Redesign supplier_products as price authority
- Task 2.4: Redesign region_products with multipliers
- Task 2.5: Create customer_prices view (single source of truth)

### Phase 3: Variant System Consolidation
- Task 3.1: Choose final variant system (ProductVariation)
- Task 3.2: Migrate ProductVariant data to ProductVariation
- Task 3.3: Remove ProductVariant from types

### Phase 4: Backend API Updates
- Task 4.1: Create calculate_customer_price RPC
- Task 4.2: Update get_product_suppliers RPC
- Task 4.3: Create calculate_cart_prices RPC
- Task 4.4: Update RLS policies for pricing_config

### Phase 5: Frontend Component Updates
- Task 5.1: Create pricing calculator library
- Task 5.2: Create pricing hooks
- Task 5.3: Update ProductCard component
- Task 5.4: Update Cart components (25+ affected files)
- Task 5.5: Update Supplier price management
- Task 5.6: Update Admin commission panel

### Phase 6: Migration & Rollback
- Task 6.1: Create data migration script
- Task 6.2: Create rollback script
- Task 6.3: Create verification script
- Task 6.4: Run migration on staging

### Phase 7: Testing & Verification
- Task 7.1: Unit tests for pricing calculator
- Task 7.2: Integration tests for RPC functions
- Task 7.3: E2E tests for pricing UI
- Task 7.4: Manual testing checklist

### Phase 8: Deployment
- Task 8.1: Prepare production migration plan
- Task 8.2: Schedule production deployment
- Task 8.3: Execute production migration
- Task 8.4: Post-deployment monitoring

### Phase X: Final Verification (MANDATORY)
- Task X.1: Run security scan
- Task X.2: Run UX audit
- Task X.3: Run Lighthouse audit
- Task X.4: Run E2E tests
- Task X.5: Verify data integrity

## Key Decisions Needed

### Decision 1: Regional Pricing Approach
RECOMMENDED: Use Multiplier - final_price = supplier_price * regional_multiplier
Reason: Regional differences in Turkey are typically 10-20%, multiplier allows simple global price changes

### Decision 2: Keep supplier_products Junction?
RECOMMENDED: Yes, keep junction
Reason: Business model is multi-supplier marketplace, future-proof for supplier comparison

### Decision 3: Price Calculation Location
RECOMMENDED: RPC Function
Reason: Business logic in backend, testable, cacheable, secure with RLS

### Decision 4: Variant System Choice
RECOMMENDED: Keep ProductVariation (Phase 12)
Reason: More flexible, already integrated, 70 existing records

## Migration Strategy

### Pre-Migration Checklist
- Full database backup completed
- Staging environment tested
- Rollback script tested
- Team notified of deployment
- Monitoring tools ready

### Migration Steps
1. Backup - Create timestamped backup
2. Schema Add - Add new columns/tables (non-breaking)
3. Data Migrate - Populate new structures
4. Verify - Check data integrity
5. Code Deploy - Deploy frontend/backend changes
6. Switch Traffic - Start using new pricing
7. Monitor - Watch for errors
8. Cleanup - Remove old schema (after 7 days)

### Rollback Strategy
TRIGGERS: Data verification fails, price errors > 1%, performance > 50% degradation, critical bugs

## Done When

- [ ] All 4 pricing layers consolidated into single source of truth
- [ ] Only one variant system exists in codebase
- [ ] B2B/B2C pricing works with configurable commissions
- [ ] Regional pricing simplified and working
- [ ] All 25+ affected frontend files updated
- [ ] Migration tested on staging
- [ ] Rollback verified
- [ ] Phase X verification complete (all scripts pass)
- [ ] Production deployed and stable for 48 hours
