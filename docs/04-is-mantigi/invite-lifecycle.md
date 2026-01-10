# Davet Yaşam Döngüsü

## Genel Bakış

Davet sistemi, admin'in bayi ve tedarikçi kayıtlarını yönetmesi için kullanılan bir mekanizmadır. İki farklı akış vardır:
1. **Davet Akışı**: Admin davet gönderir, kullanıcı kayıt olur, admin onaylar
2. **Direkt Kayıt Akışı**: Admin direkt kullanıcı oluşturur, kullanıcı ilk girişte şifre değiştirir

## Davet Akışı (Invite Flow)

### 1. Davet Oluşturma
- Admin `pending_invites` tablosuna yeni bir kayıt ekler
- `role`: 'dealer' veya 'supplier'
- `email`: Davet gönderilecek email adresi
- `dealer_data` veya `supplier_data`: JSONB formatında bilgiler
- `expires_at`: 7 gün sonra (varsayılan)
- `used_at`: NULL (henüz kullanılmadı)
- `invited_by`: Admin kullanıcı ID'si

### 2. Email Gönderimi
- Edge Function ile email gönderilir
- Email içinde özel kayıt linki bulunur: `/bayi-kayit?token={invite_id}` veya `/tedarikci-kayit?token={invite_id}`
- Token ile kayıt sayfasına yönlendirilir

### 3. Kullanıcı Kaydı
- Kullanıcı token ile kayıt sayfasına gelir
- Token doğrulanır (`pending_invites` tablosundan kontrol edilir)
- Kullanıcı formu doldurur ve kayıt olur
- `handle_new_user` trigger'ı çalışır:
  - `pending_invites.used_at` güncellenir
  - `user_roles` tablosuna rol eklenir
  - `dealers` veya `suppliers` tablosuna kayıt eklenir
  - `approval_status`: 'pending' (onay bekliyor)

### 4. Onay Süreci
- Admin panelden "Onay Bekleyen Başvurular" listesinde görünür
- Admin onaylar veya reddeder
- Onay durumu güncellenir: `approval_status` → 'approved' veya 'rejected'
- Email bildirimi gönderilir

### 5. Davet İptali
- Admin bekleyen daveti iptal edebilir
- `pending_invites` tablosundan kayıt silinir
- Email gönderilmez

## Direkt Kayıt Akışı (Direct Registration Flow)

### 1. Direkt Kayıt Oluşturma
- Admin "Direkt Kayıt" sekmesini seçer
- Form doldurulur (email, şifre, tüm bilgiler)
- Admin geçici şifre belirler (manuel veya otomatik)
- Email gönderimi opsiyonel (varsayılan kapalı)

### 2. Kullanıcı Oluşturma
- Edge Function (`create-user`) çağrılır
- Supabase Auth Admin API ile kullanıcı oluşturulur
- `user_metadata.must_change_password = true` set edilir
- `user_roles` tablosuna rol eklenir
- `dealers` veya `suppliers` tablosuna kayıt eklenir
- `approval_status`: 'approved' (direkt aktif)
- `is_active`: true

### 3. Geçici Şifre Gösterimi
- Modal açılır (kopyalama butonu ile)
- Toast mesajı gösterilir
- Admin şifreyi manuel olarak kullanıcıya iletir

### 4. İlk Giriş
- Kullanıcı geçici şifre ile giriş yapar
- `must_change_password` flag kontrol edilir
- Şifre değiştirme modalı açılır (zorunlu, atlanamaz)
- Kullanıcı yeni şifresini belirler
- `must_change_password = false` yapılır
- Normal dashboard'a yönlendirilir

## State Machine

```
Davet Akışı:
[pending_invite] → [user_signup] → [pending_approval] → [approved/rejected]

Direkt Kayıt:
[direct_create] → [approved] → [first_login] → [password_changed] → [active]
```

## Önemli Notlar

1. **Davet Akışı**: `pending_invites` tablosu kullanılır, `used_at` ile takip edilir
2. **Direkt Kayıt**: `pending_invites` tablosu kullanılmaz, direkt `dealers/suppliers` tablosuna eklenir
3. **Onay Durumu**: Davet akışında 'pending', direkt kayıtta 'approved'
4. **Şifre Değiştirme**: Sadece direkt kayıt için zorunludur
5. **Email Gönderimi**: Davet akışında otomatik, direkt kayıtta opsiyonel

