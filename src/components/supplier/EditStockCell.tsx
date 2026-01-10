// Inline Editable Stock Cell for Supplier Product Table

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { MAX_STOCK, clampStock, isValidStock } from '@/lib/validation';

export interface EditStockCellProps {
  value: number;
  productId: string;
  onSave: (productId: string, newStock: number) => void;
  disabled?: boolean;
}

export function EditStockCell({
  value,
  productId,
  onSave,
  disabled = false,
}: EditStockCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    const newStock = parseInt(tempValue, 10);

    // Validate: must be a valid stock integer within range
    if (!isValidStock(newStock)) {
      // Reset to original value if invalid
      setTempValue(value.toString());
      setIsEditing(false);
      return;
    }

    // Clamp to max value for security
    const clampedStock = clampStock(newStock);

    if (clampedStock !== value) {
      onSave(productId, clampedStock);
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
      <Input
        type="number"
        min="0"
        max={MAX_STOCK}
        step="1"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="h-8 w-20 px-2 text-sm"
        disabled={disabled}
        data-testid={`product-${productId}-stock-input`}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer px-2 py-1 rounded hover:bg-muted transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
      title="Çift tıklayarak düzenleyin"
      data-testid={`product-${productId}-stock`}
    >
      {value}
    </div>
  );
}
