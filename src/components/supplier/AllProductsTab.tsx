// All Products Tab - Global Product Catalog with Price Entry (Phase 12)
// Shows all products in the catalog with table/grid view toggle (default: table)
// Full feature parity with MyProductsTab - inline editing for price, stock, status

import { useState } from 'react';
import { Loader2, Package, Upload } from 'lucide-react';
import { SearchBar } from '@/components/supplier/SearchBar';
import { Button } from '@/components/ui/button';
import { ProductImportModal } from '@/components/supplier/ProductImportModal';
import { ProductExportButton } from '@/components/supplier/ProductExportButton';
import { ViewToggle, type ProductView } from '@/components/supplier/ViewToggle';
import { AllProductsTable } from '@/components/supplier/AllProductsTable';
import { useProductSearch } from '@/hooks/useProductSearch';
import { useAvailableProducts } from '@/hooks/useGlobalProductCatalog';
import { useCreateSupplierJunctionProduct } from '@/hooks/useSupplierProducts';
import { useUpdateCatalogPrice } from '@/hooks/useGlobalProductCatalog';
import { useUpdateCatalogStock } from '@/hooks/useGlobalProductCatalog';
import { useUpdateCatalogStatus } from '@/hooks/useGlobalProductCatalog';
import { ProductPriceModal } from '@/components/supplier/ProductPriceModal';
import { toast } from 'sonner';
import type { GlobalProductCatalogItem } from '@/types/supplier';

const STORAGE_KEY = 'all-products-view';

export function AllProductsTab() {
  const [view, setView] = useState<ProductView>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Default: TABLE view (not grid)
    return (saved === 'grid' ? 'grid' : 'table') as ProductView;
  });

  const [selectedProduct, setSelectedProduct] = useState<GlobalProductCatalogItem | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string[]>([]);

  const { mutate: createSupplierProduct, isPending: isCreating } = useCreateSupplierJunctionProduct();
  const { mutate: updatePrice } = useUpdateCatalogPrice();
  const { mutate: updateStock } = useUpdateCatalogStock();
  const { mutate: updateStatus } = useUpdateCatalogStatus();

  const handleViewChange = (newView: ProductView) => {
    setView(newView);
    localStorage.setItem(STORAGE_KEY, newView);
  };

  const {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    clearAllFilters,
    activeFilterCount,
    sortBy,
    setSortBy,
    recentSearches,
    saveSearch,
    loadRecentSearch,
    clearRecentSearches,
  } = useProductSearch();

  const { data, isLoading, error } = useAvailableProducts({
    searchQuery: searchQuery || undefined,
    category: filters.category,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;

  const handlePriceClick = (product: GlobalProductCatalogItem) => {
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

  const handleUpdatePrice = (productId: string, price: number) => {
    setIsUpdating((prev) => [...prev, productId]);
    updatePrice(
      { productId, price },
      {
        onSettled: () => {
          setIsUpdating((prev) => prev.filter((id) => id !== productId));
        },
      }
    );
  };

  const handleUpdateStock = (productId: string, stock: number) => {
    setIsUpdating((prev) => [...prev, productId]);
    updateStock(
      { productId, stock },
      {
        onSettled: () => {
          setIsUpdating((prev) => prev.filter((id) => id !== productId));
        },
      }
    );
  };

  const handleUpdateStatus = (productId: string, isActive: boolean) => {
    setIsUpdating((prev) => [...prev, productId]);
    updateStatus(
      { productId, isActive },
      {
        onSettled: () => {
          setIsUpdating((prev) => prev.filter((id) => id !== productId));
        },
      }
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      saveSearch(query);
    }
  };

  return (
    <div data-testid="all-products-tab">
      {/* Search and Filters */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          filters={filters}
          onFiltersChange={updateFilters}
          activeFilterCount={activeFilterCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          recentSearches={recentSearches}
          onRecentSearchClick={loadRecentSearch}
          onClearRecentSearches={clearRecentSearches}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="flex-1 gap-2"
            data-testid="import-products-button"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">İçe Aktar</span>
            <span className="sm:hidden">İçe Aktar</span>
          </Button>
          <ProductExportButton disabled={products.length === 0} className="flex-1" data-testid="export-products-button" />
          <ViewToggle view={view} onChange={handleViewChange} data-testid="view-toggle" />
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Filtreler:</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0 px-2 text-xs text-destructive"
              onClick={clearAllFilters}
            >
              Tümünü temizle
            </Button>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mt-2">
          {total} ürün
        </p>
      </div>

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
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery || activeFilterCount > 0
              ? 'Ürün bulunamadı'
              : 'Katalogta ürün yok'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || activeFilterCount > 0
              ? 'Filtreleri değiştirerek tekrar deneyin'
              : 'Sistem yöneticisi ile iletişime geçin'}
          </p>
        </div>
      )}

      {/* Product Display: Table Only (Grid can be added later if needed) */}
      {!isLoading && !error && products.length > 0 && view === 'table' && (
        <AllProductsTable
          products={products}
          onPriceClick={handlePriceClick}
          onUpdatePrice={handleUpdatePrice}
          onUpdateStock={handleUpdateStock}
          onUpdateStatus={handleUpdateStatus}
          isCreating={isCreating}
          isUpdating={isUpdating}
        />
      )}

      {/* Grid View - Optional for future */}
      {!isLoading && !error && products.length > 0 && view === 'grid' && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Grid view coming soon</p>
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

      {/* Import Modal */}
      <ProductImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
    </div>
  );
}
