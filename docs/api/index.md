# API Dokümantasyonu

> Bu bölüm API fonksiyonlarının ve bileşenlerinin dokümantasyonunu içerir.

## İçerik

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
## components\layout\RegionSelector.tsx

```typescript
// Path: components\layout\RegionSelector.tsx
```

Header'dan açılan bölge seçici modal
- Kapatılabilir (X butonu var, backdrop ile kapanır)
- DB'den bölgeleri çeker
- Aktif olmayan bölgeler için waitlist gösterir
- 2A.3: Sepet doluyken bölge değişikliği için validation + confirm modal
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
## hooks\useCartValidation.ts

```typescript
// Path: hooks\useCartValidation.ts
```

Sepetteki ürünleri yeni bölge için validate eder.
Tek sorgu ile tüm ürünleri kontrol eder (N+1 yok).
## hooks\useImageUpload.ts

```typescript
// Path: hooks\useImageUpload.ts
```

Validate image file before upload
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
## hooks\useProductSearch.ts

```typescript
// Path: hooks\useProductSearch.ts
```

Hook: Product search with debouncing and filters
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
## hooks\useSupplierProducts.ts

```typescript
// Path: hooks\useSupplierProducts.ts
```

Helper: Convert DB product to SupplierProduct type
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
## lib\utils.ts

```typescript
// Path: lib\utils.ts
```

Convert string to URL-friendly slug
Example: "Yeni Ürün" → "yeni-urun"
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
## types\supplier.ts

```typescript
// Path: types\supplier.ts
```

Product status enum for supplier product management
## utils\passwordUtils.ts

```typescript
// Path: utils\passwordUtils.ts
```

Password utilities for generating and managing temporary passwords

---

**Son güncelleme:** 2026-01-05T09:44:19.367Z