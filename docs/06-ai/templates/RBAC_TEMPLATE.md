# RBAC Template

> Dosya: `docs/02-domain/rbac.md`

## 1) Amaç
Sistemde kim, hangi kaynağa, hangi aksiyonla erişebilir?

## 2) Rol Listesi
- Admin
- Operasyon
- Depo
- Bayi
- Tedarikçi
- B2B Müşteri (işletme)
- B2C Müşteri

## 3) Kaynaklar
- Product
- Inventory
- Order
- Pricing
- Customer
- Warehouse
- Supplier/Vendor

## 4) İzin Matrisi

| Rol | Kaynak | Create | Read | Update | Delete | Notlar |
|---|---|---:|---:|---:|---:|---|
| ... | ... | ✅ | ✅ | ❌ | ❌ | ... |

## 5) Tenant İzolasyonu
- Tenant tanımı nedir? (vendor_id / organization_id)
- Cross-tenant erişim kimde var?

## 6) Supabase RLS Stratejisi
- Varsayılan: deny
- Okuma/yazma policy’leri

## 7) Edge-case’ler
- Bayi fiyatları kim görür?
- Tedarikçi kendi lotlarını görür mü?
- Operasyon tüm siparişleri görebilir mi?

## 8) Açık Sorular
- ...
