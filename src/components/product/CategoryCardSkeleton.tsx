import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const CategoryCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4">
        <Skeleton className="h-6 w-24 mb-1" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  );
};

export default CategoryCardSkeleton;
