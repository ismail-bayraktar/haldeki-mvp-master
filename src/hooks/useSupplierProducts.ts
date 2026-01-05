// Supplier Product Management Hook (Phase 9)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/utils';
import type {
  SupplierProduct,
  ProductFormData,
  ProductListParams,
  ProductListResponse,
  ProductActionResult,
  BulkProductResult,
} from '@/types/supplier';

/**
 * Helper: Convert DB product to SupplierProduct type
 */
const toSupplierProduct = (data: any): SupplierProduct => ({
  id: data.id,
  supplier_id: data.supplier_id,
  name: data.name,
  description: data.description,
  category: data.category,
  base_price: parseFloat(data.base_price),
  unit: data.unit,
  stock: data.stock || 0,
  images: Array.isArray(data.images) ? data.images : [],
  product_status: data.product_status || 'active',
  last_modified_by: data.last_modified_by,
  last_modified_at: data.last_modified_at,
  created_at: data.created_at,
  updated_at: data.updated_at,
});

/**
 * Hook: Get supplier's products with pagination and filtering
 */
export function useSupplierProducts(params?: ProductListParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['supplier-products', user?.id, params],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('supplier_id', user.id);

      // Apply filters
      if (params?.filters) {
        const { query: searchQuery, category, minPrice, maxPrice, inStock, status } = params.filters;

        // Full-text search
        if (searchQuery) {
          query = query.textSearch('name', searchQuery);
        }

        // Category filter
        if (category) {
          query = query.eq('category', category);
        }

        // Price range filter
        if (minPrice !== undefined) {
          query = query.gte('base_price', minPrice);
        }
        if (maxPrice !== undefined) {
          query = query.lte('base_price', maxPrice);
        }

        // Stock filter
        if (inStock) {
          query = query.gt('stock', 0);
        }

        // Status filter
        if (status) {
          query = query.eq('product_status', status);
        }
      }

      // Apply sorting
      const sortBy = params?.sortBy || 'modified_desc';
      const [column, order] = sortBy.split('_');

      // Map sort option to actual database column
      const columnMap: Record<string, string> = {
        modified: 'last_modified_at',
        name: 'name',
        price: 'base_price',
        stock: 'stock',
      };
      const dbColumn = columnMap[column] || column;

      query = query.order(dbColumn, { ascending: order === 'asc' });

      // Apply pagination
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const products: SupplierProduct[] = (data || []).map(toSupplierProduct);
      const total = count || 0;

      return {
        products,
        total,
        page,
        pageSize,
        hasMore: from + pageSize < total,
      } as ProductListResponse;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook: Get single product by ID
 */
export function useSupplierProduct(productId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['supplier-product', productId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('supplier_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      return toSupplierProduct(data);
    },
    enabled: !!user?.id && !!productId,
  });
}

/**
 * Hook: Create product mutation
 */
export function useCreateProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ProductFormData): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Prepare product data
      const productData = {
        supplier_id: user.id,
        name: formData.name,
        slug: generateSlug(`${formData.name}-${Date.now()}`), // Unique slug with timestamp
        category_id: formData.category || 'diger', // Default category
        category_name: formData.category || 'Diğer', // Display name
        base_price: formData.base_price,
        price: formData.base_price, // Set same as base_price initially
        unit: formData.unit,
        stock: formData.stock,
        images: [], // Will be updated by image upload hook
        product_status: formData.product_status || 'active',
        description: formData.description || null,
        origin: 'Türkiye', // Default origin
        quality: 'standart', // Default quality
        availability: 'plenty', // Default availability
        is_active: true,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });

      return {
        success: true,
        product: toSupplierProduct(data),
      };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Ürün başarıyla oluşturuldu');
      } else {
        toast.error(result.error || 'Ürün oluşturulamadı');
      }
    },
    onError: (error: Error) => {
      toast.error('Ürün oluşturulurken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Update product mutation
 */
export function useUpdateProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      formData,
    }: {
      productId: string;
      formData: Partial<ProductFormData>;
    }): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.category !== undefined) updateData.category = formData.category;
      if (formData.base_price !== undefined) updateData.base_price = formData.base_price;
      if (formData.unit !== undefined) updateData.unit = formData.unit;
      if (formData.stock !== undefined) updateData.stock = formData.stock;
      if (formData.product_status !== undefined) updateData.product_status = formData.product_status;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .eq('supplier_id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-product', productId] });

      return {
        success: true,
        product: toSupplierProduct(data),
      };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Ürün güncellendi');
      } else {
        toast.error(result.error || 'Ürün güncellenemedi');
      }
    },
    onError: (error: Error) => {
      toast.error('Ürün güncellenirken hata: ' + error.message);
    },
  });
}

/**
 * Hook: Update product price mutation (inline edit)
 */
export function useUpdateProductPrice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      price,
    }: {
      productId: string;
      price: number;
    }): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .update({
          base_price: price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('supplier_id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-product', productId] });

      return {
        success: true,
        product: toSupplierProduct(data),
      };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Fiyat güncellendi');
      } else {
        toast.error(result.error || 'Fiyat güncellenemedi');
      }
    },
  });
}

/**
 * Hook: Delete product mutation
 */
export function useDeleteProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('supplier_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Ürün silindi');
      } else {
        toast.error(result.error || 'Ürün silinemedi');
      }
    },
  });
}

/**
 * Hook: Bulk update product status
 */
export function useBulkUpdateStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productIds,
      status,
    }: {
      productIds: string[];
      status: string;
    }): Promise<BulkProductResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const succeeded: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const productId of productIds) {
        const { error } = await supabase
          .from('products')
          .update({
            product_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
          .eq('supplier_id', user.id);

        if (error) {
          failed.push({ id: productId, error: error.message });
        } else {
          succeeded.push(productId);
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });

      return {
        success: failed.length === 0,
        succeeded,
        failed,
      };
    },
    onSuccess: (result) => {
      const { success, succeeded, failed } = result;
      if (success) {
        toast.success(`${succeeded.length} ürün güncellendi`);
      } else {
        toast.warning(
          `${succeeded.length} ürün güncellendi, ${failed.length} başarısız`
        );
      }
    },
  });
}

/**
 * Hook: Bulk delete products
 */
export function useBulkDeleteProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]): Promise<BulkProductResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const succeeded: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const productId of productIds) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('supplier_id', user.id);

        if (error) {
          failed.push({ id: productId, error: error.message });
        } else {
          succeeded.push(productId);
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });

      return {
        success: failed.length === 0,
        succeeded,
        failed,
      };
    },
    onSuccess: (result) => {
      const { success, succeeded, failed } = result;
      if (success) {
        toast.success(`${succeeded.length} ürün silindi`);
      } else {
        toast.warning(
          `${succeeded.length} ürün silindi, ${failed.length} başarısız`
        );
      }
    },
  });
}

/**
 * Hook: Get product categories (unique values)
 */
export function useProductCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      // Get unique categories
      const categories = Array.from(
        new Set((data || []).map((p) => p.category))
      ).sort();

      return categories;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
