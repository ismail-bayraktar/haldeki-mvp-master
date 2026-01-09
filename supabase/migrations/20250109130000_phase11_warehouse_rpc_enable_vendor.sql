-- Phase 11: Warehouse MVP - Enable Vendor Filtering in RPC
-- Date: 2025-01-09
-- Purpose: Update RPC functions to use vendor_id filtering after column is added
-- Prerequisite: 20250109120000_phase11_warehouse_fixes.sql must be run first

-- ============================================
-- FUNCTION: warehouse_get_orders (ENABLE VENDOR FILTERING)
-- ============================================

CREATE OR REPLACE FUNCTION public.warehouse_get_orders(
  p_window_start TIMESTAMPTZ,
  p_window_end TIMESTAMPTZ
)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status TEXT,
  placed_at TIMESTAMPTZ,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address JSONB,
  items JSONB
) SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_staff RECORD;
BEGIN
  -- Validate warehouse staff + vendor/warehouse scope
  SELECT ws.vendor_id, ws.warehouse_id INTO v_staff
  FROM public.warehouse_staff ws
  WHERE ws.user_id = auth.uid() AND ws.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: User is not active warehouse staff';
  END IF;

  -- Return orders with prices masked + vendor filtering
  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.status,
    o.placed_at,
    COALESCE(o.customer_name, pr.full_name) AS customer_name,
    COALESCE(o.customer_phone, pr.phone) AS customer_phone,
    COALESCE(o.delivery_address, o.shipping_address) AS delivery_address,
    -- Items WITHOUT prices (only quantities)
    (
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'product_id', (oi.item->>'product_id')::UUID,
          'product_name', p.name,
          'quantity', (oi.item->>'quantity')::NUMERIC,
          'unit', oi.item->>'unit',
          'quantity_kg',
            CASE
              WHEN p.unit = 'kg' THEN (oi.item->>'quantity')::NUMERIC
              WHEN p.unit = 'adet' THEN (oi.item->>'quantity')::NUMERIC * COALESCE(p.conversion_factor, 1.0)
              ELSE (oi.item->>'quantity')::NUMERIC * COALESCE(p.conversion_factor, 1.0)
            END
        )
      )
      FROM jsonb_array_elements(o.items) AS oi(item)
      LEFT JOIN public.products p ON p.id = (oi.item->>'product_id')::UUID
    ) AS items
  FROM public.orders o
  LEFT JOIN public.profiles pr ON o.user_id = pr.id
  WHERE o.placed_at >= p_window_start
    AND o.placed_at < p_window_end
    AND o.status IN ('pending', 'confirmed', 'preparing', 'prepared')
    AND o.vendor_id = v_staff.vendor_id  -- VENDOR FILTERING ENABLED
  ORDER BY o.placed_at DESC;
END;
$$;

-- ============================================
-- FUNCTION: warehouse_get_picking_list (ENABLE VENDOR FILTERING)
-- ============================================

CREATE OR REPLACE FUNCTION public.warehouse_get_picking_list(
  p_window_start TIMESTAMPTZ,
  p_window_end TIMESTAMPTZ
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  total_quantity_kg NUMERIC,
  order_count BIGINT
) SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_staff RECORD;
BEGIN
  -- Validate warehouse staff
  SELECT ws.vendor_id, ws.warehouse_id INTO v_staff
  FROM public.warehouse_staff ws
  WHERE ws.user_id = auth.uid() AND ws.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized: User is not active warehouse staff';
  END IF;

  -- Return aggregated picking list with vendor filtering
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    SUM(
      CASE
        WHEN p.unit = 'kg' THEN (oi.item->>'quantity')::NUMERIC
        WHEN p.unit = 'adet' THEN (oi.item->>'quantity')::NUMERIC * COALESCE(p.conversion_factor, 1.0)
        ELSE (oi.item->>'quantity')::NUMERIC * COALESCE(p.conversion_factor, 1.0)
      END
    ) AS total_quantity_kg,
    COUNT(DISTINCT o.id) AS order_count
  FROM public.orders o
  CROSS JOIN jsonb_array_elements(o.items) AS oi(item)
  LEFT JOIN public.products p ON p.id = (oi.item->>'product_id')::UUID
  WHERE o.placed_at >= p_window_start
    AND o.placed_at < p_window_end
    AND o.status IN ('confirmed', 'preparing', 'prepared')  -- Confirmed+ only (not pending)
    AND o.vendor_id = v_staff.vendor_id  -- VENDOR FILTERING ENABLED
  GROUP BY p.id, p.name
  ORDER BY p.name;
END;
$$;

-- ============================================
-- FUNCTION: warehouse_mark_prepared (ADD VENDOR CHECK)
-- ============================================

CREATE OR REPLACE FUNCTION public.warehouse_mark_prepared(p_order_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_staff RECORD;
  v_order RECORD;
BEGIN
  -- Validate warehouse staff + vendor/warehouse scope
  SELECT ws.vendor_id, ws.warehouse_id INTO v_staff
  FROM public.warehouse_staff ws
  WHERE ws.user_id = auth.uid() AND ws.is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Unauthorized: User is not active warehouse staff';
    RETURN;
  END IF;

  -- Check order exists, is in valid status, and belongs to staff's vendor
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND status IN ('confirmed', 'preparing')
    AND vendor_id = v_staff.vendor_id;  -- VENDOR CHECK ADDED

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Order not found, invalid status transition, or unauthorized vendor';
    RETURN;
  END IF;

  -- Update ONLY status field (price immutable by design)
  UPDATE public.orders
  SET status = 'prepared',
      prepared_at = NOW()
  WHERE id = p_order_id;

  RETURN QUERY SELECT TRUE, 'Order marked as prepared';
END;
$$;

-- ============================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.warehouse_get_orders TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_get_picking_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.warehouse_mark_prepared TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ warehouse_get_orders updated: vendor_id filtering ENABLED';
  RAISE NOTICE '✅ warehouse_get_picking_list updated: vendor_id filtering ENABLED';
  RAISE NOTICE '✅ warehouse_mark_prepared updated: vendor_id check ENABLED';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RPC functions now enforce multi-vendor security';
  RAISE NOTICE 'Warehouse staff can ONLY access their vendor orders';
  RAISE NOTICE '===========================================';
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION public.warehouse_get_orders IS 'Returns orders for warehouse with prices masked + vendor filtering (P0 security)';
COMMENT ON FUNCTION public.warehouse_get_picking_list IS 'Returns aggregated picking list with vendor filtering (no prices)';
COMMENT ON FUNCTION public.warehouse_mark_prepared IS 'Marks order as prepared with vendor check (P0 security)';
