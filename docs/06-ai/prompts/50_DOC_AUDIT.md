# 50 Doküman Denetim Promptu

Bu prompt’u, doküman seti oluştuktan sonra kullanın.

---

## PROMPT START

Doc Auditor rolünde davran ve mevcut dokümanları denetle.

### Kurallar
- Önce “Critical issues” listesi çıkar.
- Sonra “Important gaps” ve “Nice-to-have improvements”.
- Her madde için:
  - Neyi düzeltmek gerekiyor
  - Hangi dosyada
  - Önerilen metin / başlık
  - Gerekli takip sorusu (varsa)
- Tutarlılık kontrolü yap:
  - glossary ↔ diğer dokümanlar
  - business rules ↔ processes ↔ rbac
  - architecture ↔ data model

### Çıktı
- 1 sayfalık “Fix Plan” üret:
  - sprint-like görev listesi
  - öncelik
  - tahmini etki

## PROMPT END
