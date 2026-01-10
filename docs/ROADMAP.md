# Haldeki.com Yol Haritası

> Bu doküman, Haldeki projesinin teknik yol haritasını, faz durumlarını ve gelecek planlarını içerir.

Son güncelleme: 2026-01-06 23:30

---

## Proje Vizyonu

Haldeki.com, taze meyve-sebze tedarik zincirini dijitalleştiren, bölge bazlı teslimat ve çoklu rol (müşteri, bayi, tedarikçi, admin) destekli bir B2C/B2B platformudur.

### Hedef Kitle

- **B2C**: Son tüketiciler (ev kullanıcıları)
- **B2B**: Restoranlar, kafeler, oteller

### Değer Önerisi

- Halden taze ürün, aynı gün teslimat
- Bölge bazlı dinamik fiyatlandırma
- Şeffaf kaynak takibi
- Bayi ağı ile geniş kapsama

---

## Faz Haritası

### Faz 1: Temel Altyapı ✅

**Durum**: Tamamlandı

| Görev | Durum |
|-------|-------|
| Proje kurulumu (Vite + React + TypeScript) | ✅ |
| Supabase entegrasyonu | ✅ |
| Temel UI bileşenleri (shadcn/ui) | ✅ |
| Kimlik doğrulama (Auth) | ✅ |
| Ürün listesi ve detay sayfaları | ✅ |
| Sepet fonksiyonelliği (statik) | ✅ |
| Admin paneli temeli | ✅ |

---

### Faz 2: Bölge Sistemi ✅

**Durum**: Tamamlandı

#### 2A - Bölge Altyapısı

| Görev | Durum | Döküman |
|-------|-------|---------|
| RegionContext + Persistence + DB-driven | ✅ | phase-2a1 |
| Bölgeye göre ürün fiyat/stok | ✅ | phase-2a2 |
| Sepet bölge değişikliği yönetimi | ✅ | phase-2a3 |
| Bölge bazlı teslimat slotları | ✅ | phase-2a4 |

#### 2B - Admin Bölge Yönetimi

| Görev | Durum |
|-------|-------|
| Region products CRUD | ✅ |
| Bulk add (toplu ekleme) | ✅ |
| Fiyat/stok güncelleme | ✅ |

---

### Faz 3: Rol Sistemi ✅

**Durum**: Tamamlandı  
**Döküman**: [phases/phase-3-rbac.md](./phases/phase-3-rbac.md)

| Görev | Durum |
|-------|-------|
| RBAC altyapısı | ✅ |
| app_role enum (superadmin, dealer, supplier) | ✅ |
| has_role() fonksiyonu | ✅ |
| Invite flow (pending_invites) | ✅ |
| handle_new_user trigger | ✅ |
| Bayi admin sayfası | ✅ |
| Tedarikçi admin sayfası | ✅ |
| RequireRole guard component | ✅ |

---

### Faz 4: Email Sistemi ✅

**Durum**: Tamamlandı  
**Döküman**: [phases/phase-4-email.md](./phases/phase-4-email.md)

| Görev | Durum |
|-------|-------|
| Brevo entegrasyonu (Edge Function) | ✅ |
| Email şablonları (davet, bildirim) | ✅ |
| Sipariş email entegrasyonu | ✅ |
| Müşteri onay emaili | ✅ |
| Bayi sipariş bildirimi | ✅ |

---

### Faz 5: Onay Sistemi ✅

**Durum**: Tamamlandı  
**Döküman**: [phases/phase-5-approval-system.md](./phases/phase-5-approval-system.md)

| Görev | Durum |
|-------|-------|
| approval_status enum ve kolonlar | ✅ |
| Özel kayıt sayfaları (/bayi-kayit, /tedarikci-kayit) | ✅ |
| Beklemede sayfası (/beklemede) | ✅ |
| Admin onay/red UI | ✅ |
| Onay email bildirimleri | ✅ |
| RequireRole approval kontrolü | ✅ |
| AuthContext approvalStatus | ✅ |

---

### Faz 6: Sipariş ve Teslimat ✅

**Durum**: Tamamlandı  
**Döküman**: [phases/phase-6-order-delivery.md](./phases/phase-6-order-delivery.md)

| Görev | Durum |
|-------|-------|
| Sipariş akışı (pending → delivered) | ✅ |
| Bayi sipariş yönetimi (onay, iptal, durum) | ✅ |
| Teslimat kanıtı (not + fotoğraf) | ✅ |
| Tahsilat durumu (ödendi/ödenmedi) | ✅ |
| Tahmini teslimat saati | ✅ |
| Bayi müşteri yönetimi (dealer_customers) | ✅ |
| Müşteri sipariş takibi (/hesabim/siparisler) | ✅ |
| Tedarikçi hazırlanacaklar listesi | ✅ |

---

### Faz 7: Ödeme Sistemi ✅

**Durum**: Tamamlandı (2025-12-28)

| Görev | Durum | Öncelik |
|-------|-------|---------|
| Kapıda ödeme (nakit/kart) | ✅ | Yüksek |
| EFT/Havale ödeme sistemi | ✅ | Yüksek |
| Ödeme bildirim formu | ✅ | Yüksek |
| Admin IBAN ayarları | ✅ | Yüksek |
| Email bildirimleri | ✅ | Yüksek |
| Online ödeme entegrasyonu (iyzico/Stripe) | 📋 | Orta (Sonraki fazlarda) |
| Fatura oluşturma | 📋 | Düşük (Sonraki fazlarda) |

---

### Faz 8: İşletme (B2B) Paneli ✅

**Durum**: Tamamlandı (2026-01-04)

| Görev | Durum | Öncelik |
|-------|-------|---------|
| İşletme rolü (business) | ✅ | Yüksek |
| DB Şeması ve Businesses tablosu | ✅ | Yüksek |
| B2B Özel Fiyatlandırma Altyapısı | ✅ | Yüksek |
| Admin İşletme Yönetim Paneli | ✅ | Yüksek |
| İşletme davet ve kayıt sistemi | ✅ | Yüksek |
| B2B sipariş paneli (Dashboard) | ✅ | Yüksek |
| Bugün Halde fırsatları görünümü | ✅ | Orta |
| Sipariş geçmişi ve tekrar sipariş | ✅ | Orta |
| Tekrar sipariş validasyonu | ✅ | Yüksek |
| Fiyat değişikliği uyarıları | ✅ | Yüksek |
| Mevcut olmayan ürünler bildirimi | ✅ | Yüksek |
| Birim testler (Vitest) | ✅ | Orta |
| E2E testler (Playwright) | ✅ | Orta |

---

### Faz 8.5: Ana Sayfa İyileştirmeleri ✅

**Durum**: Tamamlandı (2026-01-04)

| Görev | Durum | Öncelik |
|-------|-------|---------|
| Nasıl Çalışır section (3 adımlı süreç) | ✅ | Orta |
| Mevsim Tazeleri spotlight section | ✅ | Orta |
| Trust Metrikleri section (istatistikler) | ✅ | Orta |
| Newsletter CTA section | ✅ | Orta |
| Responsive tasarım ve mobile-first | ✅ | Yüksek |
| Design system tutarlılığı | ✅ | Orta |

**Notasyon**: Yeni section'lar ana sayfada "Premium Products" ile "Categories" arasına eklendi. Tüm component'ler `src/components/home/` altında oluşturuldu.

---

### Faz 9: Tedarikçi Mobil Ürün Yönetimi ✅

**Durum**: Tamamlandı (2026-01-04)
**Döküman**: [phases/phase-9-supplier-panel.md](./phases/phase-9-supplier-panel.md)

| Görev | Durum | Öncelik |
|-------|-------|---------|
| Mobile-first supplier dashboard | ✅ | Yüksek |
| Supplier product management (CRUD) | ✅ | Yüksek |
| Image upload with camera integration | ✅ | Yüksek |
| Inline price editing | ✅ | Orta |
| Smart/advanced search | ✅ | Orta |
| Database migration (Phase 9) | ✅ | Yüksek |
| Supplier types & hooks | ✅ | Yüksek |
| Supplier UI components | ✅ | Yüksek |
| Unit tests | ✅ | Orta |
| E2E tests | 📋 | Orta |

**Notation**: Faz 9, tedarikçilerin doğrudan ürün ekleyip düzenleyebileceği mobil öncelikli bir panel olarak yeniden tasarlandı. Tedarikçi = Hal konsepti (tedarikçiler toptancı market kaynağıdır).

---

### Faz 10: Excel/CSV İçe/Dışa Aktarma Sistemi ✅

**Durum**: Tamamlandı (2026-01-07)
**Döküman**: [phases/phase-10-import-export.md](./phases/phase-10-import-export.md)

| Görev | Durum | Öncelik |
|-------|-------|---------|
| Database migration (product_imports tablosu) | ✅ | Yüksek |
| Excel parser (XLSX library integration) | ✅ | Yüksek |
| CSV parser (PapaParse integration) | ✅ | Yüksek |
| Product validator (validation & normalization) | ✅ | Yüksek |
| Import hook (useProductImport) | ✅ | Yüksek |
| Export hook (useProductExport) | ✅ | Yüksek |
| Import/Export UI components | ✅ | Orta |
| Audit log & rollback system | ✅ | Yüksek |
| Unit tests (Vitest) | ✅ | Orta |
| Integration tests (import/export flow) | ✅ | Orta |
| Business price isolation policy | ✅ | Yüksek |

**Test Coverage**: 142/155 tests passing (%91.6)
**Notation**: Faz 10, tedarikçilerin ürünlerini Excel/CSV formatında toplu olarak içe ve dışa aktarabilmesi için kapsamlı bir sistemdir. Validasyon, hata takibi, toplu işleme ve rollback özelliklerini içerir.

---

### Faz 11: Depo Yönetim MVP ✅

**Durum**: Tamamlandı (2026-01-09)
**Döküman**: [phases/phase-11-warehouse-mvp.md](./phases/phase-11-warehouse-mvp.md)

| Görev | Durum | Öncelik |
|-------|-------|---------|
| warehouse_manager rolü | ✅ | Yüksek |
| Vendors tablosu (multi-vendor support) | ✅ | Yüksek |
| Warehouse_staff tablosu (vendor-scoped) | ✅ | Yüksek |
| Orders tablosu güncellemeleri (placed_at, order_number, prepared_at, vendor_id) | ✅ | Yüksek |
| RPC functions (warehouse_get_orders, warehouse_get_picking_list, warehouse_mark_prepared) | ✅ | Yüksek |
| Fiyat maskeleme (DB + UI katmanı) | ✅ | Yüksek |
| Tenant isolation (vendor-based) | ✅ | Yüksek |
| Zaman penceresi filtresi (gece/gündüz vardiya) | ✅ | Orta |
| Toplu toplama listesi UI | ✅ | Yüksek |
| Admin panelde depo personeli yönetimi | ✅ | Orta |
| Unit tests (time window calculations) | ✅ | Orta |
| Integration tests (warehouse operations) | ✅ | Orta |

**Notation**: Faz 11, depo personeli için toplu sipariş hazırlama arayüzü ve güvenli fiyat maskeleme sistemi içerir. P0 güvenlik gereksinimi: Depo personeli fiyatları göremez (DB + UI katmanında korumalı). Tenant isolation, vendor-scoped warehouse_staff tablosu ile sağlanır.

---

### Faz 12: Çoklu Tedarikçi Ürün Yönetimi ✅

**Durum**: Tamamlandı (2026-01-05)
**Döküman**: [phases/phase-12-multi-supplier.md](./phases/phase-12-multi-supplier.md)

| Görev | Durum | Öncelik |
|-------|-------|---------|
| supplier_products junction table | ✅ | Yüksek |
| product_variations tablosu | ✅ | Yüksek |
| supplier_product_variations tablosu | ✅ | Yüksek |
| bugun_halde_comparison view | ✅ | Yüksek |
| Multi-supplier RPC functions (get_product_suppliers, get_product_variations, get_product_price_stats) | ✅ | Yüksek |
| Excel import varyasyon extraction | ✅ | Yüksek |
| Supplier panel varyasyon UI (VariationSelector, VariationTag, VariationList) | ✅ | Yüksek |
| "Bugün Halde" fiyat karşılaştırma sayfası | ✅ | Yüksek |
| Admin tedarikçi atama dialogu (SupplierAssignmentDialog) | ✅ | Orta |
| Unit tests (excel parser) | ✅ | Orta |
| Integration tests (RPC functions) | 📋 | Orta |

**Test Coverage**: 64/64 unit tests passing (100%)
**Notation**: Faz 12, bir ürünün birden fazla tedarikçi tarafından farklı fiyatlarla sunulabileceği çoklu tedarikçi sistemdir. Ürün varyasyonları (boyut, tip, koku, paket) normalized olarak saklanır ve "Bugün Halde" view'ı ile tüm tedarikçi fiyatları karşılaştırılabilir.

---

### Faz 13: Gelişmiş Özellikler 📋

**Durum**: Planlandı

| Görev | Durum | Öncelik |
|-------|-------|---------|
| Push bildirimleri | 📋 | Orta |
| SMS bildirimleri | 📋 | Orta |
| Müşteri sadakat programı | 📋 | Düşük |
| Abonelik sistemi | 📋 | Düşük |
| Mobil uygulama | 📋 | Düşük |

---

## Mimari Yapı

### Context Hiyerarşisi

```
<QueryClientProvider>
  <AuthProvider>           ← Rol + Onay durumu yönetimi
    <RegionProvider>       ← Bölge seçimi
      <CartProvider>       ← Sepet yönetimi
        <WishlistProvider> ← Favoriler
          <CompareProvider>← Karşılaştırma
            <App />
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </RegionProvider>
  </AuthProvider>
</QueryClientProvider>
```

### Veritabanı Tabloları

| Kategori | Tablolar |
|----------|----------|
| Core | profiles, user_roles, regions, products, region_products, orders, vendors |
| Role-specific | pending_invites, dealers, suppliers, businesses, warehouse_staff |
| Import/Export | product_imports |
| Orders | orders, order_items, delivery_proofs |
| Multi-Supplier (Phase 12) | supplier_products, product_variations, supplier_product_variations ✅ |

### Rol Enum'ları

| Rol | Açıklama |
|-----|----------|
| user | Standart müşteri |
| admin | Sistem yöneticisi |
| superadmin | Süper yönetici (admin'i kapsar) |
| dealer | Bölge bayisi |
| supplier | Tedarikçi |
| business | İşletme (B2B müşteri) |
| warehouse_manager | Depo yöneticisi |

---

## Güvenlik Prensipleri

1. **RLS Her Zaman Aktif**: Tüm tablolarda Row Level Security
2. **Rol Bazlı Erişim**: `has_role()` fonksiyonu ile kontrol
3. **Superadmin Kapsama**: Admin kontrolü superadmin için de true döner
4. **Veri İzolasyonu**: Her rol yalnızca kendi verilerine erişir
5. **Invite Flow Güvenliği**: Şifre kullanıcıda kalır
6. **Multi-role Desteği**: Bir kullanıcı birden fazla role sahip olabilir
7. **Approval Kontrolü**: Onaylanmamış bayi/tedarikçi dashboard'a erişemez

---

## Dosya Yapısı

```
src/
├── contexts/               # Global state yönetimi
│   ├── AuthContext.tsx     # Auth + RBAC + Approval
│   ├── RegionContext.tsx   # Bölge yönetimi
│   ├── CartContext.tsx     # Sepet
│   ├── WishlistContext.tsx # Favoriler
│   └── CompareContext.tsx  # Karşılaştırma
├── hooks/                  # Custom hooks
│   ├── useProducts.ts
│   ├── useRegions.ts
│   ├── useRegionProducts.ts
│   ├── useDealers.ts
│   ├── useSuppliers.ts
│   └── useEmailService.ts
├── components/
│   ├── auth/              # Auth bileşenleri
│   ├── layout/            # Layout bileşenleri
│   ├── product/           # Ürün bileşenleri
│   ├── region/            # Bölge bileşenleri
│   ├── admin/             # Admin bileşenleri
│   └── ui/                # shadcn/ui bileşenleri
├── pages/
│   ├── admin/             # Admin sayfaları
│   ├── dealer/            # Bayi sayfaları
│   ├── supplier/          # Tedarikçi sayfaları
│   └── ...                # Genel sayfalar
└── lib/                   # Utility fonksiyonlar

docs/
├── guides/                # Kullanıcı rehberleri
├── architecture/          # Teknik mimari
├── business/              # İş mantığı
├── phases/                # Faz arşivi
└── scripts/               # SQL ve scriptler

supabase/
├── migrations/            # DB migration'ları
└── functions/             # Edge Functions
```

---

## Faz Kapısı Kuralları

1. Bir faz tamamlanmadan sonraki faza geçilmez
2. Her fazın sonunda test ve kabul kriterleri kontrol edilir
3. Kritik buglar bir sonraki faza taşınmaz
4. Doküman her faz sonunda güncellenir
5. Migration'lar idempotent olmalı (tekrar çalıştırılabilir)

---

## Değişiklik Geçmişi

| Tarih | Faz | Değişiklik |
|-------|-----|------------|
| 2025-12-25 | 2A.1 | RegionContext oluşturuldu |
| 2025-12-25 | 2A.2 | Bölge bazlı fiyat/stok entegrasyonu |
| 2025-12-26 | 2A.3 | Sepet bölge değişikliği yönetimi |
| 2025-12-26 | 2A.4 | Bölge bazlı teslimat slotları |
| 2025-12-26 | 2B | Admin region_products CRUD |
| 2025-12-26 | 3 | RBAC + Bayi/Tedarikçi sistemi |
| 2025-12-26 | 4 | Email altyapısı (Brevo) |
| 2025-12-26 | 5 | Onay sistemi |
| 2025-12-26 | - | Docs yapısı yenilendi |
| 2025-12-27 | 5 | BayiKayit/TedarikciKayit dealers/suppliers tablosuna kayıt ekleme düzeltmesi |
| 2025-12-27 | 5 | Bekleyen davetler filtreleme (kayıtlı olanları gizle) |
| 2025-12-27 | 5 | Admin products sayfası base_price düzeltmesi |
| 2025-12-27 | 5 | Badge hover renk düzeltmeleri |
| 2025-12-27 | 6 | Sipariş ve Teslimat sistemi tamamlandı |
| 2025-12-27 | 6 | Bayi sipariş yönetimi (durum, iptal, ödeme) |
| 2025-12-27 | 6 | Teslimat kanıtı (not + fotoğraf) |
| 2025-12-27 | 6 | Bayi müşteri yönetimi (dealer_customers) |
| 2025-12-27 | 6 | Müşteri sipariş takibi sayfası |
| 2025-12-27 | 6 | Tedarikçi hazırlanacaklar listesi |
| 2025-12-28 | 7 | Ödeme Sistemi tamamlandı (EFT/Kapıda Ödeme) |
| 2025-12-28 | 8 | İşletme (B2B) Paneli altyapısı kuruldu |
| 2025-12-28 | - | Vitest ile birim test altyapısı kuruldu |
| 2026-01-04 | 8 | Faz 8 tamamlandı - Tekrar sipariş özelliği eklendi |
| 2026-01-04 | 8 | Birim testler (orderUtils, useRepeatOrder) eklendi |
| 2026-01-04 | 8 | E2E testler (business/customer repeat order) eklendi |
| 2026-01-04 | 9 | Faz 9 tamamlandı - Tedarikçi mobil ürün yönetimi |
| 2026-01-07 | 10 | Faz 10 tamamlandı - Excel/CSV import/export |
| 2026-01-09 | 11 | Faz 11 tamamlandı - Depo yönetim MVP (fiyat maskeleme, picking list) |
| 2026-01-05 | 12 | Faz 12 tamamlandı - Çoklu tedarikçi ürün yönetimi (junction table, varyasyonlar) |
| 2026-01-06 | 12 | Faz 12 bug fix'leri - Cart Context migration, ProductCard null price, WarehouseStaff syntax |

---

## Sonraki Adımlar

### Acil (Bu Hafta)

1. ✅ Supabase migration tamamla
2. ✅ Docs yapısını yenile
3. ✅ Faz 5 bug fix'leri tamamla
4. ⏳ Faz 6 planlaması yap

### Kısa Vadeli (Bu Ay)

1. Bayi dashboard geliştirme
2. Sipariş akışı tamamlama
3. Teslimat takibi

### Orta Vadeli (3 Ay)

1. Tedarikçi dashboard
2. Ödeme entegrasyonu
3. Raporlama

---

**Son güncelleme:** 2026-01-10
**Mevcut Sürüm:** v1.12.0 (Phase 12 Complete)

