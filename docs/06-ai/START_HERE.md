# Dijital Hal AI Dokümantasyon ve Ajan Kiti

Bu klasör, **“Vibe Coding ama endüstri standardında”** hedefiyle, dokümantasyon + iş mantığı + teknik planlamayı **AI ajanlarıyla** sistematik hale getirmek için hazırlanmış bir başlangıç kitidir.

> Bu kit **kod yazdırmaz**. Kod yazdırmaya giden yolu; doğru sorular, doğru dokümanlar, doğru karar kayıtları (ADR) ve net görev tanımlarıyla açar.

---

## 1) Bu kit ne çözer

- “Her şey karmakarışık” hissini azaltır: Tek bir **source of truth** (dokümantasyon ağacı) kurar.
- AI’nın daha doğru kod yazmasını sağlar: İş kuralları + domain model + RBAC + edge-case’ler netleşir.
- Birden fazla AI ajanını (Gemini / Codex / Claude vb.) aynı hedefe hizalar: Her ajanın rolü, çıktı formatı ve kalite barı tanımlıdır.
- Supabase (Postgres + RLS) gibi platformlarda **güvenlik & multi-tenant** mantığını en baştan dokümante eder.

---

## 2) Çalışma prensipleri

Bu repo/hesap için kabul edilen kurallar:

1. **Best practice** odaklı ilerle.
2. **Clean Code** ve sürdürülebilir mimariyi hedefle.
3. **Endüstri standardı** kalite barı: güvenlik, netlik, izlenebilir kararlar, test edilebilirlik.
4. **İteratif ilerle**: 1 seferde devrim değil, kontrollü iyileştirme.
5. **Dokümanlar yaşayan varlıklardır**: yeni karar / yeni özellik / yeni risk → doküman güncellenir.

---

## 3) Roller ve ajanlar

Bu kit 6 “ajan rolü” tarif eder:

- **İş Mantığı Kılavuzu AI** (ana ajan): Projeyi anlamak için soru sorar, domain mantığını çıkarır, “bu tip proje böyle yapılır” perspektifi sunar.
- **Product Manager AI**: PRD, user story, acceptance criteria, KPI/metric seti üretir.
- **Tech Architect AI**: bounded context, servis sınırları, API sözleşmeleri, entegrasyonlar, non-functional requirements.
- **Supabase Engineer AI**: veri modeli, RLS/RBAC, migration workflow, edge function yaklaşımı, CLI görev tanımları.
- **QA Analyst AI**: test planı, edge-case matrisi, release checklist.
- **Doc Auditor AI**: doküman kalitesini, tutarlılığı, eksikleri ve çelişkileri denetler.

Ajan tanımları: `docs/06-ai/agents/`

---

## 4) Uçtan uca workflow

Önerilen akış:

1. **Discovery Interview** (İş Mantığı Kılavuzu)  
2. **Domain Model & Business Rules** (İş Mantığı Kılavuzu + Tech Architect)  
3. **PRD + Kullanıcı Senaryoları** (PM)  
4. **Data Model + RBAC/RLS** (Supabase Engineer)  
5. **API Contracts + Integration Plan** (Architect)  
6. **QA Plan + Edge Case Matrix** (QA)  
7. **Doc Audit & Gap Fix** (Doc Auditor)  
8. **Task Breakdown** (Codex/Gemini/Claude için “iş listesi”)

Workflow detayları: `docs/06-ai/workflows/`

---

## 5) Repo içinde önerilen dokümantasyon ağacı

Bu kit sadece `docs/06-ai/` tarafını içerir. Proje dokümantasyonunu şöyle konumlandırmanız önerilir:

```
docs/
  00-overview/
    vision.md
    glossary.md
    stakeholders.md
  01-product/
    prd.md
    user-stories.md
    acceptance-criteria.md
  02-domain/
    domain-model.md
    business-rules.md
    processes.md
    rbac.md
  03-architecture/
    architecture-overview.md
    adr/
    integrations.md
    security.md
  04-data/
    data-model.md
    supabase/
      schema.md
      rls-policies.md
      migrations.md
  05-operations/
    fulfillment.md
    warehouse.md
    supplier-onboarding.md
  06-ai/
    ... (bu kit)
```

> Bu ağacı “tek seferde doldurmak” zorunda değilsiniz. Önce **glossary + domain model + business rules + rbac + data model** odaklı ilerleyin.

---

## 6) Hızlı başlangıç

1. `docs/06-ai/prompts/00_MASTER_PROMPT.md` dosyasını açın.
2. ChatGPT Pro’da **yeni sohbet** başlatın.
3. Master prompt’u yapıştırın.
4. “Discovery” prompt’u ile başlayın: `docs/06-ai/prompts/10_DISCOVERY_INTERVIEW.md`
5. Soruları cevapladıkça ajan size:
   - eksikleri,
   - çelişkileri,
   - kritik karar noktalarını
   çıkaracak ve doküman taslaklarını üretecek.

---

## 7) Çıktı standardı

Bu kitteki bütün çıktılar için standartlar:

- Format: **Markdown**
- Diyagram: mümkünse **Mermaid**
- Dil: Türkçe (teknik terimler gerektiğinde İngilizce)
- Her dokümanda:
  - Amaç
  - Kapsam
  - Varsayımlar
  - Kararlar
  - Edge-case’ler
  - Açık sorular / riskler

---

## 8) Güvenlik notu

Supabase kullanıyorsanız, özellikle:

- Row Level Security (RLS) açık olacak mı?
- Multi-tenant ayrımı nasıl?
- Service role kullanımı nerede?
- Payment/Invoice gibi hassas tabloların erişimi nasıl?

Bu konular **başta dokümante edilmezse** sonradan düzeltmesi pahalı olur.

---

## 9) Sonraki adım

Önce şunu yapın:

- `knowledge/DIGITAL_HAL_PLAYBOOK.md` dosyasını okuyun.
- Discovery interview ile başlayın.
- İlk çıktılar: `glossary`, `roles`, `order flow`, `pricing rules`, `rbac`.

Kolay gelsin.
