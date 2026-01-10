# Frontend Playground - Design System Showcase

> **Hedef:** `/playground` route'unda tüm tasarım sistemi bileşenlerinin vitrini
> **Proje Türü:** WEB (Vite + React + TypeScript + Tailwind CSS)
> **Durum:** 🔄 PLANLANDI

---

## 📋 Özet

Haldeki markasının tasarım sisteminin (renkler, tipografi, bileşenler) tek bir sayfada sergilenmesi. Geliştirme sürecinde yeni bileşenleri test etmek ve görsel tutarlılığı sağlamak için kullanılacak.

---

## 🏗️ Mimari

```
src/pages/Playground.tsx          (Ana playground sayfası)
├── src/components/playground/
│   ├── ColorShowcase.tsx         (Renk paleti vitrini)
│   ├── ComponentShowcase.tsx     (UI bileşenleri)
│   ├── BusinessComponents.tsx    (İş bileşenleri - product cards, vs.)
│   ├── LayoutShowcase.tsx        (Layout pattern'leri)
│   └── AIReviewPanel.tsx         (AI tasarım review)
```

**Route:** `/playground` (dev-only, production'da gizli)

---

## 🎨 Design Token'lar

| Kategori | Tokenlar |
|----------|----------|
| **Renkler** | `--haldeki-green`, `--fresh-orange`, `--earth-brown` |
| **Tipografi** | `font-andika` (Google Fonts) |
| **Shadows** | `--shadow-soft`, `--shadow-card`, `--shadow-hover` |
| **Border Radius** | `--radius: 0.75rem` |
| **Spacing** | Tailwind scale (4px base) |

---

## ✅ Success Criteria

- [ ] `/playground` route'u erişilebilir
- [ ] Tüm UI bileşenleri (Button, Badge, Card, Input) görünüyor
- [ ] Tüm marka renkleri vitrinlenebiliyor
- [ ] Business bileşenleri (ProductCard, SupplierCard) demo'lanıyor
- [ ] AI review paneli aktif (otomatik öneriler)
- [ ] Responsive tasarım (mobile + desktop)

---

## 📦 Task Breakdown

### Phase 1: Route + Temel Yapı
- [ ] **Task 1.1:** `src/pages/Playground.tsx` oluştur → Verify: `/playground` açılıyor
- [ ] **Task 1.2:** `App.tsx`'e playground route ekle → Verify: Dev-only route çalışıyor

### Phase 2: Design Token Showcase
- [ ] **Task 2.1:** `ColorShowcase.tsx` oluştur → Verify: Tüm renkler görsel olarak listeleniyor
- [ ] **Task 2.2:** `TypographyShowcase.tsx` oluştur → Verify: Font scale, headings, body text gösteriliyor

### Phase 3: Core UI Bileşenleri
- [ ] **Task 3.1:** `ComponentShowcase.tsx` oluştur (Button, Badge, Card, Input) → Verify: Tüm varyasyonlar görünür
- [ ] **Task 3.2:** Form elemanlarını ekle (Select, Checkbox, Switch) → Verify: Etkileşimli demo

### Phase 4: Business Bileşenleri
- [ ] **Task 4.1:** ProductCard demo section → Verify: Mock data ile ürün kartları
- [ ] **Task 4.2:** Layout pattern demo (grid, flex) → Verify: Responsive grid örnekleri

### Phase 5: AI Review Integration
- [ ] **Task 5.1:** `AIReviewPanel.tsx` oluştur → Verify: Tasarım önerileri gösteriliyor
- [ ] **Task 5.2:** Otomatik contrast checker entegre et → Verify: WCAG AA uyarıları

### Phase 6: Navigation + UX
- [ ] **Task 6.1:** Tab-based navigation ekle → Verify: Section'lar arası geçiş
- [ ] **Task 6.2:** Search/filter ekle → Verify: Bileşen hızlı bulma

### Phase X: Verification
- [ ] **Task X.1:** UX audit çalıştır: `python ~/.claude/skills/frontend-design/scripts/ux_audit.py .`
- [ ] **Task X.2:** Accessibility check: `python ~/.claude/skills/frontend-design/scripts/accessibility_checker.py .`
- [ ] **Task X.3:** Build test: `npm run build`
- [ ] **Task X.4:** Manual test: `/playground` aç, tüm section'ları kontrol et

---

## 🔴 Kısıtlamalar

- **NO purple/violet colors** (Purple Ban)
- **Andika font** zorunlu (Google Fonts)
- **Halkedi Green** (#004631) primary color
- **Fresh Orange** (#FF6B35) accent color
- Tailwind CSS utility classes tercih edilir
- Dev-only flag (`import.meta.env.DEV`)

---

## 🛠️ Tech Stack

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| React | 18.3+ | UI framework |
| TypeScript | 5.8+ | Type safety |
| Tailwind CSS | 3.4+ | Styling |
| React Router | 6.30+ | Routing |
| Radix UI | Latest | Headless UI primitives |
| CVA | Latest | Component variants |

---

## 📝 Notlar

- Sayfa production'da gizli olacak (dev-only)
- Mock data kullanılabilir (gerçek API çağrısı yok)
- Performans optimizasyonu gerekmiyor (sadece vitrin)
- Future: Storybook entegrasyonu düşünülebilir
