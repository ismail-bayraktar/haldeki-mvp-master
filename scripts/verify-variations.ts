import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function verifyVariations() {
  console.log('🔍 Verifying product variations in database...\n');

  // Check if product_variations table exists and has data
  const { data: variations, error, count } = await supabase
    .from('product_variations')
    .select('id, product_id, variation_type, variation_value, display_order, metadata', { count: 'exact' });

  if (error) {
    console.error('❌ Error fetching variations:', error.message);
    return;
  }

  console.log(`✅ Found ${count} variations in database\n`);

  // Get products with variations
  const { data: products } = await supabase
    .from('product_variations')
    .select('product_id, products(name)');

  const productMap = new Map();
  products?.forEach(p => {
    productMap.set(p.product_id, p.products?.name);
  });

  // Group variations by product
  const byProduct = new Map<string, any[]>();
  variations?.forEach(v => {
    if (!byProduct.has(v.product_id)) {
      byProduct.set(v.product_id, []);
    }
    byProduct.get(v.product_id).push(v);
  });

  console.log('📦 Products with variations:\n');
  byProduct.forEach((vars, productId) => {
    const productName = productMap.get(productId) || 'Unknown';
    console.log(`\n${productName}:`);
    vars.forEach((v: any) => {
      const quantity = v.metadata?.quantity || 'N/A';
      const multiplier = v.metadata?.priceMultiplier || 'N/A';
      console.log(`  - ${v.variation_value} (qty: ${quantity}, multiplier: ${multiplier})`);
    });
  });

  console.log(`\n✨ Total products with variations: ${byProduct.size}`);
}

verifyVariations().catch(console.error);
