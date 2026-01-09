// Simple script with PUBLISHABLE_KEY
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epuhjrdqotyrryvkjnrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwdWhqcmRxb3R5cnJ5dmtqbnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2Njc1NzMsImV4cCI6MjA4MjI0MzU3M30.gXZ8KusNhUOD0WSZUZNMgu1Ncg2Fafc2EX5VS2wfcU8';

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
