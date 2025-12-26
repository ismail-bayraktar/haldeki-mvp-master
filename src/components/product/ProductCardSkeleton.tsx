import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const ProductCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card">
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4 space-y-3">
        <div>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </Card>
  );
};

export default ProductCardSkeleton;
