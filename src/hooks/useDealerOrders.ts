import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface DealerOrder {
  id: string;
  user_id: string | null;
  region_id: string | null;
  region_name?: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  notes: string | null;
  shipping_address: any;
  created_at: string;
  updated_at: string;
}

export const useDealerOrders = (regionIds: string[]) => {
  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!regionIds.length) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch orders for assigned regions
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('region_id', regionIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch region names
      const { data: regionsData } = await supabase
        .from('regions')
        .select('id, name')
        .in('id', regionIds);

      const regionMap = new Map(regionsData?.map(r => [r.id, r.name]) || []);

      const ordersWithRegion: DealerOrder[] = (ordersData || []).map(order => ({
        ...order,
        region_name: order.region_id ? regionMap.get(order.region_id) : undefined,
        items: Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : []
      }));

      setOrders(ordersWithRegion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [regionIds.join(',')]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders
  };
};
