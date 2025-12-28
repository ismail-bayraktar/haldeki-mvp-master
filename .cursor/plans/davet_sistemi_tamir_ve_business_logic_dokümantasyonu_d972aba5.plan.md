---
name: Davet Sistemi Tamir ve Business Logic Dokümantasyonu
overview: Davet sistemi sorunlarını temelden çözüp, business logic diagramlarını oluşturarak sistemin doğru çalışmasını sağlayacağız.
todos: []
---

# Davet Sistemi T

amir ve Business Logic Dokümantasyonu

## Sorun Analizi

### Tespit Edilen Sorunlar

1. **İptal Butonu Çalışmıyor**

- `cancelInvite` fonksiyonu DELETE yapıyor ama RLS politikası veya async/await sorunu olabilir
- UI'da onClick handler doğru çalışmıyor olabilir

2. **Onaylanan Bayi/Tedarikçiler Hala Bekleyen Davetlerde Görünüyor**

- `fetchPendingInvites` fonksiyonu `contact_email` ile filtreleme yapıyor
- `pending_invites.email` ile `dealers.contact_email` eşleşmeyebilir
- `used_at IS NULL` kontrolü yeterli değil, çünkü trigger'da güncelleniyor ama filtreleme mantığında sorun var

3. **Davet Oluşturma Hatası**

- Genel hata mesajı gösteriliyor, gerçek hata loglanmıyor
- Muhtemelen RLS politikası veya constraint hatası
- Email uniqueness kontrolü yanlış çalışıyor olabilir

4. **Direkt Kayıt Özelliği Eksik**

- Admin panelden sadece davet gönderilebiliyor
- Direkt kayıt yapma seçeneği yok
- Admin'in kullanıcıyı direkt oluşturup şifre belirleme yetkisi yok

## Çözüm Yaklaşımı

### 1. Business Logic Dokümantasyonu

`docs/business/` klasörüne yeni dosyalar eklenecek:

- `invite-lifecycle.md` - Davet yaşam döngüsü ve state machine
- `invite-filtering-logic.md` - Filtreleme mantığı ve kuralları
- `role-assignment-flow.md` - Rol atama akışı ve kuralları
- `direct-registration-flow.md` - Direkt kayıt akışı ve kuralları
- `admin-dealer-supplier-management.md` - Admin panel iş akışları (davet + direkt kayıt)

### 2. Diagram Oluşturma

`docs/diagrams/` klasörüne diagramlar eklenecek:

- `invite-lifecycle-diagram.md` - Mermaid diagram ile davet durumları
- `role-hierarchy-diagram.md` - Rol hiyerarşisi ve yetkiler (kullanıcının verdiği görselden)
- `data-isolation-diagram.md` - Veri izolasyonu kuralları (kullanıcının verdiği görselden)
- `admin-registration-flow-diagram.md` - Admin panel kayıt akışları (davet vs direkt kayıt)

### 3. Kod Düzeltmeleri

#### 3.1. `fetchPendingInvites` Filtreleme Mantığı Düzeltme

**Sorun**: `contact_email` ile filtreleme yapılıyor ama `pending_invites.email` ile eşleşmeyebilir.**Çözüm**:

- `used_at IS NOT NULL` kontrolü ekle (trigger'da güncelleniyor)
- `auth.users` tablosundan email kontrolü yap (daha güvenilir)
- `dealers.user_id` ve `suppliers.user_id` ile join yaparak kontrol et

**Dosya**: `src/hooks/useDealers.ts` ve `src/hooks/useSuppliers.ts`

```typescript
// Mevcut kod:
const registeredEmails = new Set(
  (dealersData || []).map(d => d.contact_email?.toLowerCase())
);

// Yeni kod:
// 1. used_at kontrolü (trigger'da güncelleniyor)
// 2. auth.users ile join yaparak email kontrolü
// 3. dealers.user_id kontrolü
```



#### 3.2. `cancelInvite` Fonksiyonu Düzeltme

**Sorun**: DELETE işlemi çalışmıyor.**Çözüm**:

- RLS politikası kontrolü
- Error handling iyileştirme
- Toast mesajları düzeltme
- Loading state ekleme

**Dosya**: `src/hooks/useDealers.ts` ve `src/hooks/useSuppliers.ts`

#### 3.3. `createInvite` Hata Yönetimi İyileştirme

**Sorun**: Genel hata mesajı, gerçek hata loglanmıyor.**Çözüm**:

- Detaylı error logging
- Spesifik hata mesajları (RLS, constraint, validation)
- Console.error ile gerçek hatayı göster
- User-friendly hata mesajları

**Dosya**: `src/hooks/useDealers.ts` ve `src/hooks/useSuppliers.ts`

#### 3.4. Direkt Kayıt Özelliği Ekleme

#### 3.5. İlk Girişte Şifre Değiştirme Zorunluluğu

**Yeni Özellik**: Admin panelden direkt kayıt yapabilme seçeneği**Gereksinimler**:

- Admin panelde "Davet Gönder" ve "Direkt Kayıt" seçenekleri (RadioGroup veya Tabs)
- Direkt kayıt formu: Email, Şifre (manuel giriş veya otomatik oluşturma butonu), Tüm bilgiler
- `createDirectDealer` ve `createDirectSupplier` fonksiyonları
- Supabase Auth Admin API ile kullanıcı oluşturma
- Direkt kayıtta `approval_status` her zaman 'approved' (direkt aktif)
- Email gönderimi opsiyonel (varsayılan kapalı, admin checkbox ile seçer)
- İlk girişte şifre değiştirme zorunluluğu (must_change_password flag)
- Geçici şifre gösterimi: Modal + Toast + Liste (göster/gizle butonu)
- Geçici şifre şifrelenmiş olarak saklanır (admin istediğinde tekrar görebilir)

**Akış**:

1. Admin "Direkt Kayıt" seçeneğini seçer
2. Form doldurulur (email, şifre, tüm bilgiler)
3. Admin "Email gönder" checkbox'ını işaretleyebilir (opsiyonel)
4. `createDirectDealer/Supplier` çağrılır:

- Supabase Auth Admin API ile kullanıcı oluşturulur (şifre ile)
- `user_metadata.must_change_password = true` set edilir
- `user_roles` tablosuna rol eklenir
- `dealers/suppliers` tablosuna kayıt eklenir
- `approval_status` = 'approved' (direkt aktif)
- `is_active` = true
- Opsiyonel: Email gönderilirse bilgilendirme emaili (geçici şifre ve ilk giriş talimatları)

5. Kullanıcı giriş yapmaya çalışır:

- Admin belirlediği şifre ile giriş yapar
- Giriş başarılı olur ama `must_change_password` flag'i kontrol edilir
- Şifre değiştirme modalı/sayfası açılır (zorunlu, atlanamaz)
- Kullanıcı yeni şifresini belirler
- Şifre değiştirildikten sonra `must_change_password = false` yapılır
- Normal dashboard'a yönlendirilir

**Dosyalar**:

- `src/hooks/useDealers.ts` - `createDirectDealer` fonksiyonu
- `src/hooks/useSuppliers.ts` - `createDirectSupplier` fonksiyonu
- `src/pages/admin/Dealers.tsx` - UI: RadioGroup/Tabs + Direkt kayıt formu (şifre alanı + otomatik oluştur butonu + email checkbox + şifre göster modalı + liste göster/gizle)
- `src/pages/admin/Suppliers.tsx` - UI: RadioGroup/Tabs + Direkt kayıt formu (şifre alanı + otomatik oluştur butonu + email checkbox + şifre göster modalı + liste göster/gizle)
- `src/components/admin/PasswordDisplayModal.tsx` - Geçici şifre gösterim modalı (yeni)
- `src/components/admin/PasswordGenerator.tsx` - Otomatik şifre oluşturma bileşeni (yeni)
- `src/utils/passwordUtils.ts` - Şifre oluşturma ve şifreleme yardımcı fonksiyonları (yeni)

**Şifre Yönetimi Detayları**:

- Admin direkt kayıt yaparken geçici şifre belirler:
- Manuel olarak girebilir VEYA
- "Otomatik Oluştur" butonuna tıklayarak güçlü, rastgele şifre oluşturabilir
- Geçici şifre şifrelenmiş olarak saklanır (admin panelde gösterilebilir)
- Geçici şifre gösterimi:
- Direkt kayıt sonrası modal (kopyalama butonu ile)
- Başarı toast mesajı (kopyalama butonu ile)
- Admin paneldeki liste (göster/gizle butonu ile)
- Kullanıcı ilk giriş yaparken şifre değiştirmesi zorunludur
- `auth.users.user_metadata.must_change_password = true` flag'i ile kontrol edilir
- Şifre değiştirme modalı/sayfası zorunlu (atlanamaz)
- Şifre değiştirildikten sonra flag temizlenir ve normal akışa döner
- Kullanıcı şifre değiştirmeden çıkış yaparsa, tekrar giriş yaparken yine zorunlu
- Email gönderimi varsayılan olarak kapalı (admin manuel olarak şifreyi iletir)

**Not**:

- Direkt kayıt için `pending_invites` tablosu kullanılmaz, direkt `dealers/suppliers` tablosuna eklenir
- Direkt kayıt yapılan kullanıcılar `approval_status = 'approved'` ile başlar
- Supabase Auth Admin API kullanımı için Edge Function veya service_role_key gerekli (güvenlik için Edge Function önerilir)
- İlk girişte şifre değiştirme zorunluluğu sadece direkt kayıt için geçerlidir (davet akışında kullanıcı zaten kendi şifresini belirliyor)
- Geçici şifre şifrelenmiş olarak saklanır (AES-256 veya benzeri), admin panelde gösterilebilir
- Email gönderimi varsayılan olarak kapalı, admin manuel olarak şifreyi iletir

### 4. Database Kontrolleri

#### 4.1. RLS Politikaları Kontrolü

`pending_invites` tablosu için RLS politikaları:

- SELECT: Admin ve superadmin
- INSERT: Admin ve superadmin
- UPDATE: Admin ve superadmin (used_at güncelleme için)
- DELETE: Admin ve superadmin

**Kontrol**: Migration dosyalarında RLS politikaları doğru mu?

#### 4.2. Trigger Kontrolü

`handle_new_user` trigger'ı:

- `used_at` güncelleniyor mu? (Evet, satır 134-136)
- Email eşleşmesi doğru mu?
- Rollback durumunda `used_at` güncelleniyor mu?

### 5. Test Senaryoları

1. **Davet Oluşturma**

- Admin davet oluşturur → Başarılı
- Aynı email için tekrar davet → Hata mesajı
- Geçersiz email → Validation hatası

2. **Davet İptal**

- Admin davet iptal eder → Başarılı
- İptal edilen davet listeden kalkar
- RLS kontrolü çalışıyor mu?

3. **Davet Kullanımı**

- Kullanıcı kayıt olur → `used_at` güncellenir
- Onaylanan bayi/tedarikçi listeden kalkar
- Filtreleme mantığı çalışıyor mu?

4. **Direkt Kayıt**

- Admin "Direkt Kayıt" seçeneğini seçer → Form değişir (şifre alanı + otomatik oluştur butonu + email checkbox eklenir)
- Admin şifre belirler: Manuel girer VEYA "Otomatik Oluştur" butonuna tıklar
- Admin direkt kayıt yapar → Kullanıcı oluşturulur, şifre belirlenir, şifrelenmiş olarak saklanır, `approval_status = 'approved'`, `must_change_password = true`
- Geçici şifre gösterimi:
- Modal açılır → Şifre gösterilir (kopyalama butonu ile)
- Toast mesajı → Şifre gösterilir (kopyalama butonu ile)
- Liste → "Şifreyi Göster/Gizle" butonu ile gösterilebilir
- Direkt kayıt edilen kullanıcı giriş yapabilir → Başarılı (onay beklemeden)
- Aynı email için direkt kayıt → Hata mesajı (kullanıcı zaten var)
- Direkt kayıt edilen kullanıcı `pending_invites` tablosunda görünmez → Doğru
- Direkt kayıt edilen kullanıcı `dealers/suppliers` tablosunda görünür → Doğru
- Email checkbox varsayılan olarak kapalı → Email gönderilmez (admin manuel iletir)
- Email checkbox işaretliyse → Email gönderilir (geçici şifre ve ilk giriş talimatları)

5. **İlk Girişte Şifre Değiştirme**

- Kullanıcı admin belirlediği şifre ile giriş yapar → Başarılı
- `must_change_password` flag kontrol edilir → `true` ise şifre değiştirme modalı açılır
- Kullanıcı şifre değiştirme modalını atlayamaz → Zorunlu
- Kullanıcı yeni şifresini belirler ve kaydeder → `must_change_password = false` yapılır
- Normal dashboard'a yönlendirilir → Başarılı
- Kullanıcı şifre değiştirmeden çıkış yaparsa → Tekrar giriş yaparken yine zorunlu

## Uygulama Adımları

1. **Business Logic Dokümantasyonu Oluştur**

- `docs/business/invite-lifecycle.md`
- `docs/business/invite-filtering-logic.md`
- `docs/business/role-assignment-flow.md`
- `docs/business/direct-registration-flow.md`
- `docs/business/admin-dealer-supplier-management.md`

2. **Diagramlar Oluştur**

- `docs/diagrams/invite-lifecycle-diagram.md`
- `docs/diagrams/role-hierarchy-diagram.md`
- `docs/diagrams/data-isolation-diagram.md`
- `docs/diagrams/admin-registration-flow-diagram.md`

3. **Kod Düzeltmeleri**

- `fetchPendingInvites` filtreleme mantığı düzelt
- `cancelInvite` fonksiyonu düzelt
- `createInvite` hata yönetimi iyileştir
- `createDirectDealer` fonksiyonu ekle (geçici şifre şifreleme dahil)
- `createDirectSupplier` fonksiyonu ekle (geçici şifre şifreleme dahil)
- `usePasswordChange` hook'u ekle
- `AuthContext`'te `must_change_password` kontrolü ekle
- Şifre değiştirme modalı/sayfası oluştur
- Geçici şifre gösterim modalı oluştur
- Otomatik şifre oluşturma bileşeni ekle
- Şifre şifreleme/çözme yardımcı fonksiyonları ekle
- Liste görünümünde şifre göster/gizle butonu ekle

4. **UI Güncellemeleri**

- Admin panelde "Davet Gönder" / "Direkt Kayıt" seçimi ekle (RadioGroup veya Tabs)
- Direkt kayıt formu oluştur:
- Şifre alanı (manuel giriş)
- "Otomatik Oluştur" butonu (güçlü, rastgele şifre oluşturur)
- Email checkbox (varsayılan kapalı)
- Form validasyonları ekle
- Loading state'leri ekle
- Geçici şifre gösterim modalı oluştur (kopyalama butonu ile)
- Toast mesajında şifre gösterimi (kopyalama butonu ile)
- Liste görünümünde "Şifreyi Göster/Gizle" butonu ekle
- Şifre değiştirme modalı/sayfası oluştur (zorunlu, atlanamaz)
- AuthContext'te `must_change_password` kontrolü ekle
- Route guard ekle (şifre değiştirme zorunluysa dashboard'a erişim engellenir)

5. **Database Kontrolleri**

- RLS politikaları kontrol et
- Trigger kontrolü yap
- Migration dosyalarını gözden geçir
- Direkt kayıt için ekstra RLS politikası gerekli mi? (Hayır, admin zaten yetkili)

6. **Test ve Doğrulama**

- Tüm senaryoları test et (davet + direkt kayıt)
- Hata durumlarını kontrol et
- UI'da doğru çalıştığını doğrula
- Email gönderimi kontrol et

## Dosya Değişiklikleri

### Yeni Dosyalar

- `docs/business/invite-lifecycle.md`
- `docs/business/invite-filtering-logic.md`
- `docs/business/role-assignment-flow.md`
- `docs/business/direct-registration-flow.md`
- `docs/business/admin-dealer-supplier-management.md`
- `docs/business/password-change-flow.md` - İlk girişte şifre değiştirme akışı
- `docs/business/temporary-password-management.md` - Geçici şifre yönetimi ve güvenliği
- `docs/diagrams/invite-lifecycle-diagram.md`
- `docs/diagrams/role-hierarchy-diagram.md`
- `docs/diagrams/data-isolation-diagram.md`
- `docs/diagrams/admin-registration-flow-diagram.md`
- `docs/diagrams/password-change-flow-diagram.md` - Şifre değiştirme akış diyagramı

### Düzenlenecek Dosyalar

- `src/hooks/useDealers.ts` - `fetchPendingInvites`, `cancelInvite`, `createInvite`, `createDirectDealer` (yeni)
- `src/hooks/useSuppliers.ts` - `fetchPendingInvites`, `cancelInvite`, `createInvite`, `createDirectSupplier` (yeni)
- `src/pages/admin/Dealers.tsx` - UI: RadioGroup/Tabs + Direkt kayıt formu (şifre alanı + email checkbox)
- `src/pages/admin/Suppliers.tsx` - UI: RadioGroup/Tabs + Direkt kayıt formu (şifre alanı + email checkbox)
- `src/contexts/AuthContext.tsx` - `must_change_password` kontrolü ve şifre değiştirme modalı entegrasyonu
- `src/components/auth/PasswordChangeModal.tsx` - Şifre değiştirme modalı (yeni)
- `src/components/admin/PasswordDisplayModal.tsx` - Geçici şifre gösterim modalı (yeni)
- `src/components/admin/PasswordGenerator.tsx` - Otomatik şifre oluşturma bileşeni (yeni)
- `src/hooks/usePasswordChange.ts` - Şifre değiştirme hook'u (yeni)
- `src/utils/passwordUtils.ts` - Şifre oluşturma ve şifreleme yardımcı fonksiyonları (yeni)
- `supabase/migrations/` - RLS politikaları kontrolü (gerekirse yeni migration)

### Yeni Type Tanımlamaları

- `CreateDirectDealerData` - Direkt kayıt için form data tipi (şifre + email gönder seçeneği dahil)
- `CreateDirectSupplierData` - Direkt kayıt için form data tipi (şifre + email gönder seçeneği dahil)

**Type Örneği**:

```typescript
export interface CreateDirectDealerData {
  email: string;
  password: string; // Admin belirler
  name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  region_ids: string[];
  tax_number?: string;
  send_email?: boolean; // Opsiyonel email gönderimi
}
```



## Önemli Notlar

1. **Happy Path Değil**: Tüm edge case'ler ve hata durumları ele alınacak
2. **Temel Mantık**: Her işlem için net business logic kuralları tanımlanacak
3. **Dokümantasyon**: Tüm mantık diagramlarla görselleştirilecek
4. **İki Farklı Akış**: Davet ve direkt kayıt akışları birbirinden bağımsız çalışmalı
5. **Admin Yetkisi**: Direkt kayıt için Supabase Auth Admin API kullanılacak (Edge Function önerilir, güvenlik için)
6. **Şifre Yönetimi**: Direkt kayıtta admin geçici şifre belirler, kullanıcı ilk girişte değiştirmesi zorunludur
7. **Email Gönderimi**: Direkt kayıtta email gönderimi opsiyonel (varsayılan kapalı, admin checkbox ile seçer)
8. **İlk Giriş Şifre Değiştirme**: `must_change_password` flag ile kontrol edilir, zorunlu ve atlanamaz
9. **Güvenlik**: Service role key frontend'de kullanılmamalı, Edge Function veya backend API kullanılmalı
10. **Şifre Değiştirme Zorunluluğu**: Sadece direkt kayıt için geçerlidir (davet akışında kullanıcı zaten kendi şifresini belirliyor)
11. **Geçici Şifre Yönetimi**: 

    - Admin şifreyi manuel girebilir veya otomatik oluşturabilir
    - Geçici şifre şifrelenmiş olarak saklanır (AES-256 veya benzeri)
    - Admin şifreyi üç yerde görebilir: Modal, Toast, Liste (göster/gizle butonu)