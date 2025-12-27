# Supabase Auth Ayarları Rehberi

> Bu rehber, Supabase Authentication'ı doğru şekilde yapılandırmak için adım adım talimatlar içerir.

## Giriş Yapamama Sorunu

Yeni Supabase projesinde giriş yapamamanın en yaygın nedenleri:

1. **Email Confirmation** zorunlu (varsayılan olarak açık)
2. **Site URL** yanlış yapılandırılmış
3. **Redirect URLs** eksik

---

## Adım 1: Email Confirmation Ayarı

### Development için Email Confirmation'ı Kapat

1. **Supabase Dashboard** → **Authentication** → **Providers**
2. **Email** provider'a tıkla
3. **"Confirm email"** seçeneğini **KAPAT** (toggle off)
4. **Save** tıkla

> ⚠️ **ÖNEMLİ**: Production'da bu ayarı tekrar AÇ!

---

## Adım 2: Site URL Ayarla

1. **Authentication** → **URL Configuration**
2. **Site URL** alanına local URL'i gir:

```
http://localhost:8080
```

veya hangi portta çalışıyorsan onu yaz (genelde 5173 veya 8080).

---

## Adım 3: Redirect URLs Ekle

Aynı sayfada **Redirect URLs** bölümüne şunları ekle:

```
http://localhost:8080/**
http://localhost:5173/**
http://127.0.0.1:8080/**
http://127.0.0.1:5173/**
```

Her birini ayrı ayrı ekle (Add URL butonuyla).

---

## Adım 4: RLS Kontrol Et

Eğer hala sorun varsa, RLS politikalarını kontrol et:

1. **Table Editor** → **profiles** tablosu
2. **RLS** aktif mi kontrol et
3. Politikaların doğru tanımlandığını kontrol et

---

## Test Et

1. Uygulamayı yeniden başlat:

```powershell
npm run dev
```

2. Yeni bir kullanıcı kayıt ol
3. Giriş yap

---

## Admin Kullanıcı Oluşturma

Kayıt olduktan sonra admin rolü atamak için:

### 1. User ID'yi Bul

**SQL Editor**'da çalıştır:

```sql
SELECT id, email FROM auth.users WHERE email = 'senin@email.com';
```

### 2. Superadmin Rolü Ata

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('BURAYA-USER-UUID', 'superadmin');
```

### 3. Profil Oluştur (Eğer Yoksa)

```sql
INSERT INTO public.profiles (id, email, full_name)
VALUES ('BURAYA-USER-UUID', 'senin@email.com', 'Admin Adı')
ON CONFLICT (id) DO NOTHING;
```

---

## Yaygın Hatalar ve Çözümleri

### "Invalid login credentials"

- Email/şifre yanlış
- Kullanıcı kayıtlı değil
- Email confirmation bekliyor (Adım 1'i kontrol et)

### "User not allowed"

- RLS politikaları engelliyor
- `user_roles` tablosuna kayıt eklenmemiş

### "Auth session missing"

- `.env.local` dosyasındaki key'ler yanlış
- Tarayıcı cache'ini temizle

### Kayıt başarılı ama giriş yapamıyor

- `handle_new_user` trigger'ı çalışmıyor olabilir
- SQL Editor'da trigger'ı kontrol et:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## Hızlı Kontrol Listesi

- [ ] Email confirmation kapalı mı?
- [ ] Site URL doğru mu?
- [ ] Redirect URLs ekli mi?
- [ ] `.env.local` güncel mi?
- [ ] Seed data çalıştırıldı mı?

---

Son güncelleme: 2025-12-26

