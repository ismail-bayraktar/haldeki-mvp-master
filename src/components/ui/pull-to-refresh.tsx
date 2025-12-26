import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullProgress: number;
  isRefreshing: boolean;
  pullDistance: number;
}

export const PullToRefreshIndicator = ({
  pullProgress,
  isRefreshing,
  pullDistance,
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200",
        isRefreshing ? "top-4" : ""
      )}
      style={{
        top: isRefreshing ? 16 : Math.max(pullDistance - 40, 0),
        opacity: Math.max(pullProgress, isRefreshing ? 1 : 0),
      }}
    >
      <div className="bg-card rounded-full p-2 shadow-lg border">
        <RefreshCw
          className={cn(
            "h-5 w-5 text-primary transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${pullProgress * 180}deg)`,
          }}
        />
      </div>
    </div>
  );
};
