# Haldeki.com Sistem Mimarisi

> Teknik mimari kararları ve sistem tasarımı

## 🏗️ Genel Bakış

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │   Pages     │ │ Components  │ │   Hooks     │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│  ┌─────────────────────────────────────────────┐               │
│  │              Context Providers               │               │
│  │  Auth → Region → Cart → Wishlist → Compare  │               │
│  └─────────────────────────────────────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│                    TanStack Query (Cache Layer)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Lovable Cloud)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │   Auth       │ │   Database   │ │ Edge Funcs   │            │
│  │  (RBAC)      │ │  (Postgres)  │ │ (send-email) │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────────────────────────────────────┐              │
│  │           Row Level Security (RLS)           │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                               │
│  │  Brevo API   │  → Transactional Emails                       │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 📂 Dosya Yapısı

```
src/
├── components/
│   ├── admin/          # Admin panel bileşenleri
│   ├── auth/           # Kimlik doğrulama (AuthDrawer, RequireRole)
│   ├── dealer/         # Bayi bileşenleri
│   ├── home/           # Anasayfa bileşenleri
│   ├── layout/         # Header, Footer, Navigation
│   ├── product/        # Ürün kartları, galeri, yorumlar
│   ├── region/         # Bölge seçimi, modallar
│   ├── seo/            # Meta tags, schema markup
│   ├── supplier/       # Tedarikçi bileşenleri
│   └── ui/             # shadcn/ui primitives
├── contexts/
│   ├── AuthContext     # Kimlik + Roller (RBAC)
│   ├── RegionContext   # Bölge seçimi + persistence
│   ├── CartContext     # Sepet + bölge validasyonu
│   ├── WishlistContext # Favoriler
│   └── CompareContext  # Karşılaştırma
├── hooks/
│   ├── useRegions      # DB'den bölge fetch
│   ├── useProducts     # Ürün listesi
│   ├── useRegionProducts # Bölge-ürün fiyat/stok
│   ├── useCartValidation # Sepet validasyonu
│   ├── useDealers      # Bayi CRUD + invite
│   ├── useSuppliers    # Tedarikçi CRUD + invite
│   └── useEmailService # Email gönderimi
├── pages/
│   ├── admin/          # Admin sayfaları
│   ├── dealer/         # Bayi dashboard
│   └── supplier/       # Tedarikçi dashboard
├── lib/
│   ├── utils.ts        # Genel yardımcılar
│   └── productUtils.ts # Ürün merge/sıralama
└── integrations/
    └── supabase/       # Client + Types (auto-generated)
```

## 🔐 Güvenlik Mimarisi

### Row Level Security (RLS)

```sql
-- Örnek: Bayiler sadece kendi bölgelerindeki siparişleri görür
CREATE POLICY "Dealers can view orders in their regions"
ON orders FOR SELECT
USING (
  region_id = ANY(
    SELECT unnest(region_ids) FROM dealers 
    WHERE user_id = auth.uid()
  )
);
```

### Rol Hiyerarşisi

```
superadmin
    ├── admin (tüm admin yetkileri)
    │     ├── dealers (bayi yönetimi)
    │     ├── suppliers (tedarikçi yönetimi)
    │     └── orders (sipariş yönetimi)
    │
dealer ──────── Kendi bölgesi siparişleri
    │
supplier ────── Kendi teklifleri
    │
user ─────────── Standart müşteri
```

### `has_role()` Fonksiyonu

```sql
CREATE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id 
    AND (role = _role OR (_role = 'admin' AND role = 'superadmin'))
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

## 🗄️ Veritabanı Şeması

### Ana Tablolar

| Tablo | Açıklama |
|-------|----------|
| `products` | Ana ürün kataloğu |
| `regions` | Teslimat bölgeleri |
| `region_products` | Bölgeye özel fiyat/stok |
| `orders` | Siparişler |
| `profiles` | Kullanıcı profilleri |
| `user_roles` | RBAC rolleri |
| `dealers` | Bayi bilgileri |
| `suppliers` | Tedarikçi bilgileri |
| `supplier_offers` | Tedarikçi teklifleri |
| `pending_invites` | Davet sistemi |

### İlişki Diyagramı

```
products ──┬── region_products ──── regions
           │
           └── supplier_offers ──── suppliers ──── user_roles ──── profiles
                                                         │
dealers ───────────────────────────────────────────────┘
    │
    └── orders (region_id ile bağlantılı)
```

## 🔄 Data Flow

### Bölge Bazlı Ürün Gösterimi

```
1. useProducts() → products tablosu (master catalog)
2. useRegionProducts(regionId) → region_products tablosu
3. mergeProductsWithRegionInfo() → client-side merge
4. sortByAvailability() → stokta olanlar önce
5. ProductCard render
```

### Sepet Bölge Değişikliği

```
1. Kullanıcı yeni bölge seçer
2. useCartValidation.validateCartForRegion()
3. RegionChangeConfirmModal gösterilir
4. Kullanıcı onaylarsa:
   - Geçersiz ürünler kaldırılır
   - Fiyatlar güncellenir
   - Bölge değişir
```

### Bayi Davet Akışı

```
1. Admin bayi oluşturur + email gönderir
2. pending_invites tablosuna kayıt
3. Kullanıcı /auth sayfasında kayıt olur
4. handle_new_user trigger:
   - pending_invites kontrol
   - user_roles'a rol ekle
   - dealers tablosuna user_id ekle
```

## ⚡ Performance Stratejileri

### TanStack Query Cache

```typescript
// 5 dakika stale time, 30 dakika cache
useQuery({
  queryKey: ['regions'],
  queryFn: fetchRegions,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});
```

### Client-Side Merge (vs DB Join)

- Products ve region_products ayrı cache'lenir
- Bölge değiştiğinde sadece region_products yenilenir
- Master catalog cache'de kalır

## 📧 Email Sistemi

### Edge Function: send-email

```
Request → CORS → JWT Verify → Template Select → HTML Render → Brevo API
```

### Templates

| Template | Kullanım |
|----------|----------|
| `dealer_invite` | Bayi davet emaili |
| `supplier_invite` | Tedarikçi davet emaili |
| `offer_status` | Teklif durum bildirimi |
| `order_notification` | Bayi sipariş bildirimi |
| `order_confirmation` | Müşteri sipariş onayı |

---

Son güncelleme: 2025-12-26
