# Faz 5: Bayi/Tedarikçi Onay Sistemi

> Tarih: 2025-12-26 (Güncelleme: 2025-12-27)
> Durum: ✅ Tamamlandı

## Özet

Bu fazda bayi ve tedarikçi kayıt akışı iyileştirildi. Email davetinden sonra kullanıcı özel bir kayıt formuna yönlendirilir, ek bilgiler toplanır ve admin onayı beklenir.

---

## Problem

Önceki sistemde:
- Email'deki CTA butonu genel `/giris` sayfasına yönlendiriyordu
- Kullanıcı kayıt olduktan sonra otomatik olarak bayi/tedarikçi oluyordu
- Admin onay mekanizması yoktu
- Ek bilgi toplama (vergi no, kategoriler) yoktu

---

## Çözüm

### Yeni Akış

```
┌─────────────────────────────────────────────────────────────┐
│  1. Admin Davet Oluşturur                                   │
│     └── pending_invites tablosuna kayıt                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Email Gönderilir                                        │
│     └── CTA: /bayi-kayit?token=xxx veya /tedarikci-kayit    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Kullanıcı Özel Formu Doldurur                           │
│     ├── Token doğrulanır                                    │
│     ├── Şifre belirlenir                                    │
│     └── Ek bilgiler toplanır (vergi no, kategoriler)        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Kayıt Tamamlanır                                        │
│     ├── auth.users'a eklenir                                │
│     ├── handle_new_user trigger çalışır                     │
│     ├── dealers/suppliers tablosuna approval_status=pending │
│     └── /beklemede sayfasına yönlendirilir                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Admin Onaylar/Reddeder                                  │
│     ├── Admin panelde "Onay Bekleyen" bölümü                │
│     ├── Onayla → approval_status='approved' + email         │
│     └── Reddet → approval_status='rejected' + email         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Kullanıcı Dashboard'a Erişir                            │
│     └── RequireRole approval kontrolü yapar                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Veritabanı Değişiklikleri

### Yeni Enum

```sql
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
```

### Dealers Tablosu - Yeni Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `approval_status` | approval_status | Onay durumu (varsayılan: pending) |
| `approval_notes` | TEXT | Admin notu |
| `approved_at` | TIMESTAMPTZ | Onay tarihi |
| `approved_by` | UUID | Onaylayan admin |
| `tax_number` | TEXT | Vergi numarası |

### Suppliers Tablosu - Yeni Kolonlar

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `approval_status` | approval_status | Onay durumu (varsayılan: pending) |
| `approval_notes` | TEXT | Admin notu |
| `approved_at` | TIMESTAMPTZ | Onay tarihi |
| `approved_by` | UUID | Onaylayan admin |
| `product_categories` | TEXT[] | Ürün kategorileri |

### RLS Policy

```sql
CREATE POLICY "Public can read own invite by id"
  ON public.pending_invites FOR SELECT
  USING (true);
```

---

## Yeni Sayfalar

### /bayi-kayit

- **Dosya**: `src/pages/BayiKayit.tsx`
- **Özellikler**:
  - URL'den token alır
  - Token geçerliliğini kontrol eder (süresi dolmuş, kullanılmış)
  - Formu pre-fill eder (invite'dan gelen bilgilerle)
  - Ek bilgi toplar: Şifre, Firma Adı, Yetkili, Telefon, Vergi No
  - Signup sonrası /beklemede'ye yönlendirir

### /tedarikci-kayit

- **Dosya**: `src/pages/TedarikciKayit.tsx`
- **Özellikler**:
  - Bayi kayıt ile benzer
  - Ek olarak: Ürün kategorileri (checkbox listesi)

### /beklemede

- **Dosya**: `src/pages/Beklemede.tsx`
- **Özellikler**:
  - Approval status'u gösterir (pending, approved, rejected)
  - Onaylandıysa dashboard'a yönlendirir
  - Reddedildiyse bilgi mesajı gösterir

---

## Hook Güncellemeleri

### useDealers.ts

```typescript
// Yeni fonksiyonlar
approveDealer(id: string, notes?: string): Promise<boolean>
rejectDealer(id: string, notes?: string): Promise<boolean>

// Yeni return değeri
pendingApplications: Dealer[]  // approval_status='pending' olanlar
```

### useSuppliers.ts

```typescript
// Yeni fonksiyonlar
approveSupplier(id: string, notes?: string): Promise<boolean>
rejectSupplier(id: string, notes?: string): Promise<boolean>

// Yeni return değeri
pendingApplications: Supplier[]
```

### useEmailService.ts

```typescript
// Yeni fonksiyonlar
sendNewApplicationNotification(...)  // Admin'e yeni başvuru bildirimi
sendApplicationApproved(...)         // Kullanıcıya onay bildirimi
sendApplicationRejected(...)         // Kullanıcıya red bildirimi

// Güncellenen fonksiyonlar
sendDealerInvite(..., inviteId)     // Token ile özel URL
sendSupplierInvite(..., inviteId)   // Token ile özel URL
```

---

## Yeni Email Şablonları

### admin_new_application

Admin'e gönderilir. İçerik:
- Başvuru türü (Bayi/Tedarikçi)
- Firma adı
- Yetkili bilgileri
- Dashboard linki

### application_approved

Kullanıcıya gönderilir. İçerik:
- Tebrik mesajı
- Dashboard linki

### application_rejected

Kullanıcıya gönderilir. İçerik:
- Bilgilendirme mesajı
- Red sebebi (opsiyonel)
- İletişim linki

---

## AuthContext Güncellemeleri

### Yeni State

```typescript
approvalStatus: 'pending' | 'approved' | 'rejected' | null
isApprovalChecked: boolean
```

### Yeni Davranış

- Dealer/Supplier girişinde `approval_status` kontrol edilir
- Pending/Rejected ise dashboard'a erişim engellenir

---

## RequireRole Güncellemeleri

### Yeni Prop

```typescript
requireApproval?: boolean  // varsayılan: true
```

### Yeni Davranış

```typescript
if (requireApproval && (isDealer || isSupplier)) {
  if (approvalStatus !== 'approved') {
    return <Navigate to="/beklemede" />
  }
}
```

---

## Admin Panel Güncellemeleri

### Dealers.tsx

- "Onay Bekleyen Başvurular" kartı (sarı vurgulu)
- Her başvuru için: Onayla / Reddet butonları
- Onay dialog'u: Not ekleme imkanı
- Tablo: approval_status badge'i

### Suppliers.tsx

- Aynı yapı
- Ek olarak: Ürün kategorileri gösterimi

---

## Dosya Değişiklikleri Özeti

| Dosya | Değişiklik |
|-------|------------|
| `supabase/migrations/20251226150000_approval_system.sql` | Yeni migration |
| `src/integrations/supabase/types.ts` | Yeni kolonlar ve enum |
| `src/pages/BayiKayit.tsx` | Yeni sayfa + dealers tablosu kayıt |
| `src/pages/TedarikciKayit.tsx` | Yeni sayfa + suppliers tablosu kayıt |
| `src/pages/Beklemede.tsx` | Yeni sayfa |
| `src/hooks/useDealers.ts` | Onay fonksiyonları + kayıtlı davet filtreleme |
| `src/hooks/useSuppliers.ts` | Onay fonksiyonları + kayıtlı davet filtreleme |
| `src/hooks/useEmailService.ts` | Yeni email fonksiyonları |
| `supabase/functions/send-email/index.ts` | Yeni şablonlar |
| `src/pages/admin/Dealers.tsx` | Onay UI + badge hover renk düzeltmesi |
| `src/pages/admin/Suppliers.tsx` | Onay UI + badge hover renk düzeltmesi |
| `src/pages/admin/Products.tsx` | base_price düzeltmesi |
| `src/components/auth/RequireRole.tsx` | Approval kontrolü |
| `src/contexts/AuthContext.tsx` | approvalStatus state |
| `src/App.tsx` | Yeni route'lar |

---

## Test Senaryoları

1. ✅ Admin bayi daveti oluşturur → Email gönderilir
2. ✅ Email'deki link ile /bayi-kayit açılır
3. ✅ Geçersiz token → Hata mesajı
4. ✅ Süresi dolmuş token → Hata mesajı
5. ✅ Form doldurulur → Kayıt tamamlanır
6. ✅ Kullanıcı /beklemede'ye yönlendirilir
7. ✅ Admin panelde başvuru görünür
8. ✅ Admin onaylar → Email gönderilir
9. ✅ Kullanıcı dashboard'a erişir
10. ✅ Admin reddeder → Email gönderilir
11. ✅ Kullanıcı /beklemede'de red mesajı görür

---

## 2025-12-27 Düzeltmeleri

### 1. BayiKayit/TedarikciKayit - dealers/suppliers Tablosu Kaydı

**Sorun**: Kayıt formunda kullanıcı auth'a kaydediliyordu ama dealers/suppliers tablosuna kayıt eklenmiyordu. Bu nedenle:
- Admin panelde "Onay Bekleyen Başvurular" boş görünüyordu
- Bayi paneline girişte "Bayi kaydı bulunamadı" hatası alınıyordu

**Çözüm**: Kayıt formlarına şu eklendi:
```typescript
// dealers/suppliers tablosuna kayıt
await supabase.from("dealers").insert({
  id: signupData.user.id,
  user_id: signupData.user.id,
  name: formData.firmName,
  contact_name: formData.fullName,
  // ...diğer alanlar
  approval_status: "pending",
});

// user_roles tablosuna rol
await supabase.from("user_roles").insert({
  user_id: signupData.user.id,
  role: "dealer",
});

// pending_invites kullanıldı olarak işaretle
await supabase.from("pending_invites")
  .update({ used_at: new Date().toISOString() })
  .eq("id", inviteData.id);
```

### 2. Bekleyen Davetler Filtreleme

**Sorun**: Kayıtlı kullanıcılar hala "Bekleyen Davetler"de görünüyordu.

**Çözüm**: useDealers ve useSuppliers hook'larında kayıtlı email'ler filtreleniyor:
```typescript
const { data: dealersData } = await supabase
  .from('dealers')
  .select('contact_email');

const registeredEmails = new Set(
  (dealersData || []).map(d => d.contact_email?.toLowerCase())
);

const filteredData = (data || []).filter(
  inv => !registeredEmails.has(inv.email.toLowerCase())
);
```

### 3. Badge Hover Renkleri

**Sorun**: Onaylandı/Aktif badge'lerinde hover durumunda text görünmüyordu.

**Çözüm**: Tailwind sınıfları güncellendi:
```tsx
// Önceki
<Badge className="bg-green-100 text-green-700">Onaylandı</Badge>

// Sonraki
<Badge className="bg-green-600 text-white hover:bg-green-700">Onaylandı</Badge>
```

---

## Sonraki Adımlar

- [ ] Admin'e yeni başvuru bildirimi (opsiyonel)
- [ ] Başvuru detay sayfası
- [ ] Başvuru düzenleme (eksik bilgi talebi)
- [ ] Dealer/Supplier dashboard özellikleri

---

Son güncelleme: 2025-12-27

