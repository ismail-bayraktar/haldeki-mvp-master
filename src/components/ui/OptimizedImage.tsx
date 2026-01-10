import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * OptimizedImage Bileşeni
 *
 * Özellikler:
 * - Otomatik lazy/eager stratejisi (priority prop'a göre)
 * - WebP/AVIF desteği (tarayıcı desteği kontrolü)
 * - Progressive loading (blur placeholder)
 * - Intersection Observer ile lazy loading
 * - Erişilebilirlik (ARIA labels)
 *
 * Best Practices:
 * - İlk 4 ürün: eager
 * - Hero bölümü: eager + high priority
 * - Fold altı: lazy
 * - Thumbnail'ler: lazy
 */

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // eager + high priority
  fetchPriority?: "high" | "low" | "auto";
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  sizes?: string;
  srcSet?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
}

const OptimizedImage = ({
  src,
  alt,
  width = 400,
  height = 400,
  className,
  priority = false,
  fetchPriority,
  loading,
  decoding = "async",
  sizes,
  srcSet,
  style,
  draggable = true,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority için otomatik görünür
  const imgRef = useRef<HTMLImageElement>(null);

  // Otomatik strateji: priority → eager + high, non-priority → lazy
  const effectiveLoading = loading ?? (priority ? "eager" : "lazy");
  const effectiveFetchPriority = fetchPriority ?? (priority ? "high" : "auto");

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || effectiveLoading === "eager") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // 50px before viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, effectiveLoading]);

  // WebP/AVIF format detection için URL'leri oluştur
  const getWebPSrc = (url: string) => {
    // Unsplash parameter ile WebP
    if (url.includes("unsplash.com")) {
      return url.replace("w=", "w=&fm=webp&q=80");
    }
    // Diğer durumlarda format dönüşümü backend'de yapılmalı
    return url;
  };

  const getAVIFSrc = (url: string) => {
    if (url.includes("unsplash.com")) {
      return url.replace("w=", "w=&fm=avif&q=80");
    }
    return url;
  };

  const webpSrc = getWebPSrc(src);
  const avifSrc = getAVIFSrc(src);

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width: width ? `${width}px` : "100%", aspectRatio: width && height ? `${width}/${height}` : undefined }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-secondary/30 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Picture element for modern format support */}
      {isInView && (
        <picture className="block w-full h-full">
          {/* AVIF - En modern format */}
          <source
            srcSet={avifSrc}
            type="image/avif"
          />
          {/* WebP - Geniş destek */}
          <source
            srcSet={webpSrc}
            type="image/webp"
          />
          {/* Fallback - JPEG/PNG */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={effectiveLoading}
            fetchPriority={effectiveFetchPriority}
            decoding={decoding}
            sizes={sizes}
            srcSet={srcSet}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            style={style}
            draggable={draggable}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsLoaded(true)} // Hata durumunda da placeholder'ı kaldır
          />
        </picture>
      )}

      {/* Loading state indicator (Accessibility) */}
      {!isLoaded && (
        <span className="sr-only">Yükleniyor...</span>
      )}
    </div>
  );
};

export { OptimizedImage };
export default OptimizedImage;
