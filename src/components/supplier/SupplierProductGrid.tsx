// Supplier Product Grid Component
// Read-only grid view using existing ProductCard and MobileCardContainer

import { Link } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { MobileCardContainer } from './SupplierMobileLayout';
import type { SupplierProduct } from '@/types/supplier';

export interface SupplierProductGridProps {
  products: SupplierProduct[];
  onDelete?: (productId: string) => void;
  isLoading?: boolean;
}

export function SupplierProductGrid({
  products,
  onDelete,
  isLoading = false,
}: SupplierProductGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Henüz ürün eklenmemiş</p>
        <Link
          to="/tedarikci/urunler/yeni"
          className="mt-2 text-sm text-primary hover:underline"
        >
          İlk ürünü ekleyin
        </Link>
      </div>
    );
  }

  return (
    <MobileCardContainer>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={onDelete}
        />
      ))}
    </MobileCardContainer>
  );
}
