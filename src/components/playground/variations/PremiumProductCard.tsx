import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Heart, Leaf, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface PremiumProductCardProps {
  product: Product;
}

export function PremiumProductCard({ product }: PremiumProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const displayPrice = product.price;
  const isToday = product.arrivalDate === new Date().toISOString().split("T")[0];

  return (
    <Card
      className={cn(
        "group overflow-hidden relative bg-card h-full flex flex-col transition-all duration-300",
        "border-2",
        isHovered ? "border-amber-400 shadow-lg" : "border-amber-200/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shimmer Effect */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-500",
          isHovered && "opacity-100",
          "bg-gradient-to-r from-transparent via-amber-100/20 to-transparent",
          "bg-[length:200%_100%]",
          isHovered && "animate-shimmer"
        )}
        style={{
          backgroundPosition: isHovered ? "200% 0" : "-200% 0",
        }}
      />

      <Link to={`/urun/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <img
            src={product.images?.[0] || '/placeholder.svg'}
            alt={product.name}
            loading="lazy"
            width="400"
            height="400"
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              isHovered && "scale-110"
            )}
          />

          {/* Premium Badge */}
          {product.quality === "premium" && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 border-2 border-amber-200 shadow-md">
                <Award className="h-3 w-3" />
                Premium
              </span>
            </div>
          )}

          {/* Today Badge */}
          {isToday && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-haldeki-green-light text-haldeki-green shadow-md">
                <Leaf className="h-3 w-3" />
                Bugün Geldi
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className={cn(
              "absolute bottom-2 right-2 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
              isWishlisted
                ? "bg-amber-400 text-amber-900 scale-110"
                : "bg-white/90 text-gray-400 hover:bg-white hover:text-red-500",
              isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
          </button>
        </div>
      </Link>

      <div className="p-4 space-y-3 flex-1 flex flex-col bg-gradient-to-b from-card to-amber-50/30">
        <div className="shrink-0">
          <p className="text-xs text-muted-foreground mb-1">{product.origin}</p>
          <Link to={`/urun/${product.slug}`}>
            <h3 className={cn(
              "font-bold text-foreground transition-colors",
              isHovered && "text-amber-700"
            )}>
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto pt-2 border-t border-amber-200/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-amber-900">
                {displayPrice.toFixed(2)}₺
              </span>
              <span className="text-sm text-muted-foreground">
                /{product.unit}
              </span>
              {product.previousPrice && product.previousPrice > displayPrice && (
                <span className="block text-xs text-muted-foreground line-through">
                  {product.previousPrice.toFixed(2)}₺
                </span>
              )}
            </div>

            <Button
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-300 shadow-md",
                isHovered
                  ? "bg-amber-500 hover:bg-amber-600 scale-110"
                  : "bg-haldeki-green hover:bg-haldeki-green/90"
              )}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
