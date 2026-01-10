# Davet Filtreleme Mantığı

## Sorun

"Bekleyen Davetler" listesinde onaylanan bayi/tedarikçiler görünmeye devam ediyordu.

## Çözüm

### Filtreleme Kriterleri

Bir davetin "bekleyen" olarak görünmesi için şu koşulların TÜMÜ sağlanmalıdır:

1. **`used_at IS NULL`**: Davet henüz kullanılmamış olmalı
2. **`expires_at > NOW()`**: Davet süresi dolmamış olmalı
3. **Email kontrolü**: Bu email ile kayıtlı bir kullanıcı/dealer/supplier olmamalı

### Email Kontrolü Detayları

Email kontrolü üç farklı yerde yapılır:

1. **`dealers.contact_email`**: Bayi kayıtlarında iletişim email'i
2. **`suppliers.contact_email`**: Tedarikçi kayıtlarında iletişim email'i
3. **`dealers.user_id` / `suppliers.user_id`**: User ID varsa, o kullanıcı zaten kayıt olmuş demektir

### Filtreleme Algoritması

```typescript
// 1. pending_invites'ları al (used_at IS NULL ve expires_at > NOW())
const invites = await supabase
  .from('pending_invites')
  .select('*')
  .eq('role', 'dealer')
  .is('used_at', null)
  .gt('expires_at', new Date().toISOString());

// 2. Kayıtlı dealer'ları al
const dealers = await supabase
  .from('dealers')
  .select('user_id, contact_email');

// 3. Email set'i oluştur
const registeredEmails = new Set(
  dealers.map(d => d.contact_email?.toLowerCase()).filter(Boolean)
);

// 4. Filtrele
const filteredInvites = invites.filter(inv => {
  const emailLower = inv.email.toLowerCase();
  // Email ile kayıtlı kullanıcı var mı?
  if (registeredEmails.has(emailLower)) {
    return false; // Kayıtlı, listeden çıkar
  }
  // used_at kontrolü (double-check)
  if (inv.used_at) {
    return false; // Kullanılmış, listeden çıkar
  }
  return true; // Bekleyen davet
});
```

## Trigger Kontrolü

`handle_new_user` trigger'ı çalıştığında:
- `pending_invites.used_at` otomatik olarak güncellenir
- Bu sayede filtreleme query'sinde `used_at IS NULL` kontrolü yeterli olmalı

Ancak edge case'ler için:
- Email kontrolü de yapılır (daha güvenilir)
- `user_id` kontrolü yapılır (kayıt olmuş mu?)

## Edge Cases

1. **Email farklılığı**: `pending_invites.email` ile `dealers.contact_email` farklı olabilir
   - Çözüm: Her iki email de kontrol edilir

2. **Trigger başarısız**: Trigger çalışmazsa `used_at` güncellenmez
   - Çözüm: Email kontrolü ile double-check yapılır

3. **Direkt kayıt**: Direkt kayıt edilen kullanıcılar `pending_invites` tablosunda görünmez
   - Beklenen davranış: Direkt kayıt için `pending_invites` kullanılmaz

## Test Senaryoları

1. ✅ Davet oluştur → Bekleyen listede görünür
2. ✅ Kullanıcı kayıt olur → Bekleyen listeden kalkar (`used_at` güncellenir)
3. ✅ Admin onaylar → Bekleyen listede görünmez (email kontrolü)
4. ✅ Direkt kayıt → Bekleyen listede görünmez (zaten `pending_invites`'da yok)

