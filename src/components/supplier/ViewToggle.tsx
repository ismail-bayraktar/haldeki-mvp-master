// View Toggle Component for Supplier Products
// Allows switching between Table and Grid views with localStorage persistence

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductView = 'table' | 'grid';

const STORAGE_KEY = 'supplier-products-view';

export interface ViewToggleProps {
  view: ProductView;
  onChange: (view: ProductView) => void;
  disabled?: boolean;
}

export function ViewToggle({ view, onChange, disabled = false }: ViewToggleProps) {
  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'table' || saved === 'grid')) {
      onChange(saved as ProductView);
    }
  }, [onChange]);

  const handleChange = (newView: ProductView) => {
    onChange(newView);
    localStorage.setItem(STORAGE_KEY, newView);
  };

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted p-1">
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleChange('table')}
        disabled={disabled}
        className={cn(
          'h-8 gap-1.5',
          view === 'table' && 'shadow-sm'
        )}
      >
        <Table className="h-4 w-4" />
        <span className="hidden sm:inline">Tablo</span>
      </Button>
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleChange('grid')}
        disabled={disabled}
        className={cn(
          'h-8 gap-1.5',
          view === 'grid' && 'shadow-sm'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );
}
