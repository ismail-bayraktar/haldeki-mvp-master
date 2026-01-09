// Run SQL file via Supabase
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  console.log('🚀 Running SQL to add variations...\n');

  // Get products first
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .limit(5);

  if (!products) {
    console.log('❌ No products found');
    return;
  }

  console.log(`Found ${products.length} products\n`);

  // Add variations to each product
  for (const product of products) {
    console.log(`📦 ${product.name}:`);

    const variations = [
      { variation_type: 'size', variation_value: 'Küçük', display_order: 1 },
      { variation_type: 'size', variation_value: 'Standart', display_order: 2 },
      { variation_type: 'size', variation_value: 'Büyük', display_order: 3 },
      { variation_type: 'type', variation_value: 'Taze', display_order: 1 },
    ];

    for (const variation of variations) {
      const { error, data } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', product.id)
        .eq('variation_type', variation.variation_type)
        .eq('variation_value', variation.variation_value)
        .maybeSingle();

      if (error) {
        console.log(`  ❌ Error checking: ${error.message}`);
        continue;
      }

      if (data) {
        console.log(`  ✓ Already exists: ${variation.variation_value}`);
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('product_variations')
          .insert({
            product_id: product.id,
            ...variation,
          });

        if (insertError) {
          console.log(`  ❌ ${variation.variation_value}: ${insertError.message}`);
        } else {
          console.log(`  ✅ ${variation.variation_value}`);
        }
      }
    }
  }

  // Verify
  const { data: allVariations } = await supabase
    .from('product_variations')
    .select('variation_value, products(name)')
    .select('*, products!inner(*)');

  console.log(`\n\n✨ Done! Total variations: ${allVariations?.length || 0}`);
}

runSQL().catch(console.error);
