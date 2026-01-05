import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  business_type: string | null;
  tax_number: string | null;
  tax_office: string | null;
  region_ids: string[] | null;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  name: string;
}

interface UseBusinessProfileReturn {
  business: BusinessProfile | null;
  regions: Region[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useBusinessProfile = (): UseBusinessProfileReturn => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessProfile = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch business record for current user
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (businessError) {
        if (businessError.code === 'PGRST116') {
          setError('İşletme kaydı bulunamadı. Lütfen yöneticinize başvurun.');
        } else {
          throw businessError;
        }
        setBusiness(null);
        setRegions([]);
        return;
      }

      setBusiness(businessData);

      // Fetch region names if region_ids exist
      if (businessData?.region_ids && businessData.region_ids.length > 0) {
        const { data: regionsData, error: regionsError } = await supabase
          .from('regions')
          .select('id, name')
          .in('id', businessData.region_ids);

        if (regionsError) throw regionsError;
        setRegions(regionsData || []);
      } else {
        setRegions([]);
      }
    } catch (err) {
      console.error('Error fetching business profile:', err);
      setError('Profil yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessProfile();
  }, [user?.id]);

  return {
    business,
    regions,
    isLoading,
    error,
    refetch: fetchBusinessProfile
  };
};
