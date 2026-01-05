# Multi-Ajan Handoff Rehberi

Amaç: İş mantığı dokümanlarından, farklı AI ajanlarına (Gemini / Codex / Claude vb.) gidecek “net ve ölçülebilir” görev paketleri üretmek.

---

## 1) Handoff prensibi

Bir ajana **asla** “şunu yap” demeyin. Şunu verin:

- Bağlam (1 paragraf)
- Hedef (neyi başarmalı)
- Kapsam (ne var, ne yok)
- Done kriteri (test edilebilir)
- Doküman referansları (tek kaynak)
- Risk/edge-case listesi
- Çıkış formatı (PR, commit, dosya listesi vs.)

---

## 2) Görev paketi şablonu

```markdown
## Task: <kısa başlık>

### Context
...

### Goal
...

### Scope
**In-scope**
- ...

**Out-of-scope**
- ...

### References
- docs/02-domain/business-rules.md (BR-00X)
- docs/02-domain/rbac.md
- docs/04-data/supabase/rls-policies.md

### Acceptance Criteria
- Given / When / Then
- ...

### Edge Cases
- ...

### Security Notes
- ...

### Deliverables
- Dosyalar:
- Testler:
- Doküman güncelleme:
```

---

## 3) Ajan seçimi

- **Codex**: Implementation görevleri, refactor, test ekleme
- **Gemini**: Büyük resim analizi, alternatifler, risk/edge-case listeleri
- **Claude/Cloud**: Metin kalitesi, dokümantasyon, PRD, UX copy, mantıksal tutarlılık

> En iyi sonuç: aynı görevi iki ajana verip sonuçları “Doc Auditor” ile karşılaştırmak.

---

## 4) Kalite kapıları

Aşağıdaki kapılar geçilmeden “kod üretimi”ne geçmeyin:

- Glossary tamam mı?
- Business rules net mi?
- RBAC matrisi var mı?
- Data model ve tenant alanı seçildi mi?
- “Order lifecycle” state machine çıktı mı?

---

## 5) “Doküman güncelleme” kuralı

Kod ajanına her görevde şunu zorunlu tutun:

- Eğer yeni karar aldıysan → ADR aç
- Eğer yeni iş kuralı çıktıysa → business-rules güncelle
- Eğer yeni rol/izin çıktıysa → rbac güncelle
