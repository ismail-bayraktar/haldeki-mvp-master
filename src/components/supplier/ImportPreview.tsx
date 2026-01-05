'use client';

import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState } from 'react';
import type { ImportError, ProductImportRow } from '@/types/supplier';
import { cn } from '@/lib/utils';

interface ImportPreviewProps {
  rows: ProductImportRow[];
  errors: ImportError[];
  successfulRows?: number;
  totalRows?: number;
}

type ViewMode = 'errors' | 'all';

export function ImportPreview({
  rows,
  errors,
  successfulRows = 0,
  totalRows = 0,
}: ImportPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('errors');

  const errorRows = new Set(errors.map(e => e.row));

  const displayRows = viewMode === 'errors'
    ? rows.filter((_, idx) => errorRows.has(idx + 2))
    : rows;

  const getRowError = (rowIndex: number) => {
    return errors.filter(e => e.row === rowIndex + 2);
  };

  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Alert
          className={cn(
            'border-l-4',
            hasErrors
              ? 'border-destructive/50 bg-destructive/5'
              : 'border-green-500/50 bg-green-500/5'
          )}
        >
          <AlertCircle className={cn('h-4 w-4', hasErrors ? 'text-destructive' : 'text-green-600')} />
          <AlertTitle className="text-sm">Durum</AlertTitle>
          <AlertDescription className="text-sm">
            {hasErrors ? (
              <span className="text-destructive font-medium">
                {errors.length} hatanın düzeltilmesi gerekiyor
              </span>
            ) : (
              <span className="text-green-600 font-medium">Tüm satırlar geçerli</span>
            )}
          </AlertDescription>
        </Alert>

        <Alert className="border-l-4 border-green-500/50 bg-green-500/5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-sm">Başarılı</AlertTitle>
          <AlertDescription className="text-sm font-medium">
            {successfulRows} / {totalRows} satır
          </AlertDescription>
        </Alert>

        <Alert className="border-l-4 border-blue-500/50 bg-blue-500/5">
          <Eye className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-sm">Görünüm</AlertTitle>
          <AlertDescription className="flex gap-2">
            <Button
              variant={viewMode === 'errors' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('errors')}
              className="h-7 text-xs"
            >
              Hatalı ({errors.length})
            </Button>
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('all')}
              className="h-7 text-xs"
            >
              Tümü ({totalRows})
            </Button>
          </AlertDescription>
        </Alert>
      </div>

      {/* Data Table */}
      {displayRows.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background shadow-sm">
                <TableRow>
                  <TableHead className="w-[60px]">Satır</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Taban Fiyat</TableHead>
                  <TableHead>Satış Fiyatı</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row, idx) => {
                  const actualRowNumber = rows.indexOf(row) + 2;
                  const rowErrors = getRowError(rows.indexOf(row));
                  const hasRowError = rowErrors.length > 0;

                  return (
                    <TableRow
                      key={idx}
                      className={cn(
                        hasRowError && 'bg-destructive/5'
                      )}
                    >
                      <TableCell className="font-medium">
                        {actualRowNumber}
                        {hasRowError && (
                          <AlertCircle className="h-3 w-3 text-destructive inline ml-1" />
                        )}
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell>{row.basePrice.toFixed(2)} ₺</TableCell>
                      <TableCell>{row.price.toFixed(2)} ₺</TableCell>
                      <TableCell>{row.stock}</TableCell>
                      <TableCell>
                        {hasRowError ? (
                          <div className="space-y-1">
                            {rowErrors.map((error, errIdx) => (
                              <div
                                key={errIdx}
                                className="text-xs text-destructive flex items-start gap-1"
                              >
                                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium">{error.field}:</span>{' '}
                                  {error.error}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination hint for large datasets */}
          {displayRows.length > 50 && (
            <div className="p-3 bg-muted/50 border-t text-center text-xs text-muted-foreground">
              İlk 50 satır gösteriliyor. Toplam {displayRows.length} satır var.
            </div>
          )}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Gösterilecek veri yok</AlertTitle>
          <AlertDescription>
            {viewMode === 'errors'
              ? 'Tüm satırlar başarıyla doğrulandı!'
              : 'İçe aktarılacak veri bulunamadı.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Summary */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Doğrulama Hatası Özeti</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p className="font-medium">
                {errors.length} satırda hata bulundu. Lütfen aşağıdaki sorunları düzeltin:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>Zorunlu alanları doldurun (Ürün Adı, Kategori, Birim, Fiyatlar)</li>
                <li>Fiyatlar sayı formatında olmalıdır (örn: 25.50)</li>
                <li>Kategori listedeki geçerli kategorilerden biri olmalıdır</li>
                <li>Birim kg, adet, demet veya paket olmalıdır</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
