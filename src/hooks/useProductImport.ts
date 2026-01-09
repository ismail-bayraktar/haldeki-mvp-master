/**
 * Product Import Hook
 * Phase 10.2 - Import Logic
 *
 * Handles product import operations with validation and error tracking
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/utils';
import { parseExcelFile } from '@/lib/excelParser';
import { parseCSVFile } from '@/lib/csvParser';
import { validateProductRows, normalizeProductRow } from '@/lib/productValidator';
import type {
  ProductImportRow,
  ImportError,
  ImportResult,
  ProductImportVariation,
} from '@/types/supplier';
import type { ProductVariationType } from '@/types/multiSupplier';

/**
 * Helper: Insert product variations into database
 *
 * Creates product_variations records for a product
 * Links to supplier_product_variations table
 */
async function insertProductVariations(
  productId: string,
  variations: ProductImportVariation[],
  errors: ImportError[],
  batchIndex: number
): Promise<void> {
  for (const variation of variations) {
    try {
      // Check if variation already exists for this product
      const { data: existing } = await supabase
        .from('product_variations')
        .select('id')
        .eq('product_id', productId)
        .eq('variation_type', variation.type)
        .eq('variation_value', variation.value)
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Variation exists, skip
        continue;
      }

      // Insert new variation
      const { error: varError } = await supabase
        .from('product_variations')
        .insert({
          product_id: productId,
          variation_type: variation.type,
          variation_value: variation.value,
          display_order: variation.display_order,
          metadata: variation.metadata || null,
        });

      if (varError) {
        errors.push({
          row: batchIndex + 2,
          field: 'variation',
          error: `Varyasyon hatası (${variation.type}): ${varError.message}`,
          value: variation.value,
        });
      }
    } catch (error) {
      errors.push({
        row: batchIndex + 2,
        field: 'variation',
        error: `Varyasyon hatası (${variation.type}): ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        value: variation.value,
      });
    }
  }
}

/**
 * Hook: Import products from Excel or CSV file
 */
export function useProductImport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Step 1: Parse file based on extension
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      let parseResult;

      if (extension === '.csv') {
        parseResult = await parseCSVFile(file);
      } else {
        parseResult = await parseExcelFile(file);
      }

      if (!parseResult.success) {
        throw new Error(parseResult.errors[0]?.error || 'Dosya okunamadı');
      }

      // Step 2: Validate rows
      const validationResult = validateProductRows(parseResult.rows);

      if (validationResult.errors.length > 0) {
        return {
          success: false,
          importId: '',
          totalRows: parseResult.totalRows,
          successfulRows: 0,
          failedRows: validationResult.errors.length,
          created: 0,
          updated: 0,
          errors: validationResult.errors,
        };
      }

      // Step 3: Create import record
      const { data: importRecord, error: importError } = await supabase
        .from('product_imports')
        .insert({
          supplier_id: user.id,
          file_name: file.name,
          file_size: file.size,
          total_rows: parseResult.rows.length,
          status: 'processing',
        })
        .select()
        .single();

      if (importError) {
        throw new Error('İçe aktarma kaydı oluşturulamadı: ' + importError.message);
      }

      const importId = importRecord.id;
      const createdProductIds: string[] = [];

      try {
        // Step 4: Process rows in batches (chunked processing)
        const BATCH_SIZE = 50;
        let createdCount = 0;
        let updatedCount = 0;
        const allErrors: ImportError[] = [];

        for (let i = 0; i < parseResult.rows.length; i += BATCH_SIZE) {
          const batch = parseResult.rows.slice(i, i + BATCH_SIZE);

          // Process each row in batch
          for (const row of batch) {
            try {
              const normalizedRow = normalizeProductRow(row);

              // Generate slug for product
              const slug = generateSlug(`${normalizedRow.name}-${Date.now()}`);

              // Check if product already exists (by name + supplier)
              const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('name', normalizedRow.name)
                .eq('supplier_id', user.id)
                .limit(1)
                .single();

              if (existing) {
                // Update existing product
                const { error: updateError } = await supabase
                  .from('products')
                  .update({
                    name: normalizedRow.name,
                    base_price: normalizedRow.basePrice,
                    price: normalizedRow.price,
                    stock: normalizedRow.stock,
                    description: normalizedRow.description,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existing.id);

                if (updateError) {
                  allErrors.push({
                    row: i + 2,
                    field: 'update',
                    error: updateError.message,
                    value: normalizedRow.name,
                  });
                } else {
                  updatedCount++;
                }
              } else {
                // Insert new product
                const { data: newProduct, error: insertError } = await supabase
                  .from('products')
                  .insert({
                    supplier_id: user.id,
                    name: normalizedRow.name,
                    slug: slug,
                    category: normalizedRow.category,
                    category_name: normalizedRow.category.charAt(0).toUpperCase() + normalizedRow.category.slice(1),
                    base_price: normalizedRow.basePrice,
                    price: normalizedRow.price,
                    unit: normalizedRow.unit as any,
                    stock: normalizedRow.stock,
                    origin: normalizedRow.origin,
                    quality: normalizedRow.quality as any,
                    availability: normalizedRow.availability as any,
                    description: normalizedRow.description,
                    images: normalizedRow.images,
                    is_active: true,
                  })
                  .select('id')
                  .single();

                if (insertError) {
                  allErrors.push({
                    row: i + 2,
                    field: 'insert',
                    error: insertError.message,
                    value: normalizedRow.name,
                  });
                } else {
                  createdCount++;
                  createdProductIds.push(newProduct.id);

                  // Handle variations if present (Phase 12)
                  if (row.variations && row.variations.length > 0) {
                    await insertProductVariations(newProduct.id, row.variations, allErrors, i);
                  }
                }
              }
            } catch (error) {
              allErrors.push({
                row: i + 2,
                field: 'process',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                value: row.name,
              });
            }
          }
        }

        // Step 5: Update import record with results
        const finalStatus = allErrors.length === 0 ? 'completed' : 'completed';

        await supabase
          .from('product_imports')
          .update({
            successful_rows: createdCount + updatedCount,
            failed_rows: allErrors.length,
            errors: allErrors,
            status: finalStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('id', importId);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['supplier-products'] });

        return {
          success: allErrors.length === 0,
          importId,
          totalRows: parseResult.rows.length,
          successfulRows: createdCount + updatedCount,
          failedRows: allErrors.length,
          created: createdCount,
          updated: updatedCount,
          errors: allErrors,
        };
      } catch (error) {
        // Rollback: Delete all products created in this import
        if (createdProductIds.length > 0) {
          await supabase
            .from('products')
            .delete()
            .in('id', createdProductIds);
        }

        // Mark import as rolled back
        await supabase
          .from('product_imports')
          .update({
            status: 'rolled_back',
            completed_at: new Date().toISOString(),
          })
          .eq('id', importId);

        throw error;
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          `${result.created} ürün eklendi, ${result.updated} ürün güncellendi`
        );
      } else if (result.successfulRows > 0) {
        toast.warning(
          `${result.successfulRows} ürün işlendi, ${result.failedRows} başarısız`
        );
      } else {
        toast.error('İçe aktarma başarısız oldu');
      }
    },
    onError: (error: Error) => {
      toast.error('İçe aktarma hatası: ' + error.message);
    },
  });
}

/**
 * Hook: Get import history for current supplier
 */
export function useImportHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['import-history', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get supplier ID from user
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplier) {
        return [];
      }

      const { data, error } = await supabase
        .from('product_imports')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data;
    },
    enabled: !!user?.id,
  });
}
