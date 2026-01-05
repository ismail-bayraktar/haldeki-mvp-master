import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmailService } from './useEmailService';

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
  supplier?: { id: string; name: string };
  product?: { id: string; name: string; unit: string; price: number };
}

export const useAdminOffers = () => {
  const [offers, setOffers] = useState<SupplierOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sendOfferStatusNotification } = useEmailService();

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('supplier_offers')
        .select(`
          *,
          supplier:suppliers(id, name),
          product:products(id, name, unit, price)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const typedOffers: SupplierOffer[] = (data || []).map(offer => ({
        ...offer,
        status: offer.status as 'pending' | 'approved' | 'rejected'
      }));
      setOffers(typedOffers);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOfferStatus = async (offerId: string, status: 'approved' | 'rejected') => {
    try {
      // Önce teklif bilgilerini al (email için)
      const offer = offers.find(o => o.id === offerId);
      
      const { error: updateError } = await supabase
        .from('supplier_offers')
        .update({ status })
        .eq('id', offerId);

      if (updateError) throw updateError;
      
      // Email bildirimi gönder
      if (offer?.supplier && offer?.product) {
        // Tedarikçi email adresini al
        const { data: supplierData } = await supabase
          .from('suppliers')
          .select('contact_email')
          .eq('id', offer.supplier_id)
          .single();
        
        if (supplierData?.contact_email) {
          const emailResult = await sendOfferStatusNotification(
            supplierData.contact_email,
            offer.supplier.name,
            offer.product.name,
            status,
            offer.offered_quantity,
            offer.unit,
            offer.offered_price
          );
          
          if (!emailResult.success) {
            console.warn('Offer status email failed:', emailResult.error);
          }
        }
      }
      
      toast.success(status === 'approved' ? 'Teklif onaylandı' : 'Teklif reddedildi');
      await fetchOffers();
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`İşlem başarısız: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  return {
    offers,
    isLoading,
    error,
    updateOfferStatus,
    refetch: fetchOffers
  };
};
