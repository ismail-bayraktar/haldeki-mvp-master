// Supplier Product Management Hook (Phase 9)
// DEBUG: Force reload - variations fix testing

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
import type {
  SupplierProductFormData,
  SupplierProductBulkResult,
  ProductVariationsGrouped,
  ProductVariationType,
} from '@/types/multiSupplier';

/**
 * Helper: Convert DB product to SupplierProduct type
 */
type DatabaseProduct = {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  category: string;
  base_price: string | number;
  unit: string;
  stock: number | null;
  images: string[] | null;
  product_status: ProductStatus;
  last_modified_by: string | null;
  last_modified_at: string | null;
  created_at: string;
  updated_at: string;
};

const toSupplierProduct = (data: DatabaseProduct): SupplierProduct => {
  const parsedPrice = typeof data.base_price === 'string' ? parseFloat(data.base_price) : data.base_price;
  return {
    id: data.id,
    supplier_id: data.supplier_id,
    name: data.name,
    description: data.description,
    category: data.category,
    price: parsedPrice, // Phase 12: Add price field
    base_price: parsedPrice,
    unit: data.unit,
    stock: data.stock || 0,
    images: Array.isArray(data.images) ? data.images : [],
    product_status: data.product_status || 'active',
    last_modified_by: data.last_modified_by,
    last_modified_at: data.last_modified_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Helper: Convert ProductVariationsGrouped[] to product_variations insert format
 * Phase 12: Flattens grouped variations for database insertion
 */
const flattenVariationsForInsert = (
  productId: string,
  groupedVariations: ProductVariationsGrouped[] | undefined
) => {
  console.log('🔍 [DEBUG] flattenVariationsForInsert called:', { productId, groupedVariations });
  if (!groupedVariations || groupedVariations.length === 0) {
    console.log('⚠️ [DEBUG] No variations to flatten');
    return [];
  }

  const variations: Array<{
    product_id: string;
    variation_type: string;
    variation_value: string;
    display_order: number;
    metadata: Record<string, unknown>;
  }> = [];

  for (const group of groupedVariations) {
    for (const value of group.values) {
      variations.push({
        product_id: productId,
        variation_type: group.variation_type,
        variation_value: value.value,
        display_order: value.display_order,
        metadata: (value.metadata as Record<string, unknown>) || {},
      });
    }
  }

  console.log('✅ [DEBUG] Flattened variations:', variations);
  return variations;
};

/**
 * Hook: Get supplier's products with pagination and filtering
 *
 * @deprecated Use useSupplierJunctionProducts instead (Phase 12)
 * This hook uses the old products.supplier_id pattern which is removed in Phase 12
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
 * Hook: Get single product by ID (Phase 12)
 * Fetches from supplier_products junction table to verify ownership
 */
export function useSupplierProduct(productId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['supplier-product', productId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) throw new Error('Supplier not found');

      // Phase 12: Fetch from supplier_products with product details and variations
      // Note: product_variations is related to products, not supplier_products
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          id,
          price,
          previous_price,
          price_change,
          stock_quantity,
          availability,
          quality,
          origin,
          supplier_sku,
          min_order_quantity,
          delivery_days,
          is_featured,
          is_active,
          updated_at,
          products (
            id,
            name,
            description,
            category,
            unit,
            images,
            product_status,
            slug,
            product_variations (
              id,
              variation_type,
              variation_value,
              display_order,
              metadata
            )
          )
        `)
        .eq('id', productId)
        .eq('supplier_id', supplierId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      type SupplierProductWithProduct = {
        id: string;
        price: string | number;
        previous_price: string | number | null;
        price_change: 'increased' | 'decreased' | 'stable';
        stock_quantity: number;
        availability: 'plenty' | 'limited' | 'last';
        quality: 'premium' | 'standart' | 'ekonomik';
        origin: string;
        supplier_sku: string | null;
        min_order_quantity: number;
        delivery_days: number;
        is_featured: boolean;
        is_active: boolean;
        updated_at: string;
        products: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          unit: string;
          images: string[] | null;
          product_status: ProductStatus;
          slug: string;
          product_variations: Array<{
            id: string;
            variation_type: string;
            variation_value: string;
            display_order: number;
            metadata: Record<string, unknown> | null;
          }>;
        };
      };

      const sp = data as SupplierProductWithProduct;
      const parsedPrice = typeof sp.price === 'string' ? parseFloat(sp.price) : sp.price;

      // Group variations by variation_type (from products.product_variations)
      const variationsMap = new Map<string, ProductVariationsGrouped>();
      for (const v of sp.products.product_variations || []) {
        if (!variationsMap.has(v.variation_type)) {
          variationsMap.set(v.variation_type, {
            variation_type: v.variation_type as ProductVariationType,
            values: [],
          });
        }
        variationsMap.get(v.variation_type)!.values.push({
          value: v.variation_value,
          display_order: v.display_order,
          metadata: v.metadata as Record<string, unknown> | null,
        });
      }
      const groupedVariations = Array.from(variationsMap.values());

      // Convert to SupplierProduct format
      return {
        id: sp.id,
        supplier_product_id: sp.id,
        product_id: sp.products.id,
        name: sp.products.name,
        description: sp.products.description,
        category: sp.products.category,
        price: parsedPrice,
        base_price: parsedPrice, // Backward compatibility
        previous_price: sp.previous_price ? (typeof sp.previous_price === 'string' ? parseFloat(sp.previous_price) : sp.previous_price) : null,
        price_change: sp.price_change,
        unit: sp.products.unit,
        stock: sp.stock_quantity,
        availability: sp.availability,
        is_active: sp.is_active,
        is_featured: sp.is_featured,
        quality: sp.quality,
        origin: sp.origin,
        supplier_sku: sp.supplier_sku,
        min_order_quantity: sp.min_order_quantity,
        delivery_days: sp.delivery_days,
        images: sp.products.images || [],
        updated_at: sp.updated_at,
        variations: groupedVariations,
      } as SupplierProduct;
    },
    enabled: !!user?.id && !!productId,
  });
}

/**
 * Check for duplicate products before creation
 * Returns array of existing products with similar name in same category
 */
export async function checkDuplicateProducts(productName: string, category: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      supplier_products (
        suppliers (
          business_name
        )
      )
    `)
    .ilike('name', `%${productName}%`)
    .eq('category', category)
    .eq('is_active', true)
    .limit(10);

  if (error) {
    console.error('Duplicate check error:', error);
    return [];
  }

  return data || [];
}

/**
 * Hook: Create product mutation
 * Phase 12: Creates product in products table and links to supplier via supplier_products junction
 */
export function useCreateProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ProductFormData): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Step 1: Get supplier ID from user
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen iletişime geçin.' };
      }

      if (!supplier) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen önce tedarikçi başvurusu yapın.' };
      }

      if (supplier.approval_status !== 'approved') {
        return { success: false, error: 'Tedarikçi başvurunuz henüz onaylanmadı. Onay bekleniyor.' };
      }

      // Step 2: Create product in products table (without supplier_id)
      const productData = {
        name: formData.name,
        slug: generateSlug(`${formData.name}-${Date.now()}`),
        category: formData.category || 'Diğer',
        unit: formData.unit,
        images: [], // Will be updated by image upload hook
        description: formData.description || null,
        product_status: formData.product_status || 'active',
        is_active: true,
      };

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) {
        if (productError.message.includes('network') || productError.message.includes('connection')) {
          return { success: false, error: 'Network hatası: Lütfen internet bağlantınızı kontrol edin.' };
        }
        if (productError.message.includes('permission') || productError.message.includes('authorization')) {
          return { success: false, error: 'Yetki hatası: Bu işlem için yetkiniz yok.' };
        }
        return { success: false, error: 'Ürün oluşturma hatası: ' + productError.message };
      }

      if (!product) {
        return { success: false, error: 'Ürün oluşturulamadı. Lütfen tekrar deneyin.' };
      }

      // Step 3: Link product to supplier via supplier_products junction table
      const { error: junctionError } = await supabase
        .from('supplier_products')
        .insert({
          supplier_id: supplier.id,
          product_id: product.id,
          price: formData.base_price,
          stock_quantity: formData.stock,
          availability: formData.stock > 10 ? 'plenty' : formData.stock > 0 ? 'limited' : 'last',
          quality: 'standart',
          origin: 'Türkiye',
          min_order_quantity: 1,
          delivery_days: 1,
          is_featured: false,
          is_active: true,
        });

      if (junctionError) {
        // Rollback product creation if junction fails
        await supabase.from('products').delete().eq('id', product.id);
        return { success: false, error: 'Ürün tedarikçiye bağlanırken hata: ' + junctionError.message };
      }

      // Step 4: Insert product variations if provided (Phase 12)
      if (formData.variations && formData.variations.length > 0) {
        const variationsToInsert = flattenVariationsForInsert(product.id, formData.variations);
        if (variationsToInsert.length > 0) {
          const { error: variationsError } = await supabase
            .from('product_variations')
            .insert(variationsToInsert);

          if (variationsError) {
            // Non-critical error: log but don't fail the entire operation
            console.error('Varyasyonlar kaydedilirken hata:', variationsError);
            toast.warning('Ürün oluşturuldu ancak varyasyonlar kaydedilemedi');
          }
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      queryClient.invalidateQueries({ queryKey: ['product-variations', product.id] });

      // Return product with supplier info for compatibility
      return {
        success: true,
        product: {
          ...toSupplierProduct({ ...product, supplier_id: supplier.id }),
          id: product.id,
        },
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
 * Phase 12: Updates both products table and supplier_products junction table
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

      // Get supplier ID
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen iletişime geçin.' };
      }

      if (!supplier) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen önce tedarikçi başvurusu yapın.' };
      }

      if (supplier.approval_status !== 'approved') {
        return { success: false, error: 'Tedarikçi başvurunuz henüz onaylanmadı. Onay bekleniyor.' };
      }

      // Phase 12: productId is supplier_products.id, we need to get the actual product_id
      console.log('🔍 [DEBUG] Fetching supplier_product to get product_id');
      const { data: supplierProduct, error: fetchError } = await supabase
        .from('supplier_products')
        .select('product_id')
        .eq('id', productId)
        .eq('supplier_id', supplier.id)
        .single();

      if (fetchError || !supplierProduct) {
        console.error('❌ [DEBUG] Failed to fetch supplier_product:', fetchError);
        return { success: false, error: 'Ürün bulunamadı veya bu ürünü düzenleme yetkiniz yok.' };
      }

      const actualProductId = supplierProduct.product_id;
      console.log('✅ [DEBUG] Got actual product_id:', actualProductId);

      // Step 1: Update product in products table
      console.log('🔍 [DEBUG] Step 1: Updating product in products table, id:', actualProductId);
      const productUpdateData: {
        name?: string;
        description?: string | null;
        category?: string;
        unit?: string;
        product_status?: ProductStatus;
      } = {};

      if (formData.name !== undefined) productUpdateData.name = formData.name;
      if (formData.description !== undefined) productUpdateData.description = formData.description;
      if (formData.category !== undefined) productUpdateData.category = formData.category;
      if (formData.unit !== undefined) productUpdateData.unit = formData.unit;
      // Only include product_status if it's a valid non-empty value
      if (formData.product_status !== undefined && formData.product_status !== '') {
        productUpdateData.product_status = formData.product_status;
      }

      console.log('📝 [DEBUG] Product update data:', productUpdateData);
      const { data: product, error: productError } = await supabase
        .from('products')
        .update(productUpdateData)
        .eq('id', actualProductId)
        .select()
        .single();

      if (productError) {
        console.error('❌ [DEBUG] Product update error:', productError);
        return { success: false, error: 'Ürün güncellenemedi: Lütfen tekrar deneyin.' };
      }
      console.log('✅ [DEBUG] Product updated successfully:', product);

      // Step 2: Update supplier_products junction table (price and stock)
      console.log('🔍 [DEBUG] Step 2: Updating supplier_products junction table');
      const junctionUpdateData: {
        price?: number;
        stock_quantity?: number;
        availability?: 'plenty' | 'limited' | 'last';
      } = {};

      if (formData.base_price !== undefined) junctionUpdateData.price = formData.base_price;
      if (formData.stock !== undefined) {
        junctionUpdateData.stock_quantity = formData.stock;
        junctionUpdateData.availability = formData.stock > 10 ? 'plenty' : formData.stock > 0 ? 'limited' : 'last';
      }

      if (Object.keys(junctionUpdateData).length > 0) {
        console.log('📝 [DEBUG] Junction update data:', junctionUpdateData);
        const { error: junctionError } = await supabase
          .from('supplier_products')
          .update(junctionUpdateData)
          .eq('product_id', productId)
          .eq('supplier_id', supplier.id);

        if (junctionError) {
          console.error('❌ [DEBUG] Junction update error:', junctionError);
          return { success: false, error: 'Tedarikçi ürünü güncellenirken hata: ' + junctionError.message };
        }
        console.log('✅ [DEBUG] Junction updated successfully');
      } else {
        console.log('ℹ️ [DEBUG] No junction data to update');
      }

      // Step 3: Update product variations if provided (Phase 12)
      console.log('🔍 [DEBUG] Step 3: Checking variations in formData:', formData.variations);
      if (formData.variations !== undefined) {
        console.log('✅ [DEBUG] Variations found in formData, processing...');

        // Delete existing variations for this product
        console.log('🗑️ [DEBUG] Deleting existing variations for product:', actualProductId);
        const { error: deleteError } = await supabase
          .from('product_variations')
          .delete()
          .eq('product_id', actualProductId);

        if (deleteError) {
          console.error('❌ [DEBUG] Eski varyasyonlar silinirken hata:', deleteError);
        } else {
          console.log('✅ [DEBUG] Old variations deleted successfully');
        }

        // Insert new variations if provided
        if (formData.variations.length > 0) {
          console.log('➕ [DEBUG] Inserting new variations, count:', formData.variations.length);
          const variationsToInsert = flattenVariationsForInsert(actualProductId, formData.variations);
          if (variationsToInsert.length > 0) {
            console.log('💾 [DEBUG] Bulk inserting variations:', variationsToInsert);
            const { error: variationsError, data: variationsData } = await supabase
              .from('product_variations')
              .insert(variationsToInsert)
              .select();

            if (variationsError) {
              // Non-critical error: log but don't fail the entire operation
              console.error('❌ [DEBUG] Varyasyonlar güncellenirken hata:', variationsError);
              toast.warning('Ürün güncellendi ancak varyasyonlar kaydedilemedi');
            } else {
              console.log('✅ [DEBUG] Variations inserted successfully:', variationsData);
            }
          } else {
            console.log('⚠️ [DEBUG] flattenVariationsForInsert returned empty array');
          }
        } else {
          console.log('ℹ️ [DEBUG] formData.variations is empty array, skipping insert');
        }
      } else {
        console.log('ℹ️ [DEBUG] formData.variations is undefined, skipping variations update');
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-product', productId] });  // Keep using supplier_products ID for cache
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      queryClient.invalidateQueries({ queryKey: ['product-variations', actualProductId] });  // Use actual product_id for variations

      return {
        success: true,
        product: toSupplierProduct({ ...product, supplier_id: supplier.id }),
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
 * Phase 12: Updates price in supplier_products junction table
 * With optimistic updates for better UX
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

      // Get supplier ID
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen iletişime geçin.' };
      }

      if (!supplier) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen önce tedarikçi başvurusu yapın.' };
      }

      if (supplier.approval_status !== 'approved') {
        return { success: false, error: 'Tedarikçi başvurunuz henüz onaylanmadı. Onay bekleniyor.' };
      }

      // Update price in supplier_products junction table
      const { error } = await supabase
        .from('supplier_products')
        .update({ price })
        .eq('product_id', productId)
        .eq('supplier_id', supplier.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    // Optimistic update: Update UI immediately
    onMutate: async ({ productId, price }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['supplier-junction-products'] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(['supplier-junction-products']);

      // Optimistically update to the new value
      queryClient.setQueryData(['supplier-junction-products'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products?.map((p: SupplierProduct) =>
            p.product_id === productId || p.id === productId
              ? { ...p, price, base_price: price }
              : p
          ),
        };
      });

      // Return context with previous value for rollback
      return { previousProducts };
    },
    // If mutation fails, use context returned from onMutate to rollback
    onError: (error, variables, context) => {
      queryClient.setQueryData(['supplier-junction-products'], context?.previousProducts);
      toast.error('Fiyat güncellenirken hata: ' + error.message);
    },
    // Always refetch after error or success to make sure server state is correct
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
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
 * Hook: Update product stock mutation (inline edit)
 * Phase 12: Updates stock_quantity in supplier_products junction table
 * With optimistic updates for better UX
 */
export function useUpdateProductStock() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      stock,
    }: {
      productId: string;
      stock: number;
    }): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get supplier ID
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen iletişime geçin.' };
      }

      if (!supplier) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen önce tedarikçi başvurusu yapın.' };
      }

      if (supplier.approval_status !== 'approved') {
        return { success: false, error: 'Tedarikçi başvurunuz henüz onaylanmadı. Onay bekleniyor.' };
      }

      // Update stock in supplier_products junction table
      const { error } = await supabase
        .from('supplier_products')
        .update({ stock_quantity: stock })
        .eq('product_id', productId)
        .eq('supplier_id', supplier.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    // Optimistic update
    onMutate: async ({ productId, stock }) => {
      await queryClient.cancelQueries({ queryKey: ['supplier-junction-products'] });
      const previousProducts = queryClient.getQueryData(['supplier-junction-products']);

      queryClient.setQueryData(['supplier-junction-products'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products?.map((p: SupplierProduct) =>
            p.product_id === productId || p.id === productId
              ? { ...p, stock }
              : p
          ),
        };
      });

      return { previousProducts };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['supplier-junction-products'], context?.previousProducts);
      toast.error('Stok güncellenirken hata: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Stok güncellendi');
      }
    },
  });
}

/**
 * Hook: Update product status mutation (inline toggle)
 * Phase 12: Updates is_active in supplier_products junction table
 * With optimistic updates for better UX
 */
export function useUpdateProductStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isActive,
    }: {
      productId: string;
      isActive: boolean;
    }): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get supplier ID
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen iletişime geçin.' };
      }

      if (!supplier) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen önce tedarikçi başvurusu yapın.' };
      }

      if (supplier.approval_status !== 'approved') {
        return { success: false, error: 'Tedarikçi başvurunuz henüz onaylanmadı. Onay bekleniyor.' };
      }

      // Update is_active in supplier_products junction table
      const { error } = await supabase
        .from('supplier_products')
        .update({ is_active: isActive })
        .eq('product_id', productId)
        .eq('supplier_id', supplier.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    // Optimistic update
    onMutate: async ({ productId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['supplier-junction-products'] });
      const previousProducts = queryClient.getQueryData(['supplier-junction-products']);

      queryClient.setQueryData(['supplier-junction-products'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products?.map((p: SupplierProduct) =>
            p.product_id === productId || p.id === productId
              ? { ...p, is_active: isActive }
              : p
          ),
        };
      });

      return { previousProducts };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['supplier-junction-products'], context?.previousProducts);
      toast.error('Durum güncellenirken hata: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Durum güncellendi');
      }
    },
  });
}

/**
 * Hook: Delete product mutation
 * Phase 12: Deletes from both products and supplier_products junction table
 */
export function useDeleteProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get supplier ID
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen iletişime geçin.' };
      }

      if (!supplier) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen önce tedarikçi başvurusu yapın.' };
      }

      if (supplier.approval_status !== 'approved') {
        return { success: false, error: 'Tedarikçi başvurunuz henüz onaylanmadı. Onay bekleniyor.' };
      }

      // Step 1: Delete from supplier_products junction table
      const { error: junctionError } = await supabase
        .from('supplier_products')
        .delete()
        .eq('product_id', productId)
        .eq('supplier_id', supplier.id);

      if (junctionError) {
        return { success: false, error: 'Ürün silinemedi: Lütfen tekrar deneyin.' };
      }

      // Step 2: Delete from products table
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) {
        return { success: false, error: 'Ürün silinemedi: Lütfen tekrar deneyin.' };
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Ürün silindi');
      } else {
        toast.error(result.error || 'Ürün silinemedi');
      }
    },
    onError: (error: Error) => {
      toast.error('Ürün silinirken hata: ' + error.message);
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

// ============================================================================
// Phase 12: Multi-Supplier Product Management Hooks
// ============================================================================

/**
 * Helper: Get supplier ID from user
 */
async function getSupplierId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', userId)
    .eq('approval_status', 'approved')
    .single();

  if (error || !data) return null;
  return data.id;
}

/**
 * Hook: Get supplier's products from supplier_products junction table
 */
export function useSupplierJunctionProducts(params?: ProductListParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['supplier-junction-products', user?.id, params],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) throw new Error('Supplier not found');

      let query = supabase
        .from('supplier_products')
        .select(`
          id,
          price,
          previous_price,
          price_change,
          stock_quantity,
          availability,
          is_active,
          is_featured,
          quality,
          origin,
          supplier_sku,
          min_order_quantity,
          delivery_days,
          updated_at,
          product_id,
          products (
            id,
            name,
            category,
            unit,
            images,
            description,
            product_variations (
              id,
              variation_type,
              variation_value,
              display_order,
              metadata
            )
          )
        `, { count: 'exact' })
        .eq('supplier_id', supplierId);

      // Apply filters
      if (params?.filters) {
        const { category, minPrice, maxPrice, inStock, status } = params.filters;

        if (category) {
          query = query.filter('products', 'category', 'eq', category);
        }

        if (minPrice !== undefined) {
          query = query.gte('price', minPrice);
        }

        if (maxPrice !== undefined) {
          query = query.lte('price', maxPrice);
        }

        if (inStock) {
          query = query.gt('stock_quantity', 0);
        }

        if (status === 'active') {
          query = query.eq('is_active', true);
        } else if (status === 'inactive') {
          query = query.eq('is_active', false);
        }
      }

      // Apply sorting
      const sortBy = params?.sortBy || 'modified_desc';
      const [column, order] = sortBy.split('_');

      const columnMap: Record<string, string> = {
        modified: 'updated_at',
        name: 'products.name',
        price: 'price',
        stock: 'stock_quantity',
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

      type SupplierJunctionRow = {
        id: string;
        price: string | number;
        previous_price: string | number | null;
        price_change: 'increased' | 'decreased' | 'stable';
        stock_quantity: number;
        availability: 'plenty' | 'limited' | 'last';
        is_active: boolean;
        is_featured: boolean;
        quality: 'premium' | 'standart' | 'ekonomik';
        origin: string;
        supplier_sku: string | null;
        min_order_quantity: number;
        delivery_days: number;
        updated_at: string;
        product_id: string;
        products: {
          name: string;
          description: string | null;
          category: string;
          unit: string;
          images: string[] | null;
          product_variations: Array<{
            id: string;
            variation_type: string;
            variation_value: string;
            display_order: number;
            metadata: Record<string, unknown> | null;
          }>;
        } | null;
      };

      const products: SupplierProduct[] = (data || []).map((sp: SupplierJunctionRow) => {
        const parsedPrice = typeof sp.price === 'string' ? parseFloat(sp.price) : sp.price;

        // Group variations by variation_type
        const variationsMap = new Map<string, ProductVariationsGrouped>();
        for (const v of sp.products?.product_variations || []) {
          if (!variationsMap.has(v.variation_type)) {
            variationsMap.set(v.variation_type, {
              variation_type: v.variation_type as ProductVariationType,
              values: [],
            });
          }
          variationsMap.get(v.variation_type)!.values.push({
            value: v.variation_value,
            display_order: v.display_order,
            metadata: v.metadata as Record<string, unknown> | null,
          });
        }
        const groupedVariations = Array.from(variationsMap.values());

        return {
          id: sp.id,
          supplier_product_id: sp.id,
          product_id: sp.product_id,
          name: sp.products?.name || '',
          description: sp.products?.description || null,
          category: sp.products?.category || '',
          price: parsedPrice,
          base_price: parsedPrice, // Backward compatibility
          previous_price: sp.previous_price ? (typeof sp.previous_price === 'string' ? parseFloat(sp.previous_price) : sp.previous_price) : null,
          price_change: sp.price_change,
          unit: sp.products?.unit || '',
          stock: sp.stock_quantity,
          availability: sp.availability,
          is_active: sp.is_active,
          is_featured: sp.is_featured,
          quality: sp.quality,
          origin: sp.origin,
          supplier_sku: sp.supplier_sku,
          min_order_quantity: sp.min_order_quantity,
          delivery_days: sp.delivery_days,
          images: sp.products?.images || [],
          updated_at: sp.updated_at,
          variations: groupedVariations,
        };
      });

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
 * Hook: Create supplier product (link product to supplier)
 */
export function useCreateSupplierJunctionProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: SupplierProductFormData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) throw new Error('Supplier not found');

      const { data, error } = await supabase
        .from('supplier_products')
        .insert({
          supplier_id: supplierId,
          product_id: formData.product_id,
          price: formData.price,
          stock_quantity: formData.stock_quantity,
          availability: formData.availability,
          quality: formData.quality || 'standart',
          origin: formData.origin || 'Türkiye',
          min_order_quantity: formData.min_order_quantity || 1,
          delivery_days: formData.delivery_days || 1,
          is_featured: formData.is_featured || false,
          is_active: formData.is_active !== false,
          supplier_sku: formData.supplier_sku,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Ürün tedarikçiye bağlandı');
    },
    onError: (error: Error) => {
      toast.error('İşlem başarısız: ' + error.message);
    },
  });
}

/**
 * Hook: Update supplier product in junction table
 */
export function useUpdateSupplierJunctionProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierProductId,
      formData,
    }: {
      supplierProductId: string;
      formData: Partial<SupplierProductFormData>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: {
        updated_at: string;
        price?: number;
        stock_quantity?: number;
        availability?: 'plenty' | 'limited' | 'last';
        quality?: 'premium' | 'standart' | 'ekonomik';
        origin?: string;
        supplier_sku?: string;
        min_order_quantity?: number;
        delivery_days?: number;
        is_featured?: boolean;
        is_active?: boolean;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (formData.price !== undefined) updateData.price = formData.price;
      if (formData.stock_quantity !== undefined) updateData.stock_quantity = formData.stock_quantity;
      if (formData.availability !== undefined) updateData.availability = formData.availability;
      if (formData.quality !== undefined) updateData.quality = formData.quality;
      if (formData.origin !== undefined) updateData.origin = formData.origin;
      if (formData.supplier_sku !== undefined) updateData.supplier_sku = formData.supplier_sku;
      if (formData.min_order_quantity !== undefined) updateData.min_order_quantity = formData.min_order_quantity;
      if (formData.delivery_days !== undefined) updateData.delivery_days = formData.delivery_days;
      if (formData.is_featured !== undefined) updateData.is_featured = formData.is_featured;
      if (formData.is_active !== undefined) updateData.is_active = formData.is_active;

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
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Tedarikçi ürünü güncellendi');
    },
    onError: (error: Error) => {
      toast.error('İşlem başarısız: ' + error.message);
    },
  });
}

/**
 * Hook: Delete supplier product from junction table
 */
export function useDeleteSupplierJunctionProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierProductId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', supplierProductId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
      toast.success('Tedarikçi ürünü silindi');
    },
    onError: (error: Error) => {
      toast.error('İşlem başarısız: ' + error.message);
    },
  });
}

/**
 * Hook: Bulk update supplier product status
 */
export function useBulkUpdateSupplierStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierProductIds,
      is_active,
    }: {
      supplierProductIds: string[];
      is_active: boolean;
    }): Promise<SupplierProductBulkResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const succeeded: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const id of supplierProductIds) {
        const { error } = await supabase
          .from('supplier_products')
          .update({ is_active, updated_at: new Date().toISOString() })
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
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });

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
 * Hook: Get products available to link (not already linked to supplier)
 */
export function useAvailableProductsToLink(searchQuery?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-products-to-link', user?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id) return [];

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) return [];

      // Get products not already linked to this supplier
      let query = supabase
        .from('products')
        .select('id, name, category, unit, images')
        .eq('product_status', 'active')
        .eq('is_active', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data: allProducts, error: allError } = await query;

      if (allError) throw allError;

      // Get already linked product IDs
      const { data: linkedProducts, error: linkedError } = await supabase
        .from('supplier_products')
        .select('product_id')
        .eq('supplier_id', supplierId);

      if (linkedError) throw linkedError;

      const linkedIds = new Set(linkedProducts?.map((lp) => lp.product_id) || []);

      // Filter out already linked products
      const availableProducts = (allProducts || []).filter((p) => !linkedIds.has(p.id));

      return availableProducts;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// Phase 12: Multi-Supplier Consumer-Facing Hooks
// ============================================================================

/**
 * Hook: Get all suppliers for a single product (for Bugün Halde comparison)
 * Returns supplier_products with supplier info ordered by price
 */
export function useSuppliersForProduct(productId: string) {
  return useQuery({
    queryKey: ['product-suppliers', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID required');

      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          id,
          price,
          previous_price,
          price_change,
          stock_quantity,
          availability,
          quality,
          origin,
          delivery_days,
          min_order_quantity,
          is_featured,
          supplier_id,
          suppliers (
            id,
            business_name,
            region,
            rating,
            approval_status
          ),
          products (
            id,
            name,
            unit,
            images
          )
        `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      return data || [];
    },
    enabled: !!productId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook: Get lowest price for a product (for cart/product cards)
 * Returns the cheapest active supplier product
 */
export function useLowestPrice(productId: string) {
  return useQuery({
    queryKey: ['product-lowest-price', productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('supplier_products')
        .select('id, price, supplier_id, stock_quantity, availability')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
    enabled: !!productId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook: Update product variations (inline from table)
 * Phase 12: Updates product_variations table with optimistic updates
 */
export function useUpdateProductVariations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      variations,
    }: {
      productId: string;
      variations: ProductVariationsGrouped[];
    }): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get supplier ID
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, approval_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supplierError) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen iletişime geçin.' };
      }

      if (!supplier) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı. Lütfen önce tedarikçi başvurusu yapın.' };
      }

      if (supplier.approval_status !== 'approved') {
        return { success: false, error: 'Tedarikçi başvurunuz henüz onaylanmadı. Onay bekleniyor.' };
      }

      // Get actual product_id from supplier_products
      const { data: supplierProduct, error: fetchError } = await supabase
        .from('supplier_products')
        .select('product_id')
        .eq('product_id', productId)
        .eq('supplier_id', supplier.id)
        .single();

      if (fetchError || !supplierProduct) {
        return { success: false, error: 'Ürün bulunamadı' };
      }

      const actualProductId = supplierProduct.product_id;

      // Delete existing variations
      const { error: deleteError } = await supabase
        .from('product_variations')
        .delete()
        .eq('product_id', actualProductId);

      if (deleteError) {
        return { success: false, error: 'Varyasyonlar silinirken hata: ' + deleteError.message };
      }

      // Insert new variations if provided
      if (variations.length > 0) {
        const variationsToInsert = flattenVariationsForInsert(actualProductId, variations);
        if (variationsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('product_variations')
            .insert(variationsToInsert);

          if (insertError) {
            return { success: false, error: 'Varyasyonlar eklenirken hata: ' + insertError.message };
          }
        }
      }

      return { success: true };
    },
    // Optimistic update
    onMutate: async ({ productId, variations }) => {
      await queryClient.cancelQueries({ queryKey: ['supplier-junction-products'] });
      const previousProducts = queryClient.getQueryData(['supplier-junction-products']);

      queryClient.setQueryData(['supplier-junction-products'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products?.map((p: SupplierProduct) =>
            p.product_id === productId || p.id === productId
              ? { ...p, variations }
              : p
          ),
        };
      });

      return { previousProducts };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['supplier-junction-products'], context?.previousProducts);
      toast.error('Varyasyonlar güncellenirken hata: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Varyasyonlar güncellendi');
      }
    },
  });
}

/**
 * Hook: Get Bugün Halde products with price comparisons
 * Returns products with multiple suppliers ordered by price variance
 */
export function useBugunHaldeProducts(params?: {
  category?: string;
  region?: string;
  searchQuery?: string;
  minSuppliers?: number;
}) {
  return useQuery({
    queryKey: ['bugun-halde', params],
    queryFn: async () => {
      // Build query to find products with multiple suppliers
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          unit,
          images,
          description,
          supplier_products (
            id,
            price,
            previous_price,
            price_change,
            stock_quantity,
            availability,
            quality,
            is_featured,
            supplier_id,
            suppliers (
              id,
              business_name,
              region,
              rating
            )
          )
        `)
        .eq('is_active', true)
        .eq('product_status', 'active');

      // Apply filters
      if (params?.category) {
        query = query.eq('category', params.category);
      }

      if (params?.searchQuery) {
        query = query.ilike('name', `%${params.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter and transform data
      type ProductWithSuppliers = {
        id: string;
        name: string;
        category: string;
        unit: string;
        images: string[] | null;
        description: string | null;
        supplier_products: Array<{
          id: string;
          price: string | number;
          previous_price: string | number | null;
          price_change: 'increased' | 'decreased' | 'stable';
          stock_quantity: number;
          availability: 'plenty' | 'limited' | 'last';
          quality: 'premium' | 'standart' | 'ekonomik';
          is_featured: boolean;
          supplier_id: string;
          suppliers: {
            id: string;
            business_name: string;
            region: string;
            rating: number | null;
          } | null;
        }>;
      };

      const products = (data || [])
        .map((p: ProductWithSuppliers) => ({
          ...p,
          supplier_products: p.supplier_products.filter(sp => sp.suppliers !== null),
        }))
        .filter((p: ProductWithSuppliers) => {
          // Filter by minimum supplier count
          const minSuppliers = params?.minSuppliers || 2;
          if (p.supplier_products.length < minSuppliers) return false;

          // Filter by region if specified
          if (params?.region) {
            return p.supplier_products.some(sp =>
              sp.suppliers?.region.toLowerCase() === params.region.toLowerCase()
            );
          }

          return true;
        })
        .sort((a: ProductWithSuppliers, b: ProductWithSuppliers) => {
          // Sort by price variance (most variance first = better deals)
          const aPrices = a.supplier_products.map(sp => typeof sp.price === 'string' ? parseFloat(sp.price) : sp.price);
          const bPrices = b.supplier_products.map(sp => typeof sp.price === 'string' ? parseFloat(sp.price) : sp.price);
          const aVariance = Math.max(...aPrices) - Math.min(...aPrices);
          const bVariance = Math.max(...bPrices) - Math.min(...bPrices);
          return bVariance - aVariance;
        });

      return products;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
