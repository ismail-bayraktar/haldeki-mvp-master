import { createContext, useContext, useState, useCallback, ReactNode } from "react";
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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuthenticated, openAuthDrawer } = useAuth();
  const { selectedRegion, openRegionModal } = useRegion();

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
