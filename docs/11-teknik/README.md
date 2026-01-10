# 11. Teknik

> Detaylı teknik dokümanlar

---

## Bu Klasör

Derinlemesine teknik dokümantasyon: optimizasyon, migration script açıklamaları, database tuning.

---

## İçindekiler

| Dosya | Konu | Hedef Kitle |
|-------|------|-------------|
| [performance-optimization.md](./performance-optimization.md) | Frontend ve backend optimizasyon | Senior+ |
| [migration-scripts.md](./migration-scripts.md) | Migration script açıklamaları | DBA + Senior |
| [database-optimization.md](./database-optimization.md) | Index ve query optimizasyonu | DBA |

---

## Performance Targets

| Metrik | Hedef | Mevcut |
|--------|-------|--------|
| FCP (First Contentful Paint) | < 1.8s | 1.2s ✅ |
| LCP (Largest Contentful Paint) | < 2.5s | 1.8s ✅ |
| TTI (Time to Interactive) | < 3.8s | 2.5s ✅ |
| API Response Time | < 200ms | 150ms ✅ |
| Database Query Time | < 100ms | 80ms ✅ |

---

## Optimization Areas

### Frontend
- Code splitting by route
- Image lazy loading
- Bundle size reduction
- Memoization

### Backend
- Query optimization
- Connection pooling
- Caching strategy
- Edge functions

### Database
- Index strategy
- Query plan analysis
- Connection limits
- Table partitioning

---

## Migration Scripts

### Migration Konvansiyonu

```sql
-- Dosya adı: YYYYMMDDHHMMSS_descriptive_name.sql
-- Örnek: 20260109160000_global_product_catalog.sql

BEGIN;

-- 1. Up migration
CREATE TABLE new_table (...);

-- 2. Data migration
INSERT INTO new_table SELECT * FROM old_table;

-- 3. Down migration (comment)
-- DROP TABLE new_table;

COMMIT;
```

### Migration Run

```bash
# Tüm migration'ları çalıştır
npx supabase db push

# Belirli bir migration'ı rollback
npx supabase db reset --version 20260109160000
```

---

## İlgili Dokümanlar

- [Veritabanı Şeması](../03-mimari/veritabani-semasi.md)
- [Performance Reports](../09-raporlar/performance-raporlari.md)

---

**Son güncelleme:** 2026-01-10
