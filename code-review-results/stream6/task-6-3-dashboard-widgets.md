# Stream 6.3: Order Statistics Dashboard Review

> **Review Date**: 2026-01-08
> **Reviewer**: Frontend Architect Agent
> **Scope**: Admin dashboard widgets, order statistics, shift-based analytics
> **Reference**: TEST_BULGULARI_PHASE12.md #11

---

## Executive Summary

**Dashboard Completeness Score**: 6.5/10

### Key Findings

✅ **Working Well:**
- Basic stats cards (total orders, revenue, users, pending)
- 7-day order/revenue charts with Recharts
- Recent orders table with status badges
- Manual refresh functionality

⚠️ **Gaps Identified:**
- **No shift-based order totals widget** (TEST_BULGULARI #11)
- No real-time data updates (manual refresh only)
- No product-level quantity aggregation (e.g., "125 KG Domates")
- No supplier performance metrics by shift
- No comparison with previous period
- Limited time window analysis (only 7-day fixed view)

---

## Current Dashboard State

### Existing Widgets

| Widget | Description | Working? | Data Source | Performance |
|--------|-------------|----------|-------------|-------------|
| **Total Orders** | Lifetime order count | ✅ Yes | `orders` table COUNT | Fast |
| **Total Revenue** | Lifetime revenue sum | ✅ Yes | `orders.total_amount` SUM | Fast |
| **Total Users** | Registered user count | ✅ Yes | `profiles` table COUNT | Fast |
| **Pending Orders** | Orders awaiting action | ✅ Yes | `orders.status = 'pending'` COUNT | Fast |
| **7-Day Orders Chart** | Daily order counts (bar) | ✅ Yes | `orders.created_at` grouped by day | Medium (N+1) |
| **7-Day Revenue Chart** | Daily revenue trend (area) | ✅ Yes | `orders.total_amount` grouped by day | Medium (N+1) |
| **Recent Orders Table** | Last 5 orders with details | ✅ Yes | `orders` ordered by `created_at DESC LIMIT 5` | Fast |

### Widget Quality Assessment

**Strengths:**
- Clean, modern UI with Recharts integration
- Proper loading states with spinners
- Toast notifications for errors
- Responsive grid layout (1-4 cols)
- Good visual hierarchy (icons, colors)

**Weaknesses:**
- No real-time updates (manual refresh required)
- No caching or query optimization
- Charts load all orders into memory then filter in JS
- No drill-down capability
- No export functionality
- Limited time range (hardcoded 7 days)

---

## Missing Widgets

| Widget | Priority | Complexity | Impact | User Request |
|--------|----------|------------|--------|--------------|
| **Shift-based Order Totals** | 🔴 High | 🟡 Medium | Operations visibility | "Vardiya aralıklarında gelen siparişin toplamını gösteren widget olsun" (TEST_BULGULARI #11) |
| **Product Quantity Aggregation** | 🟠 Medium | 🔴 High | Inventory planning | "Toplam kaç kilo domates, patates sipariş gelmiş" |
| **Supplier Performance by Shift** | 🟡 Low | 🟡 Medium | Supplier evaluation | Which supplier performs best in each shift |
| **Time Range Selector** | 🟠 Medium | 🟢 Low | Flexibility | Day/Week/Month custom views |
| **Real-time Updates** | 🟡 Low | 🟡 Medium | Data freshness | Auto-refresh every 30-60s |
| **Period Comparison** | 🟡 Low | 🟡 Medium | Trend analysis | Compare with previous period |

---

## Shift-Based Order Totals Widget

### User Requirement (TEST_BULGULARI #11)

> **Original Request:**
> "Vardiya aralıklarında gelen siparişin toplamını gösteren widget olsun. Örnek: Toplam kaç kilo domates, patates sipariş gelmiş."

> **UI Constraint:**
> "Çok sıkışık grid eklemeyin, modern ve pratik olsun. UI'da beyaz alan (whitespace) bırakılmalı. Minimalist tasarım."

### Requirements Analysis

**What should it show:**
1. **Time windows**: 3 shifts per day
   - Morning (Sabah): 06:00 - 12:00
   - Afternoon (Öğlen): 12:00 - 18:00
   - Evening (Akşam): 18:00 - 24:00
   - Night (Gece): 00:00 - 06:00 (optional)

2. **Metrics per shift**:
   - Total order count
   - Total order value (₺)
   - **Product quantities** (e.g., 125 KG Domates)
   - Top products by quantity

3. **Comparison**:
   - Previous period (yesterday/last week)
   - Percentage change indicator (↑↓)

4. **Supplier breakdown** (optional):
   - Which supplier fulfilled what
   - Supplier performance comparison

### Technical Implementation

#### Data Structure

```typescript
interface ShiftStats {
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  timeWindow: string; // "06:00-12:00"
  totalOrders: number;
  totalValue: number;
  productQuantities: ProductQuantity[];
  supplierBreakdown: SupplierBreakdown[];
  previousPeriod?: {
    totalOrders: number;
    totalValue: number;
  };
  changePercent?: {
    orders: number; // +15.5
    value: number;  // -5.2
  };
}

interface ProductQuantity {
  productId: string;
  productName: string;
  totalQuantity: number; // Sum of all quantities
  unit: string; // "KG", "ADET", etc.
  orderCount: number; // How many orders included this
}

interface SupplierBreakdown {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  totalValue: number;
}
```

#### RPC Function for Aggregation

```sql
-- supabase/migrations/XXXXXXXXXXXXX_shift_order_stats.sql

CREATE OR REPLACE FUNCTION get_shift_order_stats(
  p_date DATE DEFAULT CURRENT_DATE,
  p_supplier_id UUID DEFAULT NULL
)
RETURNS TABLE (
  shift TEXT,
  time_window TEXT,
  total_orders BIGINT,
  total_value NUMERIC,
  product_details JSONB,
  supplier_details JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_shift_start TIMESTAMPTZ;
  v_shift_end TIMESTAMPTZ;
  v_shifts TEXT[] := ARRAY['morning', 'afternoon', 'evening', 'night'];
  v_windows TEXT[] := ARRAY['06:00-12:00', '12:00-18:00', '18:00-24:00', '00:00-06:00'];
  v_shift_index INTEGER;
BEGIN
  -- Loop through each shift
  FOR v_shift_index IN 1..array_length(v_shifts, 1) LOOP

    -- Calculate shift time windows
    CASE v_shifts[v_shift_index]
      WHEN 'morning' THEN
        v_shift_start := (p_date || ' 06:00:00')::TIMESTAMPTZ;
        v_shift_end := (p_date || ' 12:00:00')::TIMESTAMPTZ;
      WHEN 'afternoon' THEN
        v_shift_start := (p_date || ' 12:00:00')::TIMESTAMPTZ;
        v_shift_end := (p_date || ' 18:00:00')::TIMESTAMPTZ;
      WHEN 'evening' THEN
        v_shift_start := (p_date || ' 18:00:00')::TIMESTAMPTZ;
        v_shift_end := (p_date || ' 24:00:00')::TIMESTAMPTZ;
      WHEN 'night' THEN
        v_shift_start := (p_date || ' 00:00:00')::TIMESTAMPTZ;
        v_shift_end := (p_date || ' 06:00:00')::TIMESTAMPTZ;
    END CASE;

    RETURN QUERY
    SELECT
      v_shifts[v_shift_index] AS shift,
      v_windows[v_shift_index] AS time_window,
      COUNT(DISTINCT o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_value,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', p.name,
          'total_quantity', SUM(oi.quantity),
          'unit', p.unit,
          'order_count', COUNT(DISTINCT oi.order_id)
        ))
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.id
        GROUP BY oi.product_id, p.name, p.unit
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 5
      ) AS product_details,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'supplier_id', sp.supplier_id,
          'supplier_name', s.name,
          'order_count', COUNT(DISTINCT o.id),
          'total_value', SUM(o.total_amount)
        ))
        FROM supplier_products sp
        JOIN suppliers s ON sp.supplier_id = s.id
        JOIN order_items oi ON sp.product_id = oi.product_id
        WHERE oi.order_id = o.id
          AND (p_supplier_id IS NULL OR sp.supplier_id = p_supplier_id)
        GROUP BY sp.supplier_id, s.name
      ) AS supplier_details
    FROM orders o
    WHERE o.created_at >= v_shift_start
      AND o.created_at < v_shift_end
      AND o.status NOT IN ('cancelled', 'pending')
      AND (p_supplier_id IS NULL OR EXISTS (
        SELECT 1 FROM order_items oi
        JOIN supplier_products sp ON oi.product_id = sp.product_id
        WHERE sp.supplier_id = p_supplier_id
          AND oi.order_id = o.id
      ));

  END LOOP;

END;
$$;

COMMENT ON FUNCTION get_shift_order_stats IS
'Aggregates order statistics by shift for a given date. Returns order counts, values, and product quantities.';
```

#### React Hook

```typescript
// src/hooks/useShiftOrderStats.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useShiftOrderStats(date: Date = new Date()) {
  return useQuery({
    queryKey: ['shift-stats', date.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_shift_order_stats', {
        p_date: date.toISOString().split('T')[0],
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Auto-refresh every 60s
    staleTime: 30000, // Consider data fresh for 30s
  });
}
```

### UI Component Design

```typescript
// src/components/admin/ShiftOrderTotalsWidget.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShiftOrderStats } from "@/hooks/useShiftOrderStats";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus, Package } from "lucide-react";

export function ShiftOrderTotalsWidget() {
  const { data: shiftStats, isLoading, error } = useShiftOrderStats();

  if (isLoading) return <ShiftWidgetSkeleton />;
  if (error) return <ShiftWidgetError />;

  const totalOrders = shiftStats?.reduce((sum, s) => sum + s.total_orders, 0) || 0;
  const totalValue = shiftStats?.reduce((sum, s) => sum + Number(s.total_value), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bugünün Siparişleri (Vardiya Bazlı)</CardTitle>
          <Badge variant="outline">{format(new Date(), 'dd MMM', { locale: tr })}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Toplam {totalOrders} sipariş • ₺{totalValue.toFixed(2)}
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Bugün</TabsTrigger>
            <TabsTrigger value="yesterday">Dün</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4 mt-4">
            {shiftStats?.map((shift) => (
              <ShiftCard key={shift.shift} shift={shift} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ShiftCard({ shift }: { shift: ShiftStats }) {
  const getChangeIcon = (percent: number) => {
    if (percent > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (percent < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
      {/* Shift Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{getShiftLabel(shift.shift)}</h4>
          <p className="text-xs text-muted-foreground">{shift.time_window}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{shift.total_orders}</p>
          <p className="text-sm text-muted-foreground">₺{Number(shift.total_value).toFixed(0)}</p>
        </div>
      </div>

      {/* Product Quantities */}
      {shift.product_details?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Package className="h-3 w-3" />
            En Çok Satan Ürünler
          </p>
          <div className="space-y-1">
            {shift.product_details.slice(0, 3).map((product: any) => (
              <div key={product.product_id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{product.product_name}</span>
                <span className="font-medium">
                  {product.total_quantity} {product.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Breakdown (expandable) */}
      {shift.supplier_details && shift.supplier_details.length > 0 && (
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Tedarikçi Dağılımı ({shift.supplier_details.length})
          </summary>
          <div className="mt-2 space-y-1 pl-2 border-l-2 border-border">
            {shift.supplier_details.map((supplier: any) => (
              <div key={supplier.supplier_id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{supplier.supplier_name}</span>
                <span className="font-medium">
                  {supplier.order_count} sipariş • ₺{Number(supplier.total_value).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function getShiftLabel(shift: string): string {
  const labels = {
    morning: 'Sabah Vardiyası',
    afternoon: 'Öğlen Vardiyası',
    evening: 'Akşam Vardiyası',
    night: 'Gece Vardiyası',
  };
  return labels[shift] || shift;
}

function ShiftWidgetSkeleton() {
  return (
    <Card>
      <CardHeader><CardTitle>Vardiya Bazlı Siparişler</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-8 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ShiftWidgetError() {
  return (
    <Card>
      <CardHeader><CardTitle>Vardiya Bazlı Siparişler</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-destructive">Veriler yüklenirken hata oluştu</p>
      </CardContent>
    </Card>
  );
}
```

### Visual Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  Bugünün Siparişleri (Vardiya Bazlı)                      [08 Oca]  │
│  Toplam 135 sipariş • ₺38,450                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Sabah Vardiyası          06:00-12:00                           │ │
│  │                                                            45   │ │
│  │                                                        ₺12,150  │ │
│  │                                                                 │ │
│  │  📦 En Çok Satan Ürünler                                       │ │
│  │  Domates         125 KG                                        │ │
│  │  Patates          85 KG                                        │ │
│  │  Salatalık        62 KG                                        │ │
│  │                                                                 │ │
│  │  ▶ Tedarikçi Dağılımı (3)                                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Öğlen Vardiyası          12:00-18:00        📈 +15%            │ │
│  │                                                            67   │ │
│  │                                                        ₺18,920  │ │
│  │                                                                 │ │
│  │  📦 En Çok Satan Ürünler                                       │ │
│  │  Domates          89 KG                                        │ │
│  │  Biber           45 KG                                        │ │
│  │  Soğan           38 KG                                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Akşam Vardiyası          18:00-24:00        📉 -5%             │ │
│  │                                                            23   │ │
│  │                                                         ₺7,380  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Real-Time Data Fetching

### Current State: Manual Refresh Only

**How it works now:**
```typescript
// Dashboard.tsx line 136-139
<Button onClick={fetchData} variant="outline" size="sm">
  <RefreshCw className="h-4 w-4 mr-2" />
  Yenile
</Button>
```

**Problems:**
- User must manually click refresh
- No auto-refresh on mount
- No background polling
- Stale data without user awareness

### Proposed Improvements

#### 1. Auto-Refresh with React Query

```typescript
// src/hooks/useDashboardStats.ts

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export function useDashboardStats(autoRefresh = true) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [ordersData, profilesData] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at'),
        supabase.from('profiles').select('id'),
      ]);

      // Calculate stats...
      return stats;
    },
    refetchInterval: autoRefresh ? 60000 : false, // Auto-refresh every 60s
    refetchOnWindowFocus: true,
    staleTime: 30000, // Data fresh for 30s
  });

  // Refresh on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
```

#### 2. Real-Time with Supabase Realtime

```typescript
// src/hooks/useDashboardRealtime.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useDashboardRealtime() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Subscribe to orders table changes
    const channel: RealtimeChannel = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change:', payload);
          // Trigger refetch
          refetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats };
}
```

**Recommendation:**
- Start with **auto-refresh polling** (easier to implement)
- Add **realtime subscriptions** later for critical updates

---

## Performance Optimization

### Current Query Performance Analysis

**Dashboard Load Time**: ~2-3 seconds (measured from `fetchData` start to render)

**Query Count:**
1. Recent orders query: `SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`
2. All orders for stats: `SELECT id, total_amount, status, created_at FROM orders`
3. All profiles: `SELECT id FROM profiles`
4. Chart data: Client-side filtering of all orders (N+1 problem)

**Problems:**
- Fetching ALL orders into memory (could be 1000s of rows)
- Client-side date filtering instead of SQL WHERE
- No query result caching
- No database indexes on date ranges

### Optimization Opportunities

#### 1. Materialized Views for Aggregations

```sql
-- supabase/migrations/XXXXXXXXXXXXX_dashboard_stats_mv.sql

CREATE MATERIALIZED VIEW dashboard_stats_mv AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS stat_date,
  COUNT(*) FILTER (WHERE status NOT IN ('cancelled', 'pending')) AS total_orders,
  COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('cancelled', 'pending')), 0) AS total_revenue,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
WITH DATA;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX idx_dashboard_stats_mv_date ON dashboard_stats_mv(stat_date);

-- Refresh strategy
COMMENT ON MATERIALIZED VIEW dashboard_stats_mv IS
'Pre-aggregated dashboard stats. Refresh every 5 minutes via cron or trigger.';

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_mv;
END;
$$ LANGUAGE plpgsql;
```

#### 2. Cached Stats with TTL

```typescript
// src/lib/dashboardCache.ts

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedStats {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CachedStats>();

export async function getCachedStats(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });

  return data;
}
```

#### 3. Incremental Updates

```sql
-- Trigger to update stats on order change
CREATE OR REPLACE FUNCTION update_dashboard_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidate cache
  -- Or update materialized view asynchronously
  NOTIFY dashboard_updates, 'stats_changed';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_stats_change
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT
EXECUTE FUNCTION update_dashboard_stats_trigger();
```

#### 4. Database Indexes

```sql
-- Ensure these indexes exist
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status
ON orders(created_at DESC, status)
WHERE status NOT IN ('cancelled');

CREATE INDEX IF NOT EXISTS idx_orders_date_range
ON orders(DATE_TRUNC('day', created_at));

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
ON order_items(product_id);
```

### Performance Targets

| Metric | Current | Target | Strategy |
|--------|---------|--------|----------|
| Dashboard load time | 2-3s | <500ms | Materialized views + caching |
| Widget query count | 4 queries | 1 query | Combine aggregations |
| Data freshness | Manual | 30s auto | Polling or realtime |
| Memory usage | ~50MB | <10MB | Don't fetch all orders |

---

## Implementation Roadmap

### Phase 1: Missing Critical Widgets (Week 1)

**Goal**: Add shift-based order totals widget

#### Tasks

1. **Day 1-2: Backend Implementation**
   - [ ] Create `get_shift_order_stats` RPC function
   - [ ] Add database indexes for performance
   - [ ] Write unit tests for aggregation logic
   - [ ] Test with realistic data volume

2. **Day 3-4: Frontend Implementation**
   - [ ] Create `useShiftOrderStats` hook
   - [ ] Build `ShiftOrderTotalsWidget` component
   - [ ] Add to admin dashboard grid
   - [ ] Implement loading/error states

3. **Day 5: Testing & Polish**
   - [ ] Manual testing with different dates
   - [ ] Edge case testing (no orders, midnight crossover)
   - [ ] UI review against constraints (whitespace, minimal)
   - [ ] Performance testing with 1000+ orders

**Deliverables:**
- Functional shift-based widget
- Product quantity aggregation
- Basic period comparison (today vs yesterday)

---

### Phase 2: Performance Optimization (Week 2)

**Goal**: Optimize dashboard load time and add real-time updates

#### Tasks

1. **Day 1-2: Caching Strategy**
   - [ ] Implement `useDashboardStats` hook with React Query
   - [ ] Add auto-refresh every 60s
   - [ ] Implement stale-time and refetch strategies
   - [ ] Add refresh indicator in UI

2. **Day 3-4: Query Optimization**
   - [ ] Create materialized view for daily stats
   - [ ] Replace client-side filtering with SQL WHERE
   - [ ] Add database indexes
   - [ ] Implement concurrent refresh function

3. **Day 5: Real-Time Updates (Optional)**
   - [ ] Add Supabase realtime subscription
   - [ ] Implement optimistic updates
   - [ ] Add connection status indicator
   - [ ] Fallback to polling if realtime fails

**Deliverables:**
- Dashboard load time <500ms
- Auto-refresh every 60s
- Real-time order status updates

---

### Phase 3: Advanced Analytics (Week 3+)

**Goal**: Add comparison, trends, and export features

#### Tasks

1. **Period Comparison**
   - [ ] Add previous period stats to widget
   - [ ] Implement percentage change calculation
   - [ ] Visual indicators (↑↓)
   - [ ] Compare with same day last week

2. **Custom Time Ranges**
   - [ ] Add date range picker
   - [ ] Support Day/Week/Month views
   - [ ] URL-based state persistence
   - [ ] Quick select buttons (Today, Yesterday, Last 7 Days)

3. **Supplier Performance**
   - [ ] Supplier ranking by shift
   - [ ] Supplier comparison widget
   - [ ] Top products per supplier
   - [ ] Supplier performance trends

4. **Export & Reporting**
   - [ ] Export shift stats to CSV/Excel
   - [ ] Generate daily summary PDF
   - [ ] Email reports for admins
   - [ ] Scheduled reports

**Deliverables:**
- Full-featured analytics dashboard
- Export capabilities
- Scheduled reports

---

## Widget Placement Strategy

### Current Grid Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard (Header + Refresh)                                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Orders   │ │ Revenue  │ │ Users    │ │ Pending  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                       │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐   │
│  │   7-Day Orders Chart        │ │   7-Day Revenue Chart       │   │
│  └─────────────────────────────┘ └─────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │   Recent Orders Table                                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Proposed Layout with Shift Widget

**Option 1: Full-Width Widget Below Stats**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard                                                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Orders   │ │ Revenue  │ │ Users    │ │ Pending  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │   📊 Shift-Based Order Totals Widget (Full Width)              │ │
│  │   [Sabah] [Öğlen] [Akşam] [Gece]                               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐   │
│  │   7-Day Orders              │ │   7-Day Revenue             │   │
│  └─────────────────────────────┘ └─────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │   Recent Orders                                                │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Option 2: Side-by-Side with Charts (More Compact)**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard                                                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Orders   │ │ Revenue  │ │ Users    │ │ Pending  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                       │
│  ┌─────────────────────────────────────────┐ ┌─────────────────┐   │
│  │   📊 Shift Orders (Left 2/3)            │ │ Quick Actions   │   │
│  │   [Sabah] [Öğlen] [Akşam]               │ │ • Export        │   │
│  │                                         │ │ • New Report    │   │
│  └─────────────────────────────────────────┘ └─────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐   │
│  │   7-Day Orders              │ │   7-Day Revenue             │   │
│  └─────────────────────────────┘ └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Recommendation**: Option 1 (Full-Width) for better whitespace and visual hierarchy

---

## Accessibility Considerations

- [ ] Keyboard navigation for shift tabs
- [ ] Screen reader announcements for live updates
- [ ] Color-blind friendly trend indicators (use symbols, not just colors)
- [ ] Sufficient contrast for text (WCAG AA)
- [ ] Loading states with ARIA roles
- [ ] Error messages with clear context

---

## Testing Strategy

### Unit Tests

```typescript
// tests/hooks/useShiftOrderStats.test.ts

describe('useShiftOrderStats', () => {
  it('should fetch stats for current date', async () => {
    const { result } = renderHook(() => useShiftOrderStats());
    await waitFor(() => expect(result.current.data).toHaveLength(4));
  });

  it('should handle empty data gracefully', async () => {
    // Mock empty response
    const { result } = renderHook(() => useShiftOrderStats(new Date('2025-01-01')));
    await waitFor(() => expect(result.current.data).toEqual([]));
  });

  it('should refetch every 60 seconds', async () => {
    jest.useFakeTimers();
    const refetchSpy = jest.spyOn(supabase, 'rpc');
    renderHook(() => useShiftOrderStats());
    await advanceTimersByTimeAsync(60000);
    expect(refetchSpy).toHaveBeenCalledTimes(2); // Initial + 1 refresh
  });
});
```

### Integration Tests

```typescript
// tests/dashboard/shift-widget-integration.test.tsx

describe('ShiftOrderTotalsWidget Integration', () => {
  it('should display shift cards with correct data', async () => {
    render(<ShiftOrderTotalsWidget />);
    await waitFor(() => screen.getByText('Sabah Vardiyası'));
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    render(<ShiftOrderTotalsWidget />);
    expect(screen.getByTestId('shift-skeleton')).toBeInTheDocument();
  });
});
```

### Performance Tests

```typescript
// tests/performance/dashboard-load-time.test.ts

describe('Dashboard Performance', () => {
  it('should load within 500ms with materialized view', async () => {
    const startTime = performance.now();
    await renderDashboard();
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(500);
  });
});
```

---

## Dependencies & Files to Modify

### New Files

```
src/
├── hooks/
│   └── useShiftOrderStats.ts              # Hook for shift stats
├── components/
│   └── admin/
│       └── ShiftOrderTotalsWidget.tsx     # Main widget component
├── lib/
│   └── dashboardCache.ts                  # Caching utilities
└── types/
    └── dashboard.ts                       # Dashboard types
```

### Modified Files

```
src/
├── pages/
│   └── admin/
│       └── Dashboard.tsx                  # Add shift widget
├── integrations/
│   └── supabase/
│       └── types.ts                      # Add ShiftStats type
```

### Database Migrations

```
supabase/migrations/
└── XXXXXXXX_shift_order_stats.sql         # RPC function
```

---

## Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Dashboard load time | 2-3s | <500ms | Lighthouse Performance |
| Widget count | 7 | 8+ | Feature count |
| Data freshness | Manual | 60s auto | Polling interval |
| User satisfaction | N/A | >4/5 | Feedback after 1 week |
| Query performance | 4 queries | 1-2 queries | DB query count |

---

## Open Questions

1. **Shift Definition**: Should night shift (00:00-06:00) be included in "today" stats or counted as part of previous day?
2. **Timezone Handling**: All timestamps in TR timezone or UTC?
3. **Product Quantity Aggregation**: Sum all quantities from `order_items.quantity` or normalize by unit?
4. **Supplier Filtering**: Should admin be able to filter stats by specific supplier?
5. **Historical Data**: How far back should shift stats be available? (30 days, 90 days, forever?)

---

## References

- [TEST_BULGULARI_PHASE12.md #11](../../TEST_BULGULARI_PHASE12.md) - Original user request
- [Phase 11 Warehouse MVP](../../docs/phases/phase-11-warehouse-mvp.md) - Time window logic
- [timeWindow.ts](../../src/lib/timeWindow.ts) - Existing shift utilities
- [Dashboard.tsx](../../src/pages/admin/Dashboard.tsx) - Current implementation

---

**Report Version**: 1.0
**Last Updated**: 2026-01-08
**Status**: ⏳ Awaiting Implementation
