# Product Visibility & Role Matrix

## User Roles (app_role enum)

| Role | Turkish Name | Access Level |
|------|--------------|--------------|
| `superadmin` | Super Admin | Full system access |
| `admin` | Admin | Management access |
| `supplier` | Tedarikçi | Product supplier |
| `business` | İşletme (B2B) | Business customer |
| `dealer` | Bayi | Dealer customer |
| `warehouse_manager` | Depo Yöneticisi | Warehouse operations |
| `user` | Müşteri (B2C) | Regular customer |

---

## Product Visibility by Role

### 1. Super Admin (`superadmin`)
**Page:** `/admin/urunler` (AdminProducts)

**What they see:**
- All products in `products` table (master catalog)
- Can view, create, edit, delete any product
- Can manage supplier assignments per product
- Can see price statistics (min, max, avg prices across suppliers)
- Toggle product `is_active` status
- Manage `is_bugun_halde` flag

**Key Permissions:**
```typescript
// Full CRUD on products table
createProduct()  // Creates new product
updateProduct()  // Updates any product field
deleteProduct()  // Deletes product
toggleProductActive()  // Enables/disables product
```

**Database View:** Direct access to `products` table
```sql
SELECT * FROM products ORDER BY name;
```

---

### 2. Customer / B2C (`user`)
**Page:** `/urunler` (Products page)

**What they see:**
- Only `is_active = true` products
- Only `product_status = 'active'` products
- Merged with regional pricing (`region_products`) if region selected
- Sees `base_price` from products table OR region-specific price

**Price Logic:**
```typescript
// Uses region price if available, otherwise base_price
const price = product.regionInfo?.price ?? product.base_price;
```

**Database View:**
```sql
SELECT * FROM products
WHERE is_active = true
AND product_status = 'active'
ORDER BY name;
```

---

### 3. Business / B2B (`business`)
**Page:** `/urunler` (same Products page) + Special pricing

**What they see:**
- Same active products as B2C
- Additional `business_price` field from `region_products` table
- "İşletme Özel Fiyatları" heading on Bugün Halde page

**Price Logic:**
```typescript
// Business users get special pricing
const price = (isBusiness && product.regionInfo?.businessPrice)
  ? product.regionInfo.businessPrice
  : (product.regionInfo?.price ?? product.price);
```

**Database View:**
```sql
SELECT p.*, rp.price, rp.business_price
FROM products p
LEFT JOIN region_products rp ON rp.product_id = p.id
WHERE p.is_active = true
AND p.product_status = 'active'
AND rp.region_id = ?; -- user's region
```

---

### 4. Supplier (`supplier`)
**Pages:** `/tedarikci/urunler` (SupplierProducts)

**Two Tabs:**

#### Tab 1: "Tüm Ürünler" (AllProductsTab)
**Purpose:** Browse global catalog and add own pricing

**What they see:**
- All products in `products` table (that they don't already price)
- Can enter their price to create `supplier_products` junction record
- Click on price button to open `ProductPriceModal`

**Key Action:**
```typescript
// Creates supplier_products junction entry
createSupplierProduct({
  product_id: productId,
  price: enteredPrice,
  stock_quantity: stock,
  availability: 'plenty' | 'limited' | 'last',
  quality: 'standart',
  origin: 'Türkiye',
  is_active: true
})
```

#### Tab 2: "Benim Ürünlerim" (MyProductsTab)
**Purpose:** Manage products they've priced

**What they see:**
- Only products from `supplier_products` where `supplier_id = their_id`
- Can edit price, stock, status inline
- Can delete (removes junction, not the product itself)
- Toggle `is_active` for their offering

**Key Actions:**
```typescript
// Inline edit operations
updatePrice()     // Updates price in supplier_products
updateStock()     // Updates stock_quantity
updateStatus()    // Updates is_active
deleteProduct()   // Deletes from supplier_products (junction only)
```

---

## Supplier CRUD Workflow

### CREATE Product

**Path:** `/tedarikci/urunler/yeni` (ProductForm)

**What supplier creates:**
1. **Product** in `products` table (master catalog)
2. **Supplier_Product** junction in `supplier_products` table (their pricing)

**Flow:**
```
1. Supplier fills form (name, category, price, stock, images, variations)
2. Check for duplicates (products with similar name+category)
3. Insert into products table
4. Insert into supplier_products junction table
5. Insert product_variations if provided
```

**Database Changes:**
```sql
-- Step 1: Create product
INSERT INTO products (name, slug, category, unit, is_active, ...)
VALUES ('Domates', 'domates-123', 'Sebze', 'kg', true, ...);

-- Step 2: Link to supplier
INSERT INTO supplier_products (supplier_id, product_id, price, stock_quantity, ...)
VALUES (supplier_id, product_id, 25.50, 100, ...);

-- Step 3: Add variations (optional)
INSERT INTO product_variations (product_id, variation_type, variation_value, ...)
VALUES (product_id, 'size', 'large', ...);
```

---

### READ Products

**Supplier sees their products via:**
```typescript
useSupplierJunctionProducts() // From supplier_products table
```

**Query:**
```sql
SELECT sp.*, p.name, p.category, p.unit, p.images
FROM supplier_products sp
JOIN products p ON p.id = sp.product_id
WHERE sp.supplier_id = ?  -- Current supplier's ID
ORDER BY sp.updated_at DESC;
```

---

### UPDATE Product

**Two levels of updates:**

#### Level 1: Product Info (name, description, category, unit)
**Updates:** `products` table
**Access:** Only their linked products

```typescript
updateProduct({
  productId: supplier_product_id,
  formData: { name, category, unit, description, ... }
})
```

#### Level 2: Supplier Pricing (price, stock, availability, status)
**Updates:** `supplier_products` junction table
**Access:** Only their records

```typescript
updatePrice({ productId, price })      // Inline edit
updateStock({ productId, stock })      // Inline edit
updateStatus({ productId, isActive })  // Toggle active
```

---

### DELETE Product

**What happens:**
1. Deletes from `supplier_products` junction (unlinking from supplier)
2. Deletes from `products` table (if supplier is the only one)

**Flow:**
```
1. Delete from supplier_products (junction)
2. Check if other suppliers have this product
3. If no other suppliers → Delete from products table
4. Delete from product_variations
```

**Database Changes:**
```sql
-- Step 1: Remove supplier link
DELETE FROM supplier_products
WHERE product_id = ? AND supplier_id = ?;

-- Step 2: If no other suppliers, remove product
DELETE FROM products
WHERE id = ? AND NOT EXISTS (
  SELECT 1 FROM supplier_products WHERE product_id = ?
);

-- Step 3: Clean up variations
DELETE FROM product_variations WHERE product_id = ?;
```

---

## Bugün Halde (Today's Specials)

**Page:** `/bugun-halde` (BugunHalde)

**What is it:**
- Products with multiple suppliers competing on price
- Shows lowest price prominently
- Displays price comparison across suppliers

**Product Selection Logic:**
```sql
-- Products with 2+ active suppliers
SELECT p.*,
  MIN(sp.price) as lowest_price,
  COUNT(DISTINCT sp.supplier_id) as supplier_count
FROM products p
JOIN supplier_products sp ON sp.product_id = p.id
WHERE p.is_active = true
AND p.is_bugun_halde = true
AND sp.is_active = true
GROUP BY p.id
HAVING COUNT(DISTINCT sp.supplier_id) >= 2
ORDER BY (MAX(sp.price) - MIN(sp.price)) DESC; -- Most price variance first
```

**Who sees what:**
| Role | Sees | Price |
|------|------|-------|
| B2C | Lowest price across all suppliers | `MIN(sp.price)` |
| B2B | Business price if available | `business_price` or lowest |
| Supplier | Not applicable (supplier view) | N/A |

---

## Database Schema Summary

### Tables Involved

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `products` | Master product catalog | `id`, `name`, `category`, `unit`, `is_active`, `is_bugun_halde` |
| `supplier_products` | Supplier pricing junction | `id`, `supplier_id`, `product_id`, `price`, `stock_quantity`, `is_active` |
| `product_variations` | Product variants | `product_id`, `variation_type`, `variation_value` |
| `region_products` | Regional pricing | `product_id`, `region_id`, `price`, `business_price`, `stock` |
| `suppliers` | Supplier profiles | `id`, `user_id`, `business_name`, `approval_status` |
| `user_roles` | Role assignments | `user_id`, `role` |

### Relationships

```
products (1) ----< (*) supplier_products (*) >---- (1) suppliers
     |
     | (1)
     |
< (*) product_variations

products (1) ----< (*) region_products (*) >---- (1) regions
```

---

## Key Code Files

| Purpose | File |
|---------|------|
| Admin product management | `src/pages/admin/Products.tsx` |
| Supplier products page | `src/pages/supplier/Products.tsx` |
| Supplier product form | `src/pages/supplier/ProductForm.tsx` |
| All products tab | `src/components/supplier/AllProductsTab.tsx` |
| My products tab | `src/components/supplier/MyProductsTab.tsx` |
| Customer products | `src/pages/Products.tsx` |
| Bugün Halde | `src/pages/BugunHalde.tsx` |
| Product hooks | `src/hooks/useProducts.ts` |
| Supplier hooks | `src/hooks/useSupplierProducts.ts` |
| Types | `src/integrations/supabase/types.ts` |
