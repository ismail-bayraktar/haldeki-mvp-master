// All Products Table - Global Catalog with Price Entry
// Shows all products in a table format with inline editing for existing supplier products

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
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import type { GlobalProductCatalogItem } from '@/types/supplier';
import { EditPriceCell } from './EditPriceCell';
import { EditStockCell } from './EditStockCell';
import { EditStatusCell } from './EditStatusCell';
import { sanitizeImageUrl } from '@/lib/validation';

export interface AllProductsTableProps {
  products: GlobalProductCatalogItem[];
  onPriceClick: (product: GlobalProductCatalogItem) => void;
  onUpdatePrice?: (productId: string, price: number) => void;
  onUpdateStock?: (productId: string, stock: number) => void;
  onUpdateStatus?: (productId: string, isActive: boolean) => void;
  isCreating?: boolean;
  isUpdating?: string[];
}

export function AllProductsTable({
  products,
  onPriceClick,
  onUpdatePrice,
  onUpdateStock,
  onUpdateStatus,
  isCreating = false,
  isUpdating = [],
}: AllProductsTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Ürün</TableHead>
            <TableHead className="w-[120px]">Kategori</TableHead>
            <TableHead className="w-[120px]">Sizin Fiyat</TableHead>
            <TableHead className="w-[100px]">Stok</TableHead>
            <TableHead className="w-[100px]">Durum</TableHead>
            <TableHead className="w-[150px] text-right">Aksiyon</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Henüz ürün yok
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const hasPrice = product.supplier_product_id !== null;
              const isStocked = product.supplier_stock !== null && product.supplier_stock > 0;
              const isActive = product.supplier_is_active === true;
              const isUpdatingThis = isUpdating.includes(product.id);

              return (
                <TableRow
                  key={product.id}
                  className={isUpdatingThis ? 'opacity-50' : undefined}
                >
                  {/* Product Info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images && product.images.length > 0 ? (
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                          <img
                            src={sanitizeImageUrl(product.images[0]) || undefined}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '';
                              e.currentTarget.style.display = 'none';
                            }}
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

                  {/* Price - Inline Editable for existing products */}
                  <TableCell>
                    {hasPrice && product.supplier_price ? (
                      onUpdatePrice ? (
                        <EditPriceCell
                          value={product.supplier_price}
                          productId={product.id}
                          onSave={onUpdatePrice}
                          disabled={isUpdatingThis || isCreating}
                        />
                      ) : (
                        <span className="font-medium">
                          ₺{product.supplier_price.toFixed(2)}
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Stock - Inline Editable for existing products */}
                  <TableCell>
                    {hasPrice ? (
                      onUpdateStock ? (
                        <EditStockCell
                          value={product.supplier_stock ?? 0}
                          productId={product.id}
                          onSave={onUpdateStock}
                          disabled={isUpdatingThis || isCreating}
                        />
                      ) : (
                        <span className="text-sm">
                          {product.supplier_stock ?? '-'}
                        </span>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Status - Toggle for existing products */}
                  <TableCell>
                    {hasPrice ? (
                      onUpdateStatus ? (
                        <EditStatusCell
                          value={isActive}
                          productId={product.id}
                          onSave={onUpdateStatus}
                          disabled={isUpdatingThis || isCreating}
                          isSaving={isUpdatingThis}
                        />
                      ) : (
                        <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                          {isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Bağlı değil
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {hasPrice ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPriceClick(product)}
                        disabled={isCreating || isUpdatingThis}
                      >
                        Detay
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onPriceClick(product)}
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Ekleniyor
                          </>
                        ) : (
                          'Fiyat Gir'
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
