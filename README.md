# Haldeki.com
> Türkiye'nin taze sebze & meyve online pazaryeri

[![Vercel](https://img.shields.io/badge/deployed%20on-vercel-black)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=white)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

## 🏪 Hakkımızda

**Haldeki.com**, çiftçiden tüketiciye taze sebze ve meyveleri en hızlı şekilde ulaştıran modern bir B2B/B2C pazaryeri platformudur.

### Öne Çıkan Özellikler

- ✅ **Taze Ürünler:** Bölgenin en taze sebze ve meyveleri
- 🚚 **Hızlı Teslimat:** Aynı gün teslimat seçeneği
- 💼 **B2B/B2C:** Hem perakende hem toptan alışveriş
- 🏙️ **Bölgesel:** İzmir ve çevresine odaklı hizmet
- 🔒 **Güvenli Ödeme:** Güvenli ödeme altyapısı

## 🛠️ Teknoloji

### Frontend
- **React 18** + **TypeScript** - Type-safe component development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality React components
- **React Router** - Client-side routing
- **TanStack Query** - Data management

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication
- **Edge Functions** - Serverless compute

### Infrastructure
- **Vercel** - Frontend hosting & CDN
- **Supabase Cloud** - Database & auth hosting

## 📱 Platform Özellikleri

### Müşteriler İçin
- Ürün katalogu tarama ve filtreleme
- Sepet yönetimi
- Sipariş takibi
- Beyaz liste sistemi ile erişim

### Tedarikçiler İçin
- Ürün yönetimi
- Stok takibi
- Fiyatlandırma
- Sipariş yönetimi

### Bayiler İçin
- Bölgesel ürün ataması
- Müşteri yönetimi
- Teslimat planlama

### Depo Yönetimi
- Sipariş toplama listeleri
- Stok girişi/çıkışı
- Zaman penceresi yönetimi

## 🚀 Local Development

### Prerequisites

- Node.js 22.x
- npm or yarn
- Git (with SSH key authentication)

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# See docs/CREDENTIALS.md for detailed setup instructions

# Start development server
npm run dev
```

### Environment Variables

This project requires environment variables for Supabase and optional services:

```bash
# Required
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (Stripe for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**IMPORTANT**: Never commit `.env.local` or any files with real credentials. See [docs/SECURITY.md](docs/SECURITY.md) for details.

### Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Production build
npm run build:dev        # Development build

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:all         # Run all tests

# Quality
npm run lint             # Lint code
npm run typecheck        # Type check
```

## 🔐 Security

This project follows security best practices:

- ✅ Environment variables for all credentials
- ✅ `.gitignore` prevents credential commits
- ✅ Row Level Security (RLS) in database
- ✅ No hardcoded secrets in code
- ✅ Security headers implemented

For detailed security information, see:
- [docs/SECURITY.md](docs/SECURITY.md) - Security policy and guidelines
- [docs/CREDENTIALS.md](docs/CREDENTIALS.md) - How to set up credentials safely

## 📄 Lisans

```
Copyright © 2025 Haldeki.com. Tüm hakları saklıdır.

Bu yazılım ve görsel materyaller Haldeki.com'a aittir.
İzinsiz kopyalanması, dağıtılması veya kullanımı yasaktır.
```

## 📞 İletişim

- **Web:** [https://haldeki.com](https://haldeki.com)
- **E-posta:** info@haldeki.com
- **Adres:** İzmir, Türkiye

---

*Built with ❤️ for Turkish farmers*
