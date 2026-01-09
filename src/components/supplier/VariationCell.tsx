// Variation Cell Component for Supplier Product Table
// Displays variations as clickable tags that open the variation modal

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import type { SupplierProduct } from '@/types/supplier';
import type { ProductVariationsGrouped } from '@/types/multiSupplier';

export interface VariationCellProps {
  product: SupplierProduct;
  onOpenModal: (productId: string) => void;
}

export function VariationCell({ product, onOpenModal }: VariationCellProps) {
  const variations = product.variations || [];

  // Format variations for display
  const getVariationsDisplay = () => {
    if (variations.length === 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenModal(product.product_id || product.id)}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Varyasyon Ekle
        </Button>
      );
    }

    return (
      <div
        className="flex flex-wrap gap-1 cursor-pointer hover:bg-muted p-1 rounded -mx-1"
        onClick={() => onOpenModal(product.product_id || product.id)}
        title="Varyasyonları düzenlemek için tıklayın"
      >
        {variations.slice(0, 3).map((v, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs">
            {v.variation_type}: {v.values.length}
          </Badge>
        ))}
        {variations.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{variations.length - 3}
          </Badge>
        )}
      </div>
    );
  };

  return getVariationsDisplay();
}
