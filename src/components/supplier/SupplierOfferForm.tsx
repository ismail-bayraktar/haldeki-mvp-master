import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface SupplierOfferFormProps {
  supplierId: string;
  onSubmit: (data: {
    supplier_id: string;
    product_id: string;
    offered_price: number;
    offered_quantity: number;
    unit: string;
    notes?: string;
  }) => Promise<boolean>;
  isSubmitting?: boolean;
}

const SupplierOfferForm = ({ supplierId, onSubmit, isSubmitting = false }: SupplierOfferFormProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [offeredQuantity, setOfferedQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, unit, price')
        .eq('is_active', true)
        .order('name');
      
      setProducts(data || []);
      setIsLoadingProducts(false);
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId || !offeredPrice || !offeredQuantity) return;

    const success = await onSubmit({
      supplier_id: supplierId,
      product_id: selectedProductId,
      offered_price: parseFloat(offeredPrice),
      offered_quantity: parseInt(offeredQuantity),
      unit: selectedProduct?.unit || 'kg',
      notes: notes || undefined
    });

    if (success) {
      setSelectedProductId('');
      setOfferedPrice('');
      setOfferedQuantity('');
      setNotes('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Yeni Teklif Oluştur
        </CardTitle>
        <CardDescription>Ürün için fiyat ve miktar teklifi verin</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product">Ürün</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingProducts ? "Yükleniyor..." : "Ürün seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Teklif Fiyatı (₺/{selectedProduct?.unit || 'kg'})
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder={selectedProduct ? `Güncel: ${selectedProduct.price} ₺` : "0.00"}
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Miktar ({selectedProduct?.unit || 'kg'})</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="100"
                value={offeredQuantity}
                onChange={(e) => setOfferedQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Not (Opsiyonel)</Label>
              <Textarea
                id="notes"
                placeholder="Ek bilgiler..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !selectedProductId}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Teklif Oluştur
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SupplierOfferForm;
