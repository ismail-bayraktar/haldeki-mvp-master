/**
 * ComponentName - One-line description
 *
 * REPLACE: ComponentName with your actual component name
 *
 * @example
 * ```tsx
 * import { ComponentName } from "@/components/playground";
 *
 * function Page() {
 *   return <ComponentName />;
 * }
 * ```
 */

import { useState } from "react";

/**
 * Props for ComponentName
 *
 * REPLACE: ComponentName with your actual component name
 */
export interface ComponentNameProps {
  /** Description for propName */
  propName: string;
  /** Optional description for optionalProp */
  optionalProp?: number;
}

/**
 * ComponentName - Detailed description
 *
 * REPLACE: ComponentName with your actual component name
 */
export function ComponentName({ propName, optionalProp }: ComponentNameProps) {
  // Local state - REPLACE DataType with actual type
  const [state, setState] = useState<string>("initialValue");

  return (
    <div className="space-y-8">
      {/* Section 1: Basic Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Section Title
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Content */}
        </div>
      </section>

      {/* Section 2: Variants */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Variants
        </h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {/* Variant examples */}
        </div>
      </section>

      {/* Section 3: Usage Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Usage
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
            <code>{`import { Component } from "@/components/ui/component";

function Example() {
  return <Component prop="value" />;
}`}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}

/**
 * HelperComponent - Helper component for specific purpose
 *
 * REPLACE: HelperComponent with actual helper name
 */
function HelperComponent({ prop1, prop2 }: HelperProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Content */}
    </div>
  );
}

interface HelperProps {
  prop1: string;
  prop2?: string;
}
