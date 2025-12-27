import { useState } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Package,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  Camera,
  Calendar,
} from 'lucide-react';
import { DealerOrder, OrderStatus, PaymentStatus } from '@/hooks/useDealerOrders';

interface OrderDetailModalProps {
  order: DealerOrder | null;
  isOpen: boolean;
  onClose: () => void;
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
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Onaylandı', className: 'bg-blue-100 text-blue-800' },
    preparing: { label: 'Hazırlanıyor', className: 'bg-orange-100 text-orange-800' },
    shipped: { label: 'Yolda', className: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Teslim Edildi', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'İptal', className: 'bg-red-100 text-red-800' },
  };
  const config = statusConfig[status] || { label: status, className: '' };
  return <Badge className={config.className}>{config.label}</Badge>;
};

const getPaymentBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    unpaid: { label: 'Ödenmedi', className: 'bg-red-100 text-red-800' },
    paid: { label: 'Ödendi', className: 'bg-green-100 text-green-800' },
    partial: { label: 'Kısmi Ödeme', className: 'bg-yellow-100 text-yellow-800' },
  };
  const config = statusConfig[status] || { label: status, className: '' };
  return <Badge className={config.className}>{config.label}</Badge>;
};

const OrderDetailModal = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdatePayment,
  onUpdateDeliveryTime,
  onUploadPhoto,
}: OrderDetailModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  if (!order) return null;

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === 'cancelled') {
      setShowCancelDialog(true);
      return;
    }

    setIsUpdating(true);
    
    if (newStatus === 'delivered' && (deliveryNotes || photoFile)) {
      let photoUrl: string | undefined;
      if (photoFile) {
        const url = await onUploadPhoto(order.id, photoFile);
        if (url) photoUrl = url;
      }
      await onUpdateStatus(order.id, newStatus, {
        deliveryNotes: deliveryNotes || undefined,
        deliveryPhotoUrl: photoUrl,
      });
    } else {
      await onUpdateStatus(order.id, newStatus);
    }
    
    setIsUpdating(false);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) return;
    
    setIsUpdating(true);
    await onUpdateStatus(order.id, 'cancelled', { cancellationReason: cancelReason });
    setIsUpdating(false);
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const handlePaymentChange = async (status: PaymentStatus) => {
    setIsUpdating(true);
    await onUpdatePayment(order.id, status);
    setIsUpdating(false);
  };

  const handleDeliveryTimeUpdate = async () => {
    if (!estimatedTime) return;
    setIsUpdating(true);
    await onUpdateDeliveryTime(order.id, new Date(estimatedTime));
    setIsUpdating(false);
  };

  const getNextStatus = (): OrderStatus | null => {
    const flow: Record<string, OrderStatus> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'shipped',
      shipped: 'delivered',
    };
    return flow[order.status] || null;
  };

  const nextStatus = getNextStatus();
  const canCancel = ['pending', 'confirmed', 'preparing'].includes(order.status);
  const isCompleted = ['delivered', 'cancelled'].includes(order.status);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sipariş Detayı
            </DialogTitle>
            <DialogDescription>
              Sipariş No: {order.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Durum ve Ödeme */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Durum:</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ödeme:</span>
                {getPaymentBadge(order.payment_status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Bölge:</span>
                <Badge variant="outline">{order.region_name || '-'}</Badge>
              </div>
            </div>

            <Separator />

            {/* Ürünler */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Ürünler
              </h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-muted-foreground ml-2">
                        x{item.quantity} {item.unit}
                      </span>
                    </div>
                    <span className="font-medium">
                      ₺{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span>Toplam</span>
                  <span>₺{order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Teslimat Bilgileri */}
            {order.shipping_address && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Teslimat Adresi
                </h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {order.shipping_address.title && (
                    <p className="font-medium">{order.shipping_address.title}</p>
                  )}
                  <p>{order.shipping_address.fullAddress}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {order.shipping_address.phone}
                  </div>
                  {order.shipping_address.instructions && (
                    <p className="text-sm text-muted-foreground italic">
                      Not: {order.shipping_address.instructions}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tarihler */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sipariş:</span>
                <span>{format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
              </div>
              {order.estimated_delivery_time && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tahmini:</span>
                  <span>{format(new Date(order.estimated_delivery_time), 'dd MMM HH:mm', { locale: tr })}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">Teslim:</span>
                  <span>{format(new Date(order.delivered_at), 'dd MMM HH:mm', { locale: tr })}</span>
                </div>
              )}
            </div>

            {/* Müşteri Notu */}
            {order.notes && (
              <div>
                <h4 className="font-medium mb-2">Müşteri Notu</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {order.notes}
                </p>
              </div>
            )}

            {/* İptal Bilgisi */}
            {order.status === 'cancelled' && order.cancellation_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-1">İptal Sebebi</h4>
                <p className="text-sm text-red-600">{order.cancellation_reason}</p>
              </div>
            )}

            {/* Teslimat Kanıtı */}
            {order.delivery_photo_url && (
              <div>
                <h4 className="font-medium mb-2">Teslimat Fotoğrafı</h4>
                <img 
                  src={order.delivery_photo_url} 
                  alt="Teslimat kanıtı" 
                  className="rounded-lg max-h-48 object-cover"
                />
              </div>
            )}

            <Separator />

            {/* Aksiyonlar */}
            {!isCompleted && (
              <div className="space-y-4">
                {/* Tahmini Teslimat Saati */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="estimatedTime" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Tahmini Teslimat
                    </Label>
                    <Input
                      id="estimatedTime"
                      type="datetime-local"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeliveryTimeUpdate}
                    disabled={!estimatedTime || isUpdating}
                  >
                    Kaydet
                  </Button>
                </div>

                {/* Teslimat Notu ve Fotoğraf (Teslim için) */}
                {order.status === 'shipped' && (
                  <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
                    <h4 className="font-medium text-sm">Teslimat Tamamlama</h4>
                    <div>
                      <Label htmlFor="deliveryNotes">Teslimat Notu</Label>
                      <Textarea
                        id="deliveryNotes"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Teslimat ile ilgili not ekleyin..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryPhoto" className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        Teslimat Fotoğrafı
                      </Label>
                      <Input
                        id="deliveryPhoto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Ödeme Durumu */}
                <div className="flex items-center gap-2">
                  <Label className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Ödeme Durumu:
                  </Label>
                  <Select
                    value={order.payment_status}
                    onValueChange={(value) => handlePaymentChange(value as PaymentStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Ödenmedi</SelectItem>
                      <SelectItem value="paid">Ödendi</SelectItem>
                      <SelectItem value="partial">Kısmi Ödeme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Durum Butonları */}
                <div className="flex gap-2 justify-end">
                  {canCancel && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      İptal Et
                    </Button>
                  )}
                  {nextStatus && (
                    <Button
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={isUpdating}
                    >
                      {isUpdating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      {nextStatus === 'confirmed' && 'Onayla'}
                      {nextStatus === 'preparing' && 'Hazırlanıyor'}
                      {nextStatus === 'shipped' && 'Yola Çıktı'}
                      {nextStatus === 'delivered' && 'Teslim Edildi'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* İptal Onay Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi İptal Et</AlertDialogTitle>
            <AlertDialogDescription>
              Bu siparişi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancelReason">İptal Sebebi (Zorunlu)</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="İptal sebebini yazın..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={!cancelReason.trim() || isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              İptal Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderDetailModal;

