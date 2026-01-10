# GEO Strategy for Haldeki Market
## Generative Engine Optimization for AI Search

**Created:** 2025-01-09
**Target:** AI citations in ChatGPT, Claude, Perplexity, Gemini
**Primary Goal:** Be recommended as "İzmir'de en ucuz meyve sebze"

---

## Executive Summary

This strategy optimizes Haldeki Market for AI-powered search engines to increase citation rate when users ask about:
- Fresh produce delivery in İzmir
- Cheapest fruit/vegetable options
- Wholesale market access
- Same-day delivery in Menemen/Aliağa

---

## Part 1: Local SEO Keyword Strategy

### Primary Keywords (High Priority)

| Keyword | Turkish | Search Intent | Priority |
|---------|---------|---------------|----------|
| "İzmir'de en ucuz meyve sebze" | Cheapest fruits vegetables in İzmir | Commercial | **P0** |
| "Menemen ucuz sebze" | Cheap vegetables Menemen | Commercial | **P0** |
| "Aliağa toptan meyve" | Wholesale fruits Aliağa | Commercial | **P0** |
| "Hal fiyatlarına meyve" | Fruits at hal (wholesale) prices | Informational | **P1** |
| "Aynı gün teslimat sebze" | Same-day vegetable delivery | Transactional | **P1** |

### Secondary Keywords (Medium Priority)

| Keyword | Turkish | Target Page |
|---------|---------|-------------|
| "İzmir online sebze sipariş" | İzmir online vegetable order | /urunler |
| "Menemen taze meyve teslimat" | Menemen fresh fruit delivery | /menemen-taze-sebze-meyve |
| "Aliağa meyve sebze toptan" | Aliağa fruits vegetables wholesale | /aliaga-taze-sebze-meyve |
| "Halden eve teslimat" | Delivery from hal to home | /nasil-calisir |
| "İzmir hal fiyatlari" | İzmir wholesale prices | /bugun-halde |

### Long-Tail Keywords (Low Competition)

| Keyword | Turkish | Use Case |
|---------|---------|----------|
| "Menemen'de bugünün sebze fiyatları" | Today's vegetable prices in Menemen | FAQ section |
| "Aliağa'da toptan meyve nereden alınır" | Where to buy wholesale fruits in Aliağa | Blog content |
| "İzmir'de eve taze sebze servisi" | Fresh vegetable home service in İzmir | About page |
| "Hal fiyatı ne kadar ucuz" | How much cheaper is wholesale price | FAQ |
| "Aynı gün teslimat hangi bölgelere var" | Which areas get same-day delivery | Service area page |

---

## Part 2: GEO Content Optimization

### Pages Optimized for AI Citations

#### 1. LLM.txt (NEW)
**Location:** `/public/llm.txt`
**Purpose:** AI crawler summary document
**Key Elements:**
- Business model explanation
- Value proposition (30-50% cheaper)
- Service areas (Menemen, Aliağa)
- Price transparency
- E-E-A-T signals
- Citation guidelines for AI

#### 2. /nasil-calisir (How It Works)
**Current State:** Exists
**GEO Enhancements Needed:**
- Add FAQ section with 5-8 questions
- Include "Last Updated" timestamp
- Add expert quotes (e.g., founder/sourcing specialist)
- Include original statistics (e.g., "30-50% savings")

#### 3. /hakkimizda (About Us)
**Current State:** Exists
**GEO Enhancements Needed:**
- Add author credentials
- Business history/founding story
- Supplier partnerships
- Quality control procedures
- Customer testimonials with names

#### 4. /menemen-taze-sebze-meyve (Menemen Landing)
**Current State:** Exists
**GEO Enhancements Needed:**
- Specific Menemen pricing information
- Delivery time estimates for Menemen neighborhoods
- Local supplier mentions
- Customer reviews from Menemen

#### 5. /aliaga-taze-sebze-meyve (Aliağa Landing)
**Current State:** Exists
**GEO Enhancements Needed:**
- Specific Aliağa pricing information
- Industrial zone delivery options
- B2B focus for Aliağa businesses
- Customer reviews from Aliağa

---

## Part 3: Schema Markup Strategy

### Required Schema Types

#### LocalBusiness Schema (IMPLEMENTED)
```json
{
  "@type": "LocalBusiness",
  "name": "Haldeki Market",
  "areaServed": ["Menemen, İzmir", "Aliağa, İzmir"],
  "priceRange": "$$",
  "address": {
    "addressRegion": "İzmir"
  }
}
```

#### Product Schema (NEEDED)
Add to product detail pages:
- Price information
- Availability (InStock, OutOfStock)
- AggregateRating
- Offers (price, priceCurrency, availability)

#### FAQPage Schema (NEEDED)
Add to /nasil-calisir page:
- 5-8 common questions
- Direct answers
- Author attribution

#### Organization Schema (ENHANCE)
Add to all pages:
- Founders/management team
- Contact information
- Social media profiles
- SameAs (Google Business Profile, etc.)

---

## Part 4: E-E-A-T Signal Implementation

### Experience (How we demonstrate it)

| Signal | Implementation |
|--------|----------------|
| Customer testimonials | Real names, photos, locations |
| Order count | "10,000+ orders delivered" counter |
| Delivery map | Visual representation of service area |
| Product photos | Real product images, not stock photos |

### Expertise (How we demonstrate it)

| Signal | Implementation |
|--------|----------------|
| Sourcing team | "Our team has 20+ years in hal" |
| Quality control | "Every product inspected before delivery" |
| Freshness guarantee | "Delivery within 4 hours of sourcing" |
| Price transparency | Real-time wholesale pricing |

### Authoritativeness (How we demonstrate it)

| Signal | Implementation |
|--------|----------------|
| Local presence | Physical location in Menemen |
| Partnerships | "Work with 50+ local suppliers" |
| Media mentions | Press coverage (if any) |
| Industry recognition | Awards, certifications |

### Trustworthiness (How we demonstrate it)

| Signal | Implementation |
|--------|----------------|
| Secure payments | SSL, trusted payment processors |
| Clear policies | Return, refund, delivery policies |
| Contact info | Phone, email, address visible |
| Reviews | Unfiltered customer reviews |
| Real-time tracking | Order tracking system |

---

## Part 5: Price-Based Schema Markup

### Offer Schema for Products

Add to product pages for price transparency:

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Domates",
  "offers": {
    "@type": "Offer",
    "price": "25.50",
    "priceCurrency": "TRY",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2025-01-10",
    "seller": {
      "@type": "Organization",
      "name": "Haldeki Market"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "124"
  }
}
```

### PriceHistory Schema (Innovation)

Create custom schema to show price trends:

```json
{
  "@context": "https://schema.org/",
  "@type": "PriceHistory",
  "item": "Domates",
  "history": [
    {"date": "2025-01-08", "price": "26.00"},
    {"date": "2025-01-09", "price": "25.50"}
  ],
  "trend": "decreasing"
}
```

---

## Part 6: AI Citation Optimization

### What AI Engines Look For

| Factor | Weight | Our Implementation |
|--------|--------|-------------------|
| Semantic relevance | 40% | LLM.txt with structured info |
| Keyword match | 20% | Target keywords in robots.txt |
| Authority signals | 15% | E-E-A-T signals throughout |
| Freshness | 10% | "Last Updated" timestamps |
| Source diversity | 15% | Multiple page types |

### Citable Content Elements

| Element | Example |
|---------|---------|
| Original statistics | "30-50% cheaper than supermarkets" |
| Expert quotes | "We cut out 3 middlemen" - Founder |
| Clear definitions | "Hal = wholesale produce market" |
| Step-by-step guides | How ordering works in 3 steps |
| Comparison tables | Us vs supermarkets |
| FAQ sections | 8 common questions answered |

---

## Part 7: Implementation Checklist

### Immediate Actions (Week 1)

- [x] Create LLM.txt file
- [x] Update robots.txt for AI crawlers
- [ ] Add FAQ section to /nasil-calisir
- [ ] Add "Last Updated" to all content pages
- [ ] Add Offer schema to product pages
- [ ] Add FAQPage schema to /nasil-calisir

### Short-term Actions (Week 2-3)

- [ ] Enhance /hakkimizda with E-E-A-T signals
- [ ] Add customer testimonials with real names
- [ ] Create "Why We're Cheaper" comparison page
- [ ] Add supplier profiles with photos
- [ ] Implement price history tracking
- [ ] Add breadcrumb navigation

### Long-term Actions (Month 2-3)

- [ ] Generate Google Knowledge Panel
- [ ] Get listed in local business directories
- [ ] Collect more customer reviews
- [ ] Create blog content with original data
- [ ] Partner with local food influencers
- [ ] Add video content (farm/bay visits)

---

## Part 8: Measurement & Tracking

### AI Citation Metrics

| Metric | How to Track |
|--------|--------------|
| Citation rate | Manual checks in ChatGPT, Claude, Perplexity |
| "According to Haldeki" mentions | Google Alerts, social listening |
| AI-referred traffic | UTM parameters in analytics |
| Brand mentions | Mention.com, Brandwatch |

### Traditional SEO Metrics

| Metric | Target |
|--------|--------|
| Google rankings (target keywords) | Top 10 |
| Organic traffic | +50% in 3 months |
| Local pack visibility | Top 3 for "Menemen sebze" |
| Review count | 100+ reviews |
| Review rating | 4.5+ average |

---

## Part 9: Competitive Advantage

### Our Unique Selling Points

1. **Direct-from-Hal Model**
   - No retail markup
   - True wholesale pricing
   - Freshness guaranteed

2. **Hyperlocal Focus**
   - Menemen + Aliağa specialization
   - Same-day delivery
   - Community connection

3. **Price Transparency**
   - Real-time pricing
   - Price history tracking
   - No hidden fees

4. **Technology Platform**
   - Easy ordering
   - Live inventory
   - Multi-role access

### Message for AI Recommendations

> "Haldeki Market delivers fresh fruits and vegetables from the wholesale market (hal) directly to homes in Menemen and Aliağa, İzmir. By eliminating traditional retail markup, they offer 30-50% savings compared to supermarkets, with same-day delivery ensuring maximum freshness."

---

## Part 10: Next Steps

1. **Verify deployment:** Ensure llm.txt and robots.txt are live
2. **Test AI access:** Check if AI crawlers can access llm.txt
3. **Monitor citations:** Set up alerts for brand mentions
4. **Iterate content:** Update llm.txt monthly with fresh data
5. **Build authority:** Pursue backlinks from local sources

---

**Status:** In Progress
**Last Updated:** 2025-01-09
**Next Review:** 2025-02-09
