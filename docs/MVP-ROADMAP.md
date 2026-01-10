# Haldeki Market - MVP Önceliklendirme Yol Haritası

> Tüm FAZ 1-2-3 özelliklerinin MVP öncelik analizi
> 
> Oluşturma: 2026-01-10
> Durum: MVP/Kapalı Beta Analizi

---

## 📊 Özet

Bu belge, FAZ 1-2-3 yol haritasındaki tüm özellikleri MVP (Kapalı Beta) için **ESANSİYEL**, **ÖNEMLİ**, ve **ERTELE** kategorilerinde sınıflandırır.

### MVP Kriterleri

Bir özelliğin MVP için gerekli sayılması için şartlardan **EN AZ BİRİ** sağlanmalı:

| Kriter | Açıklama |
|--------|----------|
| **Çekirdek Akış** | Alışveriş yapabilmek için ZORUNLU |
| **Güven/Trust** | Kullanıcı güvenliği için ZORUNLU |
| **Operasyonel** | İşletme için KRİTİK |
| **Kapalı Beta** | Beta test kullanıcıları için GEREKLİ |

---

## 📋 Tüm Özellikler Tablosu

### FAZ 1: Hızlı Kazanımlar (Quick Wins)

| Özellik | MVP Öncelik | Gerekçe |
|---------|-------------|---------|
| **1.1 Recharts Lazy Load** | ⚠️ ERTELE | Dashboard sadece admin/bayi kullanır. Kapalı betada kullanıcı sayısı az olduğu için performans sorunu yaşamazsınız. |
| **1.2 Image Optimizasyonu** | ✅ ÖNEMLİ | UX iyileştirir, L1 cache友好. Ancak mevcut durumda da sistem çalışıyor. Nice-to-have. |

**FAZ 1 MVP Kararı:** Hiçbiri **ESANSİYEL** değil. Image opt. iyileştirme, Recharts ertelemeyebilir.

---

### FAZ 2: Core Özellikler

| Özellik | MVP Öncelik | Gerekçe |
|---------|-------------|---------|
| **2.1 Real-time Sipariş Takibi** | ✅ ÖNEMLİ | Müşteri deneyimi için faydalı, ancak kapalı betada manuel kontrol (email/telefon) yeterli olabilir. 30 sn polling MVP için kritik değil. |
| **2.2 Urun Degerlendirme Sistemi** | ⚠️ ERTELE | Beta kullanıcısı sayısı az olduğu için yeterli review toplanmayacak. Social proof, public launch öncesi daha anlamlı. |

**FAZ 2 MVP Kararı:** İkisi de **ESANSİYEL** değil. Real-time tracking nice-to-have, review system ertelenebilir.

---

### FAZ 3: Büyüme Özellikleri

| Özellik | MVP Öncelik | Gerekçe |
|---------|-------------|---------|
| **3.1 Promosyon Sistemi** | ⚠️ ERTELE | Kupon sistemi, pazarlama aracı. MVP'de organic traction yeterli. Public launch'ta devreye alınabilir. |
| **3.2 Akıllı Ürün Öneri Sistemi** | ⚠️ ERTELE | "Bunu alanlar şunları da aldı" cross-sell için. Kapalı betada ürün satış verisi az olacağı için algoritma anlamlı çalışmaz. |

**FAZ 3 MVP Kararı:** Hiçbiri MVP için gerekli değil. Her ikisi de **ERTLENEBİLİR**.

---

## 🎯 MVP için ÖNERİLEN ÖZELLİK SETİ

### ✅ ESANSİYEL (Zaten Mevcut - FAZ 1-12'de Tamamlanan)

| Özellik | Durum | Not |
|---------|-------|-----|
| Ürün katalog + arama | ✅ Tamam | Mevcut |
| Sepet sistemi | ✅ Tamam | Mevcut |
| Checkout (adres + teslimat) | ✅ Tamam | Faz 6 |
| Ödeme sistemi (Kapıda + EFT) | ✅ Tamam | Faz 7 |
| Sipariş durum takibi (basic) | ✅ Tamam | Faz 6 |
| Bayi paneli | ✅ Tamam | Mevcut |
| Tedarikçi paneli | ✅ Tamam | Mevcut |
| Admin panel | ✅ Tamam | Mevcut |
| Email bildirimleri | ✅ Tamam | Faz 7 |

**Not:** Tüm çekirdek özellikler **ZATEN MEVCUT**. FAZ 1-2-3 özellikleri "enhancement" kategorisinde.

---

### ✅ ÖNEMLİ (Nice-to-Have, Kapalı Beta İçin Faydalı)

| Özellik | Öncelik | Neden? |
|---------|---------|--------|
| Image Optimizasyonu (1.2) | Orta | UX iyileştirir, Lighthouse skoru artırır. Ancak ZORUNLU değil. |
| Real-time Sipariş Takibi (2.1) | Orta | Timeline UI güzel ama kapalı betada polling gerekli değil. Manuel refresh yeterli. |

**Karar:** Bu özellikler **faydalı** ancak **bloke edici** değil. İsterseniz implementasyonuna başlayabilirsiniz, ancak olmadan da MVP launch edilebilir.

---

### ⚠️ ERTELE (Public Launch Sonrası)

| Özellik | Erteleme Nedeni | Önerilen Zamanlama |
|---------|-----------------|-------------------|
| **Recharts Lazy Load (1.1)** | Admin/bayi sayısı az, bundle size sorunu yok | Public launch sonrası, 1000+ kullanıcı olduğunda |
| **Ürün Değerlendirme (2.2)** | Beta kullanıcısı az, review verisi olmayacak | Public launch sonrası, organic kullanıcı arttığında |
| **Promosyon Sistemi (3.1)** | Pazarlama aracı, MVP'de organic traction yeterli | Public launch sonrası, growth phase'de |
| **Akıllı Öneri (3.2)** | Cross-sell verisi az olacak, algoritma anlamlı çalışmaz | Public launch sonrası, 1000+ sipariş verisi olduğunda |

---

## 🚀 MVP Launch Stratejisi

### Şu Anda (Kapalı Beta)

**Mevcut durum:** Tüm çekirdek özellikler çalışıyor ✅

**Eksik olanlar:** FAZ 1-2-3'teki hiçbiri **bloke edici değil**

**Launch için GEREKLİ:**
- [x] Ürün listeleme + arama
- [x] Sepet + checkout
- [x] Ödeme (Kapıda + EFT)
- [x] Sipariş takibi (basic)
- [x] Bayi/tedarikçi paneli
- [x] Email bildirimleri

**Sonuç:** **MVP hazır, kapalı beta launch edilebilir.**

---

### Public Launch Öncesi (Önerilen)

**İyiye sahip olmak için (Nice-to-have):**
1. Image Optimizasyonu (1.2) - UX için
2. Real-time Sipariş Takibi (2.1) - Müşteri deneyimi için

**Zamanlama:** Public launch'dan 2 hafta önce

---

### Public Launch Sonrası (Growth Phase)

**Pazarlama ve Büyüme için:**
1. Promosyon Sistemi (3.1) - Kupon kampanyaları
2. Ürün Değerlendirme (2.2) - Social proof
3. Akıllı Öneri (3.2) - Cross-sell
4. Recharts Lazy Load (1.1) - Scale için optimizasyon

**Zamanlama:** Public launch sonrası, traksiyon yakalandığında

---

## 🔄 Sonraki Adımlar

### Seçenek 1: Hemen Launch (Agresif)

**Eğer:**
- Kapalı beta kullanıcısı sayısı < 50
- Hızlı feedback istiyorsanız
- Product-market fit test etmek istiyorsanız

**Yapılacak:**
- ❌ FAZ 1-2-3 implementasyonunu BAŞLATMAYIN
- ✅ Mevcut sistem ile kapalı beta launch edin
- ✅ Kullanıcı feedback'ini toplayın
- ✅ Public launch öncesi Image Opt. (1.2) yapın

### Seçenek 2: Image Opt. Sonrası Launch (Dengeli)

**Eğer:**
- UX kalitesine önem veriyorsanız
- Lighthouse skoru kritikse
- 1-2 gün zamanınız varsa

**Yapılacak:**
- ✅ FAZ 1.2: Image Optimizasyonu (2 saat)
- ✅ Sonra kapalı beta launch
- ⚠️ Diğer FAZ 1-2-3 özelliklerini erteyin

### Seçenek 3: Tüm FAZ 1-2-3 Sonrası Launch (Muhafazakar)

**Eğer:**
- "Perfect" product istiyorsanız
- Acil launch baskısı yoksa

**Yapılacak:**
- ✅ FAZ 1.1 + 1.2 + 2.1 implementasyonu (~1 hafta)
- ✅ Sonra launch
- ⚠️ FAZ 2.2 + 3.1 + 3.2 hala ertelenecek

---

## 📝 Özet Karar Tablosu

| Özellik | MVP İçin Gerekli? | Implementasyon Zamanı | Tahmini Süre |
|---------|-------------------|----------------------|--------------|
| **Recharts Lazy Load (1.1)** | ❌ Hayır | Public launch sonrası | 2 saat |
| **Image Optimizasyonu (1.2)** | 🔵 Opsiyonel | Launch öncesi (nice-to-have) | 2 saat |
| **Real-time Sipariş (2.1)** | 🔵 Opsiyonel | Public launch öncesi | 4 saat |
| **Ürün Değerlendirme (2.2)** | ❌ Hayır | Public launch sonrası | 8 saat |
| **Promosyon Sistemi (3.1)** | ❌ Hayır | Growth phase | 12 saat |
| **Akıllı Öneri (3.2)** | ❌ Hayır | Growth phase | 16 saat |

---

## 💡 Öneri

**Stratejik Karar:** FAZ 1-2-3 özelliklerini **IMPLEMENTASYONA BAŞLAMADAN** önce kapalı beta launch yapın.

**Neden?**
1. **Mevcut sistem zaten çalışıyor** - Tüm çekirdek özellikler mevcut
2. **FAZ 1-2-3 enhancement** - Bloke edici değil
3. **Feedback önce** - Gerçek kullanıcı davranışını görün, sonra optimize edin
4. **Yönetim masrafı** - Kapalı betada 50 kullanıcı varken Recharts lazy load'un etkisi negligible

**Eğer mutlaka bir şey yapmak istiyorsanız:**
- ✅ **FAZ 1.2: Image Optimizasyonu** (2 saat) - En yüksek ROI, Lighthouse +10 puan
- ⚠️ Diğerlerini public launch sonrasına bırakın

---

**Son Güncelleme:** 2026-01-10  
**Durum:** MVP Ready, Launch Kararı Bekleniyor
