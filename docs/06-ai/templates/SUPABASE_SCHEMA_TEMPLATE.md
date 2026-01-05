# Supabase Schema Template

> Dosya: `docs/04-data/supabase/schema.md`

## 1) Amaç
Supabase tarafındaki tablo ve ilişkileri tek yerde özetlemek.

## 2) Tablolar

### products
- Amaç:
- Alanlar:
- İndeksler:
- RLS: (var/yok)

### inventory_lots
- Amaç:
- Alanlar:
- İlişkiler:
- RLS:

## 3) Naming Convention
- tablo: snake_case çoğul
- PK: id (uuid)
- FK: <table>_id
- timestamps: created_at, updated_at

## 4) Audit alanları
- created_by
- updated_by
- tenant alanı: vendor_id / organization_id

## 5) Açık Sorular
- ...
