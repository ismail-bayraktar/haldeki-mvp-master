import xlsx from 'xlsx';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';

interface ExcelRow {
  'Stok Adı': string;
  'Grup Adı': string;
  'Miktarı': string;
  'Ölçü Br1': string;
  'Liste Fiyatı': string;
}

interface ParsedVariations {
  size?: string;
  type?: string;
  scent?: string;
  packaging?: string;
  baseName: string;
}

const DEFAULT_SUPPLIER_ID = '00000000-0000-0000-0000-000000000001';

function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseVariations(productName: string): ParsedVariations {
  const result: ParsedVariations = { baseName: productName };

  const sizeMatch = productName.match(/(\d+[,.]?\d*)\s*(LT|KG|ML|GR)\b/i);
  if (sizeMatch) {
    const value = sizeMatch[1].replace(',', '.');
    const unit = sizeMatch[2].toUpperCase();
    result.size = `${value} ${unit}`;
    result.baseName = result.baseName.replace(sizeMatch[0], '').trim();
  }

  const typeMatch = result.baseName.match(/\b(BEYAZ|RENKLI|SIVI|TOZ|KATI|SIVI|YUVI)\b/i);
  if (typeMatch) {
    result.type = typeMatch[1].toUpperCase();
    result.baseName = result.baseName.replace(typeMatch[0], '').trim();
  }

  const scentMatch = result.baseName.match(
    /\b(LAVANTA|LİMON|GÜL|MISKET|BAHAR|PORÇEL|LOTUS|ORKİDE|CILEK|VANILYA|ÇİKOLATA|PORTAKAL|GREYFURT|ELMA|NANE|BERGAMOT|LAVAS|PORES|KARANFİL)\b/i
  );
  if (scentMatch) {
    result.scent = scentMatch[1].toUpperCase()
      .replace('İ', 'I')
      .replace('Ğ', 'G')
      .replace('Ü', 'U')
      .replace('Ş', 'S')
      .replace('Ö', 'O')
      .replace('Ç', 'C');
    result.baseName = result.baseName.replace(scentMatch[0], '').trim();
  }

  const packMatch = productName.match(/\*(\d+)\s*$/);
  if (packMatch) {
    result.packaging = packMatch[1];
    result.baseName = result.baseName.replace(`*${packMatch[1]}`, '').trim();
  }

  result.baseName = result.baseName.replace(/\s+/g, ' ').trim();

  return result;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function determineCategory(groupName: string): string {
  const normalized = groupName.toUpperCase()
    .replace('İ', 'I')
    .replace('Ğ', 'G')
    .replace('Ü', 'U')
    .replace('Ş', 'S')
    .replace('Ö', 'O')
    .replace('Ç', 'C');

  const categoryMap: Record<string, string> = {
    'TEMIZLIK': 'TEMİZLİK',
    'KOZMETIK': 'KOZMETİK',
    'TEMEL GIDA': 'GIDA',
    'HIRDAVAT': 'HIRDAVAT',
    'EVCIL HAYVAN URUNLERI': 'EVCİL HAYVAN',
    'ICECEK': 'İÇECEK'
  };

  return categoryMap[normalized] || groupName;
}

function mapToValidUnit(excelUnit: string): string {
  const unitMap: Record<string, string> = {
    'KG': 'kg',
    'LT': 'kg',
    'ML': 'kg',
    'GR': 'kg',
    'ADET': 'adet'
  };
  return unitMap[excelUnit.toUpperCase()] || 'adet';
}

function extractUnit(variations: ParsedVariations): string {
  if (variations.size) {
    const match = variations.size.match(/(\d+[,.]?\d*)\s*(LT|KG|ML|GR)/i);
    if (match) return mapToValidUnit(match[2]);
  }
  return 'adet';
}

function generateSQL(data: ExcelRow[]): string {
  const lines: string[] = [];
  lines.push('-- Phase 12 Seed Data: Products from Supplier Excel');
  lines.push('-- Generated: ' + new Date().toISOString());
  lines.push('-- Source: tedarikchi-urun-listesi.xlsx');
  lines.push('');
  lines.push('-- ================================================');
  lines.push('-- DEFAULT SUPPLIER');
  lines.push('-- ================================================');
  lines.push('');
  lines.push(`-- Note: Using existing suppliers table structure`);
  lines.push(`-- Insert default supplier if not exists`);
  lines.push(`INSERT INTO public.suppliers (id, user_id, name, contact_name, contact_phone, contact_email, is_active, created_at, updated_at)`);
  lines.push(`VALUES (`);
  lines.push(`  '${DEFAULT_SUPPLIER_ID}',`);
  lines.push(`  (SELECT id FROM auth.users WHERE email = 'admin@haldeki.com' LIMIT 1),`);
  lines.push(`  'Default Tedarikçi',`);
  lines.push(`  'Default Contact',`);
  lines.push(`  '+905551234567',`);
  lines.push(`  'supplier@haldeki.com',`);
  lines.push(`  true,`);
  lines.push(`  NOW(),`);
  lines.push(`  NOW()`);
  lines.push(`)`);
  lines.push(`ON CONFLICT (id) DO NOTHING;`);
  lines.push('');

  const productMap = new Map<string, { id: string; variations: Set<string> }>();

  lines.push('-- ================================================');
  lines.push('-- PRODUCTS');
  lines.push('-- ================================================');
  lines.push('');

  for (const row of data) {
    const productName = row['Stok Adı'];
    const variations = parseVariations(productName);
    const category = determineCategory(row['Grup Adı']);
    const slug = slugify(variations.baseName);
    const productId = randomUUID();

    if (!productMap.has(slug)) {
      productMap.set(slug, { id: productId, variations: new Set() });

      lines.push(`-- Product: ${productName}`);
      lines.push(`INSERT INTO public.products (id, name, slug, category, unit, conversion_factor, description, images, product_status, created_at, updated_at)`);
      lines.push(`VALUES (`);
      lines.push(`  '${productId}',`);
      lines.push(`  '${variations.baseName.replace(/'/g, "''")}',`);
      lines.push(`  '${slug}',`);
      lines.push(`  '${category}',`);
      lines.push(`  '${extractUnit(variations)}',`);
      lines.push(`  1.0,`);
      lines.push(`  '${variations.baseName.replace(/'/g, "''")} - ${category}',`);
      lines.push(`  ARRAY[]::TEXT[],`);
      lines.push(`  'active',`);
      lines.push(`  NOW(),`);
      lines.push(`  NOW()`);
      lines.push(`)`);
      lines.push(`ON CONFLICT DO NOTHING;`);
      lines.push('');
    } else {
      const existing = productMap.get(slug)!;
      productMap.set(slug, { ...existing, variations: existing.variations });
    }
  }

  lines.push('-- ================================================');
  lines.push('-- PRODUCT VARIATIONS');
  lines.push('-- ================================================');
  lines.push('');

  const variationMap = new Map<string, string>();
  const productVariations: Array<{ productId: string; variationId: string; type: string; value: string }> = [];

  for (const row of data) {
    const productName = row['Stok Adı'];
    const variations = parseVariations(productName);
    const slug = slugify(variations.baseName);
    const product = productMap.get(slug);
    if (!product) continue;

    const addVariation = (type: string, value: string | undefined, order: number) => {
      if (!value) return;
      const key = `${product.id}-${type}-${value}`;
      if (!variationMap.has(key)) {
        const variationId = randomUUID();
        variationMap.set(key, variationId);

        const metadata: Record<string, string> = {};
        if (type === 'size') {
          const match = value.match(/(\d+[,.]?\d*)\s*(LT|KG|ML|GR)/i);
          if (match) {
            metadata.value = match[1].replace(',', '.');
            metadata.unit = match[2].toUpperCase();
          }
        }

        lines.push(`-- Variation: ${type} = ${value} for product ${slug}`);
        lines.push(`INSERT INTO public.product_variations (id, product_id, variation_type, variation_value, display_order, metadata, created_at)`);
        lines.push(`VALUES (`);
        lines.push(`  '${variationId}',`);
        lines.push(`  '${product.id}',`);
        lines.push(`  '${type}',`);
        lines.push(`  '${value}',`);
        lines.push(`  ${order},`);
        lines.push(`  '${JSON.stringify(metadata)}'::jsonb,`);
        lines.push(`  NOW()`);
        lines.push(`)`);
        lines.push(`ON CONFLICT (product_id, variation_type, variation_value) DO NOTHING;`);
        lines.push('');
      }
      productVariations.push({
        productId: product.id,
        variationId: variationMap.get(key)!,
        type,
        value
      });
    };

    addVariation('size', variations.size, 1);
    addVariation('type', variations.type, 2);
    addVariation('scent', variations.scent, 3);
    addVariation('packaging', variations.packaging, 4);
  }

  lines.push('-- ================================================');
  lines.push('-- SUPPLIER PRODUCTS');
  lines.push('-- ================================================');
  lines.push('');

  const supplierProductMap = new Map<string, string>();

  for (const row of data) {
    const productName = row['Stok Adı'];
    const variations = parseVariations(productName);
    const slug = slugify(variations.baseName);
    const product = productMap.get(slug);
    if (!product) continue;

    const price = parsePrice(row['Liste Fiyatı']);
    const supplierProductId = randomUUID();
    const key = `${DEFAULT_SUPPLIER_ID}-${product.id}`;

    if (!supplierProductMap.has(key)) {
      supplierProductMap.set(key, supplierProductId);

      lines.push(`-- Supplier product: ${productName}`);
      lines.push(`INSERT INTO public.supplier_products (id, supplier_id, product_id, price, stock_quantity, availability, is_active, quality, origin, delivery_days, created_at, updated_at)`);
      lines.push(`VALUES (`);
      lines.push(`  '${supplierProductId}',`);
      lines.push(`  '${DEFAULT_SUPPLIER_ID}',`);
      lines.push(`  '${product.id}',`);
      lines.push(`  ${price.toFixed(2)},`);
      lines.push(`  ${Math.floor(Math.random() * 100)},`);
      lines.push(`  'plenty',`);
      lines.push(`  true,`);
      lines.push(`  'standart',`);
      lines.push(`  'Türkiye',`);
      lines.push(`  ${Math.floor(Math.random() * 3) + 1},`);
      lines.push(`  NOW(),`);
      lines.push(`  NOW()`);
      lines.push(`)`);
      lines.push(`ON CONFLICT (supplier_id, product_id) DO NOTHING;`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function main() {
  const workbook = xlsx.readFile('seed-data/tedarikchi-urun-listesi.xlsx');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = xlsx.utils.sheet_to_json<ExcelRow>(worksheet);

  const sql = generateSQL(rawData);

  const outputPath = 'supabase/migrations/20250110020000_phase12_seed_data.sql';
  writeFileSync(outputPath, sql, 'utf-8');

  console.log(`Generated SQL: ${outputPath}`);
  console.log(`Total products: ${rawData.length}`);
  console.log(`\nRun: npx supabase db push`);
}

main();
