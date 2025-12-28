import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validatePassword } from "@/utils/passwordUtils";

export const usePasswordChange = () => {
  const [isChanging, setIsChanging] = useState(false);

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validation
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      setIsChanging(true);

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Password update error:", updateError);
        return {
          success: false,
          error: updateError.message,
        };
      }

      // Update user metadata to clear must_change_password flag
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            must_change_password: false,
          },
        });

        if (metadataError) {
          console.warn("Metadata update error (non-critical):", metadataError);
          // Continue even if metadata update fails
        }
      }

      toast.success("Şifre başarıyla değiştirildi");
      return { success: true };
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsChanging(false);
    }
  };

  return {
    changePassword,
    isChanging,
  };
};

