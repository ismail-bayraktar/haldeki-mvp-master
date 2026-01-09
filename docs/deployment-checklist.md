# Deployment Checklist

> Bu doküman, Haldeki projesinin production deployment öncesi ve sonrası yapılması gereken kontrolleri içerir.

**Son güncelleme**: 2026-01-09

---

## 🚀 Pre-Deployment Checklist

### 1. Database Migration

- [ ] Supabase migration status check:
  ```bash
  npx supabase db remote changes
  ```
- [ ] Apply pending migrations:
  ```bash
  npx supabase db push
  ```
- [ ] Verify tables created:
  - [ ] `products` (with product_status, last_modified_by, last_modified_at)
  - [ ] `region_products` (with business_price)
  - [ ] `vendors`
  - [ ] `warehouse_staff`
  - [ ] `product_imports`
- [ ] Verify RLS policies enabled:
  ```sql
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public';
  ```
- [ ] Verify indexes created:
  ```sql
  SELECT indexname, tablename
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
  ```
- [ ] Verify RPC functions:
  ```sql
  SELECT proname, prosecdef
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
  AND proname LIKE 'warehouse%';
  ```

### 2. Storage Buckets

- [ ] Verify storage buckets exist:
  ```bash
  npx supabase storage list
  ```
- [ ] Verify bucket policies:
  - [ ] `product-images` (public, supplier-scoped)
  - [ ] `delivery-proofs` (private)

### 3. Environment Variables

- [ ] Check `.env` file:
  ```env
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJxxx...
  ```
- [ ] Verify Supabase connection:
  ```bash
  npx supabase status
  ```
- [ ] Test authentication flow:
  ```bash
  npx supabase auth login
  ```

### 4. Frontend Build

- [ ] Install dependencies:
  ```bash
  npm ci
  ```
- [ ] Check TypeScript errors:
  ```bash
  npm run tsc --noEmit
  ```
- [ ] Run linter:
  ```bash
  npm run lint
  ```
- [ ] Run tests:
  ```bash
  npm run test
  ```
- [ ] Build production bundle:
  ```bash
  npm run build
  ```
- [ ] Check build output size:
  ```bash
  du -sh dist/
  ```
- [ ] Verify build output:
  - [ ] `dist/index.html` exists
  - [ ] `dist/assets/` contains JS/CSS bundles
  - [ ] No console errors in browser

### 5. Test Accounts

- [ ] Create test accounts:
  - [ ] Admin: `admin@test.haldeki.com` / `Test1234!`
  - [ ] Dealer: `dealer@test.haldeki.com` / `Test1234!`
  - [ ] Supplier: `supplier@test.haldeki.com` / `Test1234!`
  - [ ] Business: `business@test.haldeki.com` / `Test1234!`
  - [ ] Warehouse: `warehouse@test.haldeki.com` / `Test1234!`
- [ ] Verify account approvals:
  ```sql
  SELECT u.email, ur.role, s.approval_status
  FROM auth.users u
  JOIN user_roles ur ON ur.user_id = u.id
  LEFT JOIN suppliers s ON s.user_id = u.id
  WHERE u.email LIKE '%test.haldeki.com';
  ```

---

## 🧪 Functional Testing

### Phase 9: Supplier Panel

- [ ] Login as supplier
- [ ] Create product with image
- [ ] Edit product inline
- [ ] Filter products by category
- [ ] Search products
- [ ] Delete product
- [ ] Bulk delete products
- [ ] Upload product image from camera

### Phase 10: Import/Export

- [ ] Download product template (Excel)
- [ ] Fill template with product data
- [ ] Import products (success case)
- [ ] Import products with validation errors
- [ ] View import history
- [ ] Rollback import
- [ ] Export products to Excel
- [ ] Export products to CSV

### Phase 11: Warehouse MVP

- [ ] Login as warehouse staff
- [ ] View orders by time window
- [ ] Switch between day/night shift
- [ ] View picking list (NO prices)
- [ ] Mark order as prepared
- [ ] Verify price masking (DB + UI)
- [ ] Test vendor isolation

---

## 🔒 Security Verification

### RLS Policy Testing

```sql
-- Test 1: Supplier can only see their products
SET ROLE authenticated;
SET jwt.claims.sub = 'supplier-user-id';

SELECT id, name, supplier_id
FROM products
WHERE supplier_id = auth.uid(); -- Should return only own products

-- Test 2: Warehouse staff cannot see prices
SET jwt.claims.sub = 'warehouse-user-id';

SELECT * FROM warehouse_get_orders(
  NOW() - INTERVAL '1 day',
  NOW()
); -- Should NOT return price columns

-- Test 3: Vendor isolation
SET jwt.claims.sub = 'warehouse-staff-vendor-a';

SELECT COUNT(*) FROM warehouse_get_orders(...);
-- Should return only vendor A's orders
```

### Security Checklist

- [ ] All tables have RLS enabled
- [ ] No table has `SELECT` policy for `public`
- [ ] RPC functions use `SECURITY DEFINER`
- [ ] Auth checks in all RPC functions
- [ ] Storage policies are scoped to user folders
- [ ] No hardcoded credentials in code
- [ ] Environment variables are not committed
- [ ] CORS is properly configured

---

## 📊 Performance Verification

### Database Queries

- [ ] Run `EXPLAIN ANALYZE` on critical queries:
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM products
  WHERE supplier_id = $1
  AND product_status = 'active'
  ORDER BY last_modified_at DESC;
  ```
- [ ] Verify index usage (no Seq Scan)
- [ ] Check query execution time (< 100ms for most queries)
- [ ] Monitor connection pool usage

### Frontend Performance

- [ ] Run Lighthouse audit:
  ```bash
  npx lighthouse https://your-domain.com --view
  ```
- [ ] Check Core Web Vitals:
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] Verify bundle size:
  - [ ] Initial JS < 200KB
  - [ ] Total assets < 500KB
- [ ] Check lazy loading implementation
- [ ] Verify React Query caching

---

## 📱 Mobile Testing

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test camera integration
- [ ] Test responsive breakpoints:
  - [ ] Mobile (< 640px)
  - [ ] Tablet (640px - 1024px)
  - [ ] Desktop (> 1024px)
- [ ] Test touch interactions
- [ ] Test offline behavior

---

## 🔭 Monitoring Setup

### Supabase Monitoring

- [ ] Enable database logs:
  ```sql
  ALTER DATABASE postgres SET log_statement = 'mod';
  ```
- [ ] Set up log export
- [ ] Configure alerting:
  - [ ] High CPU usage (> 80%)
  - [ ] High memory usage (> 80%)
  - [ ] Failed logins (> 10/min)
  - [ ] Slow queries (> 1s)

### Frontend Error Tracking

- [ ] Set up error boundary
- [ ] Configure error reporting (Sentry, LogRocket, etc.)
- [ ] Monitor console errors in production
- [ ] Track API failures

### Analytics

- [ ] Set up Google Analytics 4
- [ ] Configure custom events:
  - [ ] Product views
  - [ ] Add to cart
  - [ ] Checkout
  - [ ] Order completion
- [ ] Track user flows
- [ ] Monitor conversion rates

---

## 📝 Post-Deployment Checklist

### Smoke Tests

- [ ] Homepage loads
- [ ] User registration works
- [ ] User login works
- [ ] Product listing loads
- [ ] Add to cart works
- [ ] Checkout flow works
- [ ] Admin dashboard loads
- [ ] Supplier dashboard loads
- [ ] Warehouse dashboard loads

### Data Verification

- [ ] Check products count:
  ```sql
  SELECT COUNT(*) FROM products;
  ```
- [ ] Check active products:
  ```sql
  SELECT COUNT(*) FROM products WHERE product_status = 'active';
  ```
- [ ] Check regions:
  ```sql
  SELECT COUNT(*) FROM regions WHERE is_active = true;
  ```
- [ ] Check user roles:
  ```sql
  SELECT role, COUNT(*) FROM user_roles GROUP BY role;
  ```

### Backup Verification

- [ ] Database backup enabled
- [ ] Automated backup schedule configured (daily)
- [ ] Point-in-time recovery enabled
- [ ] Storage backup configured
- [ ] Test restore process (non-production)

---

## 🚨 Rollback Plan

If deployment fails:

1. **Database Rollback**:
   ```bash
   npx supabase db reset --version <previous-migration>
   ```

2. **Frontend Rollback**:
   ```bash
   git revert <commit-hash>
   npm run build
   # Deploy previous version
   ```

3. **Emergency Contacts**:
   - DevOps: [Contact info]
   - Database Admin: [Contact info]
   - Product Owner: [Contact info]

---

## ✅ Deployment Sign-off

- [ ] Pre-deployment checklist completed
- [ ] All tests passing
- [ ] Security verified
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Rollback plan tested

**Deployed by**: _____________
**Date**: _____________
**Version**: _____________

**Approved by**: _____________

---

## 📚 Related Documentation

- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Project status
- [ROADMAP.md](./ROADMAP.md) - Feature roadmap
- [phases/](./phases/) - Phase documentation
- [architecture/](./architecture/) - Architecture docs
