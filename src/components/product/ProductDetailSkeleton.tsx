import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailSkeleton = () => {
  return (
    <div className="container py-6">
      <Skeleton className="h-5 w-32 mb-6" />
      
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image skeleton */}
        <Skeleton className="aspect-square rounded-2xl" />

        {/* Content skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-48 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-5 w-12" />
          </div>

          <Skeleton className="h-16 w-full" />

          <div className="flex items-center gap-4 py-4 border-y">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-12 flex-1 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
