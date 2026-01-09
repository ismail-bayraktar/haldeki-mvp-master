/**
 * Phase 12: Multi-Supplier Product Management Types
 *
 * Defines types for products with multiple suppliers and variations.
 * Supports:
 * - Multiple suppliers per product
 * - Structured product variations (size, type, scent, etc.)
 * - Price comparison across suppliers
 * - Supplier-specific inventory and pricing
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Product variation types from database enum
 *
 * Matches: product_variation_type in Postgres
 */
export type ProductVariationType =
  | 'size'      // 4 LT, 1.5 KG, 500 ML
  | 'type'      // BEYAZ, RENKLİ, SIVI, TOZ
  | 'scent'     // LAVANTA, LIMON, PORÇEL
  | 'packaging' // *4 (4-pack), *6, *12
  | 'material'  // CAM, PLASTIK, METAL
  | 'flavor'    // VANILLA, CİLEK, ÇİKOLATA
  | 'other';    // Catch-all for custom variations

// ============================================================================
// SUPPLIER PRODUCT TYPES
// ============================================================================

/**
 * Supplier product junction table record
 *
 * Links products with suppliers, containing supplier-specific:
 * - Pricing (price, previous_price, price_change)
 * - Inventory (stock_quantity, availability)
 * - Quality (quality, origin)
 * - Logistics (min_order_quantity, delivery_days)
 *
 * Table: supplier_products
 */
export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;

  // Pricing
  price: number;
  previous_price: number | null;
  price_change: 'increased' | 'decreased' | 'stable';

  // Inventory
  stock_quantity: number;
  availability: 'plenty' | 'limited' | 'last';

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Quality
  quality: 'premium' | 'standart' | 'ekonomik';
  origin: string;

  // Supplier metadata
  supplier_sku: string | null;
  min_order_quantity: number;
  delivery_days: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  last_price_update: string | null;
}

/**
 * Supplier product information (simplified for RPC responses)
 *
 * Returned by get_product_suppliers() function
 */
export interface SupplierProductInfo {
  supplier_product_id: string;  // The ID from supplier_products junction table
  supplier_id: string;
  supplier_name: string;
  price: number;
  previous_price: number | null;
  price_change: 'increased' | 'decreased' | 'stable';
  availability: 'plenty' | 'limited' | 'last';
  stock_quantity: number;
  quality: 'premium' | 'standart' | 'ekonomik';
  delivery_days: number;
  is_featured: boolean;
}

/**
 * Product with all its suppliers
 *
 * Used for displaying product comparison across suppliers
 */
export interface ProductWithSuppliers {
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
    image_url: string | null;
  };

  // All suppliers for this product
  suppliers: SupplierProductInfo[];

  // Price statistics across all suppliers
  stats: PriceStats;
}

/**
 * Price statistics for a product across all suppliers
 *
 * Calculated by get_product_price_stats() function
 */
export interface PriceStats {
  min_price: number;
  max_price: number;
  avg_price: number;
  supplier_count: number;
}

/**
 * Alias for PriceStats for consistency in hooks
 */
export type ProductPriceStats = PriceStats;

/**
 * "Bugün Halde" comparison item
 *
 * Shows how a product is priced across different suppliers
 * Used in bugun_halde_comparison view
 */
export interface BugunHaldeComparison {
  product_id: string;
  product_name: string;
  category: string;
  unit: string;
  image_url: string | null;

  supplier_id: string;
  supplier_name: string;

  price: number;
  previous_price: number | null;
  price_change: 'increased' | 'decreased' | 'stable';

  availability: 'plenty' | 'limited' | 'last';
  stock_quantity: number;
  quality: 'premium' | 'standart' | 'ekonomik';
  delivery_days: number;
  is_featured: boolean;

  // Market statistics
  market_min_price: number;
  market_max_price: number;
  market_avg_price: number;
  total_suppliers: number;

  // Is this supplier the lowest price?
  is_lowest_price: boolean;
}

/**
 * Row from bugun_halde_comparison database view
 *
 * Alias for BugunHaldeComparison for clearer usage in hooks
 */
export type BugunHaldeComparisonRow = BugunHaldeComparison;

/**
 * Bugün Halde filters
 */
export interface BugunHaldeFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: 'plenty' | 'limited' | 'last';
  quality?: 'premium' | 'standart' | 'ekonomik';
  onlyLowestPrice?: boolean;
  onlyFeatured?: boolean;
  minSuppliers?: number;
  searchQuery?: string;
}

// ============================================================================
// PRODUCT VARIATION TYPES
// ============================================================================

/**
 * Product variation definition
 *
 * Stores structured variation data (size, type, scent, etc.)
 * Normalized to avoid duplication across suppliers
 *
 * Table: product_variations
 */
export interface ProductVariation {
  id: string;
  product_id: string;
  variation_type: ProductVariationType;
  variation_value: string;
  display_order: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Supplier-specific variation
 *
 * Links supplier_products with product_variations
 * Allows suppliers to have different SKUs and pricing for variations
 *
 * Table: supplier_product_variations
 */
export interface SupplierProductVariation {
  id: string;
  supplier_product_id: string;
  variation_id: string;

  // Supplier-specific SKU for this variation
  supplier_variation_sku: string | null;

  // Price adjustment (added to base supplier product price)
  price_adjustment: number;

  // Stock for this specific variation
  stock_quantity: number;

  created_at: string;
  updated_at: string;
}

/**
 * Product with variations grouped by type
 *
 * Used for UI display of product variations
 * Output from get_product_variations() function
 */
export interface ProductVariationsGrouped {
  variation_type: ProductVariationType;
  values: Array<{
    value: string;
    display_order: number;
    metadata: Record<string, unknown> | null;
  }>;
}

/**
 * Supplier product with its variations
 *
 * Complete view of a supplier's product with all available variations
 * Used in supplier_catalog_with_variations view
 */
export interface SupplierProductWithVariations {
  supplier_id: string;
  supplier_name: string;
  product_id: string;
  product_name: string;
  category: string;
  unit: string;

  price: number;
  availability: 'plenty' | 'limited' | 'last';
  stock_quantity: number;
  is_featured: boolean;

  // Variations available from this supplier
  variations: Array<{
    type: ProductVariationType;
    value: string;
    metadata: Record<string, unknown> | null;
  }>;
}

/**
 * Supplier catalog item (alias for SupplierProductWithVariations)
 */
export type SupplierCatalogItem = SupplierProductWithVariations;

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

/**
 * Search parameters for supplier product search
 *
 * Used with search_supplier_products() function
 */
export interface SupplierProductSearchParams {
  supplier_id: string;
  search_text?: string;
  variation_types?: ProductVariationType[];
  min_price?: number;
  max_price?: number;
}

/**
 * Supplier product search result
 *
 * Returned by search_supplier_products() function
 */
export interface SupplierProductSearchResult {
  product_id: string;
  product_name: string;
  supplier_price: number;
  availability: 'plenty' | 'limited' | 'last';
  variations: Array<{
    type: ProductVariationType;
    value: string;
  }>;
}

// ============================================================================
// FORM AND MUTATION TYPES
// ============================================================================

/**
 * Form data for creating/editing supplier product
 */
export interface SupplierProductFormData {
  product_id: string;
  supplier_id: string;
  price: number;
  stock_quantity: number;
  availability: 'plenty' | 'limited' | 'last';
  quality?: 'premium' | 'standart' | 'ekonomik';
  origin?: string;
  supplier_sku?: string;
  min_order_quantity?: number;
  delivery_days?: number;
  is_featured?: boolean;
  is_active?: boolean;
}

/**
 * Form data for adding product variation
 */
export interface ProductVariationFormData {
  product_id: string;
  variation_type: ProductVariationType;
  variation_value: string;
  display_order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Form data for linking variation to supplier product
 */
export interface SupplierProductVariationFormData {
  supplier_product_id: string;
  variation_id: string;
  supplier_variation_sku?: string;
  price_adjustment?: number;
  stock_quantity?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Paginated supplier product list
 */
export interface SupplierProductListResponse {
  products: SupplierProduct[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Bulk operation result for supplier products
 */
export interface SupplierProductBulkResult {
  success: boolean;
  succeeded: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}
