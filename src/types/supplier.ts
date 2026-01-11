// Supplier-specific types for Phase 9

import type { ProductVariationsGrouped } from './multiSupplier';

/**
 * Product status enum for supplier product management
 */
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

/**
 * Supplier product interface - extends base Product with supplier-specific fields
 *
 * Phase 12: Supports both old (products.supplier_id) and new (supplier_products junction) patterns
 * - For old pattern: uses supplier_id, base_price, product_status
 * - For new pattern: uses supplier_product_id, product_id, price, and extended fields
 *
 * Backward compatibility: Both price and base_price are supported (prefer price in new code)
 */
export interface SupplierProduct {
  // Identification
  id: string;
  supplier_id?: string; // Optional: Only in old pattern
  supplier_product_id?: string; // Phase 12: Junction table ID
  product_id?: string; // Phase 12: Reference to products table

  // Basic info
  name: string;
  description: string | null;
  category: string;

  // Pricing (backward compatible - prefer price for Phase 12)
  price?: number; // Phase 12: From supplier_products.price
  base_price?: number; // Legacy: From products.base_price

  // Unit and inventory
  unit: string;
  stock: number;

  // Images
  images: string[];

  // Status (legacy - for old pattern)
  product_status?: ProductStatus; // Optional: Only in old pattern

  // Phase 12: Extended fields from supplier_products
  previous_price?: number | null;
  price_change?: 'increased' | 'decreased' | 'stable';
  availability?: 'plenty' | 'limited' | 'last';
  is_active?: boolean;
  is_featured?: boolean;
  quality?: 'premium' | 'standart' | 'ekonomik';
  origin?: string;
  supplier_sku?: string | null;
  min_order_quantity?: number;
  delivery_days?: number;

  // Legacy tracking fields
  last_modified_by?: string | null;
  last_modified_at?: string | null;
  created_at?: string;
  updated_at: string;
}

/**
 * Standard product form data - used across ALL product forms
 * (supplier create/edit, admin create/edit)
 *
 * This ensures consistency in fields, validation, and UX across the entire application
 */
export interface StandardProductForm {
  name: string;
  description?: string;
  category: string;
  base_price: number;
  unit: string;
  stock: number;
  product_status?: ProductStatus;
  images?: File[];
  variations?: ProductVariationsGrouped[];
}

/**
 * Product form data for creating/editing products (legacy - for backward compatibility)
 * @deprecated Use StandardProductForm instead
 */
export interface ProductFormData {
  name: string;
  description?: string;
  category: string;
  base_price: number;
  unit: string;
  stock: number;
  images?: File[];
  product_status?: ProductStatus;
  variations?: ProductVariationsGrouped[];
}

/**
 * Supplier-specific product form data
 * Extends StandardProductForm with supplier-only fields
 */
export interface SupplierProductForm extends StandardProductForm {
  supplier_sku?: string;
  quality?: 'premium' | 'standart' | 'ekonomik';
  origin?: string;
  min_order_quantity?: number;
  delivery_days?: number;
}

/**
 * Image upload progress info
 */
export interface ImageUploadProgress {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

/**
 * Search filters for supplier product search
 */
export interface ProductSearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: ProductStatus;
}

/**
 * Sort options for product list
 */
export type ProductSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'stock_asc'
  | 'stock_desc'
  | 'modified_desc'
  | 'modified_asc';

/**
 * Product list params for pagination and filtering
 */
export interface ProductListParams {
  page?: number;
  pageSize?: number;
  filters?: ProductSearchFilters;
  sortBy?: ProductSortOption;
}

/**
 * Paginated product list response
 */
export interface ProductListResponse {
  products: SupplierProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Recent search item for search history
 */
export interface RecentSearch {
  query: string;
  timestamp: string;
  filters?: ProductSearchFilters;
}

/**
 * Inline price edit state
 */
export interface PriceEditState {
  isEditing: boolean;
  value: number;
  hasChanges: boolean;
}

/**
 * Product action result
 */
export interface ProductActionResult {
  success: boolean;
  product?: SupplierProduct;
  error?: string;
}

/**
 * Bulk product operation result
 */
export interface BulkProductResult {
  success: boolean;
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * Image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  compressedFile?: File;
}

// ============================================
// Phase 10: Import/Export Types
// ============================================

/**
 * Product import row from Excel/CSV
 */
export interface ProductImportRow {
  name: string;
  category: string;
  unit: string;
  basePrice: number;
  price: number;
  stock: number;
  origin: string;
  quality: string;
  availability: string;
  description: string | null;
  images: string[];
  variations?: ProductImportVariation[];
}

/**
 * Variation extracted from product name during import
 */
export interface ProductImportVariation {
  type: 'size' | 'packaging' | 'quality' | 'other';
  value: string;
  display_order: number;
  metadata?: Record<string, unknown>;
}

/**
 * Import error detail
 */
export interface ImportError {
  row: number;
  field: string;
  error: string;
  value: unknown;
}

/**
 * Import result from parsing Excel/CSV
 */
export interface ImportParseResult {
  success: boolean;
  rows: ProductImportRow[];
  errors: ImportError[];
  fileName: string;
  totalRows: number;
}

/**
 * Product import audit log entry
 */
export interface ProductImport {
  id: string;
  supplier_id: string;
  file_name: string;
  file_size: number;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: ImportError[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back';
  created_at: string;
  completed_at: string | null;
}

/**
 * Import execution result
 */
export interface ImportResult {
  success: boolean;
  importId: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  created: number;
  updated: number;
  errors: ImportError[];
}

/**
 * Export options
 */
export interface ExportOptions {
  format: 'xlsx' | 'csv';
  filter?: 'all' | 'active' | 'inactive';
  includeImages?: boolean;
  selectedIds?: string[];
}

// ============================================
// Global Product Catalog Types
// ============================================

/**
 * Global product with supplier's price overlay
 * Combines product catalog with supplier-specific pricing
 */
export interface GlobalProductCatalogItem {
  // Product identification
  id: string; // products.id
  name: string;
  slug: string;
  category: string;
  unit: string;
  description: string | null;
  images: string[];

  // Supplier's pricing (if linked)
  supplier_product_id: string | null;
  supplier_price: number | null;
  supplier_stock: number | null;
  supplier_availability: 'plenty' | 'limited' | 'last' | null;
  supplier_is_active: boolean | null;
  supplier_is_featured: boolean | null;
  supplier_quality: 'premium' | 'standart' | 'ekonomik' | null;
  supplier_origin: string | null;
  supplier_sku: string | null;
  supplier_min_order_quantity: number | null;
  supplier_delivery_days: number | null;
  supplier_updated_at: string | null;

  // Market statistics (across all suppliers)
  market_min_price: number | null;
  market_max_price: number | null;
  market_avg_price: number | null;
  market_supplier_count: number;

  // Product variations
  has_variations: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Catalog list response with pagination
 */
export interface GlobalCatalogResponse {
  products: GlobalProductCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Filter parameters for catalog
 */
export interface CatalogFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onlyLinked?: boolean; // Only show products already linked to supplier
  onlyUnlinked?: boolean; // Only show products NOT linked to supplier
  hasVariations?: boolean;
}

/**
 * Update price mutation data
 */
export interface UpdatePriceData {
  productId: string; // products.id
  price: number;
  stock?: number;
  availability?: 'plenty' | 'limited' | 'last';
}

/**
 * Link product to supplier data
 */
export interface LinkProductData {
  productId: string; // products.id
  price: number;
  stockQuantity: number;
  availability?: 'plenty' | 'limited' | 'last';
  quality?: 'premium' | 'standart' | 'ekonomik';
  origin?: string;
  supplierSku?: string;
  minOrderQuantity?: number;
  deliveryDays?: number;
  isFeatured?: boolean;
}
