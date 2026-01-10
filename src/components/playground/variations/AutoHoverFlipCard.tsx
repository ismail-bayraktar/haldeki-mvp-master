import { Link } from "react-router-dom";
import { Plus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect } from "react";

interface AutoHoverFlipCardProps {
  product: Product;
  flipEnabled?: boolean;
}

const HOVER_DELAY_MS = 150;

export function AutoHoverFlipCard({ product, flipEnabled = true }: AutoHoverFlipCardProps) {
  const displayPrice = product.price;
  const [isFlipped, setIsFlipped] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = useCallback(() => {
    if (!flipEnabled) return;
    clearTimeout(hoverTimeoutRef.current);
    setIsFlipped(true);
  }, [flipEnabled]);

  const handleMouseLeave = useCallback(() => {
    if (!flipEnabled) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsFlipped(false);
    }, HOVER_DELAY_MS);
  }, [flipEnabled]);

  useEffect(() => {
    return () => {
      clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flip-card-container w-full h-[320px]">
      <Card
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "flip-card-inner cursor-pointer transition-transform duration-500 ease-out will-change-transform",
          isFlipped && "flipped"
        )}
      >
        {/* Front Side */}
        <div className="flip-card-front">
          <Link to={`/urun/${product.slug}`} className="block h-full">
            <div className="relative aspect-square overflow-hidden bg-secondary/30">
              <img
                src={product.images?.[0] || '/placeholder.svg'}
                alt={product.name}
                loading="lazy"
                width="400"
                height="400"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />

              {/* Premium Badge */}
              {product.quality === "premium" && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                  <Award className="h-3 w-3" />
                  Premium
                </span>
              )}

              {/* Hover Indicator */}
              {flipEnabled && (
                <div className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{product.origin}</p>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <span className="text-xl font-bold text-foreground">
                    {displayPrice.toFixed(2)}₺
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{product.unit}
                  </span>
                </div>

                <Button size="icon" className="h-9 w-9 rounded-full">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Back Side */}
        <div className="flip-card-back bg-card p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-foreground mb-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{product.description}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kalite:</span>
                <span className="font-medium text-foreground capitalize">{product.quality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Menşei:</span>
                <span className="font-medium text-foreground">{product.origin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Birim:</span>
                <span className="font-medium text-foreground">{product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stok:</span>
                <span className="font-medium text-stock-plenty">Bol Stok</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Link to={`/urun/${product.slug}`} className="block">
              <Button className="w-full" size="sm">
                Ürün Detayı
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
