import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShoppingCart, Package, Eye, CreditCard, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import OrderDetailModal from './OrderDetailModal';
import { DealerOrder, OrderStatus, PaymentStatus } from '@/hooks/useDealerOrders';

interface DealerOrderListProps {
  orders: DealerOrder[];
  isLoading: boolean;
  onUpdateStatus: (orderId: string, status: OrderStatus, additionalData?: {
    cancellationReason?: string;
    deliveryNotes?: string;
    deliveryPhotoUrl?: string;
  }) => Promise<boolean>;
  onUpdatePayment: (orderId: string, status: PaymentStatus, notes?: string) => Promise<boolean>;
  onUpdateDeliveryTime: (orderId: string, time: Date) => Promise<boolean>;
  onUploadPhoto: (orderId: string, file: File) => Promise<string | null>;
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    pending: { label: 'Beklemede', variant: 'secondary' },
    confirmed: { label: 'Onaylandı', variant: 'default' },
    preparing: { label: 'Hazırlanıyor', variant: 'outline', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    shipped: { label: 'Yolda', variant: 'outline', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    delivered: { label: 'Teslim Edildi', variant: 'outline', className: 'bg-green-100 text-green-800 border-green-300' },
    cancelled: { label: 'İptal', variant: 'destructive' },
  };
  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Ödendi</Badge>;
    case 'partial':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Kısmi</Badge>;
    default:
      return <Badge variant="destructive">Ödenmedi</Badge>;
  }
};

const DealerOrderList = ({
  orders,
  isLoading,
  onUpdateStatus,
  onUpdatePayment,
  onUpdateDeliveryTime,
  onUploadPhoto,
}: DealerOrderListProps) => {
  const [selectedOrder, setSelectedOrder] = useState<DealerOrder | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  // Siparişleri filtrele
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // İstatistikler
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const unpaidCount = orders.filter(o => o.payment_status === 'unpaid' && o.status !== 'cancelled').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const renderOrderTable = (orderList: DealerOrder[], showPayment = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sipariş No</TableHead>
          <TableHead>Bölge</TableHead>
          <TableHead>Ürünler</TableHead>
          <TableHead>Tutar</TableHead>
          <TableHead>Durum</TableHead>
          {showPayment && <TableHead>Ödeme</TableHead>}
          <TableHead>Tarih</TableHead>
          <TableHead className="text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orderList.map((order) => (
          <TableRow 
            key={order.id} 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => setSelectedOrder(order)}
          >
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
              ₺{order.total_amount.toFixed(2)}
            </TableCell>
            <TableCell>{getStatusBadge(order.status)}</TableCell>
            {showPayment && <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>}
            <TableCell className="text-muted-foreground text-sm">
              {format(new Date(order.created_at), 'dd MMM HH:mm', { locale: tr })}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrder(order);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Bölge Siparişleri
              </CardTitle>
              <CardDescription>Atanan bölgelerinizdeki siparişleri yönetin</CardDescription>
            </div>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingCount} bekliyor
                </Badge>
              )}
              {unpaidCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {unpaidCount} ödenmedi
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Henüz sipariş bulunmuyor</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  Aktif ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Tamamlanan ({completedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  İptal ({cancelledOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {activeOrders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Aktif sipariş yok</p>
                ) : (
                  renderOrderTable(activeOrders)
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedOrders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Tamamlanan sipariş yok</p>
                ) : (
                  renderOrderTable(completedOrders)
                )}
              </TabsContent>

              <TabsContent value="cancelled">
                {cancelledOrders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">İptal edilen sipariş yok</p>
                ) : (
                  renderOrderTable(cancelledOrders, false)
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={onUpdateStatus}
        onUpdatePayment={onUpdatePayment}
        onUpdateDeliveryTime={onUpdateDeliveryTime}
        onUploadPhoto={onUploadPhoto}
      />
    </>
  );
};

export default DealerOrderList;
