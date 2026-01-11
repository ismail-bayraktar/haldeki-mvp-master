import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Plus, Pencil, Trash2, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductVariationType } from "@/types/multiSupplier";

const VARIATION_TYPE_CONFIG = {
  size: {
    label: "Boyut",
    description: "Ürün boyutu (1 KG, 2 KG, 500 GR, 4 LT)",
    examples: ["1 KG", "2 KG", "500 GR", "4 LT", "1.5 KG"],
  },
  packaging: {
    label: "Ambalaj",
    description: "Paketleme türü (Kasa, Koli, Poşet, *4)",
    examples: ["Kasa (12 Adet)", "Kasa (15 KG)", "Poşet", "*4", "*6"],
  },
  quality: {
    label: "Kalite",
    description: "Ürün kalite sınıfı (1. Sınıf, 2. Sınıf, Organik)",
    examples: ["1. Sınıf", "2. Sınıf", "Organik", "Premium", "Standart"],
  },
  other: {
    label: "Diğer",
    description: "Diğer varyasyon türleri (yemek kitleri, özel seçimler)",
    examples: ["Yemek Kit", "Seçilmiş", "Karma"],
  },
} as const;

interface VariationTypeStat {
  type: ProductVariationType;
  count: number;
  sample_values: string[];
}

const AdminVariationTypes = () => {
  const [stats, setStats] = useState<VariationTypeStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductVariationType | null>(null);
  const [editingType, setEditingType] = useState<ProductVariationType | null>(null);

  // Form states
  const [newValue, setNewValue] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Direct query instead of RPC
      const { data: variations, error } = await supabase
        .from('product_variations')
        .select('variation_type, variation_value');

      if (error) throw error;

      if (variations) {
        const grouped = variations.reduce((acc, v) => {
          if (!acc[v.variation_type]) {
            acc[v.variation_type] = { type: v.variation_type, count: 0, sample_values: [] };
          }
          acc[v.variation_type].count++;
          if (!acc[v.variation_type].sample_values.includes(v.variation_value) && acc[v.variation_type].sample_values.length < 5) {
            acc[v.variation_type].sample_values.push(v.variation_value);
          }
          return acc;
        }, {} as Record<string, VariationTypeStat>);

        setStats(Object.values(grouped).sort((a, b) => b.count - a.count));
      }
    } catch (error) {
      console.error('Error fetching variation stats:', error);
      toast.error('Varyasyon istatistikleri alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddValue = async () => {
    if (!editingType || !newValue.trim()) {
      toast.error('Lütfen varyasyon değeri girin');
      return;
    }

    // Show info: variations must be added through product form
    toast.info(
      `Varyasyon değeri "${newValue.trim()}" hazırlandı. Lütfen Ürünler sayfasından bir ürün seçip bu değeri ekleyin.`,
      { duration: 5000 }
    );

    setNewValue('');
    setDisplayOrder(0);
    setEditingType(null);
  };

  const handleDeleteType = async (type: ProductVariationType) => {
    try {
      // Check if type is in use
      const { data: existing } = await supabase
        .from('product_variations')
        .select('id')
        .eq('variation_type', type)
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error('Bu varyasyon türü kullanımda, silinemez');
        return;
      }

      // For PostgreSQL enum, we can't remove values
      // Just show warning
      toast.info('PostgreSQL enum değerleri silinemez. Bu tür artık kullanılmayacak.');

      setDeleteDialogOpen(false);
      setSelectedType(null);
    } catch (error) {
      console.error('Error deleting variation type:', error);
      toast.error('İşlem başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Varyasyon Türleri
          </h1>
          <p className="text-muted-foreground">
            Ürün varyasyon türlerini ve değerlerini yönetin
          </p>
        </div>
        <Button onClick={fetchStats} disabled={isLoading}>
          Yenile
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="h-4 w-4" />
            Varyasyon Türleri Hakkında
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p className="mb-2">
            Taze gıda pazarı için optimize edilmiş 4 varyasyon türü:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc list-inside">
            <li><strong>Boyut:</strong> Ürün ağırlık/hacim (1 KG, 500 GR, 4 LT)</li>
            <li><strong>Ambalaj:</strong> Paketleme türü (Kasa, Koli, Poşet, *4)</li>
            <li><strong>Kalite:</strong> Kalite sınıfı (1. Sınıf, Organik, Premium)</li>
            <li><strong>Diğer:</strong> Diğer varyasyonlar (Yemek Kit, Karma)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Valid Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Geçerli Varyasyon Türleri</CardTitle>
          <CardDescription>
            Sistemde kullanılan 4 varyasyon türü ve örnek değerler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tür</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Kullanım</TableHead>
                <TableHead>Örnek Değerler</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(VARIATION_TYPE_CONFIG) as ProductVariationType[]).map((type) => {
                const config = VARIATION_TYPE_CONFIG[type];
                const stat = stats.find(s => s.type === type);
                const count = stat?.count || 0;

                return (
                  <TableRow key={type}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-medium">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {config.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{count}</span>
                        <span className="text-sm text-muted-foreground">varyasyon</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {config.examples.map((example) => (
                          <Badge key={example} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                        {stat?.sample_values?.slice(0, 3).map((value) => (
                          <Badge key={value} variant="default" className="text-xs bg-green-100 text-green-700">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingType(type);
                          setNewValue('');
                          setDisplayOrder(0);
                        }}
                        title="Değer ekle"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Value Dialog */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType && VARIATION_TYPE_CONFIG[editingType].label} Değeri Ekle
            </DialogTitle>
            <DialogDescription>
              {editingType && VARIATION_TYPE_CONFIG[editingType].description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">Varyasyon Değeri</Label>
              <Input
                id="value"
                placeholder={editingType && VARIATION_TYPE_CONFIG[editingType].examples[0]}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Görüntüleme Sırası</Label>
              <Input
                id="order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            {editingType && (
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Örnek değerler:</p>
                <div className="flex flex-wrap gap-1">
                  {VARIATION_TYPE_CONFIG[editingType].examples.map((example) => (
                    <Badge
                      key={example}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setNewValue(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingType(null)}>
              İptal
            </Button>
            <Button onClick={handleAddValue}>
              Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Varyasyon Türünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedType && (
                <>
                  <strong>{VARIATION_TYPE_CONFIG[selectedType]?.label}</strong> türünü silmek istediğinize emin misiniz?
                  <br /><br />
                  <span className="text-amber-600 dark:text-amber-400">
                    ⚠️ PostgreSQL enum değerleri silinemez. Bu tür artık kullanılmayacak olarak işaretlenecek.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedType && handleDeleteType(selectedType)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Statistics Summary */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              İstatistik Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {stats.reduce((sum, s) => sum + s.count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Toplam Varyasyon</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.filter(s => s.type === 'size').reduce((sum, s) => sum + s.count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Boyut</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.filter(s => s.type === 'packaging').reduce((sum, s) => sum + s.count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Ambalaj</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.filter(s => s.type === 'quality').reduce((sum, s) => sum + s.count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Kalite</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminVariationTypes;
