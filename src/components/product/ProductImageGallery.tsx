import { useState, useRef, useCallback, useMemo, memo, useEffect } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery = memo(({ images, productName }: ProductImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [api, setApi] = useState<CarouselApi>();
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle carousel slide changes
  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap());
  }, [api]);

  // Set up the carousel api listener
  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  const handleZoomToggle = useCallback(() => {
    setIsZoomed(prev => !prev);
    setZoomPosition({ x: 50, y: 50 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, [isZoomed]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, [isZoomed]);

  const goToPrev = useCallback(() => api?.scrollPrev(), [api]);
  const goToNext = useCallback(() => api?.scrollNext(), [api]);

  // Generate multiple images if only one exists (for demo purposes)
  const displayImages = useMemo(() => {
    return images.length > 1 ? images : [
      images[0],
      images[0].replace("w=400", "w=401"), // Slightly different URL for variety
      images[0].replace("w=400", "w=402"),
    ];
  }, [images]);

  return (
    <div className="relative">
      {/* Main Carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {displayImages.map((image, index) => (
            <CarouselItem key={index}>
              <div
                className={cn(
                  "relative aspect-square rounded-2xl overflow-hidden bg-secondary/30 cursor-zoom-in",
                  isZoomed && "cursor-move"
                )}
                onClick={handleZoomToggle}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
              >
                <img
                  ref={index === currentIndex ? imageRef : null}
                  src={image}
                  alt={`${productName} - ${index + 1}`}
                  loading="eager"
                  decoding="async"
                  width="600"
                  height="600"
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-300",
                    isZoomed && "scale-[2.5]"
                  )}
                  style={isZoomed ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  } : undefined}
                  draggable={false}
                />
                
                {/* Zoom indicator */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-3 right-3 h-9 w-9 rounded-full shadow-lg opacity-80 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomToggle();
                  }}
                >
                  {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                </Button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Navigation Arrows (Desktop) */}
      {displayImages.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg hidden md:flex"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg hidden md:flex"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Thumbnails / Dots */}
      {displayImages.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                index === currentIndex 
                  ? "border-primary shadow-md" 
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                loading="lazy"
                decoding="async"
                width="56"
                height="56"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Mobile swipe hint */}
      <p className="text-center text-xs text-muted-foreground mt-2 md:hidden">
        Kaydırarak diğer resimleri görün • Yakınlaştırmak için tıklayın
      </p>
    </div>
  );
});

ProductImageGallery.displayName = "ProductImageGallery";

export default ProductImageGallery;
