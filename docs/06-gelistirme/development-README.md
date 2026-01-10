# Development Setup Guide

Hızlı başlangıç için test hesapları kurulum talimatları.

## Hızlı Kurulum (3 Adım)

### 1️⃣ Database Migration

```bash
supabase db push
```

### 2️⃣ Test Kullanıcılarını Oluştur

```bash
npm run test-users:create
```

**Alternatif (Manuel):** Supabase Dashboard → Authentication → Users → "Add user"

### 3️⃣ Uygulamayı Başlat

```bash
npm run dev
```

Sağ altta **RoleSwitcher** card'ı görünecektir.

## Test Hesapları

| Rol | Email | Şifre | Panel |
|-----|-------|-------|-------|
| 👮 Admin | `admin-test@haldeki.local` | `DevTest1234!` | `/admin` |
| 🚚 Bayi | `dealer-test@haldeki.local` | `DevTest1234!` | `/bayi` |
| 📦 Tedarikçi | `supplier-test@haldeki.local` | `DevTest1234!` | `/tedarikci` |
| 🏢 İşletme | `business-test@haldeki.local` | `DevTest1234!` | `/isletme` |

## Detaylı Dokümantasyon

Tüm bilgilere [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) dosyasından ulaşabilirsin.

## Sorun Giderme

**"supabase: command not found"**
```bash
npm install -g supabase
```

**"Test hesabı bulunamadı"**
```bash
# Supabase Dashboard'dan manuel ekle veya
npm run test-users:create
```

**RoleSwitcher görünmüyor**
```bash
# Development mode'da olduğundan emin ol
npm run dev
```

---

**Not:** Test hesapları sadece development içindir. Production'a çıkmaz.
