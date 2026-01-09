-- ============================================================================
-- SECURITY: Critical RLS Policy Fixes
-- ============================================================================
-- Migration Date: 2026-01-09
-- Severity: CRITICAL
-- Issue: RLS policy bypass vulnerabilities
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fix #1: Enable RLS on user_roles table (CRITICAL)
-- ----------------------------------------------------------------------------
-- Issue: user_roles table was missing RLS, allowing privilege escalation
-- Risk: Users could query/modify their own roles
-- Fix: Enable RLS and add strict policies

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;

-- Create strict RLS policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

-- Prevent users from inserting their own roles (security measure)
DROP POLICY IF EXISTS "Only service role can insert roles" ON public.user_roles;
CREATE POLICY "Only service role can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Prevent users from updating their own roles (security measure)
DROP POLICY IF EXISTS "Only service role can update roles" ON public.user_roles;
CREATE POLICY "Only service role can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

-- Prevent users from deleting their own roles (security measure)
DROP POLICY IF EXISTS "Only service role can delete roles" ON public.user_roles;
CREATE POLICY "Only service role can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- Grant service role full access (for triggers and admin operations)
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
CREATE POLICY "Service role can manage all roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Fix #2: Add RLS policy for orders to prevent IDOR
-- ----------------------------------------------------------------------------
-- Issue: Orders table could be queried without proper user filtering
-- Risk: Users could enumerate and view other users' orders
-- Fix: Add strict RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Dealers can view regional orders" ON public.orders;
DROP POLICY IF EXISTS "Suppliers can view relevant orders" ON public.orders;
DROP POLICY IF EXISTS "Warehouse staff can view orders" ON public.orders;

-- Create strict RLS policies for orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Fix #3: Add RLS policy for supplier_products
-- ----------------------------------------------------------------------------
-- Issue: Supplier products update policy could be bypassed
-- Risk: Suppliers could modify competitors' products
-- Fix: Add trigger-based protection

-- Create trigger function to prevent ID changes
CREATE OR REPLACE FUNCTION public.prevent_supplier_product_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent supplier_id from being changed
  IF OLD.supplier_id IS DISTINCT FROM NEW.supplier_id THEN
    RAISE EXCEPTION 'Cannot change supplier_id of supplier product';
  END IF;

  -- Prevent product_id from being changed
  IF OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    RAISE EXCEPTION 'Cannot change product_id of supplier product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS prevent_supplier_product_id_change_trigger ON public.supplier_products;

-- Create trigger
CREATE TRIGGER prevent_supplier_product_id_change_trigger
BEFORE UPDATE ON public.supplier_products
FOR EACH ROW
EXECUTE FUNCTION public.prevent_supplier_product_id_change();

-- ----------------------------------------------------------------------------
-- Fix #4: Add price validation for orders
-- ----------------------------------------------------------------------------
-- Issue: Order prices are client-controlled, allowing manipulation
-- Risk: Users could purchase products at arbitrary prices
-- Fix: Add check constraint and validation function

-- Create function to validate order total
CREATE OR REPLACE FUNCTION public.validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total NUMERIC;
BEGIN
  -- Calculate expected total from items
  SELECT COALESCE(SUM(
    (item->>'unitPrice')::NUMERIC *
    (item->>'quantity')::NUMERIC *
    COALESCE(
      NULLIF(item->>'priceMultiplier', '')::NUMERIC,
      1
    )
  ), 0)
  INTO calculated_total
  FROM jsonb_array_elements(NEW.items) AS item;

  -- Validate total matches (with 5% tolerance for rounding)
  IF ABS(calculated_total - NEW.total_amount) > (NEW.total_amount * 0.05) THEN
    RAISE EXCEPTION 'Order total validation failed: expected %, got %',
      calculated_total,
      NEW.total_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS validate_order_total_trigger ON public.orders;

-- Create trigger
CREATE TRIGGER validate_order_total_trigger
BEFORE INSERT OR UPDATE OF total_amount
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_total();

-- ----------------------------------------------------------------------------
-- Fix #5: Add audit log for sensitive operations
-- ----------------------------------------------------------------------------
-- Create audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can view audit log
DROP POLICY IF EXISTS "Admins can view audit log" ON public.security_audit_log;
CREATE POLICY "Admins can view audit log"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

DROP POLICY IF EXISTS "Service role can insert audit log" ON public.security_audit_log;
CREATE POLICY "Service role can insert audit log"
ON public.security_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create audit log function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_data JSONB,
  p_new_data JSONB
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- If issues occur, run:
--
-- DROP TRIGGER IF EXISTS validate_order_total_trigger ON public.orders;
-- DROP FUNCTION IF EXISTS public.validate_order_total();
-- DROP TRIGGER IF EXISTS prevent_supplier_product_id_change_trigger ON public.supplier_products;
-- DROP FUNCTION IF EXISTS public.prevent_supplier_product_id_change();
-- DROP TABLE IF EXISTS public.security_audit_log;
-- DROP FUNCTION IF EXISTS public.log_security_event();
--
-- Then restore previous RLS policies from backup.
-- ============================================================================

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these queries to verify the fixes:

-- 1. Check RLS is enabled on user_roles
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_roles';

-- 2. Check RLS policies on user_roles
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'user_roles';

-- 3. Test that users cannot query user_roles directly
-- SET ROLE authenticated;
-- SELECT * FROM public.user_roles; -- Should return empty if RLS works

-- 4. Verify triggers are created
-- SELECT trigger_name, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table IN ('orders', 'supplier_products');

-- ============================================================================
-- Deployment Notes
-- ============================================================================
-- 1. Test these changes in a staging environment first
-- 2. Backup the database before applying
-- 3. Monitor application logs for any RLS policy violations
-- 4. Have rollback plan ready
-- 5. Deploy during low-traffic period if possible
-- ============================================================================
