// Shared Product Form Component
// Used across supplier and admin panels for standardized product creation/editing

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/supplier/ImageUpload';
import { VariationList } from '@/components/supplier/VariationList';
import { toast } from 'sonner';
import type { StandardProductForm, ProductStatus } from '@/types/supplier';
import type { ProductVariationsGrouped } from '@/types/multiSupplier';
import type { ImageUploadProgress } from '@/types/supplier';

// Constants
const CATEGORIES = [
  'Sebze',
  'Meyve',
  'Yeşillik',
  'Kök Sebzeler',
  'Meyveli',
  'Türk Kahvesi',
  'Diğer',
] as const;

const UNITS = ['kg', 'adet', 'demet', 'pak', 'litre', 'balya'] as const;

// Props interface
export interface ProductFormProps {
  // Data
  initialData?: Partial<StandardProductForm>;
  initialImages?: string[];
  initialVariations?: ProductVariationsGrouped[];

  // State
  images: string[];
  uploads: ImageUploadProgress[];
  isUploading: boolean;
  isPending: boolean;

  // Callbacks
  onImageChange: (images: string[]) => void;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (image: string) => void;
  onVariationsChange: (variations: ProductVariationsGrouped[]) => void;
  onSubmit: (data: StandardProductForm & { images: string[] }) => void;
  onCancel?: () => void;

  // UI
  submitLabel?: string;
  cancelLabel?: string;
  showStatus?: boolean; // Show product_status field (usually only for edit)
  readOnly?: boolean; // Disable all inputs
}

export function ProductForm({
  initialData,
  initialImages = [],
  initialVariations = [],
  images,
  uploads,
  isUploading,
  isPending,
  onImageChange,
  onAddImages,
  onRemoveImage,
  onVariationsChange,
  onSubmit,
  onCancel,
  submitLabel = 'Kaydet',
  cancelLabel = 'İptal',
  showStatus = false,
  readOnly = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<StandardProductForm>>({
    name: '',
    description: '',
    category: '',
    base_price: 0,
    unit: 'kg',
    stock: 0,
    product_status: 'active',
    ...initialData,
  });

  const [variations, setVariations] = useState<ProductVariationsGrouped[]>(initialVariations);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  // Update variations when initialVariations changes
  useEffect(() => {
    if (initialVariations.length > 0) {
      setVariations(initialVariations);
    }
  }, [initialVariations]);

  const handleInputChange = (
    field: keyof StandardProductForm,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Ürün adı zorunludur';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Ürün adı en az 2 karakter olmalı';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori zorunludur';
    }

    if (!formData.base_price || formData.base_price <= 0) {
      newErrors.base_price = 'Geçerli bir fiyat girin (0\'dan büyük)';
    }

    if (!formData.unit) {
      newErrors.unit = 'Birim zorunludur';
    }

    if (formData.stock === undefined || formData.stock < 0) {
      newErrors.stock = 'Geçerli bir stok miktarı girin (0 veya pozitif)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for pending uploads
    const pendingUploads = uploads.filter((u) => u.progress < 100 && !u.error);
    if (pendingUploads.length > 0) {
      toast.error('Lütfen görsel yüklemelerinin tamamlanmasını bekleyin');
      return;
    }

    // Check for upload errors
    const failedUploads = uploads.filter((u) => u.error);
    if (failedUploads.length > 0) {
      toast.error('Bazı görseller yüklenemedi. Lütfen tekrar deneyin.');
      return;
    }

    if (!validateForm()) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    const submitData = {
      ...formData,
      images,
      variations,
    } as StandardProductForm & { images: string[] };

    onSubmit(submitData);
  };

  const hasPendingUploads = uploads.some((u) => u.progress < 100 && !u.error);
  const isSubmitDisabled = isPending || isUploading || hasPendingUploads || readOnly;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ürün Görselleri</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            onUpload={onAddImages}
            onRemove={(index) => onRemoveImage(images[index])}
            images={images}
            uploads={uploads}
            disabled={isPending || readOnly}
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Ürün Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Örn: Domates"
              disabled={isPending || readOnly}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Ürün açıklaması..."
              rows={3}
              disabled={isPending || readOnly}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>
              Kategori <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
              disabled={isPending || readOnly}
            >
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing and Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fiyat ve Stok</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Birim Fiyat (₺) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) =>
                  handleInputChange('base_price', parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                disabled={isPending || readOnly}
                className={
                  errors.base_price ? 'border-destructive flex-1' : 'flex-1'
                }
              />
            </div>
            {errors.base_price && (
              <p className="text-sm text-destructive">{errors.base_price}</p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label>
              Birim <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => handleInputChange('unit', value)}
              disabled={isPending || readOnly}
            >
              <SelectTrigger className={errors.unit ? 'border-destructive' : ''}>
                <SelectValue placeholder="Birim seçin" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit && (
              <p className="text-sm text-destructive">{errors.unit}</p>
            )}
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="stock">
              Stok Miktarı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) =>
                handleInputChange('stock', parseInt(e.target.value) || 0)
              }
              placeholder="0"
              disabled={isPending || readOnly}
              className={errors.stock ? 'border-destructive' : ''}
            />
            {errors.stock && (
              <p className="text-sm text-destructive">{errors.stock}</p>
            )}
          </div>

          {/* Status (only show when editing) */}
          {showStatus && (
            <div className="space-y-2">
              <Label>Durum</Label>
              <Select
                value={formData.product_status}
                onValueChange={(value) =>
                  handleInputChange('product_status', value as ProductStatus)
                }
                disabled={isPending || readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                  <SelectItem value="out_of_stock">Stok Yok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variations */}
      <VariationList
        variations={variations}
        onUpdate={(newVariations) => {
          setVariations(newVariations);
          onVariationsChange(newVariations);
        }}
        readOnly={readOnly}
      />

      {/* Actions */}
      <div className="flex gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitDisabled}>
          {isPending ? 'Kaydediliyor...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
