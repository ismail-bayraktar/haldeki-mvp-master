# Pricing System - Quick Reference

**Last Updated:** 2026-01-10

---

## The One Thing You Need to Know

**Use `calculate_product_price()` RPC for all pricing logic.**

```typescript
const { data } = await supabase.rpc('calculate_product_price', {
  p_product_id: productId,
  p_region_id: regionId,
  p_user_role: 'b2c'  // or 'b2b'
});

const price = data.final_price; // Done!
```

---

## Common Patterns

### Get Product Price (Single)

```typescript
const { data } = await supabase.rpc('calculate_product_price', {
  p_product_id: 'uuid-here',
  p_region_id: 'region-uuid',  // optional
  p_user_role: 'b2c'
});

// Returns: { final_price, b2b_price, b2c_price, supplier_price, ... }
```

### Get Cheapest Supplier for Product

```typescript
const { data } = await supabase.rpc('calculate_product_price', {
  p_product_id: 'uuid-here',
  p_supplier_id: null,  // NULL = auto-select cheapest
  p_user_role: 'b2c'
});
```

### Get Price with Variations

```typescript
const { data } = await supabase.rpc('calculate_product_price', {
  p_product_id: 'uuid-here',
  p_variation_ids: ['variation-uuid-1', 'variation-uuid-2'],
  p_user_role: 'b2c'
});
```

### Calculate Cart Total

```typescript
const cartItems = [
  { product_id: 'uuid1', quantity: 2 },
  { product_id: 'uuid2', quantity: 1 }
];

const { data } = await supabase.rpc('calculate_cart_prices', {
  p_items: JSON.stringify(cartItems)
});

// Returns: [{ unit_price, total_price, ... }, ...]
const total = data.reduce((sum, item) => sum + item.total_price, 0);
```

### View All Prices (Admin)

```typescript
const { data } = await supabase
  .from('customer_prices')
  .select('*')
  .eq('product_id', 'uuid-here');
```

---

## React Hook

```typescript
// hooks/useProductPrice.ts
export function useProductPrice(productId: string, regionId?: string) {
  return useQuery({
    queryKey: ['price', productId, regionId],
    queryFn: () => supabase.rpc('calculate_product_price', {
      p_product_id: productId,
      p_region_id: regionId,
      p_user_role: 'b2c'
    }),
    enabled: !!productId
  });
}
```

---

## Pricing Config (Admin)

```typescript
// Get current config
const { data } = await supabase
  .from('pricing_config')
  .select('*')
  .eq('is_active', true)
  .single();

// Update commission rates
await supabase
  .from('pricing_config')
  .update({ commission_b2c: 0.40 })
  .eq('is_active', true);
```

---

## Regional Multipliers (Admin)

```typescript
// Update regional multiplier
await supabase
  .from('regions')
  .update({ price_multiplier: 1.10 })
  .eq('id', 'region-uuid');
```

---

## What NOT to Do

```typescript
// DON'T DO THIS - Old way
const product = await supabase
  .from('products')
  .select('price')
  .single();

// DON'T DO THIS - Old way
const regionPrice = await supabase
  .from('region_products')
  .select('price')
  .single();

// DO THIS - New way
const price = await supabase.rpc('calculate_product_price', {
  p_product_id: productId
});
```

---

## Price Calculation Formula

```
final_price = (supplier_price + variation_adjustment) / (1 - commission) * regional_multiplier
```

**Example:**
- Supplier price: 100 TL
- B2C commission: 50%
- Regional multiplier: 1.10
- Result: `100 / (1 - 0.50) * 1.10 = 220 TL`

---

## Response Structure

```typescript
interface PriceResult {
  // Product info
  product_id: string;
  product_name: string;

  // Supplier info
  supplier_id: string;
  supplier_name: string;
  supplier_price: number;        // Base price from supplier
  price_rank: number;            // 1 = cheapest

  // Adjustments
  variation_adjustment: number;   // Sum of variation prices
  regional_multiplier: number;    // Regional multiplier

  // Calculated prices
  b2b_price: number;             // B2B final price
  b2c_price: number;             // B2C final price
  final_price: number;           // Selected role price

  // Metadata
  commission_rate: number;       // Commission rate used
  price_calculation_mode: string;// 'markup' or 'margin'
  calculated_at: string;         // Timestamp

  // Availability
  availability: string;
  stock_quantity: number;
  is_featured: boolean;
}
```

---

## Migration Checklist

For developers updating frontend code:

- [ ] Replace direct `products.price` queries with `calculate_product_price()`
- [ ] Replace `region_products.price` queries with `calculate_product_price()`
- [ ] Update cart components to use `calculate_cart_prices()`
- [ ] Remove any client-side price calculation logic
- [ ] Test with both B2B and B2C users
- [ ] Test with different regions
- [ ] Test with product variations

---

## Troubleshooting

**Price seems wrong?**
```sql
-- Check commission rates
SELECT * FROM pricing_config WHERE is_active = true;

-- Check regional multipliers
SELECT name, price_multiplier FROM regions;
```

**Function returns empty?**
```sql
-- Check if product has active supplier
SELECT * FROM supplier_products
WHERE product_id = 'your-uuid' AND is_active = true;
```

---

## Full Documentation

See `docs/PRICING_SYSTEM_REDESIGN.md` for complete documentation.
