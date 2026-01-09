// Inline Editable Price Cell for Supplier Product Table

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';

export interface EditPriceCellProps {
  value: number;
  productId: string;
  onSave: (productId: string, newPrice: number) => void;
  disabled?: boolean;
  currency?: string;
}

export function EditPriceCell({
  value,
  productId,
  onSave,
  disabled = false,
  currency = '₺',
}: EditPriceCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    const newPrice = parseFloat(tempValue);
    if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== value) {
      onSave(productId, newPrice);
    } else {
      // Reset to original value if invalid
      setTempValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8 w-24 px-2 text-sm"
          disabled={disabled}
          data-testid={`product-${productId}-price-input`}
        />
        <span className="text-xs text-muted-foreground">{currency}</span>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer px-2 py-1 rounded hover:bg-muted transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
      title="Çift tıklayarak düzenleyin"
      data-testid={`product-${productId}-price`}
    >
      {currency}
      {value.toFixed(2)}
    </div>
  );
}
