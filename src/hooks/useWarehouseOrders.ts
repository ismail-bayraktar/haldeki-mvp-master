/**
 * Warehouse Orders Hook
 * Phase 11 - Warehouse MVP
 *
 * RPC çağrır: warehouse_get_orders(p_window_start, p_window_end)
 * FİYAT YOK - P0 security
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WarehouseOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  quantity_kg: number;
  // NOT: price, unit_price, total_price fields
}

export interface WarehouseOrder {
  id: string;
  order_number: string;
  status: string;
  placed_at: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: Record<string, unknown> | null;
  items: WarehouseOrderItem[];
}

/**
 * Hook: Depo siparişlerini zaman penceresine göre getirir
 * RPC: warehouse_get_orders (FİYAT MASKELEME)
 */
export function useWarehouseOrders(window: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['warehouse-orders', window.start.toISOString(), window.end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('warehouse_get_orders', {
        p_window_start: window.start.toISOString(),
        p_window_end: window.end.toISOString(),
      });

      if (error) throw error;
      return (data || []) as WarehouseOrder[];
    },
    staleTime: 30 * 1000, // 30 saniye cache
    refetchInterval: 60 * 1000, // Her dakika otomatik yenile
  });
}

/**
 * Hook: Siparişi "hazırlandı" olarak işaretler
 * RPC: warehouse_mark_prepared (SECURITY DEFINER)
 */
export function useMarkPrepared() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('warehouse_mark_prepared', {
        p_order_id: orderId,
      });

      if (error) throw error;

      // RPC returns TABLE(success BOOLEAN, message TEXT)
      const result = data as unknown as { success: boolean; message: string }[];
      if (result && result.length > 0 && !result[0].success) {
        throw new Error(result[0].message);
      }

      return orderId;
    },
    onSuccess: (orderId) => {
      toast.success('Sipariş hazırlandı olarak işaretlendi');
      queryClient.invalidateQueries({ queryKey: ['warehouse-orders'] });
    },
    onError: (error: Error) => {
      toast.error('Hata: ' + error.message);
    },
  });
}

/**
 * Hook: Sipariş istatistikleri
 */
export function useWarehouseStats(window: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['warehouse-stats', window.start.toISOString(), window.end.toISOString()],
    queryFn: async () => {
      const { data } = await supabase.rpc('warehouse_get_orders', {
        p_window_start: window.start.toISOString(),
        p_window_end: window.end.toISOString(),
      });

      const orders = (data || []) as WarehouseOrder[];

      const pending = orders.filter(o => o.status === 'pending').length;
      const confirmed = orders.filter(o => o.status === 'confirmed').length;
      const preparing = orders.filter(o => o.status === 'preparing').length;
      const prepared = orders.filter(o => o.status === 'prepared').length;

      return {
        pending,
        confirmed,
        preparing,
        prepared,
        total: orders.length,
      };
    },
    staleTime: 30 * 1000,
  });
}
