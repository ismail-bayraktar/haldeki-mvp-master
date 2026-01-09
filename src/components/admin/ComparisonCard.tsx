import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceStatsBadge } from "./PriceStatsBadge";
import { SupplierPriceRow } from "./SupplierPriceRow";
import type { BugunHaldeComparisonRow } from "@/types/multiSupplier";

interface ComparisonCardProps {
  product: string;
  productImage: string | null;
  category: string;
  suppliers: BugunHaldeComparisonRow[];
}

export function ComparisonCard({ product, productImage, category, suppliers }: ComparisonCardProps) {
  if (suppliers.length === 0) return null;

  const firstSupplier = suppliers[0];
  const minPrice = Math.min(...suppliers.map(s => s.price));
  const maxPrice = Math.max(...suppliers.map(s => s.price));
  const avgPrice = suppliers.reduce((sum, s) => sum + s.price, 0) / suppliers.length;

  // Extract unique variations from all suppliers
  const variations = new Set<string>();
  suppliers.forEach(s => {
    // Variations would be stored in metadata or joined data
    // For now, showing basic info
  });

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Product Header */}
        <div className="flex items-start gap-4 mb-4">
          {productImage && (
            <img
              src={productImage}
              alt={product}
              className="w-16 h-16 rounded-lg object-cover border border-border"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-bold">{product}</h3>
            <Badge variant="outline" className="mt-1">{category}</Badge>
          </div>
        </div>

        {/* Price Statistics */}
        <div className="mb-4">
          <PriceStatsBadge
            minPrice={minPrice}
            maxPrice={maxPrice}
            avgPrice={avgPrice}
            supplierCount={suppliers.length}
          />
        </div>

        {/* Supplier Price List */}
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <SupplierPriceRow
              key={`${supplier.supplier_id}-${supplier.product_id}`}
              supplier={supplier}
              isBestPrice={supplier.price === minPrice}
            />
          ))}
        </div>

        {/* Variations (if available) */}
        {variations.size > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Varyasyonlar:</p>
            <div className="flex flex-wrap gap-1">
              {Array.from(variations).map((v) => (
                <Badge key={v} variant="secondary" className="text-xs">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
