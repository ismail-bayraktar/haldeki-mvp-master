import { Button } from "@/components/ui/button";

/**
 * TokenShowcase - Displays all design system tokens
 * Colors, typography, spacing, shadows, etc.
 */

export function TokenShowcase() {
  return (
    <div className="space-y-8">
      {/* Colors */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Color Palette</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorCard name="Primary Green" color="bg-haldeki-green" hex="#004631" />
          <ColorCard name="Fresh Orange" color="bg-fresh-orange" hex="#FF6B35" />
          <ColorCard name="Green Light" color="bg-haldeki-green-light" hex="#E8F5E9" />
          <ColorCard name="Earth Brown" color="bg-earth-brown" hex="#8B4513" />
        </div>
      </section>

      {/* Typography */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Typography</h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <TypeExample size="text-4xl" text="Heading 1 - 36px" />
          <TypeExample size="text-3xl" text="Heading 2 - 30px" />
          <TypeExample size="text-2xl" text="Heading 3 - 24px" />
          <TypeExample size="text-xl" text="Heading 4 - 20px" />
          <TypeExample size="text-base" text="Body Text - 16px" />
          <TypeExample size="text-sm" text="Small Text - 14px" />
          <TypeExample size="text-xs" text="Caption - 12px" />
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Button Variants</h3>
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-lg p-6">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="hero">Hero</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Spacing Scale</h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <SpacingDemo size="w-4 h-4" label="4px (xs)" />
          <SpacingDemo size="w-6 h-6" label="8px (sm)" />
          <SpacingDemo size="w-8 h-8" label="16px (md)" />
          <SpacingDemo size="w-12 h-12" label="24px (lg)" />
          <SpacingDemo size="w-16 h-16" label="32px (xl)" />
        </div>
      </section>
    </div>
  );
}

function ColorCard({ name, color, hex }: { name: string; color: string; hex: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-card">
      <div className={`w-full h-20 ${color} rounded-md mb-3 border border-border`} />
      <p className="font-medium text-foreground text-sm">{name}</p>
      <p className="text-xs text-muted-foreground">{hex}</p>
    </div>
  );
}

function TypeExample({ size, text }: { size: string; text: string }) {
  return (
    <p className={`${size} font-andika text-foreground`}>
      {text}
    </p>
  );
}

function SpacingDemo({ size, label }: { size: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${size} bg-primary rounded`} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
