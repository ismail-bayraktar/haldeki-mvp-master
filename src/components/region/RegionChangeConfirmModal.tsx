import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DbRegion } from "@/types";

export interface CartValidationResult {
  invalidItems: Array<{
    productId: string;
    productName: string;
    reason: "not_in_region" | "out_of_stock";
  }>;
  repriceItems: Array<{
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
  }>;
  hasChanges: boolean;
}

interface RegionChangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newRegion: DbRegion | null;
  validationResult: CartValidationResult | null;
}

export function RegionChangeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  newRegion,
  validationResult,
}: RegionChangeConfirmModalProps) {
  if (!validationResult || !newRegion) return null;

  const { invalidItems, repriceItems } = validationResult;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Bölge Değişikliği
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <strong>{newRegion.name}</strong> bölgesine geçmek istiyorsunuz.
              </p>

              {invalidItems.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm font-medium text-destructive mb-2">
                    ⚠️ {invalidItems.length} ürün kaldırılacak:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {invalidItems.slice(0, 3).map((item) => (
                      <li key={item.productId}>
                        • {item.productName}{" "}
                        <span className="text-destructive/70">
                          ({item.reason === "not_in_region" ? "bu bölgede yok" : "stok tükendi"})
                        </span>
                      </li>
                    ))}
                    {invalidItems.length > 3 && (
                      <li className="text-muted-foreground">
                        +{invalidItems.length - 3} ürün daha
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {repriceItems.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                    💰 {repriceItems.length} ürünün fiyatı değişecek:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {repriceItems.slice(0, 3).map((item) => (
                      <li key={item.productId}>
                        • {item.productName}:{" "}
                        <span className="line-through">{item.oldPrice.toFixed(2)}₺</span>
                        {" → "}
                        <span className="font-medium text-foreground">
                          {item.newPrice.toFixed(2)}₺
                        </span>
                      </li>
                    ))}
                    {repriceItems.length > 3 && (
                      <li className="text-muted-foreground">
                        +{repriceItems.length - 3} ürün daha
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Vazgeç</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Devam Et ve Güncelle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
