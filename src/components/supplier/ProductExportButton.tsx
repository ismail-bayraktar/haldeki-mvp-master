'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useExportProducts, exportProducts } from '@/hooks/useProductExport';
import { toast } from 'sonner';
import type { ExportOptions } from '@/types/supplier';

interface ProductExportButtonProps {
  disabled?: boolean;
  selectedIds?: string[];
}

export function ProductExportButton({ disabled, selectedIds }: ProductExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: products } = useExportProducts();

  const handleExport = async (format: 'xlsx' | 'csv') => {
    if (!products || products.length === 0) {
      toast.error('Dışa aktarılacak ürün bulunamadı');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format,
        filter,
        selectedIds,
      };

      await exportProducts(products, options);

      toast.success(
        `${products.length} ürün ${format === 'xlsx' ? 'Excel' : 'CSV'} olarak dışa aktarıldı`
      );
    } catch (error) {
      toast.error(
        'Dışa aktarma başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting} className="gap-2">
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Dışa Aktar
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Dışa Aktarma Seçenekleri</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Filter Options */}
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-1">Filtre:</p>
          <DropdownMenuCheckboxItem
            checked={filter === 'all'}
            onCheckedChange={() => setFilter('all')}
          >
            Tüm Ürünler
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filter === 'active'}
            onCheckedChange={() => setFilter('active')}
          >
            Sadece Aktif
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filter === 'inactive'}
            onCheckedChange={() => setFilter('inactive')}
          >
            Sadece Pasif
          </DropdownMenuCheckboxItem>
        </div>

        <DropdownMenuSeparator />

        {/* Export Format */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Format:
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          <div className="flex-1">
            <p className="font-medium">Excel (.xlsx)</p>
            <p className="text-xs text-muted-foreground">Tablo formatında dışa aktar</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium">CSV (.csv)</p>
            <p className="text-xs text-muted-foreground">Virgülle ayrılmış değerler</p>
          </div>
        </DropdownMenuItem>

        {/* Info about selected products */}
        {selectedIds && selectedIds.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                {selectedIds.length} seçili ürün dışa aktarılacak
              </p>
            </div>
          </>
        )}

        {/* Total count info */}
        {!selectedIds && products && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                Toplam {products.length} ürün dışa aktarılacak
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
