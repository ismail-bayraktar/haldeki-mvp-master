/**
 * Haldeki Market - Product Data Backup Script
 *
 * Purpose: Export all product-related data to a seed file for safe backup
 * Usage: node scripts/backup-products-seed.js
 *
 * Exports:
 * - products
 * - region_products
 * - supplier_products
 * - product_variations
 * - supplier_product_variations
 * - suppliers
 * - regions
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    const value = valueParts.join('=').replace(/^"|"$/g, '').replace(/^'|"$/g, '');
    process.env[key] = value;
  }
});

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Backup configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_FILE = path.join(BACKUP_DIR, `product-seed-${TIMESTAMP}.json`);

async function backupProducts() {
  console.log('🔄 Starting product data backup...\n');

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {}
  };

  try {
    // 1. Backup regions
    console.log('📦 Backing up regions...');
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('*');

    if (regionsError) throw regionsError;
    backup.data.regions = regions;
    console.log(`   ✅ ${regions.length} regions backed up\n`);

    // 2. Backup suppliers
    console.log('📦 Backing up suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*');

    if (suppliersError) throw suppliersError;
    backup.data.suppliers = suppliers;
    console.log(`   ✅ ${suppliers.length} suppliers backed up\n`);

    // 3. Backup products (main table)
    console.log('📦 Backing up products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) throw productsError;
    backup.data.products = products;
    console.log(`   ✅ ${products.length} products backed up\n`);

    // 4. Backup region_products
    console.log('📦 Backing up region_products...');
    const { data: regionProducts, error: regionProductsError } = await supabase
      .from('region_products')
      .select('*');

    if (regionProductsError) throw regionProductsError;
    backup.data.region_products = regionProducts;
    console.log(`   ✅ ${regionProducts.length} region_products backed up\n`);

    // 5. Backup supplier_products
    console.log('📦 Backing up supplier_products...');
    const { data: supplierProducts, error: supplierProductsError } = await supabase
      .from('supplier_products')
      .select('*');

    if (supplierProductsError) throw supplierProductsError;
    backup.data.supplier_products = supplierProducts;
    console.log(`   ✅ ${supplierProducts.length} supplier_products backed up\n`);

    // 6. Backup product_variations
    console.log('📦 Backing up product_variations...');
    const { data: productVariations, error: productVariationsError } = await supabase
      .from('product_variations')
      .select('*');

    if (productVariationsError) throw productVariationsError;
    backup.data.product_variations = productVariations;
    console.log(`   ✅ ${productVariations.length} product_variations backed up\n`);

    // 7. Backup supplier_product_variations
    console.log('📦 Backing up supplier_product_variations...');
    const { data: supplierProductVariations, error: supplierProductVariationsError } = await supabase
      .from('supplier_product_variations')
      .select('*');

    if (supplierProductVariationsError) throw supplierProductVariationsError;
    backup.data.supplier_product_variations = supplierProductVariations;
    console.log(`   ✅ ${supplierProductVariations.length} supplier_product_variations backed up\n`);

    // Write backup file
    console.log('💾 Writing backup file...');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
    console.log(`   ✅ Backup saved to: ${BACKUP_FILE}\n`);

    // Generate TypeScript seed file (for easy restoration)
    const seedFile = path.join(BACKUP_DIR, `seed-${TIMESTAMP}.ts`);
    const seedContent = generateSeedFile(backup);
    fs.writeFileSync(seedFile, seedContent);
    console.log(`   ✅ Seed file saved to: ${seedFile}\n`);

    // Print summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 BACKUP SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Regions:                    ${regions.length}`);
    console.log(`Suppliers:                  ${suppliers.length}`);
    console.log(`Products:                   ${products.length}`);
    console.log(`Region Products:            ${regionProducts.length}`);
    console.log(`Supplier Products:          ${supplierProducts.length}`);
    console.log(`Product Variations:         ${productVariations.length}`);
    console.log(`Supplier Product Variations: ${supplierProductVariations.length}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n✅ Backup completed successfully!\n`);

  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

function generateSeedFile(backup) {
  return `/**
 * Haldeki Market - Product Seed Data
 * Generated: ${backup.timestamp}
 * Version: ${backup.version}
 *
 * This file contains all product-related data for restoration purposes.
 * Use with: node scripts/restore-products-seed.js
 */

import { supabase } from '@/lib/supabase';

export const seedData = ${JSON.stringify(backup.data, null, 2)} as const;

/**
 * Restore all data from seed
 * WARNING: This will overwrite existing data!
 */
export async function restoreSeedData() {
  console.log('🔄 Starting data restoration...');

  try {
    // Restore in order to respect foreign keys
    if (seedData.regions?.length) {
      const { error } = await supabase.from('regions').upsert(seedData.regions);
      if (error) throw new Error(\`Regions: \${error.message}\`);
      console.log(\`✅ \${seedData.regions.length} regions restored\`);
    }

    if (seedData.suppliers?.length) {
      const { error } = await supabase.from('suppliers').upsert(seedData.suppliers);
      if (error) throw new Error(\`Suppliers: \${error.message}\`);
      console.log(\`✅ \${seedData.suppliers.length} suppliers restored\`);
    }

    if (seedData.products?.length) {
      const { error } = await supabase.from('products').upsert(seedData.products);
      if (error) throw new Error(\`Products: \${error.message}\`);
      console.log(\`✅ \${seedData.products.length} products restored\`);
    }

    if (seedData.region_products?.length) {
      const { error } = await supabase.from('region_products').upsert(seedData.region_products);
      if (error) throw new Error(\`Region Products: \${error.message}\`);
      console.log(\`✅ \${seedData.region_products.length} region_products restored\`);
    }

    if (seedData.supplier_products?.length) {
      const { error } = await supabase.from('supplier_products').upsert(seedData.supplier_products);
      if (error) throw new Error(\`Supplier Products: \${error.message}\`);
      console.log(\`✅ \${seedData.supplier_products.length} supplier_products restored\`);
    }

    if (seedData.product_variations?.length) {
      const { error } = await supabase.from('product_variations').upsert(seedData.product_variations);
      if (error) throw new Error(\`Product Variations: \${error.message}\`);
      console.log(\`✅ \${seedData.product_variations.length} product_variations restored\`);
    }

    if (seedData.supplier_product_variations?.length) {
      const { error } = await supabase.from('supplier_product_variations').upsert(seedData.supplier_product_variations);
      if (error) throw new Error(\`Supplier Product Variations: \${error.message}\`);
      console.log(\`✅ \${seedData.supplier_product_variations.length} supplier_product_variations restored\`);
    }

    console.log('\\n✅ All data restored successfully!');
  } catch (error) {
    console.error('\\n❌ Restoration failed:', error);
    throw error;
  }
}
`;
}

// Run backup
backupProducts();
