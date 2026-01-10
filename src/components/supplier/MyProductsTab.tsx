// My Products Tab - Supplier's Priced Products (Phase 12)
// Refactored from original Products.tsx - shows only supplier's products with prices

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Package, Upload } from 'lucide-react';
import { SearchBar } from '@/components/supplier/SearchBar';
import { Button } from '@/components/ui/button';
import { ProductImportModal } from '@/components/supplier/ProductImportModal';
import { ProductExportButton } from '@/components/supplier/ProductExportButton';
import { ViewToggle, type ProductView } from '@/components/supplier/ViewToggle';
import { SupplierProductTable } from '@/components/supplier/SupplierProductTable';
import { SupplierProductGrid } from '@/components/supplier/SupplierProductGrid';
import { useSupplierJunctionProducts } from '@/hooks/useSupplierProducts';
import { useDeleteProduct } from '@/hooks/useSupplierProducts';
import { useUpdateProductPrice } from '@/hooks/useSupplierProducts';
import { useUpdateProductStock } from '@/hooks/useSupplierProducts';
import { useUpdateProductStatus } from '@/hooks/useSupplierProducts';
import { useUpdateProductVariations } from '@/hooks/useSupplierProducts';
import { useProductSearch } from '@/hooks/useProductSearch';
import type { ProductVariationsGrouped } from '@/types/multiSupplier';
import type { SupplierProduct } from '@/types/supplier';
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
import { toast } from 'sonner';

const STORAGE_KEY = 'supplier-products-view';

export function MyProductsTab() {
  const [view, setView] = useState<ProductView>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'grid' ? 'grid' : 'table') as ProductView;
  });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: SupplierProduct | null }>({
    open: false,
    product: null,
  });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string[]>([]);

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

  const { data, isLoading, error } = useSupplierJunctionProducts({
    filters: {
      ...filters,
      query: searchQuery || undefined,
    },
    sortBy,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;

  const { mutate: updatePrice } = useUpdateProductPrice();
  const { mutate: updateStock } = useUpdateProductStock();
  const { mutate: updateStatus } = useUpdateProductStatus();
  const { mutate: updateVariations } = useUpdateProductVariations();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleDeleteClick = (product: SupplierProduct) => {
    setDeleteDialog({ open: true, product });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.product) {
      deleteProduct(deleteDialog.product.id, {
        onSuccess: () => {
          setDeleteDialog({ open: false, product: null });
        },
      });
    }
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

  const handleUpdateVariations = (productId: string, variations: ProductVariationsGrouped[]) => {
    setIsUpdating((prev) => [...prev, productId]);
    updateVariations(
      { productId, variations },
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
    <div data-testid="my-products-tab">
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
              : 'Henüz ürününüz yok'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || activeFilterCount > 0
              ? 'Filtreleri değiştirerek tekrar deneyin'
              : '"Tüm Ürünler" sekmesinden fiyat girerek başlayın'}
          </p>
          {!searchQuery && activeFilterCount === 0 && (
            <Link to="/tedarikci/urunler/yeni">
              <Button data-testid="add-product-button">
                <Plus className="h-4 w-4 mr-2" />
                İlk Ürünü Ekle
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Product Display: Table or Grid */}
      {!isLoading && !error && products.length > 0 && (
        <>
          {view === 'table' ? (
            <div className="overflow-x-auto">
              <SupplierProductTable
                products={products}
                onUpdatePrice={handleUpdatePrice}
                onUpdateStock={handleUpdateStock}
                onUpdateStatus={handleUpdateStatus}
                onUpdateVariations={handleUpdateVariations}
                onDelete={handleDeleteClick}
                isUpdating={isUpdating}
              />
            </div>
          ) : (
            <SupplierProductGrid
              products={products}
              onDelete={handleDeleteClick}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteDialog.product?.name}" ürününü silmek istediğinizden emin
              misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Sil'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      <ProductImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
    </div>
  );
}
