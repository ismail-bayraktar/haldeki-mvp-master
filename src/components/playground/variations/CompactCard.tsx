import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface CompactCardProps {
  product: Product;
}

export function CompactCard({ product }: CompactCardProps) {
  const displayPrice = product.price;
  const isToday = product.arrivalDate === new Date().toISOString().split("T")[0];

  const availabilityColors = {
    plenty: "bg-stock-plenty/10 text-stock-plenty",
    limited: "bg-stock-limited/10 text-stock-limited",
    last: "bg-stock-last/10 text-stock-last",
  };

  const availabilityLabels = {
    plenty: "Bol",
    limited: "Sınırlı",
    last: "Son",
  };

  return (
    <Card className="group overflow-hidden bg-card transition-all duration-200 hover:shadow-md">
      <div className="flex gap-3 p-3">
        {/* Compact Image */}
        <Link to={`/urun/${product.slug}`} className="shrink-0">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary/30">
            <img
              src={product.images?.[0] || '/placeholder.svg'}
              alt={product.name}
              loading="lazy"
              width="80"
              height="80"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {isToday && (
              <div className="absolute top-0.5 left-0.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-haldeki-green text-[8px] text-white font-bold">
                  Y
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground truncate">{product.origin}</p>
            <Link to={`/urun/${product.slug}`}>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                {product.name}
              </h3>
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground leading-none">
                {displayPrice.toFixed(0)}₺
              </span>
              <span className="text-[10px] text-muted-foreground">
                /{product.unit}
              </span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded", availabilityColors[product.availability])}>
                {availabilityLabels[product.availability]}
              </span>
            </div>

            <Button
              size="icon"
              className="h-7 w-7 rounded-full shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
