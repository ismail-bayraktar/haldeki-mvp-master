/**
 * Yeni Fiyatlandırma Sistemi Tipleri
 * New Pricing System Types
 *
 * Tek kaynaklı fiyatlandırma sistemi için tip tanımları.
 * Single source of truth pricing system types.
 */

// ============================================================================
// COMMISSION TYPES
// ============================================================================

/**
 * Müşteri tipi bazlı komisyon oranları
 * Customer type based commission rates
 */
export interface CommissionRates {
  b2b_rate: number;      // B2B komisyon oranı (default: 0.30 = %30)
  b2c_rate: number;      // B2C komisyon oranı (default: 0.50 = %50)
}

/**
 * Varsayılan komisyon oranları
 * Default commission rates
 */
export const DEFAULT_COMMISSION_RATES: CommissionRates = {
  b2b_rate: 0.30,
  b2c_rate: 0.50,
};

/**
 * Müşteri tipi
 * Customer type for price calculation
 */
export type CustomerType = 'b2b' | 'b2c';

// ============================================================================
// PRICE CALCULATION TYPES
// ============================================================================

/**
 * Fiyat hesaplama girdileri
 * Price calculation inputs
 */
export interface PriceCalculationInput {
  product_id: string;
  region_id: string | null;
  customer_type: CustomerType;
  variation_id?: string | null;
  supplier_id?: string | null;
}

/**
 * Fiyat hesaplama sonucu
 * Price calculation result
 *
 * Matches the RPC function return type from calculate_product_price
 */
export interface PriceCalculationResult {
  // Product info
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  region_id: string | null;
  region_name: string | null;

  // Base pricing
  supplier_price: number;           // Tedarikçinin baz fiyatı
  regional_multiplier: number;      // Bölgesel çarpan (default: 1.0)
  variation_adjustment: number;     // Varyasyon fiyat farkı
  commission_rate: number;          // Komisyon oranı (b2b veya b2c)

  // Final prices
  b2b_price: number;                // B2B final price
  b2c_price: number;                // B2C final price
  final_price: number;              // Price based on user role

  // Metadata
  price_calculation_mode: string;
  regional_pricing_mode: string;
  calculated_at: string;

  // Availability
  availability: 'plenty' | 'limited' | 'last';
  stock_quantity: number;
  is_featured: boolean;
  price_rank: number;
}

/**
 * Sepet için fiyat hesaplama sonucu
 * Cart price calculation result
 */
export interface CartPriceCalculationResult extends PriceCalculationResult {
  quantity: number;
  total_price: number;              // final_price * quantity
}

// ============================================================================
// REGIONAL PRICING TYPES
// ============================================================================

/**
 * Bölgesel fiyatlandırma ayarları
 * Regional pricing configuration
 */
export interface RegionalPricingConfig {
  region_id: string;
  region_name: string;
  price_multiplier: number;         // Fiyat çarpanı (default: 1.0)
  is_active: boolean;
}

/**
 * Bölgesel çarpan veritabanı kaydı
 * Regional multiplier database record
 */
export interface RegionalMultiplier {
  id: string;
  region_id: string;
  multiplier: number;               // Örn: 1.1 = %10 artış
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SUPPLIER PRODUCT TYPES (Updated)
// ============================================================================

/**
 * Tedarikçi ürünü (fiyat yetkili kaynağı)
 * Supplier product (price authority source)
 */
export interface SupplierProductPrice {
  id: string;                       // supplier_products.id
  supplier_id: string;
  supplier_name: string;
  product_id: string;

  // Pricing (base price for all calculations)
  price: number;                    // Tedarikçinin satış fiyatı
  previous_price: number | null;
  price_change: 'increased' | 'decreased' | 'stable';

  // Inventory
  stock_quantity: number;
  availability: 'plenty' | 'limited' | 'last';

  // Logistics
  min_order_quantity: number;
  delivery_days: number;

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Quality
  quality: 'premium' | 'standart' | 'ekonomik';
  origin: string;

  // Timestamps
  last_price_update: string | null;
  updated_at: string;
}

// ============================================================================
// VARIATION PRICE TYPES
// ============================================================================

/**
 * Varyasyon fiyat ayarlaması
 * Variation price adjustment
 */
export interface VariationPriceAdjustment {
  variation_id: string;
  variation_type: string;           // size, type, scent, etc.
  variation_value: string;          // 4 LT, BEYAZ, LAVANTA, etc.
  price_adjustment: number;         // Fiyata eklenecek tutar (+ veya -)

  // Supplier-specific
  supplier_product_id: string;
  supplier_variation_sku: string | null;

  // Stock
  stock_quantity: number;

  // Display
  display_order: number;
}

// ============================================================================
// LEGACY TYPES (Deprecated - Migration Only)
// ============================================================================

/**
 * @deprecated Yeni sistemde kullanılmıyor
 * region_products tablosundan eski fiyat kaydı
 */
export interface LegacyRegionProductPrice {
  id: string;
  region_id: string;
  product_id: string;
  price: number;                    // DEPRECATED: Artık kullanılmıyor
  business_price: number | null;    // DEPRECATED: Artık kullanılmıyor
  previous_price: number | null;
  price_change: 'up' | 'down' | 'stable';
  availability: 'plenty' | 'limited' | 'last';
  stock_quantity: number;
  is_active: boolean;
}

/**
 * @deprecated Yeni sistemde kullanılmıyor
 * products tablosundan eski fiyat alanı
 */
export interface LegacyProductPrice {
  id: string;
  price: number;                    // DEPRECATED: Artık kullanılmıyor
  base_price: number | null;        // DEPRECATED: Artık kullanılmıyor
}
