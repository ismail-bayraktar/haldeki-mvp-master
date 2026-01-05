# Workflow: Discovery’den Domain’e

## 1) Discovery çıktıları
- Glossary taslağı
- Roller
- MVP scope
- 10–20 açık soru

## 2) Gate
Aşağıdakiler netleşmeden domain model’e geçmeyin:

- B2B ve B2C arasındaki farklar
- Fiyatlandırma/marj kuralı (en azından MVP)
- Stok modeli (gerçek mi, tahmini mi, rezervasyon var mı?)
- Sipariş akışında “kesim saati” ve “teslimat slotu”

## 3) Domain model üretimi
- Entity listesi + ilişkiler
- Order lifecycle state machine
- Business rules katalogu

## 4) Çıktılar
- `docs/02-domain/domain-model.md`
- `docs/02-domain/business-rules.md`
- `docs/02-domain/processes.md`
