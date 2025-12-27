# Supabase Migration Rehberi

> Bu rehber, Haldeki projesini yeni bir Supabase hesabına taşımak için adım adım talimatlar içerir.

## Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│  ADIM 1: Supabase Hesabı Oluştur                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ADIM 2: Yeni Proje Oluştur                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ADIM 3: Veritabanı Şemasını Oluştur                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ADIM 4: Edge Function Deploy Et                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ADIM 5: Secrets Ekle                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ADIM 6: Test Verilerini Ekle                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ADIM 7: Local Ortamı Güncelle                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ADIM 8: Test Et                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Adım 1: Supabase Hesabı Oluştur

1. **[supabase.com](https://supabase.com)** adresine git
2. **"Start your project"** veya **"Sign Up"** butonuna tıkla
3. GitHub hesabınla giriş yap (önerilen) veya email ile kayıt ol
4. Email doğrulamasını tamamla

---

## Adım 2: Yeni Proje Oluştur

1. Dashboard'a giriş yaptıktan sonra **"New Project"** tıkla
2. Proje bilgilerini doldur:
   - **Name**: `haldeki-production` (veya istediğin isim)
   - **Database Password**: Güçlü bir şifre belirle (SAKLA!)
   - **Region**: `Frankfurt (eu-central-1)` (Türkiye'ye en yakın)
3. **"Create new project"** tıkla
4. Proje oluşturulana kadar bekle (1-2 dakika)

### Önemli Bilgileri Kaydet

Proje oluşturulduktan sonra şu bilgileri not al:

1. **Project Settings > API** bölümüne git
2. Şu bilgileri kaydet:
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` ile başlayan uzun key
   - **Project Reference ID**: URL'deki `xxxxxx` kısmı

---

## Adım 3: Veritabanı Şemasını Oluştur

1. Sol menüden **"SQL Editor"** tıkla
2. **"+ New query"** tıkla
3. `docs/scripts/full-schema.sql` dosyasının içeriğini kopyala
4. SQL Editor'a yapıştır
5. **"Run"** butonuna tıkla (veya Ctrl+Enter)
6. Tüm sorguların başarılı olduğunu kontrol et

### Beklenen Sonuç

Aşağıdaki tablolar oluşturulmuş olmalı:
- `profiles`
- `regions`
- `products`
- `region_products`
- `orders`
- `user_roles`
- `pending_invites`
- `dealers`
- `suppliers`
- `supplier_offers`

Kontrol etmek için:
1. Sol menüden **"Table Editor"** tıkla
2. Tüm tabloların listelendiğini gör

---

## Adım 4: Edge Function Deploy Et

### Supabase CLI Kurulumu

**ÖNEMLİ**: Supabase CLI artık global npm paketi olarak kurulamıyor. Aşağıdaki yöntemlerden birini kullan:

#### Yöntem 1: npx ile (Önerilen - Kurulum Gerektirmez)

npx kullanarak doğrudan çalıştırabilirsin (her komutta `npx` öneki kullan):

```powershell
# Versiyonu kontrol et
npx supabase --version
```

#### Yöntem 2: Scoop ile (Windows)

Eğer Scoop kuruluysa:

```powershell
# Scoop ile kur
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Doğrula
supabase --version
```

#### Yöntem 3: Chocolatey ile (Windows)

Eğer Chocolatey kuruluysa:

```powershell
# Chocolatey ile kur
choco install supabase

# Doğrula
supabase --version
```

**Not**: Bu rehberdeki tüm komutlar `npx supabase` formatında yazılmıştır. Eğer Scoop veya Chocolatey ile kurduysan, `npx` önekini kaldırabilirsin.

### Projeyi Linkle

```powershell
# Proje klasörüne git
cd F:\donusum\haldeki-love\haldeki-market

# Supabase'e giriş yap
npx supabase login

# Projeyi linkle (XXXXX yerine kendi Project ID'ni yaz)
npx supabase link --project-ref XXXXX
```

### Edge Function Deploy

```powershell
# send-email fonksiyonunu deploy et
npx supabase functions deploy send-email
```

---

## Adım 5: Secrets Ekle

Edge Function'ların çalışması için secret'lar gerekli.

### Dashboard'dan Ekleme

1. **Project Settings > Edge Functions** git
2. **"Manage secrets"** tıkla
3. Aşağıdaki secret'ı ekle:

| Secret Name | Value |
|-------------|-------|
| `BREVO_API_KEY` | Brevo hesabından aldığın API key |

### CLI ile Ekleme (Alternatif)

```powershell
npx supabase secrets set BREVO_API_KEY=xkeysib-xxxxx
```

---

## Adım 6: Seed Data Ekle (Kapsamlı Veri)

### Seçenek A: Kapsamlı Seed Dosyası (Önerilen)

1. **SQL Editor**'da yeni query aç
2. `docs/scripts/seed-data.sql` dosyasının içeriğini kopyala
3. **Run** tıkla

Bu dosya şunları ekler:
- **5 Bölge**: Menemen, Aliağa, Foça, Bergama, Dikili
- **39 Ürün**: Tüm kategorilerden (görselli)
- **Bölge-Ürün Fiyatları**: Her bölge için ayrı fiyatlar

### Seçenek B: Minimal Veri

Sadece temel test verisi istiyorsan:

```sql
-- Bölgeler
INSERT INTO public.regions (name, slug, is_active, delivery_slots) VALUES
('Menemen', 'menemen', true, '[{"day": "Pazartesi", "time_slots": ["09:00-12:00", "14:00-18:00"]}]'),
('Aliağa', 'aliaga', true, '[{"day": "Salı", "time_slots": ["09:00-12:00"]}]');

-- Ürünler
INSERT INTO public.products (name, slug, category, unit, base_price, image_url, is_bugun_halde, is_active) VALUES
('Domates', 'domates', 'sebzeler', 'kg', 25.00, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop', true, true),
('Salatalık', 'salatalik', 'sebzeler', 'kg', 20.00, 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&h=400&fit=crop', true, true),
('Elma', 'elma', 'meyveler', 'kg', 35.00, 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&h=400&fit=crop', true, true);
```

### Admin Kullanıcı Oluşturma

1. **Önce Auth Ayarlarını Yap** (bkz: `docs/guides/02-supabase-auth-setup.md`)
2. Uygulamada normal kayıt ol
3. SQL Editor'da rol ata:

```sql
-- User ID'ni bul
SELECT id, email FROM auth.users WHERE email = 'senin@email.com';

-- Superadmin rolü ata
INSERT INTO public.user_roles (user_id, role) 
VALUES ('BURAYA-USER-UUID', 'superadmin');
```

---

## Adım 7: Local Ortamı Güncelle

Proje klasöründeki `.env.local` dosyasını güncelle:

```env
VITE_SUPABASE_URL=https://XXXXX.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=XXXXX
```

**Not**: `XXXXX` yerine kendi proje bilgilerini yaz.

---

## Adım 8: Test Et

### Uygulamayı Başlat

```powershell
cd F:\donusum\haldeki-love\haldeki-market
npm run dev
```

### Kontrol Listesi

- [ ] Ana sayfa yükleniyor mu?
- [ ] Bölge seçimi çalışıyor mu?
- [ ] Ürünler listeleniyor mu?
- [ ] Giriş/Kayıt çalışıyor mu?
- [ ] Admin paneline erişilebiliyor mu?
- [ ] Bayi davet emaili gönderiliyor mu?

---

## Sorun Giderme

### "Auth session missing" hatası
- `.env.local` dosyasındaki key'lerin doğru olduğunu kontrol et
- Tarayıcı cache'ini temizle (Ctrl+Shift+Delete)

### Tablolar görünmüyor
- SQL Editor'da hata olmadığını kontrol et
- Table Editor'ı yenile

### Edge Function çalışmıyor
- Secrets'ların eklendiğini kontrol et
- Function logs'ları kontrol et (Dashboard > Edge Functions > Logs)

### Email gönderilmiyor
- BREVO_API_KEY'in doğru olduğunu kontrol et
- Brevo hesabında API izinlerini kontrol et

---

## Sonraki Adımlar

Migration tamamlandıktan sonra:

1. Production deploy için `docs/guides/03-deployment.md` rehberine bak
2. Lovable MVP'yi kapatmak için Lovable dashboard'a git

---

Son güncelleme: 2025-12-26

