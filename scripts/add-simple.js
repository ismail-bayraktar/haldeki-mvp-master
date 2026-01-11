// Simple script with PUBLISHABLE_KEY
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - VITE_SUPABASE_ANON_KEY');
  console.error('\nAdd these to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function add() {
  console.log('🚀 Adding variations...\n');

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .limit(3);

  console.log(`Found ${products?.length || 0} products\n`);

  for (const product of (products || [])) {
    console.log(`\n📦 ${product.name}:`);

    const variations = [
      { variation_type: 'size', variation_value: 'Küçük' },
      { variation_type: 'size', variation_value: 'Standart' },
      { variation_type: 'size', variation_value: 'Büyük' },
    ];

    for (const v of variations) {
      const { data, error } = await supabase
        .from('product_variations')
        .insert({
          product_id: product.id,
          ...v,
          display_order: 0,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.log(`  ❌ ${v.variation_value}: ${error.message.substring(0, 50)}...`);
      } else if (data) {
        console.log(`  ✅ ${v.variation_value}`);
      } else {
        console.log(`  ? ${v.variation_value}: No data returned`);
      }
    }
  }

  const { count } = await supabase
    .from('product_variations')
    .select('*', { count: 'exact', head: true });

  console.log(`\n\n✨ Total: ${count}`);
}

add();
