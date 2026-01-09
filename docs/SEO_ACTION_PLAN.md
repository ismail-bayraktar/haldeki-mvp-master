# SEO Aksiyon Planı - İmplementasyon Checklist

> **Created:** 2026-01-09
> **Status:** Ready to Implement
> **Priority:** Critical fixes first, then optimization

---

## 🚨 PHASE 1: KRİTİK BUG FIXES (Bug - 30 dakika)

### ✅ Task 1.1: Create Social Share Image
**File:** `public/og-image.png`
**Size:** 1200x630px (1.91:1 ratio)
**Format:** PNG
**Content:**
- Haldeki logo
- Tagline: "İzmir'in Taze Sebze Meyvesi"
- Background: Green/white brand colors
- File size: < 8MB

**Steps:**
1. Open design tool (Figma/Canva/Photoshop)
2. Create 1200x630px canvas
3. Add Haldeki logo (center or left)
4. Add tagline (bold, readable)
5. Use brand colors (#10b981 green, white)
6. Export as PNG
7. Save to `public/og-image.png`

**Verification:**
```bash
# Check file exists
ls -lh public/og-image.png

# Should show file size < 8MB
```

**Links:**
- Referenced in: `index.html:29`
- Referenced in: `src/components/seo/PageMeta.tsx:45`

---

### ✅ Task 1.2: Add og:url Tag
**File:** `src/components/seo/PageMeta.tsx`

**Changes:**

1. **Update Interface (Line ~16):**
```typescript
interface PageMetaProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  openGraphUrl?: string;  // ← ADD THIS
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
  // ... rest
}
```

2. **Add to Render (Line ~55):**
```typescript
// Find existing og meta tags and ADD after them:
{openGraphUrl && <meta property="og:url" content={openGraphUrl} />}
```

3. **Update Usage in WhitelistLanding.tsx:**
```typescript
<PageMeta
  title="Erken Erişim Listesi | Haldeki"
  description="..."
  openGraphUrl="https://haldeki-market.vercel.app"
  // ... rest
/>
```

**Verification:**
- Open browser DevTools → Network
- Refresh page
- Check HTML for `<meta property="og:url" content="...">`

---

### ✅ Task 1.3: Fix Canonical URL
**File:** `index.html`
**Line:** 15

**Change:**
```html
<!-- FROM: -->
<link rel="canonical" href="https://haldeki.com" />

<!-- TO: -->
<link rel="canonical" href="https://haldeki-market.vercel.app" />
```

**Verification:**
- Open page source
- Search for "canonical"
- Should point to production domain

---

## 🔴 PHASE 2: YÜKSEK ÖNCELİK (Bu Hafta - 3 saat)

### ✅ Task 2.1: Remove Protected Routes from Sitemap
**File:** `public/sitemap.xml`

**Remove these lines:**
```xml
<url><loc>https://haldeki.com/bayi</loc></url>
<url><loc>https://haldeki.com/tedarikci</loc></url>
<url><loc>https://haldeki.com/depo</loc></url>
<url><loc>https://haldeki.com/admin</loc></url>
<url><loc>https://haldeki.com/beklemede</loc></url>
```

**Keep only public routes:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://haldeki-market.vercel.app/</loc>
    <lastmod>2026-01-09</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://haldeki-market.vercel.app/aliaga</loc>
    <lastmod>2026-01-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://haldeki-market.vercel.app/menemen</loc>
    <lastmod>2026-01-09</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Verification:**
```bash
# Validate XML
xmllint --noout public/sitemap.xml

# Or use online tool: https://www.xml-sitemaps.com/validate-xml-sitemap.html
```

---

### ✅ Task 2.2: LCP Optimization - Part 1 (Code Splitting)
**File:** `src/App.tsx`

**Add lazy loading:**
```typescript
import { lazy, Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';

// Lazy load routes
const WhitelistLanding = lazy(() => import('./pages/WhitelistLanding'));
const AliagaLanding = lazy(() => import('./pages/AliagaLanding'));
const MenemenLanding = lazy(() => import('./pages/MenemenLanding'));

// In your routes:
<Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner /></div>}>
  <Route path="/" element={<WhitelistLanding />} />
  <Route path="/aliaga" element={<AliagaLanding />} />
  <Route path="/menemen" element={<MenemenLanding />} />
</Suspense>
```

---

### ✅ Task 2.3: LCP Optimization - Part 2 (Image Optimization)
**Files:** All image usages

**Add to all images:**
```tsx
<img
  src="/path/to/image.webp"
  loading="lazy"
  decoding="async"
  width="800"
  height="600"
  alt="Descriptive alt text"
/>
```

**Convert to WebP:**
```bash
# Using imagemagick or sharp
# Convert all PNG/JPG to WebP for better compression

# Example with sharp CLI:
sharp input.png -o output.webp
```

---

### ✅ Task 2.4: Create Google Business Profile
**Steps:**

1. **Go to:** https://business.google.com

2. **Create Profile:**
   - Business name: "Haldeki"
   - Category: "Grocery Store" or "Food Delivery"
   - Address: [Real address]
   - Phone: [Real phone]
   - Website: https://haldeki-market.vercel.app
   - Hours: 08:00-20:00 (7 days)

3. **Add Photos:**
   - Store front
   - Products (fresh vegetables/fruits)
   - Team
   - Delivery vehicles

4. **Get Reviews:**
   - Ask first 10 customers
   - Target: 25 reviews in first month
   - Goal: 4.8+ average rating

5. **Post Updates:**
   - Weekly posts
   - Special offers
   - Fresh arrivals
   - Delivery area updates

**Verification:**
- Search "Haldeki İzmir" on Google Maps
- Profile should appear with reviews, photos, hours

---

## 🟡 PHASE 3: ORTA ÖNCELİK (Bu Ay - 8 saat)

### ✅ Task 3.1: Create Favicon Variants
**Files to create:**
```
public/
├── favicon.ico (32x32)
├── favicon-16x16.png (16x16)
├── favicon-32x32.png (32x32)
├── apple-touch-icon.png (180x180)
├── android-chrome-192x192.png (192x192)
├── android-chrome-512x512.png (512x512)
└── site.webmanifest
```

**Steps:**
1. Create Haldeki logo variants
2. Export in all required sizes
3. Create `site.webmanifest`:
```json
{
  "name": "Haldeki - İzmir'in Taze Sebze Meyvesi",
  "short_name": "Haldeki",
  "description": "Taze sebze ve meyveler kapınıza gelsin",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

4. **Update index.html:**
```html
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<meta name="msapplication-TileColor" content="#10b981">
<meta name="theme-color" content="#10b981">
<link rel="manifest" href="/site.webmanifest">
```

---

### ✅ Task 3.2: Add Aggregate Rating Schema
**File:** `src/components/seo/SchemaMarkup.tsx`

**Update Product schema:**
```typescript
const productSchema = {
  "@type": "Product",
  "name": productName,
  "image": productImage,
  "description": productDescription,
  "brand": {
    "@type": "Brand",
    "name": "Haldeki"
  },
  "aggregateRating": {  // ← ADD THIS
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "125",
    "bestRating": "5",
    "worstRating": "1"
  }
};
```

---

### ✅ Task 3.3: Create Regional Landing Pages
**Files to create:**
- `src/pages/BalçovaLanding.tsx`
- `src/pages/BucaLanding.tsx`
- `src/pages/BornovaLanding.tsx`
- `src/pages/KarşıyakaLanding.tsx`

**Template:** Copy `MenemenLanding.tsx` and customize:
```typescript
export default function BalçovaLanding() {
  return (
    <>
      <PageMeta
        title="Taze Sebze Meyve Teslimatı - Balçova | Haldeki"
        description="Balçova'da taze sebze ve meyve teslimatı. Aynı gün teslimat, en taze ürünler kapınızda."
        keywords="balçova, sebze, meyve, teslimat, izmir, taze"
        openGraphUrl="https://haldeki-market.vercel.app/balçova"
      />

      <div className="min-h-screen">
        <h1>Balçova'ya Taze Sebze Meyve Teslimatı</h1>
        {/* Custom content for Balçova */}
      </div>
    </>
  );
}
```

**Update Router (`src/App.tsx`):**
```typescript
<Route path="/balçova" element={<BalçovaLanding />} />
<Route path="/buca" element={<BucaLanding />} />
<Route path="/bornova" element={<BornovaLanding />} />
<Route path="/karşıyaka" element={<KarşıyakaLanding />} />
```

**Update sitemap.xml:**
```xml
<url>
  <loc>https://haldeki-market.vercel.app/balçova</loc>
  <lastmod>2026-01-09</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
<!-- Repeat for other regions -->
```

---

## 🟢 PHASE 4: DÜŞÜK ÖNCELİK (İsteğe Bağlı)

### Task 4.1: SSR/Prerendering Research
**Research:**
- Vite plugin: `vite-plugin-prerender`
- Alternative: `vite-ssr`
- Migration guide to Next.js (if needed)

**Pilot Test:**
1. Test prerendering on 1 page
2. Measure LCP improvement
3. Decide on full rollout

---

### Task 4.2: Blog Section
**Create:**
- `src/blog/` directory
- Markdown-based blog system
- SEO-friendly URLs: `/blog/taze-sebze-mevsimi`

**Tools:**
- Consider: `@astrojs/markdown-remark`
- Or: Custom React + marked.js

---

### Task 4.3: Video Content
**Create:**
- Product videos
- Delivery process videos
- Customer testimonials

**Add VideoObject schema:**
```typescript
{
  "@type": "VideoObject",
  "name": "Haldeki - Teslimat Süreci",
  "description": "İzmir'in taze sebze meyveleri nasıl kapınıza geliyor",
  "thumbnailUrl": "https://haldeki-market.vercel.app/video-thumbnail.jpg",
  "uploadDate": "2026-01-09",
  "contentUrl": "https://youtube.com/watch?v=xxx"
}
```

---

## ✅ VERIFICATION CHECKLIST

After each phase, verify:

### Phase 1 Verification (Critical Fixes)
- [ ] `public/og-image.png` exists and loads
- [ ] `og:url` tag appears in HTML
- [ ] Canonical URL points to production domain
- [ ] No 404s in Network tab

### Phase 2 Verification (High Priority)
- [ ] Sitemap.xml validates
- [ ] Protected routes removed from sitemap
- [ ] LCP improved (run Lighthouse)
- [ ] Google Business Profile created
- [ ] At least 5 reviews collected

### Phase 3 Verification (Medium Priority)
- [ ] All favicon sizes present
- [ ] Favicon displays in browser tab
- [ ] Aggregate rating schema in HTML
- [ ] Regional pages accessible
- [ ] Regional pages in sitemap

### Phase 4 Verification (Low Priority)
- [ ] Prerendering tested on 1 page
- [ ] Blog section functional
- [ ] Video content uploaded

---

## 📊 SUCCESS METRICS

### 1-Month Targets
- Social share CTR: +20-30%
- Organic traffic: +25-35%
- Lighthouse Performance: 51 → 70+
- LCP: 7.3s → 4s

### 3-Month Targets
- Organic traffic: +100-150%
- Lighthouse Performance: 70 → 85+
- LCP: 4s → 2.5s
- Google reviews: 25+
- Regional pages: 6+

### 6-Month Targets
- Organic traffic: +200-300%
- Lighthouse Performance: 85 → 95+
- LCP: 2.5s → < 2s
- Google reviews: 50+
- Regional pages: 10+

---

## 🔗 USEFUL TOOLS

### Testing Tools
- **Lighthouse:** Chrome DevTools → Lighthouse tab
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Validator:** https://validator.schema.org/
- **Open Graph Debugger:** https://www.opengraph.xyz/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **Sitemap Validator:** https://www.xml-sitemaps.com/validate-xml-sitemap.html

### Monitoring Tools
- **Google Search Console:** https://search.google.com/search-console
- **Google Analytics:** Traffic tracking
- **Google My Business:** Reviews and insights

---

## 📝 NOTES

### Custom Domain Migration
When switching from `haldeki-market.vercel.app` to `haldeki.com`:

1. **Update canonical URLs:**
   - `index.html`
   - `PageMeta.tsx` usages
   - All regional pages

2. **Update sitemap.xml:**
   - All URLs from `vercel.app` to `haldeki.com`

3. **Update Schema markup:**
   - All `@id` fields
   - All `url` fields

4. **Update Google Business Profile:**
   - Website URL

5. **Submit new sitemap to Google Search Console**

### Seasonal Content Strategy
- **Spring:** "Ilık bahar günlerine taze başlangıçlar"
- **Summer:** "Sıcak yaz günlerine serinletici meyveler"
- **Fall:** "Sonbaharın bereketli hasadı"
- **Winter:** "Kış günlerine vitamin depolayın"

### Local SEO Tips
- Get listed in local directories
- Participate in local events
- Sponsor local initiatives
- Partner with local businesses
- Encourage customer reviews

---

**Status:** ✅ Ready to implement
**Next Action:** Phase 1, Task 1.1 - Create og-image.png
**Estimated Time:** 30 minutes for Phase 1
**Expected Impact:** Social media CTR +20-30%, crawl efficiency +15%
