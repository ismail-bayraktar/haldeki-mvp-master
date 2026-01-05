# Güvenlik Baseline

Bu doküman, dijital marketplace projelerinde (özellikle Supabase) minimum güvenlik standartlarını özetler.

---

## 1) Temel ilkeler

- Least privilege
- Deny by default
- Tenant izolasyonu (multi-tenant) zorunlu
- Audit trail (kim ne yaptı?)

---

## 2) Supabase özel notlar

- RLS açık değilse, “auth var” sanıp tüm tabloyu dünyaya açabilirsiniz.
- “service role” anahtarı asla client’a gitmez.
- Public erişim gereken alanlar bile (örn. product list) kontrollü view/policy ile açılmalı.

---

## 3) Önerilen yaklaşım

- Tablolarda tenant alanı: `organization_id` veya `vendor_id`
- Yetkiler:
  - B2C: sadece okuma (aktif ürünler) + kendi siparişi
  - B2B: kendi organizasyonunun siparişleri, adresleri
  - Bayi: kendi ürün/stok/fiyat
  - Depo: picking/packing ekranları için gerekli tablolar
  - Operasyon admin: kontrollü geniş yetki

---

## 4) Log ve audit

- Sipariş state değişimlerini audit tablosuna yaz
- Price değişimlerini versionla
- RLS ile tutarsız raporlama oluyorsa, “view” stratejisi düşün

---

## 5) Checklist

- [ ] Tüm tablolar için RLS açık mı?
- [ ] Tüm policy’ler test edildi mi?
- [ ] Service role nerede kullanılıyor dokümante mi?
- [ ] Tenant izolasyonu için negatif test var mı?
