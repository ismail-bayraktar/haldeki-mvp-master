import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegion } from "@/contexts/RegionContext";
import {
  useAdminRegionProducts,
  useProductsNotInRegion,
  useCreateRegionProduct,
  useUpdateRegionProduct,
  useDeleteRegionProduct,
  useBulkAddMissingProducts,
} from "@/hooks/useAdminRegionProducts";

type AvailabilityStatus = "plenty" | "limited" | "last";

interface EditingProduct {
  id: string;
  price: number;
  previous_price: number | null;
  stock_quantity: number;
  availability: AvailabilityStatus;
  is_active: boolean;
}

const availabilityLabels: Record<AvailabilityStatus, string> = {
  plenty: "Bol",
  limited: "Sınırlı",
  last: "Son Stok",
};

const availabilityColors: Record<AvailabilityStatus, string> = {
  plenty: "bg-stock-plenty text-white",
  limited: "bg-stock-limited text-white",
  last: "bg-stock-last text-white",
};

export default function RegionProducts() {
  const { regions } = useRegion();
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [addingProductId, setAddingProductId] = useState<string>("");

  const activeRegions = regions.filter((r) => r.is_active);

  const { data: regionProducts, isLoading: productsLoading } =
    useAdminRegionProducts(selectedRegionId || null);

  const { data: availableProducts } = useProductsNotInRegion(
    selectedRegionId || null
  );

  const createMutation = useCreateRegionProduct();
  const updateMutation = useUpdateRegionProduct();
  const deleteMutation = useDeleteRegionProduct();
  const bulkAddMutation = useBulkAddMissingProducts();

  // Filter products by search
  const filteredProducts = regionProducts?.filter((rp: any) =>
    rp.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = () => {
    if (!addingProductId || !selectedRegionId) return;

    const product = availableProducts?.find((p: any) => p.id === addingProductId);
    if (!product) return;

    createMutation.mutate({
      region_id: selectedRegionId,
      product_id: addingProductId,
      price: product.price,
      stock_quantity: 100,
      availability: "plenty",
      is_active: true,
    });

    setShowAddDialog(false);
    setAddingProductId("");
  };

  const handleUpdateProduct = () => {
    if (!editingProduct || !selectedRegionId) return;

    updateMutation.mutate({
      id: editingProduct.id,
      regionId: selectedRegionId,
      price: editingProduct.price,
      previous_price: editingProduct.previous_price,
      stock_quantity: editingProduct.stock_quantity,
      availability: editingProduct.availability,
      is_active: editingProduct.is_active,
    });

    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (!selectedRegionId) return;
    if (!confirm("Bu ürünü bölgeden kaldırmak istediğinize emin misiniz?")) return;

    deleteMutation.mutate({ id, regionId: selectedRegionId });
  };

  const handleBulkAddMissing = () => {
    if (!selectedRegionId) return;
    if (!confirm("Tüm eksik ürünleri varsayılan değerlerle eklemek istiyor musunuz?")) return;
    bulkAddMutation.mutate(selectedRegionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bölge Ürünleri</h1>
          <p className="text-muted-foreground">
            Bölge bazlı fiyat ve stok yönetimi
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xs">
            <Label className="mb-2 block text-sm">Bölge Seçin</Label>
            <Select
              value={selectedRegionId}
              onValueChange={setSelectedRegionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bölge seçin..." />
              </SelectTrigger>
              <SelectContent>
                {activeRegions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRegionId && (
            <>
              <div className="flex-1 max-w-sm">
                <Label className="mb-2 block text-sm">Ürün Ara</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ürün adı..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleBulkAddMissing}
                  disabled={bulkAddMutation.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Eksik Ürünleri Ekle
                </Button>
                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ürün Ekle
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Content */}
      {!selectedRegionId ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Bölge Seçin</h3>
          <p className="text-muted-foreground">
            Ürünleri görüntülemek için yukarıdan bir bölge seçin.
          </p>
        </Card>
      ) : productsLoading ? (
        <Card className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      ) : filteredProducts?.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Ürün Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Arama kriterlerinize uygun ürün yok."
              : "Bu bölgede henüz ürün yok."}
          </p>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            İlk Ürünü Ekle
          </Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((rp: any) => (
                <TableRow key={rp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {rp.products?.images?.[0] && (
                        <img
                          src={rp.products.images[0]}
                          alt={rp.products.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{rp.products?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rp.products?.category_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {rp.price?.toFixed(2)}₺/{rp.products?.unit}
                      </p>
                      {rp.previous_price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {rp.previous_price.toFixed(2)}₺
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{rp.stock_quantity}</TableCell>
                  <TableCell>
                    <Badge className={availabilityColors[rp.availability as AvailabilityStatus]}>
                      {availabilityLabels[rp.availability as AvailabilityStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rp.is_active ? "default" : "secondary"}>
                      {rp.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingProduct({
                            id: rp.id,
                            price: rp.price,
                            previous_price: rp.previous_price,
                            stock_quantity: rp.stock_quantity,
                            availability: rp.availability,
                            is_active: rp.is_active,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(rp.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bölgeye Ürün Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ürün Seçin</Label>
              <Select value={addingProductId} onValueChange={setAddingProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts?.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.price}₺/{product.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableProducts?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tüm ürünler zaten bu bölgede ekli.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                İptal
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={!addingProductId || createMutation.isPending}
              >
                Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ürün Düzenle</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fiyat (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Önceki Fiyat (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.previous_price || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        previous_price: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="Opsiyonel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stok Adedi</Label>
                <Input
                  type="number"
                  value={editingProduct.stock_quantity}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      stock_quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Uygunluk Durumu</Label>
                <Select
                  value={editingProduct.availability}
                  onValueChange={(val: AvailabilityStatus) =>
                    setEditingProduct({
                      ...editingProduct,
                      availability: val,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plenty">Bol</SelectItem>
                    <SelectItem value="limited">Sınırlı</SelectItem>
                    <SelectItem value="last">Son Stok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Aktif</Label>
                <Switch
                  checked={editingProduct.is_active}
                  onCheckedChange={(checked) =>
                    setEditingProduct({
                      ...editingProduct,
                      is_active: checked,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleUpdateProduct}
                  disabled={updateMutation.isPending}
                >
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
