const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkVariationsWithProducts() {
  const { data, error } = await supabase
    .from('product_variations')
    .select('id, product_id, variation_type, variation_value, display_order, metadata')
    .order('product_id')
    .order('display_order');

  if (error) {
    console.log('ERROR:', error.message);
    return;
  }

  // Get unique product IDs
  const productIds = [...new Set(data.map(v => v.product_id))];

  // Fetch product names
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .in('id', productIds);

  const productMap = {};
  products.forEach(p => productMap[p.id] = p.name);

  // Group by product
  const grouped = {};
  data.forEach(v => {
    if (!grouped[v.product_id]) {
      grouped[v.product_id] = [];
    }
    grouped[v.product_id].push(v);
  });

  console.log('=== VARYASYON OZETI ===');
  console.log('Toplam varyasyonlu urun:', productIds.length);
  console.log('Toplam varyasyon kaydi:', data.length);
  console.log('');

  Object.keys(grouped).forEach(productId => {
    const productName = productMap[productId] || 'Bilinmeyen';
    console.log('URUN:', productName);
    console.log('  ID:', productId);
    grouped[productId].forEach(v => {
      const metadata = v.metadata || {};
      const priceMultiplier = metadata.priceMultiplier || 'N/A';
      console.log(`  - ${v.variation_type}: ${v.variation_value} (carpan: ${priceMultiplier})`);
    });
    console.log('');
  });
}

checkVariationsWithProducts();
