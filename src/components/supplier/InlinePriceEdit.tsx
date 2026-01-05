// Inline Price Edit Component (Phase 9 - Mobile First)

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUpdateProductPrice } from '@/hooks/useSupplierProducts';

interface InlinePriceEditProps {
  productId: string;
  currentPrice: number;
  unit: string;
  className?: string;
  onSuccess?: () => void;
}

export function InlinePriceEdit({
  productId,
  currentPrice,
  unit,
  className,
  onSuccess,
}: InlinePriceEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentPrice.toFixed(2));
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePrice, isPending } = useUpdateProductPrice();

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset value when current price changes externally
  useEffect(() => {
    setValue(currentPrice.toFixed(2));
    setHasChanges(false);
  }, [currentPrice]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setValue(currentPrice.toFixed(2));
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleSave = () => {
    const newPrice = parseFloat(value);
    if (isNaN(newPrice) || newPrice < 0) {
      return;
    }

    updatePrice(
      { productId, price: newPrice },
      {
        onSuccess: () => {
          setHasChanges(false);
          setIsEditing(false);
          onSuccess?.();
        },
        onError: () => {
          setValue(currentPrice.toFixed(2));
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    const numValue = parseFloat(newValue);
    setHasChanges(!isNaN(numValue) && numValue !== currentPrice);
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-muted-foreground text-sm">
            ₺
          </span>
          <Input
            ref={inputRef}
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="pl-7 w-32 h-9"
            disabled={isPending}
          />
        </div>
        <span className="text-xs text-muted-foreground">/{unit}</span>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={!hasChanges || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCancel}
            disabled={isPending}
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className={cn(
        'text-left hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors group',
        className
      )}
      title="Çift tıklayarak düzenleyin"
    >
      <div className="flex items-baseline gap-1">
        <span className="font-bold text-lg">
          ₺{currentPrice.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground">
          /{unit}
        </span>
        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
          ✎
        </span>
      </div>
    </button>
  );
}
