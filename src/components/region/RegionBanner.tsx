import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegion } from "@/contexts/RegionContext";

interface RegionBannerProps {
  className?: string;
}

/**
 * Bölge seçilmediğinde ürün listesi üstünde gösterilen soft banner.
 * Kullanıcıyı bölge seçmeye yönlendirir ama sayfayı bloklamaz.
 */
const RegionBanner = ({ className }: RegionBannerProps) => {
  const { selectedRegion, openRegionModal } = useRegion();

  // Bölge seçiliyse banner gösterme
  if (selectedRegion) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 ${className}`}
    >
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            Bölgenizi seçerek size özel fiyatları görün
          </p>
          <p className="text-sm text-muted-foreground">
            Fiyatlar ve stok durumu bölgeye göre değişir
          </p>
        </div>
      </div>
      <Button onClick={openRegionModal} className="shrink-0">
        Bölge Seç
      </Button>
    </div>
  );
};

export default RegionBanner;
