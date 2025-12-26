# Phase 3: RBAC + Superadmin + Bayi/Tedarikçi Sistemi

## Özet
Rol bazlı erişim kontrolü (RBAC), superadmin yetkileri ve bayi/tedarikçi davet sistemi.

## Tamamlanma Tarihi
2024-12

## Son Güncelleme
2024-12-26 - Phase 3.2 (Dashboard İyileştirmeleri + Bölge Düzenleme + Bildirimler)

---

## Phase 3.1 Değişiklikleri

### 1. user_roles RLS Güvenlik Düzeltmesi

**Kritik değişiklik:** Admin'in superadmin rolünü değiştirmesi engellendi.

### 2. **YENİ: Dealer Orders RLS**

**Kritik güvenlik:** Dealer'ların sadece atandıkları bölgelerdeki siparişleri görmesi sağlandı.

```sql
CREATE POLICY "Dealers can view orders in assigned regions"
ON public.orders FOR SELECT
USING (
  region_id IN (
    SELECT UNNEST(region_ids) 
    FROM public.dealers 
    WHERE user_id = auth.uid()
  )
);
```

CREATE POLICY "Admins can delete non-superadmin roles" ON user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin') AND role != 'superadmin');

CREATE POLICY "Admins can update non-superadmin roles" ON user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND role != 'superadmin')
  WITH CHECK (has_role(auth.uid(), 'admin') AND role != 'superadmin');
```

### 2. Dealer Dashboard (`/bayi`)

**Route:** `/bayi` - RequireRole(['dealer'])

**Özellikler:**
- Bayi bilgileri kartı (firma adı, iletişim)
- Atanan bölgeler listesi
- Bölge siparişleri tablosu (region_id ile filtreleme)
- Sipariş durumu badge'leri

**Dosyalar:**
- `src/pages/dealer/DealerDashboard.tsx`
- `src/hooks/useDealerProfile.ts`
- `src/hooks/useDealerOrders.ts`
- `src/components/dealer/DealerOrderList.tsx`

### 3. Supplier Dashboard (`/tedarikci`)

**Route:** `/tedarikci` - RequireRole(['supplier'])

**Özellikler:**
- Tedarikçi bilgileri kartı
- Ürün teklif formu (fiyat, miktar, birim)
- Teklifler tablosu (pending/approved/rejected)
- Teklif silme (sadece pending)

**Dosyalar:**
- `src/pages/supplier/SupplierDashboard.tsx`
- `src/hooks/useSupplierProfile.ts`
- `src/hooks/useSupplierOffers.ts`
- `src/components/supplier/SupplierOfferForm.tsx`

### 4. supplier_offers Tablosu

```sql
CREATE TABLE public.supplier_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offered_price numeric NOT NULL CHECK (offered_price > 0),
  offered_quantity integer NOT NULL CHECK (offered_quantity > 0),
  unit text NOT NULL DEFAULT 'kg',
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id, status)
);
```

**RLS Politikaları:**
- Supplier: kendi tekliflerini CRUD (pending olanları update/delete)
- Admin: tüm teklifleri görüntüle + güncelle (approve/reject)

### 5. Admin Users Sayfası Genişletme

**Yeni özellikler:**
- Tüm roller badge olarak görünür
  - superadmin: kırmızı (destructive)
  - admin: mavi (default)
  - dealer: yeşil
  - supplier: mor
  - user: gri
- Rol filtresi dropdown
- Rol yönetimi dialog
- Self-lock koruması (kullanıcı kendi admin/superadmin rolünü kaldıramaz)
- Frontend + Backend (RLS) güvenlik

---

## Test Kullanıcıları

### Bayi Test Hesabı
| Alan | Değer |
|------|-------|
| Email | `test.bayi@haldeki.com` |
| Firma | Test Bayi Ltd. |
| Yetkili | Ahmet Yılmaz |
| Telefon | 0532 111 2233 |
| Bölgeler | Menemen, Aliağa |

**Signup sonrası:**
- `user_roles` → dealer
- `dealers` tablosuna satır
- `/bayi` dashboard erişimi

### Tedarikçi Test Hesabı
| Alan | Değer |
|------|-------|
| Email | `test.tedarikci@haldeki.com` |
| Firma | Test Tedarik A.Ş. |
| Yetkili | Mehmet Kaya |
| Telefon | 0533 444 5566 |

**Signup sonrası:**
- `user_roles` → supplier
- `suppliers` tablosuna satır
- `/tedarikci` dashboard erişimi

---

## E2E Test Checklist

### Invite Flow Testi
| # | Adım | Beklenen | Durum |
|---|------|----------|-------|
| 1 | Superadmin `/admin/dealers` aç | Sayfa görünür | ✅ |
| 2 | "Yeni Bayi Daveti" oluştur | Davet kaydedildi | ✅ |
| 3 | `pending_invites` kontrol | Kayıt var, used_at NULL | ✅ |
| 4 | test.bayi@haldeki.com ile signup | Başarılı kayıt | ✅ |
| 5 | `user_roles` kontrol | dealer rolü atanmış | ✅ |
| 6 | `dealers` tablosu kontrol | Satır oluşmuş | ✅ |
| 7 | `pending_invites` kontrol | used_at dolu | ✅ |
| 8 | Dealer login → `/bayi` | Dashboard açılır | ⏳ TEST EDİN |
| 9 | Dealer → `/admin` dene | Engellenir, redirect | ⏳ TEST EDİN |

### Kritik Düzeltme: auth.users Trigger
**Sorun:** `handle_new_user` trigger auth.users üzerine tanımlanmamıştı.

**Çözüm:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Mevcut test kullanıcıları manuel olarak düzeltildi (profiles, user_roles, dealers, suppliers).

### Rol İzolasyon Matrisi
| Rol | /admin | /bayi | /tedarikci |
|-----|--------|-------|------------|
| superadmin | ✅ | ❌ redirect | ❌ redirect |
| admin | ✅ | ❌ redirect | ❌ redirect |
| dealer | ❌ redirect | ✅ | ❌ redirect |
| supplier | ❌ redirect | ❌ redirect | ✅ |
| user | ❌ redirect | ❌ redirect | ❌ redirect |

---

## Önceki Phase 3 Değişiklikleri

### 1. Database Migrations

#### Migration-1: Enum Genişletme
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dealer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supplier';
```

#### Migration-2: Tablolar + RLS + Trigger
- `pending_invites`: Davet sistemi tablosu
- `dealers`: Bayi bilgileri
- `suppliers`: Tedarikçi bilgileri
- `has_role()` güncelleme
- `handle_new_user()` güncelleme

### 2. AuthContext Genişletme
```typescript
interface AuthContextType {
  isSuperAdmin: boolean;
  isDealer: boolean;
  isSupplier: boolean;
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
}
```

### 3. RequireRole Guard
- Route koruma componenti
- allowedRoles array ile yetki kontrolü

### 4. Admin Panel Sayfaları
- `/admin/dealers` - Bayi yönetimi + davet
- `/admin/suppliers` - Tedarikçi yönetimi + davet

### 5. Superadmin Seed
- `bayraktarismail00@gmail.com` → superadmin + admin

---

## Acceptance Criteria (Phase 3.1)

- [x] user_roles RLS: Admin superadmin rolü değiştiremez
- [x] Self-lock: Kullanıcı kendi admin/superadmin rolünü kaldıramaz (UI)
- [x] Dealer Dashboard: `/bayi` route + bayi bilgileri + bölge siparişleri
- [x] Supplier Dashboard: `/tedarikci` route + teklif formu + teklifler
- [x] supplier_offers tablosu + RLS
- [x] Admin Users: Rol badge'leri + filtre + yönetim dialog
- [x] Test davetleri oluşturuldu
- [ ] E2E invite flow test (manuel)

---

## Phase 3.2 Değişiklikleri (2024-12-26)

### 1. Dashboard Header İyileştirmeleri
**Dealer ve Supplier Dashboard'lara navigasyon eklendi:**
- "Siteye Git" butonu (Home ikonu) → Ana sayfaya yönlendirir
- "Çıkış" butonu → Logout işlemi

**Dosyalar:**
- `src/pages/dealer/DealerDashboard.tsx`
- `src/pages/supplier/SupplierDashboard.tsx`

### 2. Bayi Bölge Düzenleme
**Admin panelinden mevcut bayilerin bölgelerini düzenleme:**
- "Bölge" butonu (her bayi satırında)
- Dialog ile checkbox listesi (tüm bölgeler)
- `useDealers.updateDealer()` ile region_ids güncelleme

**Dosyalar:**
- `src/pages/admin/Dealers.tsx`

### 3. Basit Bildirim Sistemi
**Dashboard'larda son 24 saat içindeki aktiviteler gösteriliyor:**

**Dealer Dashboard:**
- Yeni sipariş sayısı badge'i (son 24 saat)
- `{N} yeni sipariş` formatında

**Supplier Dashboard:**
- Onaylanan teklif sayısı (yeşil badge)
- Reddedilen teklif sayısı (kırmızı badge)

### 4. Email Altyapısı Kararı
**Seçilen Servis: Brevo (Sendinblue)**

**Neden Brevo?**
- 9,000 email/ay free plan (en cömert)
- Transactional + Marketing email desteği
- SMS entegrasyonu
- Türkçe arayüz
- SMTP + API desteği
- Profesyonel altyapı

**Kurulum (Gelecek faz):**
1. Brevo hesabı oluştur: https://www.brevo.com
2. Domain doğrulama yap
3. API key al
4. Edge function ile entegre et

---

## Acceptance Criteria (Phase 3.2)

- [x] Dashboard header'larda "Siteye Git" ve "Çıkış" butonları
- [x] Admin panelinden bayi bölge düzenleme dialog'u
- [x] Dealer dashboard'da yeni sipariş bildirimi
- [x] Supplier dashboard'da teklif durumu bildirimleri
- [x] Brevo email servisi kararı ve dokümantasyonu

---

## Gelecek İyileştirmeler (Phase 3.3+)
- Brevo email entegrasyonu
- Email bildirimi (davet, sipariş, teklif durumu)
- Teslimat durumu güncelleme (dealer)
- Admin tedarikçi düzenleme dialog'u
- Bölge bazlı bayi ayarları
- Komisyon/slot override
