import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ShoppingCart, Package } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Order {
  id: string;
  region_name?: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}

interface DealerOrderListProps {
  orders: Order[];
  isLoading: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Beklemede</Badge>;
    case 'confirmed':
      return <Badge variant="default">Onaylandı</Badge>;
    case 'preparing':
      return <Badge className="bg-yellow-600">Hazırlanıyor</Badge>;
    case 'shipped':
      return <Badge className="bg-blue-600">Yolda</Badge>;
    case 'delivered':
      return <Badge className="bg-green-600">Teslim Edildi</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">İptal</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const DealerOrderList = ({ orders, isLoading }: DealerOrderListProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Bölge Siparişleri
        </CardTitle>
        <CardDescription>Atanan bölgelerinizdeki siparişler</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Henüz sipariş bulunmuyor</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Bölge</TableHead>
                <TableHead>Ürünler</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.region_name || '-'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="text-muted-foreground">
                          {item.productName} x{item.quantity}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-muted-foreground">
                          +{order.items.length - 2} ürün daha
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.total_amount.toFixed(2)} ₺
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default DealerOrderList;
