'use client';

import { useState, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useProductImport } from '@/hooks/useProductImport';
import { downloadProductImportTemplate } from '@/templates/generateExcelTemplate';
import type { ImportError } from '@/types/supplier';
import { cn } from '@/lib/utils';

interface ProductImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImportModal({ open, onOpenChange }: ProductImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewErrors, setPreviewErrors] = useState<ImportError[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const importMutation = useProductImport();

  const isValidFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    return validExtensions.includes(extension);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
      setPreviewErrors([]);
      setShowPreview(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
      setPreviewErrors([]);
      setShowPreview(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewErrors([]);
    setShowPreview(false);
    if (importMutation.reset) {
      importMutation.reset();
    }
  };

  const handleDownloadTemplate = () => {
    downloadProductImportTemplate();
  };

  const handleImport = async () => {
    if (!file) return;

    const result = await importMutation.mutateAsync(file);

    if (result.errors.length > 0) {
      setPreviewErrors(result.errors);
      setShowPreview(true);
    } else if (result.success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewErrors([]);
    setShowPreview(false);
    if (importMutation.reset) {
      importMutation.reset();
    }
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getProgressValue = () => {
    if (!importMutation.data) return 0;
    const { successfulRows, totalRows } = importMutation.data;
    return totalRows > 0 ? (successfulRows / totalRows) * 100 : 0;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="product-import-modal">
        <DialogHeader>
          <DialogTitle className="text-xl">Ürün İçe Aktar</DialogTitle>
          <DialogDescription>
            Excel veya CSV dosyasından ürünlerinizi toplu olarak ekleyin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>İlk kez içe aktarıyorsanız?</AlertTitle>
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span>Önce şablonu indirip doldurun</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Şablon İndir
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload Zone */}
          {!file ? (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-testid="file-upload-zone"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Dosyayı buraya sürükleyin</p>
                  <p className="text-sm text-muted-foreground">veya seçmek için tıklayın</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Desteklenen formatlar:</p>
                  <p>Excel (.xlsx, .xls) veya CSV</p>
                </div>
                <label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="file-input"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>Dosya Seç</span>
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={importMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              {importMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      İşleniyor...
                    </span>
                    <span className="text-muted-foreground">
                      {importMutation.data?.successfulRows || 0} / {importMutation.data?.totalRows || 0}
                    </span>
                  </div>
                  <Progress value={getProgressValue()} />
                </div>
              )}

              {/* Success Result */}
              {importMutation.data?.success && !importMutation.isPending && (
                <Alert className="border-green-500/50 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Başarılı!</AlertTitle>
                  <AlertDescription>
                    {importMutation.data.created} ürün eklendi, {importMutation.data.updated} ürün güncellendi
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Validation Errors Preview */}
          {showPreview && previewErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Doğrulama Hataları</AlertTitle>
              <AlertDescription>
                {previewErrors.length} satırda hata bulundu. Lütfen dosyayı kontrol edip tekrar deneyin.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Details */}
          {previewErrors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Hata Detayları:</p>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Satır</th>
                      <th className="p-2 text-left">Alan</th>
                      <th className="p-2 text-left">Hata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewErrors.slice(0, 20).map((error, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{error.row}</td>
                        <td className="p-2">{error.field}</td>
                        <td className="p-2 text-destructive">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewErrors.length > 20 && (
                  <p className="p-2 text-center text-muted-foreground text-xs">
                    ... ve {previewErrors.length - 20} hata daha
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={importMutation.isPending}
          >
            {importMutation.data?.success ? 'Kapat' : 'İptal'}
          </Button>
          {file && !importMutation.data?.success && (
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
              data-testid="import-submit-button"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  İçe Aktarılıyor...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  İçe Aktar
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
