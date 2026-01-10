import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { BasicProductCard } from "./variations/BasicProductCard";
import { PremiumProductCard } from "./variations/PremiumProductCard";
import { QuickViewCard } from "./variations/QuickViewCard";
import { CompactCard } from "./variations/CompactCard";
import { AnimatedCard } from "./variations/AnimatedCard";
import { FlipCard } from "./variations/FlipCard";
import { AutoHoverFlipCard } from "./variations/AutoHoverFlipCard";
import { AnimatedVariantSelector } from "./variations/AnimatedVariantSelector";
import { AnimatedVariantSelectorHover } from "./variations/AnimatedVariantSelectorHover";
import { AnimatedProductCard } from "./variations/AnimatedProductCard";
import { ExpandableProductCard } from "./variations/ExpandableProductCard";
import { ExpandableProductCardHover } from "./variations/ExpandableProductCard";
import { ProductVariant } from "@/types/product";
import { mockProducts } from "@/data/mock/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Code, Play, Pause } from "lucide-react";

type StateType = "default" | "loading" | "error" | "success";

export function ProductCardShowcase() {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [flipEnabled, setFlipEnabled] = useState(true);
  const [expandableHoverMode, setExpandableHoverMode] = useState(false);
  const [stateType, setStateType] = useState<StateType>("default");
  const [showCode, setShowCode] = useState(false);

  const products = mockProducts.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">ProductCard Varyasyonları</h2>
        <p className="text-muted-foreground">
          Farklı ProductCard bileşen varyasyonlarını ve animasyonları keşfedin.
        </p>
      </div>

      {/* Controls */}
      <Card className="p-6 bg-card border border-border">
        <div className="flex flex-wrap items-center gap-6">
          {/* Animation Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="animations"
              checked={animationsEnabled}
              onCheckedChange={setAnimationsEnabled}
            />
            <Label htmlFor="animations" className="cursor-pointer flex items-center gap-2">
              {animationsEnabled ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              Animasyonlar
            </Label>
          </div>

          {/* Flip Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="flip"
              checked={flipEnabled}
              onCheckedChange={setFlipEnabled}
            />
            <Label htmlFor="flip" className="cursor-pointer">
              Kart Çevirme
            </Label>
          </div>

          {/* Expandable Mode Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="expandable-mode"
              checked={expandableHoverMode}
              onCheckedChange={setExpandableHoverMode}
            />
            <Label htmlFor="expandable-mode" className="cursor-pointer">
              Genişletilebilir Hover Modu
            </Label>
          </div>

          {/* State Selector */}
          <div className="flex items-center gap-3">
            <Label>Durum:</Label>
            <div className="flex gap-2">
              {(["default", "loading", "error", "success"] as StateType[]).map((state) => (
                <Button
                  key={state}
                  variant={stateType === state ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStateType(state)}
                  className="capitalize"
                >
                  {state}
                </Button>
              ))}
            </div>
          </div>

          {/* Code Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="ml-auto gap-2"
          >
            <Code className="h-4 w-4" />
            {showCode ? "Kodu Gizle" : "Kodu Göster"}
          </Button>
        </div>
      </Card>

      {/* Code Snippet */}
      {showCode && (
        <Card className="p-6 bg-muted/50 border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Code className="h-4 w-4" />
            Kullanım Örneği
          </h3>
          <pre className="overflow-x-auto text-sm bg-background p-4 rounded-lg border border-border">
            <code>{`import { ProductCard } from "@/components/product/ProductCard";
import { PremiumProductCard } from "@/components/playground/variations/PremiumProductCard";
import { FlipCard } from "@/components/playground/variations/FlipCard";
import { AutoHoverFlipCard } from "@/components/playground/variations/AutoHoverFlipCard";
import { AnimatedVariantSelector } from "@/components/playground/variations/AnimatedVariantSelector";
import { AnimatedVariantSelectorHover } from "@/components/playground/variations/AnimatedVariantSelectorHover";
import { AnimatedProductCard } from "@/components/playground/variations/AnimatedProductCard";
import { ExpandableProductCard } from "@/components/playground/variations/ExpandableProductCard";
import { ExpandableProductCardHover } from "@/components/playground/variations/ExpandableProductCardHover";

// Basic ProductCard
<ProductCard product={product} />

// Premium Card with Shimmer
<PremiumProductCard product={product} />

// Compact Card for Grid Views
<CompactCard product={product} />

// Animated Card with Micro-interactions
<AnimatedCard product={product} animationsEnabled={true} />

// Flip Card with Click Trigger
<FlipCard product={product} flipEnabled={true} />

// Flip Card with Hover Trigger (Auto Flip)
<AutoHoverFlipCard product={product} flipEnabled={true} />

// Animated ProductCard (Click to open variant list UPWARD)
<AnimatedProductCard product={product} animationsEnabled={true} />

// Expandable Card with Click Trigger
<ExpandableProductCard product={product} flipEnabled={true} />

// Expandable Card with Hover Trigger
<ExpandableProductCardHover product={product} flipEnabled={true} />

// Variant Selector with Click Trigger
<AnimatedVariantSelector
  variants={variants}
  selectedVariant={selectedVariant}
  onVariantSelect={handleSelect}
  productPrice={45.00}
  priceUnit="kg"
/>

// Variant Selector with Hover Trigger
<AnimatedVariantSelectorHover
  variants={variants}
  selectedVariant={selectedVariant}
  onVariantSelect={handleSelect}
  productPrice={45.00}
  priceUnit="kg"
  hoverDelay={150}
/>`}</code>
          </pre>
        </Card>
      )}

      {/* Cards Grid */}
      <div className="space-y-8">
        {/* Basic ProductCard */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-haldeki-green"></span>
            Basic ProductCard (Mevcut)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(0, 2).map((product) => (
              <BasicProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Premium Card */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Premium Card (Shimmer Effect)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(1, 3).map((product) => (
              <PremiumProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Quick View Card */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fresh-orange"></span>
            Quick View Card (Hover Reveal)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(2, 4).map((product) => (
              <QuickViewCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Compact Card */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Compact Card (Dense Layout)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.slice(0, 3).map((product) => (
              <CompactCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Animated Card */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Animated Card (Micro-interactions)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(3, 5).map((product) => (
              <AnimatedCard
                key={product.id}
                product={product}
                animationsEnabled={animationsEnabled}
              />
            ))}
          </div>
        </section>

        {/* Flip Card */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Flip Card (Click Trigger)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(4, 6).map((product) => (
              <FlipCard
                key={product.id}
                product={product}
                flipEnabled={flipEnabled}
              />
            ))}
          </div>
        </section>

        {/* Auto Hover Flip Card */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Auto Flip Card (Hover Trigger)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(2, 4).map((product) => (
              <AutoHoverFlipCard
                key={product.id}
                product={product}
                flipEnabled={flipEnabled}
              />
            ))}
          </div>
        </section>

        {/* Animated ProductCard - Upward Variant List */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Animated ProductCard (Upward Variant List)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(0, 2).map((product) => (
              <AnimatedProductCard
                key={product.id}
                product={product}
                animationsEnabled={animationsEnabled}
              />
            ))}
          </div>
          <Card className="mt-4 p-6 bg-muted/30 border border-border">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Yukarı Açılan Liste</p>
                  <p className="text-muted-foreground">Varyasyon listesi butonun ÜSTÜNDE açılır (bottom: 100%)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Click Trigger</p>
                  <p className="text-muted-foreground">+ butonuna tıklayınca liste açılır, icon 90 derece döner</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Slide-Up Animasyonu</p>
                  <p className="text-muted-foreground">Liste yukarı doğru slide-up animasyonuyla açılır</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Stagger Animasyon</p>
                  <p className="text-muted-foreground">Varyasyonlar sırayla gelir (50ms gecikme)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Erişilebilirlik</p>
                  <p className="text-muted-foreground">Keyboard navigasyonu, ARIA etiketleri, Escape desteği</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Animated Variant Selector - Click Version */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fresh-orange"></span>
            Animated Variant Selector (Click Trigger)
          </h3>
          <Card className="p-8 bg-muted/30 border border-border">
            <div className="max-w-md mx-auto space-y-6">
              {/* Demo */}
              <div className="bg-background rounded-lg p-6 border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  Hover yapin (+ döner) • Tıklayin (liste açilir)
                </p>
                <div className="flex items-center justify-center">
                  <AnimatedVariantSelector
                    variants={[
                      { id: '1', size: '1 kg', label: '1 kg', priceMultiplier: 1, isDefault: true },
                      { id: '2', size: '3 kg', label: '3 kg', priceMultiplier: 2.9, isDefault: false },
                      { id: '3', size: '5 kg', label: '5 kg', priceMultiplier: 4.7, isDefault: false },
                      { id: '4', size: '10 kg', label: '10 kg', priceMultiplier: 9.2, isDefault: false },
                    ]}
                    selectedVariant={{ id: '1', size: '1 kg', label: '1 kg', priceMultiplier: 1, isDefault: true }}
                    onVariantSelect={(v) => console.log('Selected:', v)}
                    productPrice={45.00}
                    priceUnit="kg"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Hover Animasyonu</p>
                    <p className="text-muted-foreground">+ icon 90 derece döner, büyür, rengi degisir</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Click Trigger</p>
                    <p className="text-muted-foreground">Tıklayınca varyasyon listesi slide-up ile açilir</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Click Outside Close</p>
                    <p className="text-muted-foreground">Dısarı tıklayınca liste kapanır</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Erişilebilirlik</p>
                    <p className="text-muted-foreground">Keyboard navigasyonu, ARIA etiketleri, Escape desteği</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Animated Variant Selector - Hover Version */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            Animated Variant Selector (Hover Trigger)
          </h3>
          <Card className="p-8 bg-muted/30 border border-border">
            <div className="max-w-md mx-auto space-y-6">
              {/* Demo */}
              <div className="bg-background rounded-lg p-6 border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  Üzerine gelin (liste otomatik açılır) • Çekin (kapanır)
                </p>
                <div className="flex items-center justify-center">
                  <AnimatedVariantSelectorHover
                    variants={[
                      { id: '1', size: '1 kg', label: '1 kg', priceMultiplier: 1, isDefault: true },
                      { id: '2', size: '3 kg', label: '3 kg', priceMultiplier: 2.9, isDefault: false },
                      { id: '3', size: '5 kg', label: '5 kg', priceMultiplier: 4.7, isDefault: false },
                      { id: '4', size: '10 kg', label: '10 kg', priceMultiplier: 9.2, isDefault: false },
                    ]}
                    selectedVariant={{ id: '1', size: '1 kg', label: '1 kg', priceMultiplier: 1, isDefault: true }}
                    onVariantSelect={(v) => console.log('Selected:', v)}
                    productPrice={45.00}
                    priceUnit="kg"
                    hoverDelay={150}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Hover Trigger</p>
                    <p className="text-muted-foreground">Üzerine gelince liste otomatik açılır</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Delayed Close</p>
                    <p className="text-muted-foreground">Çekincede 150ms gecikme ile kapanır (jitter önler)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Stagger Animasyon</p>
                    <p className="text-muted-foreground">Varyasyonlar sirayla gelir (50ms gecikme)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Smooth Hover States</p>
                    <p className="text-muted-foreground">Icon döner, büyür, renk değişir (300ms)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-haldeki-green mt-0.5">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Erişilebilirlik</p>
                    <p className="text-muted-foreground">Keyboard navigasyonu, ARIA etiketleri, Escape desteği</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Expandable Cards */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Genişletilebilir Kartlar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {expandableHoverMode ? (
              products.slice(1, 3).map((product) => (
                <ExpandableProductCardHover
                  key={product.id}
                  product={product}
                  flipEnabled={flipEnabled}
                />
              ))
            ) : (
              products.slice(1, 3).map((product) => (
                <ExpandableProductCard
                  key={product.id}
                  product={product}
                  flipEnabled={flipEnabled}
                />
              ))
            )}
          </div>
          <Card className="mt-4 p-6 bg-muted/30 border border-border">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">
                    {expandableHoverMode ? "Hover Trigger" : "Click Trigger"}
                  </p>
                  <p className="text-muted-foreground">
                    {expandableHoverMode
                      ? "Kartın üzerine gelince otomatik olarak genişler"
                      : "Karta tıklayınca genişler, tekrar tıklayınca kapanır"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Detaylı İçerik</p>
                  <p className="text-muted-foreground">Genleşme sırasında ek ürün detayları görünür</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Smooth Animasyon</p>
                  <p className="text-muted-foreground">Yumuşak genişleme animasyonu (300ms)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Çevirme Animasyonu</p>
                  <p className="text-muted-foreground">Kart arka yüzünde ek bilgiler gösterilir</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-haldeki-green mt-0.5">✓</span>
                <div>
                  <p className="font-medium text-foreground">Erişilebilirlik</p>
                  <p className="text-muted-foreground">Keyboard navigasyonu, ARIA etiketleri</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* All Variations Comparison */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Tüm Varyasyonlar Karşılaştırması
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Basic</p>
              <BasicProductCard product={products[0]} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Premium</p>
              <PremiumProductCard product={products[0]} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Quick View</p>
              <QuickViewCard product={products[0]} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Compact</p>
              <CompactCard product={products[0]} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Flip (Click)</p>
              <FlipCard product={products[0]} flipEnabled={flipEnabled} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Flip (Hover)</p>
              <AutoHoverFlipCard product={products[0]} flipEnabled={flipEnabled} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Expandable</p>
              <ExpandableProductCard product={products[0]} flipEnabled={flipEnabled} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Expand. Hover</p>
              <ExpandableProductCardHover product={products[0]} flipEnabled={flipEnabled} />
            </div>
          </div>
        </section>
      </div>

      {/* Features List */}
      <Card className="p-6 bg-muted/30 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Özellikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-haldeki-green mt-0.5">✓</span>
            <div>
              <p className="font-medium text-foreground">GPU Hızlandırmalı Animasyonlar</p>
              <p className="text-muted-foreground">60fps performans için transform ve opacity kullanımı</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-haldeki-green mt-0.5">✓</span>
            <div>
              <p className="font-medium text-foreground">Erişilebilirlik Desteği</p>
              <p className="text-muted-foreground">prefers-reduced-motion desteği</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-haldeki-green mt-0.5">✓</span>
            <div>
              <p className="font-medium text-foreground">Responsive Tasarım</p>
              <p className="text-muted-foreground">Tüm ekran boyutlarında optimum görünüm</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-haldeki-green mt-0.5">✓</span>
            <div>
              <p className="font-medium text-foreground">Micro-interactions</p>
              <p className="text-muted-foreground">Hover, tap ve durum animasyonları</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-haldeki-green mt-0.5">✓</span>
            <div>
              <p className="font-medium text-foreground">TypeScript</p>
              <p className="text-muted-foreground">Tam tip güvenliği</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-haldeki-green mt-0.5">✓</span>
            <div>
              <p className="font-medium text-foreground">Performans Optimize</p>
              <p className="text-muted-foreground">Lazy loading ve code splitting</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
