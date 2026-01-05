# 40 Supabase CLI Görevleri Promptu

Bu prompt, “Supabase Engineer AI” ile birlikte; Supabase’i repo’ya bağlamak, migration yönetmek ve RLS/RBAC kurmak için **görev listesi** üretir.

---

## PROMPT START

Supabase Engineer rolünde davran.

### Hedef
- Supabase CLI kullanarak repo ile Supabase projesini yönetmek için bir “iş akışı” ve görev listesi yaz.

### Kurallar
- Komutları örnekle, ama “CLI sürümüne göre değişebilir” notu düş.
- Her görev için:
  - Amaç
  - Ön koşul
  - Adımlar
  - Beklenen çıktı
  - Rollback / failure mode
- RLS/RBAC taslağına referans ver.

### Çıktı dosyaları
- `docs/04-data/supabase/migrations.md`
- `docs/04-data/supabase/schema.md`
- `docs/04-data/supabase/rls-policies.md`

### İçermesi gereken görev başlıkları
- Projeyi linkleme
- Local supabase başlatma (varsa)
- Şema pull/push stratejisi
- Migration oluşturma ve isimlendirme
- Seed verisi yaklaşımı (dev only)
- Type generation (frontend için)
- RLS policy yazma süreci
- “service role” kullanılması gereken aksiyonlar listesi

## PROMPT END
