// Supplier-specific types for Phase 9

/**
 * Product status enum for supplier product management
 */
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

/**
 * Supplier product interface - extends base Product with supplier-specific fields
 */
export interface SupplierProduct {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number;
  unit: string;
  stock: number;
  images: string[];
  product_status: ProductStatus;
  last_modified_by: string | null;
  last_modified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Product form data for creating/editing products
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
}

/**
 * Import error detail
 */
export interface ImportError {
  row: number;
  field: string;
  error: string;
  value: any;
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
