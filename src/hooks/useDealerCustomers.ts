import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DealerCustomer {
  id: string;
  dealer_id: string;
  business_name: string;
  contact_name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  district: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  business_name: string;
  contact_name?: string;
  phone: string;
  email?: string;
  address?: string;
  district?: string;
  notes?: string;
}

export interface UpdateCustomerData {
  business_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  notes?: string;
  is_active?: boolean;
}

export const useDealerCustomers = (dealerId: string | null) => {
  const [customers, setCustomers] = useState<DealerCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!dealerId) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('dealer_customers')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCustomers(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(message);
      toast.error('Müşteriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [dealerId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Yeni müşteri ekle
  const createCustomer = async (data: CreateCustomerData): Promise<boolean> => {
    if (!dealerId) {
      toast.error('Bayi bilgisi bulunamadı');
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('dealer_customers')
        .insert({
          dealer_id: dealerId,
          business_name: data.business_name,
          contact_name: data.contact_name || null,
          phone: data.phone,
          email: data.email || null,
          address: data.address || null,
          district: data.district || null,
          notes: data.notes || null,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast.error('Bu telefon numarası zaten kayıtlı');
        } else {
          throw insertError;
        }
        return false;
      }

      toast.success('Müşteri başarıyla eklendi');
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Müşteri eklenirken hata: ' + message);
      return false;
    }
  };

  // Müşteri güncelle
  const updateCustomer = async (
    customerId: string,
    data: UpdateCustomerData
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('dealer_customers')
        .update(updateData)
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast.success('Müşteri bilgileri güncellendi');
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Güncelleme hatası: ' + message);
      return false;
    }
  };

  // Müşteri sil (soft delete - is_active = false)
  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('dealer_customers')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (deleteError) throw deleteError;

      toast.success('Müşteri pasifleştirildi');
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Silme hatası: ' + message);
      return false;
    }
  };

  // Müşteri aktifleştir
  const activateCustomer = async (customerId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('dealer_customers')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      toast.success('Müşteri aktifleştirildi');
      await fetchCustomers();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error('Aktifleştirme hatası: ' + message);
      return false;
    }
  };

  // Aktif müşteriler
  const activeCustomers = customers.filter(c => c.is_active);
  
  // Pasif müşteriler
  const inactiveCustomers = customers.filter(c => !c.is_active);

  return {
    customers,
    activeCustomers,
    inactiveCustomers,
    isLoading,
    error,
    refetch: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    activateCustomer,
  };
};

