import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DbProduct, ProductInsert } from "@/hooks/useProducts";
import { categories } from "@/data/categories";

const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalı"),
  slug: z.string().min(2, "Slug en az 2 karakter olmalı"),
  category_id: z.string().min(1, "Kategori seçiniz"),
  price: z.coerce.number().positive("Fiyat pozitif olmalı"),
  unit: z.enum(["kg", "adet", "demet", "paket"]),
  origin: z.string().min(2, "Menşei en az 2 karakter olmalı"),
  quality: z.enum(["premium", "standart", "ekonomik"]),
  availability: z.enum(["plenty", "limited", "last"]),
  is_bugun_halde: z.boolean(),
  price_change: z.enum(["up", "down", "stable"]),
  previous_price: z.coerce.number().nullable().optional(),
  images: z.string().min(1, "En az bir resim URL'i gerekli"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: DbProduct;
  onSubmit: (data: ProductInsert) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      category_id: product?.category_id ?? "",
      price: product?.price ?? 0,
      unit: product?.unit ?? "kg",
      origin: product?.origin ?? "",
      quality: product?.quality ?? "standart",
      availability: product?.availability ?? "plenty",
      is_bugun_halde: product?.is_bugun_halde ?? false,
      price_change: product?.price_change ?? "stable",
      previous_price: product?.previous_price ?? null,
      images: product?.images?.join(", ") ?? "",
      description: product?.description ?? "",
      is_active: product?.is_active ?? true,
    },
  });

  const handleSubmit = (values: ProductFormValues) => {
    const selectedCategory = categories.find((c) => c.id === values.category_id);
    
    const productData: ProductInsert = {
      name: values.name,
      slug: values.slug,
      category_id: values.category_id,
      category_name: selectedCategory?.name ?? "",
      price: values.price,
      unit: values.unit,
      origin: values.origin,
      quality: values.quality,
      availability: values.availability,
      is_bugun_halde: values.is_bugun_halde,
      price_change: values.price_change,
      previous_price: values.previous_price || null,
      images: values.images.split(",").map((url) => url.trim()).filter(Boolean),
      description: values.description || null,
      arrival_date: new Date().toISOString().split("T")[0],
      is_active: values.is_active,
      variants: product?.variants ?? null,
    };

    onSubmit(productData);
  };

  const generateSlug = () => {
    const name = form.getValues("name");
    const slug = name
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    form.setValue("slug", slug);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ürün Adı</FormLabel>
                <FormControl>
                  <Input {...field} onBlur={() => !form.getValues("slug") && generateSlug()} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug (URL)</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <Button type="button" variant="outline" size="sm" onClick={generateSlug}>
                    Oluştur
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fiyat (₺)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birim</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="adet">Adet</SelectItem>
                    <SelectItem value="demet">Demet</SelectItem>
                    <SelectItem value="paket">Paket</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Menşei</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Örn: Antalya" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kalite</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="standart">Standart</SelectItem>
                    <SelectItem value="ekonomik">Ekonomik</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stok Durumu</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="plenty">Bol</SelectItem>
                    <SelectItem value="limited">Sınırlı</SelectItem>
                    <SelectItem value="last">Son Stok</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price_change"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fiyat Değişimi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="stable">Sabit</SelectItem>
                    <SelectItem value="up">Yükseldi</SelectItem>
                    <SelectItem value="down">Düştü</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="previous_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Önceki Fiyat (₺)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resim URL'leri (virgülle ayırın)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Ürün açıklaması..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="is_bugun_halde"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Bugün Halde</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Aktif</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : product ? "Güncelle" : "Ekle"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
