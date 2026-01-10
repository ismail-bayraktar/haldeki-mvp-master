# Phase 4: Email Altyapısı

## Özet
Brevo API üzerinden transactional email gönderimi. Bayi/tedarikçi davetleri, sipariş bildirimleri ve müşteri onay emaillerini kapsar.

## Tamamlanma Tarihi
2025-12-26

## Konfigürasyon

### Brevo Entegrasyonu
- **API Provider**: Brevo (Sendinblue)
- **Edge Function**: `supabase/functions/send-email/index.ts`
- **Secret**: `BREVO_API_KEY` (Lovable Cloud secrets üzerinden)

### Sender Email (MVP)
- **Verified Sender**: `bayraktarismail00@gmail.com` (Brevo'da doğrulanmış)
- **Production Domain** (Gelecek): `noreply@haldeki.com`

### API vs SMTP
Bu sistem **SMTP kullanmıyor**. Brevo HTTP API üzerinden email gönderiyor:
- Edge Function → Brevo API (`https://api.brevo.com/v3/smtp/email`)
- SMTP port veya sunucu konfigürasyonu gerekmiyor
- Daha güvenli ve yönetimi kolay

### CORS Konfigürasyonu
MVP test aşamasında CORS tüm originlere açık (`*`). Production'da kısıtlanacak.

### JWT Doğrulama
Edge function public olarak çalışıyor (`verify_jwt = false`).

## Email Şablonları

### 1. Bayi Daveti (`dealer_invite`)
- **Kullanım**: Admin bayi davet ettiğinde
- **Alıcı**: Davet edilen bayi email adresi
- **İçerik**: 
  - Firma bilgileri
  - Atanan bölgeler
  - Kayıt linki (7 gün geçerli)

### 2. Tedarikçi Daveti (`supplier_invite`)
- **Kullanım**: Admin tedarikçi davet ettiğinde
- **Alıcı**: Davet edilen tedarikçi email adresi
- **İçerik**:
  - Firma bilgileri
  - Kayıt linki (7 gün geçerli)

### 3. Teklif Durumu (`offer_status`)
- **Kullanım**: Admin tedarikçi teklifini onayladığında veya reddettiğinde
- **Alıcı**: Tedarikçi email adresi
- **İçerik**:
  - Ürün bilgileri
  - Miktar ve fiyat
  - Onay/red durumu
  - Dashboard linki

### 4. Sipariş Bildirimi - Bayi (`order_notification`)
- **Kullanım**: Müşteri sipariş verdiğinde (bölgedeki bayilere)
- **Alıcı**: Bölgeye atanmış aktif bayiler
- **İçerik**:
  - Sipariş numarası
  - Bölge adı
  - Toplam tutar
  - Dashboard linki

### 5. Sipariş Onayı - Müşteri (`order_confirmation`)
- **Kullanım**: Müşteri sipariş verdiğinde
- **Alıcı**: Müşteri email adresi
- **İçerik**:
  - Sipariş numarası
  - Ürün listesi (tablo formatında)
  - Teslimat adresi
  - Teslimat zamanı
  - Toplam tutar

## Hook Kullanımı

```typescript
import { useEmailService } from "@/hooks/useEmailService";

const { 
  sendDealerInvite,      // Bayi daveti
  sendSupplierInvite,    // Tedarikçi daveti
  sendOfferStatusNotification,  // Teklif durumu
  sendOrderNotification, // Bayiye sipariş bildirimi
  sendOrderConfirmation  // Müşteriye sipariş onayı
} = useEmailService();
```

## Entegrasyon Noktaları

| Sayfa/Hook | Email Tipi | Tetikleyici |
|------------|-----------|-------------|
| `pages/admin/Dealers.tsx` | dealer_invite | Bayi davet butonu |
| `pages/admin/Suppliers.tsx` | supplier_invite | Tedarikçi davet butonu |
| `hooks/useAdminOffers.ts` | offer_status | Teklif onay/red |
| `pages/Checkout.tsx` | order_confirmation | Sipariş tamamlama |
| `pages/Checkout.tsx` | order_notification | Sipariş tamamlama |

## Custom Domain Geçişi (Gelecek)

### Brevo'da Domain Doğrulama
1. https://app.brevo.com/senders/domain/list adresine git
2. "Add a domain" → `haldeki.com` ekle
3. DNS kayıtlarını ekle:
   - SPF: `v=spf1 include:sendinblue.com ~all`
   - DKIM: Brevo'dan sağlanan key
   - DMARC (opsiyonel): `v=DMARC1; p=none;`
4. Doğrulamayı bekle (24-48 saat)

### Edge Function Güncelleme
```typescript
sender: {
  name: 'Haldeki',
  email: 'noreply@haldeki.com'  // Doğrulanmış domain
}
```

## Güvenlik

- **XSS Koruması**: Tüm kullanıcı verileri `escapeHtml()` ile sanitize edilir
- **CORS**: Sadece belirli originlerden isteklere izin verilir
- **URL Doğrulama**: Email içindeki linkler sadece uygulama URL'leri

## Test Senaryoları

1. ✅ Bayi daveti → Email alındı, kayıt linki çalışıyor
2. ✅ Tedarikçi daveti → Email alındı, kayıt linki çalışıyor
3. ✅ Teklif onay → Tedarikçiye bildirim gitti
4. ✅ Teklif red → Tedarikçiye bildirim gitti
5. ✅ Sipariş ver → Müşteriye onay emaili gitti
6. ✅ Sipariş ver → Bölgedeki bayilere bildirim gitti
7. ✅ Admin Settings email test → Başarılı (26.12.2024)

## İyileştirmeler (26.12.2024)
- Emoji yerine SVG ikonlar
- CTA buton text rengi düzeltildi (beyaz)
- Bölge UUID'leri yerine bölge isimleri gösteriliyor
- Profesyonel uyarı kutusu tasarımı

## Dosya Yapısı

```
src/
├── hooks/
│   └── useEmailService.ts    # Email gönderim hook'u
└── pages/
    ├── Checkout.tsx          # Sipariş email entegrasyonu
    └── admin/
        ├── Dealers.tsx       # Bayi davet entegrasyonu
        ├── Suppliers.tsx     # Tedarikçi davet entegrasyonu
        └── SupplierOffers.tsx # Teklif durumu entegrasyonu

supabase/
└── functions/
    └── send-email/
        └── index.ts          # Brevo edge function
```
