/**
 * AIReviewPanel - Simulates AI design review
 * Shows design guidelines and best practices
 */

export function AIReviewPanel() {
  return (
    <div className="space-y-6">
      {/* Design Principles */}
      <section className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">Design Principles</span>
        </h3>
        <ul className="space-y-3">
          <Principle
            title="Fresh & Organic"
            description="Use Andika font with Haldeki Green and Fresh Orange for natural, fresh feel"
            status="pass"
          />
          <Principle
            title="Accessible Colors"
            description="All text meets WCAG AA contrast requirements (4.5:1 minimum)"
            status="pass"
          />
          <Principle
            title="Consistent Spacing"
            description="Use 8-point grid system for consistent spacing throughout"
            status="pass"
          />
          <Principle
            title="Mobile First"
            description="Design for mobile screens first, then scale up to larger devices"
            status="pass"
          />
        </ul>
      </section>

      {/* Color Usage Guidelines */}
      <section className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-4">Color Usage Guidelines</h3>
        <div className="space-y-4">
          <ColorGuide
            color="Primary Green"
            usage="Primary actions, navigation, branding"
            examples={['Buttons', 'Links', 'Headers']}
          />
          <ColorGuide
            color="Fresh Orange"
            usage="Accents, CTAs, highlights"
            examples={['Hero buttons', 'Badges', 'Notifications']}
          />
          <ColorGuide
            color="Earth Tones"
            usage="Backgrounds, subtle elements"
            examples={['Section backgrounds', 'Cards', 'Borders']}
          />
        </div>
      </section>

      {/* Typography Guidelines */}
      <section className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-4">Typography System</h3>
        <div className="space-y-3 text-sm">
          <GuidelineItem
            title="Font Family"
            value="Andika (Primary), System UI (Fallback)"
          />
          <GuidelineItem
            title="Headings"
            value="Bold, Tight Tracking (font-bold tracking-tight)"
          />
          <GuidelineItem
            title="Body Text"
            value="Regular, 1.5 Line Height for readability"
          />
          <GuidelineItem
            title="Line Length"
            value="45-75 characters optimal for reading"
          />
        </div>
      </section>

      {/* Component Guidelines */}
      <section className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="text-lg font-bold text-foreground mb-4">Component Guidelines</h3>
        <div className="space-y-3 text-sm">
          <GuidelineItem
            title="Buttons"
            value="Min-height 40px, clear hover states, accessible labels"
          />
          <GuidelineItem
            title="Cards"
            value="Consistent padding, subtle shadows, optional hover effect"
          />
          <GuidelineItem
            title="Forms"
            value="Clear labels, error messages, focus indicators"
          />
          <GuidelineItem
            title="Badges"
            value="Rounded-full, semantic colors, descriptive text"
          />
        </div>
      </section>
    </div>
  );
}

function Principle({
  title,
  description,
  status
}: {
  title: string;
  description: string;
  status: "pass" | "warn" | "fail";
}) {
  const statusIcon = status === "pass" ? "✓" : status === "warn" ? "⚠" : "✗";
  const statusColor =
    status === "pass" ? "text-stock-plenty" : status === "warn" ? "text-fresh-up" : "text-stock-last";

  return (
    <li className="flex items-start gap-3">
      <span className={`font-bold ${statusColor} mt-0.5`}>{statusIcon}</span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}

function ColorGuide({
  color,
  usage,
  examples
}: {
  color: string;
  usage: string;
  examples: string[];
}) {
  return (
    <div className="border-l-2 border-haldeki-green pl-4">
      <p className="font-medium text-foreground">{color}</p>
      <p className="text-sm text-muted-foreground mb-2">{usage}</p>
      <div className="flex flex-wrap gap-2">
        {examples.map((example, i) => (
          <span
            key={i}
            className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
          >
            {example}
          </span>
        ))}
      </div>
    </div>
  );
}

function GuidelineItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground w-32 flex-shrink-0">{title}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
