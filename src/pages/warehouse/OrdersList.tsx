/**
 * Orders List Component
 * Phase 11 - Warehouse MVP
 *
 * Sipariş listesi (FIYAT YOK - Security P0)
 */

import { Loader2, Package, User, Phone, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWarehouseOrders, useMarkPrepared } from '@/hooks/useWarehouseOrders';
import { TimeWindow } from '@/lib/timeWindow';
import { toast } from 'sonner';
import type { WarehouseOrder } from '@/hooks/useWarehouseOrders';

interface OrdersListProps {
  timeWindow: TimeWindow;
}

// Status badge color mapping
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'confirmed':
      return 'default';
    case 'preparing':
      return 'outline';
    case 'prepared':
      return 'default';
    default:
      return 'secondary';
  }
}

// Status label Türkçe
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Beklemede';
    case 'confirmed':
      return 'Onaylandı';
    case 'preparing':
      return 'Hazırlanıyor';
    case 'prepared':
      return 'Hazırlandı';
    default:
      return status;
  }
}

export function OrdersList({ timeWindow }: OrdersListProps) {
  const { data: orders, isLoading, error } = useWarehouseOrders(timeWindow);
  const { mutate: markPrepared, isPending } = useMarkPrepared();

  // Siparişi hazırlandı olarak işaretle
  const handleMarkPrepared = (orderId: string, orderNumber: string) => {
    markPrepared(orderId, {
      onSuccess: () => {
        toast.success(`${orderNumber} hazırlandı olarak işaretlendi`);
      },
    });
  };

  // Hazırlanabilir durumlar
  const canPrepare = (status: string) => {
    return status === 'confirmed' || status === 'preparing';
  };

  return (
    <div className="space-y-4" data-testid="orders-list">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Package className="h-5 w-5" />
        Siparişler ({orders?.length || 0})
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive">Siparişler yüklenirken hata oluştu</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      ) : !orders || orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Sipariş bulunamadı</h3>
            <p className="text-muted-foreground">
              {timeWindow.label} için sipariş yok.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Farklı bir vardiyayı deneyin veya daha sonra kontrol edin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onMarkPrepared={handleMarkPrepared}
              canPrepare={canPrepare(order.status)}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: WarehouseOrder;
  onMarkPrepared: (orderId: string, orderNumber: string) => void;
  canPrepare: boolean;
  isPending: boolean;
}

function OrderCard({ order, onMarkPrepared, canPrepare, isPending }: OrderCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`order-card-${order.id}`}>
      <CardContent className="p-4">
        {/* Header: Order number + Status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{order.order_number}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(order.placed_at).toLocaleString('tr-TR')}
            </p>
          </div>
          <Badge variant={getStatusVariant(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_phone}</span>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-muted-foreground">Ürünler:</p>
          {order.items.map((item, idx) => (
            <div
              key={`${item.product_id}-${idx}`}
              className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
            >
              <span className="flex-1">{item.product_name}</span>
              <span className="font-medium">
                {item.quantity_kg > 0
                  ? `${item.quantity_kg.toFixed(1)} kg`
                  : `${item.quantity} ${item.unit}`}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {canPrepare && (
          <Button
            onClick={() => onMarkPrepared(order.id, order.order_number)}
            disabled={isPending}
            className="w-full gap-2"
            data-testid={`mark-prepared-button-${order.id}`}
          >
            <CheckCircle className="h-4 w-4" />
            {isPending ? 'İşleniyor...' : 'Hazırla'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
