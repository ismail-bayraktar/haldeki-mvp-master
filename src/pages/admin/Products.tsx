import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown, Minus, Users, Store } from "lucide-react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductActive,
  DbProduct,
  ProductInsert,
} from "@/hooks/useProducts";
import { useProductSuppliers, useProductPriceStats } from "@/hooks/useMultiSupplierProducts";
import { ProductForm } from "@/components/admin/ProductForm";
import { SupplierAssignmentDialog } from "@/components/admin/SupplierAssignmentDialog";
import { SupplierProductCard } from "@/components/admin/SupplierProductCard";
import { Skeleton } from "@/components/ui/skeleton";
const AdminProducts = () => {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const toggleActive = useToggleProductActive();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | undefined>();
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<"all" | "multiple" | "single">("all");

  const { data: productSuppliers, isLoading: suppliersLoading } = useProductSuppliers(
    selectedProductId || ""
  );
  const { data: priceStats } = useProductPriceStats(selectedProductId || "");

  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.origin || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleCreate = (data: ProductInsert) => {
    createProduct.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      },
    });
  };

  const handleUpdate = (data: ProductInsert) => {
    if (editingProduct) {
      updateProduct.mutate(
        { id: editingProduct.id, updates: data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingProduct(undefined);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (deleteProductId) {
      deleteProduct.mutate(deleteProductId, {
        onSuccess: () => {
          setDeleteProductId(null);
        },
      });
    }
  };

  const handleEdit = (product: DbProduct) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

  const handleViewSuppliers = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleCloseDetail = () => {
    setSelectedProductId(null);
  };

  const handleAssignSupplier = () => {
    setIsSupplierDialogOpen(true);
  };

  const selectedProduct = products?.find((p) => p.id === selectedProductId);
  const supplierCount = productSuppliers?.length || 0;

  const getPriceChangeIcon = (change: string) => {
    switch (change) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case "plenty":
        return <Badge variant="default" className="bg-green-600">Bol</Badge>;
      case "limited":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Sınırlı</Badge>;
      case "last":
        return <Badge variant="destructive">Son Stok</Badge>;
      default:
        return null;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "premium":
        return <Badge className="bg-amber-500">Premium</Badge>;
      case "standart":
        return <Badge variant="outline">Standart</Badge>;
      case "ekonomik":
        return <Badge variant="secondary">Ekonomik</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ürünler</h1>
            <p className="text-muted-foreground">Ürün kataloğunu yönetin</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ürün Listesi
          </CardTitle>
          <CardDescription>
            Toplam {products?.length ?? 0} ürün
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün ara (isim, kategori, menşei)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={supplierFilter}
              onValueChange={(v) => setSupplierFilter(v as typeof supplierFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tedarikçi filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Ürünler</SelectItem>
                <SelectItem value="multiple">Birden Fazla Tedarikçi</SelectItem>
                <SelectItem value="single">Tek Tedarikçi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Kalite</TableHead>
                    <TableHead>Tedarikçiler</TableHead>
                    <TableHead>Bugün Halde</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className={!product.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <img
                              src={product.images?.[0] || '/placeholder.svg'}
                              alt={product.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.origin}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">₺{product.base_price.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">/{product.unit}</span>
                          {product.price_change && getPriceChangeIcon(product.price_change)}
                        </div>
                        {product.previous_price && (
                          <div className="text-xs text-muted-foreground line-through">
                            ₺{product.previous_price.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{product.availability && getAvailabilityBadge(product.availability)}</TableCell>
                      <TableCell>{product.quality && getQualityBadge(product.quality)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSuppliers(product.id)}
                          className="h-7 px-2"
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Yönet
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_bugun_halde ? "default" : "outline"}>
                          {product.is_bugun_halde ? "Evet" : "Hayır"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={(checked) =>
                            toggleActive.mutate({ id: product.id, isActive: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteProductId(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Arama sonucu bulunamadı" : "Henüz ürün eklenmemiş"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Ürün bilgilerini güncelleyin"
                : "Yeni bir ürün eklemek için formu doldurun"}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={editingProduct ? handleUpdate : handleCreate}
            onCancel={handleCloseForm}
            isLoading={createProduct.isPending || updateProduct.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ürünü silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Ürün kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Detail Dialog with Suppliers */}
      <Dialog open={!!selectedProductId} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Ürün detayları ve tedarikçi atamaları
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Ürün Bilgileri</TabsTrigger>
              <TabsTrigger value="suppliers">
                Tedarikçiler ({supplierCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <p className="font-medium">{selectedProduct?.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Birim</p>
                  <p className="font-medium">{selectedProduct?.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Menşei</p>
                  <p className="font-medium">{selectedProduct?.origin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kalite</p>
                  <p className="font-medium">
                    {selectedProduct?.quality && getQualityBadge(selectedProduct.quality)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fiyat</p>
                  <p className="font-medium">₺{selectedProduct?.base_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stok Durumu</p>
                  <p className="font-medium">
                    {selectedProduct?.availability && getAvailabilityBadge(selectedProduct.availability)}
                  </p>
                </div>
              </div>

              {selectedProduct?.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Açıklama</p>
                  <p className="text-sm">{selectedProduct.description}</p>
                </div>
              )}

              {priceStats && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Fiyat İstatistikleri</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Min. Fiyat</p>
                      <p className="font-medium text-green-600">₺{priceStats.min_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max. Fiyat</p>
                      <p className="font-medium text-red-600">₺{priceStats.max_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ortalama</p>
                      <p className="font-medium">₺{priceStats.avg_price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {supplierCount} tedarikçi bu ürünü sağlıyor
                </p>
                <Button size="sm" onClick={handleAssignSupplier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tedarikçi Ekle
                </Button>
              </div>

              {suppliersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : productSuppliers && productSuppliers.length > 0 ? (
                <div className="space-y-3">
                  {productSuppliers.map((supplier) => (
                    <SupplierProductCard
                      key={supplier.supplier_product_id}
                      supplierProduct={supplier}
                      productId={selectedProductId!}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Henüz tedarikçi atanmamış</p>
                  <p className="text-sm mt-1">
                    Bu ürüne tedarikçi atamak için yukarıdaki butonu kullanın.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {selectedProductId && selectedProduct && (
            <SupplierAssignmentDialog
              open={isSupplierDialogOpen}
              onClose={() => setIsSupplierDialogOpen(false)}
              productId={selectedProductId}
              productName={selectedProduct.name}
              existingSupplierIds={productSuppliers?.map((s) => s.supplier_id) || []}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
