import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { DbRegion, SelectedRegion, CartValidationResult } from "@/types";
import { useRegions } from "@/hooks/useRegions";

const STORAGE_KEY = "haldeki:selectedRegion";

interface RegionContextType {
  // State
  selectedRegion: SelectedRegion | null;
  regions: DbRegion[];
  isLoading: boolean;
  isError: boolean;
  isRegionModalOpen: boolean;

  // Actions
  setSelectedRegion: (region: SelectedRegion | null) => void;
  clearSelectedRegion: () => void;
  openRegionModal: () => void;
  closeRegionModal: () => void;

  // Utility
  requireRegion: (callback?: () => void) => boolean;
  getSelectedRegionDetails: () => DbRegion | null;

  // 2A.3: Bölge değişikliği flow
  pendingRegion: SelectedRegion | null;
  showChangeConfirmModal: boolean;
  cartValidationResult: CartValidationResult | null;
  initiateRegionChange: (
    newRegion: SelectedRegion,
    validateFn: (regionId: string) => Promise<CartValidationResult>,
    cartHasItems: boolean
  ) => void;
  confirmRegionChange: (
    applyFn: (regionId: string, result: CartValidationResult) => void
  ) => void;
  cancelRegionChange: () => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRegion, setSelectedRegionState] = useState<SelectedRegion | null>(null);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // 2A.3: Bölge değişikliği için state
  const [pendingRegion, setPendingRegion] = useState<SelectedRegion | null>(null);
  const [showChangeConfirmModal, setShowChangeConfirmModal] = useState(false);
  const [cartValidationResult, setCartValidationResult] = useState<CartValidationResult | null>(null);

  // DB'den aktif bölgeleri çek
  const { data: regions = [], isLoading, isError } = useRegions();

  // Sayfa yüklendiğinde localStorage'dan oku (optimistic hydration)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SelectedRegion;
        setSelectedRegionState(parsed);
      }
    } catch (e) {
      console.error("Error reading region from localStorage:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsHydrated(true);
  }, []);

  // DB'den regions geldiğinde, seçili bölgenin hala aktif olup olmadığını kontrol et
  useEffect(() => {
    if (!isHydrated || isLoading || regions.length === 0) return;

    if (selectedRegion) {
      const isStillActive = regions.some(
        (r) => r.id === selectedRegion.id && r.is_active
      );

      if (!isStillActive) {
        // Bölge artık aktif değil, temizle ve modal aç
        console.warn("Selected region is no longer active, clearing...");
        clearSelectedRegion();
        setIsRegionModalOpen(true);
      }
    }
  }, [isHydrated, isLoading, regions, selectedRegion]);

  // Seçili bölgeyi güncelle ve localStorage'a kaydet
  const setSelectedRegion = useCallback((region: SelectedRegion | null) => {
    setSelectedRegionState(region);

    if (region) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(region));
      } catch (e) {
        console.error("Error saving region to localStorage:", e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    // Modal açıksa kapat
    setIsRegionModalOpen(false);

    // Pending callback varsa çalıştır
    if (region && pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  const clearSelectedRegion = useCallback(() => {
    setSelectedRegionState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const openRegionModal = useCallback(() => {
    setIsRegionModalOpen(true);
  }, []);

  const closeRegionModal = useCallback(() => {
    setIsRegionModalOpen(false);
    setPendingCallback(null);
  }, []);

  // Kritik aksiyonlar için bölge kontrolü
  // Bölge seçili değilse modal açar ve false döner
  // Bölge seçiliyse callback'i hemen çalıştırır ve true döner
  const requireRegion = useCallback(
    (callback?: () => void): boolean => {
      if (selectedRegion) {
        callback?.();
        return true;
      }

      // Callback'i sakla, bölge seçilince çalıştırılacak
      if (callback) {
        setPendingCallback(() => callback);
      }

      setIsRegionModalOpen(true);
      return false;
    },
    [selectedRegion]
  );

  // Seçili bölgenin tam detaylarını getir
  const getSelectedRegionDetails = useCallback((): DbRegion | null => {
    if (!selectedRegion) return null;
    return regions.find((r) => r.id === selectedRegion.id) || null;
  }, [selectedRegion, regions]);

  // 2A.3: Bölge değişikliği başlat
  const initiateRegionChange = useCallback(
    async (
      newRegion: SelectedRegion,
      validateFn: (regionId: string) => Promise<CartValidationResult>,
      cartHasItems: boolean
    ) => {
      // Aynı bölgeyi seçiyorsa bir şey yapma
      if (selectedRegion?.id === newRegion.id) {
        setIsRegionModalOpen(false);
        return;
      }

      // Sepet boşsa direkt değiştir
      if (!cartHasItems) {
        setSelectedRegion(newRegion);
        return;
      }

      // Sepet doluysa validation yap
      setPendingRegion(newRegion);
      
      try {
        const result = await validateFn(newRegion.id);
        
        // Değişiklik yoksa direkt değiştir
        if (!result.hasChanges) {
          setSelectedRegion(newRegion);
          setPendingRegion(null);
          return;
        }

        // Değişiklik varsa modal göster
        setCartValidationResult(result);
        setShowChangeConfirmModal(true);
      } catch (error) {
        console.error("Region change validation error:", error);
        setPendingRegion(null);
      }
    },
    [selectedRegion, setSelectedRegion]
  );

  // 2A.3: Bölge değişikliğini onayla
  const confirmRegionChange = useCallback(
    (applyFn: (regionId: string, result: CartValidationResult) => void) => {
      if (!pendingRegion || !cartValidationResult) return;

      // Sepet değişikliklerini uygula
      applyFn(pendingRegion.id, cartValidationResult);
      
      // Bölgeyi değiştir
      setSelectedRegion(pendingRegion);

      // State temizle
      setPendingRegion(null);
      setCartValidationResult(null);
      setShowChangeConfirmModal(false);
    },
    [pendingRegion, cartValidationResult, setSelectedRegion]
  );

  // 2A.3: Bölge değişikliğini iptal et
  const cancelRegionChange = useCallback(() => {
    setPendingRegion(null);
    setCartValidationResult(null);
    setShowChangeConfirmModal(false);
  }, []);

  return (
    <RegionContext.Provider
      value={{
        selectedRegion,
        regions,
        isLoading,
        isError,
        isRegionModalOpen,
        setSelectedRegion,
        clearSelectedRegion,
        openRegionModal,
        closeRegionModal,
        requireRegion,
        getSelectedRegionDetails,
        // 2A.3
        pendingRegion,
        showChangeConfirmModal,
        cartValidationResult,
        initiateRegionChange,
        confirmRegionChange,
        cancelRegionChange,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
};
