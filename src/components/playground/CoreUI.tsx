import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * CoreUI - Showcases core UI components
 * Badges, cards, forms, etc.
 */

export function CoreUI() {
  return (
    <div className="space-y-8">
      {/* Badges */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Badges</h3>
        <div className="flex flex-wrap gap-3 bg-card border border-border rounded-lg p-6">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge className="badge-fresh-today">Fresh Today</Badge>
          <Badge className="badge-quality-premium">Premium</Badge>
        </div>
      </section>

      {/* Card Styles */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Card Styles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardExample title="Basic Card" description="Standard card with border" />
          <CardExample title="Hover Card" description="With hover effect" hover />
          <CardExample title="Shadow Card" description="With shadow" shadow />
        </div>
      </section>

      {/* Form Elements */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Form Elements</h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Input Field</label>
            <input
              type="text"
              placeholder="Enter text..."
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select</label>
            <select className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </section>

      {/* Price Indicators */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">Price Indicators</h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-3">
          <PriceExample label="Price Up" price="15.50 TL" change="+2.50" variant="up" />
          <PriceExample label="Price Down" price="12.00 TL" change="-1.50" variant="down" />
          <PriceExample label="Stable" price="10.00 TL" change="0.00" variant="stable" />
        </div>
      </section>
    </div>
  );
}

function CardExample({
  title,
  description,
  hover,
  shadow
}: {
  title: string;
  description: string;
  hover?: boolean;
  shadow?: boolean;
}) {
  const classes = [
    "bg-card",
    "border",
    "border-border",
    "rounded-lg",
    "p-6",
    hover && "card-hover",
    shadow && "shadow-card"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PriceExample({
  label,
  price,
  change,
  variant
}: {
  label: string;
  price: string;
  change: string;
  variant: "up" | "down" | "stable";
}) {
  const colorClass = variant === "up" ? "text-fresh-up" : variant === "down" ? "text-fresh-down" : "text-fresh-stable";

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-foreground">{price}</span>
        <span className={`text-sm font-medium ${colorClass}`}>{change}</span>
      </div>
    </div>
  );
}
