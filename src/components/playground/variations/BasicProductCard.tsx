import { memo } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/product/ProductCard';

interface BasicProductCardProps {
  product: Product;
  variant?: 'default' | 'bugunHalde';
}

/**
 * BasicProductCard - A simple wrapper around ProductCard
 *
 * This component provides a minimal product card by delegating all
 * rendering to the standard ProductCard component with inline variant buttons.
 */
export const BasicProductCard = memo(({ product, variant = 'default' }: BasicProductCardProps) => {
  return <ProductCard product={product} variant={variant} />;
});

BasicProductCard.displayName = 'BasicProductCard';

export default BasicProductCard;
