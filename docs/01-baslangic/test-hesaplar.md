# Test Hesaplar

> Tüm roller için test kullanıcıları

---

**İçindekiler**
- [Hesaplar](#hesaplar)
- [Rol Tanımları](#rol-tanımları)
- [Giriş İşlemi](#giriş-işlemi)
- [Test Senaryoları](#test-senaryoları)

---

## Hesaplar

### Customer (Müşteri)

| Email | Şifre | Bölge |
|-------|-------|-------|
| customer@test.com | test123456 | İstanbul Avrupa |

**Yetkiler:**
- ✅ Ürün listesini görüntüle
- ✅ Sepete ekle
- ✅ Sipariş oluştur

---

### Supplier (Tedarikçi)

| Email | Şifre | Durum | Bölge |
|-------|-------|-------|-------|
| supplier@test.com | test123456 | ✅ Onaylı | İstanbul Avrupa |
| supplier-pending@test.com | test123456 | ⏳ Beklemede | İstanbul Anadolu |

**Yetkiler:**
- ✅ Ürün ekleme/düzenleme
- ✅ Stok güncelleme
- ✅ Gelen siparişleri görme
- ❌ Admin işlemleri

---

### Dealer (Bayi)

| Email | Şifre | Durum | Bölge |
|-------|-------|-------|-------|
| dealer@test.com | test123456 | ✅ Onaylı | İstanbul Avrupa |

**Yetkiler:**
- ✅ B2B sipariş yönetimi
- ✅ Müşteri portföyü
- ✅ Teslimat planlama

---

### Business (İşletme)

| Email | Şifre | Durum |
|-------|-------|-------|
| business@test.com | test123456 | ✅ Onaylı |

**Yetkiler:**
- ✅ Kurumsal siparişler
- ✅ Fatura yönetimi

---

### Admin (Yönetici)

| Email | Şifre | Rol |
|-------|-------|-----|
| admin@test.com | test123456 | Super Admin |

**Yetkiler:**
- ✅ Tüm kullanıcıları görme
- ✅ Tedarikçi onaylama
- ✅ Sistem konfigürasyonu
- ✅ Raporlar ve analytics

---

## Rol Tanımları

```
┌───────────────────────────────────────────────────────────┐
│                    CUSTOMER                               │
│  Son kullanıcı                                            │
│  - Ürün arama                                             │
│  - Sepet yönetimi                                         │
│  - Sipariş takibi                                         │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                    SUPPLIER                               │
│  Ürün satan tedarikçi                                     │
│  - Ürün katalogu                                          │
│  - Fiyat/stok yönetimi                                    │
│  - Sipariş görme                                          │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                     DEALER                                │
│  Bölgesel bayi                                            │
│  - B2B siparişler                                         │
│  - Müşteri yönetimi                                       │
│  - Teslimat koordinasyonu                                 │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                    BUSINESS                               │
│  Kurumsal müşteri                                         │
│  - Toplu siparişler                                       │
│  - Fatura yönetimi                                        │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                      ADMIN                                │
│  Sistem yöneticisi                                        │
│  - Kullanıcı onayı                                        │
│  - Konfigürasyon                                          │
│  - Raporlama                                              │
└───────────────────────────────────────────────────────────┘
```

---

## Giriş İşlemi

### 1. Giriş Sayfası

```
http://localhost:5173/login
```

### 2. Test Hesabı ile Giriş

```
Email: customer@test.com
Şifre: test123456
"Giriş Yap" butonuna tıkla
```

### 3. Başarılı Giriş

```
✅ Dashboard'a yönlendirilmelisin
✅ Rolüne uygun menüleri görmelisin
✅ Console'da hata olmamalı
```

---

## Test Senaryoları

### Customer Senaryosu

```bash
1. customer@test.com ile giriş yap
2. Ürün listesini görüntüle
3. Ürün sepete ekle
4. Sepeti görüntüle
5. Checkout yap
6. Sipariş oluştur
```

### Supplier Senaryosu

```bash
1. supplier@test.com ile giriş yap
2. Supplier dashboard'a git
3. "Yeni Ürün Ekle" butonuna tıkla
4. Ürün bilgilerini gir
5. Kaydet
6. Ürün listesinde ürünü gör
```

### Admin Senaryosu

```bash
1. admin@test.com ile giriş yap
2. Admin dashboard'a git
3. "Bekleyen Tedarikçiler" listesini gör
4. Tedarikçi onayla
5. Onaylandı mesajını gör
```

---

## Önemli Notlar

### Test Verileri

- Test hesapları staging environment'te kullanılır
- Production'da farklı hesaplar vardır
- Test verileri her gün sıfırlanabilir

### Güvenlik

⚠️ **Bu hesaplar sadece test içindir!**
- Production'da asla kullanma
- Gerçek müşteri verilerini saklama
- Test sonrası çıkış yap

---

## Sorun Giderme

### Giriş Hatası

```
Hata: "Invalid login credentials"

Çözüm:
1. Email ve şifreyi kontrol et
2. Supabase Auth'ta kullanıcının var olduğunu kontrol et
3. Email onaylanmış mı kontrol et
```

### Yetki Hatası

```
Hata: "You don't have permission"

Çözüm:
1. Kullanıcının rolünü kontrol et
2. RLS policies'i kontrol et
3. Admin onayı gerekli olabilir
```

---

## Sonraki Adımlar

1. [Kullanım Kılavuzları](../02-kullanim-kilavuzlari/) - Rol bazlı rehberler
2. [Mimari - Güvenlik](../03-mimari/guvenlik-modeli.md) - RBAC detayları

---

**Son güncelleme:** 2026-01-10
**Tahmini süre:** 2 dakika
