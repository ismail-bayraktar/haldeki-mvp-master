'use client';

import { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Heart, Leaf, Award, GitCompare, Ban, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Product, ProductVariant } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCompare } from '@/contexts/CompareContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPriceChangeLabel } from '@/lib/productUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnimatedProductCardProps {
  product: Product;
  variant?: 'default' | 'bugunHalde';
  animationsEnabled?: boolean;
}

export const AnimatedProductCard = memo(
  ({ product, variant = 'default', animationsEnabled = true }: AnimatedProductCardProps) => {
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { isInCompare, addToCompare, removeFromCompare } = useCompare();
    const { isBusiness } = useAuth();

    const inWishlist = isInWishlist(product.id);
    const inCompare = isInCompare(product.id);

    // Default variant selection
    const defaultVariant = useMemo(() => {
      if (!product.variants || product.variants.length === 0) return undefined;
      return product.variants.find((v) => v.isDefault) || product.variants[0];
    }, [product.variants]);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
      defaultVariant
    );

    // Animated variant selector state
    const [isVariantListOpen, setIsVariantListOpen] = useState(false);
    const [iconRotation, setIconRotation] = useState(0);
    const variantListRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          variantListRef.current &&
          buttonRef.current &&
          !variantListRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsVariantListOpen(false);
          setIconRotation(0);
        }
      };

      if (isVariantListOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isVariantListOpen]);

    // Close on Escape
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsVariantListOpen(false);
          setIconRotation(0);
          buttonRef.current?.focus();
        }
      };

      if (isVariantListOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isVariantListOpen]);

    // Region info states (simplified for showcase)
    const isInRegion = true;
    const isOutOfStock = false;
    const canAddToCart = true;

    // Price calculation
    const displayPrice = useMemo(() => {
      const basePrice = product.price;
      const multiplier = selectedVariant?.priceMultiplier ?? 1;
      return basePrice * multiplier;
    }, [product.price, selectedVariant]);

    const previousPrice = product.previousPrice;

    const getAvailabilityLabel = () => {
      switch (product.availability) {
        case 'plenty':
          return { label: 'Bol Stok', className: 'bg-stock-plenty/10 text-stock-plenty' };
        case 'limited':
          return { label: 'Sınırlı', className: 'bg-stock-limited/10 text-stock-limited' };
        case 'last':
          return { label: 'Son Ürünler', className: 'bg-stock-last/10 text-stock-last' };
      }
    };

    const isToday = product.arrivalDate === new Date().toISOString().split('T')[0];
    const availability = getAvailabilityLabel();

    const priceChangeLabel = useMemo(() => {
      return getPriceChangeLabel(product.priceChange);
    }, [product.priceChange]);

    const handleAddToCart = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!canAddToCart) {
          toast.error('Ürün stokta yok');
          return;
        }

        addToCart(product, 1, selectedVariant, displayPrice);
      },
      [canAddToCart, product, selectedVariant, displayPrice, addToCart]
    );

    const handleNotifyStock = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toast.success('Ürün stoğa girdiğinde size haber vereceğiz!', {
          description: product.name,
        });
      },
      [product.name]
    );

    const handleToggleWishlist = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      },
      [product, toggleWishlist]
    );

    const handleToggleCompare = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inCompare) {
          removeFromCompare(product.id);
        } else {
          addToCompare(product);
        }
      },
      [inCompare, product, removeFromCompare, addToCompare]
    );

    const handleToggleVariants = useCallback(() => {
      setIsVariantListOpen(!isVariantListOpen);
      setIconRotation((prev) => (prev === 0 ? 90 : 0));
    }, [isVariantListOpen]);

    const handleVariantSelect = useCallback(
      (variantItem: ProductVariant) => {
        setSelectedVariant(variantItem);
        setIsVariantListOpen(false);
        setIconRotation(0);
      },
      []
    );

    const handleVariantKeyDown = useCallback(
      (e: React.KeyboardEvent, variantItem?: ProductVariant) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (variantItem) {
            handleVariantSelect(variantItem);
          } else {
            handleToggleVariants();
          }
        }
      },
      [handleToggleVariants, handleVariantSelect]
    );

    return (
      <Card
        className={cn('group overflow-hidden card-hover bg-card h-full flex flex-col')}
        data-testid={`product-card-${product.id}`}
      >
        <Link
          to={`/urun/${product.slug}`}
          className="block"
          data-testid={`product-link-${product.id}`}
        >
          <div className="relative aspect-square overflow-hidden bg-secondary/30">
            <img
              src={product.images?.[0] || '/placeholder.svg'}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width="400"
              height="400"
              className={cn(
                'w-full h-full object-cover transition-transform duration-500',
                canAddToCart && 'group-hover:scale-105'
              )}
            />
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button
                onClick={handleToggleWishlist}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-all',
                  inWishlist
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-accent'
                )}
                data-testid={`wishlist-button-${product.id}`}
              >
                <Heart className={cn('h-4 w-4', inWishlist && 'fill-current')} />
              </button>
              <button
                onClick={handleToggleCompare}
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-all',
                  inCompare
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card/80 text-muted-foreground hover:bg-card hover:text-primary'
                )}
                data-testid={`compare-button-${product.id}`}
              >
                <GitCompare className="h-4 w-4" />
              </button>
            </div>
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isToday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-haldeki-green-light text-haldeki-green">
                  <Leaf className="h-3 w-3" />
                  Bugün Geldi
                </span>
              )}
              {product.quality === 'premium' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                  <Award className="h-3 w-3" />
                  Premium
                </span>
              )}
              {priceChangeLabel && variant === 'bugunHalde' && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    product.priceChange === 'down'
                      ? 'bg-fresh-down/20 text-fresh-down'
                      : 'bg-fresh-up/20 text-fresh-up'
                  )}
                >
                  {priceChangeLabel}
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground mb-1">{product.origin}</p>
            <Link to={`/urun/${product.slug}`} data-testid={`product-name-${product.id}`}>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={cn('text-xs px-2 py-0.5 rounded-full', availability.className)}>
              {availability.label}
            </span>
          </div>

          {/* Animated Variant Selector - Opens UPWARD */}
          <div className="relative min-h-[44px] flex items-end justify-end">
            {product.variants && product.variants.length > 0 ? (
              <div className="relative">
                {/* Price + Animated Plus Button */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xl font-bold text-foreground">
                      {displayPrice.toFixed(2)}₺
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{selectedVariant?.label || product.unit}
                    </span>
                    {previousPrice && previousPrice > displayPrice && (
                      <span className="block text-xs text-muted-foreground line-through">
                        {previousPrice.toFixed(2)}₺
                      </span>
                    )}
                  </div>

                  {/* Animated + Button */}
                  <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleToggleVariants}
                    onKeyDown={(e) => handleVariantKeyDown(e)}
                    className={cn(
                      'variant-selector-icon',
                      'h-9 w-9 rounded-full flex items-center justify-center',
                      'bg-primary text-primary-foreground hover:bg-primary/90',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'transition-transform duration-225 ease-out',
                      animationsEnabled && 'hover:scale-110',
                      isVariantListOpen && 'rotate-90'
                    )}
                    style={{
                      transform: isVariantListOpen ? `rotate(${iconRotation}deg)` : 'rotate(0deg)',
                    }}
                    aria-expanded={isVariantListOpen}
                    aria-haspopup="listbox"
                    aria-label="Varyasyonları seç"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Variant List - Opens UPWARD (bottom: 100%) */}
                {isVariantListOpen && (
                  <div
                    ref={variantListRef}
                    className={cn(
                      'variant-list-popover-up',
                      'absolute z-50 bottom-full mb-2 right-0',
                      'w-48 bg-card rounded-lg shadow-lg border border-border',
                      'overflow-hidden'
                    )}
                    style={{
                      maxHeight: isVariantListOpen ? '256px' : '0px',
                      opacity: isVariantListOpen ? 1 : 0,
                      transform: isVariantListOpen ? 'translateY(0)' : 'translateY(8px)',
                    }}
                  >
                    <ul
                      role="listbox"
                      aria-label="Varyasyonlar"
                      className="py-1 max-h-64 overflow-y-auto scrollbar-none"
                    >
                      {product.variants.map((variantItem, index) => {
                        const isSelected = selectedVariant?.id === variantItem.id;
                        return (
                          <li
                            key={variantItem.id}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleVariantSelect(variantItem)}
                            onKeyDown={(e) => handleVariantKeyDown(e, variantItem)}
                            className={cn(
                              'variant-item-animate',
                              'px-4 py-3 cursor-pointer transition-colors duration-150',
                              'flex items-center justify-between',
                              isSelected
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-foreground hover:bg-muted'
                            )}
                            style={{
                              animationDelay: animationsEnabled ? `${index * 50}ms` : '0ms',
                            }}
                            tabIndex={0}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-border'
                                )}
                              >
                                {isSelected && (
                                  <svg
                                    width="8"
                                    height="8"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>
                              <span>{variantItem.label}</span>
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              ₺{(displayPrice / (selectedVariant?.priceMultiplier || 1) * variantItem.priceMultiplier).toFixed(2)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <span className="text-xl font-bold text-foreground">
                  {displayPrice.toFixed(2)}₺
                </span>
                <span className="text-sm text-muted-foreground">
                  /{selectedVariant?.label || product.unit}
                </span>
                {previousPrice && previousPrice > displayPrice && (
                  <span className="block text-xs text-muted-foreground line-through">
                    {previousPrice.toFixed(2)}₺
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t shrink-0 mt-auto">
            <div className="flex-1">
              {/* Empty div for spacing since price is now in the variant selector area */}
            </div>

            {isOutOfStock ? (
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full"
                onClick={handleNotifyStock}
                title="Gelince haber ver"
                data-testid={`notify-stock-button-${product.id}`}
              >
                <Bell className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-full',
                  canAddToCart
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                data-testid={`add-to-cart-button-${product.id}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

AnimatedProductCard.displayName = 'AnimatedProductCard';

export default AnimatedProductCard;
