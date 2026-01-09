import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";

interface PriceStatsBadgeProps {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  supplierCount: number;
}

export function PriceStatsBadge({
  minPrice,
  maxPrice,
  avgPrice,
  supplierCount,
}: PriceStatsBadgeProps) {
  const priceSpread = maxPrice - minPrice;
  const spreadPercentage = ((priceSpread / minPrice) * 100).toFixed(0);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg">
      {/* Best Price */}
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-green-600" />
        <div>
          <p className="text-xs text-muted-foreground">En İyi</p>
          <p className="font-bold text-green-700">{minPrice.toFixed(2)} TL</p>
        </div>
      </div>

      {/* Average Price */}
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-xs text-muted-foreground">Ortalama</p>
          <p className="font-bold text-blue-700">{avgPrice.toFixed(2)} TL</p>
        </div>
      </div>

      {/* Highest Price */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-red-600" />
        <div>
          <p className="text-xs text-muted-foreground">En Yüksek</p>
          <p className="font-bold text-red-700">{maxPrice.toFixed(2)} TL</p>
        </div>
      </div>

      {/* Spread Indicator */}
      {priceSpread > 0 && (
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs">
            %{spreadPercentage} fark
          </Badge>
        </div>
      )}

      {/* Supplier Count */}
      <Badge variant="secondary" className="text-xs">
        {supplierCount} tedarikçi
      </Badge>
    </div>
  );
}
