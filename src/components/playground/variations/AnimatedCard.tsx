import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Heart, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  product: Product;
  animationsEnabled?: boolean;
}

export function AnimatedCard({ product, animationsEnabled = true }: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const displayPrice = product.price;

  const animationClasses = animationsEnabled ? {
    card: cn(
      "transition-all duration-300 ease-out",
      isHovered ? "scale-105 -translate-y-2 shadow-xl" : "scale-100 translate-y-0"
    ),
    image: cn(
      "transition-transform duration-500 ease-out",
      isHovered ? "scale-110 rotate-2" : "scale-100 rotate-0"
    ),
    button: cn(
      "transition-all duration-200 ease-out",
      isHovered ? "scale-110" : "scale-100"
    ),
    heart: cn(
      "transition-all duration-300 ease-out",
      isLiked ? "scale-125 rotate-12" : "scale-100 rotate-0"
    ),
    content: cn(
      "transition-all duration-300 ease-out",
      isHovered ? "translate-y-1" : "translate-y-0"
    ),
    price: cn(
      "transition-all duration-300 ease-out",
      isHovered ? "scale-110" : "scale-100"
    ),
    badge: cn(
      "transition-all duration-500 ease-out",
      isHovered ? "scale-110" : "scale-100"
    ),
  } : {
    card: "",
    image: "",
    button: "",
    heart: "",
    content: "",
    price: "",
    badge: "",
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden bg-card h-full flex flex-col",
        animationClasses.card
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/urun/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <img
            src={product.images?.[0] || '/placeholder.svg'}
            alt={product.name}
            loading="lazy"
            width="400"
            height="400"
            className={cn(
              "w-full h-full object-cover",
              animationClasses.image
            )}
          />

          {/* Animated Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.quality === "premium" && (
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200",
                animationClasses.badge
              )}>
                <Award className="h-3 w-3" />
                Premium
              </span>
            )}
          </div>

          {/* Heart Button with Spring Animation */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className={cn(
              "absolute top-2 right-2 h-9 w-9 rounded-full flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border hover:bg-card transition-all",
              animationClasses.heart
            )}
          >
            <Heart className={cn("h-4 w-4 transition-colors", isLiked ? "fill-current text-red-500" : "text-muted-foreground")} />
          </button>
        </div>
      </Link>

      <div className={cn("p-4 space-y-3 flex-1 flex flex-col", animationClasses.content)}>
        <div className="shrink-0">
          <p className="text-xs text-muted-foreground mb-1">{product.origin}</p>
          <Link to={`/urun/${product.slug}`}>
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-xs px-2 py-0.5 rounded-full bg-stock-plenty/10 text-stock-plenty")}>
            Bol Stok
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t shrink-0 mt-auto">
          <div>
            <span className={cn("text-xl font-bold text-foreground inline-block", animationClasses.price)}>
              {displayPrice.toFixed(2)}₺
            </span>
            <span className="text-sm text-muted-foreground">
              /{product.unit}
            </span>
          </div>

          <Button
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full bg-primary hover:bg-primary/90",
              animationClasses.button
            )}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
