import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Product } from "@/types";
import { toast } from "@/hooks/use-toast";

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  itemCount: number;
  maxItems: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  const addToCompare = useCallback((product: Product) => {
    setCompareItems((prev) => {
      if (prev.find((item) => item.id === product.id)) {
        toast({
          title: "Zaten karsilastirmada",
          description: `${product.name} zaten karsilastirma listenizde.`,
        });
        return prev;
      }
      if (prev.length >= MAX_COMPARE_ITEMS) {
        toast({
          title: "Maksimum urun sayisi",
          description: `En fazla ${MAX_COMPARE_ITEMS} urun karsilastirabilirsiniz.`,
          variant: "destructive",
        });
        return prev;
      }
      toast({
        title: "Karsilastirmaya eklendi",
        description: `${product.name} karsilastirma listenize eklendi.`,
      });
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const isInCompare = useCallback((productId: string) => {
    return compareItems.some((item) => item.id === productId);
  }, [compareItems]);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        itemCount: compareItems.length,
        maxItems: MAX_COMPARE_ITEMS,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
};
