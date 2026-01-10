# Quick Start: Yeni Component Ekleme

> **Süre:** 5 dakika  
> **Level:** Beginner  
> **Araçlar:** VS Code + Terminal

---

## Adım 1: Component Dosyası Oluştur (30 saniye)

```bash
# Terminal
touch src/components/playground/YeniComponent.tsx
```

---

## Adım 2: Component Kodunu Yaz (3 dakika)

```tsx
// src/components/playground/YeniComponent.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * YeniComponent - Açıklama buraya
 * Amaç: Ne işe yarıyor?
 */

export function YeniComponent() {
  return (
    <section>
      <h3 className="text-lg font-bold text-foreground mb-4">
        Component Adı
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Variant 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Varyasyon 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">İçerik buraya</p>
            <Button className="mt-4">Buton</Button>
          </CardContent>
        </Card>

        {/* Variant 2 */}
        <Card>
          <CardHeader>
            <Badge>Varyasyon 2</Badge>
            <CardTitle className="mt-2">Başlık</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">İçerik buraya</p>
          </CardContent>
        </Card>

        {/* Variant 3 */}
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Varyasyon 3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Farklı stil</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
```

---

## Adım 3: Export'a Ekle (30 saniye)

```tsx
// src/components/playground/index.ts
export { YeniComponent } from './YeniComponent';
```

---

## Adım 4: Playground Sayfasına Ekle (1 dakika)

```tsx
// src/app/playground/page.tsx

import { 
  TokenShowcase, 
  CoreUI, 
  AIReviewPanel,
  YeniComponent  // <-- Bunu ekle
} from '@/components/playground';

export default function PlaygroundPage() {
  return (
    <div className="container mx-auto py-8 space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2">Component Playground</h1>
        <p className="text-muted-foreground">
          UI components, design tokens, and patterns
        </p>
      </div>

      <TokenShowcase />
      <CoreUI />
      <AIReviewPanel />
      <YeniComponent />  {/* <-- Bunu ekle */}
    </div>
  );
}
```

---

## Adım 5: Test Et (30 saniye)

```bash
# Terminal
npm run dev

# Tarayıcıda aç
http://localhost:3000/playground
```

### Görsel Kontrol Checklist

- [ ] Component görünüyor mu?
- [ ] Desktop'ta düzgün mü?
- [ ] Mobile'da responsive mi? (tarayıcıyı küçült)
- [ ] Dark mode'da çalışıyor mu? (dark mode toggle)
- [ ] Hover var mı? (mouse ile üzerine gel)

---

## Tamamlandı! 🎉

Component hazır. Şimdi yapabilirsin:

1. **Varyasyonlar ekle** - Farklı stiller dene
2. **Prod'a taşı** - Beğenince ana projeye ekle
3. **Sil ve baştan başla** - Beğenmediysen yenisini dene

---

## Örnek Component'ler

İlham almak için:

```bash
# Mevcut component'leri incele
cat src/components/playground/CoreUI.tsx
cat src/components/playground/TokenShowcase.tsx
cat src/components/playground/AIReviewPanel.tsx
```

---

## Sorun mu var?

| Sorun | Çözüm |
|-------|-------|
| Component görünmüyor | Export'u kontrol et |
| Stil bozuk | Tailwind class'larını kontrol et |
| Hata var | Terminal'de error mesajını oku |
| Responsive çalışmıyor | `md:` `lg:` prefix'leri ekle |

---

*Happy coding! 🚀*
