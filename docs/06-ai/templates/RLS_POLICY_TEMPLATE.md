# RLS Policy Template

> Dosya: `docs/04-data/supabase/rls-policies.md`

## 1) Amaç
Row Level Security (RLS) politikalarını standartlaştırmak.

## 2) Prensipler
- Deny by default
- Tenant izolasyonu zorunlu
- Service role sadece backend işlemleri için

## 3) Policy Kataloğu
Her policy için:
- Tablo
- Aksiyon (SELECT/INSERT/UPDATE/DELETE)
- Hedef rol
- Kural (yüksek seviye)
- Test senaryosu

Örnek:
### products SELECT
- Rol: public (B2C) / authenticated (B2B)
- Kural: sadece “aktif ürünler”
- Test: pasif ürünü görememeli

## 4) Edge-case’ler
- Admin cross-tenant erişimi
- Bayi sadece kendi ürünlerini yönetebilir mi?
- Depo stok görebilir ama fiyat göremez mi?

## 5) Açık Sorular
- ...
