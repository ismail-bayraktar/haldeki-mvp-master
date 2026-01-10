// Product Price Modal - Modal for suppliers to enter their price (Phase 12)

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MAX_PRICE, MAX_STOCK, clampPrice, clampStock, isValidPrice, isValidStock, sanitizeImageUrl } from '@/lib/validation';
import type { GlobalProductCatalogItem } from '@/types/supplier';

interface ProductPriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: GlobalProductCatalogItem;
  onSubmit: (data: { productId: string; price: number; stock: number }) => void;
  isSubmitting?: boolean;
}

export function ProductPriceModal({
  open,
  onOpenChange,
  product,
  onSubmit,
  isSubmitting = false,
}: ProductPriceModalProps) {
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('100');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    // Validate and clamp inputs for security
    if (!isValidPrice(priceNum)) {
      return;
    }

    if (!isValidStock(stockNum)) {
      return;
    }

    // Clamp values to max limits
    const clampedPrice = clampPrice(priceNum);
    const clampedStock = clampStock(stockNum);

    onSubmit({
      productId: product.id,
      price: clampedPrice,
      stock: clampedStock,
    });
  };

  const isValid = parseFloat(price) > 0 && parseInt(stock, 10) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fiyat Gir</DialogTitle>
          <DialogDescription>
            Bu ürün için kendi fiyatınızı ve stok miktarınızı girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Product Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl text-muted-foreground">📦</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-2 mb-1">
                      {product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {product.category} • {product.unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Input */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Fiyat (TL) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₺
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  max={MAX_PRICE}
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7"
                  required
                  autoFocus
                  data-testid="price-input"
                />
              </div>
            </div>

            {/* Stock Input */}
            <div className="space-y-2">
              <Label htmlFor="stock">
                Stok Miktarı ({product.unit}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                max={MAX_STOCK}
                placeholder="100"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                data-testid="stock-input"
              />
            </div>

            {/* Unit Display */}
            <p className="text-sm text-muted-foreground">
              Fiyat birim başına, {product.unit} olarak girilecektir
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              data-testid="submit-price-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
