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
      // Check if user is SuperAdmin - they can view/manage all suppliers
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'superadmin')
        .single();

      const isSuperAdmin = !!roles;

      // Fetch supplier record - for SuperAdmin, get first active supplier
      let query = supabase.from('suppliers').select('*');

      if (isSuperAdmin) {
        // SuperAdmin: Get any active supplier (for dashboard access)
        query = query.eq('is_active', true).limit(1).single();
      } else {
        // Regular supplier: Get own record
        query = query.eq('user_id', user.id).single();
      }

      const { data: supplierData, error: supplierError } = await query;

      if (supplierError) {
        if (supplierError.code === 'PGRST116') {
          if (isSuperAdmin) {
            setError('Sistemde aktif tedarikçi kaydı bulunamadı. Önce bir tedarikçi oluşturun.');
          } else {
            setError('Tedarikçi kaydı bulunamadı. Lütfen yöneticinize başvurun.');
          }
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
