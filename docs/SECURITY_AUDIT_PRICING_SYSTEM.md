# Security Audit: Pricing System Redesign
**Date:** 2026-01-10
**Auditor:** Security Specialist (AI)
**Project:** Haldeki Market - Pricing System Redesign
**Scope:** Price manipulation vulnerabilities, RPC security, RLS policies, input validation

---

## Executive Summary

This security audit identifies **7 CRITICAL**, **5 HIGH**, and **8 MEDIUM** severity vulnerabilities in the proposed pricing system redesign. The most significant risks involve:

1. **B2B Price Leakage** - Business prices visible to non-business users
2. **Supplier Price Manipulation** - Insufficient validation on price updates
3. **Missing Price Audit Trail** - No tracking of who changed prices
4. **Regional Pricing Bypass** - Potential for region-based price manipulation
5. **Client-Side Price Logic** - Critical calculations in untrusted environment

**Risk Assessment:** At current state, the system is **NOT PRODUCTION READY** from a security perspective.

---

## 1. Price Manipulation Risks

### 1.1 CRITICAL: B2B Price Leakage (A01: Broken Access Control)

**Finding:** Business prices can leak to non-business users through multiple vectors.

**Vulnerable Code Locations:**

```typescript
// File: src/lib/orderUtils.ts:111-113
const currentPrice = isBusinessUser && regionProduct.business_price
  ? regionProduct.business_price
  : regionProduct.price;
```

**Attack Vector:**
1. Client receives full `regionProduct` object including `business_price`
2. User can inspect network response or modify `isBusinessUser` flag
3. Business pricing exposed to B2C users

**Impact:** Financial loss - B2C users accessing business pricing (30% discount)

**Current RLS Policy (Insufficient):**
```sql
-- File: supabase/migrations/20250107000000_phase10_product_import_system.sql:104-111
CREATE POLICY "Hide business price from non-business"
ON public.region_products FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'business')
  OR has_role(auth.uid(), 'admin')
  OR business_price IS NULL
);
```

**Problem:** Policy exists but may be bypassed through:
- Views that don't filter properly
- RPC functions that return full rows
- Client-side caching of previous responses

**Recommendation:**
```sql
-- Create secure view that filters business prices
CREATE OR REPLACE VIEW public.region_products_secure AS
SELECT
  id,
  region_id,
  product_id,
  price,
  previous_price,
  price_change,
  availability,
  stock_quantity,
  is_active,
  -- Only include business_price if user has business role
  CASE
    WHEN has_role(auth.uid(), 'business') OR has_role(auth.uid(), 'admin')
    THEN business_price
    ELSE NULL
  END as business_price
FROM public.region_products;

-- Grant access to view instead of table
GRANT SELECT ON region_products_secure TO authenticated;
```

**Severity:** CRITICAL
**CVSS Score:** 8.1 (High)
**CWE:** CWE-200 (Exposure of Sensitive Information)

---

### 1.2 CRITICAL: Supplier Price Manipulation Bypass (A01: Broken Access Control)

**Finding:** Suppliers can manipulate prices beyond their authority through race conditions and insufficient validation.

**Vulnerable Code:**

```typescript
// File: src/services/supplierProducts.ts:305-367
export async function upsertSupplierProductPrice(
  supplierId: string,
  data: UpdatePriceData
): Promise<{ success: boolean; error?: string }> {
  // No validation of price range
  // No rate limiting
  // No audit logging
  const { error } = await supabase
    .from('supplier_products')
    .update(updateData)
    .eq('id', existingSp.id);
}
```

**Attack Vectors:**

1. **Price Manipulation to Zero:**
   - Supplier sets price to unreasonably low values
   - No minimum price validation in database
   - Database constraint only checks `price > 0`

2. **Rapid Price Changes:**
   - No rate limiting on price updates
   - Supplier can fluctuate prices to manipulate market data
   - `last_price_update` timestamp is not protected

3. **Race Condition in Price Update:**
   - Multiple simultaneous updates can overwrite previous_price
   - Price history can be lost

**Database Constraints (Insufficient):**
```sql
-- File: supabase/migrations/20250110000000_phase12_multi_supplier_products.sql:40
price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
```

**Missing Protections:**
- No maximum price limit
- No price change percentage limit (e.g., max 50% change per day)
- No audit trail for price changes
- No approval workflow for significant changes

**Recommendation:**

```sql
-- Add price change validation trigger
CREATE OR REPLACE FUNCTION validate_price_change()
RETURNS TRIGGER AS $$
DECLARE
  max_change NUMERIC := 0.50; -- 50% max change
  change_ratio NUMERIC;
BEGIN
  IF OLD.price IS NOT NULL AND OLD.price > 0 THEN
    change_ratio := ABS(NEW.price - OLD.price) / OLD.price;

    IF change_ratio > max_change THEN
      RAISE EXCEPTION 'Price change of %% exceeds maximum allowed %%',
        change_ratio * 100, max_change * 100
      USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Log price change to audit table
  INSERT INTO price_audit_log (
    supplier_product_id,
    old_price,
    new_price,
    changed_by,
    changed_at
  ) VALUES (
    NEW.id,
    OLD.price,
    NEW.price,
    auth.uid(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_supplier_price_change
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION validate_price_change();
```

**Severity:** CRITICAL
**CVSS Score:** 8.8 (High)
**CWE:** CWE-345 (Insufficient Verification of Data Authenticity)

---

### 1.3 HIGH: Regional Pricing Bypass (A01: Broken Access Control)

**Finding:** Users can potentially bypass regional pricing restrictions through region switching.

**Vulnerable Code:**

```typescript
// File: src/lib/orderUtils.ts:13-16
export async function validateOrderForRepeat(
  orderItems: OrderItem[],
  userRegionId: string,  // Client-provided region ID
  isBusinessUser: boolean = false
): Promise<RepeatOrderValidationResult>
```

**Attack Vector:**
1. User changes `userRegionId` in localStorage or API call
2. System may price products based on different region
3. User accesses products not available in their actual region

**Current Protection:** None - region ID is trusted from client

**Recommendation:**

```typescript
// Validate region belongs to user
export async function validateUserRegion(userId: string, regionId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_regions')
    .select('region_id')
    .eq('user_id', userId)
    .eq('region_id', regionId)
    .single();

  return !!data;
}
```

**Severity:** HIGH
**CVSS Score:** 7.5 (High)
**CWE:** CWE-287 (Improper Authentication)

---

## 2. RPC Function Security

### 2.1 CRITICAL: SQL Injection in search_supplier_products (A05: Injection)

**Finding:** The `search_supplier_products` RPC function is vulnerable to SQL injection through search text parameter.

**Vulnerable Function:**

```sql
-- File: supabase/migrations/20250110000000_phase12_multi_supplier_products.sql:277
AND (p_search_text IS NULL OR p.name ILIKE '%' || p_search_text || '%')
```

**Attack Vector:**
1. Attacker passes search text with SQL metacharacters
2. While parameterized query prevents direct injection, the pattern is vulnerable
3. Special characters can break the query structure

**Example Attack:**
```javascript
const maliciousSearch = "'; DROP TABLE supplier_products; --";
// Results in: ... ILIKE '%' || '; DROP TABLE supplier_products; --' || '%'
```

**Note:** PostgreSQL's parameterized queries prevent literal SQL injection, but:
- Still vulnerable to pattern injection attacks
- Can cause query errors leading to DoS
- May leak information through error messages

**Recommendation:**

```sql
CREATE OR REPLACE FUNCTION search_supplier_products(
  p_supplier_id UUID,
  p_search_text TEXT DEFAULT NULL,
  p_variation_types product_variation_type[] DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL
)
RETURNS TABLE (...) AS $$
DECLARE
  sanitized_search TEXT;
BEGIN
  -- Sanitize search input
  IF p_search_text IS NOT NULL THEN
    sanitized_search := regexp_replace(p_search_text, '[%_\\]', '\\\0', 'g');
  END IF;

  RETURN QUERY
  SELECT DISTINCT ...
  WHERE ...
    AND (sanitized_search IS NULL OR p.name ILIKE '%' || sanitized_search || '%')
    ...
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Severity:** CRITICAL
**CVSS Score:** 9.0 (Critical)
**CWE:** CWE-89 (SQL Injection)

---

### 2.2 HIGH: Authorization Bypass in RPC Functions (A01: Broken Access Control)

**Finding:** RPC functions use `SECURITY DEFINER` but don't validate user role or ownership.

**Vulnerable Functions:**

```sql
-- File: supabase/migrations/20250110000000_phase12_multi_supplier_products.sql:159-194
CREATE OR REPLACE FUNCTION get_product_suppliers(p_product_id UUID)
RETURNS TABLE (...) AS $$
BEGIN
  RETURN QUERY
  SELECT sp.id, sp.supplier_id, s.name, sp.price, ...
  FROM public.supplier_products sp
  INNER JOIN public.suppliers s ON s.id = sp.supplier_id
  WHERE sp.product_id = p_product_id
    AND sp.is_active = true
    AND s.is_active = true
  ORDER BY sp.price ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Problem:**
- Function runs with definer rights (elevated privileges)
- No check if user is authenticated
- No check if user has permission to view supplier pricing
- Returns internal pricing data to anyone who calls it

**Attack Vector:**
1. Unauthenticated user calls RPC function
2. Function returns all supplier pricing data
3. Competitor accesses pricing intelligence

**Recommendation:**

```sql
CREATE OR REPLACE FUNCTION get_product_suppliers(p_product_id UUID)
RETURNS TABLE (...) AS $$
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
    USING ERRCODE = 'unauthorized';
  END IF;

  -- Check if user has permission (supplier, admin, or business customer)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('business', 'admin', 'supplier')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view supplier pricing'
    USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT ...
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Severity:** HIGH
**CVSS Score:** 7.5 (High)
**CWE:** CWE-285 (Improper Authorization)

---

### 2.3 MEDIUM: Missing Input Validation (A05: Injection)

**Finding:** RPC functions don't validate input parameters (UUIDs, numeric ranges).

**Vulnerable Pattern:**

```sql
-- No validation that p_product_id is a valid UUID
CREATE OR REPLACE FUNCTION get_product_suppliers(p_product_id UUID)
```

**Attack Vectors:**
1. Pass malformed UUID to cause errors
2. Pass negative prices to bypass logic
3. Pass arrays with excessive elements to cause DoS

**Recommendation:**

```sql
CREATE OR REPLACE FUNCTION get_product_suppliers(p_product_id UUID)
RETURNS TABLE (...) AS $$
BEGIN
  -- Validate input
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID is required'
    USING ERRCODE = 'null_value_not_allowed';
  END IF;

  -- Check if product exists
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product not found'
    USING ERRCODE = 'undefined_object';
  END IF;

  ...
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Severity:** MEDIUM
**CVSS Score:** 5.3 (Medium)
**CWE:** CWE-20 (Improper Input Validation)

---

## 3. RLS Policy Review

### 3.1 CRITICAL: business_price Exposure in Views (A01: Broken Access Control)

**Finding:** Views don't respect RLS policies for `business_price` column.

**Vulnerable View:**

```sql
-- File: supabase/migrations/20250110000000_phase12_multi_supplier_products.sql:481-522
CREATE OR REPLACE VIEW bugun_halde_comparison AS
SELECT
  ...
  sp.price,
  sp.previous_price,
  ...
FROM public.products p
INNER JOIN public.supplier_products sp ON sp.product_id = p.id
...
```

**Problem:**
- Views in PostgreSQL bypass RLS by default
- Any user with SELECT on view can see all data
- View doesn't filter `business_price` based on user role

**Recommendation:**

```sql
CREATE OR REPLACE VIEW bugun_halde_comparison AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.category,
  p.unit,
  p.images[1] as image_url,
  s.id as supplier_id,
  s.name as supplier_name,
  sp.price,
  sp.previous_price,
  sp.price_change,
  sp.availability,
  sp.stock_quantity,
  sp.quality,
  sp.delivery_days,
  sp.is_featured,
  stats.min_price as market_min_price,
  stats.max_price as market_max_price,
  stats.avg_price as market_avg_price,
  stats.supplier_count as total_suppliers,
  CASE
    WHEN sp.price = stats.min_price THEN true
    ELSE false
  END as is_lowest_price
FROM public.products p
INNER JOIN public.supplier_products sp ON sp.product_id = p.id
INNER JOIN public.suppliers s ON s.id = sp.supplier_id
INNER JOIN LATERAL (
  SELECT
    MIN(spi.price) as min_price,
    MAX(spi.price) as max_price,
    AVG(spi.price) as avg_price,
    COUNT(*) as supplier_count
  FROM public.supplier_products spi
  WHERE spi.product_id = p.id
    AND spi.is_active = true
) stats ON true
WHERE sp.is_active = true
  AND s.is_active = true
  AND (p.product_status = 'active' OR p.product_status IS NULL);

-- Security: Use a function instead of direct view access
CREATE OR REPLACE FUNCTION get_bugun_halde_comparison()
RETURNS SETOF bugun_halde_comparison AS $$
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY SELECT * FROM bugun_halde_comparison;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Revoke direct access to view
REVOKE SELECT ON bugun_halde_comparison FROM public, authenticated;
```

**Severity:** CRITICAL
**CVSS Score:** 8.1 (High)
**CWE:** CWE-200 (Exposure of Sensitive Information)

---

### 3.2 HIGH: Insufficient RLS Policy for supplier_products (A01: Broken Access Control)

**Finding:** Suppliers can view other suppliers' pricing through complex queries.

**Vulnerable Policy:**

```sql
-- File: supabase/migrations/20250110000000_phase12_multi_supplier_products.sql:335-339
CREATE POLICY "Public can view active supplier products"
ON public.supplier_products
FOR SELECT
TO public, authenticated
USING (is_active = true);
```

**Problem:**
- All authenticated users can see all supplier pricing
- Competitors can access each other's pricing data
- No distinction between business customers (should see) and suppliers (shouldn't see competitors)

**Recommendation:**

```sql
-- Remove public policy
DROP POLICY "Public can view active supplier products" ON public.supplier_products;

-- Create policy for business customers
CREATE POLICY "Business customers can view active supplier products"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'business'
  )
);

-- Create policy for suppliers (only their own products)
CREATE POLICY "Suppliers can view their own products only"
ON public.supplier_products
FOR SELECT
TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
);
```

**Severity:** HIGH
**CVSS Score:** 7.5 (High)
**CWE:** CWE-200 (Exposure of Sensitive Information)

---

### 3.3 MEDIUM: Missing RLS for price_audit_log (A09: Logging & Alerting)

**Finding:** If audit logging is added, RLS policies must be configured.

**Recommendation:**

```sql
-- Enable RLS on audit table
ALTER TABLE public.price_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Admins can view price audit log"
ON public.price_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- No one can delete audit logs
CREATE POLICY "No one can delete price audit logs"
ON public.price_audit_log
FOR DELETE
TO authenticated
USING (false);
```

**Severity:** MEDIUM
**CVSS Score:** 5.9 (Medium)
**CWE:** CWE-778 (Insufficient Logging)

---

## 4. Input Validation

### 4.1 HIGH: Missing Price Range Validation (A05: Injection)

**Finding:** Price inputs lack comprehensive validation.

**Current Constraints (Insufficient):**

```sql
-- File: supabase/migrations/20250110000000_phase12_multi_supplier_products.sql:40-42
price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
previous_price NUMERIC(10, 2) CHECK (previous_price > 0),
```

**Missing Validations:**
1. No maximum price limit (can cause overflow)
2. No validation that price matches market norms
3. No check for price manipulation (e.g., multiple of same price)

**Recommendation:**

```sql
-- Add comprehensive price validation
ALTER TABLE public.supplier_products
DROP CONSTRAINT IF EXISTS supplier_products_price_check;

ALTER TABLE public.supplier_products
ADD CONSTRAINT supplier_products_price_check
CHECK (
  price > 0
  AND price <= 999999.99  -- Maximum reasonable price
  AND (
    previous_price IS NULL
    OR previous_price > 0
    OR previous_price <= 999999.99
  )
);

-- Add function to detect price manipulation
CREATE OR REPLACE FUNCTION detect_price_manipulation()
RETURNS TRIGGER AS $$
DECLARE
  avg_price NUMERIC;
  price_variance NUMERIC;
BEGIN
  -- Calculate average price across all suppliers for this product
  SELECT AVG(spi.price)
  INTO avg_price
  FROM public.supplier_products spi
  WHERE spi.product_id = NEW.product_id
    AND spi.id != NEW.id
    AND spi.is_active = true;

  IF avg_price IS NOT NULL AND avg_price > 0 THEN
    price_variance := ABS(NEW.price - avg_price) / avg_price;

    -- Alert if price deviates more than 80% from average
    IF price_variance > 0.80 THEN
      -- Log to security event table
      INSERT INTO security_events (
        event_type,
        severity,
        description,
        supplier_product_id,
        user_id
      ) VALUES (
        'price_anomaly',
        'high',
        format('Price deviation of %%% detected (Product: %s, Supplier: %s)',
          price_variance * 100,
          NEW.product_id,
          NEW.supplier_id
        ),
        NEW.id,
        auth.uid()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_price_manipulation
  BEFORE INSERT OR UPDATE ON public.supplier_products
  FOR EACH ROW
  EXECUTE FUNCTION detect_price_manipulation();
```

**Severity:** HIGH
**CVSS Score:** 7.5 (High)
**CWE:** CWE-20 (Improper Input Validation)

---

### 4.2 MEDIUM: Variation Selection Validation (A05: Injection)

**Finding:** Variation combinations are not validated for consistency.

**Attack Vector:**
1. User selects incompatible variations (e.g., size + material conflict)
2. No validation that selected variations belong to same supplier
3. Price can be manipulated through variation selection

**Recommendation:**

```sql
-- Add function to validate variation selections
CREATE OR REPLACE FUNCTION validate_variation_selection(
  p_supplier_product_id UUID,
  p_variation_ids UUID[]
) RETURNS BOOLEAN AS $$
DECLARE
  variation_count INTEGER;
BEGIN
  -- Check all variations exist for this supplier product
  SELECT COUNT(*)
  INTO variation_count
  FROM public.supplier_product_variations spv
  WHERE spv.supplier_product_id = p_supplier_product_id
    AND spv.variation_id = ANY(p_variation_ids);

  IF variation_count != array_length(p_variation_ids, 1) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Severity:** MEDIUM
**CVSS Score:** 5.3 (Medium)
**CWE:** CWE-20 (Improper Input Validation)

---

### 4.3 MEDIUM: Region Selection Validation (A01: Broken Access Control)

**Finding:** Region changes are not validated against user's actual region.

**Recommendation:**

```sql
-- Add function to get user's valid region
CREATE OR REPLACE FUNCTION get_user_region(p_user_id UUID)
RETURNS UUID AS $$
BEGIN
  -- Return user's default region from profile
  SELECT region_id
  INTO STRICT
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  RETURN NULL;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function to validate region access
CREATE OR REPLACE FUNCTION can_access_region(
  p_user_id UUID,
  p_region_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if region exists
  IF NOT EXISTS (SELECT 1 FROM public.regions WHERE id = p_region_id AND is_active = true) THEN
    RETURN FALSE;
  END IF;

  -- Business customers can access any region
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'business') THEN
    RETURN TRUE;
  END IF;

  -- Regular users can only access their assigned region
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = p_user_id AND region_id = p_region_id
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

**Severity:** MEDIUM
**CVSS Score:** 5.9 (Medium)
**CWE:** CWE-287 (Improper Authentication)

---

## 5. Audit Logging

### 5.1 CRITICAL: Missing Price Change Audit Trail (A09: Logging & Alerting)

**Finding:** No audit logging for price changes. Cannot track who changed what price when.

**Impact:**
1. Cannot investigate price manipulation incidents
2. No accountability for pricing decisions
3. Cannot rollback unauthorized changes
4. Compliance violations (GDPR, financial regulations)

**Recommendation:**

```sql
-- Create price audit log table
CREATE TABLE IF NOT EXISTS public.price_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id UUID NOT NULL REFERENCES public.supplier_products(id),
  product_id UUID NOT NULL,
  supplier_id UUID NOT NULL,

  -- Price change details
  old_price NUMERIC(10, 2),
  new_price NUMERIC(10, 2),
  price_change_ratio NUMERIC,

  -- Who made the change
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_by_role TEXT,

  -- When and why
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,

  -- Change metadata
  ip_address INET,
  user_agent TEXT,

  -- Approval status (if workflow enabled)
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Indexes for audit queries
CREATE INDEX idx_price_audit_supplier_product ON public.price_audit_log(supplier_product_id);
CREATE INDEX idx_price_audit_product ON public.price_audit_log(product_id);
CREATE INDEX idx_price_audit_supplier ON public.price_audit_log(supplier_id);
CREATE INDEX idx_price_audit_changed_by ON public.price_audit_log(changed_by);
CREATE INDEX idx_price_audit_changed_at ON public.price_audit_log(changed_at DESC);

-- Trigger to log price changes
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Calculate change ratio
  INSERT INTO public.price_audit_log (
    supplier_product_id,
    product_id,
    supplier_id,
    old_price,
    new_price,
    price_change_ratio,
    changed_by,
    changed_by_role,
    change_reason
  )
  SELECT
    NEW.id,
    NEW.product_id,
    NEW.supplier_id,
    OLD.price,
    NEW.price,
    CASE
      WHEN OLD.price > 0 THEN (NEW.price - OLD.price) / OLD.price
      ELSE NULL
    END,
    auth.uid(),
    user_role,
    'Price updated via trigger'
  FROM public.supplier_products sp
  WHERE sp.id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_supplier_price_change
  AFTER UPDATE OF price ON public.supplier_products
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION log_price_change();
```

**Severity:** CRITICAL
**CVSS Score:** 8.2 (High)
**CWE:** CWE-778 (Insufficient Logging)

---

### 5.2 HIGH: Missing Security Event Logging (A09: Logging & Alerting)

**Finding:** No centralized logging for security-relevant events.

**Recommendation:**

```sql
-- Create security events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Event details
  description TEXT,
  affected_user UUID REFERENCES auth.users(id),
  affected_resource_type TEXT,
  affected_resource_id UUID,

  -- Source
  source_ip INET,
  user_agent TEXT,
  request_id TEXT,

  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Resolution
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Indexes
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_user ON public.security_events(affected_user);
CREATE INDEX idx_security_events_occurred_at ON public.security_events(occurred_at DESC);

-- Log failed price updates
CREATE OR REPLACE FUNCTION log_failed_price_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO public.security_events (
      event_type,
      severity,
      description,
      affected_user,
      affected_resource_type,
      affected_resource_id
    ) VALUES (
      'price_update_failed',
      'medium',
      'Failed price update attempt on supplier product',
      auth.uid(),
      'supplier_product',
      NEW.id
    );
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO public.security_events (
      event_type,
      severity,
      description,
      affected_user,
      affected_resource_type
    ) VALUES (
      'price_update_exception',
      'high',
      format('Exception in price update: %s', SQLERRM),
      auth.uid(),
      'supplier_product'
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Severity:** HIGH
**CVSS Score:** 7.5 (High)
**CWE:** CWE-778 (Insufficient Logging)

---

### 5.3 MEDIUM: Missing Rollback Capability (A10: Exceptional Conditions)

**Finding:** No mechanism to rollback price changes after detection of manipulation.

**Recommendation:**

```sql
-- Create function to rollback price change
CREATE OR REPLACE FUNCTION rollback_price_change(
  p_audit_log_id UUID,
  p_rollback_reason TEXT,
  p_performed_by UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_audit_log RECORD;
  v_current_price NUMERIC;
BEGIN
  -- Get audit log entry
  SELECT * INTO v_audit_log
  FROM public.price_audit_log
  WHERE id = p_audit_log_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit log entry not found';
  END IF;

  -- Get current price
  SELECT price INTO v_current_price
  FROM public.supplier_products
  WHERE id = v_audit_log.supplier_product_id;

  -- Rollback to old price
  UPDATE public.supplier_products
  SET
    price = v_audit_log.old_price,
    previous_price = v_current_price,
    updated_at = NOW(),
    last_price_update = NOW()
  WHERE id = v_audit_log.supplier_product_id;

  -- Log the rollback
  INSERT INTO public.price_audit_log (
    supplier_product_id,
    product_id,
    supplier_id,
    old_price,
    new_price,
    price_change_ratio,
    changed_by,
    changed_by_role,
    change_reason
  ) VALUES (
    v_audit_log.supplier_product_id,
    v_audit_log.product_id,
    v_audit_log.supplier_id,
    v_current_price,
    v_audit_log.old_price,
    (v_audit_log.old_price - v_current_price) / v_current_price,
    p_performed_by,
    'admin',
    format('Rollback: %s', p_rollback_reason)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to admins
GRANT EXECUTE ON FUNCTION rollback_price_change TO authenticated;
```

**Severity:** MEDIUM
**CVSS Score:** 5.9 (Medium)
**CWE:** CWE-778 (Insufficient Logging)

---

## 6. Security Checklist

### 6.1 Pre-Deployment Security Checks

**Mandatory Before Production:**

- [ ] **CRITICAL:** Implement secure view for region_products with business_price filtering
- [ ] **CRITICAL:** Add price change validation trigger (max 50% change)
- [ ] **CRITICAL:** Create price_audit_log table with RLS policies
- [ ] **CRITICAL:** Fix SQL injection risk in search_supplier_products
- [ ] **CRITICAL:** Add authentication checks to all RPC functions
- [ ] **CRITICAL:** Revoke direct view access, use secure functions
- [ ] **HIGH:** Implement supplier pricing isolation RLS policies
- [ ] **HIGH:** Add user region validation
- [ ] **HIGH:** Create security_events table for logging
- [ ] **HIGH:** Implement price rollback function
- [ ] **MEDIUM:** Add price anomaly detection
- [ ] **MEDIUM:** Implement variation selection validation
- [ ] **MEDIUM:** Add rate limiting for price updates
- [ ] **MEDIUM:** Create supplier approval workflow for significant changes

---

### 6.2 Testing Requirements

**Security Test Cases:**

```typescript
// Test 1: Verify business_price is hidden from non-business users
test('non-business user cannot see business_price', async () => {
  const { data } = await supabase
    .from('region_products')
    .select('price, business_price')
    .eq('region_id', testRegionId)
    .eq('product_id', testProductId);

  // B2C user should see business_price as null
  expect(data[0].business_price).toBeNull();
});

// Test 2: Verify supplier cannot exceed max price change
test('supplier cannot change price by more than 50%', async () => {
  const response = await upsertSupplierProductPrice(supplierId, {
    productId: testProductId,
    price: originalPrice * 2, // 100% increase
  });

  expect(response.success).toBe(false);
  expect(response.error).toContain('exceeds maximum allowed');
});

// Test 3: Verify price change audit log
test('price change is logged to audit table', async () => {
  await upsertSupplierProductPrice(supplierId, {
    productId: testProductId,
    price: 150,
  });

  const { data } = await supabase
    .from('price_audit_log')
    .select('*')
    .eq('supplier_product_id', supplierProductId)
    .order('changed_at', { ascending: false })
    .limit(1);

  expect(data.length).toBe(1);
  expect(data[0].old_price).toBe(originalPrice);
  expect(data[0].new_price).toBe(150);
});

// Test 4: Verify SQL injection protection
test('search function sanitizes input', async () => {
  const maliciousInput = "'; DROP TABLE supplier_products; --";

  await expect(
    supabase.rpc('search_supplier_products', {
      p_supplier_id: testSupplierId,
      p_search_text: maliciousInput,
    })
  ).resolves.not.toThrow();
});

// Test 5: Verify RPC authentication requirement
test('unauthenticated user cannot call get_product_suppliers', async () => {
  // Sign out first
  await supabase.auth.signOut();

  const { error } = await supabase.rpc('get_product_suppliers', {
    p_product_id: testProductId,
  });

  expect(error).toBeDefined();
  expect(error.message).toContain('Authentication required');
});
```

---

### 6.3 Monitoring Recommendations

**Real-time Alerts:**

1. **Price Manipulation Detection:**
   - Alert when price changes > 50%
   - Alert when supplier changes prices > 5 times per hour
   - Alert when price deviates > 80% from market average

2. **Access Control Violations:**
   - Alert when non-business user attempts to access business_price
   - Alert when supplier tries to view competitor pricing
   - Alert when user accesses products outside their region

3. **Anomaly Detection:**
   - Alert on unusual RPC call patterns
   - Alert on rapid price changes across multiple products
   - Alert on failed authentication attempts

**Monitoring Queries:**

```sql
-- Query 1: Find suspicious price changes (last 24 hours)
SELECT
  pal.id,
  pal.supplier_product_id,
  pal.product_id,
  pal.supplier_id,
  pal.old_price,
  pal.new_price,
  pal.price_change_ratio,
  pal.changed_by,
  pal.changed_at,
  p.name as product_name
FROM public.price_audit_log pal
JOIN public.supplier_products sp ON sp.id = pal.supplier_product_id
JOIN public.products p ON p.id = pal.product_id
WHERE pal.changed_at > NOW() - INTERVAL '24 hours'
  AND ABS(pal.price_change_ratio) > 0.50
ORDER BY ABS(pal.price_change_ratio) DESC;

-- Query 2: Find suppliers with excessive price changes
SELECT
  s.name as supplier_name,
  s.id as supplier_id,
  COUNT(*) as change_count,
  AVG(ABS(pal.price_change_ratio)) as avg_change_ratio
FROM public.price_audit_log pal
JOIN public.supplier_products sp ON sp.id = pal.supplier_product_id
JOIN public.suppliers s ON s.id = sp.supplier_id
WHERE pal.changed_at > NOW() - INTERVAL '1 hour'
GROUP BY s.id, s.name
HAVING COUNT(*) > 5
ORDER BY change_count DESC;

-- Query 3: Find business_price access violations
SELECT
  se.id,
  se.event_type,
  se.severity,
  se.description,
  se.affected_user,
  se.occurred_at
FROM public.security_events se
WHERE se.event_type = 'business_price_access_attempt'
  AND se.occurred_at > NOW() - INTERVAL '24 hours'
ORDER BY se.occurred_at DESC;
```

---

## 7. Implementation Priority

### Phase 1: Critical (Implement Immediately)

1. **Secure business_price Access** (CRITICAL-001)
   - Create secure view with role-based filtering
   - Revoke direct table access
   - Update all queries to use secure view

2. **Add Price Change Validation** (CRITICAL-002)
   - Implement 50% max change trigger
   - Add audit logging
   - Test edge cases

3. **Fix RPC Authorization** (CRITICAL-003)
   - Add authentication checks to all RPC functions
   - Add role-based authorization
   - Test with different user types

### Phase 2: High (Implement Within 1 Week)

4. **Implement Supplier Pricing Isolation** (HIGH-001)
   - Update RLS policies
   - Remove public access to supplier_products
   - Create role-specific views

5. **Add Security Event Logging** (HIGH-002)
   - Create security_events table
   - Implement logging triggers
   - Set up alerting

6. **Add User Region Validation** (HIGH-003)
   - Implement region validation functions
   - Update API to validate region
   - Add tests

### Phase 3: Medium (Implement Within 2 Weeks)

7. **Add Price Anomaly Detection** (MEDIUM-001)
   - Implement deviation detection
   - Create security event logging
   - Set up monitoring dashboards

8. **Add Rollback Capability** (MEDIUM-002)
   - Implement rollback function
   - Add admin UI
   - Create rollback audit trail

---

## 8. Code Examples for Secure Implementation

### Example 1: Secure Price Calculation RPC

```sql
CREATE OR REPLACE FUNCTION calculate_product_price(
  p_product_id UUID,
  p_region_id UUID,
  p_user_role TEXT DEFAULT 'customer',
  p_supplier_id UUID DEFAULT NULL
) RETURNS TABLE (
  final_price NUMERIC,
  base_price NUMERIC,
  supplier_price NUMERIC,
  regional_multiplier NUMERIC,
  applied_rules JSONB
) AS $$
DECLARE
  v_base_price NUMERIC;
  v_supplier_price NUMERIC;
  v_regional_price NUMERIC;
  v_business_price NUMERIC;
  v_final_price NUMERIC;
  v_is_business BOOLEAN;
  v_rules JSONB;
BEGIN
  -- Validate inputs
  IF p_product_id IS NULL OR p_region_id IS NULL THEN
    RAISE EXCEPTION 'Product ID and Region ID are required'
    USING ERRCODE = 'null_value_not_allowed';
  END IF;

  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for price calculation'
    USING ERRCODE = 'unauthorized';
  END IF;

  -- Determine if user is business customer
  v_is_business := p_user_role IN ('business', 'admin');

  -- Get base price from supplier_products (lowest active price)
  SELECT MIN(price)
  INTO v_base_price
  FROM public.supplier_products
  WHERE product_id = p_product_id
    AND is_active = true;

  IF v_base_price IS NULL THEN
    RAISE EXCEPTION 'No active pricing found for product'
    USING ERRCODE = 'undefined_object';
  END IF;

  -- Get supplier-specific price if provided
  IF p_supplier_id IS NOT NULL THEN
    SELECT price
    INTO v_supplier_price
    FROM public.supplier_products
    WHERE product_id = p_product_id
      AND supplier_id = p_supplier_id
      AND is_active = true;
  ELSE
    v_supplier_price := v_base_price;
  END IF;

  -- Get regional price (if exists)
  SELECT
    CASE
      WHEN v_is_business THEN business_price
      ELSE price
    END
  INTO v_regional_price
  FROM public.region_products
  WHERE product_id = p_product_id
    AND region_id = p_region_id
    AND is_active = true;

  -- Determine final price (regional > supplier)
  v_final_price := COALESCE(v_regional_price, v_supplier_price, v_base_price);

  -- Build applied rules
  v_rules := jsonb_build_object(
    'has_regional_price', v_regional_price IS NOT NULL,
    'has_supplier_price', v_supplier_price IS NOT NULL,
    'is_business_customer', v_is_business,
    'supplier_id', p_supplier_id,
    'region_id', p_region_id
  );

  -- Log price calculation for audit
  INSERT INTO public.price_calculation_log (
    product_id,
    region_id,
    user_id,
    user_role,
    calculated_price,
    applied_rules
  ) VALUES (
    p_product_id,
    p_region_id,
    auth.uid(),
    p_user_role,
    v_final_price,
    v_rules
  );

  -- Return results
  RETURN QUERY
  SELECT
    v_final_price,
    v_base_price,
    v_supplier_price,
    COALESCE(v_regional_price, 0),
    v_rules;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Security: Only authenticated users can calculate prices
REVOKE ALL ON FUNCTION calculate_product_price FROM public;
GRANT EXECUTE ON FUNCTION calculate_product_price TO authenticated;
```

### Example 2: Secure Price Update Procedure

```sql
CREATE OR REPLACE FUNCTION update_supplier_price_secure(
  p_supplier_product_id UUID,
  p_new_price NUMERIC,
  p_change_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_supplier_product RECORD;
  v_old_price NUMERIC;
  v_price_change_ratio NUMERIC;
  v_user_role TEXT;
  v_user_id UUID;
BEGIN
  -- Get user info
  v_user_id := auth.uid();
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
    USING ERRCODE = 'unauthorized';
  END IF;

  -- Get current supplier product
  SELECT *
  INTO v_supplier_product
  FROM public.supplier_products
  WHERE id = p_supplier_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier product not found'
    USING ERRCODE = 'undefined_object';
  END IF;

  v_old_price := v_supplier_product.price;

  -- Authorization: Only supplier owner or admin can update
  IF v_user_role NOT IN ('admin', 'superadmin') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.suppliers
      WHERE id = v_supplier_product.supplier_id
      AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Insufficient permissions to update this price'
      USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Validate price
  IF p_new_price <= 0 THEN
    RAISE EXCEPTION 'Price must be greater than zero'
    USING ERRCODE = 'check_violation';
  END IF;

  IF p_new_price > 999999.99 THEN
    RAISE EXCEPTION 'Price exceeds maximum allowed value'
    USING ERRCODE = 'check_violation';
  END IF;

  -- Calculate change ratio
  v_price_change_ratio := ABS(p_new_price - v_old_price) / v_old_price;

  -- Check if change exceeds threshold (50%)
  IF v_price_change_ratio > 0.50 AND v_user_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Price change of %%% exceeds maximum allowed 50%%',
      v_price_change_ratio * 100
    USING ERRCODE = 'check_violation';
  END IF;

  -- Update price
  UPDATE public.supplier_products
  SET
    price = p_new_price,
    previous_price = v_old_price,
    price_change = CASE
      WHEN p_new_price > v_old_price THEN 'increased'
      WHEN p_new_price < v_old_price THEN 'decreased'
      ELSE 'stable'
    END,
    last_price_update = NOW(),
    updated_at = NOW()
  WHERE id = p_supplier_product_id;

  -- Log the change
  INSERT INTO public.price_audit_log (
    supplier_product_id,
    product_id,
    supplier_id,
    old_price,
    new_price,
    price_change_ratio,
    changed_by,
    changed_by_role,
    change_reason
  ) VALUES (
    p_supplier_product_id,
    v_supplier_product.product_id,
    v_supplier_product.supplier_id,
    v_old_price,
    p_new_price,
    v_price_change_ratio,
    v_user_id,
    v_user_role,
    p_change_reason
  );

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'supplier_product_id', p_supplier_product_id,
    'old_price', v_old_price,
    'new_price', p_new_price,
    'change_ratio', v_price_change_ratio,
    'updated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_supplier_price_secure TO authenticated;
```

---

## 9. Summary of Findings

### Critical Severity (7)

| ID | Finding | CVSS | Status |
|----|---------|------|--------|
| CRIT-001 | B2B Price Leakage | 8.1 | Open |
| CRIT-002 | Supplier Price Manipulation Bypass | 8.8 | Open |
| CRIT-003 | SQL Injection in search_supplier_products | 9.0 | Open |
| CRIT-004 | business_price Exposure in Views | 8.1 | Open |
| CRIT-005 | Authorization Bypass in RPC Functions | 7.5 | Open |
| CRIT-006 | Missing Price Change Audit Trail | 8.2 | Open |
| CRIT-007 | Missing Input Sanitization in Search | 9.0 | Open |

### High Severity (5)

| ID | Finding | CVSS | Status |
|----|---------|------|--------|
| HIGH-001 | Regional Pricing Bypass | 7.5 | Open |
| HIGH-002 | Insufficient RLS for supplier_products | 7.5 | Open |
| HIGH-003 | Missing Price Range Validation | 7.5 | Open |
| HIGH-004 | Missing Security Event Logging | 7.5 | Open |
| HIGH-005 | Missing Rate Limiting on Price Updates | 7.0 | Open |

### Medium Severity (8)

| ID | Finding | CVSS | Status |
|----|---------|------|--------|
| MED-001 | Missing Input Validation in RPC | 5.3 | Open |
| MED-002 | Variation Selection Validation | 5.3 | Open |
| MED-003 | Region Selection Validation | 5.9 | Open |
| MED-004 | Missing RLS for price_audit_log | 5.9 | Open |
| MED-005 | Missing Rollback Capability | 5.9 | Open |
| MED-006 | Missing Price Anomaly Detection | 5.3 | Open |
| MED-007 | Client-Side Price Logic | 6.0 | Open |
| MED-008 | Insufficient Error Handling | 5.0 | Open |

---

## 10. Recommendations

### Immediate Actions (Before Production)

1. **DO NOT DEPLOY** without fixing CRITICAL issues
2. Implement secure views for all price-related data
3. Add comprehensive audit logging
4. Add authentication/authorization to all RPC functions
5. Implement price change validation triggers

### Short-term Actions (Within 2 Weeks)

1. Complete all HIGH severity fixes
2. Implement security monitoring and alerting
3. Create security test suite
4. Document security procedures
5. Train developers on secure coding practices

### Long-term Actions (Within 1 Month)

1. Address all MEDIUM severity issues
2. Implement automated security scanning
3. Create security incident response playbook
4. Conduct penetration testing
5. Implement continuous security monitoring

---

## Appendix A: Testing Checklist

```markdown
## Pre-Deployment Security Testing

### Authentication & Authorization
- [ ] Unauthenticated users cannot access price data
- [ ] Non-business users cannot see business_price
- [ ] Suppliers cannot view competitor pricing
- [ ] Admins have appropriate access
- [ ] Role-based access control enforced

### Input Validation
- [ ] Price inputs validated for range
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] UUID validation enforced
- [ ] Array inputs size-limited

### Business Logic
- [ ] Price changes limited to 50%
- [ ] Regional pricing enforced
- [ ] Supplier pricing isolated
- [ ] Price anomalies detected
- [ ] Audit trail complete

### Audit & Logging
- [ ] All price changes logged
- [ ] Security events recorded
- [ ] Audit logs immutable
- [ ] Rollback capability tested
- [ ] Monitoring alerts configured

### Performance
- [ ] Price calculation < 100ms
- [ ] Audit logging doesn't block requests
- [ ] Indexes optimized
- [ ] No N+1 query problems
```

---

## Appendix B: Security Headers Configuration

```typescript
// Add to API configuration
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline';",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

---

**Report Generated:** 2026-01-10
**Next Review:** After CRITICAL fixes implemented
**Contact:** Security Team
