# Workflow: Domain’den Teknik Spesifikasyona

## 1) Bounded context haritası
Domain model üzerinden context’leri çıkar:
- Catalog
- Pricing
- Inventory
- Ordering
- Fulfillment
- Partner Management
- Identity & Access

## 2) API sözleşmeleri
Her context için:
- Input/Output
- İzin modeli (kim çağırır)
- Idempotency ve error model

## 3) Veri modeli
- Entity’lerin tablolara dönüşümü
- Foreign key stratejisi
- Audit alanları

## 4) Güvenlik
- RBAC matrisi
- RLS policy prensipleri
- Service role görev listesi

## 5) Çıktılar
- `docs/03-architecture/architecture-overview.md`
- `docs/03-architecture/security.md`
- `docs/04-data/data-model.md`
