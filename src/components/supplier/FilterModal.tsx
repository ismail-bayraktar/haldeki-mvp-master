// Filter Modal Component for Suppliers (Phase 9 - Mobile First)

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useProductCategories, usePriceRange } from '@/hooks/useProductSearch';
import type { ProductSearchFilters } from '@/types/supplier';

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ProductSearchFilters;
  onFiltersChange: (filters: ProductSearchFilters) => void;
}

export function FilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: FilterModalProps) {
  const { categories, categoryCounts } = useProductCategories();
  const { minPrice: globalMin, maxPrice: globalMax } = usePriceRange();

  const [localFilters, setLocalFilters] = useState<ProductSearchFilters>(filters);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? globalMin,
    filters.maxPrice ?? globalMax,
  ]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
    setPriceRange([
      filters.minPrice ?? globalMin,
      filters.maxPrice ?? globalMax,
    ]);
  }, [filters, globalMin, globalMax]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: ProductSearchFilters = {};
    setLocalFilters(resetFilters);
    setPriceRange([globalMin, globalMax]);
    onFiltersChange(resetFilters);
    onOpenChange(false);
  };

  const handleCategoryToggle = (category: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  const handleInStockToggle = (checked: boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      inStock: checked || undefined,
    }));
  };

  const handlePriceRangeChange = (values: number[]) => {
    const [min, max] = values;
    setPriceRange([min, max]);
    setLocalFilters((prev) => ({
      ...prev,
      minPrice: min > globalMin ? min : undefined,
      maxPrice: max < globalMax ? max : undefined,
    }));
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Filtreler</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Category Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Kategori</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className="relative"
                >
                  <Badge
                    variant={localFilters.category === category ? 'default' : 'outline'}
                    className="px-3 py-1 cursor-pointer whitespace-nowrap"
                  >
                    {category}
                    <span className="ml-1.5 text-xs opacity-60">
                      ({categoryCounts[category] || 0})
                    </span>
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Fiyat Aralığı</Label>
            <div className="px-2">
              <Slider
                min={globalMin}
                max={globalMax}
                step={1}
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                className="py-4"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>₺{priceRange[0].toFixed(2)}</span>
                <span>₺{priceRange[1].toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Stock Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Stok Durumu</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={localFilters.inStock === true}
                onCheckedChange={(checked) =>
                  handleInStockToggle(checked as boolean)
                }
              />
              <Label htmlFor="inStock" className="cursor-pointer">
                Sadece stokta olanlar
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
              disabled={!hasActiveFilters}
            >
              Sıfırla
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              Uygula ({hasActiveFilters ? Object.keys(localFilters).length : 0})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
