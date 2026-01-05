import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CartItem, Product, ProductVariant, CartValidationResult } from "@/types";
import { useAuth } from "./AuthContext";
import { useRegion } from "./RegionContext";
import { toast } from "sonner";
import { validateCartForRegion, applyCartRegionChange } from "@/hooks/useCartValidation";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant, regionPrice?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  // 2A.3: Bölge değişikliği validation ve apply
  validateForRegion: (newRegionId: string) => Promise<CartValidationResult>;
  applyRegionChange: (newRegionId: string, validationResult: CartValidationResult) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'haldeki_cart_items';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, openAuthDrawer } = useAuth();
  const { selectedRegion, openRegionModal } = useRegion();

  // Load cart from localStorage on mount or when auth/region becomes available
  useEffect(() => {
    if (isHydrated) return; // Prevent multiple hydrations

    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        // Only restore cart if user is authenticated and region is selected
        if (isAuthenticated && selectedRegion) {
          setItems(parsed);
          setIsHydrated(true); // Mark as hydrated only after successful restoration
        }
      } else {
        setIsHydrated(true); // No cart to restore, mark as hydrated
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
      setIsHydrated(true);
    }
  }, [isAuthenticated, selectedRegion, isHydrated]);

  // Save cart to localStorage whenever items change (but only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    
    try {
      if (items.length > 0 && isAuthenticated && selectedRegion) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
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
      if (document.visibilityState === 'visible' && isAuthenticated && selectedRegion) {
        try {
          const stored = localStorage.getItem(CART_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as CartItem[];
            // Only sync if items are different to avoid unnecessary updates
            if (JSON.stringify(parsed) !== JSON.stringify(items)) {
              setItems(parsed);
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
  }, [items, isAuthenticated, selectedRegion]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // 2A.3: Total hesabı unitPriceAtAdd üzerinden (TEK KAYNAK)
  const total = items.reduce((sum, item) => {
    const multiplier = item.selectedVariant?.priceMultiplier ?? 1;
    return sum + item.unitPriceAtAdd * multiplier * item.quantity;
  }, 0);

  const getCartItemKey = (productId: string, variantId?: string) => {
    return variantId ? `${productId}-${variantId}` : productId;
  };

  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant, regionPrice?: number) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      openAuthDrawer();
      return;
    }

    // Check if region is selected - open modal instead of just toast
    if (!selectedRegion) {
      openRegionModal();
      return;
    }

    // unitPriceAtAdd: regionPrice verilmişse onu kullan, yoksa product.price (fallback)
    const unitPrice = regionPrice ?? product.price;

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
