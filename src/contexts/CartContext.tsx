import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CartItem, Product, ProductVariant, CartValidationResult, PriceSource } from "@/types";
import { useAuth } from "./AuthContext";
import { useRegion } from "./RegionContext";
import { toast } from "sonner";
import { validateCartForRegion, applyCartRegionChange } from "@/hooks/useCartValidation";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addToCart: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant,
    regionPrice?: number,
    supplierInfo?: {
      supplierId: string | null;
      supplierProductId: string | null;
      supplierName: string;
      priceSource: PriceSource;
    }
  ) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  // 2A.3: Bölge değişikliği validation ve apply
  validateForRegion: (newRegionId: string) => Promise<CartValidationResult>;
  applyRegionChange: (newRegionId: string, validationResult: CartValidationResult) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'haldeki_cart_items';
const CART_VERSION = 2;

// SECURITY NOTICE: Cart data (including prices) is stored in localStorage
// Risk: XSS attacks could potentially access or manipulate cart data
// Mitigation: Price validation during checkout prevents manipulation
// Future: Consider server-side cart storage for sensitive data
interface CartStorage {
  version: number;
  items: CartItem[];
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, openAuthDrawer } = useAuth();
  const { selectedRegion, openRegionModal } = useRegion();

  const migrateCartItem = (item: any): CartItem => ({
    ...item,
    supplierId: item.supplierId ?? null,
    supplierProductId: item.supplierProductId ?? null,
    supplierName: item.supplierName ?? '',
    priceSource: item.priceSource ?? 'product',
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    if (isHydrated) return;

    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Check version and migrate if needed
        if (parsed.version === undefined || parsed.version < CART_VERSION) {
          const migratedItems = (parsed.items || parsed).map(migrateCartItem);
          setItems(migratedItems);
          setIsHydrated(true);
          toast.info('Sepet güncellendi');
        } else if (parsed.version === CART_VERSION) {
          const items = parsed.items as CartItem[];
          setItems(items);
          setIsHydrated(true);
        }
      } else {
        setIsHydrated(true);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
      toast.warning('Sepet hatası nedeniyle temizlendi');
      setIsHydrated(true);
    }
  }, [isHydrated]);

  // Save cart to localStorage whenever items change (but only after hydration)
  useEffect(() => {
    if (!isHydrated) return;

    try {
      if (items.length > 0 && isAuthenticated && selectedRegion) {
        const storage: CartStorage = { version: CART_VERSION, items };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storage));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items, isHydrated, isAuthenticated, selectedRegion]);

  // Sync cart when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const stored = localStorage.getItem(CART_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            let cartItems: CartItem[];

            if (parsed.version === CART_VERSION && parsed.items) {
              cartItems = parsed.items;
            } else {
              cartItems = (parsed.items || parsed).map(migrateCartItem);
            }

            if (JSON.stringify(cartItems) !== JSON.stringify(items)) {
              setItems(cartItems);
            }
          }
        } catch (error) {
          console.error('Error syncing cart on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // 2A.3: Total hesabı unitPriceAtAdd üzerinden (TEK KAYNAK)
  const total = items.reduce((sum, item) => {
    const multiplier = item.selectedVariant?.priceMultiplier ?? 1;
    return sum + item.unitPriceAtAdd * multiplier * item.quantity;
  }, 0);

  const getCartItemKey = (productId: string, variantId?: string) => {
    return variantId ? `${productId}-${variantId}` : productId;
  };

  const addToCart = (
    product: Product,
    quantity = 1,
    variant?: ProductVariant,
    regionPrice?: number,
    supplierInfo?: {
      supplierId: string | null;
      supplierProductId: string | null;
      supplierName: string;
      priceSource: PriceSource;
    }
  ) => {
    if (!isAuthenticated) {
      openAuthDrawer();
      return;
    }

    if (!selectedRegion) {
      openRegionModal();
      return;
    }

    const unitPrice = regionPrice ?? product.price;
    const defaultSupplierInfo = {
      supplierId: null,
      supplierProductId: null,
      supplierName: '',
      priceSource: 'product' as PriceSource,
    };

    setItems((prev) => {
      const itemKey = getCartItemKey(product.id, variant?.id);
      const existingItem = prev.find(
        (item) => getCartItemKey(item.productId, item.selectedVariant?.id) === itemKey
      );

      const variantLabel = variant ? ` (${variant.label})` : "";

      if (existingItem) {
        toast.success(`${product.name}${variantLabel} sepetinizde güncellendi`);
        return prev.map((item) =>
          getCartItemKey(item.productId, item.selectedVariant?.id) === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      toast.success(`${product.name}${variantLabel} sepete eklendi`);
      return [
        ...prev,
        {
          productId: product.id,
          quantity,
          product,
          selectedVariant: variant,
          unitPriceAtAdd: unitPrice,
          regionIdAtAdd: selectedRegion.id,
          ...supplierInfo,
          ...defaultSupplierInfo,
        },
      ];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    const itemKey = getCartItemKey(productId, variantId);
    setItems((prev) => prev.filter(
      (item) => getCartItemKey(item.productId, item.selectedVariant?.id) !== itemKey
    ));
    toast.info("Ürün sepetten çıkarıldı");
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }
    
    const itemKey = getCartItemKey(productId, variantId);
    setItems((prev) =>
      prev.map((item) =>
        getCartItemKey(item.productId, item.selectedVariant?.id) === itemKey
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  // 2A.3: Bölge değişikliği için validation
  const validateForRegion = useCallback(
    async (newRegionId: string): Promise<CartValidationResult> => {
      return validateCartForRegion(items, newRegionId);
    },
    [items]
  );

  // 2A.3: Bölge değişikliği uygula
  const applyRegionChange = useCallback(
    (newRegionId: string, validationResult: CartValidationResult) => {
      const updatedItems = applyCartRegionChange(items, newRegionId, validationResult);
      setItems(updatedItems);

      // Özet toast
      const removedCount = validationResult.invalidItems.length;
      const repricedCount = validationResult.repriceItems.length;
      
      if (removedCount > 0 || repricedCount > 0) {
        const messages: string[] = [];
        if (removedCount > 0) messages.push(`${removedCount} ürün kaldırıldı`);
        if (repricedCount > 0) messages.push(`${repricedCount} fiyat güncellendi`);
        toast.info(`Sepet güncellendi: ${messages.join(", ")}`);
      }
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        validateForRegion,
        applyRegionChange,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
