// Simple SQL script to add variations
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addVariationsSQL() {
  console.log('🌱 Adding variations via SQL...\n');

  // Get products
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .limit(10);

  if (!products) {
    console.log('No products found');
    return;
  }

  console.log(`Found ${products.length} products\n`);

  // Add variations directly using SQL
  for (const product of products) {
    console.log(`\n📦 ${product.name}:`);

    // Add generic size variations to all products
    const variations = [
      { variation_type: 'size', variation_value: 'Küçük', display_order: 1 },
      { variation_type: 'size', variation_value: 'Standart', display_order: 2 },
      { variation_type: 'size', variation_value: 'Büyük', display_order: 3 },
      { variation_type: 'type', variation_value: 'Taze', display_order: 1 },
    ];

    for (const variation of variations) {
      const { error } = await supabase
        .from('product_variations')
        .insert({
          product_id: product.id,
          ...variation,
        });

      if (error) {
        console.log(`  ❌ ${variation.variation_value}: ${error.message}`);
      } else {
        console.log(`  ✅ ${variation.variation_value} (${variation.variation_type})`);
      }
    }
  }

  console.log('\n✨ Done!');
}

addVariationsSQL().catch(console.error);
