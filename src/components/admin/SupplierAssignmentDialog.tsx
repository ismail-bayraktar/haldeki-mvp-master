import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSuppliers, type Supplier } from "@/hooks/useSuppliers";
import { useCreateSupplierProduct } from "@/hooks/useMultiSupplierProducts";
import { Loader2, Check, X, Package } from "lucide-react";
import type { SupplierProductFormData } from "@/types/multiSupplier";

const supplierProductSchema = z.object({
  supplier_id: z.string().min(1, "Tedarikçi seçiniz"),
  price: z.coerce.number().positive("Fiyat pozitif olmalı"),
  stock_quantity: z.coerce.number().int().min(0, "Stok 0 veya pozitif olmalı"),
  availability: z.enum(["plenty", "limited", "last"]),
  quality: z.enum(["premium", "standart", "ekonomik"]),
  origin: z.string().min(2, "Menşei en az 2 karakter"),
  min_order_quantity: z.coerce.number().int().min(1, "Minimum sipariş 1 veya fazla"),
  delivery_days: z.coerce.number().int().min(1, "Teslimat 1 gün veya fazla"),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

type SupplierProductFormValues = z.infer<typeof supplierProductSchema>;

interface SupplierAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  existingSupplierIds?: string[];  // These are supplier_id values to exclude
}

export function SupplierAssignmentDialog({
  open,
  onClose,
  productId,
  productName,
  existingSupplierIds = [],
}: SupplierAssignmentDialogProps) {
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const createMutation = useCreateSupplierProduct();

  const form = useForm<SupplierProductFormValues>({
    resolver: zodResolver(supplierProductSchema),
    defaultValues: {
      supplier_id: "",
      price: 0,
      stock_quantity: 0,
      availability: "plenty",
      quality: "standart",
      origin: "Türkiye",
      min_order_quantity: 1,
      delivery_days: 1,
      is_featured: false,
      is_active: true,
    },
  });

  const handleSubmit = (values: SupplierProductFormValues) => {
    const formData: SupplierProductFormData = {
      product_id: productId,
      ...values,
    };

    createMutation.mutate(formData, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  };

  const availableSuppliers = suppliers.filter(
    (s) => s.is_active && s.approval_status === "approved" && !existingSupplierIds.includes(s.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tedarikçi Atama
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{productName}</span> ürünü için tedarikçi ekleyin
          </DialogDescription>
        </DialogHeader>

        {suppliersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableSuppliers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Uygun tedarikçi bulunamadı</p>
            <p className="text-sm mt-1">
              {existingSupplierIds.length > 0
                ? "Bu ürüne zaten atanmış tüm tedarikçiler kullanılıyor."
                : "Aktif ve onaylı tedarikçi yok."}
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tedarikçi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tedarikçi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <ScrollArea className="h-48">
                            {availableSuppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                <div className="flex items-center gap-2">
                                  <span>{supplier.name}</span>
                                  {supplier.approval_status === "approved" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Check className="h-3 w-3" />
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiyat (₺)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Miktarı</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Durumu</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="plenty">Bol</SelectItem>
                          <SelectItem value="limited">Sınırlı</SelectItem>
                          <SelectItem value="last">Son Stok</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kalite</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="standart">Standart</SelectItem>
                          <SelectItem value="ekonomik">Ekonomik</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menşei</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Örn: Antalya" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_order_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Sipariş Miktarı</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teslimat Süresi (Gün)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Öne Çıkan</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Aktif</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {createMutation.isPending ? "Ekleniyor..." : "Ekle"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
