# Playground Component Development Checklist

> Use this checklist when creating new playground showcase components.

## Quick Start Checklist

### Phase 1: Planning (Before Coding)

- [ ] **Define Purpose:** What is this component showcasing?
- [ ] **Identify Scope:** Single component or multiple variants?
- [ ] **Review Guidelines:** Read `PLAYGROUND_BEST_PRACTICES.md`
- [ ] **Check Existing:** Does this already exist in playground?
- [ ] **Plan Structure:** What sections will be included?

### Phase 2: File Setup

- [ ] **Create File:** `ComponentName.tsx` in `/src/components/playground/`
- [ ] **Add Export:** Update `index.ts` barrel export
- [ ] **Setup Imports:** Organize imports (external → internal → types → local)
- [ ] **Define Props:** Create `ComponentNameProps` interface

### Phase 3: Implementation

- [ ] **Structure Sections:** Use `<section>` for each demo area
- [ ] **Add Titles:** `h3` with consistent styling
- [ ] **Container Classes:** Use `bg-card border border-border rounded-lg p-6`
- [ ] **Interactive Controls:** Add prop controls for demos
- [ ] **Code Examples:** Include copy-paste friendly code snippets

### Phase 4: TypeScript

- [ ] **No `any`:** Use proper types or `unknown`
- [ ] **Export Types:** Export prop interfaces for reuse
- [ ] **Type Handlers:** Proper typing for event handlers
- [ ] **Generic Types:** Use generics where appropriate

### Phase 5: Accessibility

- [ ] **Semantic HTML:** Use proper elements (button, not div)
- [ ] **ARIA Labels:** All interactive elements labeled
- [ ] **Keyboard Support:** Tab and Enter/Space work
- [ ] **Focus Indicators:** Visible `:focus-visible` styles
- [ ] **Screen Reader:** `aria-describedby`, `aria-labelledby` where needed

### Phase 6: Documentation

- [ ] **JSDoc Comments:** Component description and examples
- [ ] **Prop Documentation:** All props documented with `@param`
- [ ] **Usage Examples:** At least 3 usage examples
- [ ] **Do/Don't:** Include best practices section

### Phase 7: Quality Checks

- [ ] **Lint:** `npm run lint` passes
- [ ] **Type Check:** `npx tsc --noEmit` passes
- [ ] **Responsive:** Works on mobile, tablet, desktop
- [ ] **Dark Mode:** Test in both light and dark themes
- [ ] **Performance:** No unnecessary re-renders

### Phase 8: Integration

- [ ] **Add to Page:** Import in `/src/pages/Playground.tsx`
- [ ] **Add Tab:** Create tab navigation entry
- [ ] **Test Route:** Visit `/playground` and verify
- [ ] **Cross-Test:** Test in different browsers

---

## Detailed Checklist with Examples

### File Structure Checklist

```bash
# File location
src/components/playground/
├── index.ts                    # [ ] Add export here
├── TokenShowcase.tsx           # [ ] Reference existing
├── CoreUI.tsx                  # [ ] Reference existing
└── [NewComponent].tsx          # [ ] Create new file
```

### Import Order Template

```typescript
// [ ] 1. External libraries
import { useState, useCallback } from "react";

// [ ] 2. Internal UI components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// [ ] 3. Types
import type { ButtonVariant } from "@/types/ui";

// [ ] 4. Local components
import { ColorCard } from "./components/ColorCard";
```

### Props Interface Template

```typescript
// [ ] Export props interface
export interface NewComponentProps {
  // [ ] Document all required props
  title: string;

  // [ ] Document all optional props with default
  variant?: "default" | "secondary";

  // [ ] Document event handlers
  onClick?: () => void;

  // [ ] Document accessibility props
  ariaLabel?: string;
}
```

### Section Structure Template

```typescript
export function NewComponent() {
  return (
    <div className="space-y-8">
      {/* [ ] Section 1: Basic Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Section Title
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Content */}
        </div>
      </section>

      {/* [ ] Section 2: Variants */}
      {/* [ ] Section 3: Interactive Demo */}
      {/* [ ] Section 4: Usage Examples */}
    </div>
  );
}
```

### Accessibility Checklist

```typescript
// [ ] All buttons have accessible labels
<Button aria-label="Close modal">
  <XIcon />
</Button>

// [ ] All inputs have associated labels
<div>
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
</div>

// [ ] Custom interactive elements have role
<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  aria-label="Custom button"
>

// [ ] Icons are hidden or labeled
<Icon aria-hidden="true" />
<Icon aria-label="Search" />

// [ ] Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Documentation Template

```typescript
/**
 * ComponentName - Brief description
 *
 * @description
 * Detailed description of what this component does,
 * when to use it, and any important considerations.
 *
 * @example
 * ```tsx
 * <ComponentName
 *   title="Example"
 *   variant="default"
 *   onClick={() => console.log("Clicked")}
 * />
 * ```
 *
 * @see [Link to related documentation]
 * @author [Your name]
 * @since [Version]
 */
export function ComponentName(props: ComponentNameProps) {
  // ...
}
```

### Performance Checklist

```typescript
// [ ] Memoize expensive computations
const expensiveValue = useMemo(
  () => computeExpensive(data),
  [data]
);

// [ ] Memoize callbacks passed to children
const handleClick = useCallback(
  (id: string) => onSelect(id),
  [onSelect]
);

// [ ] Use React.memo for pure components
export const ColorCard = React.memo(ColorCardComponent);

// [ ] Lazy load heavy components
const HeavyChart = lazy(() => import("./HeavyChart"));

// [ ] Avoid inline functions in render
// Bad: onClick={() => handleClick(id)}
// Good: onClick={handleClick} (with useCallback)
```

---

## Common Pitfalls to Avoid

### ❌ Don't Do This

```typescript
// ❌ Using `any`
function BadComponent(props: any) { }

// ❌ Inline function in render (causes re-renders)
<Button onClick={() => handleClick(id)} />

// ❌ Not using semantic HTML
<div onClick={handleClick}>Button</div>

// ❌ Missing accessibility
<Icon /> // No aria-label or aria-hidden

// ❌ Inconsistent container classes
<div className="p-4 border">...</div>
<div className="p-6 rounded">...</div>
```

### ✅ Do This Instead

```typescript
// ✅ Proper typing
function GoodComponent(props: ComponentProps) { }

// ✅ Use useCallback
const handleClick = useCallback(
  (id: string) => { /* ... */ },
  [/* deps */]
);
<Button onClick={() => handleClick(id)} />

// ✅ Semantic HTML
<button onClick={handleClick}>Button</button>

// ✅ Proper accessibility
<Icon aria-hidden="true" />
<Icon aria-label="Close" />

// ✅ Consistent containers
<div className="bg-card border border-border rounded-lg p-6">...</div>
```

---

## Testing Checklist

### Manual Testing

- [ ] **Desktop:** Chrome, Firefox, Safari, Edge
- [ ] **Mobile:** iOS Safari, Android Chrome
- [ ] **Tablet:** iPad, Android tablet
- [ ] **Screen Reader:** NVDA (Windows), VoiceOver (Mac)
- [ ] **Keyboard Only:** Navigate without mouse
- [ ] **Dark Mode:** Toggle theme and verify colors
- [ ] **Resize:** Responsive design at all breakpoints

### Automated Testing

- [ ] **Unit Tests:** Test component logic
- [ ] **Integration Tests:** Test user flows
- [ ] **Accessibility Tests:** `npm run test:a11y`
- [ ] **Lint Tests:** `npm run lint`
- [ ] **Type Tests:** `npx tsc --noEmit`

---

## Pre-Commit Final Check

Run these commands before committing:

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format (if using Prettier)
npm run format

# Run tests
npm test

# Build check
npm run build
```

If all pass, you're ready to commit!

---

## Quick Reference

### Container Classes

```css
/* Standard showcase container */
bg-card border border-border rounded-lg p-6 shadow-card

/* Tighter container */
bg-card border border-border rounded-lg p-4

/* No padding (for full-width demos) */
bg-card border border-border rounded-lg
```

### Typography Classes

```css
/* Section titles */
text-lg font-bold text-foreground mb-4

/* Subsection titles */
text-base font-semibold text-foreground mb-3

/* Descriptions */
text-sm text-muted-foreground leading-relaxed
```

### Animation Classes

```css
/* Fade in animation */
animate-fade-in

/* Hover effects */
hover:scale-105 transition-transform

/* Smooth transitions */
transition-all duration-200 ease-out
```

---

**Remember:** When in doubt, refer to existing components (TokenShowcase, CoreUI) as examples!
