import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Award, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  product: Product;
  flipEnabled?: boolean;
}

export function FlipCard({ product, flipEnabled = true }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayPrice = product.price;

  const handleFlip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (flipEnabled) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className="flip-card-container w-full h-[320px]">
      <Card
        className={cn(
          "flip-card-inner cursor-pointer",
          flipEnabled && isFlipped && "flipped"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500",
                  isHovered && "scale-105"
                )}
              />

              {/* Flip Button */}
              {flipEnabled && (
                <button
                  onClick={handleFlip}
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-card transition-all hover:rotate-180"
                  title="Detayları gör"
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                </button>
              )}

              {/* Premium Badge */}
              {product.quality === "premium" && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                  <Award className="h-3 w-3" />
                  Premium
                </span>
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
            <Button
              onClick={handleFlip}
              variant="outline"
              className="w-full gap-2"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              Geri Dön
            </Button>

            <Link to={`/urun/${product.slug}`}>
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
