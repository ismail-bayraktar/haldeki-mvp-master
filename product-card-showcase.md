# ProductCard Showcase - Animated Interactive Variations

**Goal:** Create a comprehensive playground showcase displaying animated, interactive ProductCard variations with different states, animations, and visual styles.

---

## Project Overview

### What We're Building
An interactive showcase page displaying 6+ ProductCard variations with different animation patterns, hover effects, and state demonstrations.

### Success Criteria
- [ ] 6+ distinct ProductCard variations visually working
- [ ] All animations smooth (60fps) with GPU acceleration
- [ ] Interactive controls to toggle animations/states
- [ ] Responsive grid layout for all variations
- [ ] Mock data matches real product structure
- [ ] Code snippets for each variation

### Tech Stack
- React 18 - Component architecture
- Tailwind CSS - Styling + custom keyframes
- Framer Motion - Advanced animations (optional)
- Lucide Icons - Iconography
- TypeScript - Type safety

---

## File Structure

```
src/
├── components/playground/
│   ├── ProductCardShowcase.tsx          # Main showcase container
│   ├── variations/
│   │   ├── BasicProductCard.tsx         # Current wrapper
│   │   ├── PremiumProductCard.tsx       # Gold/shine effects
│   │   ├── QuickViewCard.tsx            # Hover reveal details
│   │   ├── CompactCard.tsx              # Minimal dense layout
│   │   ├── AnimatedCard.tsx             # Micro-interactions
│   │   ├── FlipCard.tsx                 # 3D flip animation
│   │   └── DarkModeCard.tsx             # Dark theme variant
│   ├── controls/
│   │   ├── AnimationControls.tsx        # Toggle animations
│   │   ├── StateControls.tsx            # Switch states
│   │   └── ThemeControls.tsx            # Theme switcher
│   └── templates/
│       └── ProductCardShowcase.tsx      # Main template
├── lib/animations/
│   ├── keyframes.ts                     # Tailwind extensions
│   ├── animations.ts                    # Utilities
│   └── spring-physics.ts                # Motion physics
├── data/mock/
│   └── productData.ts                   # Mock products
└── types/
    └── showcase.ts                      # Showcase types
```

---

## Task Breakdown

### Phase 1: Setup & Foundation (5-7 min)

- [ ] **Task 1.1:** Create animation utilities
  - OUTPUT: src/lib/animations/keyframes.ts
  - VERIFY: Types compile, keyframes valid

- [ ] **Task 1.2:** Create mock product data
  - OUTPUT: src/data/mock/productData.ts with 8-10 products
  - VERIFY: Types match, includes all states

- [ ] **Task 1.3:** Extend Tailwind config
  - OUTPUT: Added shimmer, float, slide-up, 3d-flip, pulse-glow
  - VERIFY: Dev server restarts, animations apply

---

### Phase 2: Card Variations (15-20 min)

- [ ] **Task 2.1:** BasicProductCard wrapper
- [ ] **Task 2.2:** PremiumProductCard (gold border, shimmer)
- [ ] **Task 2.3:** QuickViewCard (hover reveal)
- [ ] **Task 2.4:** CompactCard (150px height, dense)
- [ ] **Task 2.5:** AnimatedCard (pulse, bounce, float)
- [ ] **Task 2.6:** FlipCard (3D flip to back)
- [ ] **Task 2.7:** DarkModeCard (dark theme)

---

### Phase 3: Controls (8-10 min)

- [ ] **Task 3.1:** AnimationControls (toggle switches)
- [ ] **Task 3.2:** StateControls (loading/error/success)
- [ ] **Task 3.3:** ThemeControls (light/dark)

---

### Phase 4: Main Showcase (10-12 min)

- [ ] **Task 4.1:** Build grid layout (responsive)
- [ ] **Task 4.2:** Add control panel sidebar
- [ ] **Task 4.3:** Add code snippet display
- [ ] **Task 4.4:** Add performance monitor (FPS)

---

### Phase 5: Polish (5-7 min)

- [ ] **Task 5.1:** Accessibility (reduced-motion, ARIA)
- [ ] **Task 5.2:** Optimize (GPU, will-change)
- [ ] **Task 5.3:** Documentation (JSDoc, examples)

---

## Animation Keyframes

Add to tailwind.config.ts:

```typescript
keyframes: {
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' }
  },
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' }
  },
  'slide-up': {
    '0%': { transform: 'translateY(20px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' }
  },
  '3d-flip': {
    '0%': { transform: 'rotateY(0deg)' },
    '100%': { transform: 'rotateY(180deg)' }
  },
  'pulse-glow': {
    '0%, 100%': { boxShadow: '0 0 5px rgba(0, 71, 49, 0.5)' },
    '50%': { boxShadow: '0 0 20px rgba(0, 71, 49, 0.8)' }
  }
}
```

---

## Component Props

```typescript
interface ProductCardVariationProps {
  product: Product;
  animationEnabled?: boolean;
  showQuickView?: boolean;
  compactMode?: boolean;
  onStateChange?: (state: CardState) => void;
}

type CardState = 'default' | 'loading' | 'error' | 'success' | 'disabled';
```

---

## Performance Targets

| Metric | Target | Measure |
|--------|--------|---------|
| FPS | 60fps | DevTools Performance |
| First Paint | < 1s | Lighthouse |
| Interaction | < 100ms | Performance observer |
| Bundle | < 50KB gz | webpack-bundle-analyzer |

---

## Accessibility

- [ ] prefers-reduced-motion disables animations
- [ ] role='article' or role='button'
- [ ] Keyboard focus-visible states
- [ ] aria-live for animated badges
- [ ] WCAG AA contrast (4.5:1)

---

## Done When

- [ ] 6+ card variations render correctly
- [ ] Animation controls work
- [ ] State switches work
- [ ] Code snippets display
- [ ] 60fps performance
- [ ] Reduced motion support
- [ ] Responsive layout
- [ ] TypeScript compiles
- [ ] Ready for frontend-specialist

---

## Notes

- Purple Ban: NO violet/purple colors
- Template Ban: Avoid standard layouts
- Brand Colors: Haldeki Green (#004631), Fresh Orange (#FF6B35)
- Non-Breaking: Original ProductCard.tsx unchanged
- Performance: Use will-change, transform, opacity
- Testing: Chrome, Firefox, Safari (mobile + desktop)
