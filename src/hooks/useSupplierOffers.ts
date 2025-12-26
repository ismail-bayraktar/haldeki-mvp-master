import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SupplierOffer {
  id: string;
  supplier_id: string;
  product_id: string;
  offered_price: number;
  offered_quantity: number;
  unit: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    unit: string;
  };
}

interface CreateOfferData {
  supplier_id: string;
  product_id: string;
  offered_price: number;
  offered_quantity: number;
  unit: string;
  notes?: string;
}

export const useSupplierOffers = (supplierId?: string) => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    if (!supplierId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('supplier_offers')
        .select(`
          *,
          product:products(id, name, unit)
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const typedOffers: SupplierOffer[] = (data || []).map(offer => ({
        ...offer,
        status: offer.status as 'pending' | 'approved' | 'rejected'
      }));
      setOffers(typedOffers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createOffer = async (data: CreateOfferData) => {
    try {
      const { error: insertError } = await supabase
        .from('supplier_offers')
        .insert(data);

      if (insertError) throw insertError;
      
      toast.success('Teklif başarıyla oluşturuldu');
      await fetchOffers();
      return true;
    } catch (err: any) {
      toast.error(`Teklif oluşturulamadı: ${err.message}`);
      return false;
    }
  };

  const deleteOffer = async (offerId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('supplier_offers')
        .delete()
        .eq('id', offerId);

      if (deleteError) throw deleteError;
      
      toast.success('Teklif silindi');
      await fetchOffers();
      return true;
    } catch (err: any) {
      toast.error(`Teklif silinemedi: ${err.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [supplierId]);

  return {
    offers,
    isLoading,
    error,
    createOffer,
    deleteOffer,
    refetch: fetchOffers
  };
};
