// Global Product Catalog Hook (Phase 12+)
// Shows all products with supplier's price overlay for easy management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  ProductActionResult,
} from '@/types/supplier';
import type {
  GlobalProductCatalogItem,
  GlobalCatalogResponse,
  CatalogFilters,
  UpdatePriceData,
  LinkProductData,
} from '@/types/supplier';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get supplier ID from user
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
 * Convert database row to GlobalProductCatalogItem
 */
function toCatalogItem(
  row: Record<string, unknown>,
  supplierId: string | null
): GlobalProductCatalogItem {
  // Supplier data from the LEFT JOIN
  const sp = (row.supplier_products as Array<Record<string, unknown>>)?.[0];

  // Market stats from aggregation
  const marketStats = (row.market_stats as Array<Record<string, unknown>>)?.[0];

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug ?? ''),
    category: String(row.category),
    unit: String(row.unit),
    description: row.description as string | null,
    images: (row.images as string[]) || [],

    // Supplier's data (if linked)
    supplier_product_id: (sp?.id as string | null) || null,
    supplier_price: sp?.price ? parseFloat(String(sp.price)) : null,
    supplier_stock: (sp?.stock_quantity as number | null) || null,
    supplier_availability: (sp?.availability as 'plenty' | 'limited' | 'last' | null) || null,
    supplier_is_active: (sp?.is_active as boolean | null) ?? null,
    supplier_is_featured: (sp?.is_featured as boolean | null) ?? null,
    supplier_quality: (sp?.quality as 'premium' | 'standart' | 'ekonomik' | null) || null,
    supplier_origin: (sp?.origin as string | null) || null,
    supplier_sku: (sp?.supplier_sku as string | null) || null,
    supplier_min_order_quantity: (sp?.min_order_quantity as number | null) || null,
    supplier_delivery_days: (sp?.delivery_days as number | null) || null,
    supplier_updated_at: (sp?.updated_at as string | null) || null,

    // Market stats
    market_min_price: marketStats?.min_price ? parseFloat(String(marketStats.min_price)) : null,
    market_max_price: marketStats?.max_price ? parseFloat(String(marketStats.max_price)) : null,
    market_avg_price: marketStats?.avg_price ? parseFloat(String(marketStats.avg_price)) : null,
    market_supplier_count: (marketStats?.supplier_count as number | undefined) || 0,

    // Variations
    has_variations: (row.has_variations as boolean) || false,

    // Timestamps
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook: Get global product catalog with supplier's price overlay
 *
 * Features:
 * - Lists all products in the system
 * - Shows supplier's price if linked
 * - Shows market statistics (min/max/avg price)
 * - Search, filter, pagination support
 */
export function useGlobalProductCatalog(params?: {
  page?: number;
  pageSize?: number;
  filters?: CatalogFilters;
  sortBy?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['global-product-catalog', user?.id, params],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) throw new Error('Supplier not found');

      // Build base query with all products and market stats
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          category,
          unit,
          description,
          images,
          created_at,
          updated_at,
          has_variations,
          supplier_products!inner (
            id,
            price,
            stock_quantity,
            availability,
            is_active,
            is_featured,
            quality,
            origin,
            supplier_sku,
            min_order_quantity,
            delivery_days,
            updated_at
          ),
          market_stats (
            min_price,
            max_price,
            avg_price,
            supplier_count
          )
        `, { count: 'exact' })
        .eq('product_status', 'active')
        .eq('is_active', true);

      // Filter to only show this supplier's products
      query = query.filter('supplier_products', 'supplier_id', 'eq', supplierId);

      // Apply filters
      if (params?.filters) {
        const { query: searchQuery, category, minPrice, maxPrice, inStock } = params.filters;

        // Search query
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        // Category filter
        if (category) {
          query = query.eq('category', category);
        }

        // Price range filter (on supplier's price)
        if (minPrice !== undefined) {
          query = query.filter('supplier_products', 'price', 'gte', minPrice);
        }
        if (maxPrice !== undefined) {
          query = query.filter('supplier_products', 'price', 'lte', maxPrice);
        }

        // Stock filter
        if (inStock) {
          query = query.filter('supplier_products', 'stock_quantity', 'gt', 0);
        }
      }

      // Apply sorting
      const sortBy = params?.sortBy || 'name_asc';
      const [column, order] = sortBy.split('_');

      const columnMap: Record<string, string> = {
        name: 'name',
        price: 'supplier_products.price',
        stock: 'supplier_products.stock_quantity',
        modified: 'updated_at',
        category: 'category',
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

      const products: GlobalProductCatalogItem[] = (data || []).map((row) =>
        toCatalogItem(row as Record<string, unknown>, supplierId)
      );

      const total = count || 0;

      return {
        products,
        total,
        page,
        pageSize,
        hasMore: from + pageSize < total,
      } as GlobalCatalogResponse;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook: Get all available products (not linked to supplier)
 *
 * Shows products that the supplier can add to their catalog
 */
export function useAvailableProducts(params?: {
  searchQuery?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-products', user?.id, params],
    queryFn: async () => {
      if (!user?.id) return { products: [], total: 0 };

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) return { products: [], total: 0 };

      // Get products NOT linked to this supplier
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // First get all active product IDs
      let query = supabase
        .from('products')
        .select('id, name, category, unit, images', { count: 'exact' })
        .eq('product_status', 'active')
        .eq('is_active', true);

      if (params?.searchQuery) {
        query = query.ilike('name', `%${params.searchQuery}%`);
      }

      if (params?.category) {
        query = query.eq('category', params.category);
      }

      query = query.range(from, to);

      const { data: allProducts, error: allError, count } = await query;

      if (allError) throw allError;

      // Get already linked product IDs
      const { data: linkedProducts } = await supabase
        .from('supplier_products')
        .select('product_id')
        .eq('supplier_id', supplierId);

      const linkedIds = new Set(linkedProducts?.map((lp) => lp.product_id) || []);

      // Filter out already linked products
      const availableProducts = (allProducts || [])
        .filter((p) => !linkedIds.has(p.id))
        .map((p): GlobalProductCatalogItem => ({
          id: p.id,
          name: p.name,
          slug: '',
          category: p.category,
          unit: p.unit,
          description: null,
          images: p.images || [],
          supplier_product_id: null,
          supplier_price: null,
          supplier_stock: null,
          supplier_availability: null,
          supplier_is_active: null,
          supplier_is_featured: null,
          supplier_quality: null,
          supplier_origin: null,
          supplier_sku: null,
          supplier_min_order_quantity: null,
          supplier_delivery_days: null,
          supplier_updated_at: null,
          market_min_price: null,
          market_max_price: null,
          market_avg_price: null,
          market_supplier_count: 0,
          has_variations: false,
          created_at: '',
          updated_at: '',
        }));

      return {
        products: availableProducts,
        total: count ? count - linkedIds.size : 0,
        page,
        pageSize,
        hasMore: from + pageSize < (count || 0),
      } as GlobalCatalogResponse;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Update supplier's price for a product
 */
export function useUpdateCatalogPrice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      price,
      stock,
      availability,
    }: UpdatePriceData): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı' };
      }

      // Check if supplier_product exists
      const { data: existingSp } = await supabase
        .from('supplier_products')
        .select('id, previous_price')
        .eq('supplier_id', supplierId)
        .eq('product_id', productId)
        .maybeSingle();

      if (!existingSp) {
        return { success: false, error: 'Ürün katalogunuzda bulunamadı. Önce ürünü ekleyin.' };
      }

      // Calculate price change
      const previousPrice = existingSp.previous_price ? parseFloat(String(existingSp.previous_price)) : null;
      const newPrice = price;
      let priceChange: 'increased' | 'decreased' | 'stable' = 'stable';

      if (previousPrice) {
        if (newPrice > previousPrice) priceChange = 'increased';
        else if (newPrice < previousPrice) priceChange = 'decreased';
      }

      // Update data
      const updateData: {
        price: number;
        previous_price?: number;
        price_change?: 'increased' | 'decreased' | 'stable';
        stock_quantity?: number;
        availability?: 'plenty' | 'limited' | 'last';
        last_price_update?: string;
        updated_at: string;
      } = {
        price,
        updated_at: new Date().toISOString(),
        last_price_update: new Date().toISOString(),
      };

      if (previousPrice && previousPrice !== newPrice) {
        updateData.previous_price = previousPrice;
        updateData.price_change = priceChange;
      }

      if (stock !== undefined) {
        updateData.stock_quantity = stock;
      }

      if (availability) {
        updateData.availability = availability;
      }

      const { error } = await supabase
        .from('supplier_products')
        .update(updateData)
        .eq('id', existingSp.id);

      if (error) {
        return { success: false, error: 'Fiyat güncellenemedi: ' + error.message };
      }

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Fiyat güncellendi');
      } else {
        toast.error(result.error || 'Fiyat güncellenemedi');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['global-product-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
    },
  });
}

/**
 * Hook: Update supplier's stock for a product (inline edit)
 */
export function useUpdateCatalogStock() {
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

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı' };
      }

      // Check if supplier_product exists
      const { data: existingSp } = await supabase
        .from('supplier_products')
        .select('id')
        .eq('supplier_id', supplierId)
        .eq('product_id', productId)
        .maybeSingle();

      if (!existingSp) {
        return { success: false, error: 'Ürün katalogunuzda bulunamadı' };
      }

      // Calculate availability based on stock
      const availability: 'plenty' | 'limited' | 'last' = stock > 10 ? 'plenty' : stock > 0 ? 'limited' : 'last';

      const { error } = await supabase
        .from('supplier_products')
        .update({
          stock_quantity: stock,
          availability,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSp.id);

      if (error) {
        return { success: false, error: 'Stok güncellenemedi: ' + error.message };
      }

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Stok güncellendi');
      } else {
        toast.error(result.error || 'Stok güncellenemedi');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['global-product-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
    },
  });
}

/**
 * Hook: Update supplier's product status (inline toggle)
 */
export function useUpdateCatalogStatus() {
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

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı' };
      }

      // Check if supplier_product exists
      const { data: existingSp } = await supabase
        .from('supplier_products')
        .select('id')
        .eq('supplier_id', supplierId)
        .eq('product_id', productId)
        .maybeSingle();

      if (!existingSp) {
        return { success: false, error: 'Ürün katalogunuzda bulunamadı' };
      }

      const { error } = await supabase
        .from('supplier_products')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSp.id);

      if (error) {
        return { success: false, error: 'Durum güncellenemedi: ' + error.message };
      }

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Durum güncellendi');
      } else {
        toast.error(result.error || 'Durum güncellenemedi');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['global-product-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['bugun-halde'] });
    },
  });
}

/**
 * Hook: Link a product to supplier's catalog
 */
export function useLinkProductToCatalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LinkProductData): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı' };
      }

      // Check if already linked
      const { data: existing } = await supabase
        .from('supplier_products')
        .select('id')
        .eq('supplier_id', supplierId)
        .eq('product_id', data.productId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Bu ürün zaten kataloğunuzda mevcut' };
      }

      // Create supplier_product record
      const { error } = await supabase
        .from('supplier_products')
        .insert({
          supplier_id: supplierId,
          product_id: data.productId,
          price: data.price,
          stock_quantity: data.stockQuantity,
          availability: data.availability || (data.stockQuantity > 10 ? 'plenty' : data.stockQuantity > 0 ? 'limited' : 'last'),
          quality: data.quality || 'standart',
          origin: data.origin || 'Türkiye',
          supplier_sku: data.supplierSku,
          min_order_quantity: data.minOrderQuantity || 1,
          delivery_days: data.deliveryDays || 1,
          is_featured: data.isFeatured || false,
          is_active: true,
        });

      if (error) {
        return { success: false, error: 'Ürün eklenemedi: ' + error.message };
      }

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Ürün kataloğunuza eklendi');
      } else {
        toast.error(result.error || 'Ürün eklenemedi');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['global-product-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['available-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
    },
  });
}

/**
 * Hook: Unlink a product from supplier's catalog
 */
export function useUnlinkProductFromCatalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı' };
      }

      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('supplier_id', supplierId)
        .eq('product_id', productId);

      if (error) {
        return { success: false, error: 'Ürün kaldırılamadı: ' + error.message };
      }

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Ürün kataloğunuzdan kaldırıldı');
      } else {
        toast.error(result.error || 'Ürün kaldırılamadı');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['global-product-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['available-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
    },
  });
}

/**
 * Hook: Create new product in global catalog and link to supplier
 */
export function useCreateGlobalProduct() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: string;
      unit: string;
      description?: string;
      price: number;
      stockQuantity: number;
      availability?: 'plenty' | 'limited' | 'last';
      quality?: 'premium' | 'standart' | 'ekonomik';
      origin?: string;
    }): Promise<ProductActionResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      const supplierId = await getSupplierId(user.id);
      if (!supplierId) {
        return { success: false, error: 'Tedarikçi kaydınız bulunamadı' };
      }

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          slug: data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
          category: data.category,
          unit: data.unit,
          description: data.description || null,
          product_status: 'active',
          is_active: true,
        })
        .select()
        .single();

      if (productError || !product) {
        return { success: false, error: 'Ürün oluşturulamadı: ' + (productError?.message || 'Bilinmeyen hata') };
      }

      // Link to supplier
      const { error: linkError } = await supabase
        .from('supplier_products')
        .insert({
          supplier_id: supplierId,
          product_id: product.id,
          price: data.price,
          stock_quantity: data.stockQuantity,
          availability: data.availability || (data.stockQuantity > 10 ? 'plenty' : data.stockQuantity > 0 ? 'limited' : 'last'),
          quality: data.quality || 'standart',
          origin: data.origin || 'Türkiye',
          min_order_quantity: 1,
          delivery_days: 1,
          is_featured: false,
          is_active: true,
        });

      if (linkError) {
        // Rollback product creation
        await supabase.from('products').delete().eq('id', product.id);
        return { success: false, error: 'Ürün tedarikçiye bağlanamadı: ' + linkError.message };
      }

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Yeni ürün oluşturuldu ve kataloğunuza eklendi');
      } else {
        toast.error(result.error || 'Ürün oluşturulamadı');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['global-product-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['available-products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-junction-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
    },
  });
}
