# Kurulum Rehberi

> Local development ortamı kurulumu

---

**İçindekiler**
- [Gereksinimler](#gereksinimler)
- [Adım 1: Repo Klonlama](#adım-1-repo-klonlama)
- [Adım 2: Bağımlılıklar](#adım-2-bağımlılıklar)
- [Adım 3: Supabase](#adım-3-supabase)
- [Adım 4: Environment](#adım-4-environment)
- [Adım 5: Çalıştırma](#adım-5-çalıştırma)
- [Sorun Giderme](#sorun-giderme)

---

## Gereksinimler

| Araç | Minimum Versiyon | Kurulum |
|------|------------------|---------|
| Node.js | 18.x | [nodejs.org](https://nodejs.org) |
| npm | 9.x | Node.js ile birlikte gelir |
| Git | 2.x | [git-scm.com](https://git-scm.com) |
| VS Code | - | [code.visualstudio.com](https://code.visualstudio.com) |

---

## Adım 1: Repo Klonlama

```bash
# Repo'yu klonla
git clone <repo-url>
cd haldeki-market

# Branch'leri kontrol et
git branch -a
```

---

## Adım 2: Bağımlılıklar

```bash
# npm install
npm install

# Kurulum başarılı mı kontrol et
npm --version
node --version
```

---

## Adım 3: Supabase

### Supabase CLI

```bash
# Supabase CLI yükle (yoksa)
npm install -g supabase

# Versiyonu kontrol et
supabase --version
```

### Supabase Projesi

1. [supabase.com](https://supabase.com)'a git
2. Yeni proje oluştur
3. Project Settings → API
4. URL ve Anon Key'i kopyala

---

## Adım 4: Environment

### .env Dosyası Oluştur

```bash
# .env.example dosyasını kopyala
cp .env.example .env
```

### .env İçeriği

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Brevo Email (opsiyonel)
VITE_BREVO_API_KEY=xkeysib-...
```

---

## Adım 5: Çalıştırma

### Development Server

```bash
# Server'ı başlat
npm run dev

# Tarayıcıda aç
http://localhost:5173
```

### Browser Kontrol

```
✅ Haldeki anasayfa yüklenmeli
✅ Console'da hata olmamalı
✅ Network tab'de failed request olmamalı
```

---

## Temel Komutlar

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:e2e     # Run E2E tests

# Linting
npm run lint         # Lint code
npm run type-check   # TypeScript check
```

---

## VS Code Eklentileri

| Eklenti | Amaç |
|---------|------|
| ESLint | Kod kalitesi |
| Prettier | Formatlama |
| Tailwind CSS IntelliSense | CSS yardımı |
| TypeScript Vue Plugin (Volar) | TS desteği |

---

## Sorun Giderme

### Port 5173 Kullanımda

```bash
# Farklı port kullan
npm run dev -- --port 3000
```

### Supabase Connection Hatası

```
Çözüm:
1. Supabase projesinin aktif olduğunu kontrol et
2. URL ve API key'in doğru olduğunu kontrol et
3. .env dosyasının kaydedildiğinden emin ol
```

### Bağımlılık Hatası

```bash
# node_modules sil ve tekrar yükle
rm -rf node_modules package-lock.json
npm install
```

---

## Sonraki Adımlar

1. [Test Hesaplar](./test-hesaplar.md) - Test kullanıcıları ile giriş
2. [Mimari Genel Bakış](../03-mimari/genel-bakis.md) - Sistemi anlama
3. [Kod Standartları](../06-gelistirme/kod-standartlari.md) - Geliştirmeye başla

---

**Son güncelleme:** 2026-01-10
**Tahmini süre:** 10 dakika
