# Uçtan Uca Workflow

Bu workflow, “İş Mantığı → Doküman → Görev → AI Ajan Implementasyonu” hattını standartlaştırır.

---

## A) Discovery

**Amaç:** Projeyi “doğru problem” üzerinden tanımlamak.

- Girdi: mevcut fikirler, MVP ekranları, mevcut dokümanlar (varsa)
- Çıktı:
  - Glossary (terimler)
  - Roller & aktörler
  - MVP kapsamı (in/out)
  - Açık sorular listesi

Kullan: `prompts/10_DISCOVERY_INTERVIEW.md`

---

## B) Domain Model & Business Rules

**Amaç:** AI’nın kod yazarken hata yapmasına neden olan belirsizlikleri kapatmak.

- Çıktı:
  - Domain model (entity listesi + ilişkiler)
  - Business rules (fiyat, stok, sipariş, iptal, iade)
  - Süreç diyagramları (order lifecycle)

Kullan: `prompts/20_DOMAIN_MODELING.md`

---

## C) Product Docs

**Amaç:** MVP backlog’u test edilebilir hale getirmek.

- Çıktı:
  - PRD
  - User stories
  - Acceptance criteria

Kullan: `prompts/30_DOC_GENERATION.md` (ve/veya PM ajanı)

---

## D) Tech + Data + Security

**Amaç:** “Güvenli ve sürdürülebilir” altyapı kararlarını başta almak.

- Çıktı:
  - Architecture overview
  - ADR’ler
  - Data model
  - RBAC/RLS yaklaşımı
  - Supabase workflow

Kullan: `prompts/40_SUPABASE_CLI_TASKS.md`

---

## E) QA & Release Readiness

**Amaç:** Vibe coding olsa bile “kontrol edilebilir kalite” üretmek.

- Çıktı:
  - Test plan
  - Edge-case matrisi
  - Release checklist

---

## F) Doküman Denetimi ve Gap Fix

**Amaç:** Çelişki ve eksikleri yakalayıp tek kaynağı temizlemek.

Kullan: `prompts/50_DOC_AUDIT.md`

---

## G) Implementasyon görevlerine çevirme

Bu kit kod yazmaz; ama diğer ajanlara **net görev listesi** verir:

- Feature → user story → acceptance criteria
- Data değişimi → migration task
- Security → RLS policy task
- UI → page/component task

Her görevde:
- Amaç
- Done kriteri
- Test kontrolü
- Doküman güncelleme gereksinimi
