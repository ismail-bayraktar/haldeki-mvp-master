# Haldeki.com - İş Modeli Soruları

> **Tarih:** 2026-01-10
> **Amaç:** Mevcut karmaşık fiyat/varyasyon sistemini basitleştirmek için Haldeki.com'un iş modelini derinlemesine anlamak

---

## 📋 Önceki Bulgular (Keşif Ajanlarından)

Mevcut sistemde **4 katmanlı fiyat yapısı** ve **2 uyumsuz varyasyon sistemi** tespit edildi:

### 4 Fiyat Katmanı:
1. `products.price` / `products.base_price` - Ana ürün fiyatı
2. `region_products.price` / `region_products.business_price` - Bölgesel B2C/B2B fiyatları
3. `supplier_products.price` - Tedarikçi teklif fiyatı
4. `supplier_product_variations.price_adjustment` - Varyasyon fiyat farkı

### 2 Varyasyon Sistemi:
1. **Legacy:** `ProductVariant` with `priceMultiplier`
2. **Phase 12:** `ProductVariation` with `price_adjustment`

### Etkilenen Dosyalar: 25+ bileşen

**Sonuç:** Sistem temelden yeniden tasarlanmalı.

---

## 🎯 Soru Seti 1: İş Modeli ve Roller

### SORU 1: Haldeki.com'un temel iş modeli nedir?

**A)** Pazaryeri modeli - Tedarikçiler ürünlerini yükler, Haldeki aracı olur, komisyon alır
- Tedarikçi fiyat belirler
- Haldeki fiyatları onaylar/yönetir
- Müşteri tedarikçiden doğrudan alım yapar

**B)** Perakendeci modeli - Haldeki ürünleri satın alır, stoklar, kendi fiyatını belirler
- Haldekı tüm ürünlerin sahibidir
- Tedarikçiler sadece tedarik zinciridir
- Müşteri Haldekı'den alım yapar

**C)** Hibrit model - Hem kendi ürünü vardır hem de tedarikçilerin ürünlerini satar
- Bazı ürünler Haldekı'na aittir
- Bazı ürünler tedarikçilere aittir
- İki modelin kuralları farklıdır

**D)** B2B ağı modeli - İşletmeler arası ticaret platformu
- Bayiler, tedarikçiler, işletmeler birbirleriyle ticaret yapar
- Haldeki sadece platform sağlar
- Fiyatlar pazar dinamiklerine göre belirlenir

---

### SORU 2: Müşteri rolleri ve fiyatlandırma ilişkisi nedir?

**A)** Tek fiyat politikası - Herkese aynı fiyat
- Guest, Customer, Business, Dealer aynı fiyatı görür
- Sadakat programı yok
- Basit ve şeffaf

**B)** Rol bazlı fiyatlandırma - Her rol farklı fiyat görür
- Guest: Standart perakende fiyatı
- Customer: Standart perakende fiyatı
- B2B Business: İşletme indirimi (%10-20 daha ucuz)
- Dealer: Bayi toptan fiyatı (en ucuz)

**C)** Hacim bazlı fiyatlandırma - Alım miktarına göre fiyat değişir
- Küçük alım: Yüksek birim fiyat
- Orta alım: İndirimli birim fiyat
- Toptan alım: En düşük birim fiyat
- Rollere değil sipariş tutarına bağlı

**D)** Abonelik modeli - Üyelik tipine göre fiyat
- Ücretsiz üye: Standart fiyat
- Premium üye: %5 indirim
- Business üye: %15 indirim
- VIP üye: %25 indirim

---

### SORU 3: Bölgesel fiyatlandırma gerekli mi?

**A)** Evet, zorunlu - Farklı bölgelerde farklı fiyatlar
- Lojistik maliyetler farklı
- Rekabet koşulları farklı
- Her bölgenin kendi fiyatı olmalı

**B)** Hayır, tek fiyat - Tüm Türkiye'de aynı fiyat
- Basit yönetim
- Şeffaf fiyat politikası
- Lojistik farkı teslimat ücretine yansıt

**C)** Sadece B2B için - B2C tek fiyat, B2B bölgesel
- Perakende müşteriler için tek fiyat
- İşletmeler için bölgesel fiyatlandırma
- Karma ama anlaşılabilir

**D)** Seçimli - Bazı ürünler bölgesel, bazıları değil
- Taze ürünler: Bölgesel fiyat (bozulma riski)
- Paketli ürünler: Tek fiyat
- Ürün kategorisine göre esneklik

---

### SORU 4: Tedarikçi-fiyat ilişkisi nasıl olmalı?

**A)** Tedarikçi teklif verir, Haldeki onaylar
- Tedarikçi: "Bu ürünü 50 TL'den satabilirim"
- Haldeki: "Tamam, %20 komisyon ekleyip 60 TL yapayım"
- Tedarikçi stok ve teslimattan sorumlu

**B)** Haldeki fiyat belirler, tedarikçi uygular
- Haldeki: "Bu ürün 60 TL olacak"
- Tedarikçi: "Tamam, 50 TL maliyetimle satarım"
- Haldeki fiyat kontrolüne tam sahip

**C)** Otomatik fiyat - Tedarikçi fiyatı otomatik yansır
- Tedarikçi fiyatı girer
- Sistem otomatik olarak Haldeki marjını ekler
- Minimum onay süreci

**D)** Rekabetçi ihale - En düşük fiyat kazanır
- Bir ürün için birden fazla tedarikçi teklif verir
- En düşük fiyatlı teklif görünür olur
- Müşteri en iyi fiyatı alır

---

## 🎯 Soru Seti 2: Ürün ve Varyasyon Yapısı

### SORU 5: Ürün varyasyonları (boyut, renk, paket) nasıl yönetilmeli?

**A)** Basit varyasyon - Sadece paket boyutu
- Örnek: Domates (1 KG, 2 KG, 5 KG)
- Fiyat = Birim fiyat × Miktar
- Tek varyasyon tipi

**B)** Çoklu varyasyon - Boyut, tip, paket
- Örnek: Domates (1 KG, Organik, Kutulu)
- Her varyasyonun kendi fiyatı
- Karmaşık ama esnek

**C)** Varyasyon yok - Her ürün ayrı kayıt
- "Domates 1 KG" ayrı ürün
- "Domates 2 KG" ayrı ürün
- Basit ama veri tekrarı

**D)** SKU bazlı - Her varyasyonun unique kodu
- Her varyasyon ayrı SKU ile takip
- Barkod ile entegrasyon
- Profesyonel stok yönetimi

---

### SORU 6: Tedarikçi-ürün ilişkisi nasıl olmalı?

**A)** Tek tedarikçi - Her ürün bir tedarikçiye bağlı
- Domates → Tarım A.Ş.
- Basit ve açık
- Yedek tedarikçi yok

**B)** Çoklu tedarikçi - Bir ürün birden fazla tedarikçiden
- Domates → Tarım A.Ş. (50 TL), Gıda Ltd. (48 TL)
- Müşteri en uygun fiyatı seçer
- Rekabetçi fiyatlar

**C)** Bölgesel tedarikçi - Her bölgenin kendi tedarikçileri
- İstanbul → Tarım A.Ş.
- Ankara – Gıda Ltd.
- Bölgesel lojistik optimizasyonu

**D)** Hiyerarşik tedarikçi - Birincil ve yedek tedarikçi
- Birincil: Tarım A.Ş. (stok varken)
- Yedek: Gıda Ltd. (birincil stok yoksa)
- Kesintisiz tedarik garantisi

---

### SORU 7: Fiyat geçmişi ve takibi gerekli mi?

**A)** Evet, detaylı takip - Her fiyat değişimini kaydet
- Önceki fiyat, yeni fiyat, değişim tarihi
- Kim değiştirdi, neden değiştirdi
- Raporlama ve analitik

**B)** Basit takip - Sadece son fiyatı bil
- previous_price ve price_change (up/down/stable)
- Karmaşık history yok
- Minimal veri

**C)** Takip yok - Sadece güncel fiyat önemli
- Geçmişte ne olduğu önemli değil
- Basit veritabanı
- Hızlı sorgular

**D)** Seçimli - Sadece önemli ürünlerde takip
- Çok satan ürünler: Detaylı takip
- Az satan ürünler: Basit takip
- Hibrit yaklaşım

---

## 🎯 Soru Seti 3: Stok ve Operasyon

### SORU 8: Stok yönetimi kimin sorumluluğunda?

**A)** Haldeki sorumlu - Tüm stok Haldeki'de
- Merkezi depolama
- Haldeki stoktakibi yapar
- Tedarikçiler sadece tedarik eder

**B)** Tedarikçi sorumlu - Stok tedarikçide
- Tedarikçi stok girişi yapar
- Drop-shipping modeli
- Az depolama maliyeti

**C)** Hibrit - Bazı ürünler Haldekı'de, bazıları tedarikçide
- Hızlı bozulan: Tedarikçide
- Dayanıklı: Haldekı'de
- Esnek model

**D)** Bayi sorumlu - Bayiler stok tutar
- Bayi kendi stoğunu yönetir
- Merkezi stok yok
- Dağıtık model

---

### SORU 9: Minimum sipariş miktarı (MOQ) nasıl belirlenmeli?

**A)** Ürün bazlı - Her ürünün kendi MOQ'su
- Domates: 1 KG minimum
- Patates: 2 KG minimum
- Ürün özelliklerine göre

**B)** Rol bazlı - Her rolün farklı MOQ'su
- B2C: 150 TL minimum sipariş
- B2B: 500 TL minimum sipariş
- Dealer: 2000 TL minimum sipariş

**C)** Bölgesel - Her bölgenin kendi MOQ'su
- İstanbul: 150 TL
- Anadolu: 300 TL
- Lojistik maliyetine göre

**D)** Hiç MOQ yok - Her miktar sipariş verilebilir
- 1 TL bile olsa sipariş
- Müşteri memnuniyeti öncelik
- Teslimat ücreti ile dengelenir

---

## 🎯 Soru Seti 4: Teknik Mimari

### SORU 10: Veritabanı yapısı nasıl olmalı?

**A)** Tek tablo - Basit products tablosu
- Tek fiyat, tek stok, tek varyasyon
- Çok basit, az esnek
- Küçük ölçek için

**B)** Normalize edilmiş - products, prices, stocks ayrı tablolar
- Esnek ve genişletilebilir
- Karmaşık sorgular
- Profesyonel yaklaşım

**C)** JSON tabanlı - products tablosunda JSONB columns
- products.price_history: [...]
- products.variants: [...]
- Esnek ama az tip güvenliği

**D)** Hibrit - Ana tablo + JSONB extensions
- products: Ana veriler
- products.metadata: Esnek alanlar
- Denge yaklaşımı

---

### SORU 11: Fiyat hesaplama nerede yapılmalı?

**A)** Veritabanında - SQL fonksiyonları
- Performanslı
- Tutarlı
- Az mantık karmaşası

**B)** Backend'de - API/Edge Functions
- Esnek iş kuralları
- Test edilebilir
- Daha fazla kontrol

**C)** Frontend'de - React components
- Hızlı UI güncellemeleri
- Kullanıcı deneyimi
- Az güvenlik riski

**D)** Hibrit - Veritabanı base, frontend display
- DB: Base fiyat hesapla
- API: Business logic ekle
- Frontend: Display formatla

---

## 🎯 Soru Seti 5: Geçiş ve Deployment

### SORU 12: Mevcut sistemden geçiş nasıl yapılmalı?

**A)** Big bang - Tüm sistem bir anda değişir
- Tek deployment
- Kısa sürede sonuç
- Yüksek risk

**B)** Gradual - Bölgesel/produk olarak geçiş
- Önce İstanbul bölgesi
- Sonra diğer bölgeler
- Kontrollü risk

**C)** Parallel - Eski ve yeni sistem aynı anda çalışır
- Yeni müşteri: Yeni sistem
- Eski müşteri: Eski sistem
- A/B test imkanı
- Karmaşık yönetim

**D)** Feature flag - Yeni sistem kapalı, açılabilir
- Kod deploy, sistem kapalı
- Admin panelinden aç
- Anında geri alma
- En güvenli

---

## 🎯 Soru Seti 6: Öncelikler ve MVP

### SORU 13: İlk MVP'de hangi özellikler OLMALI?

**A) Minimum - Sadece temel ürün/fiyat**
- Ürün listesi
- Tek fiyat
- Sepet ve ödeme
- 2 hafta

**B) Standard - Temel + varyasyon**
- Ürün listesi
- Varyasyonlar
- Rol bazlı fiyat
- Stok takibi
- 4 hafta

**C) Advanced - Standard + çoklu tedarikçi**
- Tüm B özellikleri
- Çoklu tedarikçi
- Bölgesel fiyat
- Fiyat geçmişi
- 6-8 hafta

**D) Premium - Tüm özellikler**
- Tüm C özellikleri
- Bayi sistemi
- Promosyonlar
- İndirim kuponları
- 10+ hafta

---

## 📝 Cevaplarınızı Bekliyorum

Lütfen her soru için **A, B, C veya D** seçiminizi belirtin.

**Örnek format:**
- S1: B
- S2: C
- S3: A
- ...

Şubekiler: "S1: B ama C de olabilir" gibi açıklamalar da yapabilirsiniz.

---

**Sonraki adım:** Cevaplarınıza göre yeni veritabanı şeması ve frontend yapısı tasarlayacağım.
