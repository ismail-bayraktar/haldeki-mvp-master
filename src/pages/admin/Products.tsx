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
import { Package, Plus, Search, Pencil, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductActive,
  DbProduct,
  ProductInsert,
} from "@/hooks/useProducts";
import { ProductForm } from "@/components/admin/ProductForm";
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

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.origin.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün ara (isim, kategori, menşei)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                              src={product.images[0]}
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
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">₺{product.price.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">/{product.unit}</span>
                          {getPriceChangeIcon(product.price_change)}
                        </div>
                        {product.previous_price && (
                          <div className="text-xs text-muted-foreground line-through">
                            ₺{product.previous_price.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getAvailabilityBadge(product.availability)}</TableCell>
                      <TableCell>{getQualityBadge(product.quality)}</TableCell>
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
    </div>
  );
};

export default AdminProducts;
