/**
 * CSV Template Generator for Product Import
 * Phase 10.1 - CSV Template
 */

import * as Papa from 'papaparse';

// Turkish category list from the system
export const CATEGORIES = [
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
export const UNITS = ['kg', 'adet', 'demet', 'paket'];

// Quality grades enum
export const QUALITY = ['premium', 'standart', 'ekonomik'];

// Availability status enum
export const AVAILABILITY = ['bol', 'limited', 'son'];

/**
 * CSV headers
 */
export const CSV_HEADERS = [
  'Urun Adi',
  'Kategori',
  'Birim',
  'Taban Fiyat',
  'Satis Fiyati',
  'Stok',
  'Koken',
  'Kalite',
  'Durum',
  'Aciklama',
  'Gorsel URLleri',
];

/**
 * Example row for CSV
 */
const EXAMPLE_ROW = [
  'Domates',
  'sebzeler',
  'kg',
  '25.50',
  '30.00',
  '100',
  'Türkiye',
  'standart',
  'bol',
  'Taze ve lezzetli domates',
  'https://ornek.com/domates.jpg',
];

/**
 * Instructions for CSV import
 */
export const CSV_INSTRUCTIONS = `
# HALDEKİ MARKET - ÜRÜN İÇE AKTARIM ŞABLONU (CSV)

## NASIL KULLANILIR?

1. Bu dosyayı indirin
2. Ürün bilgilerinizi CSV formatına uygun şekilde girin
3. Zorunlu alanları (*) doldurun
4. Dosyayı UTF-8编码 olarak kaydedin
5. Tedarikçi panelinden "İçe Aktar" butonuna tıklayın
6. Bu dosyayı yükleyin

## ZORUNLU ALANLAR

- Urun Adi: Ürünün Türkçe adı (örn: Domates, Patates)
- Kategori: Aşağıdaki kategorilerden birini seçin:
  ${CATEGORIES.join(', ')}
- Birim: kg, adet, demet, veya paket
- Taban Fiyat: Tedarikçi fiyatı (TL, sayı formatında)
- Satis Fiyati: Müşteriye satış fiyatı (TL, sayı formatında)

## OPSİYONEL ALANLAR

- Stok: Stok miktarı (boş = varsayılan)
- Koken: Ürün menşei (boş = Türkiye)
- Kalite: premium, standart, ekonomik
- Durum: bol, limited, son (stok durumu)
- Aciklama: Ürün açıklaması (max 1000 karakter)
- Gorsel URLleri: Virgülle ayrılmış resim linkleri

## ÖNEMLİ KURALLAR

- Fiyatlar sayı formatında olmalıdır (örn: 25.50)
- Kategori listedeki kategorilerden biri olmalıdır
- Birim kg, adet, demet, veya paket olmalıdır
- Aynı ürün adından birden fazla eklerseniz güncellenir
- Boş satırlar yoksayılır
- CSV dosyası UTF-8编码 olmalıdır (Türkçe karakterler için)

## ÖRNEK

${CSV_HEADERS.join(',')}
${EXAMPLE_ROW.join(',')}
`;

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): string {
  const rows = [CSV_HEADERS, EXAMPLE_ROW];
  return Papa.unparse(rows, {
    delimiter: ',',
    header: false,
  });
}

/**
 * Download CSV template (browser only)
 */
export function downloadCSVTemplate() {
  const csv = generateCSVTemplate();
  const blob = new Blob(['\uFEFF' + csv], {
    // Add BOM for Excel UTF-8 compatibility
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'haldeki-urun-import-sablonu.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
