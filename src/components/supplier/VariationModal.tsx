// Variation Modal Component for Inline Variation Management
// Opens from table row to add/edit/delete product variations

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductVariationsGrouped } from '@/types/multiSupplier';
import type { ProductVariationType } from '@/types/multiSupplier';

const VARIATION_TYPES: { value: ProductVariationType; label: string }[] = [
  { value: 'size', label: 'Boyut (Size)' },
  { value: 'packaging', label: 'Ambalaj (Packaging)' },
  { value: 'quality', label: 'Kalite (Quality)' },
  { value: 'other', label: 'Diğer (Other)' },
];

export interface VariationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  initialVariations: ProductVariationsGrouped[];
  onSave: (variations: ProductVariationsGrouped[]) => void;
  isSaving?: boolean;
}

export function VariationModal({
  open,
  onOpenChange,
  productId,
  productName,
  initialVariations,
  onSave,
  isSaving = false,
}: VariationModalProps) {
  const [variations, setVariations] = useState<ProductVariationsGrouped[]>(initialVariations);
  const [newVariationType, setNewVariationType] = useState<ProductVariationType>('size');
  const [newVariationValue, setNewVariationValue] = useState('');

  // Reset variations when modal opens with new data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setVariations(initialVariations);
    }
    onOpenChange(newOpen);
  };

  const addVariationType = () => {
    if (!newVariationType) return;

    // Check if type already exists
    if (variations.some((v) => v.variation_type === newVariationType)) {
      toast.error('Bu varyasyon türü zaten mevcut');
      return;
    }

    setVariations([...variations, { variation_type: newVariationType, values: [] }]);
    setNewVariationType('size');
  };

  const addVariationValue = (variationType: ProductVariationType) => {
    if (!newVariationValue.trim()) {
      toast.error('Varyasyon değeri boş olamaz');
      return;
    }

    // Check if value already exists in this type
    const variationIndex = variations.findIndex((v) => v.variation_type === variationType);
    if (variationIndex === -1) return;

    const existingValue = variations[variationIndex].values.find(
      (v) => v.value.toLowerCase() === newVariationValue.toLowerCase()
    );

    if (existingValue) {
      toast.error('Bu değer zaten mevcut');
      return;
    }

    const newVariations = [...variations];
    const displayOrder = variations[variationIndex].values.length;

    newVariations[variationIndex] = {
      ...newVariations[variationIndex],
      values: [
        ...newVariations[variationIndex].values,
        { value: newVariationValue.trim(), display_order: displayOrder, metadata: null },
      ],
    };

    setVariations(newVariations);
    setNewVariationValue('');
  };

  const removeVariationValue = (variationType: ProductVariationType, value: string) => {
    const newVariations = variations.map((v) => {
      if (v.variation_type === variationType) {
        return {
          ...v,
          values: v.values.filter((val) => val.value !== value),
        };
      }
      return v;
    });

    // Remove entire type if no values left
    const filtered = newVariations.filter(
      (v) => v.variation_type !== variationType || v.values.length > 0
    );

    setVariations(filtered);
  };

  const removeVariationType = (variationType: ProductVariationType) => {
    setVariations(variations.filter((v) => v.variation_type !== variationType));
  };

  const handleSave = () => {
    onSave(variations);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Varyasyon Yönetimi</DialogTitle>
          <DialogDescription>
            {productName} için varyasyonları düzenleyin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Variation Type */}
          {variations.length < 5 && (
            <div className="flex gap-2 items-center">
              <Label>Varyasyon Türü Ekle:</Label>
              <select
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newVariationType}
                onChange={(e) => setNewVariationType(e.target.value as ProductVariationType)}
              >
                {VARIATION_TYPES.filter((type) =>
                  !variations.some((v) => v.variation_type === type.value)
                ).map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariationType}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ekle
              </Button>
            </div>
          )}

          {/* Variation Groups */}
          {variations.map((variation) => (
            <div key={variation.variation_type} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium capitalize">
                    {VARIATION_TYPES.find((t) => t.value === variation.variation_type)?.label ||
                      variation.variation_type}
                  </h4>
                  <Badge variant="secondary">{variation.values.length} değer</Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeVariationType(variation.variation_type)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Values List */}
              <div className="flex flex-wrap gap-2">
                {variation.values.map((value) => (
                  <Badge
                    key={value.value}
                    variant="outline"
                    className="pl-2 pr-1"
                  >
                    {value.value}
                    <button
                      type="button"
                      onClick={() => removeVariationValue(variation.variation_type, value.value)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add New Value */}
              <div className="flex gap-2">
                <Input
                  placeholder="Yeni değer ekle..."
                  value={newVariationValue}
                  onChange={(e) => setNewVariationValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addVariationValue(variation.variation_type);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVariationValue(variation.variation_type)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {variations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Henüz varyasyon eklenmemiş</p>
              <p className="text-sm">Yukarıdan bir varyasyon türü ekleyerek başlayın</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
