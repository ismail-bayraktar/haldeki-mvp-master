// Supplier Product Form Page (Phase 9 - Mobile First)

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageUpload } from '@/components/supplier/ImageUpload';
import { VariationList } from '@/components/supplier/VariationList';
import { SupplierMobileLayout } from '@/components/supplier/SupplierMobileLayout';
import { useSupplierProduct, useCreateProduct, useUpdateProduct, checkDuplicateProducts } from '@/hooks/useSupplierProducts';
import { useProductImages } from '@/hooks/useImageUpload';
import { toast } from 'sonner';
import type { ProductFormData, ProductStatus } from '@/types/supplier';
import type { ProductVariationsGrouped } from '@/types/multiSupplier';

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

type DuplicateProduct = {
  id: string;
  name: string;
  category: string;
  supplier_products: Array<{
    suppliers: {
      business_name: string;
    } | null;
  } | null>;
};

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

  const [variations, setVariations] = useState<ProductVariationsGrouped[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateProduct[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState<ProductFormData | null>(null);

  // Load product data if editing
  const { data: product, isLoading: isLoadingProduct } = useSupplierProduct(id || '');

  const {
    images,
    setImages,
    addImages,
    removeImage,
    isUploading: isImageUploading,
    uploads,
    areUploadsComplete,
    getFailedUploads,
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
      // Load variations from product if editing
      if (product.variations && product.variations.length > 0) {
        setVariations(product.variations);
      }
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

    // Check for pending uploads
    if (!areUploadsComplete()) {
      toast.error('Lütfen görsel yüklemelerinin tamamlanmasını bekleyin');
      return;
    }

    // Check for upload errors
    const failedUploads = getFailedUploads();
    if (failedUploads.length > 0) {
      toast.error('Bazı görseller yüklenemedi. Lütfen tekrar deneyin.');
      return;
    }

    console.log('🔍 [DEBUG] handleSubmit - variations state:', variations);

    const submitData = {
      ...formData,
      images,
      variations,
    } as ProductFormData;

    console.log('📤 [DEBUG] Submitting data with variations:', submitData.variations);

    // Check for duplicates only when creating new products
    if (!isEditing && submitData.name && submitData.category) {
      const duplicateProducts = await checkDuplicateProducts(submitData.name, submitData.category);

      if (duplicateProducts.length > 0) {
        setDuplicates(duplicateProducts);
        setPendingSubmit(submitData);
        setShowDuplicateDialog(true);
        return;
      }
    }

    // No duplicates or user chose to continue
    performSubmit(submitData);
  };

  const performSubmit = (submitData: ProductFormData) => {
    if (isEditing) {
      updateProduct(
        { productId: id!, formData: submitData },
        {
          onSuccess: () => {
            navigate('/tedarikci/urunler');
          },
        }
      );
    } else {
      createProduct(submitData, {
        onSuccess: (result) => {
          if (result.success && result.product) {
            navigate(`/tedarikci/urunler/${result.product?.id}`);
          }
        },
      });
    }
  };

  const handleContinueAnyway = () => {
    if (pendingSubmit) {
      setShowDuplicateDialog(false);
      performSubmit(pendingSubmit);
      setPendingSubmit(null);
      setDuplicates([]);
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setPendingSubmit(null);
    setDuplicates([]);
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
      breadcrumbs={[
        { label: 'Panel', href: '/tedarikci' },
        { label: 'Ürünlerim', href: '/tedarikci/urunler' },
        { label: isEditing ? 'Düzenle' : 'Yeni Ürün' }
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6" data-testid="product-form">
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
                data-testid="product-name-input"
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
                  data-testid="product-price-input"
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
                data-testid="product-stock-input"
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
                    handleInputChange('product_status', value as ProductStatus)
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

        {/* Variations */}
        <VariationList
          variations={variations}
          onUpdate={(newVariations) => {
            console.log('🔍 [DEBUG] ProductForm onUpdate called with:', newVariations);
            setVariations(newVariations);
          }}
        />

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
          <Button
            type="submit"
            className="flex-1"
            disabled={isPending || !areUploadsComplete()}
            data-testid="save-product-button"
          >
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

      {/* Duplicate Warning Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDialogTitle>Benzer Ürünler Bulundu</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              "{formData.name}" isminde "{formData.category}" kategorisinde {duplicates.length} adet benzer ürün var.
              Bu ürünlerin zaten mevcut olduğunu lütfen kontrol edin.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {duplicates.map((dup) => (
                <div
                  key={dup.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{dup.name}</p>
                    <p className="text-muted-foreground">
                      {dup.supplier_products
                        .filter((sp) => sp?.suppliers)
                        .map((sp) => sp?.suppliers?.business_name)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDuplicate}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueAnyway}>
              Yine de Oluştur
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SupplierMobileLayout>
  );
}
