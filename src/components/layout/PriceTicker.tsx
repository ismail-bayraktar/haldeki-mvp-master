import { TrendingUp, TrendingDown, Minus, MapPin, Package } from "lucide-react";
import { getBugunHaldeProducts } from "@/data/products";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PriceTicker = () => {
  const products = getBugunHaldeProducts().slice(0, 10);

  const getPriceIcon = (priceChange?: "up" | "down" | "stable") => {
    switch (priceChange) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-fresh-up" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-fresh-down" />;
      default:
        return <Minus className="h-3 w-3 text-fresh-stable" />;
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case "plenty":
        return "Stokta";
      case "limited":
        return "Sinirli Stok";
      case "last":
        return "Son Urunler";
      default:
        return "Stokta";
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "plenty":
        return "text-stock-plenty";
      case "limited":
        return "text-stock-limited";
      case "last":
        return "text-stock-last";
      default:
        return "text-stock-plenty";
    }
  };

  // Duplicate products to create seamless infinite scroll
  const tickerItems = [...products, ...products];

  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div className="ticker-container relative flex items-center h-8">
        <div className="ticker-content flex items-center gap-8 whitespace-nowrap">
          {tickerItems.map((product, index) => (
            <Tooltip key={`${product.id}-${index}`}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm cursor-pointer hover:bg-primary-foreground/10 px-2 py-1 rounded transition-colors">
                  <span className="font-medium">{product.name}</span>
                  <span className="font-bold">
                    {product.price.toFixed(2)} TL/{product.unit}
                  </span>
                  {getPriceIcon(product.priceChange)}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-card border shadow-lg p-3 max-w-xs"
                sideOffset={8}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-foreground">{product.name}</p>
                      <p className="text-lg font-bold text-primary">
                        {product.price.toFixed(2)} TL
                        <span className="text-xs font-normal text-muted-foreground">/{product.unit}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{product.origin}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${getAvailabilityColor(product.availability)}`}>
                      <Package className="h-3 w-3" />
                      <span>{getAvailabilityText(product.availability)}</span>
                    </div>
                  </div>

                  {product.previousPrice && product.priceChange !== "stable" && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Onceki fiyat: </span>
                      <span className="line-through">{product.previousPrice.toFixed(2)} TL</span>
                      <span className={product.priceChange === "down" ? "text-fresh-down ml-1" : "text-fresh-up ml-1"}>
                        ({product.priceChange === "down" ? "-" : "+"}
                        {Math.abs(product.price - product.previousPrice).toFixed(2)} TL)
                      </span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
