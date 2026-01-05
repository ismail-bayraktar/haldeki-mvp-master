/**
 * Product Export Hook
 * Phase 10.2 - Export Logic
 *
 * Handles exporting products to Excel or CSV format
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import type { ExportOptions, SupplierProduct } from '@/types/supplier';

/**
 * Turkish to English mapping for export headers
 */
const EXPORT_HEADERS = {
  'Ürün Adı': 'name',
  'Kategori': 'category',
  'Birim': 'unit',
  'Taban Fiyat': 'basePrice',
  'Satış Fiyatı': 'price',
  'Stok': 'stock',
  'Köken': 'origin',
  'Kalite': 'quality',
  'Durum': 'availability',
  'Açıklama': 'description',
  'Görsel URLleri': 'images',
};

/**
 * Convert product to export row
 */
function productToExportRow(product: SupplierProduct): Record<string, any> {
  return {
    'Ürün Adı': product.name,
    'Kategori': product.category,
    'Birim': product.unit,
    'Taban Fiyat': product.base_price,
    'Satış Fiyatı': product.base_price, // Using base_price since price varies by region
    'Stok': product.stock,
    'Köken': 'Türkiye',
    'Kalite': 'standart',
    'Durum': product.product_status === 'active' ? 'bol' : 'limited',
    'Açıklama': product.description || '',
    'Görsel URLleri': product.images?.join(', ') || '',
  };
}

/**
 * Hook: Export products to Excel
 */
export function useExportProducts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['export-products', user?.id],
    queryFn: async (options: ExportOptions = { format: 'xlsx', filter: 'all' }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Build query
      let query = supabase
        .from('products')
        .select('*')
        .eq('supplier_id', user.id);

      // Apply filter
      if (options.filter === 'active') {
        query = query.eq('is_active', true);
      } else if (options.filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Apply selected IDs
      if (options.selectedIds && options.selectedIds.length > 0) {
        query = query.in('id', options.selectedIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },
    enabled: false, // Don't fetch automatically
  });
}

/**
 * Export products to Excel file
 */
export async function exportToExcel(
  products: SupplierProduct[],
  fileName: string = 'haldeki-urunler'
): Promise<void> {
  // Convert products to export rows
  const exportRows = products.map(productToExportRow);

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Ürün Adı
    { wch: 15 }, // Kategori
    { wch: 10 }, // Birim
    { wch: 15 }, // Taban Fiyat
    { wch: 15 }, // Satış Fiyatı
    { wch: 10 }, // Stok
    { wch: 15 }, // Köken
    { wch: 12 }, // Kalite
    { wch: 12 }, // Durum
    { wch: 40 }, // Açıklama
    { wch: 50 }, // Görsel URLleri
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');

  // Generate file
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Download
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export products to CSV file
 */
export async function exportToCSV(
  products: SupplierProduct[],
  fileName: string = 'haldeki-urunler'
): Promise<void> {
  // Convert products to export rows
  const exportRows = products.map(productToExportRow);

  // Generate CSV
  const csv = Papa.unparse(exportRows, {
    delimiter: ',',
    header: true,
  });

  // Create blob with BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export products (format detector)
 */
export async function exportProducts(
  products: SupplierProduct[],
  options: ExportOptions = { format: 'xlsx' }
): Promise<void> {
  const fileName = 'haldeki-urunler';

  if (options.format === 'csv') {
    await exportToCSV(products, fileName);
  } else {
    await exportToExcel(products, fileName);
  }
}
