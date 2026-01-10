# Haldeki Market - Roller ve Yetkiler Dokümantasyonu

> **Version:** 1.0
> **Tarih:** 2026-01-10
> **Durum:** Taslak - Onay bekliyor

---

## 📋 Özet

Haldeki Market'te 6 ana kullanıcı rolü bulunmaktadır. Her rolün platformdaki yetkileri ve görebildiği fiyatlar farklıdır.

### Ana Roller:
1. **Guest** (Ziyaretçi) - Giriş yapmamış kullanıcı
2. **Customer** (Bireysel Müşteri) - B2C perakende alıcı
3. **Business** (B2B İşletme) - İşletme müşterisi
4. **Supplier** (Tedarikçi) - Ürün sağlayan satıcı
5. **Dealer** (Bayi) - Toptan satıcı
6. **Super Admin** - Sistem yöneticisi

---

## 1️⃣ Guest (Ziyaretçi)

### Tanım
Siteye gelen ancak giriş yapmamış kullanıcılar.

### Yetkiler
| İşlem | Yetki | Açıklama |
|-------|-------|----------|
| Ürünleri görüntüle | ✅ | Aktif ürünleri listeleyebilir |
| Ürün detayını gör | ✅ | Ürün bilgilerini inceleyebilir |
| Fiyat gör | ⚠️ | Sadece B2C (perakende) fiyatı |
| Sepete ekle | ❌ | Giriş yapması gerekli |
| Sipariş ver | ❌ | Giriş yapması gerekli |
| Kayıt ol | ✅ | Customer rolü ile kayıt olabilir |

### Görür
- ✅ Ürün listesi
- ✅ Ürün detay sayfası
- ✅ B2C fiyatları
- ✅ Bölgesel teslimat bilgileri
- ❌ B2B fiyatları (gizli)
- ❌ Stok miktarları (gizli veya sınırlı)
- ❌ Admin paneller

---

## 2️⃣ Customer (Bireysel Müşteri / B2C)

### Tanım
Kayıtlı bireysel müşteriler. Perakende alım yaparlar.

### Yetkiler
| İşlem | Yetki | Açıklama |
|-------|-------|----------|
| Ürünleri görüntüle | ✅ | Aktif ürünleri listeleyebilir |
| Fiyat gör | ✅ | B2C perakende fiyatı |
| B2B fiyat gör | ❌ | İşletme fiyatı gizli |
| Sepete ekle | ✅ | Ürünleri sepete ekleyebilir |
| Sipariş ver | ✅ | Minimum sipariş tutarı ile sınırlı |
| Sipariş takibi | ✅ | Kendi siparişlerini görebilir |
| Adres yönetimi | ✅ | Teslimat adreslerini yönetebilir |
| İade talebi | ✅ | Siparişleri için iade isteyebilir |
| Ürün değerlendirme | ✅ | Satın aldığı ürünleri değerlendirebilir |

### Görür
- ✅ Ürün listesi (B2C fiyatlarla)
- ✅ Bölgesel fiyatlar
- ✅ Stok durumu (plenty/limited/last)
- ✅ Kendi siparişleri
- ✅ Kendi adresleri
- ❌ B2B fiyatları
- ❌ Tedarikçi bilgileri
- ❌ Admin paneller

### Fiyatlandırma
```
Görür: region_products.price
Görmez: region_products.business_price
```

---

## 3️⃣ Business (B2B İşletme)

### Tanım
Kayıtlı işletmeler (restoranlar, kafeler, marketler). Toptan alım yaparlar.

### Yetkiler
| İşlem | Yetki | Açıklama |
|-------|-------|----------|
| Ürünleri görüntüle | ✅ | Aktif ürünleri listeleyebilir |
| B2C fiyat gör | ✅ | Perakende fiyatı da görür |
| B2B fiyat gör | ✅ | İşletme indirimi |
| Sepete ekle | ✅ | Ürünleri sepete ekleyebilir |
| Sipariş ver | ✅ | Yüksek minimum sipariş tutarı |
| Sipariş takibi | ✅ | Kendi siparişlerini görebilir |
| Fatura gör | ✅ | Kurumsal faturalarını görebilir |
| İade talebi | ✅ | Toplu iade talepleri |
| Vadeli ödeme | ⚠️ | Onaylı işletmeler için |

### Görür
- ✅ Ürün listesi (B2B fiyatlarla)
- ✅ B2C fiyatlar (karşılaştırma için)
- ✅ Detaylı stok bilgileri
- ✅ Kendi siparişleri
- ✅ Faturalar
- ✅ Vadeli ödeme planı (varsa)
- ❌ Tedarikçi bilgileri
- ❌ Admin paneller

### Fiyatlandırma
```
Görür: region_products.price VE region_products.business_price
Öder: business_price (eğer varsa) yoksa price
İndirim: Genelde %10-25 arası
```

---

## 4️⃣ Supplier (Tedarikçi)

### Tanım
Haldekı'ye ürün sağlayan satıcılar.

### Yetkiler
| İşlem | Yetki | Açıklama |
|-------|-------|----------|
| Ürünlerini gör | ✅ | Sadece kendi ürünleri |
| Ürün eklemek | ✅ | Kendi katalogunu yönetir |
| Fiyat güncelleme | ✅ | Kendi ürünlerinin fiyatlarını |
| Stok güncelleme | ✅ | Stok miktarlarını girer |
| Sipariş gör | ✅ | Kendi ürünleri için siparişleri |
| Fatura kes | ✅ | Siparişler için fatura |
| Diğer ürünleri gör | ❌ | Rakip ürünleri göremez |
| Müşteri bilgileri | ❌ | Sadece teslimat adresi |

### Görür
- ✅ Kendi ürünleri
- ✅ Kendi stokları
- ✅ Kendi ürünleri için siparişler
- ✅ Sipariş detayları (teslimat adresi)
- ❌ Diğer tedarikçilerin ürünleri
- ❌ Kar marjları
- ❌ Müşteri iletişim bilgileri
- ❌ Admin paneller (bazı raporlar hariç)

### Fiyatlandırma
```
Girer: supplier_products.price (kendi teklifi)
Görür: Onaylanmış satış fiyatı (marj dahil değil)
```

---

## 5️⃣ Dealer (Bayi)

### Tanım
Toptan satış yapan bayiler. Büyük hacimli alım yaparlar.

### Yetkiler
| İşlem | Yetki | Açıklama |
|-------|-------|----------|
| Ürünleri görüntüle | ✅ | Tüm ürünleri |
| Bayi fiyatı gör | ✅ | En düşük toptan fiyat |
| Sipariş ver | ✅ | Çok yüksek minimum tutar |
| Sipariş takibi | ✅ | Kendi siparişlerini |
| Bayi paneli | ✅ | Bayilere özel raporlar |
| İndirim talep | ✅ | Özel fiyat için talep |
| Aylık ödeme | ⚠️ | Vadeli ödeme imkanı |

### Görür
- ✅ Ürün listesi (Bayi fiyatlarıyla)
- ✅ B2C ve B2B fiyatları (bilgi için)
- ✅ Detaylı stok ve tedarik bilgileri
- ✅ Aylık satış raporları
- ✅ Kar marjları (kendi için)
- ❌ Tedarikçi maliyetleri
- ❌ Diğer bayilerin bilgileri

### Fiyatlandırma
```
Görür: En düşük fiyat (Bayi fiyatı)
Öder: B2B'den daha düşük, maliyetten yüksek
İndirim: Genelde %25-40 arası
Minimum: 2000-5000 TL sipariş tutarı
```

---

## 6️⃣ Super Admin (Sistem Yöneticisi)

### Tanım
Haldeki platformunun tamamını yöneten sistem yöneticileri.

### Yetkiler
| İşlem | Yetki | Açıklama |
|-------|-------|----------|
| Her şeyi gör | ✅ | Tüm veri erişimi |
| Ürün yönetimi | ✅ | Tüm ürünleri CRUD |
| Fiyat yönetimi | ✅ | Tüm fiyatları değiştir |
| Tedarikçi yönetimi | ✅ | Onay, reddet, düzenle |
| Müşteri yönetimi | ✅ | Roller atar, engeller |
| Sipariş yönetimi | ✅ | Tüm siparişleri görür |
| Raporlama | ✅ | Tüm analitik raporlar |
| Sistem ayarları | ✅ | Bölge, teslimat, ödeme |
| Migration | ✅ | Veritabanı işlemleri |

### Görür
- ✅ Tüm ürünler
- ✅ Tüm fiyat katmanları
- ✅ Tüm stok bilgileri
- ✅ Tüm siparişler
- ✅ Tüm kullanıcılar
- ✅ Tüm finansal veriler
- ✅ Tedarikçi maliyetleri
- ✅ Kar marjları
- ✅ Sistem logları

### Fiyatlandırma
```
Görür: Tüm fiyatları
Düzenler: Tüm fiyatları
Analiz: Fiyat değişim raporları
```

---

## 🔐 Fiyat Görünrlük Matrisi

| Rol | products.price | region_products.price | region_products.business_price | supplier_products.price |
|-----|----------------|----------------------|-------------------------------|------------------------|
| Guest | ✅ | ✅ | ❌ | ❌ |
| Customer | ✅ | ✅ | ❌ | ❌ |
| Business | ✅ | ✅ | ✅ | ❌ |
| Supplier | ⚠️ (kendi) | ⚠️ (kendi) | ❌ | ✅ (kendi) |
| Dealer | ✅ | ✅ | ✅ | ❌ |
| Super Admin | ✅ | ✅ | ✅ | ✅ |

---

## 📊 Karşılaştırma Tablosu

| Özellik | Guest | Customer | Business | Supplier | Dealer | Super Admin |
|---------|-------|----------|----------|----------|--------|-------------|
| **Kayıt gerekli** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Giriş gerekli** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Sepet kullanabilir** | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Sipariş verebilir** | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **B2C fiyatı görür** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **B2B fiyatı görür** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Bayi fiyatı görür** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Min. sipariş tutarı** | - | 150 TL | 500 TL | - | 2000 TL | - |
| **Vadeli ödeme** | ❌ | ❌ | ⚠️ | ❌ | ✅ | - |
| **Panel erişimi** | ❌ | Account | Business | Supplier | Dealer | Admin |

---

## 🔧 Teknik Implementasyon

### Database Roller (app_role enum)
```sql
CREATE TYPE app_role AS ENUM (
  'customer',    -- Bireysel müşteri
  'business',    -- B2B işletme
  'supplier',    -- Tedarikçi
  'dealer',      -- Bayi
  'admin',       -- Yönetici
  'superadmin'   -- Süper yönetici
);
```

### Kullanıcı-Rol İlişkisi
```sql
-- auth_user_roles tablosu
CREATE TABLE auth_user_roles (
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role)
);
```

### RLS Policy Örneği
```sql
-- B2B fiyatı sadece business rolü görsün
CREATE POLICY "Hide business price from non-business"
ON public.region_products FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'business')
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'superadmin')
  OR business_price IS NULL
);
```

---

## 📝 Notlar ve Soru İşaretleri

### Mevcut Sorunlar
1. **Rol tanımları belirsiz** - Her rolün tam yetkileri dokümante edilmemiş
2. **Fiyat katmanları çok** - 4 farklı fiyat kaynağı var
3. **Tedarikçi yetkileri belirsiz** - Kendi ürünlerini düzenleme seviyesi net değil
4. **Bayi sistemi aktif mi?** - Dealer rolü için UI tamamlanmış mı?
5. **Business onay süreci** - İşletme hesapları nasıl onaylanıyor?

### Cevap Bekleyen Sorular
- Business kullanıcılar nasıl onaylanacak? Otomatik mi, manuel mi?
- Dealer rolü için özel bir UI var mı?
- Tedarikçiler birbirlerinin ürünlerini görebilir mi?
- Bayiler için özel bir fiyat katmanı var mı, yoksa B2B fiyatını mı kullanıyorlar?
- Super Admin ve Admin arasındaki fark nedir?

---

## 🚀 Sonraki Adımlar

1. **İş modeli anketini cevapla** - Hangi fiyatlandırma modeli seçilecek?
2. **Rolleri netleştir** - Her rolün tam yetkilerini belirle
3. **Fiyat katmanını basitleştir** - 4'ten 1-2'ye indir
4. **UI/UX'i güncelle** - Rollere uygun arayüzler
5. **Test hesapları oluştur** - Her rol için test kullanıcısı

---

**Durum:** YANIT BEKLİYOR
**Soru:** İş modeli anketini (HALDEKI-BUSINESS-MODEL-QUESTIONNAIRE.md) cevaplayın.
