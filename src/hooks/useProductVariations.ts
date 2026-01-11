// Product Variations Hooks (Phase 12)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ProductVariation,
  ProductVariationType,
} from '@/types/multiSupplier';

/**
 * Hook: Get variations for a product
 */
export function useProductVariations(productId: string) {
  return useQuery({
    queryKey: ['product-variations', productId],
    queryFn: async (): Promise<ProductVariation[]> => {
      const { data, error } = await supabase.rpc('get_product_variations', {
        p_product_id: productId,
      });

      if (error) throw error;
      return (data || []) as ProductVariation[];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Get variations grouped by type for a product
 */
export function useProductVariationsGrouped(productId: string) {
  return useQuery({
    queryKey: ['product-variations-grouped', productId],
    queryFn: async (): Promise<Record<ProductVariationType, ProductVariation[]>> => {
      try {
        const { data, error } = await supabase.rpc('get_product_variations', {
          p_product_id: productId,
        });

        // If table doesn't exist or RPC not found, return empty
        if (error) {
          console.warn('Variations not available:', error.message);
          return {} as Record<ProductVariationType, ProductVariation[]>;
        }

        const variations = (data || []) as ProductVariation[];
        const grouped: Record<ProductVariationType, ProductVariation[]> = {} as Record<ProductVariationType, ProductVariation[]>;

        for (const variation of variations) {
          if (!grouped[variation.variation_type]) {
            grouped[variation.variation_type] = [];
          }
          grouped[variation.variation_type].push(variation);
        }

        return grouped as Record<ProductVariationType, ProductVariation[]>;
      } catch (err) {
        // Return empty if variations table doesn't exist yet
        console.warn('Variations table not available');
        return {} as Record<ProductVariationType, ProductVariation[]>;
      }
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if table doesn't exist
  });
}

/**
 * Hook: Get available variation types (enum values)
 */
export function useVariationTypes() {
  return useQuery<ProductVariationType[]>({
    queryKey: ['variation-types'],
    queryFn: async () => {
      return ['size', 'packaging', 'quality', 'other'];
    },
    staleTime: Infinity, // Never stale
  });
}

/**
 * Hook: Get all variations across all products (for admin)
 */
export function useAllVariations() {
  return useQuery({
    queryKey: ['all-variations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variations')
        .select('id, product_id, variation_type, variation_value, display_order, metadata')
        .order('variation_type')
        .order('display_order');

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Create product variation
 */
export function useCreateProductVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variation: {
      product_id: string;
      variation_type: ProductVariationType;
      variation_value: string;
      display_order?: number;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('product_variations')
        .insert(variation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-variations', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['product-variations-grouped', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['all-variations'] });
      toast.success('Varyasyon eklendi');
    },
    onError: (error: Error) => {
      toast.error('Varyasyon eklenirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Update product variation
 */
export function useUpdateProductVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variationId,
      updates,
    }: {
      variationId: string;
      updates: Partial<Pick<ProductVariation, 'variation_value' | 'display_order' | 'metadata'>>;
    }) => {
      const { data, error } = await supabase
        .from('product_variations')
        .update(updates)
        .eq('id', variationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variations'] });
      queryClient.invalidateQueries({ queryKey: ['product-variations-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['all-variations'] });
      toast.success('Varyasyon güncellendi');
    },
    onError: (error: Error) => {
      toast.error('Varyasyon güncellenirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Delete product variation
 */
export function useDeleteProductVariation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variationId: string) => {
      const { error } = await supabase
        .from('product_variations')
        .delete()
        .eq('id', variationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variations'] });
      queryClient.invalidateQueries({ queryKey: ['product-variations-grouped'] });
      queryClient.invalidateQueries({ queryKey: ['all-variations'] });
      toast.success('Varyasyon silindi');
    },
    onError: (error: Error) => {
      toast.error('Varyasyon silinirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Bulk create variations for a product
 */
export function useBulkCreateVariations() {
  const queryClient = useQueryClient();
  const createMutation = useCreateProductVariation();

  return useMutation({
    mutationFn: async ({
      productId,
      variations,
    }: {
      productId: string;
      variations: Array<{
        variation_type: ProductVariationType;
        variation_value: string;
        display_order?: number;
        metadata?: Record<string, unknown>;
      }>;
    }) => {
      const results = await Promise.allSettled(
        variations.map((v) =>
          createMutation.mutateAsync({
            product_id: productId,
            ...v,
          })
        )
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed > 0) {
        throw new Error(`${succeeded} başarılı, ${failed} başarısız`);
      }

      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      if (failed === 0) {
        toast.success(`${succeeded} varyasyon eklendi`);
      } else {
        toast.warning(`${succeeded} varyasyon eklendi, ${failed} başarısız`);
      }
    },
  });
}
