import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SupplierProfile {
  id: string;
  user_id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UseSupplierProfileReturn {
  supplier: SupplierProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSupplierProfile = (): UseSupplierProfileReturn => {
  const { user } = useAuth();
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplierProfile = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch supplier record for current user
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (supplierError) {
        if (supplierError.code === 'PGRST116') {
          setError('Tedarikçi kaydı bulunamadı. Lütfen yöneticinize başvurun.');
        } else {
          throw supplierError;
        }
        setSupplier(null);
        return;
      }

      setSupplier(supplierData);
    } catch (err) {
      console.error('Error fetching supplier profile:', err);
      setError('Profil yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierProfile();
  }, [user?.id]);

  return {
    supplier,
    isLoading,
    error,
    refetch: fetchSupplierProfile
  };
};
