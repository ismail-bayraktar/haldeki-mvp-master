# 03. Mimari

> Teknik mimari ve tasarım kararları

---

## Bu Klasör

Sistemin teknik detayları: veritabanı, API, güvenlik, veri akışları.

---

## İçindekiler

| Dosya | Konu | Detay Seviyesi |
|-------|------|----------------|
| [genel-bakis.md](./genel-bakis.md) | Sistemin genel mimarisi | Yüksek seviye |
| [veritabani-semasi.md](./veritabani-semasi.md) | Tüm tablolar ve ilişkiler | Detaylı |
| [api-referans.md](./api-referans.md) | API endpoint'leri | Detaylı |
| [guvenlik-modeli.md](./guvenlik-modeli.md) | RLS ve RBAC | Detaylı |
| [veri-akislari.md](./veri-akislari.md) | Veri akış diyagramları | Orta |

---

## Mimari Özet

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React 18 + TypeScript + Tailwind + shadcn/ui              │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Postgres   │  │    Auth     │  │   Storage   │         │
│  │  + RLS      │  │   + JWT     │  │  + Images   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │   Brevo     │  │  Vercel     │                          │
│  │   (Email)   │  │  (Hosting)  │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## İlgili Dokümanlar

- [İş Mantığı - Tüm Akışlar](../04-is-mantigi/)
- [Faz 1: Temel Altyapı](../05-fazlar/phase-1-temel-altyapi.md)
- [Database Optimization](../11-teknik/database-optimization.md)

---

**Son güncelleme:** 2026-01-10
