# FAZ 1.1: Recharts Lazy Load - Detaylı Implementasyon Planı

> Ana Yol Haritası: [FAZ 1-2-3 Yol Haritası](../../faz-1-2-3-yol-haritasi.md)
> Oluşturma Tarihi: 2026-01-10
> Durum: Planlama Asaması - Implementasyona Hazir

---

## Ozet

**Amaç:** Dashboard sayfalarindaki Recharts kutuphanesini lazy load ile Yukleyerek ilk Yukleme suresini en az 200ms azaltmak.

**Is Degeri:**
- Dashboard ilk açiliş suresi ↓ (hizli UX)
- Daha kucuk main bundle boyutu
- Chart sadece ihtiyaç duyulduğunda Yuklenir

---

## Mevcut Durum Analizi

### Recharts Kullanim Patternleri

**Dosya:** src/pages/admin/Dashboard.tsx
- SATIR 12: Direkt import (PROBLEM)
- SATIR 206-232: BarChart kullanimi
- SATIR 250-285: AreaChart kullanimi

### Bundle Size Impact (Olceklecek)

| Metrik | Oncesi (Tahmin) | Sonrasi (Hedef) |
|--------|-----------------|-----------------|
| Dashboard.js | ~150 KB | ~50 KB |
| Ilk Yukleme (FCP) | ~800ms | ~600ms |

---

## Implementasyon Adimlari

### ADIM 1: LazyChart Wrapper Component Olustur

**Dosya:** src/components/charts/LazyChart.tsx (YENI)

```typescript
import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load Recharts components
export const LazyAreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })));
export const LazyBarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
export const LazyLineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
export const LazyPieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart })));

// Sub-components (non-lazy)
export { Area, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Skeleton loading component
interface ChartSkeletonProps {
  height?: string | number;
}

const ChartSkeleton = ({ height = 250 }: ChartSkeletonProps) => (
  <div className="animate-pulse" style={{ height }}>
    <div className="h-full bg-muted/20 rounded-md flex items-center justify-center">
      <div className="text-muted-foreground text-sm">Yukleniyor...</div>
    </div>
  </div>
);

// Main wrapper
interface LazyChartWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string | number;
}

export const LazyChartWrapper = ({ children, fallback, height = 250 }: LazyChartWrapperProps) => (
  <Suspense fallback={fallback || <ChartSkeleton height={height} />}>
    {children}
  </Suspense>
);
```

---

### ADIM 2: Admin Dashboard Guncelle

**Dosya:** src/pages/admin/Dashboard.tsx

**Import Degisikligi (SATIR 12):**
```typescript
// ONCESI:
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// SONRASI:
import { LazyAreaChart, LazyBarChart, LazyChartWrapper, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "@/components/charts/LazyChart";
```

**BarChart Wrapper (SATIR 206):**
```typescript
<LazyChartWrapper height={250}>
  <ResponsiveContainer width="100%" height="100%">
    <LazyBarChart data={chartData}>
      {/* ... ayni kaliyor ... */}
    </LazyBarChart>
  </ResponsiveContainer>
</LazyChartWrapper>
```

**AreaChart Wrapper (SATIR 250):**
```typescript
<LazyChartWrapper height={250}>
  <ResponsiveContainer width="100%" height="100%">
    <LazyAreaChart data={chartData}>
      {/* ... ayni kaliyor ... */}
    </LazyAreaChart>
  </ResponsiveContainer>
</LazyChartWrapper>
```

---

### ADIM 3: Vite Config Guncelle (Opsiyonel)

**Dosya:** vite.config.ts (SATIR 30-58)

```typescript
manualChunks: (id) => {
  // Recharts icin ayri chunk
  if (id.includes('recharts')) {
    return 'charts';
  }
  // ... diger kurallar ayni ...
}
```

**Not:** TDZ hatasi alirsan bu adimi atla.

---

### ADIM 4: Test Etme

#### 4.1 Development Test
```bash
npm run dev
```
- [ ] Dashboard aciliyor
- [ ] Skeleton gorunuyor
- [ ] Chartlar Yukleniyor
- [ ] Console hatasi yok

#### 4.2 Build Test
```bash
npm run build
```
- [ ] Build basarili
- [ ] charts.*.js chunk var
- [ ] TypeScript hatasi yok

#### 4.3 Production Test
```bash
npm run preview
```
- [ ] Dashboard aciliyor
- [ ] Network tabda chunk Yukleniyor
- [ ] Console hatasi yok

---

### ADIM 5: Performans Olcumu

#### Bundle Size Karsilastirmasi

**Oncesi:**
```bash
npm run build
# dist/assets/AdminDashboard.*.js boyutunu not et
```

**Sonrasi:**
```bash
npm run build
# dist/assets/AdminDashboard.*.js boyutunu not et
# dist/assets/charts.*.js boyutunu not et
```

**Hedef:**
- AdminDashboard.js: ~150 KB -> ~50 KB
- charts.js: YENI ~100 KB

---

## Test Checklist

### Fonksiyonel Testler

| Test | Durum |
|------|-------|
| Dashboard aciliyor | ⬜ |
| BarChart Yukleniyor | ⬜ |
| AreaChart Yukleniyor | ⬜ |
| Tooltip calisiyor | ⬜ |
| Responsive calisiyor | ⬜ |
| Console hatasi yok | ⬜ |

### Performans Testler

| Metrik | Oncesi | Sonrasi | Hedef |
|--------|--------|---------|-------|
| AdminDashboard.js | ~150 KB | __ KB | ~50 KB |
| Ilk Yukleme (FCP) | ~800ms | __ ms | ~600ms |

### Build Testler

| Test | Durum |
|------|-------|
| npm run build basarili | ⬜ |
| TypeScript hatasi yok | ⬜ |
| Main bundle kuculdu | ⬜ |
| Recharts ayri chunk | ⬜ |

---

## Rollback Plani

### Hizli Geri Al
```bash
git checkout HEAD -- src/pages/admin/Dashboard.tsx
git checkout HEAD -- vite.config.ts
rm src/components/charts/LazyChart.tsx
```

### Feature Flag (Alternatif)
```typescript
const USE_LAZY_CHARTS = false; // Geri almak icin false yap
```

---

## Dosya Degisiklikleri Ozeti

| Dosya | Islem | Satir Degisikliği |
|-------|-------|-------------------|
| src/components/charts/LazyChart.tsx | YENI | ~60 satir |
| src/pages/admin/Dashboard.tsx | GUNCELLE | ~5 satir |
| vite.config.ts | GUNCELLE | +3 satir (opsiyonel) |

---

## Implementasyon Sirasi

1. [ ] src/components/charts/ klasoru olustur
2. [ ] LazyChart.tsx dosyasini yaz
3. [ ] admin/Dashboard.tsx importlari guncelle
4. [ ] admin/Dashboard.tsx chart wrapperlarini ekle
5. [ ] vite.config.ts guncelle (opsiyonel)
6. [ ] npm run dev ile test et
7. [ ] npm run build ile build test
8. [ ] Bundle size olc
9. [ ] Lighthouse test
10. [ ] Diger dashboardlari guncelle (gerekirse)

---

## Notlar

### Onemli Noktalar

1. **TDZ Hatası:** Eğer import('recharts').then() patterni TDZ hatası verirse, alternatif yaklaşim kullan.

2. **TypeScript:** Lazy components icin proper type export:
   ```typescript
   export type { BarChartProps, AreaChartProps } from 'recharts';
   ```

3. **Suspense Boundary:** Her chart icin ayri Suspense veya tek global Suspense.

4. **Preloading (Opsiyonel):** Kullanici dashboarda gitmeden once preload yapilabilir.

### Diger Dashboardlar

Bu implementasyondan sonra ayni patterni diger dashboardlara uygula:
- src/pages/dealer/DealerDashboard.tsx
- src/pages/business/BusinessDashboard.tsx
- src/pages/supplier/SupplierDashboard.tsx
- src/pages/warehouse/WarehouseDashboard.tsx

**Ancak once:** Sadece admin/Dashboard.tsx ile test et ve performansi olc.

---

## Ilgili Kaynaklar

- React.lazy Documentation: https://react.dev/reference/react/lazy
- Suspense Documentation: https://react.dev/reference/react/Suspense
- Vite Code Splitting: https://vitejs.dev/guide/build.html#code-splitting
- Recharts GitHub: https://github.com/recharts/recharts

---

## Faz Bitis Kontrolu

Bu faz tamamlandiginda:

- [x] LazyChart componenti olusturuldu
- [x] Admin Dashboard guncellendi
- [x] Build basarili
- [x] Bundle size azaldi
- [x] Performans artti (olcildi)
- [x] Tum testler gecti
- [x] Rollback plani hazir

**Sonraki Faz:** FAZ 1.2: Image Optimizasyonu

---

**Son Guncelleme:** 2026-01-10
**Durum:** Implementasyona Hazir
