import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Percent,
  Calculator,
  MapPin,
  Loader2,
  CheckCircle,
  Info,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePricingConfig,
  useRegionalMultipliers,
  useUpdateRegionalMultiplier,
  type PricingConfig,
} from "@/hooks/usePricingConfig";

const AdminPricing = () => {
  const {
    config,
    isLoading,
    updateConfig,
    isUpdating,
  } = usePricingConfig();

  const { data: regions, isLoading: isLoadingRegions } = useRegionalMultipliers();
  const updateMultiplier = useUpdateRegionalMultiplier();

  const [localConfig, setLocalConfig] = useState<Partial<PricingConfig>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    if (!config) return;

    try {
      await updateConfig({
        commission_b2b: localConfig.commission_b2b ?? config.commission_b2b,
        commission_b2c: localConfig.commission_b2c ?? config.commission_b2c,
        price_calculation_mode: localConfig.price_calculation_mode ?? config.price_calculation_mode,
        regional_pricing_mode: localConfig.regional_pricing_mode ?? config.regional_pricing_mode,
        round_to_nearest: localConfig.round_to_nearest ?? config.round_to_nearest,
      });
      setLocalConfig({});
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  const handleReset = () => {
    setLocalConfig({});
    setHasChanges(false);
  };

  const updateLocalValue = <K extends keyof PricingConfig>(
    key: K,
    value: PricingConfig[K]
  ) => {
    setLocalConfig((prev) => {
      const newValue = value;
      const hasChanged = newValue !== config?.[key];
      const newConfig = { ...prev, [key]: newValue };

      if (Object.keys(newConfig).every((k) => newConfig[k as K] === config?.[k as K])) {
        setHasChanges(false);
      } else {
        setHasChanges(true);
      }

      return newConfig;
    });
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;
  const parsePercent = (value: string) => parseFloat(value.replace("%", "")) / 100;

  const currentCommissionB2b = localConfig.commission_b2b ?? config?.commission_b2b ?? 0.3;
  const currentCommissionB2c = localConfig.commission_b2c ?? config?.commission_b2c ?? 0.5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fiyatlandırma Ayarları</h1>
          <p className="text-muted-foreground">
            Komisyon oranları ve fiyat hesaplama modüllerini yönetin
          </p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || isLoading}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="commissions" className="w-full">
        <TabsList>
          <TabsTrigger value="commissions" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Komisyon Oranları
          </TabsTrigger>
          <TabsTrigger value="calculation" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Hesaplama Modu
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Bölgesel Çarpanlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Komisyon Oranları
              </CardTitle>
              <CardDescription>
                B2B ve B2C müşteriler için platform komisyon oranları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* B2B Commission Rate */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">B2B Komisyon Oranı</Label>
                      <Badge variant="secondary" className="text-lg">
                        {formatPercent(currentCommissionB2b)}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <Slider
                        value={[currentCommissionB2b * 100]}
                        onValueChange={([value]) =>
                          updateLocalValue("commission_b2b", value / 100)
                        }
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={currentCommissionB2b}
                          onChange={(e) =>
                            updateLocalValue(
                              "commission_b2b",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">
                          (0.00 - 1.00 arası, örn: 0.30 = %30)
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium">B2B Komisyon Hesaplama</p>
                          <p>
                            Bayi ve işletme müşterileri için uygulanan komisyon oranı.
                            Bu oran, tedarikçi fiyatı üzerinden eklenerek son fiyat hesaplanır.
                          </p>
                          <div className="bg-blue-100 dark:bg-blue-900 rounded p-2 font-mono text-xs">
                            {config?.price_calculation_mode === "markup" ? (
                              <>
                                Fiyat = Tedarikçi Fiyatı / (1 - {formatPercent(currentCommissionB2b)})
                              </>
                            ) : (
                              <>
                                Fiyat = Tedarikçi Fiyatı * (1 + {formatPercent(currentCommissionB2b)})
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* B2C Commission Rate */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">B2C Komisyon Oranı</Label>
                      <Badge variant="secondary" className="text-lg">
                        {formatPercent(currentCommissionB2c)}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <Slider
                        value={[currentCommissionB2c * 100]}
                        onValueChange={([value]) =>
                          updateLocalValue("commission_b2c", value / 100)
                        }
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={currentCommissionB2c}
                          onChange={(e) =>
                            updateLocalValue(
                              "commission_b2c",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">
                          (0.00 - 1.00 arası, örn: 0.50 = %50)
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                          <p className="font-medium">B2C Komisyon Hesaplama</p>
                          <p>
                            Bireysel müşteriler için uygulanan komisyon oranı.
                            Bu oran, tedarikçi fiyatı üzerinden eklenerek son fiyat hesaplanır.
                          </p>
                          <div className="bg-blue-100 dark:bg-blue-900 rounded p-2 font-mono text-xs">
                            {config?.price_calculation_mode === "markup" ? (
                              <>
                                Fiyat = Tedarikçi Fiyatı / (1 - {formatPercent(currentCommissionB2c)})
                              </>
                            ) : (
                              <>
                                Fiyat = Tedarikçi Fiyatı * (1 + {formatPercent(currentCommissionB2c)})
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Example Calculation */}
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Örnek Hesaplama (100₺ Tedarikçi Fiyatı)
                        </p>
                        <div className="grid gap-2 text-green-800 dark:text-green-200">
                          <div className="flex justify-between">
                            <span>Tedarikçi Fiyatı:</span>
                            <span className="font-medium">100.00 ₺</span>
                          </div>
                          <div className="flex justify-between">
                            <span>B2B Fiyatı:</span>
                            <span className="font-medium">
                              {config?.price_calculation_mode === "markup" ? (
                                <> {(100 / (1 - currentCommissionB2b)).toFixed(2)} ₺</>
                              ) : (
                                <> {(100 * (1 + currentCommissionB2b)).toFixed(2)} ₺</>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>B2C Fiyatı:</span>
                            <span className="font-medium">
                              {config?.price_calculation_mode === "markup" ? (
                                <> {(100 / (1 - currentCommissionB2c)).toFixed(2)} ₺</>
                              ) : (
                                <> {(100 * (1 + currentCommissionB2c)).toFixed(2)} ₺</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Fiyat Hesaplama Modu
              </CardTitle>
              <CardDescription>
                Komisyonun fiyata nasıl ekleneceğini belirleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calculation-mode">Hesaplama Yöntemi</Label>
                <Select
                  value={localConfig.price_calculation_mode ?? config?.price_calculation_mode ?? "markup"}
                  onValueChange={(value: "markup" | "margin") =>
                    updateLocalValue("price_calculation_mode", value)
                  }
                >
                  <SelectTrigger id="calculation-mode">
                    <SelectValue placeholder="Hesaplama modu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markup">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <div>
                          <div className="font-medium">Markup (Kar Marjı)</div>
                          <div className="text-xs text-muted-foreground">
                            Fiyat = Maliyet / (1 - komisyon)
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="margin">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div>
                          <div className="font-medium">Margin (Kâr Payı)</div>
                          <div className="text-xs text-muted-foreground">
                            Fiyat = Maliyet * (1 + komisyon)
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regional-mode">Bölgesel Fiyatlandırma</Label>
                <Select
                  value={
                    localConfig.regional_pricing_mode ?? config?.regional_pricing_mode ?? "multiplier"
                  }
                  onValueChange={(value: "multiplier" | "fixed") =>
                    updateLocalValue("regional_pricing_mode", value)
                  }
                >
                  <SelectTrigger id="regional-mode">
                    <SelectValue placeholder="Bölgesel mod seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiplier">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <div>
                          <div className="font-medium">Çarpan (Multiplier)</div>
                          <div className="text-xs text-muted-foreground">
                            Bölgesel çarpan ile ayarlama
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <div>
                          <div className="font-medium">Sabit (Fixed)</div>
                          <div className="text-xs text-muted-foreground">
                            Legacy region_products.price kullanılır
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Hesaplama Modu Açıklaması</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Markup:</strong> Satış fiyatının içinde komisyon var.
                        Örn: %30 komisyon için 100₺ / (1 - 0.30) = 142.86₺
                      </li>
                      <li>
                        <strong>Margin:</strong> Maliyetin üzerine komisyon eklenir.
                        Örn: %30 komisyon için 100₺ * (1 + 0.30) = 130₺
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Bölgesel Fiyat Çarpanları
              </CardTitle>
              <CardDescription>
                Her bölge için fiyat çarpanını ayarlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRegions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {regions?.map((region) => (
                    <div
                      key={region.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Label className="text-base font-medium">{region.name}</Label>
                        <p className="text-sm text-muted-foreground">
                          Mevcut çarpan: {(region.price_multiplier || 1).toFixed(2)}x
                        </p>
                      </div>
                      <div className="flex items-center gap-4 w-64">
                        <Slider
                          value={[(region.price_multiplier || 1) * 100]}
                          onValueChange={([value]) => {
                            const multiplier = value / 100;
                            updateMultiplier.mutate({
                              regionId: region.id,
                              multiplier,
                            });
                          }}
                          min={50}
                          max={200}
                          step={1}
                          disabled={updateMultiplier.isPending}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-16 text-right">
                          {((region.price_multiplier || 1) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium">Bölgesel Çarpan Açıklaması</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>1.00 = Baz fiyat (değişiklik yok)</li>
                          <li>1.10 = %10 artış</li>
                          <li>0.90 = %10 azalış</li>
                        </ul>
                        <p className="text-xs mt-2">
                          Çarpanlar tüm ürünlerde eşit olarak uygulanır.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPricing;
