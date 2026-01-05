// Repeat Order Button Component (Faz 8)

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepeatOrderConfirmDialog } from './RepeatOrderConfirmDialog';
import { useRepeatOrder } from '@/hooks/useRepeatOrder';
import type { OrderItem, RepeatOrderValidationResult } from '@/types';

interface RepeatOrderButtonProps {
  orderId: string;
  orderItems: OrderItem[];
  orderDate: string;
  variant?: 'business' | 'customer';
}

/**
 * Button to initiate repeat order flow
 * Opens validation dialog on click
 */
export const RepeatOrderButton = ({
  orderId,
  orderItems,
  orderDate,
  variant = 'business',
}: RepeatOrderButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validation, setValidation] = useState<RepeatOrderValidationResult | null>(null);

  const { validateOrder, isValidation } = useRepeatOrder();

  const handleClick = async () => {
    try {
      const result = await validateOrder(orderId);
      setValidation(result);

      if (result.canRepeat) {
        setDialogOpen(true);
      } else {
        // Show error if no items available
        setDialogOpen(true);
      }
    } catch (error) {
      // Error already handled in hook with toast
      console.error('Failed to validate order:', error);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    // Clear validation after dialog closes
    setTimeout(() => setValidation(null), 300);
  };

  // Disable button if order has no items
  const isDisabled = !orderItems || orderItems.length === 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isValidation || isDisabled}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        {isValidation ? 'Kontrol Ediliyor...' : 'Tekrar Sipariş Ver'}
      </Button>

      {validation && (
        <RepeatOrderConfirmDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          validation={validation}
          orderDate={orderDate}
          onClose={handleClose}
          variant={variant}
        />
      )}
    </>
  );
};
