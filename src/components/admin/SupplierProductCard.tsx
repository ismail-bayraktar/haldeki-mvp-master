import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Pencil, Trash2, Package, Star, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { SupplierProductInfo } from "@/types/multiSupplier";
import { useDeleteSupplierProduct } from "@/hooks/useMultiSupplierProducts";

interface SupplierProductCardProps {
  supplierProduct: SupplierProductInfo;
  productId: string;
  onEdit?: () => void;
}

const availabilityConfig = {
  plenty: { label: "Bol", className: "bg-green-600 text-white" },
  limited: { label: "Sınırlı", className: "bg-yellow-500 text-white" },
  last: { label: "Son Stok", className: "bg-destructive text-white" },
};

const qualityConfig = {
  premium: { label: "Premium", className: "bg-amber-500 text-white" },
  standart: { label: "Standart", className: "bg-secondary" },
  ekonomik: { label: "Ekonomik", className: "bg-muted text-muted-foreground" },
};

export function SupplierProductCard({
  supplierProduct,
  productId,
  onEdit,
}: SupplierProductCardProps) {
  const [deleteDialog, setDeleteDialog] = useState(false);
  const deleteMutation = useDeleteSupplierProduct();

  const availability = availabilityConfig[supplierProduct.availability];
  const quality = qualityConfig[supplierProduct.quality];

  const handleDelete = () => {
    deleteMutation.mutate(supplierProduct.supplier_product_id, {
      onSuccess: () => {
        setDeleteDialog(false);
      },
    });
  };

  const getPriceChangeIcon = () => {
    switch (supplierProduct.price_change) {
      case "up":
        return <TrendingUp className="h-3.5 w-3.5 text-destructive" />;
      case "down":
        return <TrendingDown className="h-3.5 w-3.5 text-green-600" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium truncate">{supplierProduct.supplier_name}</h4>
              {supplierProduct.is_featured && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold">₺{supplierProduct.price.toFixed(2)}</span>
                {getPriceChangeIcon()}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  {supplierProduct.stock_quantity}
                </Badge>
                <Badge className={`text-xs ${availability.className}`}>
                  {availability.label}
                </Badge>
                <Badge className={`text-xs ${quality.className}`}>
                  {quality.label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Min. Sipariş: {supplierProduct.delivery_days} gün</span>
              <span>Menşei: Türkiye</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialog(true)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tedarikçi Atamasını Kaldır?</AlertDialogTitle>
            <AlertDialogDescription>
              {supplierProduct.supplier_name} tedarikçisinin bu üründeki atamasını
              kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Kaldırılıyor..." : "Kaldır"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
