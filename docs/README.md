# Haldeki.com Dokümantasyonu

> Bu klasör, Haldeki projesinin teknik ve iş dokümantasyonunu içerir.

## Otomatik Dokümantasyon

Bu projede dokümantasyon otomatik olarak kod ile senkronize edilir:

```bash
# Dokümantasyonu oluştur
npm run docs:build

# Sadece indeks güncelle
npm run docs:generate

# API dokümantasyonu (TypeDoc)
npm run docs:api
```

Detaylı bilgi için: [Development - Documentation Sync](./development/documentation-sync.md)

## Dokümantasyon Yapısı

```
docs/
├── README.md                           # Bu dosya - Giriş noktası
├── INDEX.md                            # Otomatik oluşturulan ana indeks
├── TREE.md                             # Otomatik oluşturulan yapı ağacı
├── ROADMAP.md                          # Genel yol haritası ve faz takibi
│
├── guides/                             # Kullanıcı Rehberleri
│   ├── 01-supabase-migration.md        # Supabase hesap açma ve migration
│   ├── 02-supabase-auth-setup.md       # Auth ayarları ve sorun giderme
│   ├── 03-deployment.md                # Production deploy (planlandı)
│   └── 04-troubleshooting.md           # Sorun giderme (planlandı)
│
├── architecture/                       # Teknik Mimari
│   ├── database-schema.md              # DB şeması + ER diagram
│   ├── overview.md                     # Sistem genel bakış (planlandı)
│   ├── security-model.md               # RLS, RBAC, Auth (planlandı)
│   ├── data-flow.md                    # Veri akışları (planlandı)
│   └── api-contracts.md                # Edge Functions, API (planlandı)
│
├── business/                           # İş Mantığı
│   ├── dealer-supplier-flow.md         # Bayi/Tedarikçi akışları
│   ├── user-flows.md                   # Kullanıcı yolculukları (planlandı)
│   ├── order-lifecycle.md              # Sipariş yaşam döngüsü (planlandı)
│   └── region-pricing.md               # Bölge fiyatlandırma (planlandı)
│
├── phases/                             # Faz Arşivi
│   ├── phase-2a1-regioncontext.md      # RegionContext implementasyonu
│   ├── phase-2a2-region-products.md    # Bölge-ürün entegrasyonu
│   ├── phase-2a3-cart-region.md        # Sepet bölge yönetimi
│   ├── phase-2a4-delivery-slots.md     # Teslimat slotları
│   ├── phase-3-rbac.md                 # Rol sistemi
│   ├── phase-4-email.md                # Email sistemi
│   ├── phase-5-approval-system.md      # Onay sistemi
│   ├── phase-6-order-delivery.md      # Sipariş ve teslimat sistemi
│   └── phase-7-payment-system.md      # Ödeme sistemi
│
├── development/                        # Geliştirme Rehberleri
│   ├── documentation-sync.md           # Dokümantasyon senkronizasyonu
│   └── TEST_ACCOUNTS.md                # Test hesapları
│
├── api/                                # API Dokümantasyonu (JSDoc'tan)
│   └── index.md                        # API fonksiyonları özeti
│
├── api-reference/                      # TypeDoc HTML çıktısı
│   └── index.html                      # Detaylı API referansı
│
├── scripts/                            # SQL ve Migration
│   ├── full-schema.sql                 # Birleşik veritabanı şeması
│   ├── seed-data.sql                   # Başlangıç verileri (ürünler, bölgeler)
│   ├── fix-products-schema.sql         # Products tablosu düzeltmesi
│   └── fix-regions-schema.sql          # Regions tablosu düzeltmesi
│
└── diagrams/                           # Kaynak diyagramlar (planlandı)
    ├── er-diagram.md
    ├── auth-flow.md
    └── order-flow.md
```

---

## Hızlı Başlangıç

### Yeni Başlayanlar İçin

1. **Projeyi anla**: [ROADMAP.md](./ROADMAP.md) - Genel yol haritası
2. **Veritabanını anla**: [architecture/database-schema.md](./architecture/database-schema.md)
3. **İş mantığını anla**: [business/dealer-supplier-flow.md](./business/dealer-supplier-flow.md)

### Kurulum İçin

1. **Supabase kurulumu**: [guides/01-supabase-migration.md](./guides/01-supabase-migration.md)
2. **SQL şeması**: [scripts/full-schema.sql](./scripts/full-schema.sql)
3. **Seed data**: [scripts/seed-data.sql](./scripts/seed-data.sql)
4. **Auth ayarları**: [guides/02-supabase-auth-setup.md](./guides/02-supabase-auth-setup.md)

### Geliştirme İçin

1. **Faz geçmişi**: `phases/` klasörü
2. **Mimari detaylar**: `architecture/` klasörü

---

## Faz Durumları

| Faz | Durum | Döküman |
|-----|-------|---------|
| 1 - Temel Altyapı | ✅ Tamamlandı | ROADMAP.md |
| 2A - Bölge Sistemi | ✅ Tamamlandı | phases/phase-2a*.md |
| 2B - Admin Bölge Yönetimi | ✅ Tamamlandı | ROADMAP.md |
| 3 - RBAC & Rol Sistemi | ✅ Tamamlandı | phases/phase-3-rbac.md |
| 4 - Email Sistemi | ✅ Tamamlandı | phases/phase-4-email.md |
| 5 - Onay Sistemi | ✅ Tamamlandı | phases/phase-5-approval-system.md |
| 6 - Sipariş & Teslimat | ✅ Tamamlandı | phases/phase-6-order-delivery.md |
| 7 - Ödeme Sistemi | ✅ Tamamlandı | phases/phase-7-payment-system.md |
| 8 - İşletme (B2B) Paneli | ⏳ Devam Ediyor | phases/phase-8-business-panel.md |

---

## Teknoloji Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- TanStack Query (veri yönetimi)
- React Router (routing)

### Backend
- Supabase (PostgreSQL + Auth + Storage)
- Supabase Edge Functions (Deno)
- Row Level Security (RLS)

### Araçlar
- Brevo (email servisi)
- Lovable (MVP geliştirme)

---

## Önemli Linkler

| Kaynak | URL |
|--------|-----|
| Supabase Dashboard | https://supabase.com/dashboard |
| Brevo Dashboard | https://app.brevo.com |
| Lovable | https://lovable.dev |

---

## Katkıda Bulunma

### Dokümantasyon Kuralları

1. Tüm dokümanlar Türkçe yazılır
2. Markdown formatı kullanılır
3. Mermaid diyagramları tercih edilir
4. Her doküman "Son güncelleme" tarihi içerir

### Dosya İsimlendirme

- Kebab-case kullanılır: `dealer-supplier-flow.md`
- Faz dokümanları: `phase-X-isim.md`
- Rehberler numaralandırılır: `01-supabase-migration.md`

### Değişiklik Süreci

1. Yeni özellikler `phases/` altında belgelenir
2. Mimari değişiklikler `architecture/` altına eklenir
3. Her değişiklik sonrası `ROADMAP.md` güncellenir

---

## Lisans

Bu proje özel mülkiyettir. Tüm hakları saklıdır.

---

Son güncelleme: 2025-12-27
