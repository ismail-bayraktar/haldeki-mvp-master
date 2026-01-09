// Direct PostgreSQL connection to bypass schema cache
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const connectionString = process.env.DATABASE_URL || process.env.VITE_SUPABASE_URL;

async function addVariationsDirect() {
  const client = new Client({
    connectionString: connectionString?.replace('postgresql://', 'postgres://') + '?sslmode=require',
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database\n');

    // Get products
    const { rows: products } = await client.query(`
      SELECT id, name FROM public.products
      LIMIT 5
    `);

    console.log(`Found ${products.length} products\n`);

    // Add variations
    for (const product of products) {
      console.log(`📦 ${product.name}:`);

      const variations = [
        { variation_type: 'size', variation_value: 'Küçük', display_order: 1 },
        { variation_type: 'size', variation_value: 'Standart', display_order: 2 },
        { variation_type: 'size', variation_value: 'Büyük', display_order: 3 },
        { variation_type: 'type', variation_value: 'Taze', display_order: 1 },
      ];

      for (const variation of variations) {
        // Check if exists
        const { rows: existing } = await client.query(
          `SELECT id FROM public.product_variations
           WHERE product_id = $1 AND variation_type = $2 AND variation_value = $3`,
          [product.id, variation.variation_type, variation.variation_value]
        );

        if (existing.length > 0) {
          console.log(`  ✓ Already: ${variation.variation_value}`);
        } else {
          // Insert
          await client.query(
            `INSERT INTO public.product_variations (product_id, variation_type, variation_value, display_order)
             VALUES ($1, $2, $3, $4)`,
            [product.id, variation.variation_type, variation.variation_value, variation.display_order]
          );
          console.log(`  ✅ Added: ${variation.variation_value}`);
        }
      }
    }

    // Verify
    const { rows: allVariations } = await client.query(`
      SELECT COUNT(*) as count FROM public.product_variations
    `);

    console.log(`\n✨ Done! Total variations: ${allVariations[0].count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

addVariationsDirect();
