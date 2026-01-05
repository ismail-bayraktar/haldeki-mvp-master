import { Product, ProductWithRegionInfo } from "@/types";
import ProductCard from "./ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface ProductCarouselProps {
  products: Product[] | ProductWithRegionInfo[];
  variant?: "default" | "bugunHalde";
}

const ProductCarousel = ({ products, variant = "default" }: ProductCarouselProps) => {
  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
        containScroll: "trimSnaps",
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-3">
        {products.map((product) => {
          // regionInfo varsa pass et (ProductWithRegionInfo)
          const regionInfo = 'regionInfo' in product ? product.regionInfo : undefined;
          return (
            <CarouselItem
              key={product.id}
              className="pl-3 basis-[70%] sm:basis-[45%] md:basis-[33%] lg:basis-[20%]"
            >
              <ProductCard product={product} regionInfo={regionInfo} variant={variant} />
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};

export default ProductCarousel;
