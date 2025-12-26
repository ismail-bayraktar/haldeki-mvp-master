import { MapPin, Check, Clock, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRegion } from "@/contexts/RegionContext";
import { cn } from "@/lib/utils";
import { SelectedRegion } from "@/types";

/**
 * Kritik aksiyonlarda gösterilen zorunlu bölge seçim modal'ı
 * - ESC veya backdrop ile kapatılamaz
 * - X butonu yok
 * - Sadece bölge seçilince kapanır
 */
const RequireRegionModal = () => {
  const {
    isRegionModalOpen,
    regions,
    selectedRegion,
    setSelectedRegion,
    isLoading,
  } = useRegion();

  const activeRegions = regions.filter((r) => r.is_active);
  // Gelecekte: pasif bölgeler için waitlist gösterilecek
  // const comingSoonRegions = regions.filter((r) => !r.is_active);

  const handleSelectRegion = (region: SelectedRegion) => {
    setSelectedRegion(region);
  };

  return (
    <Dialog 
      open={isRegionModalOpen} 
      onOpenChange={() => {
        // Modal kapatmaya izin verme - sadece bölge seçilince kapanır
      }}
    >
      <DialogContent 
        className="sm:max-w-md max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // X butonunu gizle
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Teslimat Bölgesi Seçin
          </DialogTitle>
          <DialogDescription>
            Devam etmek için teslimat bölgenizi seçmeniz gerekiyor.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : activeRegions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Şu an aktif teslimat bölgesi bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-stock-plenty animate-pulse" />
              Aktif Bölgeler
            </p>
            <div className="grid gap-2">
              {activeRegions.map((region) => {
                const isSelected = selectedRegion?.id === region.id;

                return (
                  <Button
                    key={region.id}
                    variant="outline"
                    className={cn(
                      "justify-between h-auto py-3 px-4 text-left",
                      isSelected && "border-primary bg-primary/5"
                    )}
                    onClick={() =>
                      handleSelectRegion({
                        id: region.id,
                        name: region.name,
                        slug: region.slug,
                      })
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{region.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Min. sipariş: {region.min_order_amount}₺ •
                        {region.delivery_fee === 0
                          ? " Ücretsiz teslimat"
                          : ` Teslimat: ${region.delivery_fee}₺`}
                      </span>
                      {region.districts.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {region.districts.slice(0, 3).join(", ")}
                          {region.districts.length > 3 &&
                            ` +${region.districts.length - 3} mahalle`}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequireRegionModal;
