# Tedarikçi Yaşam Döngüsü - Kısa Cevaplar

> **Senaryo:** Admin panelden tedarikçi oluşturdu → Bilgilerini kopyaladı → Tedarikçiye attı
> **Soru:** Tedarikçi ne yaşayacak?

---

## 📋 Adım Adım Akış

### 1️⃣ Admin Tedarikçi Oluşturur

**Admin Panel → Suppliers → Yeni Tedarikçi**

**Girilen Bilgiler:**
- ✅ Şirket adı
- ✅ Yetkili kişi
- ✅ Telefon
- ✅ Email
- ✅ Adres
- ✅ **Onay durumu:** `approved` (admin manuel oluşturduğu için)

**Oluşturulanlar:**
```sql
-- 1. auth.users (Supabase Auth)
-- 2. profiles (kullanıcı profili)
-- 3. user_roles (role: 'supplier')
-- 4. suppliers (approval_status: 'approved')
```

---

### 2️⃣ Admin Bilgileri Tedarikçiye Gönderir

**Kopyalanan Bilgiler:**
- ✅ Email adresi
- ✅ Geçici şifre (admin belirlediyse)

**Tedarikçiye Ne Olur?**
- Email bilgileri alır
- "Şifremi unuttum" ile şifre belirleyebilir
- Hemen giriş yapabilir

---

### 3️⃣ Tedarikçi Giriş Yapar

**URL:** `haldeki-market.vercel.app/giris`

**Adımlar:**
1. Email ve şifre girer
2. "Giriş Yap" tıklar
3. **Sistem kontrol eder:**
   - ✅ Email/şifre doğruluğu
   - ✅ `user_roles` → role = 'supplier'
   - ✅ `suppliers` → approval_status = 'approved'
   - ✅ `profiles` → phone var mı?

**Sonuç:**
```
Tedarikçi Onaylı → SupplierDashboard'a yönlendirilir
Tedarikçi Onaysız → /beklemede sayfasına yönlendirilir
```

**Admin Manuel Oluşturduğu İçin:**
- `approval_status = 'approved'` ✅
- Dashboard'a direkt gider

---

### 4️⃣ Tedarikçi Dashboard'ı Görür

**URL:** `haldeki-market.vercel.app/tedarikci`

**Gördüğü Bölümler:**
- 📊 İstatistikler (Toplam ürün, aktif ürün, toplam sipariş)
- 📦 Ürünlerimi Gör (buton)
- ➕ Yeni Ürün Ekle (buton)
- 📤 Siparişlerim
- ⚙️ Ayarlar

---

### 5️⃣ İlk Ürününü Ekler

**"Yeni Ürün Ekle" → Form Doldur → Kaydet**

**Girdiği Bilgiler:**
- Ürün adı: "Domates"
- Kategori: "Sebze"
- Fiyat: "15 TL/kg"
- Stok: "100 kg"
- Birim: "kg"
- Görsel: (upload eder)
- Varyasyon: (opsiyonel)

**Duplicate Kontrolü:**
```
Sistem: "Aynı isimli ürünler var!"
  - Domates (Tedarikçi A) - 15 TL/kg
  - Domates (Tedarikçi B) - 18 TL/kg

Tedarikçi Seçer:
  [İptal] veya [Yine de Oluştur]
```

**Sonuç:**
- ✅ Ürün ANINDA oluşturulur
- ✅ `is_active = true` (otomatik yayın)
- ✅ `supplier_products` tablosuna eklenir
- ⚠️ Eğer duplicate varsa uyarı gösterilir

---

### 6️⃣ Ürün Sitede Yayınlanır

**Customer Site → Ürünler**

**Müşteri Görür:**
- Product: "Domates"
- Price: "15 TL/kg" (en düşük fiyat)
- Supplier: "3 tedarikçiden"

**Fiyatlandırma:**
```
Eğer 3 tedarikçi "Domates" sağlıyorsa:
- Tedarikçi A: 15 TL/kg
- Tedarikçi B: 18 TL/kg
- Tedarikçi C: 12 TL/kg

Customer görür: "12 TL/kg" (en düşük)
Altında: "3 tedarikçiden"
```

---

## ⚠️ Olası Sorunlar ve Çözümler

### Sorun 1: "Telefon numaram eksik"

**Tedarikçi Giriş Yapar → Dashboard'a gidemez**

**Sebep:**
```typescript
// AuthContext.tsx:274-305
// Telefon numarası whitelist kontrolü için gerekli
// profiles.phone = NULL ise kontrol atlanır
```

**Çözüm:**
- Admin panelden `profiles` tablosuna telefon ekler
- Veya tedarikçi profili günceller

---

### Sorun 2: "Ürünüm görünmüyor"

**Tedarikçi ürün ekler → Sitede göremiyor**

**Olası Sebepler:**
1. `is_active = false` → Admin'den kontrol et
2. Kategori seçilmemiş → Formu düzelt
3. Görsel yüklenemedi → İnternet bağlantısını kontrol et

**Çözüm:**
- Admin: Products page'den kontrol et
- `is_active` checkbox'ı işaretle

---

### Sorun 3: "Ürünü düzenleyemiyorum"

**Tedarikçi ürünü görebilir ama editleyemez**

**Sebep:**
```typescript
// RLS Policy: Sadece kendi supplier_products'ını görebilir
// Doğru supplier_id ile mi eklenmiş?
```

**Çözüm:**
- `supplier_products` tablosunu kontrol et
- `supplier_id` doğru mu?

---

## 🎯 Kısa Cevaplar

### Q1: Tedarikçi hemen giriş yapabilir mi?

**A:** **EVET**
- Admin oluşturur → Email gönderilir
- Tedarikçi "Şifremi Unuttum" ile şifre belirler
- Giriş yapabilir

---

### Q2: Dashboard'a gidebilir mi?

**A:** **EVET**
- `approval_status = 'approved'` (admin oluşturduğu için)
- Direkt `/tedarikci` route'una gider

---

### Q3: Ürün ekleyebilir mi?

**A:** **EVET**
- Formu doldurur → Kaydeder
- `is_active = true` → Otomatik yayın

---

### Q4: Ürünü sitede görür mü?

**A:** **EVET, hemen**
- Customer site'da görünür
- En düşük fiyat gösterilir
- Diğer tedarikçilerle rekabet eder

---

### Q5: Duplicate ürün eklerse ne olur?

**A:** **UYARI alır, karar verir**
- Sistem: "Aynı isimli ürünler var!"
- Seçenekler: "İptal" veya "Yine de Oluştur"
- Karar tedarikçinin

---

### Q6: Admin ne yapabilir?

**A:** **İki şey**
1. **Ürün kaldırabilir:** Specific supplier-product bağlantısını siler
2. **Tedarikçi yasaklayabilir:** `is_active = false` yapar, sebep belirtir

---

## 📊 Özet

### Admin → Tedarikçi Akışı

```
1. Admin: Supplier oluştur
   ↓
2. Admin: Bilgileri kopyala, tedarikçiye gönder
   ↓
3. Tedarikçi: Giriş yap (Şifremi unuttum → Şifre belirle)
   ↓
4. Tedarikçi: Dashboard'ı görür
   ↓
5. Tedarikçi: İlk ürününü ekler (Duplicate uyarısı varsa)
   ↓
6. Tedarikçi: Ürün sitede yayınlanır (Otomatik)
   ↓
7. Customer: Ürünü görür, sipariş verir
   ↓
8. Admin: Gerekirse ürün kaldırır / tedarikçi yasaklar
```

### Süre

- Admin oluşturma: 2 dakika
- Tedarikçi ilk giriş: 3 dakika
- İlk ürün ekleme: 5 dakika
- Sitede görünme: **ANINDA** ✅

**Toplam:** 10 dakikada ürün sitede!

---

**Tarih:** 2026-01-09
**Model:** Trust-but-verify
**Durum:** Production ready ✅
