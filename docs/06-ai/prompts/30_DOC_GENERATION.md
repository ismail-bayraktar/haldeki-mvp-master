# 30 Doküman Üretimi Promptu

Domain model çıktılarına göre, doküman ağacını doldurmak için.

---

## PROMPT START

Elindeki domain ve discovery çıktılarıyla doküman setini genişlet.

### Kurallar
- Yeni doküman eklemeden önce: hangi dosyalar var, hangileri eksik → kısa liste.
- Her dokümanı “minimum viable doc” olarak üret:
  - kısa ama kararları net
  - gereksiz tekrar yok
- Her dokümanın sonunda “Next Iteration” bölümünde iyileştirme maddeleri yaz.

### Üretilecek dokümanlar
- `docs/00-overview/glossary.md`
- `docs/00-overview/vision.md`
- `docs/01-product/prd.md` (taslak)
- `docs/01-product/user-stories.md` (en az 10 story)
- `docs/01-product/acceptance-criteria.md` (Given/When/Then)
- `docs/03-architecture/architecture-overview.md` (yüksek seviye)
- `docs/03-architecture/security.md` (RBAC/RLS referanslı)
- `docs/03-architecture/adr/ADR-0001.md` (ilk karar kaydı; örnek)

### Çıktı formatı
Her dosyayı ayrı Markdown blokları olarak üret ve dosya adını başlıkta yaz:
- `# FILE: docs/.../...md`

## PROMPT END
