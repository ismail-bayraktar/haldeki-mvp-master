// Zod validation schemas for product forms
import { z } from 'zod';
import type { ProductVariationType } from '@/types/multiSupplier';

/**
 * Base product validation schema
 * Used across all product forms (supplier, admin)
 */
export const productBaseSchema = z.object({
  name: z.string().min(2, 'Ürün adı en az 2 karakter olmalı'),
  description: z.string().optional(),
  category: z.enum([
    'Sebze',
    'Meyve',
    'Yeşillik',
    'Kök Sebzeler',
    'Meyveli',
    'Türk Kahvesi',
    'Diğer',
  ], {
    errorMap: () => ({ message: 'Lütfen geçerli bir kategori seçin' })
  }),
  base_price: z.number({
    required_error: 'Fiyat zorunludur',
    invalid_type_error: 'Fiyat sayısal bir değer olmalı',
  }).positive('Fiyat 0\'dan büyük olmalı'),
  unit: z.enum(['kg', 'adet', 'demet', 'pak', 'litre', 'balya'], {
    errorMap: () => ({ message: 'Lütfen geçerli bir birim seçin' })
  }),
  stock: z.number({
    required_error: 'Stok miktarı zorunludur',
    invalid_type_error: 'Stok sayısal bir değer olmalı',
  }).int('Stok tam sayı olmalı').nonnegative('Stok 0 veya pozitif olmalı'),
  product_status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
});

/**
 * Product variation validation schema
 */
export const productVariationSchema = z.object({
  variation_type: z.enum([
    'size',
    'type',
    'scent',
    'packaging',
    'material',
    'flavor',
    'other'
  ] as const satisfies readonly ProductVariationType[]),
  variation_value: z.string().min(1, 'Varyasyon değeri boş olamaz'),
  display_order: z.number().int().nonnegative('Sıra 0 veya pozitif olmalı'),
  metadata: z.record(z.unknown()).nullable().optional(),
});

/**
 * Grouped variations validation schema
 */
export const productVariationsGroupedSchema = z.object({
  variation_type: z.enum([
    'size',
    'type',
    'scent',
    'packaging',
    'material',
    'flavor',
    'other'
  ] as const satisfies readonly ProductVariationType[]),
  values: z.array(z.object({
    value: z.string().min(1, 'Varyasyon değeri boş olamaz'),
    display_order: z.number().int().nonnegative(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })),
});

/**
 * Type exports
 */
export type ProductFormData = z.infer<typeof productBaseSchema>;
export type ProductVariationFormData = z.infer<typeof productVariationSchema>;
export type ProductVariationsGroupedFormData = z.infer<typeof productVariationsGroupedSchema>;
