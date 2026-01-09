/**
 * Warehouse Dashboard Page
 * Phase 11 - Warehouse MVP
 *
 * Mobil-first depo yönetim paneli
 * Shift selector, picking list, orders
 * FİYAT YOK - Security P0
 */

import { useState } from 'react';
import { Loader2, LogOut, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouseStats } from '@/hooks/useWarehouseOrders';
import { PickingListCard } from './PickingListCard';
import { OrdersList } from './OrdersList';
import {
  getCurrentShift,
  getCurrentShiftWindow,
  getAllShiftWindows,
  type ShiftType,
  type TimeWindow,
} from '@/lib/timeWindow';

export default function WarehouseDashboard() {
  const { user, logout } = useAuth();
  const [selectedShift, setSelectedShift] = useState<ShiftType>(getCurrentShift());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(getCurrentShiftWindow());

  const { data: stats, isLoading: statsLoading } = useWarehouseStats(timeWindow);

  // Shift değişince zaman penceresini güncelle
  const handleShiftChange = (shift: ShiftType) => {
    setSelectedShift(shift);
    setTimeWindow(shift === 'day' ? getCurrentShiftWindow() : getAllShiftWindows()[1]);
  };

  // Manuel yenileme
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-muted/30" data-testid="warehouse-dashboard">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Depo Paneli</h1>
              <p className="text-sm text-muted-foreground">
                Hoş geldiniz, {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                title="Yenile"
                data-testid="refresh-button"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Link to="/">
                <Button variant="outline" size="icon" title="Siteye Git">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Çıkış"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Shift Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Vardiya Seçimi</h2>
            <p className="text-sm text-muted-foreground">
              İşlenecek siparişlerin zaman aralığı
            </p>
          </div>
          <Select
            value={selectedShift}
            onValueChange={(value) => handleShiftChange(value as ShiftType)}
            data-testid="shift-selector"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Gündüz (08:00 - 17:00)</SelectItem>
              <SelectItem value="night">Gece (17:00 - 08:00)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Toplam
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">sipariş</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Onaylandı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.confirmed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">hazırlanmayı bekliyor</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Hazırlanıyor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.preparing || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">işlemde</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Hazırlandı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.prepared || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">teslimata hazır</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Picking List */}
        <PickingListCard timeWindow={timeWindow} />

        {/* Orders List */}
        <OrdersList timeWindow={timeWindow} />
      </main>
    </div>
  );
}
