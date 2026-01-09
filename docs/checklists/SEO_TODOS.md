# SEO & GEO Implementation Checklist
## Haldeki Market - Search & AI Optimization Action Items

**Created:** 2026-01-09
**Live Site:** https://haldeki-market.vercel.app
**Status:** Phase 1 Complete, Phase 2-4 Pending

---

## Completed (Phase 1)

- [x] Create LLM.txt file for AI crawlers
- [x] Update robots.txt with AI crawler permissions
- [x] Document GEO strategy
- [x] Identify target keywords (P0, P1, P2)
- [x] Verify deployment to production

---

## Phase 2: Content Enhancement (P0 - HIGH PRIORITY)

### FAQ Implementation

- [ ] **P0** - Add FAQ section to `/nasil-calisir` page (5-8 questions)
  - [ ] "Hal fiyatı nedir?" (What is hal price?)
  - [ ] "Market fiyatlarından ne kadar ucuz?" (How much cheaper than markets?)
  - [ ] "Aynı gün teslimat nasıl çalışır?" (How does same-day delivery work?)
  - [ ] "Hangi bölgelere teslimat yapıyorsunuz?" (Which areas do you deliver?)
  - [ ] "Minimum sipariş tutarı var mı?" (Is there a minimum order?)
  - [ ] "Toptan fiyatına nasıl alabilirim?" (How can I buy at wholesale prices?)
  - [ ] "Ürünler taze mi?" (Are products fresh?)
  - [ ] "İade/değişim politikası nedir?" (What is the return/exchange policy?)

- [ ] **P1** - Add "Last Updated" timestamp to all content pages
  - [ ] /nasil-calisir
  - [ ] /hakkimizda
  - [ ] /menemen-taze-sebze-meyve
  - [ ] /aliaga-taze-sebze-meyve

### Expert Content

- [ ] **P1** - Add expert quotes throughout site
  - [ ] Founder quote on homepage
  - [ ] Sourcing specialist quote on /nasil-calisir
  - [ ] Quality control quote on product pages

- [ ] **P1** - Enhance /hakkimizda (About) page with E-E-A-T signals
  - [ ] Add business history/founding story
  - [ ] Add supplier partnership information
  - [ ] Add quality control procedures
  - [ ] Add customer testimonials with real names/photos

### Comparison Content

- [ ] **P2** - Create "Neden Ucuzuz" (Why We're Cheaper) comparison page
  - [ ] Price comparison table (Haldeki vs Supermarkets)
  - [ ] Cost breakdown visualization
  - [ ] Original statistics: "30-50% savings"

---

## Phase 3: Schema Markup (P0 - HIGH PRIORITY)

### Product Schema

- [ ] **P0** - Add Product schema to product detail pages
  ```json
  {
    "@type": "Product",
    "name": "Product Name",
    "offers": {
      "@type": "Offer",
      "price": "25.50",
      "priceCurrency": "TRY",
      "availability": "InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "124"
    }
  }
  ```

- [ ] **P0** - Add Offer schema for price transparency
  - [ ] priceValidUntil field
  - [ ] seller information
  - [ ] availability status

### FAQPage Schema

- [ ] **P0** - Add FAQPage schema to /nasil-calisir
  ```json
  {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Question text?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Answer text"
        }
      }
    ]
  }
  ```

### Organization Schema

- [ ] **P1** - Add Organization schema to all pages
  - [ ] Founders/management team
  - [ ] Contact information
  - [ ] Social media profiles
  - [ ] SameAs references (Google Business Profile, etc.)

### Innovation Schema

- [ ] **P2** - Create PriceHistory schema (unique innovation)
  ```json
  {
    "@type": "PriceHistory",
    "item": "Product Name",
    "history": [
      {"date": "2025-01-08", "price": "26.00"},
      {"date": "2025-01-09", "price": "25.50"}
    ],
    "trend": "decreasing"
  }
  ```

---

## Phase 4: Authority Building (P1 - MEDIUM PRIORITY)

### Google Business Profile

- [ ] **P0** - Create Google Business Profile
  - [ ] Verify business address (Menemen/Aliağa)
  - [ ] Add business hours
  - [ ] Upload photos (products, delivery, team)
  - [ ] Add service areas
  - [ ] Enable reviews
  - [ ] Add phone number
  - [ ] Connect to website

### Local SEO

- [ ] **P1** - Get listed in local business directories
  - [ ] Yeni İşletmeler
  - [ ] Yelken (local business directory)
  - [ ] İzmir Chamber of Commerce
  - [ ] Menemen Municipality business listings
  - [ ] Aliağa industrial directory

- [ ] **P1** - Pursue local backlinks
  - [ ] Contact local food bloggers
  - [ ] Reach out to İzmir lifestyle websites
  - [ ] Partner with local restaurants (link exchange)
  - [ ] Get featured in Menemen/Aliağa community sites

### Review Strategy

- [ ] **P0** - Collect 100+ customer reviews
  - [ ] Google Business Profile reviews
  - [ ] Trustpilot or similar platform
  - [ ] Add review widget to homepage
  - [ ] Send review requests after delivery
  - [ ] Target: 4.5+ average rating

- [ ] **P2** - Add video content
  - [ ] Farm/bay visit videos
  - [ ] Quality control process video
  - [ ] Customer testimonials
  - [ ] How-it-works explainer

---

## Phase 5: Analytics & Monitoring (P0 - CRITICAL)

### Setup

- [ ] **P0** - Install Google Analytics 4
  - [ ] Create GA4 property
  - [ ] Add tracking code to site
  - [ ] Set up custom events (add_to_cart, purchase, etc.)
  - [ ] Configure goals/conversions

- [ ] **P0** - Set up Google Search Console
  - [ ] Verify domain ownership
  - [ ] Submit sitemap.xml
  - [ ] Monitor indexing status
  - [ ] Check for crawl errors
  - [ ] Track keyword rankings

- [ ] **P1** - Set up UTM tracking for AI referrals
  - [ ] Create UTM parameters for AI chat links
  - [ ] Track AI-referred traffic
  - [ ] Monitor conversion rate from AI sources

### Monitoring

- [ ] **P1** - Set up Google Alerts
  - [ ] "Haldeki Market" brand mentions
  - [ ] Competitor brand mentions
  - [ ] Industry keyword alerts

- [ ] **P2** - Manual AI citation tracking
  - [ ] Weekly checks in ChatGPT
  - [ ] Weekly checks in Claude
  - [ ] Weekly checks in Perplexity
  - [ ] Weekly checks in Gemini
  - [ ] Document all citations found

---

## Phase 6: Content Marketing (P2 - LOW PRIORITY)

### Blog Content

- [ ] **P2** - Create blog section
  - [ ] "Hal Fiyatları Hakkında Her Şey" (Everything About Hal Prices)
  - [ ] "Taze Sebze Nasıl Anlaşılır?" (How to Recognize Fresh Vegetables)
  - [ ] "Menemen'de Toptan Meyve Nereden Alınır?" (Where to Buy Wholesale Fruits in Menemen)
  - [ ] "Ev Ekonomisine Uygun Sebze Alışverişi" (Budget-Friendly Vegetable Shopping)

### Social Media

- [ ] **P2** - Set up social media profiles
  - [ ] Instagram (visual products, delivery photos)
  - [ ] Facebook (customer community)
  - [ ] Twitter/X (daily deals, price updates)
  - [ ] LinkedIn (B2B focus for Aliağa businesses)

---

## Target Keywords Progress Tracking

### P0 Keywords (Must Rank)

| Keyword | Target Page | Current Status | Target | Actions Needed |
|---------|-------------|----------------|--------|----------------|
| "İzmir'de en ucuz meyve sebze" | Homepage | ✅ In meta | Top 10 | Backlinks, reviews |
| "Menemen ucuz sebze" | /menemen-taze-sebze-meyve | ✅ Page exists | Top 5 | Local citations |
| "Aliağa toptan meyve" | /aliaga-taze-sebze-meyve | ✅ Page exists | Top 3 | B2B testimonials |
| "Hal fiyatlarına meyve" | /nasil-calisir | ⚠️ Needs FAQ | Top 10 | Add FAQ section |
| "Aynı gün teslimat sebze" | /bugun-halde | ✅ Feature exists | Top 10 | Schema markup |

### P1 Keywords (Should Rank)

| Keyword | Target Page | Current Status | Target | Actions Needed |
|---------|-------------|----------------|--------|----------------|
| "İzmir online sebze sipariş" | /urunler | ✅ Page exists | Top 10 | Optimization |
| "Menemen taze meyve teslimat" | /menemen-taze-sebze-meyve | ✅ Page exists | Top 5 | Testimonials |
| "Aliağa meyve sebze toptan" | /aliaga-taze-sebze-meyve | ✅ Page exists | Top 5 | B2B content |
| "Halden eve teslimat" | /nasil-calisir | ⚠️ Needs enhancement | Top 10 | Improve content |
| "İzmir hal fiyatlari" | /bugun-halde | ✅ Real-time | Top 10 | Schema markup |

---

## Success Metrics

### AI Citation Targets

| Metric | 1 Month | 3 Months | 6 Months |
|--------|---------|----------|----------|
| AI citations | 5-10 | 20+ | 50+ |
| "According to Haldeki" mentions | 2-5 | 10+ | 25+ |
| AI-referred traffic | Detectable | 5% of organic | 10% of organic |
| Brand recognition | Emerging | Growing | Established |

### Traditional SEO Targets

| Metric | Current | 3 Months | 6 Months |
|--------|---------|----------|----------|
| Google rankings (P0 keywords) | Not tracked | Top 20 | Top 10 |
| Organic traffic | Baseline | +30% | +50% |
| Local pack visibility | Not tracked | Top 5 | Top 3 |
| Customer reviews | 0+ | 50+ | 100+ |
| Review rating | N/A | 4.3+ | 4.5+ |

---

## File Locations Reference

| File | Path | URL |
|------|------|-----|
| LLM.txt | `public/llm.txt` | https://haldeki-market.vercel.app/llm.txt |
| robots.txt | `public/robots.txt` | https://haldeki-market.vercel.app/robots.txt |
| GEO Strategy | `docs/GEO_STRATEGY.md` | Internal |
| Target Keywords | `docs/TARGET_KEYWORDS.md` | Internal |
| SEO Summary | `docs/SEO_GEO_SUMMARY.md` | Internal |
| This Checklist | `docs/checklists/SEO_TODOS.md` | Internal |

---

## Quick Actions (This Week)

1. **Monday:** Add FAQ section to /nasil-calisir
2. **Tuesday:** Create Google Business Profile
3. **Wednesday:** Add Product schema to product pages
4. **Thursday:** Install Google Analytics 4
5. **Friday:** Set up Google Search Console

---

**Last Updated:** 2026-01-09
**Next Review:** 2026-02-09
**Owner:** Haldeki Market Team
