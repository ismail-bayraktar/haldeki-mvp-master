// Inline Editable Status Cell (Switch Toggle) for Supplier Product Table

import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export interface EditStatusCellProps {
  value: boolean;
  productId: string;
  onSave: (productId: string, newStatus: boolean) => void;
  disabled?: boolean;
  isSaving?: boolean;
}

export function EditStatusCell({
  value,
  productId,
  onSave,
  disabled = false,
  isSaving = false,
}: EditStatusCellProps) {
  const handleChange = (checked: boolean) => {
    if (!disabled && !isSaving) {
      onSave(productId, checked);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          checked={value}
          onCheckedChange={handleChange}
          disabled={disabled}
          aria-label={value ? 'Aktif' : 'Pasif'}
        />
      )}
      <span className="text-sm text-muted-foreground">
        {value ? 'Aktif' : 'Pasif'}
      </span>
    </div>
  );
}
