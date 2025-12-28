# Şifre Değiştirme Akışı

## Genel Bakış

Direkt kayıt edilen kullanıcıların ilk girişlerinde şifrelerini değiştirmeleri zorunludur. Bu akış `must_change_password` flag'i ile kontrol edilir.

## Akış Adımları

### 1. Kullanıcı Girişi

**Giriş İşlemi:**
- Kullanıcı geçici şifre ile giriş yapar
- `supabase.auth.signInWithPassword()` çağrılır
- Giriş başarılı olur

### 2. Flag Kontrolü

**AuthContext İçinde:**
- `onAuthStateChange` event'i tetiklenir
- `session.user` kontrol edilir
- `user.user_metadata.must_change_password` kontrol edilir
- `true` ise `mustChangePassword` state'i `true` yapılır

### 3. Modal Açılması

**PasswordChangeModal:**
- `mustChangePassword === true` ise modal açılır
- Modal zorunludur, atlanamaz:
  - `onInteractOutside={(e) => e.preventDefault()}` ile engellenir
  - Modal kapatma butonu yok
  - Sadece şifre değiştirme ile kapanır

### 4. Şifre Değiştirme Formu

**Form Alanları:**
- Yeni Şifre (göster/gizle butonu ile)
- Şifre Tekrar (göster/gizle butonu ile)
- Validasyon:
  - En az 6 karakter
  - Şifreler eşleşmeli
- Hata mesajları gösterilir

### 5. Şifre Güncelleme

**usePasswordChange Hook:**
- `changePassword(newPassword)` fonksiyonu çağrılır
- `supabase.auth.updateUser({ password: newPassword })` çağrılır
- Başarılı olursa:
  - `user_metadata.must_change_password = false` yapılır
  - `supabase.auth.updateUser({ data: { ...user_metadata, must_change_password: false } })`
- Toast mesajı gösterilir: "Şifre başarıyla değiştirildi"

### 6. Modal Kapanması

**onSuccess Callback:**
- `handlePasswordChangeSuccess()` çağrılır
- `mustChangePassword` state'i `false` yapılır
- Modal kapanır
- Normal dashboard'a yönlendirilir

## Kod Yapısı

### AuthContext.tsx

```typescript
const [mustChangePassword, setMustChangePassword] = useState(false);

const checkMustChangePassword = (user: User) => {
  const mustChange = user.user_metadata?.must_change_password === true;
  setMustChangePassword(mustChange);
};

useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      checkMustChangePassword(session.user);
    }
  });
}, []);

// Modal render
{mustChangePassword && user && (
  <PasswordChangeModal
    open={mustChangePassword}
    onSuccess={handlePasswordChangeSuccess}
  />
)}
```

### PasswordChangeModal.tsx

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Validasyon
  // Şifre değiştirme
  const result = await changePassword(password);
  if (result.success) {
    onSuccess(); // Modal kapanır
  }
};
```

### usePasswordChange.ts

```typescript
const changePassword = async (newPassword: string) => {
  // Validasyon
  // Şifre güncelleme
  await supabase.auth.updateUser({ password: newPassword });
  // Metadata güncelleme
  await supabase.auth.updateUser({
    data: { ...user.user_metadata, must_change_password: false }
  });
};
```

## Edge Cases

1. **Kullanıcı şifre değiştirmeden çıkış yapar:**
   - `must_change_password` flag'i hala `true`
   - Tekrar giriş yaparken yine modal açılır
   - Şifre değiştirme zorunlu

2. **Şifre değiştirme başarısız:**
   - Hata mesajı gösterilir
   - Modal kapanmaz
   - Kullanıcı tekrar deneyebilir

3. **Metadata güncelleme başarısız:**
   - Şifre değişir ama flag temizlenmez
   - Sonraki girişte yine modal açılır
   - Kullanıcı tekrar şifre değiştirebilir (idempotent)

4. **Çoklu cihaz:**
   - Her cihazda ayrı session
   - Bir cihazda şifre değiştirilirse, diğer cihazlarda logout olur
   - Tekrar giriş yaparken yeni şifre ile giriş yapılır

## Güvenlik Notları

1. **Flag Kontrolü:**
   - `user_metadata` içinde saklanır
   - Client-side kontrol edilir (güvenlik için backend kontrolü de eklenebilir)

2. **Modal Zorunluluğu:**
   - Modal atlanamaz
   - Kullanıcı şifre değiştirmeden dashboard'a erişemez

3. **Şifre Validasyonu:**
   - Minimum 6 karakter
   - Frontend ve backend validasyonu (backend için Edge Function eklenebilir)

## Test Senaryoları

1. ✅ Direkt kayıt → Giriş → Modal açılır
2. ✅ Şifre değiştir → Modal kapanır → Dashboard'a yönlendirilir
3. ✅ Şifre değiştirmeden çıkış → Tekrar giriş → Modal tekrar açılır
4. ✅ Şifre değiştirme başarısız → Hata mesajı → Modal kapanmaz
5. ✅ Geçersiz şifre → Validasyon hatası → Form gönderilmez

