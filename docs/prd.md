# Haldeki.com - Product Requirements Document (PRD)

> Ürün gereksinimleri ve özellik tanımları

## 📋 Ürün Özeti

**Haldeki.com**, taze meyve-sebze tedarik zincirini dijitalleştiren, bölge bazlı teslimat ve çoklu rol destekli bir B2C/B2B e-ticaret platformudur.

### Hedef Kitle

| Segment | Açıklama |
|---------|----------|
| **Bireysel Müşteriler** | Taze sebze-meyve satın almak isteyen tüketiciler |
| **İşletmeler (B2B)** | Restoranlar, kafeler, oteller - perakende müşteriler |
| **Bayiler** | Belirli bölgelerde teslimat yapan yerel distribütörler |
| **Tedarikçiler** | Ürün sağlayan çiftçiler ve toptancılar |
| **Depo Personeli** | Sipariş hazırlama ve toplama yapan warehouse staff |

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

### 4. İşletme (Business)

**Yetenekler:**
- B2B özel fiyatları görüntüleme
- Toplu sipariş verme
- Sipariş geçmişi ve tekrar sipariş
- "Bugün Halde" fırsatları görüntüleme

**Kısıtlamalar:**
- Sadece kendi işletme adına sipariş verebilir
- B2B özel fiyatlarını görebilir (perakende fiyatları değil)

### 5. Depo Yöneticisi (Warehouse Manager)

**Yetenekler:**
- Toplu sipariş hazırlama listesi (picking list)
- Zaman penceresi filtresi (gece/gündüz vardiya)
- Sipariş hazırlanacak işaretleme
- Fiyat bilgisi GİZLİ (güvenlik gereksinimi)

**Kısıtlamalar:**
- Fiyatları göremez (DB + UI katmanında maskeleme)
- Sadece atandığı vendor ve warehouse için siparişleri görebilir
- Tenant isolation (vendor-scoped)

### 6. Admin

**Yetenekler:**
- Tüm kullanıcı yönetimi
- Bayi ve tedarikçi oluşturma/davet etme
- Ürün kataloğu yönetimi
- Bölge-ürün fiyatlandırması
- Sipariş yönetimi
- Sistem ayarları

### 7. Superadmin

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

### Faz 5: Onay Sistemi ✅
- [x] Onay akışı
- [x] Bayi/Tedarikçi onay sayfaları
- [x] Email bildirimleri

### Faz 6: Sipariş ve Teslimat ✅
- [x] Sipariş akışı
- [x] Bayi sipariş yönetimi
- [x] Teslimat takibi

### Faz 7: Ödeme ✅
- [x] Kapıda ödeme
- [x] EFT/Havale sistemi

### Faz 8: B2B Panel ✅
- [x] İşletme paneli
- [x] B2B fiyatlandırma
- [x] Tekrar sipariş

### Faz 9: Tedarikçi Panel ✅
- [x] Tedarikçi ürün yönetimi
- [x] Image upload
- [x] Inline search

### Faz 10: Import/Export ✅
- [x] Excel/CSV import
- [x] Validasyon sistemi
- [x] Audit log

### Faz 11: Depo Yönetim ✅
- [x] Picking list UI
- [x] Fiyat maskeleme
- [x] Zaman penceresi filtresi

### Faz 12: Çoklu Tedarikçi ✅
- [x] Junction table pattern
- [x] Ürün varyasyonları
- [x] "Bugün Halde" karşılaştırma
- [x] RPC functions

---

## 🔜 Planlanan Özellikler

### Faz 13: Gelişmiş Özellikler
- [ ] Push bildirimleri
- [ ] SMS bildirimleri
- [ ] Müşteri sadakat programı
- [ ] Abonelik sistemi
- [ ] Mobil uygulama

### Faz 14: Analitik ve Raporlama
- [ ] Satış raporları
- [ ] Tedarikçi performans analitiği
- [ ] Müşteri davranış analitiği
- [ ] Dashboard widgets

---

## 📊 Başarı Metrikleri

| Metrik | Hedef |
|--------|-------|
| Günlük aktif kullanıcı | 500+ |
| Sipariş tamamlama oranı | >70% |
| Teslimat memnuniyeti | >4.5/5 |
| Sayfa yüklenme süresi | <2s |

---

Son güncelleme: 2026-01-06
