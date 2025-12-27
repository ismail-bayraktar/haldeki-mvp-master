import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierOrderItem {
  orderId: string;
  orderDate: string;
  orderStatus: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  regionName: string;
}

export interface PrepListItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  unit: string;
  orderCount: number;
  orders: {
    orderId: string;
    quantity: number;
    regionName: string;
    status: string;
  }[];
}

export const useSupplierOrders = (supplierId: string | null) => {
  const [prepList, setPrepList] = useState<PrepListItem[]>([]);
  const [allItems, setAllItems] = useState<SupplierOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplierOrders = useCallback(async () => {
    if (!supplierId) {
      setPrepList([]);
      setAllItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Tedarikçinin ürünlerini al
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, unit')
        .eq('supplier_id', supplierId);

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setPrepList([]);
        setAllItems([]);
        setIsLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);
      const productMap = new Map(products.map(p => [p.id, p]));

      // Aktif siparişleri al (son 7 gün)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, items, status, created_at, region_id')
        .in('status', ['pending', 'confirmed', 'preparing'])
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Bölge isimlerini al
      const regionIds = [...new Set((orders || []).map(o => o.region_id).filter(Boolean))] as string[];
      const { data: regions } = await supabase
        .from('regions')
        .select('id, name')
        .in('id', regionIds);

      const regionMap = new Map((regions || []).map(r => [r.id, r.name]));

      // Tedarikçinin ürünlerini içeren sipariş öğelerini çıkar
      const items: SupplierOrderItem[] = [];
      const productAggregation = new Map<string, PrepListItem>();

      (orders || []).forEach(order => {
        const orderItems = Array.isArray(order.items) ? (order.items as unknown as {
          productId: string;
          productName: string;
          quantity: number;
          unit: string;
        }[]) : [];

        orderItems.forEach(item => {
          if (productIds.includes(item.productId)) {
            const product = productMap.get(item.productId);
            const regionName = order.region_id ? regionMap.get(order.region_id) || 'Bilinmiyor' : 'Bilinmiyor';

            items.push({
              orderId: order.id,
              orderDate: order.created_at,
              orderStatus: order.status,
              productId: item.productId,
              productName: item.productName || product?.name || 'Bilinmeyen Ürün',
              quantity: item.quantity,
              unit: item.unit || product?.unit || 'kg',
              regionName,
            });

            // Ürün bazlı toplama
            const existing = productAggregation.get(item.productId);
            if (existing) {
              existing.totalQuantity += item.quantity;
              existing.orderCount += 1;
              existing.orders.push({
                orderId: order.id,
                quantity: item.quantity,
                regionName,
                status: order.status,
              });
            } else {
              productAggregation.set(item.productId, {
                productId: item.productId,
                productName: item.productName || product?.name || 'Bilinmeyen Ürün',
                totalQuantity: item.quantity,
                unit: item.unit || product?.unit || 'kg',
                orderCount: 1,
                orders: [{
                  orderId: order.id,
                  quantity: item.quantity,
                  regionName,
                  status: order.status,
                }],
              });
            }
          }
        });
      });

      setAllItems(items);
      setPrepList(Array.from(productAggregation.values()).sort((a, b) => b.totalQuantity - a.totalQuantity));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchSupplierOrders();
  }, [fetchSupplierOrders]);

  // Bugün hazırlanacaklar
  const todayPrepList = prepList.filter(item => {
    return item.orders.some(o => {
      const orderDate = allItems.find(i => i.orderId === o.orderId)?.orderDate;
      if (!orderDate) return false;
      const today = new Date();
      const orderDay = new Date(orderDate);
      return orderDay.toDateString() === today.toDateString();
    });
  });

  // İstatistikler
  const stats = {
    totalProducts: prepList.length,
    totalQuantity: prepList.reduce((sum, item) => sum + item.totalQuantity, 0),
    totalOrders: new Set(allItems.map(i => i.orderId)).size,
    pendingOrders: new Set(allItems.filter(i => i.orderStatus === 'pending').map(i => i.orderId)).size,
  };

  return {
    prepList,
    todayPrepList,
    allItems,
    isLoading,
    error,
    stats,
    refetch: fetchSupplierOrders,
  };
};

