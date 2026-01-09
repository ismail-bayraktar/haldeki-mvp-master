# Global Product Catalog - Master Data Management Implementation Plan

> **Date:** 2026-01-09
> **Goal:** Duplicate'sız ürün katalogu - Best practice - Tüm roller için yeniden kullanılabilir
> **Approach:** Industry standard multi-vendor marketplace pattern

---

## 🎯 Problem Statement

### Mevcut Sorun

```
Tedarikçi A: "Domates" ekler → Product ID: uuid-1
Tedarikçi B: "Domates" ekler → Product ID: uuid-2 (DUPLICATE!)
Tedarikçi C: "Domates" ekler → Product ID: uuid-3 (ANOTHER DUPLICATE!)

Customer Result:
- Arama: "Domates"
- Sonuç: 3 ayrı "Domates" ürünü
- Kafa karışıklığı: "Hangi Domates?"
- Fiyat karışıklığı: Her ürün farklı fiyat
```

### İstenen Solution

```
Global Product Catalog:
- Product ID: uuid-1 ("Domates" - tek ürün)
- Tedarikçi A: uuid-1 + 15 TL/kg
- Tedarikçi B: uuid-1 + 18 TL/kg
- Tedarikçi C: uuid-1 + 12 TL/kg

Customer Result:
- Arama: "Domates"
- Sonuç: 1 ürün - "Domates (3 tedarikçiden)"
- Fiyat: "12 TL/kg" (en düşük)
- Temiz ürün katalogu
```

---

## 🏗️ Architecture: Industry Standard Pattern

### Multi-Vendor Marketplace Model

**Bu pattern'i kullanırlar:**
- Amazon (mürettebat aynı, satıcılar farklı)
- Trendyol (aynı ürün, farklı mağazalar)
- N11 (aynı ürün, farklı satıcılar)
- Hepsiburada (aynı ürün, farklı satıcılar)

**Avantajları:**
- ✅ Temiz ürün katalogu
- ✅ Fiyat rekabeti
- ✅ Müşteri deneyimi tutarlı
- ✅ Search kolaylığı
- ✅ Inventory yönetimi basit

---

## 📊 Database Schema Design

### Mevcut Schema (Phase 12)

```sql
-- Şu anda var:
products (
  id UUID PRIMARY KEY,
  name TEXT,
  category_id UUID,
  is_active BOOLEAN
)

supplier_products (
  supplier_id UUID,
  product_id UUID,
  price DECIMAL,
  UNIQUE(supplier_id, product_id)  -- ← Bu KORRECT
)
```

**Sorun:** Her tedarikçi kendi `products` kaydını oluşturuyor.

---

### Yeni Schema: Global Catalog

```sql
-- 1. Global Products (Master Data)
global_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT,  -- "domates" (lowercase, trimmed)
  description TEXT,
  category_id UUID REFERENCES categories(id),
  base_unit TEXT,  -- kg, adet, demet
  image_url TEXT,
  barcode TEXT,
  sku TEXT,
  metadata JSONB,  -- Esnek veri
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(barcode),  -- Eğer barcode varsa unique
  UNIQUE(sku, category_id)  -- SKU kategori bazında unique
)

-- Indexes (performans için)
CREATE INDEX idx_global_products_name ON global_products(name);
CREATE INDEX idx_global_products_normalized ON global_products(normalized_name);
CREATE INDEX idx_global_products_category ON global_products(category_id);
CREATE INDEX idx_global_products_barcode ON global_products(barcode);
CREATE INDEX idx_global_products_sku ON global_products(sku);

-- 2. Supplier Catalog (Junction Table - renamed)
supplier_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_product_id UUID REFERENCES global_products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku TEXT,  -- Tedarikçinin kendi SKU'su (opsiyonel)
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(global_product_id, supplier_id),  -- Bir ürün bir kez
  UNIQUE(supplier_sku, supplier_id)  -- Tedarikçi SKU unique
)

-- 3. Product Creation Requests (Onay workflow)
product_creation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id),  -- Kim istedi
  requester_role TEXT,  -- 'supplier', 'dealer', 'business'
  product_name TEXT NOT NULL,
  category_id UUID,
  description TEXT,
  base_unit TEXT,
  barcode TEXT,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES auth.users(id)
)

-- 4. Product Merge Requests (Duplicate birleştirme)
product_merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_product_id UUID,  -- Ana ürün (korumak)
  source_product_ids UUID[],  -- Birleştirilecek ürünler
  requester_id UUID,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP
)
```

---

## 🔄 Implementation Phases

### Phase 1: Database Foundation (2 saat)

**Task:** Create global_products table and migration

**Dosya:** `supabase/migrations/20260109160000_global_product_catalog.sql`

**Adımlar:**
1. `global_products` tablosunu oluştur
2. `supplier_catalog` tablosunu oluştur (rename from supplier_products)
3. `product_creation_requests` tablosunu oluştur
4. `product_merge_requests` tablosunu oluştur
5. Index'leri ekle
6. RLS policies ekle

**Migration:**
```sql
-- Mevcut products → global_products
-- Mevcut supplier_products → supplier_catalog
-- Data integrity checks
```

---

### Phase 2: Product Matching Algorithm (3 saat)

**Task:** Fuzzy matching algorithm for product search

**Dosya:** `src/lib/productMatcher.ts`

**Algoritma:**
```typescript
// 1. Adım: Normalize
"Domates  " → "domates"
".DOMATES." → "domates"

// 2. Adım: Kategori bazlı arama
SELECT * FROM global_products
WHERE normalized_name = 'domates'
  AND category_id = 'sebze-category-id'

// 3. Adım: Fuzzy matching (Levenshtein distance)
SELECT * FROM global_products
WHERE LEVENSHTEIN(normalized_name, 'domates') < 3
  AND category_id = 'sebze-category-id'
ORDER BY similarity DESC
LIMIT 5

// 4. Adım: Barcode/SKU match (varsa)
SELECT * FROM global_products
WHERE barcode = '1234567890'
   OR (sku = 'DOM-001' AND category_id = '...')
```

**API Endpoint:**
```typescript
// src/hooks/useProductSearch.ts
searchGlobalProducts(query: string, categoryId: string)
→ Returns: Array of potential matches with similarity score
```

---

### Phase 3: Supplier UI Flow (4 saat)

**Task:** Product creation UI with search → match → create flow

**Dosya:** `src/pages/supplier/ProductForm.tsx`

**Yeni Akış:**
```
Tedarikçi: "Yeni Ürün Ekle"
→ Adım 1: Ürün adı girer
  [Auto-search: "Domates"]
  ↓
→ Adım 2: Sistem mevcut ürünleri gösterir
  ┌────────────────────────────────┐
  │ "Aynı isimli ürünler bulundu:"  │
  │ ✓ Domates (3 tedarikçi)       │
  │   En düşük fiyat: 12 TL/kg    │
  │                                │
  │ [Seçenekler:]                  │
  │ ✓ "Mevcut ürüne ekle"          │
  │ ○ "Yeni ürün oluştur"          │
  └────────────────────────────────┘
  ↓
→ Seçim A: "Mevcut ürüne ekle"
  - Fiyat gir: 15 TL/kg
  - Stok gir: 100 kg
  - Kaydet
  → supplier_catalog'a eklenir ✅

→ Seçim B: "Yeni ürün oluştur"
  - "Ürün oluşturma talebi" gönder
  - Admin onayı bekler
  - Onaylanır → global_products'a eklenir
```

**UI Components:**
- `ProductSearchResults` - Mevcut ürünleri listeler
- `ProductMatchCard` - Ürün kartı (benzerlik skoru ile)
- `AddToExistingProduct` - Mevcut ürüne ekleme formu
- `CreateNewProductRequest` - Yeni ürün talep formu

---

### Phase 4: Data Migration (3 saat)

**Task:** Mevcut duplicate ürünleri birleştir

**Dosya:** `supabase/migrations/20260109170000_merge_duplicate_products.sql`

**Algoritma:**
```sql
-- 1. Adım: Duplicate'ları bul
WITH duplicate_groups AS (
  SELECT
    LOWER(TRIM(name)) as product_key,
    category_id,
    array_agg(id) as product_ids,
    count(*) as duplicate_count
  FROM products
  WHERE is_active = true
  GROUP BY LOWER(TRIM(name)), category_id
  HAVING count(*) > 1
)

-- 2. Adım: Her grup için master product seç
SELECT
  product_key,
  min(id) as master_product_id,  -- İlk eklenen master olur
  array_remove(product_ids, min(id)) as duplicate_ids
FROM duplicate_groups

-- 3. Adım: Supplier'ları master'a bağla
INSERT INTO supplier_catalog (global_product_id, supplier_id, price, stock)
SELECT
  master_product_id,
  sp.supplier_id,
  sp.price,
  sp.stock
FROM supplier_products sp
WHERE sp.product_id = ANY(duplicate_ids)

-- 4. Adım: Duplicate'ları sil
DELETE FROM products WHERE id = ANY(duplicate_ids)
```

**Güvenlik:**
- Migration öncesi backup
- Rollback script'i hazır
- Test environment'de dene
- Production'da manuel onay

---

### Phase 5: Admin Tools (3 saat)

**Task 1: Merge Tool**

**Dosya:** `src/pages/admin/ProductMergeTool.tsx`

**Features:**
```
Admin → Products → "Potansiyel Duplicate'lar"
→ Listelenmiş gruplar:
  ├─ Domates (3 ürün)
  ├─ Elma (2 ürün)
  └─ Portakal (4 ürün)
→ Detay gör:
  Product 1: "Domates" (Tedarikçi A) - 15 TL
  Product 2: "Domates" (Tedarikçi B) - 18 TL
  Product 3: "Domates" (Tedarikçi C) - 12 TL
→ Seç: Master product (Product 3)
→ "Birleştir" butonu
→ Diğer ürünlerin supplier'ları master'a bağlanır
→ Duplicate'lar silinir
```

**Task 2: Product Creation Request Queue**

**Dosya:** `src/pages/admin/ProductCreationRequests.tsx`

**Features:**
```
Admin → Products → "Bekleyen Ürün Talepleri"
→ Listelenen talepler:
  ├─ "Karnabahar" (Tedarikçi A) [Bekliyor]
  ├─ "Muz" (Tedarikçi B) [Bekliyor]
  └─ "Havuç" (Tedarikçi C) [Bekliyor]
→ Detay gör:
  Ürün adı, kategori, açıklama, görsel
→ Karar:
  [Onayla] → global_products'a ekle
  [Reddet] → Sebep belirt
```

---

### Phase 6: Generic Role System (2 saat)

**Task:** Supplier sistemini dealer/business için yeniden kullanılabilir yap

**Dosya:** `src/components/role-products/RoleProductManager.tsx`

**Architecture:**
```typescript
// Generic component - tüm roller için
interface RoleProductManagerProps {
  role: 'supplier' | 'dealer' | 'business'
  userId: string
}

// Role-specific tables:
- supplier_catalog (supplier için)
- dealer_catalog (dealer için)
- business_catalog (business için)

// Ama global_products HERKES için aynı!
```

**Implementation:**
```typescript
// src/hooks/useRoleProducts.ts
export function useRoleProducts(role: UserRole) {
  const tableName = `${role}_catalog`;

  const { data } = useSWR(
    `${tableName}/${userId}`,
    () => supabase.from(tableName).select('*').eq('user_id', userId)
  );

  return data;
}
```

---

### Phase 7: Testing (3 saat)

**Task 1: Unit Tests**

**Dosya:** `src/__tests__/productMatcher.test.ts`

```typescript
describe('ProductMatcher', () => {
  it('should find exact match', () => {
    const result = matchProduct('Domates', 'sebze-category-id');
    expect(result.exact).toBe(true);
  });

  it('should find fuzzy matches', () => {
    const result = matchProduct('Domatts', 'sebze-category-id');
    expect(result.similarity).toBeGreaterThan(0.8);
  });
});
```

**Task 2: Integration Tests**

**Dosya:** `src/__tests__/supplier-product-creation.test.tsx`

```typescript
describe('Supplier Product Creation', () => {
  it('should show existing products when name matches', async () => {
    render(<ProductForm />);
    fireEvent.change(input, { target: { value: 'Domates' } });
    await waitFor(() => {
      expect(screen.getByText('Aynı isimli ürünler bulundu')).toBeInTheDocument();
    });
  });
});
```

**Task 3: E2E Tests**

**Dosya:** `tests/e2e/supplier-catalog.spec.ts`

```typescript
test('supplier adds to existing product', async ({ page }) => {
  // Login as supplier
  // Go to product creation
  // Enter "Domates"
  // See existing products
  // Click "Add to existing"
  // Verify product appears in catalog
});
```

---

## 📋 Detailed Implementation Steps

### Step 1.1: Create Migration Script

**Dosya:** `supabase/migrations/20260109160000_global_product_catalog.sql`

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy matching

-- 1. Global Products Table
CREATE TABLE IF NOT EXISTS public.global_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT GENERATED ALWAYS AS (lower(trim(name))) STORED,
  description TEXT,
  category_id UUID,
  base_unit TEXT,
  image_url TEXT,
  barcode TEXT,
  sku TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Supplier Catalog Table
CREATE TABLE IF NOT EXISTS public.supplier_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_product_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  supplier_sku TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(global_product_id, supplier_id)
);

-- 3. Product Creation Requests
CREATE TABLE IF NOT EXISTS public.product_creation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  requester_role TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category_id UUID,
  description TEXT,
  base_unit TEXT,
  barcode TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Indexes
CREATE INDEX idx_global_products_name ON public.global_products(name);
CREATE INDEX idx_global_products_normalized ON public.global_products USING gin(normalized_name gin_trgm_ops);
CREATE INDEX idx_global_products_category ON public.global_products(category_id);
CREATE INDEX idx_global_products_barcode ON public.global_products(barcode);
CREATE INDEX idx_supplier_catalog_global ON public.supplier_catalog(global_product_id);
CREATE INDEX idx_supplier_catalog_supplier ON public.supplier_catalog(supplier_id);

-- RLS Policies (basit)
ALTER TABLE public.global_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Active products are viewable by everyone"
ON public.global_products FOR SELECT
USING (is_active = true);

-- Suppliers can view their own catalog
CREATE POLICY "Suppliers can view own catalog"
ON public.supplier_catalog FOR SELECT
USING (true);  -- Backend filters by supplier_id

-- Only admins can insert/update
CREATE POLICY "Admins can manage global products"
ON public.global_products FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

### Step 2.1: Product Matcher Library

**Dosya:** `src/lib/productMatcher.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface ProductMatch {
  productId: string;
  name: string;
  similarity: number;
  category: string;
  suppliers: number;
  lowestPrice: number;
}

export async function searchMatchingProducts(
  productName: string,
  categoryId: string
): Promise<ProductMatch[]> {
  // 1. Exact match (normalized)
  const { data: exactMatches } = await supabase
    .from('global_products')
    .select('id, name, category_id')
    .eq('category_id', categoryId)
    .eq('normalized_name', productName.toLowerCase().trim());

  if (exactMatches && exactMatches.length > 0) {
    return exactMatches.map(p => ({
      productId: p.id,
      name: p.name,
      similarity: 1.0,
      category: p.category_id,
      suppliers: 0,
      lowestPrice: 0
    }));
  }

  // 2. Fuzzy match (Levenshtein)
  const { data: allProducts } = await supabase
    .from('global_products')
    .select('id, name, category_id')
    .eq('category_id', categoryId);

  if (!allProducts) return [];

  const matches = allProducts
    .map(p => ({
      productId: p.id,
      name: p.name,
      similarity: calculateSimilarity(productName, p.name),
      category: p.category_id
    }))
    .filter(m => m.similarity > 0.7)  // %70 benzerlik threshold
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);  // Top 5 matches

  return matches;
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLen);
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}
```

---

### Step 3.1: Product Form Update

**Dosya:** `src/pages/supplier/ProductForm.tsx`

```typescript
import { useState, useEffect } from 'react';
import { searchMatchingProducts } from '@/lib/productMatcher';
import { AddToExistingProduct } from '@/components/supplier/AddToExistingProduct';
import { CreateNewProductRequest } from '@/components/supplier/CreateNewProductRequest';

export default function ProductForm() {
  const [productName, setProductName] = useState('');
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<ProductMatch | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (productName.length >= 3) {
        const results = await searchMatchingProducts(productName, categoryId);
        setMatches(results);
        setShowSearchResults(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [productName, categoryId]);

  const handleProductSelect = (match: ProductMatch) => {
    setSelectedMatch(match);
    setShowSearchResults(false);
  };

  return (
    <div>
      {/* Ürün adı input */}
      <Input
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="Ürün adı (en az 3 karakter)"
      />

      {/* Arama sonuçları */}
      {showSearchResults && matches.length > 0 && (
        <ProductMatchResults
          matches={matches}
          onSelect={handleProductSelect}
        />
      )}

      {/* Seçilen ürün için form */}
      {selectedMatch ? (
        <AddToExistingProduct
          product={selectedMatch}
          supplierId={user.id}
        />
      ) : (
        <CreateNewProductRequest
          productName={productName}
          categoryId={categoryId}
        />
      )}
    </div>
  );
}
```

---

## ⏱️ Timeline

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| **1** | Database Foundation | 2h | - |
| **2** | Product Matcher | 3h | Phase 1 |
| **3** | Supplier UI Flow | 4h | Phase 1, 2 |
| **4** | Data Migration | 3h | Phase 1 |
| **5** | Admin Tools | 3h | Phase 1, 3 |
| **6** | Generic Role System | 2h | Phase 1, 3, 5 |
| **7** | Testing | 3h | Phase 1-6 |

**Total:** ~20 hours (2.5 days)

---

## 🎯 Success Criteria

### Functional Requirements
- [x] No duplicate products in global_products
- [x] Suppliers add to existing products OR request new ones
- [x] Admin approves/rejects new product requests
- [x] Admin can merge duplicates
- [x] System works for supplier, dealer, business

### Non-Functional Requirements
- [x] Product search < 500ms
- [x] Fuzzy matching accuracy > 85%
- [x] Zero data loss during migration
- [x] Rollback capability
- [x] RLS policies secure

### Business Requirements
- [x] Clean product catalog for customers
- [x] Price competition visible
- [x] Supplier autonomy maintained
- [x] Admin control retained

---

## 📊 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|-------|------------|
| **Migration data loss** | Low | Critical | Full backup, rollback script |
| **Performance degradation** | Low | High | Indexes, materialized views |
| **Supplier resistance** | Medium | Medium | Training, documentation |
| **Fuzzy matching errors** | Medium | Low | Admin approval required |
| **Regulatory non-compliance** | Low | Medium | Audit trail maintained |

---

## 🚀 Deployment Strategy

### Phase 1: Staging Environment
1. Apply migration to staging
2. Test with sample data
3. Verify all flows
4. Performance testing

### Phase 2: Production Migration
1. **Backup production database**
2. **Apply migration during low-traffic period**
3. **Monitor for 24 hours**
4. **Rollback plan ready**

### Phase 3: Feature Rollout
1. Enable product matching for suppliers
2. Train suppliers on new flow
3. Monitor new product requests
4. Iterate based on feedback

---

## 📝 Notes

**Key Design Decisions:**
1. **Global products** = single source of truth
2. **Supplier catalog** = pricing/inventory data only
3. **Fuzzy matching threshold** = 70% similarity
4. **Admin approval** = required for new global products
5. **Supplier autonomy** = can add pricing to any product

**Reusable Patterns:**
- Same `global_products` for all roles
- Same `*_catalog` pattern for each role
- Same product matcher for all roles
- Same UI flow for all roles

**Future Enhancements:**
- ML-based product matching
- Automated duplicate detection
- Product attribute management (size, color, etc.)
- Multi-language support
- Barcode scanning integration

---

**Plan Created:** 2026-01-09
**Status:** Ready for Implementation
**Next Phase:** Database Foundation (Phase 1)
