# Test Hesapları - Development Kullanım Kılavuzu

## Overview

Bu sistem geliştirme sürecinde hızlı rol değiştirme sağlayan test hesapları içerir. Tüm hesaplar sadece development ortamı içindir.

## Güvenlik Garantileri

| Seviye | Kontrol | Açıklama |
|--------|---------|----------|
| **Component** | `import.meta.env.PROD` → Error throw | Production'da kod çalışmaz |
| **Render** | `import.meta.env.DEV` → Condition | Sadece DEV'de görünür |
| **Build** | Tree-shaking | Production bundle'da tamamen çıkarılır |
| **Environment** | `.env.local` → .gitignore | Git'e asla eklenmez |
| **Domain** | `@haldeki.local` | Gerçek email değil, local test |

## Test Hesapları

### 1. Admin Hesabı

| Özellik | Değer |
|---------|-------|
| **Email** | `admin-test@haldeki.local` |
| **Şifre** | `DevTest1234!` |
| **Rol** | `superadmin` |
| **UUID** | `00000000-0000-0000-0000-000000000001` |
| **Panel** | `/admin` |
| **Yetkiler** | Tüm admin yetkileri (Kullanıcılar, Siparişler, Ürünler, Bölgeler, Bayiler, Tedarikçiler, İşletmeler) |

### 2. Bayi Hesabı

| Özellik | Değer |
|---------|-------|
| **Email** | `dealer-test@haldeki.local` |
| **Şifre** | `DevTest1234!` |
| **Rol** | `dealer` |
| **UUID** | `00000000-0000-0000-0000-000000000002` |
| **Panel** | `/bayi` |
| **Bölge** | Menemen |
| **Durum** | Onaylı ve Aktif |

### 3. Tedarikçi Hesabı

| Özellik | Değer |
|---------|-------|
| **Email** | `supplier-test@haldeki.local` |
| **Şifre** | `DevTest1234!` |
| **Rol** | `supplier` |
| **UUID** | `00000000-0000-0000-0000-000000000003` |
| **Panel** | `/tedarikci` |
| **Durum** | Onaylı ve Aktif |

### 4. İşletme Hesabı

| Özellik | Değer |
|---------|-------|
| **Email** | `business-test@haldeki.local` |
| **Şifre** | `DevTest1234!` |
| **Rol** | `business` |
| **UUID** | `00000000-0000-0000-0000-000000000004` |
| **Panel** | `/isletme` |
| **Bölge** | Menemen |
| **Durum** | Onaylı ve Aktif |
| **İşletme Türü** | Restaurant (Test Restoran) |

## Kurulum Talimatları

### Adım 1: Environment Variables

`.env.local` dosyası zaten yapılandırılmış olmalı. İçerik:

```bash
VITE_TEST_ADMIN_EMAIL=admin-test@haldeki.local
VITE_TEST_DEALER_EMAIL=dealer-test@haldeki.local
VITE_TEST_SUPPLIER_EMAIL=supplier-test@haldeki.local
VITE_TEST_BUSINESS_EMAIL=business-test@haldeki.local
VITE_TEST_DEFAULT_PASS=DevTest1234!
```

### Adım 2: Database Migration

```bash
# Migration'ı çalıştır
supabase db push

# Veya lokal development için
supabase migration up
```

Migration dosyası:
- `supabase/migrations/20250104100000_seed_test_accounts.sql`

Bu migration:
- ✅ `profiles` tablosuna kayıtlar ekler
- ✅ `user_roles` tablosuna roller atar
- ✅ `dealers` tablosuna bayi kaydı oluşturur
- ✅ `suppliers` tablosuna tedarikçi kaydı oluşturur
- ✅ `businesses` tablosuna işletme kaydı oluşturur
- ✅ Idempotent (tekrar çalıştırılabilir)

### Adım 3: Auth Kullanıcılarını Oluştur

**Yöntem A: Edge Function (Önerilen)**

```bash
# Edge function'ı deploy et
supabase functions deploy create-test-users

# Test kullanıcılarını oluştur
curl -X POST "$(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/create-test-users" \
  -H "Authorization: Bearer $(supabase status | grep 'service_role key' | awk '{print $3}')" \
  -H "Content-Type: application/json"
```

**Yöntem B: Supabase Dashboard (Manuel)**

1. Supabase Dashboard → Authentication → Users
2. "Add user" butonuna tıkla
3. Her kullanıcı için:
   - Email: `*-test@haldeki.local`
   - Password: `DevTest1234!`
   - "Auto Confirm User" seç
   - "Send invite email" kaldır (kapalı olsun)

### Adım 4: Uygulamayı Başlat

```bash
npm run dev
```

Sağ alt köşede **RoleSwitcher** card'ı görülecektir.

## Kullanım

### RoleSwitcher Arayüzü

Development modunda sağ altta görünen card'da:

```
🧪 Development Mode
─────────────────────────
Hızlı test hesabı geçişi:

👮 Admin          [superadmin]
🚚 Bayi           [dealer]
📦 Tedarikçi       [supplier]
🏢 İşletme         [business]

                  [Çıkış Yap]
```

**Kullanım:**
1. Role butonuna tıkla
2. Otomatik giriş yapılır
3. İlgili panele yönlendirilirsin
4. "Çıkış Yap" ile çıkış yapabilirsin

### Manuel Giriş

Normal login ekranından da giriş yapabilirsin:

- URL: `/giris`
- Email: `*-test@haldeki.local`
- Şifre: `DevTest1234!`

## Test Senaryoları

### Admin Panel Testi

```bash
# RoleSwitcher'dan "Admin" butonuna tıkla
# Otomatik olarak /admin sayfasına yönlendirileceksin
```

Test edilecek özellikler:
- ✅ Dashboard istatistikleri
- ✅ Kullanıcı yönetimi
- ✅ Sipariş yönetimi
- ✅ Ürün yönetimi
- ✅ Bölge ürünleri
- ✅ Bayi onayları
- ✅ Tedarikçi onayları
- ✅ İşletme onayları

### Bayi Panel Testi

```bash
# RoleSwitcher'dan "Bayi" butonuna tıkla
# /bayi sayfasına yönlendirileceksin
```

Test edilecek özellikler:
- ✅ Dashboard istatistikleri
- ✅ Müşteri listesi
- ✅ Sipariş geçmişi

### Tedarikçi Panel Testi

```bash
# RoleSwitcher'dan "Tedarikçi" butonuna tıkla
# /tedarikci sayfasına yönlendirileceksin
```

Test edilecek özellikler:
- ✅ Dashboard istatistikleri
- ✅ Ürün teklifleri
- ✅ Sipariş geçmişi

### İşletme Panel Testi

```bash
# RoleSwitcher'dan "İşletme" butonuna tıkla
# /isletme sayfasına yönlendirileceksin
```

Test edilecek özellikler:
- ✅ Dashboard istatistikleri
- ✅ Sipariş geçmişi
- ✅ B2B fiyatları

## Sorun Giderme

### "Test hesabı bulunamadı" Hatası

**Sebep:** Auth kullanıcısı oluşturulmamış

**Çözüm:**
```bash
# Edge function'ı çalıştır
curl -X POST "$(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/create-test-users" \
  -H "Authorization: Bearer $(supabase status | grep 'service_role key' | awk '{print $3}')"
```

### RoleSwitcher Görünmüyor

**Sebep:** Production modunda çalışıyorsun

**Çözüm:**
```bash
# Development mode olduğundan emin ol
npm run dev  # ✅ DOĞRU
npm run build && npm run preview  # ✅ DOĞRU
npm run serve  # ❌ YANLIŞ - Production
```

### Migration Hatası

**Sebep:** Bölge (Menemen) bulunamıyor

**Çözüm:**
```bash
# Önce regions tablosunu kontrol et
supabase db reset  # Tüm migration'ları sıfırla
```

### Giriş Yapılamıyor

**Sebep:** Şifre yanlış veya email yanlış

**Çözüm:**
```bash
# .env.local dosyasını kontrol et
cat .env.local | grep TEST_

# Çıktı şöyle olmalı:
# VITE_TEST_ADMIN_EMAIL=admin-test@haldeki.local
# VITE_TEST_DEFAULT_PASS=DevTest1234!
```

## Production Build Kontrolü

Production build'de RoleSwitcher'ın çıkarıldığını doğrula:

```bash
# Production build
npm run build

# Bundle içeriğini kontrol et
grep -r "RoleSwitcher" dist/
# Çıktı boş olmalı ✅

grep -r "admin-test@haldeki.local" dist/
# Çıktı boş olmalı ✅
```

## Dosya Yapısı

```
haldeki-market/
├── .env.local                                    # Environment variables (gitignore)
├── src/
│   ├── components/
│   │   └── dev/
│   │       └── RoleSwitcher.tsx                 # DEV-only rol değiştirici
│   └── App.tsx                                   # {import.meta.env.DEV && <RoleSwitcher />}
├── supabase/
│   ├── functions/
│   │   └── create-test-users/
│   │       └── index.ts                         # Auth kullanıcı oluşturucu
│   └── migrations/
│       └── 20250104100000_seed_test_accounts.sql # DB kayıtları
└── docs/
    └── development/
        └── TEST_ACCOUNTS.md                     # Bu dosya
```

## Güvenlik Özeti

✅ **Production'a çıkmaz**: `import.meta.env.PROD` kontrolü
✅ **Kod tamamen çıkarılır**: Tree-shaking ile elimination
✅ **Environment güvenli**: `.env.local` git'e eklenmez
✅ **Test domain**: `@haldeki.local` gerçek email değil
✅ **Açık işaretleme**: `is_test_account: true` metadata
✅ **Service role gerekli**: Edge function korumalı

## Referanslar

- `src/components/dev/RoleSwitcher.tsx:11` - Production kontrolü
- `src/App.tsx:71` - DEV-only render
- `supabase/migrations/20250104100000_seed_test_accounts.sql` - DB seed
- `supabase/functions/create-test-users/index.ts` - Auth creation

---

**Not**: Bu sistem sadece development içindir. Production'da asla kullanılmamalıdır.
