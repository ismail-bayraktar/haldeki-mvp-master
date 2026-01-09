// Add Product Variations to Database
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addVariations() {
  console.log('🌱 Adding product variations...\n');

  // Get all active products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name')
    .limit(30);

  if (error) {
    console.error('Error fetching products:', error.message);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No active products found');
    return;
  }

  console.log(`Found ${products.length} products\n`);

  // Define variation patterns based on product name keywords
  for (const product of products) {
    const name = product.name.toLowerCase();
    const variations = [];

    // Size variations (common patterns)
    if (name.includes('lt') || name.includes('ml') || name.includes('boy')) {
      if (name.includes('4 lt') || name.includes('4lt')) {
        variations.push({ type: 'size', value: '4 LT' }, { type: 'size', value: '1.5 LT' }, { type: 'size', value: '750 ML' });
      } else if (name.includes('1.5') || name.includes('1,5')) {
        variations.push({ type: 'size', value: '1.5 LT' }, { type: 'size', value: '3 LT' }, { type: 'size', value: '750 ML' });
      } else {
        variations.push({ type: 'size', value: '750 ML' }, { type: 'size', value: '1 LT' }, { type: 'size', value: '4 LT' });
      }
    }

    if (name.includes('kg') || name.includes('gr')) {
      if (name.includes('9 kg') || name.includes('9kg')) {
        variations.push({ type: 'size', value: '3 KG' }, { type: 'size', value: '5 KG' }, { type: 'size', value: '9 KG' });
      } else if (name.includes('5 kg') || name.includes('5kg')) {
        variations.push({ type: 'size', value: '3 KG' }, { type: 'size', value: '5 KG' }, { type: 'size', value: '9 KG' });
      } else {
        variations.push({ type: 'size', value: '500 GR' }, { type: 'size', value: '1 KG' }, { type: 'size', value: '3 KG' });
      }
    }

    // Type variations
    if (name.includes('beyaz') || name.includes('ak') || name.includes('white')) {
      variations.push({ type: 'type', value: 'Beyaz' });
    }
    if (name.includes('renkli') || name.includes('color') || name.includes('colour')) {
      variations.push({ type: 'type', value: 'Renkli' });
    }
    if (name.includes('toz') || name.includes('powder')) {
      variations.push({ type: 'type', value: 'Toz' });
    }
    if (name.includes('sivi') || name.includes('likit') || name.includes('liquid')) {
      variations.push({ type: 'type', value: 'Sıvı' });
    }
    if (name.includes('krem') || name.includes('cream')) {
      variations.push({ type: 'type', value: 'Krem' });
    }
    if (name.includes('sprey') || name.includes('spray')) {
      variations.push({ type: 'type', value: 'Sprey' });
    }

    // Scent variations (common in cleaning products)
    if (name.includes('limon') || name.includes('lemon')) {
      variations.push({ type: 'scent', value: 'Limon' });
    }
    if (name.includes('lavanta') || name.includes('lavender')) {
      variations.push({ type: 'scent', value: 'Lavanta' });
    }
    if (name.includes('cilek') || name.includes('çilek')) {
      variations.push({ type: 'scent', value: 'Çilek' });
    }
    if (name.includes('okaliptus') || name.includes('eucalyptus')) {
      variations.push({ type: 'scent', value: 'Okaliptus' });
    }
    if (name.includes('gul') || name.includes('rose')) {
      variations.push({ type: 'scent', value: 'Gül' });
    }
    if (name.includes('porselen')) {
      variations.push({ type: 'scent', value: 'Porselen' });
    }
    if (name.includes('elma') || name.includes('apple')) {
      variations.push({ type: 'scent', value: 'Yeşil Elma' });
    }

    // Packaging variations
    if (name.includes('4lu') || name.includes('4lü') || name.includes('*4')) {
      variations.push({ type: 'packaging', value: '*4' });
    }
    if (name.includes('6lu') || name.includes('6lü') || name.includes('*6')) {
      variations.push({ type: 'packaging', value: '*6' });
    }
    if (name.includes('12li') || name.includes('12\'li') || name.includes('*12')) {
      variations.push({ type: 'packaging', value: '*12' });
    }

    // Material variations
    if (name.includes('cam') || name.includes('glass')) {
      variations.push({ type: 'material', value: 'Cam' });
    }
    if (name.includes('plastik') || name.includes('plastic')) {
      variations.push({ type: 'material', value: 'Plastik' });
    }

    // If no variations detected, add generic ones
    if (variations.length === 0) {
      variations.push(
        { type: 'size', value: 'Standart' },
        { type: 'size', value: 'Büyük' },
        { type: 'size', value: 'Küçük' }
      );
    }

    // Remove duplicates
    const uniqueVariations = Array.from(
      new Map(variations.map(v => [`${v.type}-${v.value}`, v])).values()
    );

    if (uniqueVariations.length === 0) {
      console.log(`⏭️  Skipping: ${product.name} (no variations detected)`);
      continue;
    }

    console.log(`\n📦 ${product.name}:`);

    // Check existing variations
    const { data: existingVars } = await supabase
      .from('product_variations')
      .select('variation_type, variation_value')
      .eq('product_id', product.id);

    const existingKey = new Set(
      (existingVars || []).map(v => `${v.variation_type}-${v.variation_value}`)
    );

    // Add new variations
    for (const variation of uniqueVariations) {
      const key = `${variation.type}-${variation.value}`;

      if (existingKey.has(key)) {
        console.log(`  ✓ Already exists: ${variation.value} (${variation.type})`);
        continue;
      }

      const { error: insertError } = await supabase
        .from('product_variations')
        .insert({
          product_id: product.id,
          variation_type: variation.type,
          variation_value: variation.value,
          display_order: 0,
        });

      if (insertError) {
        console.error(`  ❌ Error adding ${variation.value}:`, insertError.message);
      } else {
        console.log(`  ✅ Added: ${variation.value} (${variation.type})`);
      }
    }
  }

  console.log('\n✨ Done!');
}

addVariations().catch(console.error);
