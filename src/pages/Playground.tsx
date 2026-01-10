/**
 * Playground - Design System Showcase
 *
 * This route showcases the Haldeki design system components and tokens.
 * It's a reference page for designers and developers to see all available
 * UI elements in one place.
 */

import { TokenShowcase } from "@/components/playground";
import { CoreUI } from "@/components/playground";
import { AIReviewPanel } from "@/components/playground";
import { ProductCardShowcase } from "@/components/playground";
import { useState } from "react";

type Tab = "tokens" | "components" | "productcard" | "guidelines";

export default function Playground() {
  const [activeTab, setActiveTab] = useState<Tab>("tokens");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-haldeki-green">
                Design System Playground
              </h1>
              <p className="text-muted-foreground mt-1">
                Haldeki Design System - Component & Token Showcase
              </p>
            </div>
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Hello, Playground!
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to the Haldeki Design System showcase. This page demonstrates
              all the design tokens, components, and patterns used throughout the
              application. Use this as a reference for consistent UI implementation.
            </p>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="mb-8">
          <div className="flex gap-2 border-b border-border">
            <TabButton
              active={activeTab === "tokens"}
              onClick={() => setActiveTab("tokens")}
            >
              Design Tokens
            </TabButton>
            <TabButton
              active={activeTab === "components"}
              onClick={() => setActiveTab("components")}
            >
              Core Components
            </TabButton>
            <TabButton
              active={activeTab === "productcard"}
              onClick={() => setActiveTab("productcard")}
            >
              ProductCard
            </TabButton>
            <TabButton
              active={activeTab === "guidelines"}
              onClick={() => setActiveTab("guidelines")}
            >
              Design Guidelines
            </TabButton>
          </div>
        </section>

        {/* Tab Content */}
        <section>
          {activeTab === "tokens" && (
            <div className="animate-fade-in">
              <TokenShowcase />
            </div>
          )}
          {activeTab === "components" && (
            <div className="animate-fade-in">
              <CoreUI />
            </div>
          )}
          {activeTab === "productcard" && (
            <div className="animate-fade-in">
              <ProductCardShowcase />
            </div>
          )}
          {activeTab === "guidelines" && (
            <div className="animate-fade-in">
              <AIReviewPanel />
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Haldeki Design System &copy; 2025 - Built with Andika, Tailwind CSS, and React
          </p>
        </div>
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium border-b-2 transition-colors
        ${active
          ? "border-haldeki-green text-haldeki-green"
          : "border-transparent text-muted-foreground hover:text-foreground"
        }
      `}
    >
      {children}
    </button>
  );
}
