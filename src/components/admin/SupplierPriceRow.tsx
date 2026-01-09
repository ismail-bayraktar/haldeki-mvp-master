import { Badge } from "@/components/ui/badge";
import { Trophy, Package, AlertTriangle } from "lucide-react";
import type { BugunHaldeComparisonRow } from "@/types/multiSupplier";

interface SupplierPriceRowProps {
  supplier: BugunHaldeComparisonRow;
  isBestPrice: boolean;
}

const availabilityConfig = {
  plenty: { icon: Package, label: "Stokta", className: "text-green-600 bg-green-50" },
  limited: { icon: Package, label: "Kısıtlı", className: "text-amber-600 bg-amber-50" },
  last: { icon: AlertTriangle, label: "Son Ürünler", className: "text-red-600 bg-red-50" },
};

const qualityConfig = {
  premium: { label: "Premium", className: "bg-purple-100 text-purple-700 border-purple-200" },
  standart: { label: "Standart", className: "bg-gray-100 text-gray-700 border-gray-200" },
  ekonomik: { label: "Ekonomik", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

export function SupplierPriceRow({ supplier, isBestPrice }: SupplierPriceRowProps) {
  const availability = availabilityConfig[supplier.availability];
  const quality = qualityConfig[supplier.quality];
  const AvailabilityIcon = availability.icon;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        isBestPrice
          ? "border-green-300 bg-green-50/50 hover:bg-green-50"
          : "border-border bg-muted/20 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Best Price Badge */}
        {isBestPrice && (
          <div className="flex items-center gap-1 text-green-600">
            <Trophy className="h-4 w-4" />
          </div>
        )}

        {/* Supplier Name */}
        <div className="flex-1">
          <p className="font-medium text-sm">{supplier.supplier_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={`text-xs ${quality.className}`}>
              {quality.label}
            </Badge>
            {supplier.is_featured && (
              <Badge variant="secondary" className="text-xs">
                Öne Çıkan
              </Badge>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="font-bold text-lg">
            {supplier.price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">TL</span>
          </p>
          {supplier.previous_price && supplier.price_change !== 'stable' && (
            <p className={`text-xs ${supplier.price_change === 'decreased' ? 'text-green-600' : 'text-red-600'}`}>
              {supplier.price_change === 'decreased' ? '↓' : '↑'}
              {Math.abs(((supplier.price - supplier.previous_price) / supplier.previous_price) * 100).toFixed(0)}%
            </p>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-1.5">
          <AvailabilityIcon className={`h-3.5 w-3.5 ${availability.className.split(' ')[0]}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${availability.className}`}>
            {availability.label}
          </span>
        </div>
      </div>
    </div>
  );
}
