import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle, User, Phone, Mail, Building2, Home, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { whitelistFormSchema, type WhitelistFormData } from "@/lib/whitelistValidators";
import { supabase } from "@/integrations/supabase/client";

export const WhitelistForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<WhitelistFormData>({
    resolver: zodResolver(whitelistFormSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      email: "",
      city: "",
      district: "",
      user_type: "B2C",
      notes: "",
      website: "", // Honeypot
    },
  });

  const user_type = watch("user_type");

  const onSubmit = async (data: WhitelistFormData) => {
    // Check honeypot - if filled, it's a bot
    if (data.website && data.website.length > 0) {
      console.warn("Bot detected via honeypot field");
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize phone number (remove spaces, dashes)
      const normalizedPhone = data.phone.replace(/[\s\-\(\)]/g, "");

      const { error } = await supabase.from("whitelist_applications").insert({
        full_name: data.full_name.trim(),
        phone: normalizedPhone,
        email: data.email?.trim() || null,
        city: data.city?.trim() || null,
        district: data.district?.trim() || null,
        user_type: data.user_type,
        notes: data.notes?.trim() || null,
      });

      if (error) {
        // Check for unique constraint violation (duplicate phone)
        if (error.code === "23505") {
          toast.error(
            "Bu telefon numarası zaten kayıtlı. Başka bir numara ile deneyin."
          );
        } else {
          toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
          console.error("Form submission error:", error);
        }
        return;
      }

      setIsSuccess(true);
      toast.success("Başvurunuz Alındı! Teşekkürler.");

      // Reset form after 3 seconds
      setTimeout(() => {
        reset();
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Beklenmeyen bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Başvurunuz Alındı!
        </h3>
        <p className="text-muted-foreground mb-6">
          Listeye eklendiniz. Ön bildirim size WhatsApp/iletilecek.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            reset();
            setIsSuccess(false);
          }}
        >
          Yeni Başvuru
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Ad Soyad <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full_name"
            placeholder="Adınız Soyadınız"
            {...register("full_name")}
            className={errors.full_name ? "border-destructive" : ""}
            disabled={isSubmitting}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Cep Telefonu <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="5XXXXXXXXX"
            {...register("phone")}
            className={errors.phone ? "border-destructive" : ""}
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Email (optional) */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          E-posta Adresi (opsiyonel)
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="ornek@email.com"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* User Type */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          Kullanıcı Tipi <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <Label
            htmlFor="user_type_B2C"
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all
              ${
                user_type === "B2C"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }
            `}
          >
            <input
              {...register("user_type")}
              type="radio"
              id="user_type_B2C"
              value="B2C"
              className="sr-only"
              disabled={isSubmitting}
            />
            <Home className="h-4 w-4" />
            <span className="font-medium">Bireysel</span>
          </Label>
          <Label
            htmlFor="user_type_B2B"
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all
              ${
                user_type === "B2B"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }
            `}
          >
            <input
              {...register("user_type")}
              type="radio"
              id="user_type_B2B"
              value="B2B"
              className="sr-only"
              disabled={isSubmitting}
            />
            <Building2 className="h-4 w-4" />
            <span className="font-medium">İşletme</span>
          </Label>
        </div>
        {errors.user_type && (
          <p className="text-xs text-destructive">{errors.user_type.message}</p>
        )}
      </div>

      {/* City & District (optional) */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Şehir (opsiyonel)</Label>
          <Input
            id="city"
            placeholder="İzmir"
            {...register("city")}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">İlçe (opsiyonel)</Label>
          <Input
            id="district"
            placeholder="Konak, Karşıyaka..."
            {...register("district")}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Notes (optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notlar (opsiyonel)
        </Label>
        <Textarea
          id="notes"
          placeholder="Eklemek istediğiniz bir şey var mı?"
          {...register("notes")}
          rows={3}
          className="resize-none"
          disabled={isSubmitting}
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Honeypot field - hidden from users, visible to bots */}
      <input
        {...register("website")}
        type="text"
        id="website"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="sr-only"
        aria-hidden="true"
      />

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Gönderiliyor..." : "Listeye Katıl"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Kişisel verileriniz 6698 sayılı KVKK kapsamında işlenmektedir.
      </p>
    </form>
  );
};
