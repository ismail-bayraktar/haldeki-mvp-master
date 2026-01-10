/**
 * Supplier Product Catalog - Type Definitions
 *
 * RPC fonksiyonları için TypeScript tipleri
 */

import { AvailabilityStatus, PriceChange, QualityGrade } from './database.types'

// ============================================================================
// get_supplier_product_catalog
// ============================================================================

export interface SupplierProductCatalogParams {
  p_supplier_id: string
  p_page?: number
  p_page_size?: number
  p_category?: string | null
  p_search?: string | null
  p_only_active?: boolean
}

export interface SupplierProductCatalogItem {
  product_id: string
  product_name: string
  product_category: string
  product_unit: string
  product_image: string | null

  supplier_price: number | null
  supplier_previous_price: number | null
  supplier_stock_quantity: number | null
  supplier_availability: AvailabilityStatus | null

  has_supplier_product: boolean
  is_supplier_product_active: boolean
  supplier_product_id: string | null

  total_items: number
  current_page: number
  pages_count: number
}

export type SupplierProductCatalogResult = SupplierProductCatalogItem[]

// ============================================================================
// upsert_supplier_product_price
// ============================================================================

export interface UpsertSupplierProductParams {
  p_supplier_id: string
  p_product_id: string
  p_price: number
  p_stock_quantity?: number | null
  p_availability?: AvailabilityStatus | null
  p_min_order_quantity?: number | null
  p_delivery_days?: number | null
  p_supplier_sku?: string | null
  p_quality?: QualityGrade | null
}

export interface UpsertSupplierProductSuccess {
  success: true
  is_insert: boolean
  supplier_product_id: string
  supplier_id: string
  product_id: string
  price: number
  message: string
}

export interface UpsertSupplierProductError {
  success: false
  error: string
  code: 'FK_VIOLATION' | 'CHECK_VIOLATION' | 'UNIQUE_VIOLATION'
}

export type UpsertSupplierProductResult = UpsertSupplierProductSuccess | UpsertSupplierProductError

// ============================================================================
// get_supplier_product_stats
// ============================================================================

export type SupplierProductStatName =
  | 'total_products'
  | 'in_stock'
  | 'out_of_stock'
  | 'price_increased'
  | 'price_decreased'

export interface SupplierProductStat {
  stat_name: SupplierProductStatName
  stat_value: number
}

export type SupplierProductStatsResult = SupplierProductStat[]

// ============================================================================
// batch_upsert_supplier_prices
// ============================================================================

export interface BatchProductInput {
  product_id: string
  price: number
  stock_quantity?: number
  availability?: AvailabilityStatus
  min_order_quantity?: number
  delivery_days?: number
  supplier_sku?: string
  quality?: QualityGrade
}

export interface BatchUpsertResult {
  product_id: string
  success: boolean
  message: string
  supplier_product_id: string | null
}

export type BatchUpsertSupplierPricesResult = BatchUpsertResult[]

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Form için kullanılan input type
 */
export interface SupplierProductFormInput {
  productId: string
  price: number
  stockQuantity?: number
  availability?: AvailabilityStatus
  minOrderQuantity?: number
  deliveryDays?: number
  supplierSku?: string
  quality?: QualityGrade
}

/**
 * Catalog item - UI için daha basit hali
 */
export interface CatalogProduct {
  id: string // product_id
  name: string
  category: string
  unit: string
  image: string | null

  // Tedarikçi verisi (opsiyonel)
  supplierProduct?: {
    id: string
    price: number
    previousPrice?: number
    stockQuantity: number
    availability: AvailabilityStatus
    isActive: boolean
  }
}

/**
 * Pagination meta
 */
export interface PaginationMeta {
  totalItems: number
  currentPage: number
  pageSize: number
  pagesCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Paginated response
 */
export interface PaginatedCatalogResponse {
  items: CatalogProduct[]
  meta: PaginationMeta
}

// ============================================================================
// Type Guards
// ============================================================================

export function isUpsertSuccess(
  result: UpsertSupplierProductResult
): result is UpsertSupplierProductSuccess {
  return result.success === true
}

export function isUpsertError(
  result: UpsertSupplierProductResult
): result is UpsertSupplierProductError {
  return result.success === false
}

// ============================================================================
// Transformers
// ============================================================================

/**
 * RPC sonucunu UI formatına dönüştür
 */
export function transformCatalogItem(
  item: SupplierProductCatalogItem
): CatalogProduct {
  return {
    id: item.product_id,
    name: item.product_name,
    category: item.product_category,
    unit: item.product_unit,
    image: item.product_image,
    supplierProduct: item.has_supplier_product
      ? {
          id: item.supplier_product_id!,
          price: item.supplier_price!,
          previousPrice: item.supplier_previous_price ?? undefined,
          stockQuantity: item.supplier_stock_quantity ?? 0,
          availability: item.supplier_availability ?? 'plenty',
          isActive: item.is_supplier_product_active,
        }
      : undefined,
  }
}

/**
 * Pagination meta'yı çıkar
 */
export function extractPaginationMeta(
  items: SupplierProductCatalogItem[]
): PaginationMeta {
  if (items.length === 0) {
    return {
      totalItems: 0,
      currentPage: 1,
      pageSize: 50,
      pagesCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }

  const first = items[0]
  return {
    totalItems: first.total_items,
    currentPage: first.current_page,
    pageSize: items.length,
    pagesCount: first.pages_count,
    hasNextPage: first.current_page < first.pages_count,
    hasPrevPage: first.current_page > 1,
  }
}

/**
 * Form input'u RPC parametrelerine dönüştür
 */
export function formToRpcParams(
  supplierId: string,
  form: SupplierProductFormInput
): UpsertSupplierProductParams {
  return {
    p_supplier_id: supplierId,
    p_product_id: form.productId,
    p_price: form.price,
    p_stock_quantity: form.stockQuantity ?? null,
    p_availability: form.availability ?? 'plenty',
    p_min_order_quantity: form.minOrderQuantity ?? null,
    p_delivery_days: form.deliveryDays ?? null,
    p_supplier_sku: form.supplierSku ?? null,
    p_quality: form.quality ?? 'standart',
  }
}
