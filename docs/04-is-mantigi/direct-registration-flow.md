# Direkt Kayıt Akışı

## Genel Bakış

Direkt kayıt, admin'in bayi veya tedarikçiyi davet göndermeden direkt olarak sisteme eklemesini sağlar. Bu akışta kullanıcı onay beklemeden aktif olur, ancak ilk girişte şifre değiştirmesi zorunludur.

## Akış Adımları

### 1. Admin Panelden Direkt Kayıt

**UI:**
- Admin "Bayi Ekle" veya "Tedarikçi Ekle" butonuna tıklar
- Dialog açılır, "Direkt Kayıt" sekmesi seçilir
- Form doldurulur:
  - Email (zorunlu)
  - Firma Adı (zorunlu)
  - Geçici Şifre (zorunlu, min 6 karakter)
    - Manuel girilebilir VEYA
    - "Otomatik Oluştur" butonu ile güçlü şifre oluşturulur
  - Yetkili Adı (opsiyonel)
  - Telefon (opsiyonel)
  - Vergi Numarası (bayi için, opsiyonel)
  - Servis Bölgeleri (bayi için, opsiyonel)
  - Email gönder (checkbox, varsayılan kapalı)

### 2. Edge Function Çağrısı

**Fonksiyon:** `create-user` Edge Function

**İşlemler:**
1. Admin yetkisi kontrol edilir (RLS)
2. Email kontrolü yapılır (zaten kayıtlı mı?)
3. Supabase Auth Admin API ile kullanıcı oluşturulur:
   - Email
   - Geçici şifre
   - `email_confirm: true` (email doğrulaması gerekmez)
   - `user_metadata.must_change_password: true` (ilk girişte şifre değiştirme zorunlu)
4. `user_roles` tablosuna rol eklenir ('dealer' veya 'supplier')
5. `dealers` veya `suppliers` tablosuna kayıt eklenir:
   - `approval_status: 'approved'` (direkt aktif)
   - `is_active: true`
   - Tüm form bilgileri kaydedilir

### 3. Geçici Şifre Gösterimi

**Modal Açılır:**
- Email
- Geçici Şifre (kopyalama butonu ile)
- Uyarı: "Kullanıcı ilk giriş yaptığında şifresini değiştirmesi zorunludur"
- "Tümünü Kopyala" butonu
- "Tamam" butonu

**Toast Mesajı:**
- Başarı mesajı gösterilir
- Şifre kopyalama butonu (opsiyonel)

### 4. Email Gönderimi (Opsiyonel)

Eğer admin "Email gönder" checkbox'ını işaretlediyse:
- Edge Function içinde email gönderilir (henüz implement edilmedi)
- Email içeriği:
  - Geçici şifre
  - İlk giriş talimatları
  - Şifre değiştirme zorunluluğu bilgisi

### 5. İlk Giriş ve Şifre Değiştirme

**Giriş:**
- Kullanıcı geçici şifre ile giriş yapar
- Giriş başarılı olur

**Şifre Değiştirme Modalı:**
- `AuthContext` içinde `must_change_password` kontrol edilir
- `true` ise modal açılır (zorunlu, atlanamaz)
- Modal içeriği:
  - "Şifre Değiştirme Zorunlu" başlığı
  - Açıklama: "İlk girişinizde şifrenizi değiştirmeniz gerekmektedir"
  - Yeni şifre alanı (göster/gizle butonu ile)
  - Şifre tekrar alanı (göster/gizle butonu ile)
  - Validasyon: En az 6 karakter, şifreler eşleşmeli
  - "Şifreyi Değiştir" butonu

**Şifre Değiştirme İşlemi:**
- `usePasswordChange` hook'u kullanılır
- `supabase.auth.updateUser({ password: newPassword })` çağrılır
- `user_metadata.must_change_password = false` yapılır
- Modal kapanır
- Normal dashboard'a yönlendirilir

### 6. Sonraki Girişler

- Kullanıcı yeni şifresi ile giriş yapar
- `must_change_password = false` olduğu için modal açılmaz
- Normal akış devam eder

## Şifre Görme Özelliği

### Admin Panelden Şifre Görüntüleme

**UI:**
- Tabloda "Şifre Gör" butonu sadece direkt kayıt yapılanlar için görünür
- Buton tıklandığında `PasswordDisplayModal` açılır
- Şifre kopyalama butonu ile kolayca kopyalanabilir

**Kod:**
```typescript
{supplier.user_id && getTemporaryPassword(supplier.user_id) && (
  <Button onClick={() => {
    const password = getTemporaryPassword(supplier.user_id!);
    if (password) {
      setTempPassword(password);
      setTempEmail(supplier.contact_email || supplier.email || '');
      setTempUserName(supplier.name);
      setPasswordModalOpen(true);
    }
  }}>
    <Key className="h-4 w-4 mr-1" />
    Şifre Gör
  </Button>
)}
```

**Güvenlik:**
- Şifreler sadece admin panelinde görüntülenebilir
- localStorage'da şifrelenmiş olarak saklanır
- Şifre görüntüleme için kullanıcı ID kontrolü yapılır

## Güvenlik Notları

1. **Geçici Şifre Yönetimi:**
   - Şifre şifrelenmiş olarak localStorage'da saklanır
   - Admin şifreyi görebilir (manuel iletişim için)
   - Email gönderimi varsayılan kapalı (güvenlik için)
   - Şifre görme özelliği sadece direkt kayıt yapılanlar için mevcuttur

2. **İlk Giriş Zorunluluğu:**
   - `must_change_password` flag'i ile kontrol edilir
   - Modal atlanamaz (onInteractOutside engellenir)
   - Şifre değiştirmeden çıkış yapılırsa, tekrar girişte yine zorunlu

3. **Admin Yetkisi:**
   - Direkt kayıt için Edge Function kullanılır (service_role_key gerekli)
   - Frontend'de service_role_key kullanılmaz (güvenlik)
   - Admin yetkisi kontrol edilir (RLS)

## Veri Akışı

```
Admin Form → Edge Function → Supabase Auth → user_roles → dealers/suppliers
                                                              ↓
                                                      approval_status: 'approved'
                                                              ↓
                                                      Kullanıcı Giriş Yapar
                                                              ↓
                                                      must_change_password: true
                                                              ↓
                                                      Şifre Değiştirme Modalı
                                                              ↓
                                                      must_change_password: false
                                                              ↓
                                                      Normal Dashboard
```

## Edge Cases

1. **Email zaten kayıtlı:**
   - Kontrol edilir, hata mesajı gösterilir
   - Direkt kayıt yapılamaz

2. **Edge Function hatası:**
   - Detaylı hata mesajı gösterilir
   - Kullanıcı oluşturulamaz

3. **Şifre değiştirme başarısız:**
   - Hata mesajı gösterilir
   - Modal kapanmaz, tekrar deneme yapılabilir

4. **Kullanıcı şifre değiştirmeden çıkış yapar:**
   - Tekrar giriş yaparken yine zorunlu
   - `must_change_password` flag'i temizlenene kadar devam eder

