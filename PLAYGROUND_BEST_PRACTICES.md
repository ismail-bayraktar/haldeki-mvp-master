# Playground Component Best Practices

> **Version:** 1.0.0
> **Last Updated:** 2025-01-10
> **Status:** Active

## Overview

This document defines the standards and best practices for developing showcase components in the Haldeki Design System Playground. All components must follow these guidelines to ensure consistency, maintainability, and accessibility.

---

## Table of Contents

1. [Component Standards](#1-component-standards)
2. [File Structure](#2-file-structure)
3. [TypeScript Standards](#3-typescript-standards)
4. [Showcase Patterns](#4-showcase-patterns)
5. [State Management](#5-state-management)
6. [Accessibility Requirements](#6-accessibility-requirements)
7. [Performance Guidelines](#7-performance-guidelines)
8. [Documentation Standards](#8-documentation-standards)
9. [Code Template](#9-code-template)
10. [Quality Checklist](#10-quality-checklist)

---

## 1. Component Standards

### 1.1 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| **Component Files** | PascalCase.tsx | `ColorPalette.tsx` |
| **Component Names** | PascalCase | `ColorPalette`, `ButtonGroup` |
| **Props Interfaces** | ComponentNameProps | `ColorPaletteProps` |
| **Helper Functions** | camelCase | `formatColor()`, `calculateSize()` |
| **Constants** | SCREAMING_SNAKE | `MAX_COLORS`, `DEFAULT_VARIANT` |

### 1.2 Component Principles

- **Single Responsibility:** Each component showcases ONE concept (color, typography, button, etc.)
- **Composition First:** Build small, reusable pieces that compose together
- **Props Down, Events Up:** Follow unidirectional data flow
- **Semantic HTML:** Use proper HTML5 elements (`<section>`, `<article>`, `<header>`)

### 1.3 Component Categories

```
playground/
├── TokenShowcase.tsx      # Design tokens (colors, spacing, typography)
├── CoreUI.tsx             # UI components (buttons, badges, cards)
├── FormComponents.tsx     # Form elements (inputs, selects, checkboxes)
├── DataDisplay.tsx        # Data visualization (tables, charts, lists)
├── Feedback.tsx           # Feedback UI (toasts, alerts, modals)
└── AIReviewPanel.tsx      # Design guidelines and principles
```

---

## 2. File Structure

### 2.1 Component Location

```
src/
├── components/
│   └── playground/
│       ├── index.ts              # Barrel export
│       ├── TokenShowcase.tsx     # Component file
│       ├── CoreUI.tsx
│       ├── FormComponents.tsx    # New component
│       └── utils/
│           ├── colorHelpers.ts   # Shared utilities
│           └── formatHelpers.ts
└── pages/
    └── Playground.tsx            # Route page
```

### 2.2 Barrel Exports (index.ts)

```typescript
/**
 * Playground Components - Design System Showcase
 */

export { TokenShowcase } from "./TokenShowcase";
export { CoreUI } from "./CoreUI";
export { FormComponents } from "./FormComponents";
```

### 2.3 Import Order

```typescript
// 1. External libraries
import { useState } from "react";

// 2. Internal UI components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 3. Types/interfaces
import type { ButtonVariant } from "@/types/ui";

// 4. Local components/helpers
import { ColorCard } from "./components/ColorCard";
import { formatHex } from "./utils/colorHelpers";
```

---

## 3. TypeScript Standards

### 3.1 Strict Typing Rules

| Rule | Requirement |
|------|-------------|
| **No `any`** | Use `unknown` if truly unknown |
| **Explicit Props** | Always define prop interfaces |
| **Null Checks** | Enable `strictNullChecks` |
| **Return Types** | Explicit on exported functions |

### 3.2 Props Interface Pattern

```typescript
/**
 * Props for ColorCard component
 */
export interface ColorCardProps {
  /** Color name for display */
  name: string;
  /** Tailwind color class */
  colorClass: string;
  /** Hex color value */
  hex: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Accessibility label */
  ariaLabel?: string;
}
```

### 3.3 Type Exports

```typescript
// Export types for reuse
export type { ColorCardProps };
export type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
```

---

## 4. Showcase Patterns

### 4.1 Component Display Structure

```typescript
export function ComponentShowcase() {
  return (
    <div className="space-y-8">
      {/* Section 1: Basic Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Section Title
        </h3>
        <div className="[container-classes]">
          {/* Examples here */}
        </div>
      </section>

      {/* Section 2: Variants */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Variants
        </h3>
        <div className="[container-classes]">
          {/* Variant examples */}
        </div>
      </section>
    </div>
  );
}
```

### 4.2 Interactive Examples

**DO:** Provide interactive controls for props
```typescript
function InteractiveDemo() {
  const [variant, setVariant] = useState<ButtonVariant>("default");
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");

  return (
    <div className="space-y-4">
      <PropControl label="Variant" value={variant} onChange={setVariant} />
      <PropControl label="Size" value={size} onChange={setSize} />
      <Button variant={variant} size={size}>
        Preview Button
      </Button>
    </div>
  );
}
```

**DON'T:** Static-only examples without interaction

### 4.3 Code Snippet Display

```typescript
function CodeExample({ code, language = "tsx" }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
```

### 4.4 Usage Examples

```typescript
function UsageGuide() {
  const exampleCode = `import { Button } from "@/components/ui/button";

function MyComponent() {
  return (
    <Button variant="default" onClick={handleClick}>
      Click Me
    </Button>
  );
}`;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Usage</h4>
      <CodeExample code={exampleCode} />
    </div>
  );
}
```

---

## 5. State Management

### 5.1 Local State Guidelines

| Use Case | Solution | Example |
|----------|----------|---------|
| **Demo props** | useState | `const [variant, setVariant] = useState(...)` |
| **Theme toggle** | useState | `const [darkMode, setDarkMode] = useState(false)` |
| **Active tab** | useState | `const [activeTab, setActiveTab] = useState(...)` |
| **Form input** | useState + controlled | `<input value={value} onChange={e => setValue(e.target.value)} />` |

### 5.2 Prop Controls Pattern

```typescript
interface PropControlProps<T> {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}

function PropControl<T>({ label, value, options, onChange }: PropControlProps<T>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={String(value)}
        onChange={(e) => onChange(options[Number(e.target.value)])}
        className="w-full px-3 py-2 rounded border"
      >
        {options.map((opt, i) => (
          <option key={i} value={i}>
            {String(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 5.3 Variant Switching

```typescript
const VARIANTS = ["default", "secondary", "outline", "ghost"] as const;
type Variant = typeof VARIANTS[number];

function VariantDemo() {
  const [variant, setVariant] = useState<Variant>("default");

  return (
    <div className="flex gap-2">
      {VARIANTS.map((v) => (
        <button
          key={v}
          onClick={() => setVariant(v)}
          className={variant === v ? "ring-2 ring-primary" : ""}
        >
          {v}
        </button>
      ))}
      <Button variant={variant}>Example</Button>
    </div>
  );
}
```

---

## 6. Accessibility Requirements

### 6.1 Keyboard Navigation

```typescript
function KeyboardDemo() {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        handleClick();
        break;
      case "Escape":
        handleClose();
        break;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Interactive element"
    >
      Content
    </div>
  );
}
```

### 6.2 Screen Reader Support

```typescript
function AccessibleCard({ title, description, status }: CardProps) {
  return (
    <article
      aria-labelledby={`card-${id}-title`}
      aria-describedby={`card-${id}-desc`}
      className="..."
    >
      <h3 id={`card-${id}-title`}>{title}</h3>
      <p id={`card-${id}-desc`}>{description}</p>
      <span aria-label={`Status: ${status}`}>
        {status === "success" && "✓"}
      </span>
    </article>
  );
}
```

### 6.3 Focus Indicators

```css
/* Always provide visible focus indicators */
.focusable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Ensure high contrast */
.focusable:focus {
  box-shadow: 0 0 0 3px rgba(0, 70, 49, 0.3);
}
```

### 6.4 ARIA Attributes Checklist

- [ ] All interactive elements have `role` if not semantic
- [ ] All icons have `aria-label` or are `aria-hidden`
- [ ] All form inputs have associated `<label>`
- [ ] All live regions have appropriate `aria-live` values
- [ ] All modals have `aria-modal="true"`
- [ ] All expanded/collapsed state has `aria-expanded`

---

## 7. Performance Guidelines

### 7.1 Code Splitting Strategy

```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() =>
  import("./HeavyComponent").then(m => ({ default: m.HeavyComponent }))
);

function Playground() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 7.2 Lazy Loading Components

```typescript
// Load showcase components on demand
const showcaseComponents = {
  tokens: lazy(() => import("@/components/playground/TokenShowcase")),
  components: lazy(() => import("@/components/playground/CoreUI")),
  guidelines: lazy(() => import("@/components/playground/AIReviewPanel")),
};
```

### 7.3 Bundle Size Monitoring

```typescript
// Add bundle analyzer to vite.config.ts
import { defineConfig } from "vite";
import bundleAnalyzer from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    bundleAnalyzer({
      filename: "./dist/stats.html",
      open: true,
      gzipSize: true,
    })
  ]
});
```

### 7.4 Render Optimization

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(
  () => calculateExpensiveValue(data),
  [data]
);

// Memoize callbacks passed to children
const handleClick = useCallback(
  (id: string) => {
    onSelect(id);
  },
  [onSelect]
);

// Use React.memo for pure components
export const ColorCard = React.memo(function ColorCard(props: ColorCardProps) {
  // ...
});
```

---

## 8. Documentation Standards

### 8.1 JSDoc Comments

```typescript
/**
 * ColorCard - Display a single color swatch with metadata
 *
 * @example
 * ```tsx
 * <ColorCard
 *   name="Primary Green"
 *   colorClass="bg-haldeki-green"
 *   hex="#004631"
 *   onClick={() => console.log("Clicked!")}
 * />
 * ```
 */
export function ColorCard({ name, colorClass, hex, onClick, ariaLabel }: ColorCardProps) {
  // ...
}
```

### 8.2 Auto-Generated Props Table

```typescript
// Extract props for documentation
const componentProps = {
  name: {
    type: "string",
    required: true,
    description: "Color name for display",
  },
  colorClass: {
    type: "string",
    required: true,
    description: "Tailwind color class",
  },
  hex: {
    type: "string",
    required: true,
    description: "Hex color value",
  },
  onClick: {
    type: "() => void",
    required: false,
    description: "Optional click handler",
  },
};

// Render props table
function PropsTable({ props }: { props: Record<string, PropMetadata> }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(props).map(([name, meta]) => (
          <tr key={name}>
            <td><code>{name}</code></td>
            <td><code>{meta.type}</code></td>
            <td>{meta.required ? "Yes" : "No"}</td>
            <td>{meta.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 8.3 Usage Examples Section

```typescript
function UsageExamples() {
  return (
    <section className="space-y-6">
      <h3 className="text-lg font-bold">Usage Examples</h3>

      {/* Basic */}
      <ExampleCard title="Basic Usage">
        <Button>Click Me</Button>
        <CodeExample code={`<Button>Click Me</Button>`} />
      </ExampleCard>

      {/* With Variants */}
      <ExampleCard title="With Variants">
        <Button variant="secondary">Secondary</Button>
        <CodeExample code={`<Button variant="secondary">Secondary</Button>`} />
      </ExampleCard>

      {/* With Handlers */}
      <ExampleCard title="With Click Handler">
        <Button onClick={() => alert("Clicked!")}>Alert</Button>
        <CodeExample code={`<Button onClick={() => alert("Clicked!")}>Alert</Button>`} />
      </ExampleCard>
    </section>
  );
}
```

### 8.4 Do's and Don'ts

```typescript
function DoDontGuide() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border-l-4 border-green-500 pl-4">
        <h4 className="font-semibold text-green-600">Do</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Use semantic variants</li>
          <li>Provide accessible labels</li>
          <li>Handle loading states</li>
        </ul>
      </div>
      <div className="border-l-4 border-red-500 pl-4">
        <h4 className="font-semibold text-red-600">Don't</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Nest buttons in buttons</li>
          <li>Use color alone for meaning</li>
          <li>Ignore keyboard navigation</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 9. Code Template

### 9.1 Perfect Playground Component Template

```typescript
/**
 * [ComponentName] - [Brief description]
 *
 * @description
 * [Detailed description of what this component showcases and why it matters]
 *
 * @example
 * ```tsx
 * <[ComponentName] [props] />
 * ```
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Props interface for [ComponentName]
 */
export interface [ComponentName]Props {
  /** [Prop description] */
  [propName]: [propType];
  /** [Optional prop description] */
  [optionalProp]?: [propType];
}

/**
 * [ComponentName] - [One-line summary]
 */
export function [ComponentName]({ [prop1], [prop2] }: [ComponentName]Props) {
  // Local state for interactive demos
  const [state, setState] = useState<DataType>(initialValue);

  // Event handlers
  const handleClick = () => {
    // Handler logic
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Title */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Section Title
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Content */}
        </div>
      </section>

      {/* Section 2: Interactive Demo */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Interactive Demo
        </h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <PropControl
            label="[Control Label]"
            value={state}
            onChange={setState}
          />
          {/* Live preview */}
        </div>
      </section>

      {/* Section 3: Usage Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Usage Examples
        </h3>
        <div className="space-y-4">
          {/* Examples */}
        </div>
      </section>
    </div>
  );
}

/**
 * Helper component for [specific purpose]
 */
function HelperComponent({ prop1, prop2 }: HelperProps) {
  return (
    <div className="[classes]">
      {/* Content */}
    </div>
  );
}

/**
 * Default values for component props
 */
export const DEFAULT_[COMPONENT_NAME]_PROPS: Partial<[ComponentName]Props> = {
  [prop]: defaultValue,
};
```

### 9.2 Minimal Component Template

```typescript
/**
 * [ComponentName] - [One-line description]
 */

import { [Component] } from "@/components/ui/[component]";

export function [ComponentName]() {
  return (
    <section>
      <h3 className="text-lg font-bold text-foreground mb-4">
        Section Title
      </h3>
      <div className="bg-card border border-border rounded-lg p-6">
        {/* Showcase content */}
      </div>
    </section>
  );
}
```

---

## 10. Quality Checklist

### Pre-Commit Checklist

- [ ] **TypeScript:** No type errors (`npx tsc --noEmit`)
- [ ] **Linting:** No lint errors (`npm run lint`)
- [ ] **Imports:** Correct order and no unused imports
- [ ] **Props:** All props are typed and documented
- [ ] **Accessibility:** Keyboard navigation works, ARIA labels present
- [ ] **Responsive:** Works on mobile, tablet, desktop
- [ ] **Performance:** No unnecessary re-renders, memoized where needed
- [ ] **Documentation:** JSDoc comments complete
- [ ] **Examples:** Usage examples provided and working
- [ ] **Tests:** Unit tests cover critical paths

### Design System Checklist

- [ ] **Colors:** Uses only design system colors (Haldeki Green, Fresh Orange)
- [ ] **Typography:** Uses Andika font family
- [ ] **Spacing:** Follows 8-point grid system
- [ ] **Shadows:** Uses `shadow-card` or design system shadows
- [ ] **Borders:** Uses `border-border` from theme
- [ ] **Purple Ban:** No purple, violet, indigo colors
- [ ] **Animation:** Uses `animate-fade-in` or system animations

### Accessibility Checklist

- [ ] **Color Contrast:** WCAG AA compliant (4.5:1 minimum)
- [ ] **Keyboard:** All interactive elements reachable via Tab
- [ ] **Screen Reader:** Proper ARIA labels and roles
- [ ] **Focus Visible:** Clear focus indicators
- [ ] **Semantic HTML:** Correct element usage (button vs div)
- [ ] **Image Alt:** All images have alt text

---

## Appendix

### A. Related Resources

- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility](https://react.dev/learn/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### B. Component Library

All shadcn/ui components are available at `@/components/ui/[component]`.

Common imports:
```typescript
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
```

### C. Design Tokens

```typescript
// Colors
HALDEKI_GREEN = "#004631"
FRESH_ORANGE = "#FF6B35"
GREEN_LIGHT = "#E8F5E9"
EARTH_BROWN = "#8B4513"

// Typography
FONT_FAMILY = "Andika, sans-serif"
FONT_SIZES = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl"]

// Spacing (8-point grid)
SPACING = ["4px", "8px", "16px", "24px", "32px", "48px", "64px"]

// Border Radius
RADIUS = ["rounded", "rounded-md", "rounded-lg", "rounded-xl", "rounded-full"]
```

---

**Document Version:** 1.0.0
**Maintained By:** Frontend Team
**Questions?** Open an issue or contact the team
