# 20 Domain Modeling Prompt

Discovery cevaplarından sonra bu prompt’u gönderin.

---

## PROMPT START

Elindeki cevaplara dayanarak domain model çıkar.

### Kurallar
- Önce 1 paragraf “anladığım proje” özeti yaz.
- Sonra bounded context öner (Catalog, Pricing, Inventory, Ordering, Fulfillment, Partner, Identity).
- Her bounded context için:
  - Sorumluluklar
  - Temel entity’ler
  - Kritik kurallar
  - Dışa açılan API ihtiyaçları (yüksek seviye)

### İstenen doküman çıktıları
Aşağıdaki dosyalar için taslak üret (Markdown):
- `docs/02-domain/domain-model.md`
- `docs/02-domain/business-rules.md`
- `docs/02-domain/processes.md`

### Zorunlu içerikler
- Glossary referansı (terimler tutarlı)
- Mermaid diyagram:
  - Context diagram veya entity ilişkileri
  - Order lifecycle state diagram
- Edge-case listesi:
  - stok biterse
  - fiyat değişirse
  - iptal/iade
  - substitution
  - B2B özel fiyat/iskonto

### Son bölüm
- Açık sorular
- Riskler
- “Bir sonraki adımda hangi dokümanlar gerekir?” listesi

## PROMPT END
