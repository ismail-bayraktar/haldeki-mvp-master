# Haldeki.com - Product Requirements Document (PRD)

> Ürün gereksinimleri ve özellik tanımları

## 📋 Ürün Özeti

**Haldeki.com**, taze meyve-sebze tedarik zincirini dijitalleştiren, bölge bazlı teslimat ve çoklu rol destekli bir B2C/B2B e-ticaret platformudur.

### Hedef Kitle

| Segment | Açıklama |
|---------|----------|
| **Bireysel Müşteriler** | Taze sebze-meyve satın almak isteyen tüketiciler |
| **Bayiler** | Belirli bölgelerde teslimat yapan yerel distribütörler |
| **Tedarikçiler** | Ürün sağlayan çiftçiler ve toptancılar |

### Değer Önerisi

1. **Günlük Hal Fiyatları**: Gerçek zamanlı fiyat takibi
2. **Bölge Bazlı Teslimat**: Lokasyon bazlı stok ve fiyatlandırma
3. **Doğrudan Tedarikçi Bağlantısı**: Aracısız ürün tedariği
4. **Şeffaf Teslimat**: Slot bazlı teslimat planlama

---

## 👥 Kullanıcı Rolleri

### 1. Müşteri (User)

**Yetenekler:**
- Ürün arama ve filtreleme
- Bölge seçimi ve fiyat görüntüleme
- Sepete ekleme ve sipariş verme
- Teslimat slotu seçimi
- Sipariş geçmişi görüntüleme
- Favori listesi yönetimi
- Ürün karşılaştırma

**Kısıtlamalar:**
- Sadece kendi siparişlerini görebilir
- Admin paneline erişemez

### 2. Bayi (Dealer)

**Yetenekler:**
- Atandığı bölgelerdeki siparişleri görüntüleme
- Sipariş durumu güncelleme
- Teslimat yönetimi
- Performans metrikleri görüntüleme

**Kısıtlamalar:**
- Sadece atandığı bölgelerin siparişlerini görebilir
- Fiyat değiştiremez
- Ürün ekleyemez

### 3. Tedarikçi (Supplier)

**Yetenekler:**
- Ürün teklifi oluşturma
- Teklif durumu takibi
- Fiyat ve miktar güncelleme

**Kısıtlamalar:**
- Sadece kendi tekliflerini yönetebilir
- Doğrudan satış yapamaz

### 4. Admin

**Yetenekler:**
- Tüm kullanıcı yönetimi
- Bayi ve tedarikçi oluşturma/davet etme
- Ürün kataloğu yönetimi
- Bölge-ürün fiyatlandırması
- Sipariş yönetimi
- Sistem ayarları

### 5. Superadmin

**Yetenekler:**
- Tüm admin yetkileri
- Admin kullanıcı oluşturma
- Kritik sistem ayarları

---

## 🗺️ Bölge Sistemi

### Bölge Özellikleri

| Özellik | Açıklama |
|---------|----------|
| `name` | Bölge adı (örn: Menemen) |
| `districts` | Kapsanan mahalleler/ilçeler |
| `delivery_fee` | Teslimat ücreti |
| `min_order_amount` | Minimum sipariş tutarı |
| `free_delivery_threshold` | Ücretsiz teslimat limiti |
| `delivery_slots` | Günlük teslimat slotları |

### Bölge-Ürün İlişkisi

- Her bölgede farklı fiyat olabilir
- Her bölgede farklı stok durumu olabilir
- Ürün bazı bölgelerde mevcut olmayabilir

### Teslimat Slotları

```json
{
  "monday": [
    { "start": "09:00", "end": "12:00", "capacity": 20 },
    { "start": "14:00", "end": "18:00", "capacity": 25 }
  ]
}
```

---

## 🛒 Sipariş Akışı

### Müşteri Tarafı

```
1. Bölge Seç → 2. Ürün Ekle → 3. Sepet → 4. Checkout
     │              │            │           │
     ▼              ▼            ▼           ▼
  Fiyatlar      Stok kontrol  Validasyon  Slot seç
  güncellenir                              ↓
                                     Sipariş oluştur
                                          ↓
                                     Email onayı
```

### Bayi Tarafı

```
1. Yeni Sipariş Bildirimi → 2. Sipariş Onay → 3. Hazırlık → 4. Teslimat
         │                        │              │            │
         ▼                        ▼              ▼            ▼
    Dashboard'da            Durumu güncelle  Paketleme    Tamamlandı
    gösterilir                                           olarak işaretle
```

---

## 📧 Bildirim Sistemi

### Email Bildirimleri

| Trigger | Alıcı | Template |
|---------|-------|----------|
| Bayi davet edildiğinde | Bayi | `dealer_invite` |
| Tedarikçi davet edildiğinde | Tedarikçi | `supplier_invite` |
| Teklif durumu değiştiğinde | Tedarikçi | `offer_status` |
| Yeni sipariş geldiğinde | Bayi | `order_notification` |
| Sipariş onaylandığında | Müşteri | `order_confirmation` |

---

## 📱 Sayfa Yapısı

### Public Sayfalar

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| Anasayfa | `/` | Hero, kategoriler, günün fırsatları |
| Ürünler | `/urunler` | Ürün listesi + filtreler |
| Ürün Detay | `/urun/:slug` | Ürün bilgileri, yorumlar |
| Bugün Halde | `/bugun-halde` | Günlük fırsat ürünleri |
| Sepet | `/sepet` | Sepet içeriği |
| Checkout | `/odeme` | Sipariş tamamlama |
| Hakkımızda | `/hakkimizda` | Şirket bilgileri |
| İletişim | `/iletisim` | İletişim formu |
| Nasıl Çalışır | `/nasil-calisir` | Süreç açıklaması |

### Auth Sayfaları

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| Giriş/Kayıt | `/auth` | Kimlik doğrulama |
| Hesabım | `/hesabim` | Profil yönetimi |

### Admin Sayfaları

| Sayfa | URL | Erişim |
|-------|-----|--------|
| Dashboard | `/admin` | admin, superadmin |
| Siparişler | `/admin/siparisler` | admin, superadmin |
| Ürünler | `/admin/urunler` | admin, superadmin |
| Bölge Ürünleri | `/admin/bolge-urunleri` | admin, superadmin |
| Kullanıcılar | `/admin/kullanicilar` | admin, superadmin |
| Bayiler | `/admin/bayiler` | admin, superadmin |
| Tedarikçiler | `/admin/tedarikciler` | admin, superadmin |
| Teklif Yönetimi | `/admin/teklifler` | admin, superadmin |
| Ayarlar | `/admin/ayarlar` | admin, superadmin |

### Rol Sayfaları

| Sayfa | URL | Erişim |
|-------|-----|--------|
| Bayi Panel | `/bayi` | dealer |
| Tedarikçi Panel | `/tedarikci` | supplier |

---

## ✅ Tamamlanan Özellikler

### Faz 1: Temel Altyapı ✅
- [x] Proje kurulumu
- [x] UI bileşenleri
- [x] Kimlik doğrulama
- [x] Ürün listesi
- [x] Sepet (statik)

### Faz 2: Bölge Sistemi ✅
- [x] RegionContext + persistence
- [x] Bölgeye göre fiyat/stok
- [x] Sepet bölge validasyonu
- [x] Teslimat slotları
- [x] Admin bölge ürün yönetimi

### Faz 3: RBAC ✅
- [x] Rol altyapısı
- [x] Invite flow
- [x] Bayi/Tedarikçi admin sayfaları
- [x] RequireRole guard
- [x] Bayi dashboard
- [x] Tedarikçi dashboard

### Faz 4: Email ✅
- [x] Brevo entegrasyonu
- [x] Email şablonları
- [x] Sipariş entegrasyonu

---

## 🔜 Planlanan Özellikler

### Faz 5: Sipariş ve Teslimat
- [ ] Tam sipariş akışı
- [ ] Bayi sipariş yönetimi
- [ ] Teslimat takibi
- [ ] Ödeme entegrasyonu

### Faz 6: Gelişmiş Özellikler
- [ ] Push notifications
- [ ] Gerçek zamanlı stok
- [ ] Raporlama dashboard
- [ ] Mobil uygulama

---

## 📊 Başarı Metrikleri

| Metrik | Hedef |
|--------|-------|
| Günlük aktif kullanıcı | 500+ |
| Sipariş tamamlama oranı | >70% |
| Teslimat memnuniyeti | >4.5/5 |
| Sayfa yüklenme süresi | <2s |

---

Son güncelleme: 2025-12-26
