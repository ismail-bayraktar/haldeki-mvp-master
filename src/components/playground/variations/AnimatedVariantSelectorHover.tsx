import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ProductVariant } from '@/types/product';

interface AnimatedVariantSelectorHoverProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantSelect: (variant: ProductVariant) => void;
  productPrice: number;
  priceUnit: string;
  hoverDelay?: number; // Delay before closing (ms)
}

export const AnimatedVariantSelectorHover: React.FC<AnimatedVariantSelectorHoverProps> = ({
  variants,
  selectedVariant,
  onVariantSelect,
  productPrice,
  priceUnit,
  hoverDelay = 150,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [iconRotation, setIconRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close on Escape (accessibility)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIconRotation(0);
        containerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape as unknown as EventListener);
      return () => document.removeEventListener('keydown', handleEscape as unknown as EventListener);
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Open immediately on hover
    setIsOpen(true);
    setIconRotation(90);
  };

  const handleMouseLeave = () => {
    // Set delay before closing to prevent jitter
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIconRotation(0);
    }, hoverDelay);
  };

  const handleVariantClick = (variant: ProductVariant) => {
    onVariantSelect(variant);
    // Keep open after selection for better UX
    // User can move away to close
  };

  const handleKeyDown = (event: KeyboardEvent, variant?: ProductVariant) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (variant) {
        handleVariantClick(variant);
      }
    }
  };

  // Get display text for selected variant
  const getSelectedDisplay = () => {
    if (selectedVariant) {
      return selectedVariant.size;
    }
    return variants.length > 0 ? variants[0].size : '';
  };

  return (
    <div
      ref={containerRef}
      className="variant-selector-container relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Price with animated icon */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-green-600">
          ₺{productPrice.toFixed(2)}/{priceUnit}
        </span>

        {/* Animated plus icon button - hover trigger */}
        <button
          type="button"
          onKeyDown={(e) => handleKeyDown(e as KeyboardEvent)}
          className={`
            variant-selector-icon
            flex items-center justify-center
            w-10 h-10 rounded-full
            border-2 border-green-500
            bg-white
            text-green-500
            transition-all duration-300 ease-out
            hover:bg-orange-50 hover:border-orange-400 hover:text-orange-400
            focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
            ${isOpen ? 'scale-110 rotate-90 bg-orange-50 border-orange-400 text-orange-400' : 'scale-100 rotate-0'}
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Varyasyonları seç (hover)"
          style={{
            transform: `scale(${isOpen ? 1.1 : 1}) rotate(${iconRotation}deg)`,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-300"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Variant list popover - appears on hover */}
      {isOpen && (
        <div
          className={`
            variant-list-popover
            absolute z-50
            mt-2
            w-48
            bg-white
            rounded-lg
            shadow-xl
            border border-gray-100
            overflow-hidden
            transition-all duration-300 ease-out
            ${isOpen ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            maxHeight: isOpen ? '256px' : '0px',
            opacity: isOpen ? 1 : 0,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Varyasyonlar"
            className="py-1"
          >
            {variants.map((variant, index) => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <li
                  key={variant.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleVariantClick(variant)}
                  onKeyDown={(e) => handleKeyDown(e as KeyboardEvent, variant)}
                  className={`
                    variant-item-animate
                    px-4 py-3
                    cursor-pointer
                    transition-all duration-150
                    flex items-center justify-between
                    ${isSelected
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:scale-[1.02]'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                  tabIndex={0}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`
                        w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-200
                        ${isSelected
                          ? 'border-green-500 bg-green-500 scale-110'
                          : 'border-gray-300 hover:border-green-400'
                        }
                      `}
                    >
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 ml-0.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span>{variant.size}</span>
                  </span>
                  {variant.discountedPrice && (
                    <span className="text-sm font-semibold text-green-600">
                      ₺{variant.discountedPrice.toFixed(2)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes variantSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .variant-item-animate {
          animation: variantSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .variant-selector-icon,
          .variant-list-popover,
          .variant-item-animate {
            transition: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
