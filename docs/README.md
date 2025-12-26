# Haldeki.com Dokümantasyonu

> Bu klasör, Haldeki projesinin teknik ve iş dokümantasyonunu içerir.

## 📚 Dokümantasyon Haritası

```
docs/
├── README.md                    # Bu dosya - Giriş noktası
├── haldeki_master_plan.md       # Ana yol haritası ve faz takibi
├── architecture.md              # Sistem mimarisi
├── prd.md                       # Product Requirements Document
└── phases/                      # Faz bazlı detaylı dökümanlar
    ├── phase-2a1-regioncontext.md
    ├── phase-2a2-region-products.md
    ├── phase-2a3-cart-region.md
    ├── phase-2a4-delivery-slots.md
    ├── phase-3-rbac.md
    └── phase-4-email.md
```

## 🚀 Hızlı Başlangıç

1. **Proje Vizyonu**: [haldeki_master_plan.md](./haldeki_master_plan.md)
2. **Teknik Mimari**: [architecture.md](./architecture.md)
3. **Ürün Gereksinimleri**: [prd.md](./prd.md)

## 📋 Faz Durumları

| Faz | Durum | Döküman |
|-----|-------|---------|
| 1 - Temel Altyapı | ✅ Tamamlandı | master_plan |
| 2A - Bölge Sistemi | ✅ Tamamlandı | phases/phase-2a*.md |
| 2B - Admin Bölge Yönetimi | ✅ Tamamlandı | master_plan |
| 3 - RBAC & Rol Sistemi | ✅ Tamamlandı | phases/phase-3-rbac.md |
| 4 - Email Sistemi | ✅ Tamamlandı | phases/phase-4-email.md |
| 5 - Sipariş & Teslimat | 🔜 Planlandı | - |

## 🔧 Teknoloji Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Context + TanStack Query
- **Backend**: Supabase (Lovable Cloud)
- **Email**: Brevo API

## 📝 Katkıda Bulunma

1. Değişiklikler `phases/` altında ayrı dosyalarda belgelenir
2. Her faz tamamlandığında `haldeki_master_plan.md` güncellenir
3. Mimari değişiklikler `architecture.md`'ye eklenir

---

Son güncelleme: 2025-12-26
