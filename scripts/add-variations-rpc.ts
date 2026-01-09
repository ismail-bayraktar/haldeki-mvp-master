// Use RPC to bypass schema cache
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' }
});

async function addVariationsRPC() {
  console.log('🚀 Adding variations via RPC...\n');

  // First, let's try to create variations using raw SQL
  const { data: products, error: productsError } = await supabase
    .rpc('get_product_variations', { p_product_id: '00000000-0000-0000-0000-000000000000' });

  console.log('RPC test result:', { data: products, error: productsError });

  // Get products
  const { data: productsList } = await supabase
    .from('products')
    .select('id, name')
    .limit(3);

  console.log(`\nFound ${productsList?.length || 0} products\n`);

  if (!productsList) return;

  for (const product of productsList) {
    console.log(`\n📦 ${product.name}:`);

    // Try direct insert with error handling
    const variations = [
      { variation_type: 'size', variation_value: 'Küçük' },
      { variation_type: 'size', variation_value: 'Standart' },
      { variation_type: 'size', variation_value: 'Büyük' },
    ];

    for (const variation of variations) {
      try {
        const { data, error } = await supabase
          .from('product_variations')
          .insert({
            product_id: product.id,
            ...variation,
            display_order: 0,
          })
          .select()
          .single();

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('already exists')) {
            console.log(`  ✓ Already: ${variation.variation_value}`);
          } else {
            console.log(`  ❌ ${variation.variation_value}: ${error.message}`);
          }
        } else {
          console.log(`  ✅ Added: ${variation.variation_value} (ID: ${data.id})`);
        }
      } catch (e: any) {
        console.log(`  ❌ ${variation.variation_value}: ${e.message}`);
      }
    }
  }

  // Count total
  const { count } = await supabase
    .from('product_variations')
    .select('*', { count: 'exact', head: true });

  console.log(`\n\n✨ Total variations in DB: ${count}`);
}

addVariationsRPC().catch(console.error);
