# Hero Section Feature Requests Checklist
## Haldeki Market - Admin-Managed Hero Products

**Created:** 2026-01-09
**Priority:** LOW (User marked as "gereksiz olabilir" - might be unnecessary)
**Status:** Concept Phase

---

## Overview

**Current State:** Homepage hero section displays static or automated product selections.
**Proposed Feature:** Admin panel to manage featured/hero products manually.
**Business Value:** Allow marketing team to highlight specific products, promotions, or seasonal items.

**Note:** User expressed uncertainty about necessity ("gereksiz olabilir"). Implement only if clear business need emerges.

---

## Feature Requirements

### Core Functionality

- [ ] **P2** - Admin panel interface for hero product management
  - [ ] Product selection interface
  - [ ] Drag-and-drop reordering
  - [ ] Enable/disable toggle for each hero slot
  - [ ] Preview mode to see how it looks on homepage

- [ ] **P2** - Database schema for hero products
  ```sql
  CREATE TABLE hero_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    region_id UUID REFERENCES regions(id), -- NULL = all regions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **P2** - API endpoints
  - [ ] GET /api/admin/hero-products - List all hero products
  - [ ] POST /api/admin/hero-products - Add product to hero
  - [ ] PUT /api/admin/hero-products/:id - Update order/status
  - [ ] DELETE /api/admin/hero-products/:id - Remove from hero

### Homepage Integration

- [ ] **P2** - Update homepage hero section
  - [ ] Fetch hero products from API
  - [ ] Fallback to automated selection if no hero products set
  - [ ] Respect region-specific hero products
  - [ ] Maintain responsive design

### Admin UX

- [ ] **P2** - Bulk operations
  - [ ] "Clear all hero products" button
  - [ ] "Auto-select from category" quick action
  - [ ] "Set region-specific heroes" feature
  - [ ] Clone hero configuration to another region

---

## Region-Specific Heroes (Optional Enhancement)

### Multi-Region Support

- [ ] **P2** - Region filtering in admin panel
  - [ ] Select region to configure heroes for
  - [ ] "Apply to all regions" option
  - [ ] Region-specific product recommendations

- [ ] **P2** - Region-based homepage logic
  - [ ] Detect user's selected region
  - [ ] Show region-specific hero products
  - [ ] Fallback to global heroes if no region heroes set
  - [ ] A/B testing capabilities

### Use Cases

- [ ] Menemen: Highlight local specialties
- [ ] Aliağa: Feature B2B-friendly bulk items
- [ ] Future regions: Customize for local preferences

---

## Automated vs Manual Selection

### Current Behavior (Keep as Fallback)

- [ ] **P1** - Preserve existing automated selection logic
  - [ ] "Bugün Halde" discounted products
  - [ ] Seasonal items
  - [ ] High-margin products
  - [ ] New arrivals

### Hybrid Mode (Best of Both)

- [ ] **P2** - Priority system
  - [ ] Manual hero products (highest priority)
  - [ ] Automated recommendations (fill empty slots)
  - [ ] "Pin" important products always visible
  - [ ] "Boost" algorithm to surface certain products

---

## Analytics & Tracking

### Performance Metrics

- [ ] **P2** - Hero product analytics
  - [ ] Click-through rate per hero product
  - [ ] Conversion rate from hero to purchase
  - [ ] A/B test different hero configurations
  - [ ] Heatmap tracking on hero section

### Admin Reports

- [ ] **P2** - Performance dashboard
  - [ ] Top-performing hero products
  - [ ] Time-based performance (hourly/weekly)
  - [ ] Region-specific performance
  - [ ] Comparison: Manual vs Auto selection

---

## Implementation Considerations

### Database Impact

- [ ] **P1** - Migration script for hero_products table
- [ ] **P1** - RLS policies for hero_products
- [ ] **P1** - Indexes for performance (product_id, region_id, display_order)
- [ ] **P1** - Cascade delete handling

### Performance

- [ ] **P1** - Caching strategy
  - [ ] Cache hero products for 5-15 minutes
  - [ ] Invalidate cache on admin changes
  - [ ] CDN caching for homepage
- [ ] **P1** - Query optimization
  - [ ] Single query to fetch all hero products
  - [ ] Include product details in same query
  - [ ] Avoid N+1 queries

### SEO Impact

- [ ] **P1** - Ensure hero products don't negatively impact SEO
  - [ ] Maintain semantic HTML structure
  - [ ] Alt text for product images
  - [ ] Schema markup for featured products
  - [ ] Don't hide important products from crawlers

---

## Decision Framework

### Implement If:

- [ ] Marketing team requests frequent hero changes
- [ ] Seasonal campaigns require manual promotion
- [ ] A/B testing shows manual selection outperforms auto
- [ ] Region-specific product needs emerge
- [ ] Competitors have similar features (competitive pressure)

### Don't Implement If:

- [x] User says "gereksiz olabilir" (might be unnecessary)
- [ ] Current automated selection performs well
- [ ] Admin panel already complex enough
- [ ] Development resources better spent elsewhere
- [ ] Low priority vs other SEO/UX improvements

---

## Alternative Approaches

### Quick Wins (Lower Effort)

- [ ] **P1** - "Featured" flag on products
  - [ ] Add boolean `is_featured` to products table
  - [ ] Simple checkbox in product edit form
  - [ ] Homepage queries all featured products
  - [ ] No dedicated hero management UI needed

- [ ] **P1** - "Promoted until date" field
  - [ ] Add `promoted_until` timestamp to products
  - [ ] Automatically expire promotions
  - [ ] Less manual management overhead

### No-Code Solution

- [ ] **P2** - Use existing product categories
  - [ ] Create "Öne Çıkanlar" (Featured) category
  - [ ] Add/remove products from category
  - [ ] Homepage displays products from this category
  - [ ] No database schema changes

---

## Priority Assessment

### Why LOW Priority?

1. **User Uncertainty:** User marked as "gereksiz olabilir"
2. **Existing Features:** Automated selection works well
3. **Other Priorities:** SEO, content, schema markup more critical
4. **Development Cost:** Non-trivial implementation effort
5. **Business Value:** Unclear if manual selection adds significant value

### When to Reconsider?

- Marketing team explicitly requests it
- Automated selection proves insufficient
- Competitor analysis shows it's standard
- Customer feedback requests more product curation
- Development bandwidth available after P0/P1 items

---

## Implementation Checklist (If Approved)

### Phase 1: Database & API

- [ ] Create migration for hero_products table
- [ ] Add RLS policies
- [ ] Create API endpoints
- [ ] Write unit tests for API
- [ ] Document API in API.md

### Phase 2: Admin UI

- [ ] Create admin page: `/admin/hero-products`
- [ ] Build product selection interface
- [ ] Implement drag-and-drop reordering
- [ ] Add region filter
- [ ] Create preview mode
- [ ] Write integration tests

### Phase 3: Homepage Integration

- [ ] Update homepage hero section
- [ ] Add fallback logic
- [ ] Test responsive design
- [ ] Verify SEO impact
- [ ] A/B test vs automated selection

### Phase 4: Analytics

- [ ] Add tracking events
- [ ] Create admin dashboard
- [ ] Set up A/B testing framework
- [ ] Document performance metrics

---

## Estimated Effort

| Task | Hours | Notes |
|------|-------|-------|
| Database & API | 4-6 | Migration, RLS, endpoints |
| Admin UI | 8-12 | Complex drag-and-drop |
| Homepage Integration | 2-4 | Relatively straightforward |
| Testing | 4-6 | Unit + integration tests |
| Documentation | 2-3 | API docs, user guide |
| **Total** | **20-31 hours** | ~3-4 days development |

---

## Related Documentation

- [ ] Link to PRD when hero section requirements added
- [ ] Link to design mockups when created
- [ ] Link to API documentation when implemented
- [ ] Link to user testing results when available

---

**Last Updated:** 2026-01-09
**Status:** ON HOLD - Awaiting business need confirmation
**Next Review:** When marketing team or admin requests feature
