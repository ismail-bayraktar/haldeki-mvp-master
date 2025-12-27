import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface ShippingAddress {
  title?: string;
  fullAddress: string;
  phone: string;
  instructions?: string;
}

export interface DealerOrder {
  id: string;
  user_id: string | null;
  region_id: string | null;
  region_name?: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  notes: string | null;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
  // Yeni alanlar
  dealer_id: string | null;
  payment_status: string;
  payment_notes: string | null;
  estimated_delivery_time: string | null;
  delivery_notes: string | null;
  delivery_photo_url: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

export const useDealerOrders = (regionIds: string[]) => {
  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
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
        items: Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : [],
        shipping_address: order.shipping_address as ShippingAddress | null,
        payment_status: order.payment_status || 'unpaid',
      }));

      setOrders(ordersWithRegion);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [regionIds.join(',')]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (
    orderId: string, 
    newStatus: OrderStatus,
    additionalData?: {
      cancellationReason?: string;
      deliveryNotes?: string;
      deliveryPhotoUrl?: string;
    }
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Duruma göre ek alanları set et
      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmed_by = userId;
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        if (additionalData?.deliveryNotes) {
          updateData.delivery_notes = additionalData.deliveryNotes;
        }
        if (additionalData?.deliveryPhotoUrl) {
          updateData.delivery_photo_url = additionalData.deliveryPhotoUrl;
        }
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = userId;
        if (additionalData?.cancellationReason) {
          updateData.cancellation_reason = additionalData.cancellationReason;
        }
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      const statusMessages: Record<OrderStatus, string> = {
        pending: 'Sipariş beklemeye alındı',
        confirmed: 'Sipariş onaylandı',
        preparing: 'Sipariş hazırlanıyor',
        shipped: 'Sipariş yola çıktı',
        delivered: 'Sipariş teslim edildi',
        cancelled: 'Sipariş iptal edildi',
      };

      toast.success(statusMessages[newStatus]);
      await fetchOrders();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Durum güncellenirken hata: ' + message);
      return false;
    }
  };

  // Ödeme durumunu güncelle
  const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentNotes?: string
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      };

      if (paymentNotes !== undefined) {
        updateData.payment_notes = paymentNotes;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      const statusMessages: Record<PaymentStatus, string> = {
        unpaid: 'Ödenmedi olarak işaretlendi',
        paid: 'Ödendi olarak işaretlendi',
        partial: 'Kısmi ödeme olarak işaretlendi',
      };

      toast.success(statusMessages[paymentStatus]);
      await fetchOrders();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Ödeme durumu güncellenirken hata: ' + message);
      return false;
    }
  };

  // Tahmini teslimat saatini güncelle
  const updateEstimatedDelivery = async (
    orderId: string,
    estimatedTime: Date
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          estimated_delivery_time: estimatedTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Tahmini teslimat saati güncellendi');
      await fetchOrders();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Güncelleme hatası: ' + message);
      return false;
    }
  };

  // Teslimat fotoğrafı yükle
  const uploadDeliveryPhoto = async (
    orderId: string,
    file: File
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const filePath = `delivery-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Fotoğraf yüklenirken hata: ' + message);
      return null;
    }
  };

  // Sipariş istatistikleri
  const getOrderStats = () => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    const unpaid = orders.filter(o => o.payment_status === 'unpaid' && o.status !== 'cancelled').length;
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      pending,
      confirmed,
      preparing,
      shipped,
      delivered,
      cancelled,
      unpaid,
      totalRevenue,
      total: orders.length,
    };
  };

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateEstimatedDelivery,
    uploadDeliveryPhoto,
    getOrderStats,
  };
};
