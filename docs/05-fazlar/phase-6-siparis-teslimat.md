# Faz 6: Sipariş ve Teslimat Sistemi

> Bu doküman, Faz 6'da gerçekleştirilen sipariş ve teslimat sistemi geliştirmelerini detaylandırır.

Tamamlanma tarihi: 2025-12-27

---

## Genel Bakış

Faz 6, bayi sipariş yönetimi, teslimat takibi, tahsilat durumu ve müşteri/tedarikçi panel geliştirmelerini kapsar.

### Kapsam

| Özellik | Dahil | Notlar |
|---------|-------|--------|
| Sipariş akışı tamamlama | ✅ | pending → confirmed → preparing → shipped → delivered |
| Bayi sipariş yönetimi | ✅ | Durum güncelleme, iptal, teslimat saati |
| Bayi müşteri kaydı | ✅ | Direkt kayıt, admin iptal edebilir |
| Tahsilat takibi | ✅ | Basit: Ödendi/Ödenmedi/Kısmi |
| Müşteri sipariş takibi | ✅ | Hesabım altında liste |
| Teslimat kanıtı | ✅ | Not + fotoğraflı kanıt |
| Tedarikçi hazırlık listesi | ✅ | Ürün bazlı sipariş görünümü |
| Kurye sistemi | ❌ | Sonraki fazlarda |
| İşletme (B2B) rolü | ❌ | Faz 8'e bırakıldı |
| Ödeme entegrasyonu | ❌ | Faz 7'de |

---

## Veritabanı Değişiklikleri

### Migration Dosyası

`supabase/migrations/20251227100000_phase6_order_system.sql`

### orders Tablosu - Yeni Kolonlar

```sql
ALTER TABLE orders ADD COLUMN
  dealer_id UUID REFERENCES dealers(id),
  payment_status TEXT DEFAULT 'unpaid',  -- 'unpaid', 'paid', 'partial'
  payment_notes TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  delivery_notes TEXT,
  delivery_photo_url TEXT,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancellation_reason TEXT;
```

### Yeni Tablo: dealer_customers

Bayinin kaydettiği müşteriler/işletmeler:

```sql
CREATE TABLE dealer_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  district TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### products Tablosu - Tedarikçi İlişkisi

```sql
ALTER TABLE products ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
```

---

## Sipariş Durumu Akışı

```
stateDiagram-v2
    [*] --> pending: Sipariş oluşturuldu
    pending --> confirmed: Bayi onayladı
    pending --> cancelled: Bayi/Admin iptal
    confirmed --> preparing: Hazırlanıyor
    preparing --> shipped: Yola çıktı
    shipped --> delivered: Teslim edildi
    shipped --> cancelled: Teslimat başarısız
    delivered --> [*]
    cancelled --> [*]
```

### Durum Açıklamaları

| Durum | Açıklama | Kim Değiştirir |
|-------|----------|----------------|
| pending | Sipariş yeni oluşturuldu, onay bekliyor | Sistem |
| confirmed | Bayi siparişi onayladı | Bayi |
| preparing | Sipariş hazırlanıyor | Bayi |
| shipped | Sipariş yola çıktı | Bayi |
| delivered | Teslim edildi | Bayi |
| cancelled | İptal edildi | Bayi/Admin |

---

## Bayi Paneli Özellikleri

### Dashboard İstatistikleri

- Bekleyen sipariş sayısı
- Aktif sipariş sayısı (confirmed + preparing + shipped)
- Ödenmemiş sipariş sayısı
- Toplam ciro (delivered siparişler)

### Sipariş Yönetimi

1. **Sipariş Listesi**: Aktif, tamamlanan, iptal sekmeli görünüm
2. **Sipariş Detay Modal**: Tüm bilgiler ve aksiyonlar
3. **Durum Güncelleme**: Adım adım ilerleme
4. **İptal**: Sebep zorunlu
5. **Tahmini Teslimat**: Tarih/saat seçimi
6. **Teslimat Kanıtı**: Not + fotoğraf yükleme
7. **Tahsilat**: Ödendi/Ödenmedi toggle

### Müşteri Yönetimi (/bayi/musteriler)

- Müşteri/işletme listesi (aktif/pasif)
- Yeni müşteri ekleme formu
- Müşteri düzenleme
- Soft delete (pasifleştirme)
- Arama ve filtreleme

---

## Müşteri Panel Özellikleri

### Siparişlerim Sayfası (/hesabim/siparisler)

- Sipariş listesi (accordion görünüm)
- Sipariş durumu badge'leri
- Sipariş detay görüntüleme
- Sipariş takip timeline
- Teslim/iptal bilgileri

---

## Tedarikçi Panel Özellikleri

### Bugün Hazırlanacaklar

- Tedarikçinin ürünlerini içeren aktif siparişler
- Ürün bazlı gruplama (toplam miktar)
- Sipariş detayları (accordion içinde)
- Bölge bilgisi
- Durum badge'leri

### İstatistikler

- Bekleyen sipariş sayısı
- Toplam sipariş sayısı
- Ürün çeşidi sayısı
- Toplam miktar

---

## Dosya Yapısı

### Yeni Dosyalar

```
src/
├── pages/
│   ├── dealer/
│   │   └── DealerCustomers.tsx      # Bayi müşteri yönetimi
│   └── account/
│       └── Orders.tsx               # Müşteri sipariş takibi
├── components/
│   └── dealer/
│       └── OrderDetailModal.tsx     # Sipariş detay modal
├── hooks/
│   ├── useDealerOrders.ts           # Güncellendi - sipariş yönetimi
│   ├── useDealerCustomers.ts        # Yeni - müşteri yönetimi
│   └── useSupplierOrders.ts         # Yeni - tedarikçi siparişleri
```

### Güncellenen Dosyalar

- `src/pages/dealer/DealerDashboard.tsx` - İstatistikler ve sipariş yönetimi
- `src/pages/supplier/SupplierDashboard.tsx` - Hazırlanacaklar listesi
- `src/components/dealer/DealerOrderList.tsx` - Sipariş listesi UI
- `src/integrations/supabase/types.ts` - Yeni tipler
- `src/App.tsx` - Yeni route'lar

---

## Route'lar

| Path | Sayfa | Açıklama |
|------|-------|----------|
| /bayi | DealerDashboard | Bayi ana paneli |
| /bayi/musteriler | DealerCustomers | Bayi müşteri yönetimi |
| /hesabim/siparisler | AccountOrders | Müşteri sipariş takibi |

---

## RLS Politikaları

### dealer_customers

- Bayi kendi müşterilerini görebilir/ekleyebilir/güncelleyebilir
- Admin tüm müşterileri yönetebilir

### orders (güncelleme)

- Bayi atandığı bölgelerdeki siparişleri görebilir
- Bayi atandığı siparişleri güncelleyebilir

---

## Sonraki Adımlar

### Faz 7: Ödeme Sistemi

- Kapıda ödeme (nakit/kart)
- Online ödeme entegrasyonu
- Fatura oluşturma

### Faz 8: İşletme (B2B) Paneli

- İşletme rolü ve davet sistemi
- B2B sipariş paneli
- Bugün Halde fırsatları görünümü
- Sipariş geçmişi ve tekrar sipariş

---

## Değişiklik Geçmişi

| Tarih | Değişiklik |
|-------|------------|
| 2025-12-27 | Faz 6 tamamlandı |
| 2025-12-27 | Migration dosyası oluşturuldu |
| 2025-12-27 | Bayi sipariş yönetimi eklendi |
| 2025-12-27 | Teslimat kanıtı sistemi eklendi |
| 2025-12-27 | Bayi müşteri yönetimi eklendi |
| 2025-12-27 | Müşteri sipariş takibi sayfası eklendi |
| 2025-12-27 | Tedarikçi hazırlanacaklar listesi eklendi |

