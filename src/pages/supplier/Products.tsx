// Supplier Products Page (Phase 9 - Mobile First)

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Package, Upload } from 'lucide-react';
import { SupplierMobileLayout, MobileCardContainer } from '@/components/supplier/SupplierMobileLayout';
import { ProductCard } from '@/components/supplier/ProductCard';
import { SearchBar } from '@/components/supplier/SearchBar';
import { Button } from '@/components/ui/button';
import { ProductImportModal } from '@/components/supplier/ProductImportModal';
import { ProductExportButton } from '@/components/supplier/ProductExportButton';
import { useSupplierProducts } from '@/hooks/useSupplierProducts';
import { useDeleteProduct } from '@/hooks/useSupplierProducts';
import { useProductSearch } from '@/hooks/useProductSearch';
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

export default function SupplierProducts() {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: any }>({
    open: false,
    product: null,
  });
  const [importModalOpen, setImportModalOpen] = useState(false);

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

  const { data, isLoading, error } = useSupplierProducts({
    filters: {
      ...filters,
      query: searchQuery || undefined,
    },
    sortBy,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;

  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleDeleteClick = (product: any) => {
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      saveSearch(query);
    }
  };

  return (
    <SupplierMobileLayout
      title="Ürünler"
      actionLabel="Yeni Ürün"
      actionHref="/tedarikci/urunler/yeni"
    >
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
        />

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="flex-1 gap-2"
          >
            <Upload className="h-4 w-4" />
            İçe Aktar
          </Button>
          <ProductExportButton disabled={products.length === 0} className="flex-1" />
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
              : 'İlk ürününüzü ekleyerek başlayın'}
          </p>
          {!searchQuery && activeFilterCount === 0 && (
            <Link to="/tedarikci/urunler/yeni">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                İlk Ürünü Ekle
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Product Grid */}
      {!isLoading && !error && products.length > 0 && (
        <MobileCardContainer>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDeleteClick}
            />
          ))}
        </MobileCardContainer>
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
    </SupplierMobileLayout>
  );
}
