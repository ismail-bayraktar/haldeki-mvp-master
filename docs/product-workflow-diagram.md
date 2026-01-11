# Product Workflow - Visual Diagram

## Role-Based Product Access

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCT DATABASE STRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────────┐                    │
│  │   products       │         │  supplier_products   │                    │
│  │  (Master Catalog)│─────────│  (Junction Table)    │                    │
│  ├──────────────────┤ 1    * ├──────────────────────┤ *                1   │
│  │ id              │─────────│ supplier_id          │────────────────────┐ │
│  │ name            │         │ product_id           │                    │ │
│  │ category        │         │ price                │                    │ │
│  │ unit            │         │ stock_quantity       │                    │ │
│  │ is_active       │         │ availability         │                    │ │
│  │ is_bugun_halde  │         │ is_active            │                    │ │
│  │ product_status  │         └──────────────────────┘                    │ │
│  └──────────────────┘                                                      │ │
│           │                                                                │ │
│           │ 1                                                              │ │
│           │                                                                │ │
│           ▼                                                                │ │
│  ┌──────────────────┐                                                      │ │
│  │product_variations│                                                      │ │
│  │  (Variants)      │                                                      │ │
│  ├──────────────────┤                                                      │ │
│  │ product_id      │◄──────────────────────────────────────────────────────┘ │
│  │ variation_type  │                                                            │
│  │ variation_value │                                                            │
│  └──────────────────┘                                                            │
│                                                                                    │
│  ┌──────────────────┐         ┌──────────────────────┐                         │
│  │  products       │─────────│  region_products     │                         │
│  │                 │ 1    * │  (Regional Pricing)  │                         │
│  └──────────────────┘         ├──────────────────────┤ *  ┌──────────────┐     │
│                                │ product_id           │────│ regions      │     │
│                                │ region_id            │    │              │     │
│                                │ price                │    │ id, name     │     │
│                                │ business_price       │    └──────────────┘     │
│                                │ stock                │                         │
│                                └──────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## User Role Access Matrix

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           WHO SEES WHAT PRODUCTS                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     SUPER ADMIN / ADMIN                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Page: /admin/urunler                                                 │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │  ALL products in products table                              │     │    │
│  │  │  - Create, Edit, Delete any product                         │     │    │
│  │  │  - Manage supplier assignments                               │     │    │
│  │  │  - Toggle is_active, is_bugun_halde                          │     │    │
│  │  │  - View price stats (min, max, avg)                          │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     SUPPLIER (Tedarikçi)                             │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Page: /tedarikci/urunler                                             │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │ TAB 1: "Tüm Ürünler" (All Products)                          │     │    │
│  │  │ - Global products catalog (products table)                  │     │    │
│  │  │ - Products NOT yet priced by supplier                       │     │    │
│  │  │ - Click price button → Create supplier_products junction    │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │ TAB 2: "Benim Ürünlerim" (My Products)                        │     │    │
│  │  │ - Only supplier's products (supplier_products junction)      │     │    │
│  │  │ WHERE supplier_id = CURRENT_SUPPLIER                         │     │    │
│  │  │ - Edit price, stock inline                                   │     │    │
│  │  │ - Toggle is_active (their offering only)                    │     │    │
│  │  │ - Delete (removes junction, not product)                     │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │ CREATE NEW: /tedarikci/urunler/yeni                          │     │    │
│  │  │ - Creates product in products table                         │     │    │
│  │  │ - Creates supplier_products junction automatically            │     │    │
│  │  │ - Links product to supplier                                  │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     CUSTOMER (B2C - User)                           │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Page: /urunler                                                       │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │  ACTIVE products only                                        │     │    │
│  │  │  WHERE is_active = true AND product_status = 'active'        │     │    │
│  │  │                                                               │     │    │
│  │  │  Pricing:                                                     │     │    │
│  │  │  - If region selected → region_products.price               │     │    │
│  │  │  - Otherwise → products.base_price                          │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     BUSINESS (B2B)                                 │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Page: /urunler + "İşletme Özel Fiyatları"                          │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │  Same products as B2C                                        │     │    │
│  │  │  PLUS: Special business_price from region_products           │     │    │
│  │  │                                                               │     │    │
│  │  │  Pricing:                                                     │     │    │
│  │  │  - If business_price exists → business_price                 │     │    │
│  │  │  - Otherwise → same as B2C                                   │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     BUGÜN HALDE (Today's Specials)                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Page: /bugun-halde                                                   │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │  Products with 2+ competing suppliers                        │     │    │
│  │  │  WHERE is_bugun_halde = true                                 │     │    │
│  │  │  AND COUNT(supplier_products) >= 2                           │     │    │
│  │  │                                                               │     │    │
│  │  │  Shows:                                                       │     │    │
│  │  │  - Lowest price (MIN across suppliers)                       │     │    │
│  │  │  - Price comparison table                                    │     │    │
│  │  │  - Business users see business_price if available            │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Supplier CRUD Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUPPLIER CRUD OPERATIONS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CREATE                                                                      │
│  ──────                                                                      │
│                                                                              │
│  Supplier fills form ──► Check duplicates ──► INSERT products                │
│       (name, category,          (similar name+          (id, name,            │
│        price, stock,            category exists?)       category, unit,        │
│        images, variations)                                     is_active)     │
│           │                                                                  │
│           └───► INSERT supplier_products (supplier_id, product_id,            │
│                   price, stock_quantity, availability, is_active)            │
│                                                                              │
│           └───► INSERT product_variations (if provided)                      │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  READ                                                                        │
│  ────                                                                        │
│                                                                              │
│  "Tüm Ürünler" Tab: "Benim Ürünlerim" Tab:                                   │
│  ┌─────────────────────┐  ┌───────────────────────────────────────────────┐ │
│  │ Query products      │  │ Query supplier_products                        │ │
│  │ WHERE NOT EXISTS    │  │ WHERE supplier_id = CURRENT_SUPPLIER           │ │
│  │ (supplier_products  │  │                                               │ │
│  │  FOR this supplier) │  │ Returns: price, stock, availability, status   │ │
│  └─────────────────────┘  └───────────────────────────────────────────────┘ │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  UPDATE                                                                      │
│  ──────                                                                      │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Product Info (name, category, unit, description)                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ UPDATE products                                                │  │  │
│  │  │ SET name=?, category=?, unit=?, description=?                   │  │  │
│  │  │ WHERE id = ? AND (supplier can verify ownership)                │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  Supplier Pricing (price, stock, status) - INLINE EDIT                 │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ UPDATE supplier_products                                        │  │  │
│  │  │ SET price=?, stock_quantity=?, is_active=?                       │  │  │
│  │  │ WHERE product_id = ? AND supplier_id = CURRENT_SUPPLIER          │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  DELETE                                                                      │
│  ──────                                                                      │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  DELETE FROM supplier_products                                       │  │
│  │  WHERE product_id = ? AND supplier_id = CURRENT_SUPPLIER              │  │
│  │                                                                       │  │
│  │  ───► Check: Are there other suppliers for this product?              │  │
│  │                                                                       │  │
│  │        IF NO other suppliers ──► DELETE FROM products                  │  │
│  │                                      DELETE FROM product_variations     │  │
│  │                                                                       │  │
│  │        IF YES, other suppliers ──► Keep product (others still sell)    │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Price Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRICE CALCULATION BY ROLE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  B2C CUSTOMER (No region selected)                                           │
│  ────────────────────────────────                                           │
│  products.base_price ──────────────────────────► Displayed Price            │
│                                                                              │
│                                                                              │
│  B2C CUSTOMER (Region selected)                                              │
│  ──────────────────────────────────                                          │
│  region_products.price ─────────────────────────► Displayed Price            │
│  (if not available, fallback to products.base_price)                         │
│                                                                              │
│                                                                              │
│  B2B BUSINESS (No region selected)                                           │
│  ──────────────────────────────────                                          │
│  products.base_price ──────────────────────────► Displayed Price            │
│  (same as B2C)                                                               │
│                                                                              │
│                                                                              │
│  B2B BUSINESS (Region selected)                                              │
│  ──────────────────────────────────                                          │
│  region_products.business_price ─────────────────► Displayed Price           │
│  (if not available, use region_products.price or base_price)                 │
│                                                                              │
│                                                                              │
│  BUGÜN HALDE (All roles)                                                    │
│  ───────────────────────                                                     │
│  MIN(supplier_products.price) ─────────────────► Displayed Price            │
│  (Lowest price across all suppliers)                                         │
│                                                                              │
│  Plus comparison table showing:                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Supplier 1: ₺25.00/kg                                              │    │
│  │  Supplier 2: ₺23.50/kg  ← LOWEST (highlighted)                       │    │
│  │  Supplier 3: ₺26.00/kg                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
