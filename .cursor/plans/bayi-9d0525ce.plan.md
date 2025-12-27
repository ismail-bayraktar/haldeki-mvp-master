<!-- 9d0525ce-fd09-457d-bda9-60771a004f3e 5f7bf094-8d0c-486e-af9d-3cb4a032d226 -->
# Haldeki Docs Yeniden Yapilandirma ve Migration Plani

## Ozet

Mevcut `docs/` klasorunu profesyonel, tutarli ve genisletilebilir bir yapiyla yeniden organize edecegiz. Supabase migration icin adim adim Turkce rehber olusturacagiz. Business logic ve sistem akislarini diyagramlarla dokumante edecegiz.

---

## Yeni Docs Yapisi

```
docs/
├── README.md                         # Giris noktasi (guncellenecek)
├── ROADMAP.md                        # Genel yol haritasi
│
├── guides/                           # Kullanici Rehberleri (Turkce)
│   ├── 01-supabase-migration.md      # Supabase hesap acma ve migration
│   ├── 02-local-development.md       # Local gelistirme ortami
│   ├── 03-deployment.md              # Production deploy (ileride)
│   └── 04-troubleshooting.md         # Sorun giderme
│
├── architecture/                     # Teknik Mimari
│   ├── overview.md                   # Sistem genel bakis
│   ├── database-schema.md            # DB semasi + ER diagram
│   ├── security-model.md             # RLS, RBAC, Auth
│   ├── data-flow.md                  # Veri akislari + sequence diagrams
│   └── api-contracts.md              # Edge Functions, API yapisi
│
├── business/                         # Is Mantigi
│   ├── user-flows.md                 # Kullanici yolculuklari
│   ├── order-lifecycle.md            # Siparis yasam dongusu
│   ├── dealer-supplier-flow.md       # Bayi/Tedarikci akislari
│   └── region-pricing.md             # Bolge fiyatlandirma mantigi
│
├── phases/                           # Faz Arsivi (mevcut, korunacak)
│   ├── phase-2a1-regioncontext.md
│   ├── phase-2a2-region-products.md
│   ├── phase-2a3-cart-region.md
│   ├── phase-2a4-delivery-slots.md
│   ├── phase-3-rbac.md
│   ├── phase-4-email.md
│   └── phase-5-approval-system.md    # Yeni - bugunku calisma
│
├── scripts/                          # SQL ve Migration Scripts
│   └── full-schema.sql               # Tek dosyada tum schema
│
└── diagrams/                         # Kaynak Mermaid dosyalari
    ├── er-diagram.md
    ├── auth-flow.md
    ├── order-flow.md
    └── dealer-supplier-flow.md
```

---

## Olusturulacak Dosyalar

### 1. guides/01-supabase-migration.md (Turkce Rehber)

Kullanici icin adim adim:
- Supabase hesap olusturma
- Yeni proje olusturma
- SQL Editor'da schema calistirma
- Edge Function deploy
- .env.local guncelleme
- Test adimlari

### 2. scripts/full-schema.sql

Mevcut 12 migration dosyasini tek dosyada birlestirme:
- Tum tablolar (regions, products, dealers, suppliers, vb.)
- Tum enum'lar (app_role, approval_status, vb.)
- Tum RLS policy'leri
- Tum trigger'lar (handle_new_user)
- Tum function

### To-dos

- [x] Veritabani migration: approval_status, tax_number, product_categories kolonlari
- [x] pending_invites icin token bazli public read RLS policy
- [x] BayiKayit.tsx sayfasi: token dogrulama, ozel form, signup
- [x] TedarikciKayit.tsx sayfasi: token dogrulama, ozel form, signup
- [x] Beklemede.tsx sayfasi: onay bekleniyor mesaji
- [x] useEmailService signupUrl guncelleme: token ile ozel sayfa
- [x] Yeni email sablonlari: admin_new_application, application_approved/rejected
- [x] Admin Dealers/Suppliers sayfalarinda onay/red UI
- [x] RequireRole: approval_status kontrolu ve redirect
- [x] AuthContext: approvalStatus state ekleme
- [x] App.tsx: yeni route'lar ekleme