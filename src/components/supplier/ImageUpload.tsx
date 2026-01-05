// Image Upload Component for Suppliers (Phase 9 - Mobile First)

import { useRef, useState } from 'react';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { validateImageFile } from '@/hooks/useImageUpload';
import type { ImageUploadProgress } from '@/types/supplier';

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  images: string[];
  uploads: ImageUploadProgress[];
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

const MAX_IMAGES = 5;

export function ImageUpload({
  onUpload,
  onRemove,
  images,
  uploads = [],
  maxImages = MAX_IMAGES,
  disabled = false,
  className,
}: ImageUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const totalImages = images.length + uploads.length;
  const canAddMore = totalImages < maxImages;

  const handleCameraClick = () => {
    setError(null);
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    setError(null);
    galleryInputRef.current?.click();
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    // Check if adding would exceed max
    if (totalImages + filesArray.length > maxImages) {
      setError(`En fazla ${maxImages} görsel yükleyebilirsiniz`);
      return;
    }

    // Validate all files
    const validationPromises = filesArray.map(validateImageFile);
    const results = await Promise.all(validationPromises);

    const invalidFile = results.find((r) => !r.isValid);
    if (invalidFile) {
      setError(invalidFile.error || 'Dosya doğrulama hatası');
      return;
    }

    setError(null);

    // Use compressed files if available
    const filesToUpload = results.map((r, i) => r.compressedFile || filesArray[i]);
    onUpload(filesToUpload);

    // Reset inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Buttons */}
      {canAddMore && !disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCameraClick}
            disabled={uploads.some((u) => u.progress < 100 && !u.error)}
          >
            <Camera className="h-4 w-4 mr-2" />
            Kamera
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleGalleryClick}
            disabled={uploads.some((u) => u.progress < 100 && !u.error)}
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Galeri
          </Button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        multiple
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        multiple
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Counter */}
      <p className="text-xs text-muted-foreground">
        {totalImages} / {maxImages} görsel
      </p>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
              <img
                src={url}
                alt={`Görsel ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                disabled={disabled}
              >
                <X className="h-4 w-4 text-white" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">
                  Ana görsel
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div key={`${upload.file.name}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate flex-1">{upload.file.name}</span>
                {upload.error ? (
                  <span className="text-destructive">{upload.error}</span>
                ) : upload.progress === 100 ? (
                  <span className="text-green-600">Tamamlandı</span>
                ) : (
                  <span>%{upload.progress}</span>
                )}
              </div>
              {upload.progress < 100 && !upload.error && (
                <Progress value={upload.progress} className="h-1" />
              )}
              {upload.error && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => onRemove(index)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Kaldır
                </Button>
              )}
            </div>
          ))}
          {uploads.some((u) => u.progress < 100 && !u.error) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Görseller yükleniyor...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
