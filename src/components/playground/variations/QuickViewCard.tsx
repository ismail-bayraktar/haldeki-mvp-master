import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface QuickViewCardProps {
  product: Product;
}

export function QuickViewCard({ product }: QuickViewCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayPrice = product.price;
  const isToday = product.arrivalDate === new Date().toISOString().split("T")[0];

  const availabilityColors = {
    plenty: "bg-stock-plenty/10 text-stock-plenty",
    limited: "bg-stock-limited/10 text-stock-limited",
    last: "bg-stock-last/10 text-stock-last",
  };

  const availabilityLabels = {
    plenty: "Bol Stok",
    limited: "Sınırlı",
    last: "Son Ürünler",
  };

  return (
    <Card
      className="group overflow-hidden bg-card h-full flex flex-col transition-all duration-300 hover:shadow-lg"
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
              "w-full h-full object-cover transition-transform duration-500",
              isHovered ? "scale-110" : "scale-100"
            )}
          />

          {/* Quick View Overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 flex items-center justify-center",
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <Button
              variant="secondary"
              className="gap-2 transform transition-transform duration-300 hover:scale-110"
            >
              <Eye className="h-4 w-4" />
              Hızlı Görüntüle
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isToday && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-haldeki-green-light text-haldeki-green">
                <Leaf className="h-3 w-3" />
                Bugün Geldi
              </span>
            )}
            <span className={cn("text-xs px-2 py-0.5 rounded-full", availabilityColors[product.availability])}>
              {availabilityLabels[product.availability]}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="shrink-0">
          <p className="text-xs text-muted-foreground mb-1">{product.origin}</p>
          <Link to={`/urun/${product.slug}`}>
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Quick Details Reveal */}
        <div
          className={cn(
            "space-y-2 overflow-hidden transition-all duration-300",
            isHovered ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Kalite:</span>
              <span className="font-medium text-foreground capitalize">{product.quality}</span>
            </div>
            <div className="flex justify-between">
              <span>Durum:</span>
              <span className="font-medium text-foreground">{availabilityLabels[product.availability]}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t shrink-0 mt-auto">
          <div>
            <span className="text-xl font-bold text-foreground">
              {displayPrice.toFixed(2)}₺
            </span>
            <span className="text-sm text-muted-foreground">
              /{product.unit}
            </span>
          </div>

          <Button
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full transition-all duration-300",
              isHovered ? "scale-110" : "scale-100"
            )}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
