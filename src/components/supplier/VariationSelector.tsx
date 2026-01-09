import { useState, KeyboardEvent } from 'react';
import { Plus, X, Sparkles, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VariationTag } from '@/components/supplier/VariationTag';
import { cn } from '@/lib/utils';
import type { ProductVariationType } from '@/types/multiSupplier';

const VARIATION_TYPES: { value: ProductVariationType; label: string }[] = [
  { value: 'size', label: 'Büyüklük' },
  { value: 'type', label: 'Tür' },
  { value: 'scent', label: 'Koku' },
  { value: 'packaging', label: 'Paketleme' },
  { value: 'material', label: 'Malzeme' },
  { value: 'flavor', label: 'Aroma' },
  { value: 'other', label: 'Diğer' },
];

const COMMON_VALUES: Record<ProductVariationType, string[]> = {
  size: ['4 LT', '1.5 KG', '500 ML', '1 KG', '2 LT', '5 KG', '750 ML', '250 ML'],
  type: ['BEYAZ', 'RENKLİ', 'SIVI', 'TOZ', 'KATI', 'SPREY', 'KREM'],
  scent: ['LAVANTA', 'LİMON', 'PORÇEL', 'ÇİÇEK', 'OKYANUS', 'ORMAN', 'VANİLYA'],
  packaging: ['*4', '*6', '*12', '*24', 'Tek', 'Çift', 'Kutu'],
  material: ['CAM', 'PLASTİK', 'METAL', 'KAĞIT', 'AHŞAP'],
  flavor: ['VANİLYA', 'ÇİLEK', 'ÇİKOLATA', 'KARANFİL', 'NANE'],
  other: ['STANDART', 'PREMİUM', 'EKONOMİK', 'ÖZEL'],
};

interface VariationSelectorProps {
  selectedType?: ProductVariationType;
  existingValues?: string[];
  onSelect?: (value: string, type?: ProductVariationType) => void;
  disabled?: boolean;
  className?: string;
}

export function VariationSelector({
  selectedType,
  existingValues = [],
  onSelect,
  disabled = false,
  className,
}: VariationSelectorProps) {
  const [type, setType] = useState<ProductVariationType>(selectedType || 'size');
  const [inputValue, setInputValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [selectedScents, setSelectedScents] = useState<string[]>([]);

  const commonValues = COMMON_VALUES[type] || [];
  const availableValues = commonValues.filter((v) => !existingValues.includes(v));

  const isSelected = (value: string) => {
    if (type === 'scent') {
      return selectedScents.includes(value);
    }
    return existingValues.includes(value);
  };

  const handleSelect = (value: string) => {
    if (type === 'scent') {
      if (selectedScents.includes(value)) {
        setSelectedScents(prev => prev.filter(s => s !== value));
      } else {
        setSelectedScents(prev => [...prev, value]);
      }
    } else {
      onSelect?.(value, type);
      setInputValue('');
      setShowCustom(false);
    }
  };

  const handleCustomSubmit = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed && !existingValues.includes(trimmed)) {
      handleSelect(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  const handleConfirmScents = () => {
    selectedScents.forEach(scent => {
      onSelect?.(scent, 'scent');
    });
    setSelectedScents([]);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {!selectedType && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Varyasyon Türü
          </label>
          <Select value={type} onValueChange={(v) => setType(v as ProductVariationType)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Tür seçin" />
            </SelectTrigger>
            <SelectContent>
              {VARIATION_TYPES.map((vt) => (
                <SelectItem key={vt.value} value={vt.value}>
                  {vt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {availableValues.length > 0 && !showCustom && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">
              {VARIATION_TYPES.find((vt) => vt.value === type)?.label} seçenekleri
            </p>
            <Badge variant="secondary" className="text-xs">
              {availableValues.length}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableValues.map((value) => (
              <Button
                key={value}
                type="button"
                variant={isSelected(value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelect(value)}
                className="h-8 text-xs"
              >
                {value}
              </Button>
            ))}
          </div>

          {type === 'scent' && selectedScents.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedScents.map(scent => (
                  <Badge key={scent} variant="default" className="gap-1 pr-1">
                    {scent}
                    <button
                      type="button"
                      onClick={() => handleSelect(scent)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Button size="sm" onClick={handleConfirmScents} className="w-full">
                <Check className="h-4 w-4 mr-1" />
                {selectedScents.length} koku ekle
              </Button>
            </div>
          )}
        </div>
      )}

      {availableValues.length === 0 && !showCustom && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Bu varyasyon türü için hazır seçenek yok
        </div>
      )}

      <div className="pt-2 border-t">
        {showCustom ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Özel Değer Girin
            </label>
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Örn: 1.5 KG, RENKLİ, etc."
                className="h-10 text-sm"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleCustomSubmit}
                disabled={!inputValue.trim()}
                className="gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Ekle
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCustom(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground gap-2"
            onClick={() => setShowCustom(true)}
          >
            <Sparkles className="h-4 w-4" />
            Özel değer ekle
          </Button>
        )}
      </div>
    </div>
  );
}
