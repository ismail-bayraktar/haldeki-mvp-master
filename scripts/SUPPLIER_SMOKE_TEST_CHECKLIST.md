# Tedarikçi Ürün Giriş Sistemi - Smoke Test Checklist

**Tarih:** 2026-01-09
**Amaç:** Tedarikçinin ürün ekleyebilme yeteneğini doğrulama
 **Süre:** ~30 dakika
**Durum:** Hazır

---

## Test Ortamı Hazırlığı

### Ön Koşullar

- [ ] **Test Tedarikçi Hesabı:** Oluşturulmuş ve onaylı (approval_status = 'approved')
- [ ] **Supabase Storage:** `product-images` bucket mevcut ve RLS policy aktif
- [ ] **Test Görselleri:** Küçük boyutlu test görselleri (1KB-100KB)
- [ ] **Test Tarayıcı:** Chrome/Edge (son sürüm)
- [ ] **Network:** Stabil internet bağlantısı

### Test URL'leri

```
Frontend: https://haldeki-market.com
Dashboard: https://haldeki-market.com/tedarikci
Products: https://haldeki-market.com/tedarikci/urunler
New Product: https://haldeki-market.com/tedarikci/urunler/yeni
```

---

## Test Senaryoları

### BÖLÜM 1: Tedarikçi Giriş ve Dashboard (5 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 1.1 | `/tedarikci` sayfasına git | Dashboard yükleniyor | ☐ | |
| 1.2 | Tedarikçi e-posta ile giriş yap | Başarılı giriş | ☐ | |
| 1.3 | Dashboard'da tedarikçi adı görünür | Hoş geldin [Tedarikçi Adı] | ☐ | |
| 1.4 | "Ürünlerimi Gör" butonu çalışır | Ürünler sayfasına yönlendirme | ☐ | |
| 1.5 | "Yeni Ürün Ekle" butonu çalışır | Ürün form sayfasına yönlendirme | ☐ | |
| 1.6 | Dashboard istatistik kartları görünür | Toplam ürün, sipariş, stok | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 2: Ürün 1 - Basit Ürün (5 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 2.1 | "Yeni Ürün Ekle" butonuna tıkla | Form açılır | ☐ | |
| 2.2 | Ürün adı gir: "Test Domates" | Ad kabul edilir | ☐ | |
| 2.3 | Açıklama gir: "Taze test domatesi" | Açıklama kabul edilir | ☐ | |
| 2.4 | Kategori seç: "Sebze" | Seçim yapılır | ☐ | |
| 2.5 | Fiyat gir: "25.50" | Fiyat kabul edilir | ☐ | |
| 2.6 | Birim seç: "kg" | Birim seçilir | ☐ | |
| 2.7 | Stok gir: "100" | Stok kabul edilir | ☐ | |
| 2.8 | Test görseli yükle (max 50KB) | Görsel yüklenir | ☐ | Storage bucket kontrolü |
| 2.9 | "Kaydet" butonuna tıkla | Ürün kaydedilir | ☐ | |
| 2.10 | Başarı mesajı görünür | "Ürün başarıyla kaydedildi" | ☐ | |
| 2.11 | Ürünler sayfasına yönlendirilir | `/tedarikci/urunler` | ☐ | |
| 2.12 | Ürün listede görünür | "Test Domates" görünür | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 3: Ürün 2 - Varyasyonlu Ürün (8 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 3.1 | "Yeni Ürün Ekle" butonuna tıkla | Form açılır | ☐ | |
| 3.2 | Ürün adı gir: "Test Salatalık" | Ad kabul edilir | ☐ | |
| 3.3 | Kategori seç: "Sebze" | Seçim yapılır | ☐ | |
| 3.4 | Fiyat gir: "15.00" | Fiyat kabul edilir | ☐ | |
| 3.5 | Birim seç: "adet" | Birim seçilir | ☐ | |
| 3.6 | Stok gir: "50" | Stok kabul edilir | ☐ | |
| 3.7 | "Varyasyon Ekle" butonuna tıkla | Varyasyon formu açılır | ☐ | |
| 3.8 | Varyasyon 1 adı: "1 kg" | Ad kabul edilir | ☐ | |
| 3.9 | Varyasyon 1 fiyat: "12.00" | Fiyat kabul edilir | ☐ | |
| 3.10 | Varyasyon 1 stok: "30" | Stok kabul edilir | ☐ | |
| 3.11 | "Varyasyon Ekle" butonuna tıkla | 2. varyasyon formu | ☐ | |
| 3.12 | Varyasyon 2 adı: "5 kg" | Ad kabul edilir | ☐ | |
| 3.13 | Varyasyon 2 fiyat: "50.00" | Fiyat kabul edilir | ☐ | |
| 3.14 | Varyasyon 2 stok: "15" | Stok kabul edilir | ☐ | |
| 3.15 | "Kaydet" butonuna tıkla | Ürün kaydedilir | ☐ | |
| 3.16 | Başarı mesajı görünür | "Ürün başarıyla kaydedildi" | ☐ | |
| 3.17 | Ürünler sayfasına yönlendirilir | `/tedarikci/urunler` | ☐ | |
| 3.18 | Ürün listede görünür | "Test Salatalık" görünür | ☐ | |
| 3.19 | Varyasyonlar görünür | "1 kg", "5 kg" etiketleri | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı, varyasyonlar düzgün gösteriliyor

---

### BÖLÜM 4: Ürün 3 - Tüm Alanlarla (5 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 4.1 | "Yeni Ürün Ekle" butonuna tıkla | Form açılır | ☐ | |
| 4.2 | Ürün adı gir: "Test Biber" | Ad kabul edilir | ☐ | |
| 4.3 | Açıklama gir: "Dolu açıklama testi" | Açıklama kabul edilir | ☐ | |
| 4.4 | Kategori seç: "Sebze" | Seçim yapılır | ☐ | |
| 4.5 | Fiyat gir: "35.75" | Fiyat kabul edilir | ☐ | |
| 4.6 | Birim seç: "kg" | Birim seçilir | ☐ | |
| 4.7 | Stok gir: "75" | Stok kabul edilir | ☐ | |
| 4.8 | 2 adet test görseli yükle | Her ikisi de yüklenir | ☐ | |
| 4.9 | "Kaydet" butonuna tıkla | Ürün kaydedilir | ☐ | |
| 4.10 | Başarı mesajı görünür | "Ürün başarıyla kaydedildi" | ☐ | |
| 4.11 | Ürünler sayfasına yönlendirilir | `/tedarikci/urunler` | ☐ | |
| 4.12 | Ürün listede görünür | "Test Biber" görünür | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 5: Ürün Düzenleme (4 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 5.1 | "Test Domates" ürününü bul | Ürün görünür | ☐ | |
| 5.2 | Ürüne tıkla | Detay sayfası açılır | ☐ | |
| 5.3 | Fiyatı değiştir: "30.00" | Fiyat kabul edilir | ☐ | |
| 5.4 | Stoğu değiştir: "120" | Stok kabul edilir | ☐ | |
| 5.5 | "Güncelle" butonuna tıkla | Ürün güncellenir | ☐ | |
| 5.6 | Başarı mesajı görünür | "Ürün güncellendi" | ☐ | |
| 5.7 | Listedeki fiyat güncellenmiş | "30.00" görünür | ☐ | |
| 5.8 | Listedeki stok güncellenmiş | "120" görünür | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 6: Inline Edit (Fiyat/Stok) (3 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 6.1 | "Test Salatalık" ürününü bul | Ürün görünür | ☐ | |
| 6.2 | "Fiyat Düzenle" butonuna tıkla | Input açılır | ☐ | |
| 6.3 | Fiyat gir: "18.00" | Değer kabul edilir | ☐ | |
| 6.4 | Enter tuşuna bas veya kaydet | Fiyat güncellenir | ☐ | |
| 6.5 | Başarı mesajı görünür | "Fiyat güncellendi" | ☐ | |
| 6.6 | Listedeki fiyat güncellenmiş | "18.00" görünür | ☐ | |
| 6.7 | "Stok Düzenle" butonuna tıkla | Input açılır | ☐ | |
| 6.8 | Stok gir: "60" | Değer kabul edilir | ☐ | |
| 6.9 | Enter tuşuna bas veya kaydet | Stok güncellenir | ☐ | |
| 6.10 | Başarı mesajı görünür | "Stok güncellendi" | ☐ | |
| 6.11 | Listedeki stok güncellenmiş | "60" görünür | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 7: Ürün Silme (2 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 7.1 | "Test Biber" ürününü bul | Ürün görünür | ☐ | |
| 7.2 | "Sil" butonuna tıkla | Onay dialogu açılır | ☐ | |
| 7.3 | Onay mesajını kontrol et | "Silmek istediğinizden emin misiniz?" | ☐ | |
| 7.4 | "Sil" butonuna tıkla | Ürün silinir | ☐ | |
| 7.5 | Başarı mesajı görünür | "Ürün silindi" | ☐ | |
| 7.6 | Ürün listeden kaybolur | "Test Biber" görünmez | ☐ | |
| 7.7 | Toplam ürün sayısı azalır | -1 | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 8: Excel Import (Opsiyonel) (5 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 8.1 | "İçe Aktar" butonuna tıkla | Import modal açılır | ☐ | |
| 8.2 | "Şablon İndir" butonuna tıkla | Excel indirilir | ☐ | |
| 8.3 | İndirilen şablonu aç | Şablon yapısı doğru | ☐ | |
| 8.4 | Test verisi ekle (3-4 ürün) | Veri hazır | ☐ | |
| 8.5 | Dosyayı seç ve yükle | Upload başlar | ☐ | |
| 8.6 | Önizleme ekranı görünür | Ürünler listelenir | ☐ | |
| 8.7 | "İçe Aktar" butonuna tıkla | İçe aktarma başlar | ☐ | |
| 8.8 | Başarı mesajı görünür | "X ürün eklendi" | ☐ | |
| 8.9 | İçe aktarılan ürünler listede | Yeni ürünler görünür | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 9: Arama ve Filtreleme (3 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 9.1 | Arama kutusuna "Test" yaz | Test ürünleri filtrelenir | ☐ | |
| 9.2 | Sonuçlar doğru görünür | Sadece Test ürünleri | ☐ | |
| 9.3 | Kategori filtresi: "Sebze" | Sebze ürünleri filtrelenir | ☐ | |
| 9.4 | Sonuçlar doğru görünür | Sadece Sebze kategorisi | ☐ | |
| 9.5 | Filtreleri temizle | Tüm ürünler görünür | ☐ | |
| 9.6 | Sıralama: "Fiyat (Artan)" | Fiyat sıralaması doğru | ☐ | |
| 9.7 | Sıralama: "Stok (Azalan)" | Stok sıralaması doğru | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

### BÖLÜM 10: Responsive Test (Mobil) (3 dk)

| # | Adım | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| 10.1 | Tarayıcıyı mobil boyuta getir (375px) | Layout uyum sağlar | ☐ | |
| 10.2 | Dashboard mobil görünümü | Kartlar stack olur | ☐ | |
| 10.3 | Ürünler listesi mobil görünümü | Kart/grid görünümü | ☐ | |
| 10.4 | Ürün formu mobil görünümü | Form alanları tam genişlik | ☐ | |
| 10.5 | Butonlar dokunabilir | Min 44px boyut | ☐ | |

**Başarı Kriteri:** Tüm adımlar başarılı

---

## Hata Senaryoları (Edge Cases)

| # | Senaryo | Beklenen Davranış | Durum | Notlar |
|---|----------|-------------------|-------|--------|
| E1 | Boş ürün adı | "Ürün adı zorunludur" hatası | ☐ | |
| E2 | Negatif fiyat | "Geçerli bir fiyat girin" hatası | ☐ | |
| E3 | Negatif stok | "Geçerli bir stok miktarı girin" hatası | ☐ | |
| E4 | Kategori seçilmemiş | "Kategori zorunludur" hatası | ☐ | |
| E5 | Büyük görsel (>5MB) | "Görsel boyutu fazla" hatası veya resize | ☐ | |
| E6 | Geçersiz dosya formatı | "Desteklenmeyen format" hatası | ☐ | |
| E7 | Aynı varyasyon adı | "Bu varyasyon zaten mevcut" hatası | ☐ | |
| E8 | Network kesintisi | "Bağlantı hatası" mesajı | ☐ | |

---

## Performans Kontrolü

| Metrik | Hedef | Gerçekleşen | Durum | Notlar |
|--------|-------|-------------|-------|--------|
| Sayfa yükleme süresi | <3s | ___ s | ☐ | |
| Ürün kaydetme süresi | <2s | ___ s | ☐ | |
| Görsel yükleme süresi | <5s (500KB) | ___ s | ☐ | |
| Listeleme performansı | <1s (100 ürün) | ___ s | ☐ | |
| Arama响应时间 | <500ms | ___ ms | ☐ | |

---

## Güvenlik Kontrolü

| # | Kontrol | Beklenen Sonuç | Durum | Notlar |
|---|------|----------------|-------|--------|
| S1 | Başka tedarikçinin ürününü görme | Sadece kendi ürünleri görünür | ☐ | RLS policy |
| S2 | Başka ürünü düzenleme girişimi | "Yetkiniz yok" hatası | ☐ | RLS policy |
| S3 | SQL injection denemesi | Input sanitization çalışır | ☐ | |
| S4 | XSS denemesi (açıklama) | HTML escape çalışır | ☐ | |
| S5 | Dosya upload güvenliği | Sadece görsel formatları | ☐ | |

---

## Sonuç Raporu

### Genel Durum

| Bölüm | Toplam Adım | Başarılı | Başarısız | Atlandı | % Başarı |
|-------|-------------|----------|-----------|---------|----------|
| Bölüm 1: Giriş ve Dashboard | 6 | __ | __ | __ | __% |
| Bölüm 2: Basit Ürün | 12 | __ | __ | __ | __% |
| Bölüm 3: Varyasyonlu Ürün | 19 | __ | __ | __ | __% |
| Bölüm 4: Tüm Alanlarla | 12 | __ | __ | __ | __% |
| Bölüm 5: Ürün Düzenleme | 8 | __ | __ | __ | __% |
| Bölüm 6: Inline Edit | 11 | __ | __ | __ | __% |
| Bölüm 7: Ürün Silme | 7 | __ | __ | __ | __% |
| Bölüm 8: Excel Import | 9 | __ | __ | __ | __% |
| Bölüm 9: Arama/Filtre | 7 | __ | __ | __ | __% |
| Bölüm 10: Mobil | 5 | __ | __ | __ | __% |
| **TOPLAM** | **96** | **__** | **__** | **__** | **__%** |

### Kritik Başarısızlıklar

```
[List başarısız olan kritik test adımlarını buraya yazın]
Örnek:
- Bölüm 2, Adım 2.8: Görsel yükleme başarısız (Storage bucket hatası)
- Bölüm 3, Adım 3.15: Varyasyonlu ürün kaydedilemedi
```

### Öneriler

```
[İyileştirme önerilerini buraya yazın]
Örnek:
1. Storage bucket RLS policy kontrol edilmeli
2. Varyasyon validasyonu strengthen edilmeli
3. Hata mesajları daha detaylı olmalı
```

### Karar

**[ ]** Sistem ÜRETİME HAZIR (%90+ başarı)
**[ ]** Sistem KISMEN HAZIR (%70-90 başarı) - Kritik sorunlar çözülmeli
**[ ]** Sistem HAZIR DEĞİL (%70 altı) - Büyük sorunlar var

---

## Temizlik (Test Sonrası)

**ÖNEMLİ:** Test verilerini temizlemeyi unutmayın!

| # | Temizlik Adımı | Durum |
|---|----------------|-------|
| T1 | Test ürünlerini sil | ☐ |
| T2 | Yüklenen görselleri sil | ☐ |
| T3 | Test tedarikçi hesabını sil veya pasife al | ☐ |
| T4 | Test raporunu kaydet | ☐ |

---

## Ek Notlar

```
[Test sırasında gözlemlenen diğer notlar, ekran görüntüleri vb.]
```

---

**Test Eden:** _______________
**Tarih:** _______________
**İmza:** _______________
