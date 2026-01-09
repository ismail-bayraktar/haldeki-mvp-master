/**
 * Vendors Hook
 * Phase 11 - Warehouse MVP
 *
 * Vendor (Tedarikçi) verilerini çeker
 * Tablo: vendors
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Vendor {
  id: string;
  user_id: string | null;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

/**
 * Hook: Aktif vendorları getirir
 */
export function useVendors() {
  return useQuery({
    queryKey: ['vendors', 'active'],
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  });
}

/**
 * Hook: Tüm vendorları getirir (admin için)
 */
export function useAllVendors() {
  return useQuery({
    queryKey: ['vendors', 'all'],
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
