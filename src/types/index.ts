// Haldeki Data Types

export type ProductUnit = "kg" | "adet" | "demet" | "paket";

export type QualityGrade = "premium" | "standart" | "ekonomik";

export type AvailabilityStatus = "plenty" | "limited" | "last";

export type PriceChange = "up" | "down" | "stable";

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  image: string;
  productCount: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  quantity: number;
  unit: ProductUnit;
  priceMultiplier: number;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  price: number;
  unit: ProductUnit;
  origin: string;
  quality: QualityGrade;
  arrivalDate: string;
  availability: AvailabilityStatus;
  isBugunHalde: boolean;
  priceChange: PriceChange;
  previousPrice?: number;
  images: string[];
  description?: string;
  variants?: ProductVariant[];
}

// Legacy Region type - DEPRECATED: Use DbRegion instead
export interface Region {
  id: string;
  name: string;
  districts: string[];
  minOrder: number;
  deliveryFee: number;
}

// DB'den gelen region tipi - Supabase schema ile uyumlu
export interface DbRegion {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  min_order_amount: number;
  delivery_fee: number;
  free_delivery_threshold: number | null;
  districts: string[];
  delivery_slots: DeliverySlot[] | null;
  warehouse_address: string | null;
  warehouse_phone: string | null;
  description: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

// localStorage'da saklanan minimal region bilgisi
export interface SelectedRegion {
  id: string;
  name: string;
  slug: string;
}

export interface DeliverySlot {
  id: string;
  date: string;
  timeSlot?: "morning" | "afternoon" | "evening"; // legacy uyumluluk
  label: string;
  available: boolean;
  // 2A.4: DB'den gelen start/end (opsiyonel, slot sıralama için)
  start?: string;  // "08:00" formatı
  end?: string;    // "12:00" formatı
}

// UI'da processedSlots için kullanılan extended tip
export interface ProcessedDeliverySlot extends DeliverySlot {
  isPast: boolean;
}

export type PriceSource = 'region' | 'supplier' | 'product';

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
  selectedVariant?: ProductVariant;
  // 2A.3: Bölge fiyatı ve bölge tracking
  unitPriceAtAdd: number;    // region_products.price (variant multiplier hariç)
  regionIdAtAdd: string;     // sepete eklendiği bölge
  // Phase 12: Multi-supplier cart tracking
  supplierId: string | null;
  supplierProductId: string | null;
  supplierName: string;
  priceSource: PriceSource;
}

// Cart validation için kullanılan tip
export interface CartValidationResult {
  invalidItems: Array<{
    productId: string;
    productName: string;
    reason: "not_in_region" | "out_of_stock";
  }>;
  repriceItems: Array<{
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
  }>;
  hasChanges: boolean;
}

export interface Address {
  id: string;
  userId: string;
  title: string;
  fullAddress: string;
  district: string;
  phone: string;
  instructions?: string;
  isDefault: boolean;
}

export interface MockOrder {
  id: string;
  items: CartItem[];
  address: Address;
  deliverySlot: DeliverySlot;
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered";
  total: number;
  createdAt: string;
}

// ==========================================
// REGION PRODUCTS TYPES (2A.2)
// ==========================================

// region_products tablosundan gelen veri
export interface RegionProductInfo {
  id: string;
  region_id: string;
  product_id: string;
  price: number;
  business_price: number | null;
  previous_price: number | null;
  price_change: PriceChange;
  availability: AvailabilityStatus;
  stock_quantity: number;
  is_active: boolean;
}

// UI için basitleştirilmiş bölge fiyat bilgisi
export interface RegionPriceInfo {
  price: number;
  businessPrice: number | null;
  previousPrice: number | null;
  priceChange: PriceChange;
  availability: AvailabilityStatus;
  stockQuantity: number;
  isAvailable: boolean;  // stock > 0 && is_active
  isInRegion: boolean;   // region_products'ta kayıt var mı
}

// Master product + region bilgisi birleşik
export interface ProductWithRegionInfo extends Product {
  regionInfo: RegionPriceInfo | null;  // null = bölgede varsayılan fiyat kullanılır (ürün satışa açıktır)
}

// ==========================================
// ORDER TYPES (Faz 6)
// ==========================================

// Sipariş öğesi (orders.items JSONB field)
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  totalPrice: number;
  businessUnitPrice?: number;  // B2B için özel fiyat
  variant?: string;  // Variant bilgisi (opsiyonel)
}

// Teslimat adresi (orders.shipping_address JSONB field)
export interface ShippingAddress {
  title: string;
  fullName: string;
  phone: string;
  district: string;
  fullAddress: string;
  instructions?: string;
}

// ==========================================
// REPEAT ORDER TYPES (Faz 8)
// ==========================================

export interface RepeatOrderValidationResult {
  canRepeat: boolean;
  availableItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    oldPrice: number;
    priceChanged: boolean;
    businessPrice?: number;  // B2B için
  }>;
  unavailableItems: Array<{
    productId: string;
    productName: string;
    reason: 'not_found' | 'not_in_region' | 'out_of_stock' | 'inactive' | 'region_changed';
  }>;
  totalOldPrice: number;
  totalNewPrice: number;
  priceDifference: number;
  priceIncreased: boolean;
}

export interface RepeatOrderResult {
  success: boolean;
  addedToCartCount: number;
  skippedCount: number;
  message: string;
  warnings?: string[];
}

// ==========================================
// SUPPLIER TYPES (Faz 9)
// ==========================================

// Re-export supplier types for convenience
export type {
  ProductStatus,
  SupplierProduct,
  ProductFormData,
  ImageUploadProgress,
  ProductSearchFilters,
  ProductSortOption,
  ProductListParams,
  ProductListResponse,
  RecentSearch,
  PriceEditState,
  ProductActionResult,
  BulkProductResult,
  ImageValidationResult,
} from './supplier';

// ==========================================
// PHASE 12: MULTI-SUPPLIER TYPES
// ==========================================

// Re-export multi-supplier types for convenience
export type {
  ProductVariationType,
  SupplierProduct as Phase12SupplierProduct,
  ProductVariation,
  SupplierProductVariation,
  ProductWithSuppliers,
  PriceStats,
  BugunHaldeComparison,
  ProductVariationsGrouped,
  SupplierProductWithVariations,
  SupplierProductSearchParams,
  SupplierProductSearchResult,
  SupplierProductFormData,
  ProductVariationFormData,
  SupplierProductVariationFormData,
  SupplierProductListResponse,
  SupplierProductBulkResult,
} from './multiSupplier';

// Re-export variation types for convenience
export type {
  VariationValue,
  VariationAttribute,
  ExtractedVariation,
  VariationPattern,
  VariationExtractionResult,
  VariationCombination,
  SelectedVariations,
  VariationSelectionContext,
  VariationAvailability,
  VariationDisplayConfig,
  VariationDisplayOption,
  VariationValidationRule,
  VariationValidationResult,
  VariationImportRow,
  VariationExportData,
} from './variations';

// ==========================================
// PRICING SYSTEM TYPES (New Redesign)
// ==========================================

export type {
  CommissionRates,
  CustomerType,
  PriceCalculationInput,
  PriceCalculationResult,
  CartPriceCalculationResult,
  RegionalPricingConfig,
  RegionalMultiplier,
  SupplierProductPrice,
  VariationPriceAdjustment,
} from './pricing';

export { DEFAULT_COMMISSION_RATES } from './pricing';

// ==========================================
// WHITELIST APPLICATION TYPES
// ==========================================

export interface WhitelistApplication {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  district: string | null;
  user_type: 'B2B' | 'B2C';
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'duplicate';
  source: 'web' | 'referral' | 'admin';
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}
