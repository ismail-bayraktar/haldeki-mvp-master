// Supplier Product Card Component (Phase 9 - Mobile First)

import { Link } from 'react-router-dom';
import { Edit, Trash2, MoreVertical, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SupplierProduct } from '@/types/supplier';

interface ProductCardProps {
  product: SupplierProduct;
  onEdit?: (product: SupplierProduct) => void;
  onDelete?: (product: SupplierProduct) => void;
  className?: string;
}

const getStatusConfig = (status: SupplierProduct['product_status']) => {
  const configs = {
    active: { label: 'Aktif', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
    inactive: { label: 'Pasif', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' },
    out_of_stock: { label: 'Stok Yok', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
  };
  return configs[status] || configs.active;
};

export function ProductCard({ product, onEdit, onDelete, className }: ProductCardProps) {
  const statusConfig = getStatusConfig(product.product_status);

  const handleEdit = () => {
    onEdit?.(product);
  };

  const handleDelete = () => {
    onDelete?.(product);
  };

  return (
    <Card className={cn('group overflow-hidden', className)}>
      <Link to={`/tedarikci/urunler/${product.id}`}>
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
              <ImageOff className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <Badge className={statusConfig.className} variant="secondary">
              {statusConfig.label}
            </Badge>
          </div>

          {/* Image Count */}
          {product.images && product.images.length > 1 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                +{product.images.length - 1}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Product Name */}
        <Link to={`/tedarikci/urunler/${product.id}`}>
          <h3 className="font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Category */}
        <p className="text-xs text-muted-foreground mb-2">
          {product.category}
        </p>

        {/* Price and Stock */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">
              ₺{product.base_price.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                /{product.unit}
              </span>
            </p>
          </div>

          {/* Stock Status */}
          {product.product_status === 'active' && (
            <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'}>
              {product.stock > 0 ? `${product.stock} adet` : 'Stok tükenmiş'}
            </Badge>
          )}
        </div>

        {/* Action Menu */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
          >
            <Link to={`/tedarikci/urunler/${product.id}/duzenle`}>
              <Edit className="h-3 w-3 mr-1" />
              Düzenle
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Last Modified */}
        {product.last_modified_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Son güncelleme: {new Date(product.last_modified_at).toLocaleDateString('tr-TR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
