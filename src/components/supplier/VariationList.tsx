import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Check, X, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VariationTag } from '@/components/supplier/VariationTag';
import { VariationSelector } from '@/components/supplier/VariationSelector';
import { cn } from '@/lib/utils';
import type { ProductVariationType, ProductVariationsGrouped } from '@/types/multiSupplier';

interface VariationListProps {
  variations: ProductVariationsGrouped[];
  onUpdate?: (variations: ProductVariationsGrouped[]) => void;
  readOnly?: boolean;
  className?: string;
}

export function VariationList({
  variations,
  onUpdate,
  readOnly = false,
  className,
}: VariationListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pendingVariations, setPendingVariations] = useState<ProductVariationsGrouped[]>(variations);
  const [collapsedTypes, setCollapsedTypes] = useState<Set<ProductVariationType>>(() => {
    const firstThree = variations.slice(0, 3).map(v => v.variation_type);
    const allTypes = variations.map(v => v.variation_type);
    return new Set(allTypes.filter(t => !firstThree.includes(t)));
  });

  const toggleCollapse = (type: ProductVariationType) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleSave = () => {
    console.log('🔍 [DEBUG] VariationList handleSave called with:', pendingVariations);
    console.log('📞 [DEBUG] Calling onUpdate callback...');
    onUpdate?.(pendingVariations);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPendingVariations(variations);
    setIsEditing(false);
  };

  const handleAddVariation = (type: ProductVariationType, value: string) => {
    setPendingVariations((prev) => {
      const existing = prev.find((v) => v.variation_type === type);
      if (existing) {
        return prev.map((v) =>
          v.variation_type === type
            ? { ...v, values: [...v.values, { value, display_order: v.values.length, metadata: null }] }
            : v
        );
      }
      return [
        ...prev,
        {
          variation_type: type,
          values: [{ value, display_order: 0, metadata: null }],
        },
      ];
    });
  };

  const handleRemoveVariation = (type: ProductVariationType, value: string) => {
    setPendingVariations((prev) =>
      prev
        .map((v) => {
          if (v.variation_type === type) {
            return { ...v, values: v.values.filter((val) => val.value !== value) };
          }
          return v;
        })
        .filter((v) => v.values.length > 0)
    );
  };

  const totalVariations = variations.reduce((sum, v) => sum + v.values.length, 0);

  if (variations.length === 0 && !isEditing) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Varyasyon bulunmuyor</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ürününüz için varyasyon seçenekleri ekleyin
              </p>
            </div>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsEditing(true)}
              >
                <Plus className="h-4 w-4" />
                İlk Varyasyonu Ekle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Varyasyonlar</CardTitle>
            {!isEditing && variations.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {variations.length} varyasyon türü, {totalVariations} seçenek
              </p>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4 mr-1" />
                  Kaydet
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Düzenle
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {(isEditing ? pendingVariations : variations).map((group, index) => {
          const isCollapsed = collapsedTypes.has(group.variation_type);

          return (
            <div
              key={group.variation_type}
              className={cn(
                'rounded-lg border bg-card transition-all',
                'hover:border-primary/50',
                isEditing && 'border-primary/30 bg-primary/5'
              )}
            >
              <button
                type="button"
                onClick={() => toggleCollapse(group.variation_type)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl" role="img" aria-label={`${group.variation_type} icon`}>
                    {getVariationIcon(group.variation_type)}
                  </span>
                  <Badge variant="outline">{group.variation_type}</Badge>
                  <span className="font-medium">{getVariationLabel(group.variation_type)}</span>
                  {group.variation_type === 'scent' && (
                    <Badge variant="secondary" className="text-xs">Çoklu seçim</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ({group.values.length} seçenek)
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {!isCollapsed && (
                <div className="px-3 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((val) => (
                      <VariationTag
                        key={val.value}
                        type={group.variation_type}
                        value={val.value}
                        onRemove={
                          isEditing ? () => handleRemoveVariation(group.variation_type, val.value) : undefined
                        }
                        showType={false}
                      />
                    ))}
                  </div>

                  {isEditing && (
                    <div className="mt-3">
                      <VariationSelector
                        selectedType={group.variation_type}
                        existingValues={group.values.map((v) => v.value)}
                        onSelect={(value) => handleAddVariation(group.variation_type, value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isEditing && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Plus className="h-4 w-4" />
              <span>Yeni varyasyon türü ekle</span>
            </div>
            <VariationSelector
              onSelect={(value, type) => type && handleAddVariation(type, value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getVariationLabel(type: ProductVariationType): string {
  const labels: Record<ProductVariationType, string> = {
    size: 'Büyüklük',
    type: 'Tür',
    scent: 'Koku',
    packaging: 'Paketleme',
    material: 'Malzeme',
    flavor: 'Aroma',
    other: 'Diğer',
  };
  return labels[type] || type;
}

function getVariationIcon(type: ProductVariationType): string {
  const icons: Record<ProductVariationType, string> = {
    size: '📏',
    type: '🏷️',
    scent: '🌸',
    packaging: '📦',
    material: '🧱',
    flavor: '🍦',
    other: '📝'
  };
  return icons[type] || '📝';
}
