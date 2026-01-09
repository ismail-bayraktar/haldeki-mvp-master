import { z } from "zod";

// Turkish whitelist form validation schema
export const whitelistFormSchema = z.object({
  full_name: z
    .string()
    .min(2, "Ad en az 2 karakter olmalı")
    .max(100, "Ad çok uzun"),
  phone: z
    .string()
    .min(10, "Telefon numarası geçersiz")
    .regex(/^5\d{9}$/, "Geçerli bir Türk telefon numarası girin (5XXXXXXXXX)"),
  email: z
    .string()
    .email("Geçerli bir e-posta adresi girin")
    .or(z.literal(""))
    .optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  user_type: z.enum(["B2B", "B2C"], {
    required_error: "Kullanıcı tipi seçiniz",
  }),
  notes: z.string().max(500, "Notlar 500 karakteri geçemez").optional(),
  // Honeypot field - should always be empty
  website: z.string().max(0, "Bot algılandı"),
});

export type WhitelistFormData = z.infer<typeof whitelistFormSchema>;
