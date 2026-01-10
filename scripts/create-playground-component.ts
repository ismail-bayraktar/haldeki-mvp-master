#!/usr/bin/env tsx

/**
 * Playground Component Generator Script
 *
 * Usage:
 *   npx tsx scripts/create-playground-component.ts ButtonShowcase
 *   npx tsx scripts/create-playground-component.ts FormComponents --minimal
 *
 * This script creates a new playground component with proper structure,
 * types, and boilerplate code following best practices.
 */

import fs from "fs";
import path from "path";

interface ComponentConfig {
  name: string;
  template: "full" | "minimal";
  description: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ComponentConfig {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: npx tsx create-playground-component.ts <ComponentName> [--minimal]");
    process.exit(1);
  }

  const name = args[0];
  const template = args.includes("--minimal") ? "minimal" : "full";

  return {
    name,
    template,
    description: `${name} showcase component`,
  };
}

/**
 * Generate component content based on template
 */
function generateComponent(config: ComponentConfig): string {
  const { name, description, template } = config;
  const className = name.endsWith(".tsx") ? name.replace(".tsx", "") : name;

  if (template === "minimal") {
    return `/**
 * ${className} - ${description}
 *
 * @example
 * \`\`\`tsx
 * import { ${className} } from "@/components/playground";
 *
 * function Page() {
 *   return <${className} />;
 * }
 * \`\`\`
 */

import { ${className}Props } from "./${className}.types";

/**
 * ${className} - ${description}
 */
export function ${className}(props: ${className}Props) {
  return (
    <section>
      <h3 className="text-lg font-bold text-foreground mb-4">
        ${className}
      </h3>
      <div className="bg-card border border-border rounded-lg p-6">
        {/* Component showcase */}
      </div>
    </section>
  );
}
`;
  }

  return `/**
 * ${className} - ${description}
 *
 * @description
 * ${description} - Demonstrates ${className.toLowerCase()} usage,
 * variants, and best practices.
 *
 * @example
 * \`\`\`tsx
 * import { ${className} } from "@/components/playground";
 *
 * function Playground() {
 *   return <${className} />;
 * }
 * \`\`\`
 */

import { useState, useCallback } from "react";
import { ${className}Props } from "./${className}.types";

/**
 * ${className} - ${description}
 */
export function ${className}({ }: ${className}Props) {
  // Local state for interactive demos
  const [variant, setVariant] = useState<string>("default");
  const [size, setSize] = useState<string>("md");

  /**
   * Handle variant change
   */
  const handleVariantChange = useCallback((value: string) => {
    setVariant(value);
  }, []);

  return (
    <div className="space-y-8">
      {/* Section 1: Basic Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Basic Examples
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Basic component examples */}
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

      {/* Section 3: Interactive Demo */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Interactive Demo
        </h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {/* Demo controls */}
        </div>
      </section>

      {/* Section 4: Usage Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Usage Examples
        </h3>
        <div className="space-y-4">
          <UsageExampleCard
            title="Basic Usage"
            description="Simple ${className.toLowerCase()} example"
            code={\`import { ${className} } from "@/components/playground";

function Example() {
  return <${className} />\`}
          />
        </div>
      </section>
    </div>
  );
}

/**
 * UsageExampleCard - Display code examples
 */
function UsageExampleCard({
  title,
  description,
  code
}: {
  title: string;
  description: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="relative group">
        <pre className="bg-muted p-4 overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1 text-sm bg-background border border-border rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
`;
}

/**
 * Generate types file
 */
function generateTypes(name: string): string {
  const className = name.endsWith(".tsx") ? name.replace(".tsx", "") : name;

  return `/**
 * Props interface for ${className}
 */
export interface ${className}Props {
  /** Description for prop1 */
  prop1?: string;
  /** Description for prop2 */
  prop2?: number;
}

/**
 * Default values for ${className} props
 */
export const DEFAULT_${className.toUpperCase()}_PROPS: Partial<${className}Props> = {
  prop1: "default",
  prop2: 0,
};
`;
}

/**
 * Update index.ts barrel export
 */
function updateIndexFile(componentName: string, componentPath: string): void {
  const indexPath = path.join(process.cwd(), "src/components/playground/index.ts");

  let content = "";
  if (fs.existsSync(indexPath)) {
    content = fs.readFileSync(indexPath, "utf-8");
  } else {
    content = `/**
 * Playground Components - Design System Showcase
 */
`;
  }

  // Check if already exported
  if (content.includes(`export { ${componentName} }`)) {
    console.log(`[Skip] ${componentName} already exported in index.ts`);
    return;
  }

  // Add export
  const exportLine = `export { ${componentName} } from "./${componentPath}";`;
  content += `\n${exportLine}\n`;

  fs.writeFileSync(indexPath, content, "utf-8");
  console.log(`[Success] Updated index.ts with ${componentName} export`);
}

/**
 * Main generation function
 */
function main() {
  const config = parseArgs();
  const className = config.name.endsWith(".tsx") ? config.name.replace(".tsx", "") : config.name;
  const componentDir = path.join(process.cwd(), "src/components/playground");
  const componentFile = path.join(componentDir, `${className}.tsx`);

  console.log(`\n🚀 Generating ${className} component...\n`);

  // Create directory if not exists
  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
    console.log(`[Success] Created directory: ${componentDir}`);
  }

  // Check if file already exists
  if (fs.existsSync(componentFile)) {
    console.error(`[Error] ${className}.tsx already exists!`);
    process.exit(1);
  }

  // Generate component file
  const componentContent = generateComponent(config);
  fs.writeFileSync(componentFile, componentContent, "utf-8");
  console.log(`[Success] Created ${className}.tsx (${config.template} template)`);

  // Generate types file if full template
  if (config.template === "full") {
    const typesFile = path.join(componentDir, `${className}.types.ts`);
    const typesContent = generateTypes(className);
    fs.writeFileSync(typesFile, typesContent, "utf-8");
    console.log(`[Success] Created ${className}.types.ts`);
  }

  // Update index.ts
  updateIndexFile(className, className);

  console.log(`\n✅ Component ${className} created successfully!\n`);
  console.log(`Next steps:`);
  console.log(`  1. Implement component logic in ${className}.tsx`);
  console.log(`  2. Add to Playground.tsx page`);
  console.log(`  3. Test with npm run dev\n`);
}

// Run the script
main();
