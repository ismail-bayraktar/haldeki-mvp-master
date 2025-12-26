import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DealerProfile {
  id: string;
  user_id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  region_ids: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Region {
  id: string;
  name: string;
}

interface UseDealerProfileReturn {
  dealer: DealerProfile | null;
  regions: Region[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDealerProfile = (): UseDealerProfileReturn => {
  const { user } = useAuth();
  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDealerProfile = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch dealer record for current user
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (dealerError) {
        if (dealerError.code === 'PGRST116') {
          setError('Bayi kaydı bulunamadı. Lütfen yöneticinize başvurun.');
        } else {
          throw dealerError;
        }
        setDealer(null);
        setRegions([]);
        return;
      }

      setDealer(dealerData);

      // Fetch region names if region_ids exist
      if (dealerData?.region_ids && dealerData.region_ids.length > 0) {
        const { data: regionsData, error: regionsError } = await supabase
          .from('regions')
          .select('id, name')
          .in('id', dealerData.region_ids);

        if (regionsError) throw regionsError;
        setRegions(regionsData || []);
      } else {
        setRegions([]);
      }
    } catch (err) {
      console.error('Error fetching dealer profile:', err);
      setError('Profil yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealerProfile();
  }, [user?.id]);

  return {
    dealer,
    regions,
    isLoading,
    error,
    refetch: fetchDealerProfile
  };
};
