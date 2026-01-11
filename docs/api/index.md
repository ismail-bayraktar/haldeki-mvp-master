# API Dokümantasyonu

> Bu bölüm API fonksiyonlarının ve bileşenlerinin dokümantasyonunu içerir.

## İçerik

## components\admin\WarehouseStaffForm.tsx

```typescript
// Path: components\admin\WarehouseStaffForm.tsx
```

Warehouse Staff Form Component
Phase 11 - Warehouse MVP
Yeni warehouse staff ekleme/mevcut staff düzenleme formu
## components\auth\ProtectedRoute.tsx

```typescript
// Path: components\auth\ProtectedRoute.tsx
```

ProtectedRoute - Authentication required route wrapper
Behavior:
- If requireAuth=true and not authenticated → Redirect to homepage #whitelist-form
- If allowedRoles specified → Check user has at least one role
- If requireApproval=true → Check approval status for dealer/supplier
Usage:
<ProtectedRoute requireAuth={true}>
<Products />
</ProtectedRoute>
<ProtectedRoute allowedRoles={['supplier']} requireApproval={true}>
<SupplierDashboard />
</ProtectedRoute>
## components\business\RepeatOrderButton.tsx

```typescript
// Path: components\business\RepeatOrderButton.tsx
```

Button to initiate repeat order flow
Opens validation dialog on click
## components\business\RepeatOrderConfirmDialog.tsx

```typescript
// Path: components\business\RepeatOrderConfirmDialog.tsx
```

Dialog showing repeat order confirmation with:
- Available items to be added
- Unavailable items with reasons
- Price change warnings
- Confirm/Cancel actions
## components\layout\AdminLayout.tsx

```typescript
// Path: components\layout\AdminLayout.tsx
```

This layout was mistakenly added to admin pages but should ONLY be used in Supplier panel.
Keeping this file for potential future supplier panel use.
Admin pages now use the original sidebar layout without breadcrumbs.
## components\layout\RegionSelector.tsx

```typescript
// Path: components\layout\RegionSelector.tsx
```

Header'dan açılan bölge seçici modal
- Kapatılabilir (X butonu var, backdrop ile kapanır)
- DB'den bölgeleri çeker
- Aktif olmayan bölgeler için waitlist gösterir
- 2A.3: Sepet doluyken bölge değişikliği için validation + confirm modal
## components\playground\AIReviewPanel.tsx

```typescript
// Path: components\playground\AIReviewPanel.tsx
```

AIReviewPanel - Simulates AI design review
Shows design guidelines and best practices
## components\playground\CoreUI.tsx

```typescript
// Path: components\playground\CoreUI.tsx
```

CoreUI - Showcases core UI components
Badges, cards, forms, etc.
## components\playground\index.ts

```typescript
// Path: components\playground\index.ts
```

Playground Components - Design System Showcase
## components\playground\templates\MinimalShowcaseTemplate.tsx

```typescript
// Path: components\playground\templates\MinimalShowcaseTemplate.tsx
```

ComponentName - One-line description
REPLACE: ComponentName with your actual component name
## components\playground\templates\PerfectShowcaseComponent.tsx

```typescript
// Path: components\playground\templates\PerfectShowcaseComponent.tsx
```

FormShowcase - Demonstrates form components and patterns
This showcase component displays all form elements including inputs,
selects, checkboxes, radio buttons, and form validation patterns.
It includes interactive demos for props and usage examples.
## components\playground\TokenShowcase.tsx

```typescript
// Path: components\playground\TokenShowcase.tsx
```

TokenShowcase - Displays all design system tokens
Colors, typography, spacing, shadows, etc.
## components\playground\variations\BasicProductCard.tsx

```typescript
// Path: components\playground\variations\BasicProductCard.tsx
```

BasicProductCard - A simple wrapper around ProductCard
This component provides a minimal product card by delegating all
rendering to the standard ProductCard component with inline variant buttons.
## components\region\RegionBanner.tsx

```typescript
// Path: components\region\RegionBanner.tsx
```

Bölge seçilmediğinde ürün listesi üstünde gösterilen soft banner.
Kullanıcıyı bölge seçmeye yönlendirir ama sayfayı bloklamaz.
## components\region\RequireRegionModal.tsx

```typescript
// Path: components\region\RequireRegionModal.tsx
```

Kritik aksiyonlarda gösterilen zorunlu bölge seçim modal'ı
- ESC veya backdrop ile kapatılamaz
- X butonu yok
- Sadece bölge seçilince kapanır
## components\supplier\SupplierMobileLayout.tsx

```typescript
// Path: components\supplier\SupplierMobileLayout.tsx
```

Page header component for mobile pages
## components\ui\OptimizedImage.tsx

```typescript
// Path: components\ui\OptimizedImage.tsx
```

OptimizedImage Bileşeni
Özellikler:
- Otomatik lazy/eager stratejisi (priority prop'a göre)
- WebP/AVIF desteği (tarayıcı desteği kontrolü)
- Progressive loading (blur placeholder)
- Intersection Observer ile lazy loading
- Erişilebilirlik (ARIA labels)
Best Practices:
- İlk 4 ürün: eager
- Hero bölümü: eager + high priority
- Fold altı: lazy
- Thumbnail'ler: lazy
## hooks\useBugunHalde.ts

```typescript
// Path: hooks\useBugunHalde.ts
```

Hook: Get Bugün Halde comparison view with filters
## hooks\useCartPrices.ts

```typescript
// Path: hooks\useCartPrices.ts
```

Cart Prices Hook (New Pricing System)
Yeni pricing sistemi için sepet fiyat hesaplama hook'u.
Cart price calculation hook for the new pricing system.
Uses calculate_cart_prices RPC function for accurate pricing.
## hooks\useCartValidation.ts

```typescript
// Path: hooks\useCartValidation.ts
```

Sepetteki ürünleri yeni bölge için validate eder.
Tek sorgu ile tüm ürünleri kontrol eder (N+1 yok).
## hooks\useGlobalProductCatalog.ts

```typescript
// Path: hooks\useGlobalProductCatalog.ts
```

Get supplier ID from user
## hooks\useImageUpload.ts

```typescript
// Path: hooks\useImageUpload.ts
```

Edge Function çağrısı: Görsel optimizasyonunu tetikler
## hooks\useIsAdmin.ts

```typescript
// Path: hooks\useIsAdmin.ts
```

useIsAdmin Hook
Phase 11 - Warehouse MVP
Basit admin yetki kontrolü
## hooks\useLowestPriceForCart.ts

```typescript
// Path: hooks\useLowestPriceForCart.ts
```

Hook: Get lowest price for cart operations
Updated for New Pricing System Redesign
Finds the best price across:
1. Supplier products (if available) - NEW: Uses calculate_product_price RPC
2. Region products (fallback) - LEGACY: Backward compatible
Returns supplier info to pass to addToCart for tracking
## hooks\useMultiSupplierProducts.ts

```typescript
// Path: hooks\useMultiSupplierProducts.ts
```

Hook: Get all suppliers for a product with prices
## hooks\usePickingList.ts

```typescript
// Path: hooks\usePickingList.ts
```

Picking List Hook
Phase 11 - Warehouse MVP
RPC çağrır: warehouse_get_picking_list(p_window_start, p_window_end)
Aggregated ürün listesi (FIYAT YOK)
## hooks\usePricingConfig.ts

```typescript
// Path: hooks\usePricingConfig.ts
```

Pricing Configuration Hook
Manages pricing_config table operations for admin users.
Hook for fetching and updating commission rates and pricing modes.
## hooks\useProductExport.ts

```typescript
// Path: hooks\useProductExport.ts
```

Product Export Hook
Phase 10.2 - Export Logic
Handles exporting products to Excel or CSV format
## hooks\useProductImport.ts

```typescript
// Path: hooks\useProductImport.ts
```

Product Import Hook
Phase 10.2 - Import Logic
Handles product import operations with validation and error tracking
## hooks\useProductPrice.ts

```typescript
// Path: hooks\useProductPrice.ts
```

Product Price Hook (New Pricing System)
Yeni pricing sistemi için ürün fiyatı sorgulama hook'u.
Product price query hook for the new pricing system.
Uses calculate_product_price RPC function for accurate pricing.
## hooks\useProducts.ts

```typescript
// Path: hooks\useProducts.ts
```

Phase 12: Get Bugün Halde products from supplier_products
Returns products with their lowest supplier price as base_price
## hooks\useProductSearch.ts

```typescript
// Path: hooks\useProductSearch.ts
```

Hook: Product search with debouncing and filters
## hooks\useProductVariations.ts

```typescript
// Path: hooks\useProductVariations.ts
```

Hook: Get variations for a product
## hooks\useRegionProducts.ts

```typescript
// Path: hooks\useRegionProducts.ts
```

Belirli bir bölgedeki tüm aktif ürün-bölge eşleşmelerini çeker
## hooks\useRegions.ts

```typescript
// Path: hooks\useRegions.ts
```

DB'den aktif bölgeleri çeken hook
- Sadece is_active = true olanları getirir
- sort_order'a göre sıralar (yoksa name'e göre)
- React Query ile cache yönetimi
## hooks\useRepeatOrder.ts

```typescript
// Path: hooks\useRepeatOrder.ts
```

Hook for validating and repeating previous orders
## hooks\useSupplierCatalog.ts

```typescript
// Path: hooks\useSupplierCatalog.ts
```

useSupplierCatalog Hook
Optimized tedarikçi ürün katalog sorguları için React hook
## hooks\useSupplierProducts.ts

```typescript
// Path: hooks\useSupplierProducts.ts
```

Helper: Convert DB product to SupplierProduct type
## hooks\useUsers.ts

```typescript
// Path: hooks\useUsers.ts
```

Users Hook
Phase 11 - Warehouse MVP
Kullanıcı listesini çeker
Tablo: profiles, user_roles
## hooks\useVendors.ts

```typescript
// Path: hooks\useVendors.ts
```

Vendors Hook
Phase 11 - Warehouse MVP
Vendor (Tedarikçi) verilerini çeker
Tablo: vendors
## hooks\useWarehouseOrders.ts

```typescript
// Path: hooks\useWarehouseOrders.ts
```

Warehouse Orders Hook
Phase 11 - Warehouse MVP
RPC çağrır: warehouse_get_orders(p_window_start, p_window_end)
FİYAT YOK - P0 security
## hooks\useWarehouseStaff.ts

```typescript
// Path: hooks\useWarehouseStaff.ts
```

Warehouse Staff Hook
Phase 11 - Warehouse MVP
Admin panel için warehouse_staff CRUD işlemleri
Tablo: warehouse_staff (user_id, vendor_id, warehouse_id, is_active)
## lib\animations\hooks.ts

```typescript
// Path: lib\animations\hooks.ts
```

Hook to detect user's reduced motion preference
## lib\animations\utils.ts

```typescript
// Path: lib\animations\utils.ts
```

Animation utility functions for performant, GPU-accelerated animations
## lib\animations\variants.ts

```typescript
// Path: lib\animations\variants.ts
```

Framer Motion-style variants for manual animation implementations
## lib\csvParser.ts

```typescript
// Path: lib\csvParser.ts
```

CSV Parser for Product Import
Phase 10.1 - CSV Parser
Parses CSV files and extracts product data
## lib\excelParser.ts

```typescript
// Path: lib\excelParser.ts
```

Excel Parser for Product Import
Phase 10.1 - Excel Parser
Parses Excel files (.xlsx, .xls) and extracts product data
## lib\orderUtils.ts

```typescript
// Path: lib\orderUtils.ts
```

Validates if an order can be repeated with current product data
## lib\phoneNormalizer.ts

```typescript
// Path: lib\phoneNormalizer.ts
```

Normalize Turkish phone numbers for consistent database matching
Handles various input formats:
- "+90 555 123 4567"
- "0555 123 45 67"
- "555-123-4567"
- "+90(555)1234567"
All normalized to: "5551234567" (10 digits, no country code, no leading zero)
Normalization steps:
1. Remove all non-digit characters
2. Remove Turkish country code (90 or +90)
3. Remove leading zero (0)
4. Validate length (must be exactly 10 digits)
## lib\pricing.ts

```typescript
// Path: lib\pricing.ts
```

Fiyat Hesaplama Utilitesi
Price Calculation Utility
Yeni pricing sistemi için fiyat hesaplama fonksiyonları.
Price calculation functions for the new pricing system.
## lib\productUtils.ts

```typescript
// Path: lib\productUtils.ts
```

Master products listesi ile region_products verisini birleştirir (client-side merge)
Bu strateji sayesinde:
- Her iki veriyi ayrı ayrı cache'leyebiliriz
- Bölge değiştiğinde sadece region_products yeniden çekilir
- "Bu bölgede yok" durumunu kolayca işaretleyebiliriz
## lib\productValidator.ts

```typescript
// Path: lib\productValidator.ts
```

Product Validator for Import System
Phase 10.1 - Product Validator
Validates product data from import files
## lib\schemas\product.ts

```typescript
// Path: lib\schemas\product.ts
```

Base product validation schema
Used across all product forms (supplier, admin)
## lib\supabase\queries.ts

```typescript
// Path: lib\supabase\queries.ts
```

Supabase Queries - New Pricing System
Yeni pricing sistemi için Supabase sorguları.
Supabase queries for the new pricing system.
Uses calculate_product_price RPC function as the single source of truth.
## lib\timeWindow.ts

```typescript
// Path: lib\timeWindow.ts
```

Time Window Helper
Phase 11 - Warehouse MVP
Türkiye saat dilimi (Europe/Istanbul - TRT) için zaman penceresi hesaplaması
Night Shift: Dün 17:00 → Bugün 08:00
Day Shift: Bugün 08:00 → Bugün 17:00
## lib\utils.ts

```typescript
// Path: lib\utils.ts
```

Convert string to URL-friendly slug
Example: "Yeni Ürün" → "yeni-urun"
## lib\validation.ts

```typescript
// Path: lib\validation.ts
```

Validates if a string is a safe URL
- Must use http:// or https:// protocol
- Blocks javascript: and data: URLs (XSS prevention)
- Blocks protocol-relative URLs (//evil.com)
## pages\admin\WarehouseStaff.tsx

```typescript
// Path: pages\admin\WarehouseStaff.tsx
```

Warehouse Staff Management Page
Phase 11 - Warehouse MVP
Admin panel - Warehouse staff CRUD işlemleri
warehouse_staff tablosu yönetimi
## pages\Playground.tsx

```typescript
// Path: pages\Playground.tsx
```

Playground - Design System Showcase
This route showcases the Haldeki design system components and tokens.
It's a reference page for designers and developers to see all available
UI elements in one place.
## pages\warehouse\OrdersList.tsx

```typescript
// Path: pages\warehouse\OrdersList.tsx
```

Orders List Component
Phase 11 - Warehouse MVP
Sipariş listesi (FIYAT YOK - Security P0)
## pages\warehouse\PickingListCard.tsx

```typescript
// Path: pages\warehouse\PickingListCard.tsx
```

Picking List Card Component
Phase 11 - Warehouse MVP
Toplanan ürünlerin özet listesi (FIYAT YOK - Security P0)
## pages\warehouse\WarehouseDashboard.tsx

```typescript
// Path: pages\warehouse\WarehouseDashboard.tsx
```

Warehouse Dashboard Page
Phase 11 - Warehouse MVP
Mobil-first depo yönetim paneli
Shift selector, picking list, orders
FİYAT YOK - Security P0
## services\supplierProducts.ts

```typescript
// Path: services\supplierProducts.ts
```

Get supplier ID from user ID
## templates\generateCSVTemplate.ts

```typescript
// Path: templates\generateCSVTemplate.ts
```

CSV Template Generator for Product Import
Phase 10.1 - CSV Template
## templates\generateExcelTemplate.ts

```typescript
// Path: templates\generateExcelTemplate.ts
```

Excel Template Generator for Product Import
Phase 10.1 - Excel Template
This script generates a standardized Excel template for suppliers to import products.
## templates\index.ts

```typescript
// Path: templates\index.ts
```

Template exports for product import/export
Phase 10.1 - Excel/CSV Templates
## types\multiSupplier.ts

```typescript
// Path: types\multiSupplier.ts
```

Phase 12: Multi-Supplier Product Management Types
Defines types for products with multiple suppliers and variations.
Supports:
- Multiple suppliers per product
- Structured product variations (size, type, scent, etc.)
- Price comparison across suppliers
- Supplier-specific inventory and pricing
## types\pricing.ts

```typescript
// Path: types\pricing.ts
```

Yeni Fiyatlandırma Sistemi Tipleri
New Pricing System Types
Tek kaynaklı fiyatlandırma sistemi için tip tanımları.
Single source of truth pricing system types.
## types\supplier-catalog.types.ts

```typescript
// Path: types\supplier-catalog.types.ts
```

Supplier Product Catalog - Type Definitions
RPC fonksiyonları için TypeScript tipleri
## types\supplier.ts

```typescript
// Path: types\supplier.ts
```

Product status enum for supplier product management
## types\variations.ts

```typescript
// Path: types\variations.ts
```

Phase 12: Product Variations Types
Defines types for structured product variations.
Variations are normalized and shared across suppliers.
## utils\passwordUtils.ts

```typescript
// Path: utils\passwordUtils.ts
```

Password utilities for generating and managing temporary passwords
SECURITY NOTICE:
- Password storage in localStorage is deprecated
- Use Supabase Auth password reset flow instead
- Temporary password functions are for development only

---

**Son güncelleme:** 2026-01-11T01:27:14.706Z