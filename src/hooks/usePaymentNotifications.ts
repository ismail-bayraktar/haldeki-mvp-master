import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmailService } from "@/hooks/useEmailService";

export interface PaymentNotification {
  id: string;
  order_id: string;
  user_id: string;
  bank_name: string;
  account_holder: string;
  amount: number;
  transaction_date: string;
  receipt_url: string | null;
  notes: string | null;
  status: "pending" | "verified" | "rejected";
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface CreatePaymentNotificationInput {
  order_id: string;
  bank_name: string;
  account_holder: string;
  amount: number;
  transaction_date: string;
  receipt_url?: string | null;
  notes?: string | null;
}

// Sipariş bazlı bildirim getirme
export function usePaymentNotificationByOrder(orderId: string) {
  return useQuery({
    queryKey: ["payment-notification", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_notifications")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PaymentNotification | null;
    },
    enabled: !!orderId,
  });
}

// Bildirim oluşturma
export function useCreatePaymentNotification() {
  const queryClient = useQueryClient();
  const { data: userData } = supabase.auth.getUser();
  const { sendPaymentNotificationReceived } = useEmailService();

  return useMutation({
    mutationFn: async (input: CreatePaymentNotificationInput) => {
      const user = (await userData).data?.user;
      if (!user) throw new Error("Kullanıcı giriş yapmamış");

      const { data, error } = await supabase
        .from("payment_notifications")
        .insert({
          order_id: input.order_id,
          user_id: user.id,
          bank_name: input.bank_name,
          account_holder: input.account_holder,
          amount: input.amount,
          transaction_date: input.transaction_date,
          receipt_url: input.receipt_url || null,
          notes: input.notes || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as PaymentNotification;
    },
    onSuccess: async (data, input) => {
      queryClient.invalidateQueries({ queryKey: ["payment-notification", data.order_id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Ödeme bildirimi başarıyla gönderildi");

      // Email gönderimi (admin/bayi'ye)
      try {
        // Sipariş bilgilerini al
        const { data: orderData } = await supabase
          .from("orders")
          .select("dealer_id, user_id")
          .eq("id", input.order_id)
          .single();

        if (orderData) {
          // Müşteri bilgilerini al
          const { data: userData } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", orderData.user_id)
            .single();

          // Bayi bilgilerini al
          if (orderData.dealer_id) {
            const { data: dealerData } = await supabase
              .from("dealers")
              .select("contact_email")
              .eq("id", orderData.dealer_id)
              .single();

            if (dealerData?.contact_email && userData) {
              await sendPaymentNotificationReceived(
                dealerData.contact_email,
                input.order_id,
                userData.full_name || "Müşteri",
                input.bank_name,
                input.account_holder,
                input.amount,
                input.transaction_date
              );
            }
          } else {
            // Admin'e gönder (dealer yoksa)
            const { data: adminUsers } = await supabase
              .from("user_roles")
              .select("user_id")
              .in("role", ["admin", "superadmin"])
              .limit(1);

            if (adminUsers && adminUsers.length > 0 && userData) {
              const { data: adminProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", adminUsers[0].user_id)
                .single();

              if (adminProfile?.email) {
                await sendPaymentNotificationReceived(
                  adminProfile.email,
                  input.order_id,
                  userData.full_name || "Müşteri",
                  input.bank_name,
                  input.account_holder,
                  input.amount,
                  input.transaction_date
                );
              }
            }
          }
        }
      } catch (emailError) {
        console.error("[usePaymentNotifications] Email error:", emailError);
        // Email hatası bildirimi engellemez
      }
    },
    onError: (error) => {
      console.error("Create payment notification error:", error);
      toast.error("Bildirim gönderilirken hata oluştu");
    },
  });
}

// Bildirim doğrulama (admin/bayi)
export function useVerifyPaymentNotification() {
  const queryClient = useQueryClient();
  const { data: userData } = supabase.auth.getUser();
  const { sendPaymentNotificationVerified } = useEmailService();

  return useMutation({
    mutationFn: async ({
      notificationId,
      status,
    }: {
      notificationId: string;
      status: "verified" | "rejected";
    }) => {
      const user = (await userData).data?.user;
      if (!user) throw new Error("Kullanıcı giriş yapmamış");

      const { data, error } = await supabase
        .from("payment_notifications")
        .update({
          status,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq("id", notificationId)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentNotification;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["payment-notification", data.order_id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Bildirim ${data.status === "verified" ? "doğrulandı" : "reddedildi"}`);

      // Email gönderimi (sadece doğrulandıysa)
      if (data.status === "verified") {
        try {
          // Müşteri bilgilerini al
          const { data: userData } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", data.user_id)
            .single();

          if (userData?.email) {
            const verifiedAt = data.verified_at 
              ? new Date(data.verified_at).toLocaleDateString("tr-TR")
              : undefined;
            
            await sendPaymentNotificationVerified(
              userData.email,
              userData.full_name || "Değerli Müşterimiz",
              data.order_id,
              data.amount,
              verifiedAt
            );
          }
        } catch (emailError) {
          console.error("[usePaymentNotifications] Email error:", emailError);
          // Email hatası doğrulamayı engellemez
        }
      }
    },
    onError: (error) => {
      console.error("Verify payment notification error:", error);
      toast.error("Bildirim güncellenirken hata oluştu");
    },
  });
}

