/**
 * Excel Template Generator for Product Import
 * Phase 10.1 - Excel Template
 *
 * This script generates a standardized Excel template for suppliers to import products.
 */

import * as XLSX from 'xlsx';

// Turkish category list from the system
const CATEGORIES = [
  'sebzeler',
  'meyveler',
  'yesillikler',
  'kokulu-bitkiler',
  'bakliyatlar',
  'zeytinyagli',
  'sut-urunleri',
  'yumurta',
  'et-urunleri',
  'balik-urunleri',
  'diger',
];

// Product units enum
const UNITS = ['kg', 'adet', 'demet', 'paket'];

// Quality grades enum
const QUALITY = ['premium', 'standart', 'ekonomik'];

// Availability status enum
const AVAILABILITY = ['bol', 'limited', 'son'];

/**
 * Column definitions for the Excel template
 */
const COLUMNS = [
  { header: 'Ürün Adı', width: 30, required: true, example: 'Domates' },
  { header: 'Kategori', width: 15, required: true, example: 'sebzeler', validation: CATEGORIES },
  { header: 'Birim', width: 10, required: true, example: 'kg', validation: UNITS },
  { header: 'Taban Fiyat', width: 15, required: true, example: 25.50 },
  { header: 'Satış Fiyatı', width: 15, required: true, example: 30.00 },
  { header: 'Stok', width: 10, required: false, example: 100 },
  { header: 'Köken', width: 15, required: false, example: 'Türkiye' },
  { header: 'Kalite', width: 12, required: false, example: 'standart', validation: QUALITY },
  { header: 'Durum', width: 12, required: false, example: 'bol', validation: AVAILABILITY },
  { header: 'Açıklama', width: 40, required: false, example: 'Taze ve lezzetli' },
  { header: 'Görsel URLleri', width: 50, required: false, example: 'https://example.com/image1.jpg, https://example.com/image2.jpg' },
];

/**
 * Sheet 1: Instructions
 */
const createInstructionsSheet = () => {
  const instructions = [
    ['HALDEKİ MARKET - ÜRÜN İÇE/DIŞA AKTARIM ŞABLONU'],
    [''],
    ['NASIL KULLANILIR?'],
    ['1. Bu şablonu indirin'],
    ['2. "Ürünler" sayfasına ürün bilgilerini girin'],
    ['3. Zorunlu alanları (*) doldurun'],
    ['4. Dosyayı kaydedin'],
    ['5. Tedarikçi panelinden "İçe Aktar" butonuna tıklayın'],
    ['6. Bu dosyayı yükleyin'],
    [''],
    ['ZORUNLU ALANLAR'],
    ['• Ürün Adı: Ürünün Türkçe adı (örn: Domates, Patates)'],
    ['• Kategori: Aşağıdaki kategorilerden birini seçin:'],
    ...CATEGORIES.map(c => ['  - ' + c]),
    ['• Birim: kg, adet, demet, veya paket'],
    ['• Taban Fiyat: Tedarikçi fiyatı (TL)'],
    ['• Satış Fiyatı: Müşteriye satış fiyatı (TL)'],
    [''],
    ['OPSİYONEL ALANLAR'],
    ['• Stok: Stok miktarı (boş = varsayılan)'],
    ['• Köken: Ürün menşei (boş = Türkiye)'],
    ['• Kalite: premium, standart, ekonomik'],
    ['• Durum: bol, limited, son (stok durumu)'],
    ['• Açıklama: Ürün açıklaması (max 1000 karakter)'],
    ['• Görsel URLleri: Virgülle ayrılmış resim linkleri'],
    [''],
    ['ÖNEMLİ KURALLAR'],
    ['• Fiyatlar sayı formatında olmalıdır (örn: 25.50)'],
    ['• Kategori listedeki kategorilerden biri olmalıdır'],
    ['• Birim kg, adet, demet, veya paket olmalıdır'],
    ['• Aynı ürün adından birden fazla eklerseniz güncellenir'],
    ['• Boş satırlar yoksayılır'],
    [''],
    ['ÖRNEK ÜRÜN'],
    COLUMNS.map(c => c.header),
    [
      'Domates',
      'sebzeler',
      'kg',
      25.50,
      30.00,
      100,
      'Türkiye',
      'standart',
      'bol',
      'Taze ve lezzetli domates',
      'https://ornek.com/domates.jpg',
    ],
    [''],
    ['DESTEK'],
    ['Sorun yaşarsanız: destek@haldeki.com'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(instructions);

  // Set column widths
  ws['!cols'] = [{ wch: 60 }];

  return ws;
};

/**
 * Sheet 2: Products (Main data entry)
 */
const createProductsSheet = () => {
  // Header row
  const headers = COLUMNS.map(c => c.header);

  // Create worksheet with headers only
  const ws = XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths
  ws['!cols'] = COLUMNS.map(c => ({ wch: c.width }));

  // Add example data row (row 2)
  COLUMNS.forEach((col, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 1, c: index });
    ws[cellAddress] = {
      v: col.example,
      t: typeof col.example === 'number' ? 'n' : 's',
      s: {
        font: { color: { rgb: '999999' } }, // Gray color for example
      },
    };
  });

  // Add data validation for dropdown columns (Category, Unit, Quality, Availability)
  // Note: XLSX library has limited data validation support
  // Real validation happens server-side during import

  return ws;
};

/**
 * Sheet 3: Categories Reference
 */
const createCategoriesSheet = () => {
  const categories = [
    ['Kategori ID', 'Kategori Adı (Türkçe)', 'Açıklama'],
    ...CATEGORIES.map(cat => [
      cat,
      cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '),
      '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(categories);
  ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 40 }];

  return ws;
};

/**
 * Generate the complete Excel template
 */
export function generateProductImportTemplate(): Buffer {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Add sheets
  XLSX.utils.book_append_sheet(wb, createInstructionsSheet(), 'Talimatlar');
  XLSX.utils.book_append_sheet(wb, createProductsSheet(), 'Ürünler');
  XLSX.utils.book_append_sheet(wb, createCategoriesSheet(), 'Kategoriler');

  // Write to buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return buf;
}

/**
 * Download the template (browser only)
 */
export function downloadProductImportTemplate() {
  const buf = generateProductImportTemplate();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'haldeki-urun-import-sablonu.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
