# Faz 7: Ödeme Sistemi

> Bu doküman, Faz 7'de gerçekleştirilen ödeme sistemi geliştirmelerini detaylandırır.

Tamamlanma tarihi: 2025-12-28

---

## Genel Bakış

Faz 7, sipariş akışını %100 tamamlamayı ve ödeme sistemini (Kapıda Ödeme + EFT/Havale) entegre etmeyi hedefler. MVP finalizasyonu için tüm eksikler, güvenlik açıkları ve çalışmayan özellikler tespit edilip düzeltilmiştir.

### Kapsam

| Özellik | Dahil | Notlar |
|---------|-------|--------|
| Kapıda Ödeme (Nakit/Kart) | Evet | Checkout'ta seçim yapılır |
| EFT/Havale Ödemesi | Evet | IBAN bilgileri admin panelden ayarlanır |
| Ödeme Bildirim Formu | Evet | Müşteri tarafından doldurulur |
| Dekont Upload | Evet | Zorunlu değil, opsiyonel |
| Admin IBAN Ayarları | Evet | Settings sayfasında yönetilir |
| Email Bildirimleri | Evet | Kritik durumlar için (confirmed, delivered, cancelled) |
| Sipariş Detay Görünümleri | Evet | Ödeme bilgileri gösterilir |

---

## Veritabanı Değişiklikleri

### Migration Dosyası

`supabase/migrations/20251228000000_payment_system.sql`

### orders Tablosu - Ödeme Yöntemi

```sql
ALTER TABLE orders ADD COLUMN payment_method TEXT 
  CHECK (payment_method IN ('cash', 'card', 'eft', 'bank_transfer'));

ALTER TABLE orders ADD COLUMN payment_method_details JSONB;
-- EFT için: { bank_name, account_holder, iban, receipt_url?, notification_date? }
-- Kapıda ödeme için: { type: 'cash' | 'card' }
```

### Yeni Tablo: system_settings

Admin panelden IBAN ve banka bilgilerini saklamak için:

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

### Yeni Tablo: payment_notifications

Müşteri EFT bildirimleri için:

```sql
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Checkout Akışı Güncellemeleri

### Yeni Adım: Ödeme Yöntemi Seçimi

Checkout akışı güncellendi:
- Adres → Teslimat → **Ödeme** → Özet

### Ödeme Yöntemleri

1. **Kapıda Ödeme**
   - Nakit/Kart seçimi (radio)
   - Sipariş oluşturulurken `payment_method: "cash"` veya `"card"` kaydedilir

2. **EFT/Havale**
   - Admin panelden ayarlanan IBAN bilgileri gösterilir
   - Sipariş oluşturulduktan sonra bildirim formu linki gösterilir
   - `payment_method: "eft"` kaydedilir

---

## Ödeme Bildirim Formu

### Sayfa: `/odeme-bildirimi/:orderId`

**Dosya**: `src/pages/PaymentNotification.tsx`

Form alanları:
- Banka Adı (zorunlu)
- Hesap Sahibi Adı (zorunlu)
- Tutar (sipariş tutarından otomatik, değiştirilemez)
- İşlem Tarihi (zorunlu, bugünden sonra olamaz)
- Dekont (opsiyonel, max 5MB)
- Notlar (opsiyonel)

Validasyonlar:
- Tutar sipariş tutarına eşit olmalı
- İşlem tarihi bugünden sonra olamaz
- Dekont dosya boyutu 5MB'dan küçük olmalı

Submit sonrası:
- `payment_notifications` tablosuna kayıt
- Admin/bayi'ye bildirim email'i (`payment_notification_received`)
- Müşteriye onay email'i (doğrulandığında)

---

## Admin Panel - Sistem Ayarları

### Settings Sayfası Güncellemesi

**Dosya**: `src/pages/admin/Settings.tsx`

Yeni tab: "Ödeme Ayarları"

#### Banka Hesap Bilgileri
- Banka Adı
- Hesap Sahibi
- IBAN (TR formatı validasyonu)
- Şube (opsiyonel)

#### Ödeme Yöntemleri
- Kapıda Ödeme aktif/pasif (Switch)
- EFT/Havale aktif/pasif (Switch)

---

## Email Şablonları

### Yeni Template'ler

**Dosya**: `supabase/functions/send-email/index.ts`

#### order_confirmed
- Kullanım: Bayi siparişi onayladığında
- Alıcı: Müşteri
- İçerik: Sipariş numarası, onay tarihi, tahmini teslimat

#### order_delivered
- Kullanım: Sipariş teslim edildiğinde
- Alıcı: Müşteri
- İçerik: Teslimat bilgileri, ödeme durumu

#### order_cancelled
- Kullanım: Sipariş iptal edildiğinde
- Alıcı: Müşteri
- İçerik: İptal sebebi, iade bilgileri

#### payment_notification_received
- Kullanım: Müşteri EFT bildirimi yaptığında
- Alıcı: Admin/Bayi
- İçerik: Bildirim detayları, sipariş bilgisi

#### payment_notification_verified
- Kullanım: EFT bildirimi doğrulandığında
- Alıcı: Müşteri
- İçerik: Doğrulama onayı

### Emoji Kaldırma

Tüm email template'lerinden emoji'ler kaldırıldı. Sadece metin ve icon'lar (lucide-react) kullanılıyor.

---

## Sipariş Detay Görünümleri

### Müşteri Sipariş Detayı

**Dosya**: `src/pages/account/Orders.tsx`

- Ödeme yöntemi gösterimi
- Ödeme durumu badge'i
- EFT bildirimi durumu (varsa)
- "Havale Bildirimi Yap" butonu (EFT seçildiyse ve bildirim yoksa)

### Bayi Sipariş Detayı

**Dosya**: `src/components/dealer/OrderDetailModal.tsx`

- Ödeme yöntemi ve durumu
- EFT bildirimleri listesi (varsa)
- Bildirim doğrulama butonu (admin/bayi)
- Doğrula/Reddet aksiyonları

---

## Güvenlik ve Validasyon

### RLS Policies

#### system_settings
- Sadece admin/superadmin görüntüleyebilir ve yönetebilir

#### payment_notifications
- Kullanıcılar kendi bildirimlerini oluşturabilir
- Kullanıcılar kendi bildirimlerini görebilir
- Bayi ve admin ilgili siparişlerin bildirimlerini görebilir
- Bayi ve admin bildirimleri doğrulayabilir/reddedebilir

### Validasyonlar

- Ödeme yöntemi seçimi zorunlu (checkout)
- EFT bildirim tutarı sipariş tutarına eşit olmalı
- IBAN format validasyonu (admin panel, TR ile başlamalı, 26 karakter)
- Dekont dosya boyutu limiti (5MB)
- İşlem tarihi bugünden sonra olamaz

---

## Storage Bucket

### Manuel Oluşturulmalı

Supabase Dashboard > Storage > Create Bucket

- **Bucket Name**: `receipts`
- **Public**: No (Private)
- **File Size Limit**: 5MB
- **Allowed MIME Types**: `image/*`, `application/pdf`

### Storage Policies

1. **Users can upload receipts**
   - Operation: INSERT
   - Policy: `(bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])`

2. **Users can view own receipts**
   - Operation: SELECT
   - Policy: `(bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])`

3. **Admins and dealers can view receipts**
   - Operation: SELECT
   - Policy: `(bucket_id = 'receipts' AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'superadmin', 'dealer')))`

---

## Dosya Yapısı

### Yeni Dosyalar

```
src/
├── pages/
│   └── PaymentNotification.tsx      # EFT bildirim formu
├── hooks/
│   ├── useSystemSettings.ts         # Sistem ayarları hook'u
│   └── usePaymentNotifications.ts   # Ödeme bildirimleri hook'u
└── supabase/
    └── migrations/
        └── 20251228000000_payment_system.sql
```

### Güncellenen Dosyalar

- `src/pages/Checkout.tsx` - Ödeme yöntemi seçimi adımı
- `src/pages/admin/Settings.tsx` - IBAN ayarları sekmesi
- `src/pages/account/Orders.tsx` - Ödeme bilgileri gösterimi
- `src/components/dealer/OrderDetailModal.tsx` - Ödeme ve bildirim yönetimi
- `src/hooks/useDealerOrders.ts` - Email entegrasyonu
- `src/hooks/useEmailService.ts` - Yeni email fonksiyonları
- `supabase/functions/send-email/index.ts` - Yeni email template'leri
- `src/integrations/supabase/types.ts` - Yeni tablo tipleri

---

## Route'lar

| Path | Sayfa | Açıklama |
|------|-------|----------|
| `/odeme-bildirimi/:orderId` | PaymentNotification | EFT bildirim formu |

---

## Finalize Analizi Sonuçları

### Eksik Özellikler Tespiti

- [x] Sipariş iptal akışı tam
- [x] Teslimat kanıtı upload çalışıyor
- [x] Bayi atama: Manuel (admin tarafından yapılmalı, otomatik değil - bu MVP için yeterli)
- [x] Sipariş numarası formatı tutarlı (UUID'nin ilk 8 karakteri)
- [x] Email template'lerinde emoji kaldırıldı

### Güvenlik Kontrolleri

- [x] RLS tüm yeni tablolarda aktif
- [x] Payment notification'lar sadece ilgili kullanıcılar görebiliyor
- [x] System settings sadece admin erişebiliyor
- [x] File upload güvenli (Supabase Storage, dosya boyutu limiti, MIME type kontrolü)

### UI/UX İyileştirmeleri

- [x] Checkout akışı kullanıcı dostu (4 adım: adres → teslimat → ödeme → özet)
- [x] Ödeme yöntemi seçimi net (radio group, açıklayıcı metinler)
- [x] EFT bildirim formu anlaşılır (zorunlu alanlar işaretli, validasyon mesajları)
- [x] Loading state'ler var (tüm async işlemlerde)
- [x] Error handling yeterli (try-catch, toast mesajları)

### Bilinen Sınırlamalar

1. **Bayi Atama**: Otomatik değil, admin tarafından manuel yapılmalı. MVP için yeterli.
2. **Storage Bucket**: Manuel oluşturulmalı (SQL ile oluşturulamaz).
3. **Sipariş Numarası**: UUID formatı kullanılıyor, daha okunabilir format gelecekte eklenebilir.

---

## Test Senaryoları

### Ödeme Yöntemi Seçimi

1. Checkout'ta ödeme yöntemi seçimi görünüyor mu? ✅
2. Kapıda ödeme seçildiğinde nakit/kart seçimi çalışıyor mu? ✅
3. EFT seçildiğinde IBAN bilgileri gösteriliyor mu? ✅
4. Sipariş oluşturulurken ödeme yöntemi kaydediliyor mu? ✅

### EFT Bildirim Formu

1. Müşteri bildirim formunu açabiliyor mu? ✅
2. Form validasyonları çalışıyor mu? ✅
3. Dekont upload çalışıyor mu? (zorunlu değil) ✅
4. Bildirim kaydediliyor mu? ✅
5. Admin/bayi bildirimi görebiliyor mu? ✅
6. Bildirim doğrulama çalışıyor mu? ✅

### Email Bildirimleri

1. Sipariş onaylandığında email gidiyor mu? ✅
2. Sipariş teslim edildiğinde email gidiyor mu? ✅
3. Sipariş iptal edildiğinde email gidiyor mu? ✅
4. EFT bildirimi yapıldığında admin'e email gidiyor mu? ✅
5. EFT bildirimi doğrulandığında müşteriye email gidiyor mu? ✅

### Admin Ayarları

1. IBAN bilgileri kaydediliyor mu? ✅
2. Ayarlar checkout'ta görünüyor mu? ✅
3. Sadece admin erişebiliyor mu? ✅

---

## Sonraki Adımlar

### Faz 8: İşletme (B2B) Paneli

- İşletme rolü ve davet sistemi
- B2B sipariş paneli
- Bugün Halde fırsatları görünümü
- Sipariş geçmişi ve tekrar sipariş

---

## Değişiklik Geçmişi

| Tarih | Değişiklik |
|-------|------------|
| 2025-12-28 | Faz 7 tamamlandı |
| 2025-12-28 | Migration dosyası oluşturuldu |
| 2025-12-28 | Admin Settings - IBAN ayarları eklendi |
| 2025-12-28 | Checkout - Ödeme yöntemi seçimi eklendi |
| 2025-12-28 | Payment Notification formu eklendi |
| 2025-12-28 | Email template'leri eklendi ve emoji'ler kaldırıldı |
| 2025-12-28 | Email entegrasyonu tamamlandı |
| 2025-12-28 | Sipariş detay görünümleri güncellendi |

