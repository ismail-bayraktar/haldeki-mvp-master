// Supplier Product Form Page (Phase 9 - Mobile First)

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { SupplierMobileLayout } from '@/components/supplier/SupplierMobileLayout';
import { useSupplierProduct } from '@/hooks/useSupplierProducts';
import { useCreateProduct } from '@/hooks/useSupplierProducts';
import { useUpdateProduct } from '@/hooks/useSupplierProducts';
import { useProductImages } from '@/hooks/useImageUpload';
import { toast } from 'sonner';
import type { ProductFormData } from '@/types/supplier';

const CATEGORIES = [
  'Sebze',
  'Meyve',
  'Yeşillik',
  'Kök Sebzeler',
  'Meyveli',
  'Türk Kahvesi',
  'Diğer',
];

const UNITS = ['kg', 'adet', 'demet', 'pak', 'litre', 'balya'];

export default function ProductForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    name: '',
    description: '',
    category: '',
    base_price: 0,
    unit: 'kg',
    stock: 0,
    product_status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load product data if editing
  const { data: product, isLoading: isLoadingProduct } = useSupplierProduct(id || '');

  const {
    images,
    setImages,
    addImages,
    removeImage,
    isUploading: isImageUploading,
    uploads,
  } = useProductImages(isEditing && product ? product.images : []);

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isPending = isCreating || isUpdating || isImageUploading;

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        base_price: product.base_price,
        unit: product.unit,
        stock: product.stock,
        product_status: product.product_status,
      });
    }
  }, [product]);

  const handleInputChange = (
    field: keyof ProductFormData,
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
    }

    if (!formData.category) {
      newErrors.category = 'Kategori zorunludur';
    }

    if (!formData.base_price || formData.base_price <= 0) {
      newErrors.base_price = 'Geçerli bir fiyat girin';
    }

    if (!formData.unit) {
      newErrors.unit = 'Birim zorunludur';
    }

    if (formData.stock === undefined || formData.stock < 0) {
      newErrors.stock = 'Geçerli bir stok miktarı girin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    const submitData = {
      ...formData,
      images,
    } as ProductFormData;

    if (isEditing) {
      updateProduct(
        { productId: id!, formData: submitData },
        {
          onSuccess: () => {
            navigate(`/tedarikci/urunler/${id}`);
          },
        }
      );
    } else {
      createProduct(submitData, {
        onSuccess: (result) => {
          if (result.success && result.product) {
            // Upload images if any
            if (images.length > 0 || uploads.length > 0) {
              // Images are handled separately in a real implementation
              // For now, just navigate to product detail
              navigate(`/tedarikci/urunler/${result.product?.id}`);
            } else {
              navigate(`/tedarikci/urunler/${result.product?.id}`);
            }
          }
        },
      });
    }
  };

  if (isEditing && isLoadingProduct) {
    return (
      <SupplierMobileLayout title="Ürün Düzenle">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SupplierMobileLayout>
    );
  }

  return (
    <SupplierMobileLayout
      title={isEditing ? 'Ürün Düzenle' : 'Yeni Ürün'}
      showBackButton
      backTo="/tedarikci/urunler"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ürün Görselleri</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              onUpload={addImages}
              onRemove={(index) => removeImage(images[index])}
              images={images}
              uploads={uploads}
              disabled={isPending}
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
                disabled={isPending}
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
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Ürün açıklaması..."
                rows={3}
                disabled={isPending}
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
                disabled={isPending}
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
                  disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
                className={errors.stock ? 'border-destructive' : ''}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock}</p>
              )}
            </div>

            {/* Status */}
            {isEditing && (
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={formData.product_status}
                  onValueChange={(value) =>
                    handleInputChange('product_status', value as any)
                  }
                  disabled={isPending}
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            asChild
            disabled={isPending}
          >
            <Link to="/tedarikci/urunler">İptal</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Güncelleniyor...' : 'Kaydediliyor...'}
              </>
            ) : (
              <>{isEditing ? 'Güncelle' : 'Kaydet'}</>
            )}
          </Button>
        </div>
      </form>
    </SupplierMobileLayout>
  );
}
