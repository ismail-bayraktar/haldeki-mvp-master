import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductVariationType } from '@/types/multiSupplier';

const VARIATION_COLORS: Record<ProductVariationType, string> = {
  size: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  type: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  scent: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  packaging: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  material: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  flavor: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
};

const VARIATION_LABELS: Record<ProductVariationType, string> = {
  size: 'Büyüklük',
  type: 'Tür',
  scent: 'Koku',
  packaging: 'Paketleme',
  material: 'Malzeme',
  flavor: 'Aroma',
  other: 'Diğer',
};

interface VariationTagProps {
  type: ProductVariationType;
  value: string;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  showType?: boolean;
}

export function VariationTag({
  type,
  value,
  onRemove,
  disabled = false,
  className,
  showType = false,
}: VariationTagProps) {
  const colorClass = VARIATION_COLORS[type] || VARIATION_COLORS.other;
  const typeLabel = VARIATION_LABELS[type];

  return (
    <div
      className={cn(
        'group inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        colorClass,
        onRemove && 'pr-1',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {showType && <span className="opacity-70">{typeLabel}:</span>}
      <span>{value}</span>
      {onRemove && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-black/10 dark:hover:bg-white/10"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
