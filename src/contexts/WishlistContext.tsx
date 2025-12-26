import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Product } from "@/types";
import { toast } from "@/hooks/use-toast";

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Product[]>([]);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.find((item) => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
    toast({
      title: "Favorilere eklendi",
      description: `${product.name} favorilerinize eklendi.`,
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => {
      const product = prev.find((item) => item.id === productId);
      if (product) {
        toast({
          title: "Favorilerden kaldırıldı",
          description: `${product.name} favorilerinizden kaldırıldı.`,
        });
      }
      return prev.filter((item) => item.id !== productId);
    });
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.some((item) => item.id === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    toast({
      title: "Favoriler temizlendi",
      description: "Tüm favorileriniz kaldırıldı.",
    });
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        itemCount: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
