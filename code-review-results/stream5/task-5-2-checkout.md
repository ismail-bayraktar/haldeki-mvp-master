# Stream 5.2: Checkout Flow Review

## Executive Summary

**Checkout Status: NOT READY for Multi-Supplier Architecture**

The current checkout flow is designed for a single-order, single-dealer model and lacks critical functionality for multi-supplier order splitting. While region-based delivery and payment integration (COD, EFT) are implemented, the system cannot handle orders containing products from multiple suppliers - a core requirement for Phase 12 multi-supplier architecture.

**Key Finding:** Orders are created as a single record in `orders` table, but multi-supplier cart items need to be split into separate orders per supplier.

---

## Current Checkout Flow

```
1. Cart Page (/sepet)
   ├─ Validates region selection
   ├─ Calculates delivery fee based on region
   └─ Redirects to /teslimat

2. Checkout Page (/teslimat)
   ├─ Step 1: Address Selection
   ├─ Step 2: Delivery Slot Selection
   ├─ Step 3: Payment Method (COD: cash/card, EFT)
   └─ Step 4: Summary & Confirmation

3. Order Placement
   ├─ Insert single order into `orders` table
   ├─ Send confirmation email to customer
   └─ Send notification email to dealers (not suppliers!)
```

---

## Critical Issues

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| **No order splitting by supplier** | CRITICAL | Multi-supplier carts fail | Implement supplier-based order splitting logic |
| **Supplier notification missing** | CRITICAL | Suppliers not notified of orders | Add supplier notification system |
| **Cart items lack supplier_id tracking** | HIGH | Cannot split orders without supplier mapping | Verify `CartItem.supplierId` is populated |
| **Payment routing unclear** | MEDIUM | How are payments allocated to suppliers? | Define payment distribution logic |
| **Order status per supplier not tracked** | MEDIUM | Cannot track individual supplier fulfillment | Add sub-order status tracking |

---

## Region-Based Delivery

### Current Implementation

**Location:** `src/pages/Cart.tsx`, `src/pages/Checkout.tsx`

```typescript
// Region-based delivery fee calculation
const regionDetails = getSelectedRegionDetails();
const freeDeliveryThreshold = regionDetails?.free_delivery_threshold ?? null;
const baseDeliveryFee = regionDetails?.delivery_fee ?? null;

const deliveryFee = total >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
```

**How it works:**
1. User must select region before checkout (enforced in Cart and Checkout)
2. Delivery fee fetched from `regions.delivery_fee`
3. Free delivery threshold checked against cart total
4. Delivery slots fetched from `regions.delivery_slots` JSONB column

### Issues

- **No region validation per cart item:** System doesn't check if each product is available in selected region during checkout
- **Region products not re-validated:** Prices and availability from `region_products` table are not re-validated at checkout time
- **No min order amount enforcement:** `regions.min_order_amount` is displayed but not enforced in checkout flow

### Fixes

```typescript
// 1. Validate all cart items are available in selected region
const validateRegionAvailability = async (items: CartItem[], regionId: string) => {
  const productIds = items.map(i => i.productId);
  const { data: regionProducts } = await supabase
    .from('region_products')
    .select('product_id, is_active, stock_quantity')
    .eq('region_id', regionId)
    .in('product_id', productIds);

  const unavailable = items.filter(item => {
    const rp = regionProducts?.find(rp => rp.product_id === item.productId);
    return !rp || !rp.is_active || rp.stock_quantity < item.quantity;
  });

  return unavailable;
};

// 2. Enforce minimum order amount
if (total < regionDetails.min_order_amount) {
  toast.error(`Minimum sipariş tutarı: ${regionDetails.min_order_amount}₺`);
  return;
}

// 3. Re-validate prices at checkout
const revalidatePrices = async (items: CartItem[], regionId: string) => {
  const productIds = items.map(i => i.productId);
  const { data: regionProducts } = await supabase
    .from('region_products')
    .select('product_id, price')
    .eq('region_id', regionId)
    .in('product_id', productIds);

  // Update cart items with current prices
  // Show warning if prices changed
};
```

---

## Multi-Supplier Order Splitting

### Current State

**Status: NOT SUPPORTED**

The checkout creates a single order record with all cart items, regardless of supplier:

```typescript
// src/pages/Checkout.tsx:179-187
const orderItems = items.map(item => ({
  productId: item.productId,
  productName: item.product.name,
  quantity: item.quantity,
  unitPrice: item.product.price,
  totalPrice: item.quantity * item.product.price,
  variantId: item.selectedVariant?.id || null,
  variantLabel: item.selectedVariant?.label || null,
}));

// Single order inserted
await supabase.from('orders').insert([{
  user_id: user.id,
  region_id: selectedRegion.id,
  items: orderItems,
  // ... no supplier_id!
}]);
```

**Problem:** If cart contains:
- Product A from Supplier X
- Product B from Supplier Y

Both are placed in ONE order, but suppliers need SEPARATE orders to fulfill independently.

### Required Implementation

```typescript
// 1. Group cart items by supplier
const groupItemsBySupplier = (items: CartItem[]) => {
  const groups = new Map<string | null, CartItem[]>();

  items.forEach(item => {
    const supplierId = item.supplierId || 'warehouse'; // null = warehouse stock
    if (!groups.has(supplierId)) {
      groups.set(supplierId, []);
    }
    groups.get(supplierId)!.push(item);
  });

  return groups;
};

// 2. Create separate orders per supplier
const createSplitOrders = async (
  items: CartItem[],
  userId: string,
  regionId: string,
  shippingAddress: ShippingAddress,
  deliverySlot: DeliverySlot
) => {
  const supplierGroups = groupItemsBySupplier(items);
  const orders = [];

  for (const [supplierId, supplierItems] of supplierGroups.entries()) {
    const supplierTotal = supplierItems.reduce((sum, item) =>
      sum + (item.unitPriceAtAdd * item.quantity), 0
    );

    const { data: order } = await supabase.from('orders').insert([{
      user_id: userId,
      region_id: regionId,
      supplier_id: supplierId === 'warehouse' ? null : supplierId,
      status: 'pending',
      total_amount: supplierTotal,
      shipping_address: shippingAddress,
      delivery_slot: deliverySlot,
      items: supplierItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPriceAtAdd,
        totalPrice: item.unitPriceAtAdd * item.quantity,
        supplierId: item.supplierId,
        variantId: item.selectedVariant?.id,
        variantLabel: item.selectedVariant?.label,
      })),
    }]).select().single();

    orders.push(order);
  }

  return orders;
};

// 3. Link orders with parent order ID
// Add parent_order_id column to orders table for grouping
```

### Order Structure (Multi-Supplier)

```
Parent Order (Virtual Group - NOT in DB)
├─ Order #1 (Supplier A - Aliğa Tedarik)
│   ├─ Product X (Tomatoes) - 5kg
│   ├─ Product Y (Cucumbers) - 3kg
│   └─ Total: 150₺
├─ Order #2 (Supplier B - Menemen Tarım)
│   ├─ Product Z (Peppers) - 2kg
│   └─ Total: 80₺
└─ Order #3 (Warehouse Stock)
    ├─ Product W (Potatoes) - 10kg
    └─ Total: 50₺

Customer pays: 280₺ + delivery fee
Customer receives: 1 order confirmation email with all 3 sub-orders
```

---

## Payment Integration

### Current Methods

**Implemented:**
- ✅ Cash on Delivery (COD) - cash
- ✅ Cash on Delivery (COD) - card
- ✅ EFT/Bank Transfer
- ❌ Online payment (Stripe, iyzico - not implemented)

**Location:** `src/pages/Checkout.tsx:499-596`

### How Payments Are Handled Per Supplier

**Current:**
```typescript
// Single payment for entire cart
payment_method: "cash" | "card" | "eft"
payment_method_details: { type: "cash" | "card" }
total_amount: grandTotal // All items combined
```

**Gap Analysis:**

1. **COD Payment Splitting:**
   - ❌ No logic to allocate COD payment to multiple suppliers
   - ❌ Dealer collects full payment, but how much goes to each supplier?
   - **Needed:** Payment allocation rules

2. **EFT Payment Splitting:**
   - ❌ Customer makes single EFT, but suppliers need separate payments
   - ❌ No tracking of which supplier was paid what amount
   - **Needed:** Multi-account EFT instructions or payment distribution

3. **Payment Reconciliation:**
   - ❌ No tracking of supplier payments
   - ❌ No payment status per supplier order
   - **Needed:** `supplier_payments` junction table

### Required: Payment Distribution Logic

```sql
-- New table for tracking payments to suppliers
CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  supplier_id UUID REFERENCES suppliers(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```typescript
// Payment distribution for split orders
const distributePayment = async (
  orders: Order[],
  paymentMethod: string,
  totalAmount: number
) => {
  const paymentRecords = [];

  for (const order of orders) {
    if (order.supplier_id) {
      // Supplier order - track payment to supplier
      paymentRecords.push({
        order_id: order.id,
        supplier_id: order.supplier_id,
        amount: order.total_amount,
        payment_method: paymentMethod,
        payment_status: 'pending',
      });
    } else {
      // Warehouse order - platform keeps payment
      // No supplier payment needed
    }
  }

  await supabase.from('supplier_payments').insert(paymentRecords);
};
```

---

## Order Confirmation

### Current Flow

**Location:** `src/pages/Checkout.tsx:231-278`

```typescript
// 1. Customer notification
await sendOrderConfirmation(
  customerEmail,
  customerName,
  orderId,
  selectedRegion.name,
  grandTotal,
  orderItems,
  address,
  deliveryNote
);

// 2. Dealer notification (region-based dealers)
const { data: dealers } = await supabase
  .from('dealers')
  .select('contact_email, name')
  .contains('region_ids', [selectedRegion.id])
  .eq('is_active', true);

for (const dealer of dealers) {
  await sendOrderNotification(
    dealer.contact_email,
    orderId,
    selectedRegion.name,
    grandTotal
  );
}
```

### Supplier Notification

**Current Status: NOT IMPLEMENTED**

- ❌ Suppliers are NOT notified when their products are ordered
- ❌ Only dealers (region-based) receive notifications
- ❌ No supplier order management interface

**Needed:**

1. **Supplier Notification Email:**
```typescript
// Add to Checkout.tsx after order creation
for (const order of orders) {
  if (order.supplier_id) {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('contact_email, name')
      .eq('id', order.supplier_id)
      .single();

    if (supplier?.contact_email) {
      await sendSupplierOrderNotification(
        supplier.contact_email,
        supplier.name,
        order.id,
        order.items,
        order.shipping_address,
        order.delivery_slot
      );
    }
  }
}
```

2. **Supplier Order Dashboard:**
   - Suppliers need to view and manage their orders
   - Update order status (confirmed, preparing, ready)
   - Mark items as fulfilled

3. **In-App Notifications:**
   - Real-time notifications for new orders
   - Order status updates via WebSocket or polling

### Improvements

```typescript
// New email function for supplier notifications
const sendSupplierOrderNotification = async (
  email: string,
  supplierName: string,
  orderId: string,
  items: OrderItem[],
  shippingAddress: ShippingAddress,
  deliverySlot: DeliverySlot
) => {
  const dashboardUrl = `${window.location.origin}/tedarikci/siparisler`;
  return sendEmail({
    to: email,
    toName: supplierName,
    templateType: 'supplier_new_order',
    templateData: {
      supplierName,
      orderId,
      items,
      shippingAddress,
      deliverySlot,
      dashboardUrl
    }
  });
};

// Update useEmailService.ts to export new function
```

---

## Test Scenarios

| Scenario | Expected | Status | Notes |
|----------|----------|--------|-------|
| **Single supplier checkout** | Single order created, supplier notified | ❌ FAIL | No supplier notification implemented |
| **Multi-supplier checkout** | Orders split by supplier, each notified | ❌ FAIL | No order splitting logic |
| **Region-based delivery** | Correct delivery fee & slots based on region | ⚠️ PARTIAL | Works but no re-validation |
| **COD payment** | Payment allocated to suppliers | ❌ FAIL | No payment distribution |
| **EFT payment** | Instructions shown, payment tracked per supplier | ⚠️ PARTIAL | Instructions shown, no supplier tracking |
| **Supplier notification** | Email sent to supplier on order | ❌ FAIL | Not implemented |
| **Dealer notification** | Email sent to region dealers | ✅ PASS | Working correctly |
| **Min order amount** | Enforced before checkout | ❌ FAIL | Only displayed, not enforced |
| **Region availability check** | Validate products in region at checkout | ❌ FAIL | Not checked |

---

## Required Changes Summary

### 1. Database Schema Changes

```sql
-- Add supplier_id to orders table
ALTER TABLE orders ADD COLUMN supplier_id UUID REFERENCES suppliers(id);

-- Add parent_order_id for grouping split orders
ALTER TABLE orders ADD COLUMN parent_order_id UUID REFERENCES orders(id);

-- Create supplier_payments table
CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  supplier_id UUID REFERENCES suppliers(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  transaction_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Code Changes

**High Priority:**
1. Implement `groupItemsBySupplier()` in `Checkout.tsx`
2. Create `createSplitOrders()` to insert multiple orders
3. Add supplier notification to `useEmailService.ts`
4. Implement payment distribution logic
5. Add region availability validation at checkout

**Medium Priority:**
6. Enforce minimum order amount
7. Re-validate prices at checkout
8. Create supplier order dashboard
9. Add payment reconciliation tracking

### 3. Email Templates

**New templates needed:**
- `supplier_new_order` - Notify suppliers of new orders
- `supplier_order_confirmation` - Confirm supplier order acceptance
- `supplier_order_reminder` - Remind suppliers of pending orders

---

## Conclusion

**Checkout Readiness: 35%**

The checkout flow has solid foundations (region-based delivery, COD/EFT support, dealer notifications) but is NOT ready for multi-supplier architecture. Critical missing pieces:

1. **Order Splitting Logic** - Must split cart into separate orders per supplier
2. **Supplier Notifications** - Suppliers must be notified of orders
3. **Payment Distribution** - Track payments to each supplier
4. **Supplier Dashboard** - Interface for suppliers to manage orders

**Recommendation:** Implement multi-supplier order splitting BEFORE launching Phase 12, or restrict checkout to single-supplier carts only.

**Estimated Effort:** 3-5 days for full multi-supplier checkout implementation.
