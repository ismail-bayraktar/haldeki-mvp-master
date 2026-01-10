// All Products Tab - Global Product Catalog with Price Entry (Phase 12)
// Shows all products in the catalog, supplier can enter their price

import { useState } from 'react';
import { Search, Loader2, Package, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductPriceModal } from '@/components/supplier/ProductPriceModal';
import { useCreateSupplierJunctionProduct } from '@/hooks/useSupplierProducts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GlobalProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  images: string[] | null;
  description: string | null;
  supplier_products?: Array<{
    id: string;
    price: string | number;
    supplier_id: string;
  }>;
}

export function AllProductsTab() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);

  const { mutate: createSupplierProduct, isPending: isCreating } = useCreateSupplierJunctionProduct();

  // Fetch global products catalog
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['global-products', searchQuery, selectedCategory],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get supplier ID
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .eq('approval_status', 'approved')
        .single();

      if (!supplier) return [];

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          unit,
          images,
          description,
          supplier_products (
            id,
            price,
            supplier_id
          )
        `)
        .eq('is_active', true)
        .eq('product_status', 'active')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as GlobalProduct[];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  // Filter products: show only those NOT already linked to current supplier
  const availableProducts = products.filter((product) => {
    // For now, show all products - the UI will indicate which are already linked
    // In a real implementation, you'd filter out already-linked products
    return true;
  });

  const handlePriceClick = (product: GlobalProduct) => {
    setSelectedProduct(product);
    setPriceModalOpen(true);
  };

  const handlePriceSubmit = ({ productId, price, stock }: { productId: string; price: number; stock: number }) => {
    createSupplierProduct(
      {
        product_id: productId,
        price,
        stock_quantity: stock,
        availability: stock > 10 ? 'plenty' : stock > 0 ? 'limited' : 'last',
        quality: 'standart',
        origin: 'Türkiye',
        min_order_quantity: 1,
        delivery_days: 1,
        is_featured: false,
        is_active: true,
      },
      {
        onSuccess: () => {
          setPriceModalOpen(false);
          setSelectedProduct(null);
          toast.success('Ürün fiyatınız kaydedildi');
        },
        onError: (error) => {
          toast.error('Fiyat kaydedilemedi: ' + error.message);
        },
      }
    );
  };

  return (
    <div className="space-y-4" data-testid="all-products-tab">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Ürün ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="global-product-search"
        />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="flex-shrink-0"
          >
            Tümü
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex-shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {availableProducts.length} ürün
      </p>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Ürünler yüklenirken hata oluştu</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && availableProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Ürün bulunamadı</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory
              ? 'Filtreleri değiştirerek tekrar deneyin'
              : 'Katalogda henüz ürün yok'}
          </p>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !error && availableProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableProducts.map((product) => {
            const hasPrice = product.supplier_products && product.supplier_products.length > 0;
            const lowestPrice = hasPrice
              ? Math.min(...product.supplier_products.map((sp) => typeof sp.price === 'string' ? parseFloat(sp.price) : sp.price))
              : null;

            return (
              <Card
                key={product.id}
                className={cn(
                  "group overflow-hidden transition-all hover:shadow-md",
                  hasPrice && "border-primary/50"
                )}
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      {product.category}
                    </Badge>
                  </div>

                  {/* Price Badge */}
                  {lowestPrice && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-green-500/90 text-white">
                        ₺{lowestPrice.toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Product Name */}
                  <h3 className="font-medium line-clamp-2 mb-1">
                    {product.name}
                  </h3>

                  {/* Unit */}
                  <p className="text-xs text-muted-foreground mb-3">
                    Birim: {product.unit}
                  </p>

                  {/* Action Button */}
                  {hasPrice ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      Zaten Fiyat Girdiniz
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePriceClick(product)}
                      disabled={isCreating}
                      data-testid={`price-button-${product.id}`}
                    >
                      Fiyat Gir
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Price Modal */}
      {selectedProduct && (
        <ProductPriceModal
          open={priceModalOpen}
          onOpenChange={setPriceModalOpen}
          product={selectedProduct}
          onSubmit={handlePriceSubmit}
          isSubmitting={isCreating}
        />
      )}
    </div>
  );
}
