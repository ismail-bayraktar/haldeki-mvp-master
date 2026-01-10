# Variant Selector Implementation Plan

## Goal
ProductCard üzerinde varyasyonları göstermek için animasyonlu açılır bir selector bileşeni oluşturmak. Fiyatın yanındaki '+' iconuna hover yapıldığında icon 90 derece dönecek ve tıklandığında yukarı doğru varyasyon listesi açılacak.

## Component Architecture

```
ProductCard
└── VariantSelector (NEW)
    ├── VariantButton (trigger)
    │   ├── Icon (Plus/Rotating)
    │   └── Price display
    └── VariantList (popover)
        └── VariantItem (multiple)
```

## Technical Approach

### State Management
```typescript
interface VariantSelectorState {
  isOpen: boolean;
  selectedVariant: ProductVariant | null;
  position: { top: number; left: number }; // For popover positioning
}
```

### Animation Strategy
- **CSS Transitions** (Recommended): Simple, performant, no additional dependencies
- Uses `transform` and `opacity` for 60fps GPU-accelerated animations
- Respects `prefers-reduced-motion` for accessibility

## Tasks

### Phase 1: Create Base Components (15 min)

- [ ] **Task 1: Create VariantSelector component**
  - Create `src/components/playground/variations/VariantSelector.tsx`
  - Add state management for open/close
  - Add click-outside handler
  - Add keyboard navigation (Escape to close)
  - **Verify**: Component renders without errors

- [ ] **Task 2: Create VariantButton component**
  - Create `src/components/playground/variations/VariantButton.tsx`
  - Add Plus icon from lucide-react
  - Add rotation animation on hover (45deg)
  - Add scale effect (1.1)
  - Add price display
  - **Verify**: Button shows, icon rotates on hover

- [ ] **Task 3: Create VariantList component**
  - Create `src/components/playground/variations/VariantList.tsx`
  - Add slide-up animation
  - Add stagger delays for items
  - Add max-height transition
  - **Verify**: List animates smoothly

### Phase 2: Add Animations (10 min)

- [ ] **Task 4: Create animation styles**
  - Add CSS classes to `globals.css` or component module
  - Implement icon rotation transition
  - Implement list expansion animation
  - Implement stagger animation for items
  - Add `@keyframes slideIn`
  - **Verify**: Animations are smooth at 60fps

- [ ] **Task 5: Add accessibility features**
  - Add `aria-expanded` to button
  - Add `aria-controls` for list
  - Add `role="listbox"` to list
  - Add `role="option"` to items
  - Add focus trap when open
  - **Verify**: Screen reader announces changes, tab navigation works

### Phase 3: Integration (10 min)

- [ ] **Task 6: Create demo card**
  - Create `src/components/playground/variations/VariantSelectorCard.tsx`
  - Integrate VariantSelector into card
  - Use product with multiple variants (e.g., Domates)
  - Add to ProductCardShowcase
  - **Verify**: Card shows in showcase with variants

- [ ] **Task 7: Test interactions**
  - Test hover animation
  - Test click to open
  - Test click outside to close
  - Test Escape key
  - Test variant selection
  - **Verify**: All interactions work smoothly

### Phase 4: Polish (5 min)

- [ ] **Task 8: Add backdrop/overlay**
  - Add semi-transparent backdrop when open
  - Click backdrop to close
  - Fade in/out animation
  - **Verify**: Backdrop appears and dismisses on click

- [ ] **Task 9: Add reduced motion support**
  - Check `prefers-reduced-motion`
  - Skip animations if true
  - Use instant toggle instead
  - **Verify**: Animations respect system preference

## CSS Specification

```css
/* Icon Rotation */
.variant-button-icon {
  transition: transform 225ms ease-out;
}

.variant-button:hover .variant-button-icon {
  transform: rotate(45deg) scale(1.1);
}

/* List Expansion */
.variant-list {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 300ms ease-out,
              opacity 250ms ease-out;
  transform-origin: bottom center;
}

.variant-list.open {
  max-height: 300px;
  opacity: 1;
}

/* Stagger Animation */
.variant-item {
  opacity: 0;
  transform: translateY(-10px);
  animation: slideInUp 300ms ease-out forwards;
}

.variant-item:nth-child(1) { animation-delay: 0ms; }
.variant-item:nth-child(2) { animation-delay: 50ms; }
.variant-item:nth-child(3) { animation-delay: 100ms; }
.variant-item:nth-child(4) { animation-delay: 150ms; }

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .variant-button-icon,
  .variant-list,
  .variant-item {
    transition: none;
    animation: none;
  }
  
  .variant-list.open {
    max-height: 300px;
    opacity: 1;
  }
  
  .variant-item {
    opacity: 1;
    transform: none;
  }
}
```

## File Structure

```
NEW:
src/components/playground/variations/VariantSelector.tsx
src/components/playground/variations/VariantButton.tsx
src/components/playground/variations/VariantList.tsx
src/components/playground/variations/VariantItem.tsx
src/components/playground/variations/VariantSelectorCard.tsx

MODIFIED:
src/components/playground/ProductCardShowcase.tsx (add demo section)
```

## Component Props

```typescript
// VariantSelector.tsx
interface VariantSelectorProps {
  variants: ProductVariant[];
  basePrice: number;
  onVariantSelect?: (variant: ProductVariant) => void;
  className?: string;
}

// VariantButton.tsx
interface VariantButtonProps {
  price: number;
  unit: ProductUnit;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

// VariantList.tsx
interface VariantListProps {
  variants: ProductVariant[];
  basePrice: number;
  isOpen: boolean;
  onSelectVariant: (variant: ProductVariant) => void;
  onClose: () => void;
}
```

## Testing Checklist

- [ ] Icon rotates on hover (45deg)
- [ ] Icon scales up on hover (1.1)
- [ ] Click toggles list open/close
- [ ] List animates upward smoothly
- [ ] Stagger animation works for multiple items
- [ ] Click outside closes list
- [ ] Escape key closes list
- [ ] Tab navigation works
- [ ] Screen reader announces "Varyasyonlar" label
- [ ] `aria-expanded` updates correctly
- [ ] No layout shift when list opens
- [ ] Animation runs at 60fps
- [ ] `prefers-reduced-motion` is respected
- [ ] Variant selection updates display
- [ ] Price calculates correctly with multiplier

## Fallback Strategy

| Scenario | Fallback Behavior |
|----------|------------------|
| CSS not supported | Show inline variants (current behavior) |
| JavaScript disabled | Show inline variants |
| Reduced motion enabled | Instant toggle, no animation |
| No variants | Hide selector button, show price only |

## Success Criteria

1. User hovers over '+' icon → Icon rotates 45deg
2. User clicks '+' icon → List slides up from button
3. List items animate in with stagger effect
4. User clicks variant → List closes, price updates
5. User clicks outside → List closes
6. All animations are smooth (60fps)
7. Accessibility: Screen reader, keyboard, reduced motion

## Implementation Notes

- Use `useRef` for click-outside detection
- Use `useCallback` for event handlers
- Position list absolutely relative to button
- Use `z-index` to ensure list appears above content
- Add `pointer-events-none` to backdrop, enable on list
- Consider mobile: Full-screen bottom sheet for better UX

## Next Steps After Implementation

1. Add to main ProductCard component
2. Test with real product data
3. Gather user feedback
4. Optimize animation timing if needed
5. Consider adding haptic feedback for mobile

---

**Created:** 2025-01-10
**Status:** Ready for Implementation
**Assigned to:** frontend-specialist
