# Mimari Genel Bakış

> Sistem mimarisi ve bileşenleri

---

**İçindekiler**
- [Sistem Mimaris](#sistem-mimaris)
- [Katmanlar](#katmanlar)
- [Veri Akışı](#veri-akışı)
- [Güvenlik](#güvenlik)
- [Skalabilite](#skalabilite)

---

## Sistem Mimaris

### Yüksek Seviye Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  React 18 App                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │ Pages   │  │Components│ │ Hooks   │  │ Utils   ││   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE LAYER                         │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  Postgres     │  │    Auth       │  │   Storage     │  │
│  │  + RLS        │  │   + JWT       │  │  + Images     │  │
│  │               │  │               │  │               │  │
│  │  - Tables     │  │  - Users      │  │  - Buckets    │  │
│  │  - Views      │  │  - Sessions   │  │  - Files      │  │
│  │  - Functions  │  │  - MFA        │  │  - CDN        │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │    Brevo      │  │    Vercel     │  │   Custom      │  │
│  │   (Email)     │  │   (Hosting)   │  │  (Webhooks)   │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Katmanlar

### 1. Presentation Layer (Frontend)

**Teknolojiler:**
- React 18.3 - UI framework
- TypeScript 5.6 - Tip güvenliği
- Vite 6.0 - Build tool
- Tailwind CSS 4.0 - Styling
- shadcn/ui - UI components

**Sorumluluklar:**
- UI rendering
- Kullanıcı etkileşimi
- Form validasyonu
- State management (local)

### 2. Data Layer (Supabase)

**Bileşenler:**
- PostgreSQL - Veritabanı
- Row Level Security (RLS) - Veri güvenliği
- Auth - Kullanıcı kimlik doğrulama
- Storage - Dosya depolama

**Sorumluluklar:**
- Veri persistence
- Sorgu optimizasyonu
- Transaction yönetimi
- Caching

### 3. Integration Layer

**Servisler:**
- Brevo - Email gönderimi
- Vercel - Hosting ve deployment
- Custom webhooks - Dış entegrasyonlar

---

## Veri Akışı

### 1. Auth Akışı

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │ ───→ │ Supabase │ ───→ │ Database │
│          │ ←─── │   Auth   │ ←─── │          │
└──────────┘      └──────────┘      └──────────┘
     ↓                                   ↓
   JWT Token                         User Profile
   Local Storage                      Role Data
```

### 2. Veri Sorgusu Akışı

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  React   │ ───→ │ Supabase │ ───→ │ Postgres │
│ Component│      │  Client  │      │   Query  │
└──────────┘      └──────────┘      └──────────┘
     ↓                                   ↓
   Data                              RLS Check
   Display                           Permission
```

### 3. Sipariş Akışı

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│ Customer │ ───→ │  Cart    │ ───→ │  Order   │
│          │      │          │      │          │
└──────────┘      └──────────┘      └──────────┘
                     ↓                   ↓
                Products            Email
                Inventory           Brevo
```

---

## Güvenlik

### Authentication vs Authorization

```
Authentication (Kimlik?)
├── Email + Şifre
├── OAuth (Google, etc.)
└── Magic Link

Authorization (Yetki?)
├── RLS Policies (Database seviyesi)
├── Role-Based Access Control
└── UI Permission Checks
```

### Güvenlik Katmanları

```
┌─────────────────────────────────────────────────────────┐
│              LAYER 1: CLIENT SIDE                       │
│  - Input validation                                     │
│  - XSS protection                                       │
│  - CSRF tokens                                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              LAYER 2: AUTHENTICATION                    │
│  - JWT tokens                                           │
│  - Session management                                   │
│  - MFA (opsiyonel)                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              LAYER 3: AUTHORIZATION (RLS)               │
│  - Row Level Security                                   │
│  - Role-based policies                                  │
│  - Data isolation                                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              LAYER 4: NETWORK                           │
│  - HTTPS/TLS                                            │
│  - API rate limiting                                    │
│  - DDoS protection                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Skalabilite

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                        │
└─────────────────────────────────────────────────────────┘
           ↓                ↓                ↓
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ Instance│     │ Instance│     │ Instance│
    │    1    │     │    2    │     │    3    │
    └──────────┘     └──────────┘     └──────────┘
           ↓                ↓                ↓
    ┌─────────────────────────────────────────────────┐
    │           SUPABASE (Auto-scaling)               │
    └─────────────────────────────────────────────────┘
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    CACHE LAYERS                         │
│                                                         │
│  1. Browser Cache (Static assets)                       │
│  2. CDN Cache (Vercel Edge Network)                     │
│  3. Query Cache (TanStack Query)                        │
│  4. Database Cache (Supabase)                           │
└─────────────────────────────────────────────────────────┘
```

---

## İlgili Dokümanlar

- [Veritabanı Şeması](./veritabani-semasi.md) - Detaylı tablo yapısı
- [Güvenlik Modeli](./guvenlik-modeli.md) - RLS ve RBAC
- [Veri Akışları](./veri-akislari.md) - Detaylı akış diyagramları

---

**Son güncelleme:** 2026-01-10
**Okuma süresi:** 8 dakika
