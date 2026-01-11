/**
 * Pricing Configuration Hook
 *
 * Manages pricing_config table operations for admin users.
 * Hook for fetching and updating commission rates and pricing modes.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PricingConfig {
  id: string;
  commission_b2b: number;
  commission_b2c: number;
  price_calculation_mode: 'markup' | 'margin';
  regional_pricing_mode: 'multiplier' | 'fixed';
  round_to_nearest: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PricingConfigUpdate {
  commission_b2b?: number;
  commission_b2c?: number;
  price_calculation_mode?: 'markup' | 'margin';
  regional_pricing_mode?: 'multiplier' | 'fixed';
  round_to_nearest?: number;
}

const PRICING_CONFIG_QUERY_KEY = ['pricing_config'];

export function usePricingConfig() {
  const queryClient = useQueryClient();

  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: PRICING_CONFIG_QUERY_KEY,
    queryFn: async (): Promise<PricingConfig | null> => {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: PricingConfigUpdate): Promise<PricingConfig> => {
      if (!config?.id) {
        throw new Error('No active pricing config found');
      }

      const { data, error } = await supabase
        .from('pricing_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PRICING_CONFIG_QUERY_KEY, data);
      toast.success('Fiyatlandırma ayarları güncellendi');
    },
    onError: (error: Error) => {
      console.error('Error updating pricing config:', error);
      toast.error('Fiyatlandırma ayarları güncellenemedi: ' + error.message);
    },
  });

  const createNewConfig = useMutation({
    mutationFn: async (newConfig: PricingConfigUpdate): Promise<PricingConfig> => {
      // Deactivate existing configs
      await supabase
        .from('pricing_config')
        .update({ is_active: false })
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('pricing_config')
        .insert({
          ...newConfig,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PRICING_CONFIG_QUERY_KEY, data);
      toast.success('Yeni fiyatlandırma konfigürasyonu oluşturuldu');
    },
    onError: (error: Error) => {
      console.error('Error creating pricing config:', error);
      toast.error('Konfigürasyon oluşturulamadı: ' + error.message);
    },
  });

  return {
    config,
    isLoading,
    error,
    updateConfig: updateConfig.mutateAsync,
    createNewConfig: createNewConfig.mutateAsync,
    isUpdating: updateConfig.isPending,
    isCreating: createNewConfig.isPending,
  };
}

export function usePriceHistory(params?: { productId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['price_history', params?.productId, params?.limit],
    queryFn: async () => {
      let query = supabase
        .from('price_history')
        .select(`
          *,
          products(name),
          regions(name)
        `)
        .order('recorded_at', { ascending: false });

      if (params?.productId) {
        query = query.eq('product_id', params.productId);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useRegionalMultipliers() {
  return useQuery({
    queryKey: ['regional_multipliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, price_multiplier')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateRegionalMultiplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ regionId, multiplier }: { regionId: string; multiplier: number }) => {
      const { data, error } = await supabase
        .from('regions')
        .update({ price_multiplier: multiplier })
        .eq('id', regionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional_multipliers'] });
      toast.success('Bölgesel çarpan güncellendi');
    },
    onError: (error: Error) => {
      console.error('Error updating regional multiplier:', error);
      toast.error('Çarpan güncellenemedi: ' + error.message);
    },
  });
}
