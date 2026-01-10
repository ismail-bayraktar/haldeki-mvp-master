# Haldeki.com Master Plan

> Bu doküman, Haldeki projesinin teknik yol haritasını ve mimari kararlarını içerir.
> Son güncelleme: 2025-12-26

## 🎯 Proje Vizyonu

Haldeki.com, taze meyve-sebze tedarik zincirini dijitalleştiren, bölge bazlı teslimat ve çoklu rol (müşteri, bayi, tedarikçi, admin) destekli bir B2C/B2B platformudur.

---

## 📍 Faz Haritası

### Faz 1: Temel Altyapı ✅
- [x] Proje kurulumu (Vite + React + TypeScript)
- [x] Supabase entegrasyonu
- [x] Temel UI bileşenleri (shadcn/ui)
- [x] Kimlik doğrulama (Auth)
- [x] Ürün listesi ve detay sayfaları
- [x] Sepet fonksiyonelliği (statik)
- [x] Admin paneli temeli

### Faz 2: Bölge Sistemi ✅
- [x] 2A.1 - RegionContext + Persistence + DB-driven Regions
- [x] 2A.2 - Bölgeye göre ürün fiyat/stok gösterimi
- [x] 2A.3 - Sepet bölge değişikliği yönetimi
- [x] 2A.4 - Bölge bazlı teslimat slotları
- [x] 2B - Admin bölge ürünleri yönetimi (CRUD + bulk add)

### Faz 3: Rol Sistemi ✅
- [x] 3A - RBAC altyapısı (superadmin, dealer, supplier rolleri)
- [x] 3B - Invite flow (pending_invites + handle_new_user trigger)
- [x] 3C - Bayi/Tedarikçi admin panel sayfaları
- [x] 3D - RequireRole guard component
- [ ] 3E - Dealer dashboard (planlandı)
- [ ] 3F - Supplier dashboard (planlandı)

### Faz 4: Email Sistemi ✅
- [x] 4A - Brevo entegrasyonu (edge function)
- [x] 4B - Email şablonları (davet, bildirim, onay)
- [x] 4C - Sipariş email entegrasyonu
- [x] 4D - Müşteri onay emaili
- [x] 4E - Bayi sipariş bildirimi

### Faz 5: Sipariş ve Teslimat (Planlandı)
- [ ] 5A - Sipariş akışı tamamlama
- [ ] 5B - Bayi sipariş yönetimi
- [ ] 5C - Teslimat takibi

---

## 🏗️ Mimari Yapı

### Context Hiyerarşisi
```
<QueryClientProvider>
  <AuthProvider>           ← Faz 3'te genişletildi (isSuperAdmin, isDealer, isSupplier)
    <RegionProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </RegionProvider>
  </AuthProvider>
</QueryClientProvider>
```

### Veritabanı Tabloları
- `regions` - Teslimat bölgeleri (delivery_slots JSONB)
- `products` - Ana ürün kataloğu
- `region_products` - Bölgeye özel fiyat/stok (UNIQUE region_id+product_id)
- `orders` - Siparişler
- `profiles` - Kullanıcı profilleri
- `user_roles` - Kullanıcı rolleri (multi-role destekli)
- `pending_invites` - Bayi/tedarikçi davet sistemi
- `dealers` - Bayi bilgileri (region_ids UUID[])
- `suppliers` - Tedarikçi bilgileri

### Rol Enum'ları (`app_role`)
- `user` - Standart müşteri
- `admin` - Sistem yöneticisi
- `superadmin` - Süper yönetici (admin yetkilerini kapsar)
- `dealer` - Bölge bayisi
- `supplier` - Tedarikçi

---

## 📁 Dosya Yapısı

```
src/
├── contexts/
│   ├── AuthContext.tsx      # Kimlik doğrulama + RBAC (Faz 3)
│   ├── RegionContext.tsx    # Bölge yönetimi
│   ├── CartContext.tsx      # Sepet (unitPriceAtAdd, regionIdAtAdd)
│   ├── WishlistContext.tsx  # Favoriler
│   └── CompareContext.tsx   # Karşılaştırma
├── hooks/
│   ├── useRegions.ts        # DB'den bölge çekme
│   ├── useProducts.ts       # Ürün çekme
│   ├── useRegionProducts.ts # Bölge-ürün fiyat/stok
│   ├── useCartValidation.ts # Sepet validasyonu (Faz 2A.3)
│   ├── useAdminRegionProducts.ts # Admin CRUD
│   ├── useDealers.ts        # Bayi CRUD + invite (Faz 3)
│   └── useSuppliers.ts      # Tedarikçi CRUD + invite (Faz 3)
├── lib/
│   ├── utils.ts             # Genel yardımcılar
│   └── productUtils.ts      # Ürün merge/sıralama
├── components/
│   ├── auth/
│   │   ├── AuthDrawer.tsx
│   │   └── RequireRole.tsx  # Route guard (Faz 3)
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── RegionSelector.tsx
│   │   └── ...
│   └── region/
│       ├── RequireRegionModal.tsx
│       ├── RegionBanner.tsx
│       └── RegionChangeConfirmModal.tsx  # Faz 2A.3
└── pages/
    ├── admin/
    │   ├── Dashboard.tsx
    │   ├── Orders.tsx
    │   ├── Users.tsx
    │   ├── Products.tsx
    │   ├── RegionProducts.tsx  # Faz 2B
    │   ├── Dealers.tsx         # Faz 3
    │   ├── Suppliers.tsx       # Faz 3
    │   └── Settings.tsx
    └── ...

docs/
├── haldeki_master_plan.md
└── phases/
    ├── phase-2a1-regioncontext.md
    ├── phase-2a2-region-products.md
    ├── phase-2a3-cart-region.md
    ├── phase-2a4-delivery-slots.md
    ├── phase-3-rbac.md
    └── phase-4-email.md
```

---

## 🔐 Güvenlik Prensipleri

1. **RLS Her Zaman Aktif**: Tüm tablolarda Row Level Security
2. **Rol Bazlı Erişim**: `has_role()` fonksiyonu ile kontrol (SECURITY DEFINER)
3. **Superadmin Kapsama**: `has_role(uid, 'admin')` superadmin için de true döner
4. **Veri İzolasyonu**: Her rol yalnızca kendi verilerine erişir
5. **Invite Flow Güvenliği**: Şifre kullanıcıda kalır, admin sadece davet oluşturur
6. **Multi-role Desteği**: UNIQUE(user_id, role) ile birden fazla rol

---

## 📋 Faz Kapısı Kuralları

1. Bir faz tamamlanmadan sonraki faza geçilmez
2. Her fazın sonunda test ve kabul kriterleri kontrol edilir
3. Kritik buglar bir sonraki faza taşınmaz
4. Doküman her faz sonunda güncellenir

---

## 📝 Değişiklik Geçmişi

| Tarih | Faz | Değişiklik |
|-------|-----|------------|
| 2025-12-25 | 2A.1 | RegionContext oluşturuldu, dokümantasyon başlatıldı |
| 2025-12-25 | 2A.2 | Bölge bazlı fiyat/stok entegrasyonu tamamlandı |
| 2025-12-26 | 2A.3 | Sepet bölge değişikliği yönetimi tamamlandı |
| 2025-12-26 | 2A.4 | Bölge bazlı teslimat slotları tamamlandı |
| 2025-12-26 | 2B | Admin region_products CRUD + bulk add tamamlandı |
| 2025-12-26 | 3 | RBAC + Superadmin + Bayi/Tedarikçi sistemi tamamlandı |
| 2025-12-26 | 4 | Email altyapısı tamamlandı (Brevo, şablonlar, sipariş entegrasyonu) |
