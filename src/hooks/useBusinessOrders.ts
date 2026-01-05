import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Re-export types from useDealerOrders for consistency
export type { OrderItem, ShippingAddress } from '@/hooks/useDealerOrders';

export interface BusinessOrder {
  id: string;
  user_id: string | null;
  region_id: string | null;
  region_name?: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
  estimated_delivery_time: string | null;
  delivery_notes: string | null;
  delivery_photo_url: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  payment_method: string | null;
  notes: string | null;
}

export interface OrderStats {
  active: number;
  pending: number;
  completed: number;
  totalSpent: number;
}

interface UseBusinessOrdersReturn {
  orders: BusinessOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getOrderStats: () => OrderStats;
}

export const useBusinessOrders = (): UseBusinessOrdersReturn => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch orders for current business user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get unique region IDs from orders
      const regionIds = (ordersData || [])
        .map(o => o.region_id)
        .filter((id): id is string => id !== null);

      // Fetch region names for display
      let regionMap = new Map<string, string>();
      if (regionIds.length > 0) {
        const uniqueRegionIds = [...new Set(regionIds)];
        const { data: regionsData } = await supabase
          .from('regions')
          .select('id, name')
          .in('id', uniqueRegionIds);

        regionMap = new Map(regionsData?.map(r => [r.id, r.name]) || []);
      }

      const ordersWithRegion: BusinessOrder[] = (ordersData || []).map(order => ({
        ...order,
        region_name: order.region_id ? regionMap.get(order.region_id) : undefined,
        items: Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : [],
        shipping_address: order.shipping_address as ShippingAddress | null,
      }));

      setOrders(ordersWithRegion);
    } catch (err) {
      console.error('Error fetching business orders:', err);
      setError('Siparişler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getOrderStats = useCallback((): OrderStats => {
    const active = orders.filter(o =>
      !['delivered', 'cancelled'].includes(o.status)
    ).length;

    const pending = orders.filter(o => o.status === 'pending').length;

    const completed = orders.filter(o => o.status === 'delivered').length;

    const totalSpent = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      active,
      pending,
      completed,
      totalSpent,
    };
  }, [orders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    getOrderStats,
  };
};
