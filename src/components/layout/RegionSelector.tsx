import { useState } from "react";
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
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { RegionWaitlist } from "@/components/home";
import { RegionChangeConfirmModal } from "@/components/region";
import { SelectedRegion } from "@/types";

interface RegionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Header'dan açılan bölge seçici modal
 * - Kapatılabilir (X butonu var, backdrop ile kapanır)
 * - DB'den bölgeleri çeker
 * - Aktif olmayan bölgeler için waitlist gösterir
 * - 2A.3: Sepet doluyken bölge değişikliği için validation + confirm modal
 */
const RegionSelector = ({ isOpen, onClose }: RegionSelectorProps) => {
  const [waitlistRegion, setWaitlistRegion] = useState<string | null>(null);
  const {
    regions,
    selectedRegion,
    isLoading,
    // 2A.3 flow
    pendingRegion,
    showChangeConfirmModal,
    cartValidationResult,
    initiateRegionChange,
    confirmRegionChange,
    cancelRegionChange,
    getSelectedRegionDetails,
  } = useRegion();
  
  const { items, validateForRegion, applyRegionChange } = useCart();

  const activeRegions = regions.filter((r) => r.is_active);
  // Gelecekte: DB'den pasif bölgeler de gelecek
  // const comingSoonRegions = regions.filter((r) => !r.is_active);

  // Şimdilik statik "yakında" bölgeleri
  const comingSoonRegions = [
    { id: "static-1", name: "İzmir - Karşıyaka" },
    { id: "static-2", name: "İzmir - Bornova" },
    { id: "static-3", name: "İstanbul" },
    { id: "static-4", name: "Ankara" },
  ];

  const handleNotifyMe = (regionName: string) => {
    setWaitlistRegion(regionName);
  };

  const handleSelectRegion = async (region: SelectedRegion) => {
    // 2A.3: initiateRegionChange akışını başlat
    await initiateRegionChange(region, validateForRegion, items.length > 0);
    // Modal kapatılacak (direkt değişiklik veya confirm modal açılacak)
    if (!showChangeConfirmModal) {
      onClose();
    }
  };

  // 2A.3: Confirm modal onay
  const handleConfirmChange = () => {
    confirmRegionChange(applyRegionChange);
    onClose();
  };

  // 2A.3: Confirm modal iptal
  const handleCancelChange = () => {
    cancelRegionChange();
  };

  // pendingRegion için DbRegion detaylarını bul
  const pendingRegionDetails = pendingRegion
    ? regions.find((r) => r.id === pendingRegion.id) ?? null
    : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              Teslimat Bölgesi Seçin
            </DialogTitle>
            <DialogDescription>
              Taze ürünlerimizi hangi bölgeye teslim edelim?
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
          ) : (
            <>
              {/* Active Regions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-stock-plenty animate-pulse" />
                  Aktif Bölgeler
                </p>
                <div className="grid gap-2">
                  {activeRegions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Şu an aktif bölge bulunmuyor.
                    </p>
                  ) : (
                    activeRegions.map((region) => {
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
                    })
                  )}
                </div>
              </div>

              {/* Coming Soon Regions */}
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Yakında Açılacak Bölgeler
                </p>
                <div className="grid gap-2">
                  {comingSoonRegions.map((region) => (
                    <div
                      key={region.id}
                      className="flex items-center justify-between h-auto py-3 px-4 rounded-md border border-dashed border-border bg-muted/30"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-muted-foreground">
                          {region.name}
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          Çok yakında hizmetinizdeyiz
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => handleNotifyMe(region.name)}
                      >
                        <Bell className="h-3.5 w-3.5" />
                        Haber Ver
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Bölgeniz listede yok mu?{" "}
            <a href="/iletisim" className="text-primary hover:underline">
              Bize bildirin
            </a>
          </p>
        </DialogContent>
      </Dialog>

      {/* 2A.3: Bölge değişikliği onay modali */}
      <RegionChangeConfirmModal
        isOpen={showChangeConfirmModal}
        onClose={handleCancelChange}
        onConfirm={handleConfirmChange}
        newRegion={pendingRegionDetails}
        validationResult={cartValidationResult}
      />

      {waitlistRegion && (
        <RegionWaitlist
          regionName={waitlistRegion}
          isOpen={!!waitlistRegion}
          onClose={() => setWaitlistRegion(null)}
        />
      )}
    </>
  );
};

export default RegionSelector;
