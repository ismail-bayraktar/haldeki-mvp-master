# Playground Component Templates

This directory contains template files for creating new playground showcase components. Use these templates to ensure consistency and follow best practices.

## Available Templates

### 1. PerfectShowcaseComponent.tsx

**Full-featured template with:**
- Complete TypeScript interfaces
- Interactive demo controls
- Usage examples with code snippets
- Accessibility demonstrations
- Performance optimizations (useCallback, useMemo)
- Comprehensive documentation

**Use when:** Creating a major showcase component with multiple sections, interactivity, and documentation.

**Features:**
- Form state management
- Validation patterns
- Error handling
- Code copy functionality
- Accessibility checklist
- Responsive design

**Example:**
```bash
# Copy and rename
cp templates/PerfectShowcaseComponent.tsx ../FormShowcase.tsx
# Then edit to customize
```

### 2. MinimalShowcaseTemplate.tsx

**Minimal template with:**
- Basic structure
- Type definitions
- Section placeholders
- Simple examples

**Use when:** Creating a simple showcase component without complex interactivity.

**Features:**
- Minimal boilerplate
- Quick to customize
- Follows best practices
- Easy to extend

**Example:**
```bash
# Copy and rename
cp templates/MinimalShowcaseTemplate.tsx ../AlertShowcase.tsx
# Then edit to customize
```

## Quick Start

### Option 1: Manual Template Copy

```bash
# Navigate to templates directory
cd src/components/playground/templates

# Copy template
cp PerfectShowcaseComponent.tsx ../YourComponentName.tsx

# Edit the file
cd ../
# Open YourComponentName.tsx and customize
```

### Option 2: Use Generator Script

```bash
# Generate full component
npx tsx scripts/create-playground-component.ts ButtonShowcase

# Generate minimal component
npx tsx scripts/create-playground-component.ts AlertShowcase --minimal
```

## Template Customization Guide

### Step 1: Rename and Replace

1. **Copy template** to new file: `YourComponentName.tsx`
2. **Find and replace:**
   - `ComponentName` → `YourComponentName`
   - `[ComponentName]` → `YourComponentName`
   - `component name` → `your component name`

### Step 2: Define Props

```typescript
export interface YourComponentNameProps {
  /** Description */
  propName: string;
  /** Optional description */
  optionalProp?: boolean;
}
```

### Step 3: Implement Sections

Each section follows this pattern:

```typescript
<section>
  <h3 className="text-lg font-bold text-foreground mb-4">
    Section Title
  </h3>
  <div className="bg-card border border-border rounded-lg p-6">
    {/* Content */}
  </div>
</section>
```

### Step 4: Add to Index

Update `src/components/playground/index.ts`:

```typescript
export { YourComponentName } from "./YourComponentName";
```

### Step 5: Add to Playground Page

Update `src/pages/Playground.tsx`:

```typescript
import { YourComponentName } from "@/components/playground";

// Add to tab navigation
<TabButton active={activeTab === "yourcomponent"} onClick={() => setActiveTab("yourcomponent")}>
  Your Component
</TabButton>

// Add to content
{activeTab === "yourcomponent" && (
  <div className="animate-fade-in">
    <YourComponentName />
  </div>
)}
```

## Section Structure Guide

### Standard Sections

1. **Basic Examples** - Simple component demonstrations
2. **Variants** - Different component states and styles
3. **Interactive Demo** - Live prop controls
4. **Usage Examples** - Code snippets with copy functionality
5. **Accessibility** - ARIA attributes and keyboard support
6. **Best Practices** - Do's and Don'ts

### Section Template

```typescript
<section>
  <h3 className="text-lg font-bold text-foreground mb-4">
    Section Title
  </h3>
  <div className="bg-card border border-border rounded-lg p-6">
    {/* Section content */}
  </div>
</section>
```

## Common Patterns

### Pattern 1: Component Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <ComponentExample variant="default" />
  <ComponentExample variant="secondary" />
  <ComponentExample variant="outline" />
</div>
```

### Pattern 2: Interactive Controls

```typescript
function PropControl<T>({ label, value, options, onChange }: PropControlProps<T>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={String(value)}
        onChange={(e) => onChange(options[Number(e.target.value)])}
        className="w-full px-3 py-2 rounded-md border"
      >
        {options.map((opt, i) => (
          <option key={i} value={i}>{String(opt)}</option>
        ))}
      </select>
    </div>
  );
}
```

### Pattern 3: Code Example with Copy

```typescript
function CodeExample({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
```

## Best Practices Checklist

- [ ] Use semantic HTML (`section`, `h3`, `article`)
- [ ] Follow TypeScript strict typing (no `any`)
- [ ] Add JSDoc comments for all exports
- [ ] Use design system colors (Haldeki Green, Fresh Orange)
- [ ] Use consistent container classes
- [ ] Add accessibility attributes (ARIA labels, roles)
- [ ] Include keyboard navigation
- [ ] Test in dark mode
- [ ] Verify responsive design
- [ ] Add code examples with copy functionality

## Design System Tokens

### Colors

```typescript
HALDEKI_GREEN = "#004631"   // Primary
FRESH_ORANGE = "#FF6B35"    // Accent
GREEN_LIGHT = "#E8F5E9"     // Background
EARTH_BROWN = "#8B4513"     // Earth tones
```

### Typography

```css
font-family: "Andika", sans-serif;

/* Sizes */
text-xs   /* 12px */
text-sm   /* 14px */
text-base /* 16px */
text-lg   /* 18px */
text-xl   /* 20px */
text-2xl  /* 24px */
```

### Spacing (8-point grid)

```css
p-4  /* 16px */
p-6  /* 24px */
p-8  /* 32px */
gap-4 /* 16px */
```

### Container Classes

```css
bg-card              /* Card background */
border border-border /* Standard border */
rounded-lg           /* Rounded corners */
p-6                  /* Internal padding */
shadow-card          /* Card shadow */
```

## Related Documentation

- [PLAYGROUND_BEST_PRACTICES.md](../../../PLAYGROUND_BEST_PRACTICES.md) - Complete best practices guide
- [PLAYGROUND_COMPONENT_CHECKLIST.md](../../../PLAYGROUND_COMPONENT_CHECKLIST.md) - Development checklist
- [Clean Code](../../../../.claude/skills/clean-code) - Coding standards
- [React Patterns](../../../../.claude/skills/react-patterns) - React best practices
- [Tailwind Patterns](../../../../.claude/skills/tailwind-patterns) - Tailwind CSS patterns

## Troubleshooting

### Issue: Component not showing in playground

**Solution:**
1. Check export in `index.ts`
2. Verify import in `Playground.tsx`
3. Check tab registration in navigation

### Issue: TypeScript errors

**Solution:**
1. Run `npx tsc --noEmit` to see all errors
2. Check prop interfaces match usage
3. Verify import paths

### Issue: Styling not working

**Solution:**
1. Verify Tailwind classes are correct
2. Check for typos in class names
3. Ensure design system tokens are used

## Examples

See existing components for reference:

- `TokenShowcase.tsx` - Design tokens showcase
- `CoreUI.tsx` - Core UI components
- `AIReviewPanel.tsx` - Design guidelines

## Support

For questions or issues:
1. Check this README
2. Review best practices document
3. Look at existing components
4. Consult design system documentation

---

**Last Updated:** 2025-01-10
**Template Version:** 1.0.0
