import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface BankAccount {
  bank_name: string;
  account_holder: string;
  iban: string;
  branch?: string;
}

export interface PaymentSettings {
  eft_enabled: boolean;
  cash_on_delivery_enabled: boolean;
}

// Sistem ayarı getirme
export function useSystemSetting<T = Json>(key: string) {
  return useQuery({
    queryKey: ["system-setting", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", key)
        .single();

      if (error) throw error;
      return (data?.value as T) || null;
    },
  });
}

// Sistem ayarı güncelleme
export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  const { data: userData } = supabase.auth.getUser();

  return useMutation({
    mutationFn: async ({
      key,
      value,
      description,
    }: {
      key: string;
      value: Json;
      description?: string;
    }) => {
      const user = (await userData).data?.user;
      
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key,
          value,
          description,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["system-setting", variables.key] });
      toast.success("Ayar güncellendi");
    },
    onError: (error) => {
      console.error("Update system setting error:", error);
      toast.error("Ayar güncellenirken hata oluştu");
    },
  });
}

// Banka hesap bilgileri getirme (helper)
export function useBankAccount() {
  return useSystemSetting<BankAccount>("bank_account");
}

// Ödeme ayarları getirme (helper)
export function usePaymentSettings() {
  return useSystemSetting<PaymentSettings>("payment_settings");
}

// Banka hesap bilgileri güncelleme (helper)
export function useUpdateBankAccount() {
  const updateSetting = useUpdateSystemSetting();

  return {
    mutate: (bankAccount: BankAccount) => {
      return updateSetting.mutate({
        key: "bank_account",
        value: bankAccount as Json,
        description: "EFT/Havale için banka hesap bilgileri",
      });
    },
    ...updateSetting,
  };
}

// Ödeme ayarları güncelleme (helper)
export function useUpdatePaymentSettings() {
  const updateSetting = useUpdateSystemSetting();

  return {
    mutate: (settings: PaymentSettings) => {
      return updateSetting.mutate({
        key: "payment_settings",
        value: settings as Json,
        description: "Ödeme yöntemi ayarları",
      });
    },
    ...updateSetting,
  };
}

