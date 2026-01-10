// Supplier Products API Service
// Business logic layer for supplier product operations

import { supabase } from '@/integrations/supabase/client';
import type {
  GlobalProductCatalogItem,
  GlobalCatalogResponse,
  CatalogFilters,
  UpdatePriceData,
  LinkProductData,
} from '@/types/supplier';

// ============================================================================
// TYPES
// ============================================================================

export interface ProductPriceStats {
  product_id: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  supplier_count: number;
}

export interface SupplierProductInfo {
  supplier_product_id: string;
  supplier_id: string;
  supplier_name: string;
  price: number;
  previous_price: number | null;
  price_change: 'increased' | 'decreased' | 'stable';
  stock_quantity: number;
  availability: 'plenty' | 'limited' | 'last';
  quality: 'premium' | 'standart' | 'ekonomik';
  delivery_days: number;
  is_featured: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get supplier ID from user ID
 */
export async function getSupplierId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', userId)
    .eq('approval_status', 'approved')
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

/**
 * Calculate price change direction
 */
export function calculatePriceChange(
  newPrice: number,
  previousPrice: number | null
): 'increased' | 'decreased' | 'stable' {
  if (!previousPrice) return 'stable';
  if (newPrice > previousPrice) return 'increased';
  if (newPrice < previousPrice) return 'decreased';
  return 'stable';
}

/**
 * Calculate availability from stock quantity
 */
export function calculateAvailability(
  stock: number
): 'plenty' | 'limited' | 'last' {
  if (stock > 10) return 'plenty';
  if (stock > 0) return 'limited';
  return 'last';
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get global product catalog with supplier's price overlay
 *
 * @param supplierId - Supplier's ID
 * @param params - Query parameters (pagination, filters, sorting)
 * @returns Catalog response with products and pagination info
 */
export async function getGlobalProductCatalog(
  supplierId: string,
  params?: {
    page?: number;
    pageSize?: number;
    filters?: CatalogFilters;
    sortBy?: string;
  }
): Promise<GlobalCatalogResponse> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Build query with products and supplier's pricing
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
      product_variations (id)
    `, { count: 'exact' })
    .eq('product_status', 'active')
    .eq('is_active', true);

  // Apply filters
  if (params?.filters) {
    const { query: searchQuery, category, minPrice, maxPrice, inStock } = params.filters;

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Note: Price and stock filters need to be applied after fetching supplier data
  }

  // Apply sorting
  const sortBy = params?.sortBy || 'name_asc';
  const [column, order] = sortBy.split('_');

  const columnMap: Record<string, string> = {
    name: 'name',
    category: 'category',
    modified: 'updated_at',
  };
  const dbColumn = columnMap[column] || 'name';

  query = query.order(dbColumn, { ascending: order === 'asc' });

  // Apply pagination
  query = query.range(from, to);

  const { data: products, error: productsError, count } = await query;

  if (productsError) {
    throw new Error('Products query failed: ' + productsError.message);
  }

  // Get supplier's products for these product IDs
  const productIds = (products || []).map((p) => p.id);

  const supplierProductsMap: Record<string, Record<string, unknown>> = {};

  if (productIds.length > 0) {
    const { data: supplierProducts } = await supabase
      .from('supplier_products')
      .select('product_id, id, price, stock_quantity, availability, is_active, is_featured, quality, origin, supplier_sku, min_order_quantity, delivery_days, updated_at')
      .eq('supplier_id', supplierId)
      .in('product_id', productIds);

    (supplierProducts || []).forEach((sp) => {
      supplierProductsMap[sp.product_id] = sp;
    });
  }

  // Get market statistics for all products
  const marketStatsMap: Record<string, ProductPriceStats> = {};

  if (productIds.length > 0) {
    const { data: marketStats } = await supabase
      .from('supplier_products')
      .select('product_id, price')
      .in('product_id', productIds)
      .eq('is_active', true);

    // Group by product_id and calculate stats
    const grouped: Record<string, number[]> = {};
    (marketStats || []).forEach((stat) => {
      const price = typeof stat.price === 'string' ? parseFloat(stat.price) : stat.price;
      if (!grouped[stat.product_id]) {
        grouped[stat.product_id] = [];
      }
      grouped[stat.product_id].push(price);
    });

    Object.keys(grouped).forEach((productId) => {
      const prices = grouped[productId];
      marketStatsMap[productId] = {
        product_id: productId,
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
        avg_price: prices.reduce((a, b) => a + b, 0) / prices.length,
        supplier_count: prices.length,
      };
    });
  }

  // Combine data
  const catalogItems: GlobalProductCatalogItem[] = (products || []).map((product) => {
    const sp = supplierProductsMap[product.id];
    const stats = marketStatsMap[product.id];

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      unit: product.unit,
      description: product.description,
      images: product.images || [],

      // Supplier data
      supplier_product_id: sp?.id || null,
      supplier_price: sp ? parseFloat(sp.price) : null,
      supplier_stock: sp?.stock_quantity || null,
      supplier_availability: sp?.availability || null,
      supplier_is_active: sp?.is_active ?? null,
      supplier_is_featured: sp?.is_featured ?? null,
      supplier_quality: sp?.quality || null,
      supplier_origin: sp?.origin || null,
      supplier_sku: sp?.supplier_sku || null,
      supplier_min_order_quantity: sp?.min_order_quantity || null,
      supplier_delivery_days: sp?.delivery_days || null,
      supplier_updated_at: sp?.updated_at || null,

      // Market stats
      market_min_price: stats?.min_price || null,
      market_max_price: stats?.max_price || null,
      market_avg_price: stats?.avg_price || null,
      market_supplier_count: stats?.supplier_count || 0,

      // Variations
      has_variations: (product.product_variations?.length || 0) > 0,

      // Timestamps
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  });

  // Apply client-side filters for price/stock (since they depend on supplier data)
  let filteredItems = catalogItems;

  if (params?.filters) {
    const { minPrice, maxPrice, inStock, onlyLinked, onlyUnlinked } = params.filters;

    if (onlyLinked) {
      filteredItems = filteredItems.filter((item) => item.supplier_product_id !== null);
    }

    if (onlyUnlinked) {
      filteredItems = filteredItems.filter((item) => item.supplier_product_id === null);
    }

    if (minPrice !== undefined) {
      filteredItems = filteredItems.filter((item) =>
        item.supplier_price !== null && item.supplier_price >= minPrice
      );
    }

    if (maxPrice !== undefined) {
      filteredItems = filteredItems.filter((item) =>
        item.supplier_price !== null && item.supplier_price <= maxPrice
      );
    }

    if (inStock) {
      filteredItems = filteredItems.filter((item) =>
        item.supplier_stock !== null && item.supplier_stock > 0
      );
    }
  }

  return {
    products: filteredItems,
    total: count || 0,
    page,
    pageSize,
    hasMore: from + pageSize < (count || 0),
  };
}

/**
 * Upsert supplier product price
 *
 * Creates or updates supplier's pricing for a product
 *
 * @param supplierId - Supplier's ID
 * @param data - Price update data
 * @returns Success status
 */
export async function upsertSupplierProductPrice(
  supplierId: string,
  data: UpdatePriceData
): Promise<{ success: boolean; error?: string }> {
  // Check if supplier_product exists
  const { data: existingSp } = await supabase
    .from('supplier_products')
    .select('id, previous_price')
    .eq('supplier_id', supplierId)
    .eq('product_id', data.productId)
    .maybeSingle();

  if (!existingSp) {
    return { success: false, error: 'Ürün katalogunuzda bulunamadı' };
  }

  // Calculate price change
  const previousPrice = existingSp.previous_price
    ? parseFloat(existingSp.previous_price as string)
    : null;
  const newPrice = data.price;
  const priceChange = calculatePriceChange(newPrice, previousPrice);

  // Update data
  const updateData: {
    price: number;
    previous_price?: number;
    price_change: 'increased' | 'decreased' | 'stable';
    stock_quantity?: number;
    availability?: 'plenty' | 'limited' | 'last';
    last_price_update: string;
    updated_at: string;
  } = {
    price: newPrice,
    price_change: priceChange,
    last_price_update: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (previousPrice && previousPrice !== newPrice) {
    updateData.previous_price = previousPrice;
  }

  if (data.stock !== undefined) {
    updateData.stock_quantity = data.stock;
  }

  if (data.availability) {
    updateData.availability = data.availability;
  } else if (data.stock !== undefined) {
    updateData.availability = calculateAvailability(data.stock);
  }

  const { error } = await supabase
    .from('supplier_products')
    .update(updateData)
    .eq('id', existingSp.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Link product to supplier's catalog
 *
 * @param supplierId - Supplier's ID
 * @param data - Product link data
 * @returns Success status
 */
export async function linkProductToSupplier(
  supplierId: string,
  data: LinkProductData
): Promise<{ success: boolean; error?: string }> {
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

  const availability = data.availability
    || calculateAvailability(data.stockQuantity);

  const { error } = await supabase
    .from('supplier_products')
    .insert({
      supplier_id: supplierId,
      product_id: data.productId,
      price: data.price,
      stock_quantity: data.stockQuantity,
      availability,
      quality: data.quality || 'standart',
      origin: data.origin || 'Türkiye',
      supplier_sku: data.supplierSku,
      min_order_quantity: data.minOrderQuantity || 1,
      delivery_days: data.deliveryDays || 1,
      is_featured: data.isFeatured || false,
      is_active: true,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Unlink product from supplier's catalog
 *
 * @param supplierId - Supplier's ID
 * @param productId - Product ID to unlink
 * @returns Success status
 */
export async function unlinkProductFromSupplier(
  supplierId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('supplier_products')
    .delete()
    .eq('supplier_id', supplierId)
    .eq('product_id', productId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Search products by name/category
 *
 * @param query - Search query
 * @param category - Optional category filter
 * @param limit - Max results
 * @returns Matching products
 */
export async function searchProducts(
  query: string,
  options?: {
    category?: string;
    limit?: number;
    excludeSupplierId?: string;
  }
): Promise<Array<{
  id: string;
  name: string;
  category: string;
  unit: string;
  images: string[];
}>> {
  const limit = options?.limit || 50;

  let dbQuery = supabase
    .from('products')
    .select('id, name, category, unit, images')
    .eq('product_status', 'active')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (options?.category) {
    dbQuery = dbQuery.eq('category', options.category);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error('Search failed: ' + error.message);
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    images: p.images || [],
  }));
}

/**
 * Get product categories
 *
 * @returns Unique categories
 */
export async function getProductCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)
    .eq('product_status', 'active');

  if (error) {
    throw new Error('Failed to fetch categories: ' + error.message);
  }

  const categories = Array.from(
    new Set((data || []).map((p) => p.category))
  ).sort();

  return categories;
}

/**
 * Get suppliers for a product (for market comparison)
 *
 * @param productId - Product ID
 * @returns Array of supplier product info
 */
export async function getProductSuppliers(
  productId: string
): Promise<SupplierProductInfo[]> {
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
      delivery_days,
      is_featured,
      supplier_id,
      suppliers (
        id,
        name
      )
    `)
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch suppliers: ' + error.message);
  }

  return (data || []).map((sp) => ({
    supplier_product_id: sp.id,
    supplier_id: sp.supplier_id,
    supplier_name: sp.suppliers?.name || 'Bilinmeyen Tedarikçi',
    price: parseFloat(sp.price as string),
    previous_price: sp.previous_price ? parseFloat(sp.previous_price as string) : null,
    price_change: sp.price_change,
    stock_quantity: sp.stock_quantity,
    availability: sp.availability,
    quality: sp.quality,
    delivery_days: sp.delivery_days,
    is_featured: sp.is_featured,
  }));
}

/**
 * Get product price statistics
 *
 * @param productId - Product ID
 * @returns Price statistics
 */
export async function getProductPriceStats(
  productId: string
): Promise<ProductPriceStats | null> {
  const { data, error } = await supabase
    .from('supplier_products')
    .select('price')
    .eq('product_id', productId)
    .eq('is_active', true);

  if (error) {
    throw new Error('Failed to fetch price stats: ' + error.message);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const prices = data.map((p) => parseFloat(p.price as string));

  return {
    product_id: productId,
    min_price: Math.min(...prices),
    max_price: Math.max(...prices),
    avg_price: prices.reduce((a, b) => a + b, 0) / prices.length,
    supplier_count: prices.length,
  };
}
