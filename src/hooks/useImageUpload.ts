// Image Upload Hook for Suppliers (Phase 9)

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ImageUploadProgress, ImageValidationResult } from '@/types/supplier';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const COMPRESSED_MAX_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGES_PER_PRODUCT = 5;

/**
 * Validate image file before upload
 */
export async function validateImageFile(
  file: File
): Promise<ImageValidationResult> {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Sadece PNG, JPG ve WebP dosyaları yüklenebilir.',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'Dosya boyutu çok büyük. Maksimum 5MB.',
    };
  }

  // Compress if needed
  if (file.size > COMPRESSED_MAX_SIZE) {
    try {
      const compressed = await compressImage(file);
      return {
        isValid: true,
        compressedFile: compressed,
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Görsel sıkıştırılamadı',
      };
    }
  }

  return { isValid: true };
}

/**
 * Compress image using Canvas API
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions (max 1200px)
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality 0.8
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            const compressed = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          file.type,
          0.8
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
}

/**
 * Hook: Upload product images with progress tracking
 */
export function useImageUpload() {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<ImageUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload single image file
   */
  const uploadImage = useCallback(
    async (
      file: File,
      productId?: string
    ): Promise<string | null> => {
      if (!user?.id) {
        toast.error('Oturum açmanız gerekiyor');
        return null;
      }

      // Validate file
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || 'Dosya doğrulama hatası');
        return null;
      }

      const fileToUpload = validation.compressedFile || file;

      // Create upload progress tracker
      const uploadId = Date.now().toString();
      setUploads((prev) => [
        ...prev,
        { file: fileToUpload, progress: 0 },
      ]);

      try {
        setIsUploading(true);

        // Generate file path
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = productId
          ? `${productId}-${Date.now()}.${fileExt}`
          : `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Update progress to complete
        setUploads((prev) =>
          prev.map((u) =>
            u.file.name === fileToUpload.name
              ? { ...u, progress: 100, url: publicUrl }
              : u
          )
        );

        return publicUrl;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen hata';

        // Provide specific error messages
        let userMessage = 'Görsel yüklenemedi. Lütfen tekrar deneyin.';
        if (message.includes('network') || message.includes('connection')) {
          userMessage = 'Network hatası: Lütfen internet bağlantınızı kontrol edin.';
        } else if (message.includes('permission') || message.includes('authorization')) {
          userMessage = 'Yetki hatası: Bu işlem için yetkiniz yok.';
        } else if (message.includes('storage') || message.includes('bucket')) {
          userMessage = 'Depolama hatası: Lütfen daha sonra tekrar deneyin.';
        }

        toast.error(userMessage);

        // Mark upload as failed
        setUploads((prev) =>
          prev.map((u) =>
            u.file.name === fileToUpload.name
              ? { ...u, error: userMessage }
              : u
          )
        );

        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id]
  );

  /**
   * Upload multiple images
   */
  const uploadImages = useCallback(
    async (files: File[], productId?: string): Promise<string[]> => {
      if (files.length > MAX_IMAGES_PER_PRODUCT) {
        toast.error(
          `En fazla ${MAX_IMAGES_PER_PRODUCT} görsel yükleyebilirsiniz`
        );
        return [];
      }

      const uploadPromises = files.map((file) => uploadImage(file, productId));
      const results = await Promise.all(uploadPromises);

      return results.filter((url): url is string => url !== null);
    },
    [uploadImage]
  );

  /**
   * Delete image from storage
   */
  const deleteImage = useCallback(async (imageUrl: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/product-images\/(.+)$/);
      if (!pathMatch) {
        throw new Error('Invalid image URL');
      }
      const filePath = pathMatch[1];

      // Verify file belongs to supplier
      if (!filePath.startsWith(user.id)) {
        throw new Error('Unauthorized');
      }

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (error) throw error;

      toast.success('Görsel silindi');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error('Görsel silinirken hata: ' + message);
      return false;
    }
  }, [user?.id]);

  /**
   * Clear completed uploads from state
   */
  const clearUploads = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.progress < 100 && !u.error));
  }, []);

  /**
   * Remove specific upload from state
   */
  const removeUpload = useCallback((file: File) => {
    setUploads((prev) => prev.filter((u) => u.file !== file));
  }, []);

  /**
   * Check if all uploads are complete (no pending uploads)
   */
  const areUploadsComplete = useCallback(() => {
    const pendingUploads = uploads.filter((u) => u.progress < 100 && !u.error);
    return pendingUploads.length === 0;
  }, [uploads]);

  /**
   * Get failed uploads
   */
  const getFailedUploads = useCallback(() => {
    return uploads.filter((u) => u.error);
  }, [uploads]);

  return {
    uploads,
    isUploading,
    uploadImage,
    uploadImages,
    deleteImage,
    clearUploads,
    removeUpload,
    areUploadsComplete,
    getFailedUploads,
  };
}

/**
 * Hook: Manage product images array (add/remove URLs)
 */
export function useProductImages(initialImages: string[] = []) {
  const [images, setImages] = useState<string[]>(initialImages);
  const { uploadImages, deleteImage, isUploading, areUploadsComplete, getFailedUploads } = useImageUpload();

  /**
   * Add images to product
   */
  const addImages = async (files: File[], productId?: string) => {
    if (images.length + files.length > MAX_IMAGES_PER_PRODUCT) {
      toast.error(
        `En fazla ${MAX_IMAGES_PER_PRODUCT} görsel yükleyebilirsiniz`
      );
      return false;
    }

    const uploadedUrls = await uploadImages(files, productId);
    if (uploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...uploadedUrls]);
      return true;
    }
    return false;
  };

  /**
   * Remove image from product
   */
  const removeImage = async (imageUrl: string) => {
    const deleted = await deleteImage(imageUrl);
    if (deleted) {
      setImages((prev) => prev.filter((url) => url !== imageUrl));
    }
    return deleted;
  };

  /**
   * Reorder images
   */
  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  };

  return {
    images,
    setImages,
    addImages,
    removeImage,
    reorderImages,
    isUploading,
    canAddMore: images.length < MAX_IMAGES_PER_PRODUCT,
    areUploadsComplete,
    getFailedUploads,
  };
}
