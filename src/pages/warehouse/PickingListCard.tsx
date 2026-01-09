/**
 * Picking List Card Component
 * Phase 11 - Warehouse MVP
 *
 * Toplanan ürünlerin özet listesi (FIYAT YOK - Security P0)
 */

import { Loader2, Package, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePickingList, usePickingListSummary } from '@/hooks/usePickingList';
import { TimeWindow } from '@/lib/timeWindow';

interface PickingListCardProps {
  timeWindow: TimeWindow;
}

export function PickingListCard({ timeWindow }: PickingListCardProps) {
  const { data: items, isLoading, error } = usePickingList(timeWindow);
  const { data: summary } = usePickingListSummary(timeWindow);

  // Export için CSV oluştur
  const handleExport = () => {
    if (!items || items.length === 0) return;

    const headers = ['Ürün Adı', 'Toplam (kg)', 'Sipariş Sayısı'];
    const rows = items.map(item => [
      item.product_name,
      item.total_quantity_kg.toFixed(2),
      item.order_count.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `toplama-listesi-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card data-testid="picking-list">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Toplama Listesi
            </CardTitle>
            <CardDescription>
              {timeWindow.label} - {summary?.totalProducts || 0} ürün
            </CardDescription>
          </div>
          {items && items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Dışa Aktar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive text-sm mb-2">Toplama listesi yüklenirken hata oluştu</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Tekrar Dene
            </Button>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {timeWindow.label} için toplanacak ürün yok.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Özet kartları */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{summary?.totalProducts || 0}</p>
                <p className="text-xs text-muted-foreground">Ürün Çeşidi</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{(summary?.totalKg || 0).toFixed(0)} kg</p>
                <p className="text-xs text-muted-foreground">Toplam Miktar</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{summary?.totalOrders || 0}</p>
                <p className="text-xs text-muted-foreground">Sipariş</p>
              </div>
            </div>

            {/* Ürün listesi */}
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.order_count} sipariş</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {item.total_quantity_kg.toFixed(1)} kg
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
