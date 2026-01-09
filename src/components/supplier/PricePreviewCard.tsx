'use client';

import { useProductPriceStats, useProductSuppliers } from '@/hooks/useMultiSupplierProducts';
import { TrendingUp, TrendingDown, Minus, Store, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PricePreviewCardProps {
  productId: string;
  basePrice: number;
  unit: string;
}

export function PricePreviewCard({ productId, basePrice, unit }: PricePreviewCardProps) {
  const { data: stats, isLoading: isLoadingStats } = useProductPriceStats(productId);
  const { data: suppliers, isLoading: isLoadingSuppliers } = useProductSuppliers(productId);

  if (isLoadingStats || isLoadingSuppliers) {
    return (
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!stats || stats.supplier_count === 0) {
    return null;
  }

  return (
    <div
      className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 animate-in fade-in slide-in-from-top-2 duration-400"
      style={{
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-2 mb-3">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
            Haldeki Fiyat Bilgisi
          </h4>
          <p className="text-xs text-green-700 dark:text-green-300">
            {stats.supplier_count} tedarikçi teklifi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-green-100 dark:border-green-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">En Düşük</p>
          <p className="text-lg font-bold text-green-700 dark:text-green-300">
            {stats.min_price.toFixed(2)}₺
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-green-100 dark:border-green-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ortalama</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {stats.avg_price.toFixed(2)}₺
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-green-100 dark:border-green-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">En Yüksek</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {stats.max_price.toFixed(2)}₺
          </p>
        </div>
      </div>

      {suppliers && suppliers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            <Store className="h-3.5 w-3.5" />
            Tedarikçi Fiyatları
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {suppliers.slice(0, 5).map((supplier, index) => (
              <div
                key={supplier.supplier_id}
                className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded px-2 py-1.5 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {index === 0 && (
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded flex-shrink-0">
                      En İyi
                    </span>
                  )}
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {supplier.supplier_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {supplier.price.toFixed(2)}₺
                  </span>
                  {supplier.previous_price && supplier.price_change !== 'stable' && (
                    <div className="flex items-center">
                      {supplier.price_change === 'increased' ? (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
