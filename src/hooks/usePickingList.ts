/**
 * Picking List Hook
 * Phase 11 - Warehouse MVP
 *
 * RPC çağrır: warehouse_get_picking_list(p_window_start, p_window_end)
 * Aggregated ürün listesi (FIYAT YOK)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PickingListItem {
  product_id: string;
  product_name: string;
  total_quantity_kg: number;
  order_count: number;
}

/**
 * Hook: Toplama listesini getirir (aggregated, kg cinsinden)
 * RPC: warehouse_get_picking_list
 * Sadece confirmed/preparing/prepared durumundaki siparişleri içerir
 */
export function usePickingList(window: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['picking-list', window.start.toISOString(), window.end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('warehouse_get_picking_list', {
        p_window_start: window.start.toISOString(),
        p_window_end: window.end.toISOString(),
      });

      if (error) throw error;
      return (data || []) as PickingListItem[];
    },
    staleTime: 30 * 1000, // 30 saniye cache
    refetchInterval: 60 * 1000, // Her dakika otomatik yenile
  });
}

/**
 * Hook: Toplama listesi özeti
 */
export function usePickingListSummary(window: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['picking-list-summary', window.start.toISOString(), window.end.toISOString()],
    queryFn: async () => {
      const { data } = await supabase.rpc('warehouse_get_picking_list', {
        p_window_start: window.start.toISOString(),
        p_window_end: window.end.toISOString(),
      });

      const items = (data || []) as PickingListItem[];

      const totalProducts = items.length;
      const totalKg = items.reduce((sum, item) => sum + (item.total_quantity_kg || 0), 0);
      const totalOrders = items.reduce((sum, item) => sum + (item.order_count || 0), 0);

      return {
        totalProducts,
        totalKg,
        totalOrders,
      };
    },
    staleTime: 30 * 1000,
  });
}
