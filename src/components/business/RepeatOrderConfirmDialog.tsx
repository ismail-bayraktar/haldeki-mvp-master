// Repeat Order Confirmation Dialog Component (Faz 8)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react';
import { useRepeatOrder } from '@/hooks/useRepeatOrder';
import { formatPrice, getUnavailableReasonMessage } from '@/lib/orderUtils';
import type { RepeatOrderValidationResult, OrderItem } from '@/types';

interface RepeatOrderConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validation: RepeatOrderValidationResult;
  orderDate: string;
  onClose?: () => void;
  variant?: 'business' | 'customer';
}

/**
 * Dialog showing repeat order confirmation with:
 * - Available items to be added
 * - Unavailable items with reasons
 * - Price change warnings
 * - Confirm/Cancel actions
 */
export const RepeatOrderConfirmDialog = ({
  open,
  onOpenChange,
  validation,
  orderDate,
  onClose,
  variant = 'business',
}: RepeatOrderConfirmDialogProps) => {
  const navigate = useNavigate();
  const { repeatOrder, isRepeating } = useRepeatOrder();

  const handleConfirm = async () => {
    try {
      const result = await repeatOrder(validation);

      if (result.success) {
        // Close dialog and navigate to checkout
        onOpenChange(false);
        navigate('/checkout');
      }
    } catch (error) {
      console.error('Failed to repeat order:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    onClose?.();
  };

  const priceChangePercent = validation.totalOldPrice > 0
    ? (Math.abs(validation.priceDifference) / validation.totalOldPrice) * 100
    : 0;

  const significantPriceChange = priceChangePercent > 20;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tekrar Sipariş Onayı</DialogTitle>
          <DialogDescription>
            {validation.canRepeat
              ? `${validation.availableItems.length} ürün sepete eklenecek`
              : 'Bu sipariş tekrarlanamaz'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4">
            {/* Price Change Warning */}
            {validation.priceDifference !== 0 && (
              <Alert variant={significantPriceChange ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Fiyat Değişikliği</div>
                  <div className="text-sm mt-1">
                    {validation.priceIncreased ? 'Artış:' : 'Düşüş:'}{' '}
                    <span className={significantPriceChange ? 'font-bold' : ''}>
                      {formatPrice(Math.abs(validation.priceDifference))}
                    </span>
                    {' '}({priceChangePercent.toFixed(0)}%)
                  </div>
                  <div className="text-xs mt-1 text-muted-foreground">
                    Eski: {formatPrice(validation.totalOldPrice)} →
                    Yeni: {formatPrice(validation.totalNewPrice)}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Available Items */}
            {validation.availableItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Sepete Eklenecek Ürünler</h4>
                  <Badge variant="secondary">{validation.availableItems.length}</Badge>
                </div>
                <div className="space-y-2">
                  {validation.availableItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2 rounded border bg-green-50 dark:bg-green-950/20"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} adet × {formatPrice(item.price)}
                          {item.priceChanged && (
                            <span className="ml-2 text-amber-600 dark:text-amber-400">
                              (önceden: {formatPrice(item.oldPrice)})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unavailable Items */}
            {validation.unavailableItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="font-medium">Mevcut Olmayan Ürünler</h4>
                  <Badge variant="secondary">{validation.unavailableItems.length}</Badge>
                </div>
                <div className="space-y-2">
                  {validation.unavailableItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-2 rounded border bg-amber-50 dark:bg-amber-950/20"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {getUnavailableReasonMessage(item.reason)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cannot Repeat Warning */}
            {!validation.canRepeat && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Bu siparişin hiçbir ürünü şu anda mevcut değil. Lütfen menüden yeni ürünler seçin.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRepeating}
          >
            İptal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!validation.canRepeat || isRepeating}
            className="gap-2"
          >
            {isRepeating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ekleniyor...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Sepete Ekle ve Ödeme'ye Geç
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
