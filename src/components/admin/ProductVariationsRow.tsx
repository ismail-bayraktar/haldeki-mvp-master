"use client";

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

type ProductVariation = Tables<"product_variations">;

interface ProductVariationsRowProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onToggle: () => void;
}

interface VariationEdit {
  variation_value: string;
  display_order: number;
}

export function ProductVariationsRow({
  productId,
  productName,
  isOpen,
  onToggle,
}: ProductVariationsRowProps) {
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newVariation, setNewVariation] = useState("");
  const [editValue, setEditValue] = useState("");

  const loadVariations = async () => {
    if (!isOpen && variations.length === 0) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("product_variations")
          .select("*")
          .eq("product_id", productId)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setVariations(data || []);
      } catch (error) {
        toast.error("Varyasyonlar yüklenirken hata oluştu");
      } finally {
        setIsLoading(false);
      }
    }
    onToggle();
  };

  const handleAddVariation = async () => {
    if (!newVariation.trim()) {
      toast.error("Varyasyon değeri boş olamaz");
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from("product_variations")
        .insert({
          product_id: productId,
          variation_type: "size",
          variation_value: newVariation.trim(),
          display_order: variations.length,
        })
        .select()
        .single();

      if (error) throw error;

      setVariations([...variations, data]);
      setNewVariation("");
      toast.success("Varyasyon eklendi");
    } catch (error) {
      toast.error("Varyasyon eklenirken hata oluştu");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteVariation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("product_variations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setVariations(variations.filter((v) => v.id !== id));
      toast.success("Varyasyon silindi");
    } catch (error) {
      toast.error("Varyasyon silinirken hata oluştu");
    }
  };

  const handleStartEdit = (variation: ProductVariation) => {
    setEditingId(variation.id);
    setEditValue(variation.variation_value);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) {
      toast.error("Varyasyon değeri boş olamaz");
      return;
    }

    try {
      const { error } = await supabase
        .from("product_variations")
        .update({ variation_value: editValue.trim() })
        .eq("id", id);

      if (error) throw error;

      setVariations(
        variations.map((v) =>
          v.id === id ? { ...v, variation_value: editValue.trim() } : v
        )
      );
      setEditingId(null);
      toast.success("Varyasyon güncellendi");
    } catch (error) {
      toast.error("Varyasyon güncellenirken hata oluştu");
    }
  };

  const getVariationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      size: "Beden",
      type: "Tip",
      scent: "Koku",
      packaging: "Paketleme",
      material: "Materyal",
      flavor: "Aroma",
      other: "Diğer",
    };
    return labels[type] || type;
  };

  return (
    <>
      <tr
        className="hover:bg-muted/50 cursor-pointer bg-muted/30"
        onClick={loadVariations}
      >
        <td colSpan={9} className="p-0">
          <div className="flex items-center gap-2 px-4 py-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadVariations();
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span>Varyasyonlar ({variations.length})</span>
            </button>
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr>
          <td colSpan={9} className="p-0">
            <div className="border-t border-b bg-muted/20">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sm">
                    {productName} - Varyasyonlar
                  </h4>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Yeni varyasyon (örn: 1 KG, 5 KG)"
                      value={newVariation}
                      onChange={(e) => setNewVariation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddVariation()}
                      className="h-8 w-64 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddVariation}
                      disabled={isAdding || !newVariation.trim()}
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Ekle
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Yükleniyor...
                  </div>
                ) : variations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Henüz varyasyon eklenmemiş
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variations.map((variation) => (
                      <div
                        key={variation.id}
                        className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                      >
                        {editingId === variation.id ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(variation.id);
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className="h-8 flex-1 max-w-xs"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(variation.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {getVariationTypeLabel(variation.variation_type)}
                            </Badge>
                            <span className="flex-1 font-medium">
                              {variation.variation_value}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(variation)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteVariation(variation.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
