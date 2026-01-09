// Multi-Supplier Product Management Hooks (Phase 12)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  SupplierProductInfo,
  ProductPriceStats,
  ProductWithSuppliers,
  SupplierProductFormData,
  BulkSupplierProductResult,
} from '@/types/multiSupplier';

/**
 * Hook: Get all suppliers for a product with prices
 */
export function useProductSuppliers(productId: string) {
  return useQuery({
    queryKey: ['product-suppliers', productId],
    queryFn: async (): Promise<SupplierProductInfo[]> => {
      const { data, error } = await supabase.rpc('get_product_suppliers', {
        p_product_id: productId,
      });

      if (error) throw error;
      return (data || []) as SupplierProductInfo[];
    },
    enabled: !!productId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook: Get price statistics for a product across suppliers
 */
export function useProductPriceStats(productId: string) {
  return useQuery({
    queryKey: ['product-price-stats', productId],
    queryFn: async (): Promise<ProductPriceStats | null> => {
      const { data, error } = await supabase.rpc('get_product_price_stats', {
        p_product_id: productId,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as ProductPriceStats;
    },
    enabled: !!productId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook: Get product with suppliers and stats combined
 */
export function useProductWithSuppliers(productId: string) {
  return useQuery({
    queryKey: ['product-with-suppliers', productId],
    queryFn: async (): Promise<ProductWithSuppliers | null> => {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, category, unit, images')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      if (!product) return null;

      const [suppliersResponse, statsResponse] = await Promise.all([
        supabase.rpc('get_product_suppliers', { p_product_id: productId }),
        supabase.rpc('get_product_price_stats', { p_product_id: productId }),
      ]);

      if (suppliersResponse.error) throw suppliersResponse.error;
      if (statsResponse.error) throw statsResponse.error;

      const suppliers = (suppliersResponse.data || []) as SupplierProductInfo[];
      const stats = statsResponse.data?.[0] as ProductPriceStats || {
        min_price: 0,
        max_price: 0,
        avg_price: 0,
        supplier_count: 0,
      };

      return {
        product: {
          id: product.id,
          name: product.name,
          category: product.category,
          unit: product.unit,
          image_url: Array.isArray(product.images) ? product.images[0] : null,
        },
        suppliers,
        stats,
      };
    },
    enabled: !!productId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook: Create supplier product (link product to supplier)
 */
export function useCreateSupplierProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: SupplierProductFormData) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .insert({
          supplier_id: formData.supplier_id,
          product_id: formData.product_id,
          price: formData.price,
          stock_quantity: formData.stock_quantity,
          availability: formData.availability,
          quality: formData.quality,
          origin: formData.origin || 'Türkiye',
          min_order_quantity: formData.min_order_quantity || 1,
          delivery_days: formData.delivery_days || 1,
          is_featured: formData.is_featured || false,
          supplier_sku: formData.supplier_sku,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['product-price-stats'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
      toast.success('Tedarikçi ürünü eklendi');
    },
    onError: (error: Error) => {
      toast.error('Tedarikçi ürünü eklenirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Update supplier product price
 */
export function useUpdateSupplierProductPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierProductId,
      price,
    }: {
      supplierProductId: string;
      price: number;
    }) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .update({ price })
        .eq('id', supplierProductId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['product-price-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Fiyat güncellendi');
    },
    onError: (error: Error) => {
      toast.error('Fiyat güncellenirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Update supplier product stock
 */
export function useUpdateSupplierProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierProductId,
      stock_quantity,
      availability,
    }: {
      supplierProductId: string;
      stock_quantity: number;
      availability?: 'plenty' | 'limited' | 'last';
    }) => {
      const updateData: { stock_quantity: number; availability?: 'plenty' | 'limited' | 'last' } = { stock_quantity };
      if (availability) updateData.availability = availability;

      const { data, error } = await supabase
        .from('supplier_products')
        .update(updateData)
        .eq('id', supplierProductId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
      toast.success('Stok güncellendi');
    },
    onError: (error: Error) => {
      toast.error('Stok güncellenirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Delete supplier product (unlink product from supplier)
 */
export function useDeleteSupplierProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierProductId: string) => {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', supplierProductId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['product-price-stats'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });
      toast.success('Tedarikçi ürünü silindi');
    },
    onError: (error: Error) => {
      toast.error('Tedarikçi ürünü silinirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Bulk update supplier product availability
 */
export function useBulkUpdateSupplierAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierProductIds,
      availability,
    }: {
      supplierProductIds: string[];
      availability: 'plenty' | 'limited' | 'last';
    }): Promise<BulkSupplierProductResult> => {
      const succeeded: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const id of supplierProductIds) {
        const { error } = await supabase
          .from('supplier_products')
          .update({ availability })
          .eq('id', id);

        if (error) {
          failed.push({ id, error: error.message });
        } else {
          succeeded.push(id);
        }
      }

      return { success: failed.length === 0, succeeded, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-catalog'] });

      if (result.success) {
        toast.success(`${result.succeeded.length} ürün güncellendi`);
      } else {
        toast.warning(
          `${result.succeeded.length} ürün güncellendi, ${result.failed.length} başarısız`
        );
      }
    },
  });
}

/**
 * Hook: Toggle supplier product featured status
 */
export function useToggleSupplierProductFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierProductId: string) => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('is_featured')
        .eq('id', supplierProductId)
        .single();

      if (error) throw error;

      const { data: updated, error: updateError } = await supabase
        .from('supplier_products')
        .update({ is_featured: !data.is_featured })
        .eq('id', supplierProductId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Öne çıkan durumu güncellendi');
    },
    onError: (error: Error) => {
      toast.error('İşlem başarısız: ' + error.message);
    },
  });
}
