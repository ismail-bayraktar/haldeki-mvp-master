# Haldeki.com Yol Haritası

> Bu doküman, Haldeki projesinin teknik yol haritasını, faz durumlarını ve gelecek planlarını içerir.

Son güncelleme: 2025-12-27

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

### Faz 8: İşletme (B2B) Paneli 📋

**Durum**: Planlandı

| Görev | Durum | Öncelik |
|-------|-------|---------|
| İşletme rolü (business) | 📋 | Yüksek |
| İşletme davet ve kayıt sistemi | 📋 | Yüksek |
| B2B sipariş paneli | 📋 | Yüksek |
| Bugün Halde fırsatları görünümü | 📋 | Orta |
| Sipariş geçmişi ve tekrar sipariş | 📋 | Orta |
| Bayi → İşletme kayıt akışı | 📋 | Orta |

---

### Faz 9: Tedarikçi Gelişmiş Özellikler 📋

**Durum**: Planlandı

| Görev | Durum | Öncelik |
|-------|-------|---------|
| Tedarikçi performans metrikleri | 📋 | Orta |
| Otomatik stok uyarıları | 📋 | Orta |
| Tedarikçi raporları | 📋 | Düşük |

---

### Faz 10: Gelişmiş Özellikler 📋

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
| Core | profiles, user_roles, regions, products, region_products, orders |
| Role-specific | pending_invites, dealers, suppliers, supplier_offers |

### Rol Enum'ları

| Rol | Açıklama |
|-----|----------|
| user | Standart müşteri |
| admin | Sistem yöneticisi |
| superadmin | Süper yönetici (admin'i kapsar) |
| dealer | Bölge bayisi |
| supplier | Tedarikçi |

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

Son güncelleme: 2025-12-27

