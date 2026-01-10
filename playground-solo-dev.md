# Playground - Solo Developer Roadmap

> **Last Updated:** 2026-01-10  
> **Purpose:** Hızlı iterasyon, deneme, öğrenme alanı  
> **Team:** SOLO developer (sadece sen)

---

## Overview

Playground = Kendi için geliştirme + test alanı.  
Amaç: Geleceğe yönelik component/sayfa/UI/UX tasarımları yapmak, denemek, optimize etmek.

**Rules:**
- NO automated tests (görsel kontrol yeterli)
- NO CI/CD (solo developer için overkill)
- Hızlı iterasyon = Önemli
- Deneme yanılmaya izin var

---

## Cleanup: Gereksiz Dosyaları Sil

### Silinecek Dosyalar

```bash
# 1. Automated test dosyaları (solo dev için overkill)
rm tests/playground/visual-regression.spec.ts
rm tests/playground/components.spec.tsx
rm tests/playground/accessibility.spec.ts

# 2. CI/CD workflow (solo developer için gerekli değil)
rm .github/workflows/playground-ci.yml
```

### Neden Siliniyor?

| Dosya | Sebep |
|-------|-------|
| visual-regression.spec.ts | Görsel kontrol = gözle yapmak yeterli |
| components.spec.tsx | Unit test = solo dev için zaman kaybı |
| accessibility.spec.ts | A11y check = manual kontrol yeterli |
| playground-ci.yml | CI/CD = solo dev için overkill |

---

## Quick Start: 5 Dakikada Yeni Component

### Adım 1: Yeni Component Dosyası Oluştur

```bash
# Component'ı playground klasörüne ekle
touch src/components/playground/YeniComponent.tsx
```

### Adım 2: Component Şablonu

```tsx
// src/components/playground/YeniComponent.tsx
import { Button } from "@/components/ui/button";

export function YeniComponent() {
  return (
    <section>
      <h3 className="text-lg font-bold text-foreground mb-4">
        [Component Adı]
      </h3>
      <div className="bg-card border border-border rounded-lg p-6">
        {/* İçerik buraya */}
      </div>
    </section>
  );
}
```

### Adım 3: Export'a Ekle

```tsx
// src/components/playground/index.ts
export { YeniComponent } from './YeniComponent';
```

### Adım 4: Playground Sayfasına Ekle

```tsx
// src/app/playground/page.tsx
import { YeniComponent } from '@/components/playground';

export default function PlaygroundPage() {
  return (
    <div>
      <YeniComponent />
    </div>
  );
}
```

### Adım 5: Test Et

```bash
# 1. Dev server'ı başlat
npm run dev

# 2. Tarayıcıda aç
http://localhost:3000/playground

# 3. Görsel kontrol
# - Responsive mi? (mobile/tablet/desktop)
# - Renkler doğru mu?
# - Hover/active states var mı?
# - Dark mode çalışıyor mu?
```

**Toplam Süre:** 5 dakika

---

## Pratik Workflow: Hızlı İterasyon Döngüsü

### Döngü: Fikir → Prototip → Test → Deploy

```
1. FİKİR
   └── "Şu component'i denemek istiyorum"
   
2. PROTOTİP (5-15 dk)
   ├── Component dosyası oluştur
   ├── Shadcn/ui component'lerini kullan
   ├── Tailwind class'ları ekle
   └── Playground sayfasına ekle

3. TEST (2-5 dk)
   ├── npm run dev
   ├── Tarayıcıda aç
   ├── Görsel kontrol (responsive, dark mode, hover)
   └── Manual test (click, type, scroll)

4. KARAR
   ├── Beğendim → Ana projeye ekle
   ├── Beğenmedim → Sil veya düzelt
   └── Daha fazla deneme → Loop'ta kal
```

---

## Görsel Kontrol Listesi

### Desktop (1920x1080)

- [ ] Layout düzgün görünüyor mu?
- [ ] Renkler doğru mu? (contrast OK)
- [ ] Hover states çalışıyor mu?
- [ ] Focus states (tab navigation) görünüyor mu?
- [ ] Dark mode'da sorun yok mu?

### Tablet (768x1024)

- [ ] Responsive çalışıyor mu?
- [ ] Grid/Flex doğru wrap oluyor mu?
- [ ] Font size okunabilir mi?
- [ ] Butonlar tıklanabilir mi?

### Mobile (375x667)

- [ ] Horizontal scroll yok mu?
- [ ] Touch targets min 44x44px mi?
- [ ] Dropdown/dialog çalışıyor mu?
- [ ] Font size küçük değil mi (min 14px)?

---

## Toolchain (Minimal)

### Zorunlu Araçlar

- VS Code
- Tailwind CSS IntelliSense extension
- Chrome DevTools
- npm run dev

### Opsiyonel Araçlar

- BrowserStack (cross-browser test)
- Figma (design mockup)
- ColorZilla (color picker)

### Automation YOK

- Automated tests (overkill)
- CI/CD (solo dev)
- Visual regression (gözle kontrol yeterli)

---

## Öncelikli Geliştirmeler

### Phase 1: Temel Component'ler

| Component | Öncelik | Tahmini Süre |
|-----------|---------|--------------|
| Product Card | P0 | 15 dk |
| Price Tag | P0 | 10 dk |
| Quantity Selector | P0 | 15 dk |
| Add to Cart Button | P0 | 10 dk |
| Search Bar | P1 | 20 dk |
| Filter Sidebar | P1 | 30 dk |

### Phase 2: Layout Pattern'ler

| Pattern | Öncelik | Tahmini Süre |
|---------|---------|--------------|
| Grid Layout (Products) | P0 | 20 dk |
| Hero Section | P1 | 30 dk |
| Masonry Grid | P2 | 40 dk |
| Sticky Sidebar | P2 | 25 dk |
| Tab Navigation | P1 | 20 dk |

---

## Learning Path: Shadcn/ui Keşfi

### 1. Shadcn/ui Component'lerini İncele

```
src/components/ui/
- button.tsx
- card.tsx
- badge.tsx
- input.tsx
- dialog.tsx
- dropdown-menu.tsx
```

### 2. Her Component İçin:

1. Kodu oku - Nasıl çalışıyor?
2. Props'u anla - Ne parametre alıyor?
3. Styles'ı gör - Tailwind class'ları neler?
4. Playground'da dene - Farklı varyasyonları yap

### 3. Modern UI/UX Trendlerini Takip Et

- Dribbble (tasarım ilhamı)
- Awwwards (award-winning siteler)
- Mobbin (mobile app patterns)
- Tailwind UI (ready-to-use components)

---

## Deployment: Prod'a Taşı

### Component Beğendin → Ana Projeye Ekle

```bash
# 1. Component'i taşı
mv src/components/playground/ProductCard.tsx src/components/product/ProductCard.tsx

# 2. Index'e ekle
echo "export { ProductCard } from './product/ProductCard';" >> src/components/index.ts

# 3. Kullan
import { ProductCard } from '@/components/product/ProductCard';
```

### Sayfa Beğendin → Prod'a Ekle

```bash
# 1. Sayfayı taşı
mv src/app/playground/prototype-page.tsx src/app/new-feature/page.tsx

# 2. Route hazır
# http://localhost:3000/new-feature
```

---

## Summary

**Playground = Solo Dev Paradise**

- NO automation → Manual testing yeterli
- Hızlı iterasyon → Fikir → Prototip → Test
- Shadcn/ui → Copy-paste, learn, build
- Responsive → Mobile-first
- Dark mode → Color tokens kullan

**Goal:** Hızlı öğrenme, deneme, ilham alma.

**Sonraki Adım:** İlk component'i ekle → Test et → Beğen → Prod'a taşı.

---

*Happy coding! 🚀*
