# Auth Sorun Giderme Rehberi

> Bu rehber, giriş yapamama sorunlarını çözmek için adım adım talimatlar içerir.

---

## Hızlı Çözüm

Tüm kullanıcı şifrelerini sıfırlamak için:

```bash
node scripts/fix-all-passwords.cjs
```

Bu script:
- Tüm kullanıcıların şifrelerini `Test1234!` olarak sıfırlar
- Email confirmation'ı otomatik yapar
- Kullanıcı listesini gösterir

---

## Giriş Bilgileri

Tüm hesaplar için varsayılan şifre: `Test1234!`

### Test Hesapları

| Email | Şifre | Rol |
|-------|-------|-----|
| bayraktarismail00@gmail.com | Test1234! | superadmin |
| test.bayi@haldeki.com | Test1234! | dealer |
| test.tedarikci@haldeki.com | Test1234! | supplier |

---

## Yaygın Sorunlar ve Çözümleri

### 1. "Email veya şifre hatalı" Hatası

**Nedenler:**
- Şifre yanlış girilmiş
- Email confirmation gerekli
- Kullanıcı silinmiş veya deaktif edilmiş

**Çözüm:**
1. Şifre sıfırlama scriptini çalıştırın: `node scripts/fix-all-passwords.cjs`
2. Şifrenin `Test1234!` olduğundan emin olun
3. Email'in doğru yazıldığından emin olun (büyük/küçük harf duyarlı değil)

### 2. Email Confirmation Gerekli

**Nedenler:**
- Supabase Auth ayarlarında email confirmation açık
- Kullanıcı email'ini confirm etmemiş

**Çözüm:**
1. Supabase Dashboard > Authentication > Settings
2. "Enable email confirmations" ayarını kontrol edin
3. Development için kapatabilirsiniz veya script ile otomatik confirm edin

### 3. Kullanıcı Bulunamıyor

**Nedenler:**
- Kullanıcı silinmiş
- Yanlış email girilmiş

**Çözüm:**
1. Script ile kullanıcı listesini kontrol edin
2. Gerekirse yeni kullanıcı oluşturun

---

## Supabase Auth Ayarları

### Önerilen Development Ayarları

Supabase Dashboard > Authentication > Settings:

1. **Email Auth**
   - ✅ Enable email confirmations: **KAPALI** (development için)
   - ✅ Enable email signup: **AÇIK**

2. **Password**
   - Minimum password length: 6
   - Password requirements: (opsiyonel)

3. **Email Templates**
   - Customize email templates (opsiyonel)

---

## Manuel Kullanıcı Oluşturma

Supabase Dashboard > Authentication > Users > Add User:

1. Email ve şifre girin
2. "Auto Confirm User" seçeneğini işaretleyin
3. Kullanıcıyı oluşturun
4. `user_roles` tablosuna rol ekleyin (gerekirse)

---

## Script Kullanımı

### Tüm Şifreleri Sıfırla

```bash
node scripts/fix-all-passwords.cjs
```

### Sadece Admin Şifresini Sıfırla

```bash
node scripts/reset-admin-password.cjs
```

---

## Kontrol Listesi

Giriş yapamıyorsanız:

- [ ] `.env.local` dosyasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` doğru mu?
- [ ] `SUPABASE_SERVICE_ROLE_KEY` var mı? (script için)
- [ ] Şifre `Test1234!` mi? (script ile sıfırlandıysa)
- [ ] Email doğru yazılmış mı?
- [ ] Supabase Dashboard'da kullanıcı var mı?
- [ ] Email confirmation gerekli mi? (Dashboard'dan kontrol edin)

---

## Hala Sorun Varsa

1. Browser console'u açın (F12)
2. Network tab'ında giriş isteğini kontrol edin
3. Hata mesajını not edin
4. Supabase Dashboard > Logs > Auth Logs'u kontrol edin

---

Son güncelleme: 2025-12-28

