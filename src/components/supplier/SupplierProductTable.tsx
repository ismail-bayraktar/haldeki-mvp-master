// Supplier Product Table with Inline Editing
// Displays products in a table format with editable price, stock, status, and variations fields

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditPriceCell } from './EditPriceCell';
import { EditStockCell } from './EditStockCell';
import { EditStatusCell } from './EditStatusCell';
import { VariationCell } from './VariationCell';
import { VariationModal } from './VariationModal';
import type { SupplierProduct } from '@/types/supplier';
import type { ProductVariationsGrouped } from '@/types/multiSupplier';

export interface SupplierProductTableProps {
  products: SupplierProduct[];
  onUpdatePrice?: (productId: string, price: number) => void;
  onUpdateStock?: (productId: string, stock: number) => void;
  onUpdateStatus?: (productId: string, isActive: boolean) => void;
  onUpdateVariations?: (productId: string, variations: ProductVariationsGrouped[]) => void;
  onDelete?: (productId: string) => void;
  isUpdating?: string[]; // List of product IDs currently being updated
  isLoading?: boolean;
}

export function SupplierProductTable({
  products,
  onUpdatePrice,
  onUpdateStock,
  onUpdateStatus,
  onUpdateVariations,
  onDelete,
  isUpdating = [],
  isLoading = false,
}: SupplierProductTableProps) {
  const [variationModalProductId, setVariationModalProductId] = useState<string | null>(null);

  const handleOpenVariationModal = (productId: string) => {
    setVariationModalProductId(productId);
  };

  const handleCloseVariationModal = () => {
    setVariationModalProductId(null);
  };

  const handleVariationsSave = (productId: string, variations: ProductVariationsGrouped[]) => {
    onUpdateVariations?.(productId, variations);
    setVariationModalProductId(null);
  };

  const currentProduct = variationModalProductId
    ? products.find((p) => p.id === variationModalProductId || p.product_id === variationModalProductId)
    : null;

  return (
    <>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Ürün</TableHead>
            <TableHead className="w-[120px]">Kategori</TableHead>
            <TableHead className="w-[120px]">Fiyat</TableHead>
            <TableHead className="w-[100px]">Stok</TableHead>
            <TableHead className="w-[100px]">Durum</TableHead>
            <TableHead>Varyasyonlar</TableHead>
            <TableHead className="w-[120px] text-right">Aksiyonlar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Yükleniyor...
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Henüz ürün eklenmemiş
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const isUpdatingThis = isUpdating.includes(product.id);

              return (
                <TableRow
                  key={product.id}
                  className={cn(isUpdatingThis && 'opacity-50')}
                >
                  {/* Product Info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images && product.images.length > 0 ? (
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{product.name}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {product.unit}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </TableCell>

                  {/* Price - Inline Editable */}
                  <TableCell>
                    {onUpdatePrice ? (
                      <EditPriceCell
                        value={product.price || product.base_price || 0}
                        productId={product.id}
                        onSave={onUpdatePrice}
                        disabled={isUpdatingThis}
                      />
                    ) : (
                      <span className="text-sm">
                        ₺{(product.price || product.base_price || 0).toFixed(2)}
                      </span>
                    )}
                  </TableCell>

                  {/* Stock - Inline Editable */}
                  <TableCell>
                    {onUpdateStock ? (
                      <EditStockCell
                        value={product.stock}
                        productId={product.id}
                        onSave={onUpdateStock}
                        disabled={isUpdatingThis}
                      />
                    ) : (
                      <span className="text-sm">{product.stock}</span>
                    )}
                  </TableCell>

                  {/* Status - Toggle */}
                  <TableCell>
                    {onUpdateStatus ? (
                      <EditStatusCell
                        value={product.is_active ?? true}
                        productId={product.id}
                        onSave={onUpdateStatus}
                        disabled={isUpdatingThis}
                        isSaving={isUpdatingThis}
                      />
                    ) : (
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Variations - Clickable */}
                  <TableCell>
                    <VariationCell
                      product={product}
                      onOpenModal={handleOpenVariationModal}
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8"
                      >
                        <Link to={`/tedarikci/urunler/${product.id}/duzenle`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Düzenle</span>
                        </Link>
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(product.id)}
                          disabled={isUpdatingThis}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Sil</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>

    {/* Variation Modal */}
    {currentProduct && (
      <VariationModal
        open={variationModalProductId !== null}
        onOpenChange={(open) => {
          if (!open) handleCloseVariationModal();
        }}
        productId={variationModalProductId}
        productName={currentProduct.name}
        initialVariations={currentProduct.variations || []}
        onSave={handleVariationsSave}
        isSaving={isUpdating.includes(variationModalProductId || '')}
      />
    )}
  </>
  );
}
