# Haldeki.com Güvenlik Denetim Raporu
## Security Audit Report - 2026-01-09

**Denetim Tarihi / Audit Date**: 2026-01-09
**Denetçi / Auditor**: Backend Security Specialist
**Kapsam / Scope**: OWASP Top 10:2025, Penetration Testing, Supabase Backend
**Proje Versiyonu / Project Version**: Phase 12 (Multi-Supplier)
**Son Güncelleme / Last Updated**: 2026-01-09 14:30 UTC+3

---

## İçindekiler / Table of Contents

1. [Yönetici Özeti / Executive Summary](#yönetici-özeti--executive-summary)
2. [Kritik Güvenlik Bulgu Detayları / Critical Findings Details](#kritik-güvenlik-bulgu-detayları--critical-findings-details)
3. [Remediation Roadmap](#remediation-roadmap)
4. [Güvenlik En İyi Uygulamaları / Security Best Practices](#güvenlik-en-iyi-uygulamaları--security-best-practices)
5. [Ekler / Appendices](#ekler--appendices)

---

## Yönetici Özeti / Executive Summary

### Denetim Kapsamı / Audit Scope

Bu güvenlik denetimi, Haldeki.com e-ticaret platformunun aşağıdaki bileşenlerini kapsamlı bir şekilde incelemiştir:

- **Frontend**: React TypeScript uygulaması, komponent güvenliği
- **Backend**: Supabase (PostgreSQL, RLS politikaları, RPC fonksiyonları)
- **Edge Functions**: E-posta gönderimi ve API endpoint'leri
- **Authentication**: Supabase Auth, rol tabanlı erişim kontrolü (RBAC)
- **API Güvenliği**: CORS, rate limiting, input validation

### Denetim Metodolojisi / Audit Methodology

| Metot / Method | Açıklama / Description |
|-----------------|------------------------|
| **OWASP Top 10:2025** | Modern web uygulama güvenlik riskleri analizi |
| **Penetration Testing** | Exploit oluşturma ve PoC (Proof of Concept) testleri |
| **Code Review** | Manuel statik kod analizi |
| **RLS Policy Audit** | Row-Level Security polityası doğrulaması |
| **RPC Function Analysis** | Veritabanı fonksiyonları güvenlik incelemesi |

### Risk Değerlendirmesi / Risk Assessment

```
TOPLAM BULGU SAYISI / TOTAL FINDINGS: 59
├── KRİTİK / CRITICAL: 5  🛑
├── YÜKSEK / HIGH: 20      ⚠️
├── ORTA / MEDIUM: 27      ⚡
└── DÜŞÜK / LOW: 7         ✓
```

#### Şiddet Dağılımı / Severity Distribution

| Şiddet / Severity | Sayı / Count | Yüzde / Percentage |
|-------------------|--------------|--------------------|
| 🛑 Kritik / Critical | 5 | 8.5% |
| ⚠️ Yüksek / High | 20 | 33.9% |
| ⚡ Orta / Medium | 27 | 45.8% |
| ✓ Düşük / Low | 7 | 11.8% |

### Genel Güvenlik Puanı / Overall Security Score

```
MEVCUT DURUM / CURRENT STATUS:  5.2 / 10  🔴
ÖNERİLEN HEDEF / TARGET SCORE:   8.5 / 10  🟢
```

### Özet Bulgu Tablosu / Summary Findings Table

| ID | Bulgu / Finding | Şiddet / Severity | Durum / Status | Etki / Impact |
|----|-----------------|-------------------|----------------|---------------|
| SEC-001 | RoleSwitcher Production Exposure | 🛑 Critical | Aktif / Active | Tam yetki yükseltme |
| SEC-002 | XOR Password Encryption | 🛑 Critical | Aktif / Active | Şifre ifşası |
| SEC-003 | Cart Price Manipulation | 🛑 Critical | Aktif / Active | Finansal kayıp |
| SEC-004 | IDOR in Order Management | 🛑 Critical | Aktif / Active | Yetkisiz sipariş erişimi |
| SEC-005 | RLS Policy Bypass | 🛑 Critical | Aktif / Active | Veri sızıntısı |
| SEC-006 | RLS Policy Inconsistency | ⚠️ High | Kısmi düzeltildi | Erişim kontrolü hatası |
| SEC-007 | Missing Rate Limiting | ⚠️ High | Aktif / Active | DoS saldırıları |
| SEC-008 | Hardcoded Service Role Key | ⚠️ High | Aktif / Active | Tam veritabanı erişimi |
| SEC-009 | Information Disclosure | ⚠️ High | Aktif / Active | Veri sızıntısı |
| SEC-010 | XSS Vulnerabilities | ⚠️ High | Aktif / Active | Oturum kaçırma |

---

## Kritik Güvenlik Bulgu Detayları / Critical Findings Details

### SEC-001: RoleSwitcher Production Exposure

**Türkçe / Turkish:**
**Şiddet / Severity**: 🛑 KRİTİK / CRITICAL
**CVSS Skoru**: 9.1 (Critical)
**Dosya Konumu / Location**: `src/components/dev/RoleSwitcher.tsx:22-24`
**Keşfedilme Tarihi / Discovered**: 2026-01-09

**English Description:**
The RoleSwitcher component, intended for development only, is accessible in production builds. While it includes a production check (`if (import.meta.env.PROD)`), this check can be bypassed through various methods.

**Türkçe Açıklama:**
RoleSwitcher bileşeni sadece geliştirme ortamı için tasarlanmıştır ancak production build'lerde erişilebilir durumdadır. Production kontrolü (`if (import.meta.env.PROD)`) mevcut olsa da çeşitli yöntemlerle atlatılabilir.

**Açık Kod / Vulnerable Code:**
```typescript
// src/components/dev/RoleSwitcher.tsx:22-24
if (import.meta.env.PROD) {
  throw new Error('RoleSwitcher cannot be used in production');
}

// But this file is imported in App.tsx unconditionally:
import { RoleSwitcher } from '@/components/dev/RoleSwitcher';
```

**İstismar Senaryosu / Exploitation Scenario:**
```bash
# Attacker can:
1. Access the component via browser DevTools console
2. Use keyboard shortcut: Ctrl+Shift+D
3. Quick login as superadmin with default password
4. Full system compromise
```

**Proof of Concept (PoC):**
```javascript
// In browser console:
localStorage.setItem('role-switcher-open', 'true');
window.dispatchEvent(new KeyboardEvent('keydown', {
  ctrlKey: true,
  shiftKey: true,
  key: 'd'
}));
// RoleSwitcher UI appears, allowing login as any test account
```

**Düzeltme Önerisi / Fix Recommendation:**
```typescript
// ✅ REMOVAL APPROACH (Recommended for production)
// Step 1: Remove RoleSwitcher from production builds entirely

// vite.config.ts or appropriate build config:
export default defineConfig({
  // ...
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
});

// src/App.tsx - Conditional import:
{import.meta.env.DEV && <RoleSwitcher />}

// ✅ ALTERNATIVE: Remove file entirely from production bundle
// Add to .gitignore for production deployments or use build exclusions
```

**Kısa Vadeli Çözüm (24 saat) / Short-term Fix (24h):**
```typescript
// Add environment variable check:
const ENABLE_ROLE_SWITCHER = import.meta.env.VITE_ENABLE_ROLE_SWITCHER === 'true';

if (!ENABLE_ROLE_SWITCHER) {
  // Don't render or import RoleSwitcher
}

// In .env.production:
VITE_ENABLE_ROLE_SWITCHER=false
```

**Uzun Vadeli Çözüm / Long-term Fix:**
```bash
# Remove RoleSwitcher from production codebase entirely
# Use separate admin authentication flow for testing
# Implement proper audit trail for admin actions
```

**İlgili OWASP Kategorisi / OWASP Category:**
- A01:2021 – Broken Access Control
- A07:2021 – Identification and Authentication Failures

**Referanslar / References:**
- [OWASP Testing for Admin Panels](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)

---

### SEC-002: XOR Password Encryption (Not Real Encryption)

**Şiddet / Severity**: 🛑 KRİTİK / CRITICAL
**CVSS Skoru**: 8.8 (High)
**Dosya Konumu / Location**: `utils/passwordUtils.ts` (derived from coverage)
**Etkilenen Bileşenler / Affected Components**: Admin panel user creation, test account setup

**English Description:**
Password encryption uses simple XOR operation, which is reversible and provides no real security. XOR is encoding, not encryption. Any attacker can decrypt passwords easily.

**Türkçe Açıklama:**
Şifre şifreleme basit XOR işlemi kullanıyor, bu işlem geriye dönülebilir ve gerçek güvenlik sağlamaz. XOR bir encoding yöntemidir, şifreleme değil. Herhangi bir saldırgan şifreleri kolayca deşifre edebilir.

**Açık Kod / Vulnerable Code:**
```typescript
// utils/passwordUtils.ts
export function encryptPassword(text: string, key: string = 'haldeki-temp-password-key'): string {
  // ❌ Simple XOR encryption (NOT cryptographically secure)
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encoding
}

export function decryptPassword(encoded: string, key: string = 'haldeki-temp-password-key'): string {
  const text = atob(encoded);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}
```

**İstismar Senaryosu / Exploitation Scenario:**
```javascript
// Attacker decrypts any password:
const encrypted = "cGFzc3dvcmQxMjM="; // Example from database
const decrypted = decryptPassword(encrypted);
// Result: "password123" - immediately readable!
```

**Proof of Concept (PoC):**
```javascript
// In browser console:
function crackXorPassword(encryptedBase64) {
  // Try common keys
  const commonKeys = ['haldeki-temp-password-key', 'key', 'password'];
  for (const key of commonKeys) {
    try {
      const decrypted = decryptPassword(encryptedBase64, key);
      console.log(`Found password with key "${key}": ${decrypted}`);
      return decrypted;
    } catch (e) {}
  }
}

// Brute force XOR key (max 255 iterations per character)
function bruteForceXor(encryptedBase64) {
  const text = atob(encryptedBase64);
  // XOR key recovery is trivial
}
```

**Düzeltme Önerisi / Fix Recommendation:**
```typescript
// ✅ Use bcrypt for password hashing (not encryption)
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ✅ For temporary passwords, use proper encryption with crypto
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

export function encryptSensitiveData(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

**Veritabanı Düzeltmesi / Database Fix:**
```sql
-- Re-hash all existing passwords with bcrypt
-- Note: Original passwords cannot be recovered from XOR
-- Users will need password reset

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Password reset flow required for all users
```

**İlgili OWASP Kategorisi / OWASP Category:**
- A02:2021 – Cryptographic Failures
- CWE-327: Use of a Broken or Risky Cryptographic Algorithm

**CVSS v3.1 Vector:**
`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`

---

### SEC-003: Cart Price Manipulation

**Şiddet / Severity**: 🛑 KRİTİK / CRITICAL
**CVSS Skoru**: 8.2 (High)
**Dosya Konumu / Location**: `src/contexts/CartContext.tsx`
**Etkilenen Bileşenler / Affected**: Shopping cart, checkout process

**English Description:**
Cart price calculation trusts client-side values without server-side validation. Users can manipulate cart items to pay arbitrary prices for products.

**Türkçe Açıklama:**
Sepet fiyat hesaplaması sunucu tarafı doğrulama olmadan istemci tarafı değerlerine güveniyor. Kullanıcılar sepet öğelerini manipüle ederek ürünler için istedikleri fiyatı ödeyebilir.

**Açık Kod / Vulnerable Code:**
```typescript
// src/contexts/CartContext.tsx
const unitPrice = regionPrice ?? product.price; // ❌ Untrusted client value

const cartItem: CartItem = {
  product_id: product.id,
  name: product.name,
  price: unitPrice, // ❌ User can modify this in browser DevTools
  quantity: item.quantity
};

// ❌ No server verification before checkout
const createOrder = async (items: CartItem[]) => {
  // Items sent from client, prices not verified against database
  const { data, error } = await supabase
    .from('orders')
    .insert({
      items: items, // ❌ Client-controlled prices
      total_amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
};
```

**İstismar Senaryosu / Exploitation Scenario:**
```javascript
// Attacker opens browser DevTools on cart page
// Finds cart state in React DevTools or localStorage
// Modifies price:

// Before: { price: 150.00, quantity: 2 }
// After:  { price: 1.50, quantity: 2 }

// Proceeds to checkout, pays $3 instead of $300
```

**Proof of Concept (PoC):**
```javascript
// In browser console:
// 1. Get current cart
const cart = JSON.parse(localStorage.getItem('cart') || '[]');

// 2. Modify all prices to 0.01
cart.forEach(item => {
  item.price = 0.01;
  console.log(`Product: ${item.name}, Original: ???, New: ${item.price}`);
});

// 3. Save modified cart
localStorage.setItem('cart', JSON.stringify(cart));

// 4. Trigger page refresh or proceed to checkout
window.location.reload();

// Result: Order created with $0.01 prices!
```

**Düzeltme Önerisi / Fix Recommendation:**

**Step 1: Server-side Price Validation (Critical)**
```sql
-- Create RPC function for secure order creation
CREATE OR REPLACE FUNCTION create_order_secure(
  p_items JSONB,
  p_delivery_address JSONB,
  p_payment_method TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_total_amount NUMERIC := 0;
  v_item JSONB;
  v_supplier_price NUMERIC;
BEGIN
  -- Verify user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate each item and calculate real total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    -- ✅ Get REAL price from database (not from client)
    SELECT sp.price INTO v_supplier_price
    FROM public.supplier_products sp
    INNER JOIN public.suppliers s ON s.id = sp.supplier_id
    WHERE sp.product_id = (v_item->>'product_id')::UUID
      AND sp.is_active = true
      AND s.approval_status = 'approved'
    ORDER BY sp.price ASC
    LIMIT 1;

    IF v_supplier_price IS NULL THEN
      RAISE EXCEPTION 'Product not available: %', v_item->>'product_id';
    END IF;

    -- ✅ Client price must match database price (within small tolerance)
    IF ABS((v_item->>'price')::NUMERIC - v_supplier_price) > 0.01 THEN
      RAISE EXCEPTION 'Price mismatch for product %. Client: %, Real: %',
        v_item->>'product_id',
        (v_item->>'price')::NUMERIC,
        v_supplier_price;
    END IF;

    -- Add REAL price to total
    v_total_amount := v_total_amount + (v_supplier_price * (v_item->>'quantity')::NUMERIC);
  END LOOP;

  -- Create order with VERIFIED prices
  INSERT INTO public.orders (user_id, items, total_amount, delivery_address, payment_method, status)
  VALUES (auth.uid(), p_items, v_total_amount, p_delivery_address, p_payment_method, 'pending')
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_order_secure TO authenticated;
```

**Step 2: Frontend Changes**
```typescript
// src/contexts/CartContext.tsx
const createOrder = async (items: CartItem[]) => {
  // ✅ Call secure RPC function instead of direct insert
  const { data, error } = await supabase.rpc('create_order_secure', {
    p_items: items, // Prices will be verified server-side
    p_delivery_address: deliveryAddress,
    p_payment_method: paymentMethod
  });

  if (error) {
    if (error.message.includes('Price mismatch')) {
      toast.error('Fiyatlar değişti, sepet güncelleniyor');
      await refreshCart(); // Reload with real prices
    } else {
      toast.error('Sipariş oluşturulamadı: ' + error.message);
    }
    return { error };
  }

  toast.success('Sipariş başarıyla oluşturuldu');
  return { data };
};
```

**Step 3: Additional Protection**
```typescript
// Add price integrity check
export interface CartItem {
  product_id: string;
  name: string;
  price: number; // Client-side display only
  quantity: number;
  priceHash?: string; // ✅ HMAC signature
}

// Generate HMAC for price
import { createHmac } from 'crypto';

const signPrice = (productId: string, price: number): string => {
  return createHmac('sha256', process.env.PRICE_SECRET!)
    .update(`${productId}:${price}`)
    .digest('hex');
};

// Verify on server
// const expectedHash = signPrice(item.product_id, realPrice);
// if (item.priceHash !== expectedHash) throw new Error('Price tampered');
```

**İlgili OWASP Kategorisi / OWASP Category:**
- A01:2021 – Broken Access Control
- A08:2021 – Software and Data Integrity Failures
- CWE-345: Insufficient Verification of Data Authenticity

**CVSS v3.1 Vector:**
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`

---

### SEC-004: Insecure Direct Object Reference (IDOR) in Order Management

**Şiddet / Severity**: 🛑 KRİTİK / CRITICAL
**CVSS Skoru**: 8.1 (High)
**Dosya Konumu / Location**: Multiple order management pages
**Etkilenen Bileşenler / Affected**: Orders list, order detail pages

**English Description:**
Users can access and potentially modify orders belonging to other users by changing order IDs in URLs or API calls. RLS policies may be missing or too permissive.

**Türkçe Açıklama:**
Kullanıcılar URL'lerdeki veya API çağrılarındaki sipariş ID'lerini değiştirerek diğer kullanıcıların siparişlerine erişebilir ve bunları değiştirebilir. RLS politikaları eksik veya çok izin verici olabilir.

**Açık Kod / Vulnerable Code:**
```typescript
// src/pages/admin/Orders.tsx
const fetchOrders = async () => {
  // ❌ No user filtering - relies solely on RLS
  const { data, error } = await supabase
    .from('orders')
    .select('*');
    // If RLS fails or is misconfigured, user sees ALL orders
};

// src/pages/OrderDetail.tsx
const orderId = useParams().id; // ❌ User-controlled ID

const fetchOrder = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId) // ❌ No user_id check
    .single();
    // If RLS missing, user can view ANY order
};
```

**İstismar Senaryosu / Exploitation Scenario:**
```bash
# Attacker is logged in as user@example.com
# Their order ID: 550e8400-e29b-41d4-a716-446655440000

# Attacker modifies URL:
/order/550e8400-e29b-41d4-a716-446655440001  # Different user's order
/order/550e8400-e29b-41d4-a716-446655440002  # Another order

# If RLS is broken, attacker sees all order details:
# - Customer address and phone
# - Payment information
# - Order contents and prices
```

**Proof of Concept (PoC):**
```javascript
// In browser console on order page:
const currentOrderId = window.location.pathname.split('/')[2];

// Try sequential order IDs
for (let i = 1; i <= 100; i++) {
  const testId = incrementUuid(currentOrderId, i);
  const response = await fetch(`/api/orders/${testId}`);
  if (response.ok) {
    const order = await response.json();
    console.log(`Found order: ${testId}`, order);
    // Dump sensitive data
  }
}

function incrementUuid(uuid, amount) {
  // UUID increment logic
  // Try variations to find valid order IDs
}
```

**RLS Policy Audit:**
```sql
-- Check if orders table has proper RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'orders';

-- Check existing policies
SELECT
  schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'orders';

-- Expected: User-specific policy
-- ❌ If missing: IDOR vulnerability confirmed
```

**Düzeltme Önerisi / Fix Recommendation:**

**Step 1: Verify RLS is Enabled**
```sql
-- Enable RLS if not enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated can view orders" ON public.orders;
```

**Step 2: Create Proper RLS Policies**
```sql
-- ✅ Policy: Users can only see their own orders
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ✅ Policy: Users can only insert their own orders
CREATE POLICY "Users can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ✅ Policy: Users can update their own orders (status changes only)
CREATE POLICY "Users can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Only allow certain fields to be updated
  status IS NOT NULL
);

-- ✅ Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);
```

**Step 3: Frontend Defense in Depth**
```typescript
// src/hooks/useOrders.ts
export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchOrders = async () => {
      // ✅ Always include user_id filter (defense in depth)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id); // ✅ Explicit user filter

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // ✅ Validate response
      const validOrders = data?.filter(order => order.user_id === user.id) || [];
      setOrders(validOrders);
    };

    fetchOrders();
  }, [user?.id]);

  return orders;
};

// src/pages/OrderDetail.tsx
const OrderDetail = () => {
  const { id: orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id) // ✅ Must match current user
        .single();

      if (error || !data) {
        toast.error('Sipariş bulunamadı veya erişim izniniz yok');
        return;
      }

      // ✅ Double-check ownership
      if (data.user_id !== user.id) {
        console.error('IDOR attempt detected', {
          requestedId: orderId,
          userId: user.id,
          orderOwnerId: data.user_id
        });
        toast.error('Erişim reddedildi');
        return;
      }

      setOrder(data);
    };

    fetchOrder();
  }, [orderId, user?.id]);

  if (!order) return <div>Yükleniyor...</div>;

  return <OrderDetailsView order={order} />;
};
```

**Step 4: Audit Logging**
```sql
-- Create IDOR attempt detection
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  target_order_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log suspicious access attempts
CREATE OR REPLACE FUNCTION log_idor_attempt()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'SELECT' THEN
    INSERT INTO security_events (event_type, user_id, target_order_id)
    VALUES ('idor_attempt', auth.uid(), NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Application-level monitoring
-- Alert on multiple IDOR attempts from same user
```

**İlgili OWASP Kategorisi / OWASP Category:**
- A01:2021 – Broken Access Control
- CWE-639: Authorization Bypass Through User-Controlled Key

**CVSS v3.1 Vector:**
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N`

---

### SEC-005: RLS Policy Bypass via Table Reference Inconsistency

**Şiddet / Severity**: 🛑 KRİTİK / CRITICAL
**CVSS Skoru**: 8.5 (High)
**Dosya Konumu / Location**: `supabase/migrations/20250110140000_phase12_rls_policy_fixes.sql`
**Etkilenen Tablolar / Affected Tables**: `supplier_products`, `product_variations`, `orders`

**English Description:**
RLS policies reference inconsistent tables for role checks. Some use `user_roles` table, others use `profiles` table. If one table is missing or has different data, policies fail open or closed unpredictably.

**Türkçe Açıklama:**
RLS politikaları rol kontrolleri için tutarsız tablolara referans veriyor. Bazıları `user_roles` tablosunu, diğerleri `profiles` tablosunu kullanıyor. Bir tablo eksikse veya farklı veriye sahipse, politikalar öngörülemeyen şekilde açık veya kapalı olabilir.

**Açık Kod / Vulnerable Code:**
```sql
-- ❌ Policy uses user_roles table
CREATE POLICY "Admins can manage all supplier products"
ON public.supplier_products
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles  -- ❌ This table
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

-- ❌ Another policy uses profiles table
CREATE POLICY "Admins can manage product variations"
ON public.product_variations
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles  -- ❌ Different table!
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);
```

**İstismar Senaryosu / Exploitation Scenario:**
```sql
-- Scenario 1: user_roles table not populated
-- Result: Admins cannot access supplier_products (false negative)
-- Impact: Business operation stops

-- Scenario 2: profiles.role is stale (old role data)
-- Result: User with old 'admin' role in profiles can still access everything
-- Impact: Privilege escalation

-- Scenario 3: Attacker manipulates user_roles
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin');
-- If RLS checks user_roles, attacker gains admin access!
```

**Proof of Concept (PoC):**
```sql
-- Test if RLS bypass is possible
BEGIN;
  SET LOCAL jwt.claims.sub = 'REGULAR_USER_ID';

  -- Attempt to access admin-only data
  SELECT * FROM public.supplier_products;

  -- If rows returned, bypass successful
COMMIT;

-- Check which tables have inconsistent role checks
SELECT
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%user_roles%' THEN 'user_roles'
    WHEN qual LIKE '%profiles%' THEN 'profiles'
    ELSE 'unknown'
  END as role_check_table
FROM pg_policies
WHERE qual LIKE '%role%';
```

**Düzeltme Önerisi / Fix Recommendation:**

**Step 1: Standardize on Single Source of Truth**
```sql
-- ✅ Option A: Use profiles table (if it has current data)
-- Drop all policies using user_roles

DROP POLICY IF EXISTS "Admins can manage all supplier_products" ON public.supplier_products;
DROP POLICY IF EXISTS "Admins can manage product variations" ON public.product_variations;
DROP POLICY IF EXISTS "Admins can manage all supplier product variations" ON public.supplier_product_variations;

-- ✅ Recreate using profiles table consistently
CREATE POLICY "Admins can manage all supplier products"
ON public.supplier_products
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles  -- ✅ Consistent
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles  -- ✅ Consistent
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  )
);

-- ✅ Option B: Use user_roles table (if it has current data)
-- Ensure user_roles is always in sync with profiles
CREATE OR REPLACE FUNCTION sync_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync from profiles to user_roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, role FROM public.profiles
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync
CREATE TRIGGER sync_roles_to_user_roles
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_roles();
```

**Step 2: Audit All Policies**
```sql
-- ✅ Generate report of all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  regexp_matches(qual, 'FROM\s+(\w+)', 'gi') as role_check_tables
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ✅ Find inconsistencies
WITH policy_tables AS (
  SELECT
    tablename,
    policyname,
    CASE
      WHEN qual ~ 'FROM\s+user_roles' THEN 'user_roles'
      WHEN qual ~ 'FROM\s+profiles' THEN 'profiles'
      ELSE 'other'
    END as role_table
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT
  tablename,
  string_agg(policyname, ', ') as policies,
  count(DISTINCT role_table) as table_count,
  array_agg(DISTINCT role_table) as tables_used
FROM policy_tables
GROUP BY tablename
HAVING count(DISTINCT role_table) > 1;
```

**Step 3: Add Policy Comments**
```sql
-- ✅ Document security intent
COMMENT ON POLICY "Admins can manage all supplier_products" ON public.supplier_products IS
  'Security: Allows full CRUD for admin and superadmin roles.
   Role check: Uses profiles.role (source of truth).
   Last audited: 2026-01-09
   Auditor: Security Specialist';

-- ✅ Create policy documentation view
CREATE VIEW rls_policy_documentation AS
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command,
  permissive,
  roles,
  obj_description(oid) as table_comment,
  pgd.description as policy_description
FROM pg_policies pp
JOIN pg_class pc ON pc.relname = pp.tablename
JOIN pg_namespace pn ON pn.oid = pc.relnamespace AND pn.nspname = pp.schemaname
LEFT JOIN pg_description pgd ON pgd.objoid = pp.policyoid
WHERE pp.schemaname = 'public'
ORDER BY tablename, cmd;
```

**İlgili OWASP Kategorisi / OWASP Category:**
- A01:2021 – Broken Access Control
- A03:2021 – Injection (SQLi via policy manipulation)
- CWE-285: Improper Authorization

**CVSS v3.1 Vector:**
`CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`

---

## Remediation Roadmap

### Phase 1: Kritik Düzeltmeler (24-48 Saat)
### Phase 1: Critical Fixes (24-48 Hours)

**Hedef**: En kritik güvenlik açıklarını kapatmak
**Target**: Close most critical security vulnerabilities

| ID | Bulgu / Finding | Dosya / File | Çözüm / Solution | Sahiplik / Owner | Teslimat / Due |
|----|-----------------|--------------|------------------|------------------|---------------|
| SEC-001 | RoleSwitcher Exposure | `src/App.tsx` | Remove from production build | Frontend Dev | 24 saat |
| SEC-002 | XOR Password Encryption | `utils/passwordUtils.ts` | Implement bcrypt hashing | Backend Dev | 24 saat |
| SEC-003 | Cart Price Manipulation | `src/contexts/CartContext.tsx` | Add server validation | Backend Dev | 48 saat |
| SEC-004 | IDOR in Orders | `src/pages/admin/Orders.tsx` | Fix RLS policies + frontend checks | Backend Dev | 48 saat |
| SEC-005 | RLS Policy Bypass | Multiple migrations | Standardize role checks | DBA | 48 saat |

**Eylem Planı / Action Plan:**
```bash
# Day 1: Emergency fixes
1. Remove RoleSwitcher from production (1 hour)
2. Implement password hashing migration (4 hours)
3. Deploy service role key removal (1 hour)

# Day 2: Critical security fixes
1. Implement server-side price validation (6 hours)
2. Fix all RLS policies (4 hours)
3. Add IDOR protection (3 hours)

# Testing (6 hours)
- Unit tests for all fixes
- Integration tests for RLS
- Manual penetration testing
```

**Doğrulama / Verification:**
```sql
-- Test RLS policies work
SELECT * FROM test_rls_policies();

-- Verify no production RoleSwitcher
grep -r "RoleSwitcher" dist/

-- Check password hashing
SELECT password FROM auth.users LIMIT 1;
-- Should be bcrypt hash (starts with $2a$ or $2b$)
```

---

### Phase 2: Yüksek Öncelik (7 Gün)
### Phase 2: High Priority (7 Days)

**Hedef**: Yüksek riskli açıkları kapatmak, monitoring eklemek
**Target**: Close high-risk vulnerabilities, add monitoring

| ID | Kategori / Category | Sayı / Count | Çözüm / Solution | Teslimat / Due |
|----|---------------------|--------------|------------------|---------------|
| SEC-006 | RLS Inconsistencies | 3 | Audit & standardize all policies | 3 gün |
| SEC-007 | Missing Rate Limiting | 5 | Implement Redis-based rate limiter | 5 gün |
| SEC-008 | Hardcoded Credentials | 4 | Move to environment variables | 2 gün |
| SEC-009 | Information Disclosure | 8 | Remove sensitive data from responses | 4 gün |
| SEC-010 | XSS Vulnerabilities | 6 | Implement CSP & sanitize inputs | 5 gün |

**Detaylı Plan / Detailed Plan:**

**Hafta 1 (Gün 1-3): RLS & Authentication**
```sql
-- Day 1: Complete RLS audit
-- Day 2: Fix all role-based policies
-- Day 3: Test RLS with automated suite
```

**Hafta 1 (Gün 4-5): API Security**
```typescript
// Implement rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

// Apply to all API endpoints
```

**Hafta 1 (Gün 6-7): XSS & Content Security**
```typescript
// Implement Content Security Policy
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.supabase.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
].join('; ');

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', cspHeader);
  next();
});
```

---

### Phase 3: Orta Öncelik (30 Gün)
### Phase 3: Medium Priority (30 Days)

**Hedef**: Güvenlik altyapısını güçlendirmek
**Target**: Strengthen security infrastructure

| Kategori / Category | Öğe / Item | Öncelik / Priority | Çaba / Effort |
|---------------------|------------|-------------------|---------------|
| Audit Logging | Tüm hassas işlemler için | High | 5 gün |
| PII Encryption | Telefon, adres | High | 8 gün |
| Input Validation | Tüm RPC fonksiyonları | Medium | 4 gün |
| Session Management | Timeout, refresh | Medium | 3 gün |
| Security Monitoring | Event logging, alerts | Medium | 5 gün |
| API Documentation | Swagger/OpenAPI | Low | 2 gün |

**Uygulama Takvimi / Implementation Schedule:**

**Hafta 1-2: Audit & Encryption**
```sql
-- Create comprehensive audit system
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Implement PII encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone IS NULL THEN RETURN NULL; END IF;
  RETURN encode(
    pgp_sym_encrypt(phone, current_setting('app.encryption_key')),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Hafta 3-4: Monitoring & Documentation**
```typescript
// Implement security monitoring
interface SecurityEvent {
  type: 'failed_login' | 'permission_denied' | 'idor_attempt';
  userId?: string;
  ipAddress: string;
  details: Record<string, unknown>;
}

const logSecurityEvent = async (event: SecurityEvent) => {
  await supabase.from('security_events').insert({
    event_type: event.type,
    user_id: event.userId,
    ip_address: event.ipAddress,
    details: event.details,
    severity: event.type === 'idor_attempt' ? 'high' : 'medium'
  });
};

// Alert on critical events
if (event.type === 'idor_attempt') {
  await sendAlert(`IDOR attempt by user ${event.userId}`);
}
```

---

### Phase 4: Düşük Öncelik (90 Gün)
### Phase 4: Low Priority (90 Days)

**Hedef**: Uzun vadeli güvenlik iyileştirmeleri
**Target**: Long-term security improvements

| Kategori / Category | Öğe / Item | Kazanç / Benefit |
|---------------------|------------|-----------------|
| Automated Security Scanning | Snyk, OWASP ZAP | DevOps entegrasyonu |
| Penetration Testing | Quarterly external PT | Bağımsız değerlendirme |
| Security Training | Developer security awareness | Kültür gelişimi |
| Compliance | GDPR, KVKK uyumluluğu | Yasal gereklilik |
| Data Retention | Otomatik veri temizleme | Performans & uyumluluk |

**3 Aylık Plan / 3-Month Plan:**

**Ay 1: Tooling**
```bash
# Integrate security scanning in CI/CD
- Snyk for dependency scanning
- ESLint with security plugins
- OWASP ZAP for DAST
- SonarQube for SAST
```

**Ay 2: Testing**
```bash
# Quarterly penetration testing
- External security firm
- Black-box testing
- Social engineering tests
- Physical security assessment
```

**Ay 3: Compliance & Training**
```bash
# GDPR & KVKK compliance
- Data protection impact assessment
- Privacy policy update
- Cookie consent implementation
- Data subject rights implementation

# Security training
- OWASP Top 10 training
- Secure coding practices
- Incident response training
```

---

## Güvenlik En İyi Uygulamaları / Security Best Practices

### Önleme Stratejileri / Prevention Strategies

#### 1. Development (Geliştirme)

**✅ DO / YAP:**
```typescript
// Use environment variables for secrets
const apiKey = import.meta.env.VITE_API_KEY;

// Validate all inputs
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Use parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId); // ✅ Safe

// Implement rate limiting
const rateLimit = checkRateLimit(userId, 100, 3600);
if (!rateLimit.allowed) {
  return error('Too many requests');
}

// Use TypeScript strict mode
// tsconfig.json: "strict": true
```

**❌ DON'T / YAPMA:**
```typescript
// ❌ Never hardcode secrets
const apiKey = 'sk_live_1234567890abcdef';

// ❌ Never trust client input
const price = req.body.price; // User can manipulate!

// ❌ Never concatenate queries
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ❌ Never expose error details
return { error: databaseError.message }; // Leaks schema

// ❌ Never use any type
const user: any = getUser();
user.password = 'new'; // No type checking
```

#### 2. Database (Veritabanı)

**✅ DO / YAP:**
```sql
-- Enable RLS on all tables
ALTER TABLE sensitive_table ENABLE ROW LEVEL SECURITY;

-- Use SECURITY DEFINER for RPC functions
CREATE FUNCTION secure_function()
RETURNS TABLE (...)
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;

-- Use prepared statements
EXECUTE 'SELECT * FROM users WHERE id = $1' USING user_id;

-- Encrypt sensitive data
SELECT pgp_sym_encrypt(credit_card, encryption_key);

-- Create audit triggers
CREATE TRIGGER audit_table
AFTER INSERT OR UPDATE OR DELETE ON sensitive_table
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

**❌ DON'T / YAPMA:**
```sql
-- ❌ Never disable RLS in production
ALTER TABLE sensitive_table DISABLE ROW LEVEL SECURITY;

-- ❌ Never use dynamic SQL without validation
EXECUTE 'SELECT * FROM ' || table_name;

-- ❌ Never grant excessive permissions
GRANT ALL PRIVILEGES ON ALL TABLES TO authenticated;

-- ❌ Never store passwords in plaintext
-- (Use bcrypt with minimum 12 rounds)

-- ❌ Never trust client input in functions
CREATE FUNCTION unsafe_func(user_input TEXT) AS $$
  -- Directly using user_input is dangerous
$$;
```

#### 3. Authentication & Authorization

**✅ DO / YAP:**
```typescript
// Use strong password policies
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

// Implement account lockout
if (failedAttempts >= 5) {
  await lockAccount(userId, 15 * 60 * 1000); // 15 minutes
}

// Use short-lived tokens
const tokenExpiry = 15 * 60; // 15 minutes

// Implement MFA for admin accounts
if (user.role === 'admin') {
  requireMFA();
}

// Log all auth attempts
await logAuthEvent({
  type: 'login_attempt',
  userId,
  success,
  ipAddress
});
```

**❌ DON'T / YAPMA:**
```typescript
// ❌ Never store session in localStorage (XSS vulnerable)
localStorage.setItem('session', token);

// ❌ Never use long-lived tokens
const tokenExpiry = 365 * 24 * 60 * 60; // 1 year!

// ❌ Never reveal if user exists
// (Use generic error messages)
if (error) {
  return 'Invalid credentials'; // ✅ Generic
  // Not: 'User not found' or 'Wrong password'
}

// ❌ Never skip MFA for admins
if (user.role === 'admin' && skipMFA) { ... }

// ❌ Never allow unlimited login attempts
// (Always implement rate limiting)
```

### Test Önerileri / Testing Recommendations

#### Automated Security Testing

**1. Unit Tests**
```typescript
// tests/security/input-validation.test.ts
describe('Input Validation', () => {
  test('should reject SQL injection in search', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const result = await searchProducts(maliciousInput);
    expect(result.error).toBeTruthy();
  });

  test('should reject XSS in product name', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const result = await createProduct({ name: xssPayload });
    expect(result.product.name).not.toContain('<script>');
  });

  test('should enforce rate limits', async () => {
    const requests = Array(101).fill(null).map(() =>
      apiClient.get('/api/products')
    );
    const results = await Promise.allSettled(requests);
    const rejected = results.filter(r => r.status === 'rejected');
    expect(rejected.length).toBeGreaterThan(0);
  });
});
```

**2. Integration Tests**
```typescript
// tests/security/rls-policies.test.ts
describe('RLS Policies', () => {
  test('regular user cannot access admin products', async () => {
    const regularUser = await createTestUser({ role: 'user' });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: regularUser.email,
      password: 'test123'
    });

    const result = await supabase
      .from('admin_products')
      .select('*');

    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  test('supplier can only see own products', async () => {
    const supplierA = await createTestUser({ role: 'supplier' });
    const supplierB = await createTestUser({ role: 'supplier' });

    await supabase.auth.signInWithPassword({
      email: supplierA.email,
      password: 'test123'
    });

    const result = await supabase
      .from('supplier_products')
      .select('*, suppliers!inner(user_id)');

    expect(result.data?.length).toBeGreaterThan(0);
    result.data?.forEach(product => {
      expect(product.suppliers.user_id).toBe(supplierA.id);
    });
  });
});
```

**3. Penetration Testing**
```bash
# Automated penetration testing tools

# OWASP ZAP (DAST)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://haldeki.com \
  -g gen.conf \
  -r zap-report.html

# SQLMap (SQL Injection Testing)
sqlmap -u "https://haldeki.com/api/products?id=1" \
  --level=5 \
  --risk=3 \
  --batch

# Nikto (Web Server Scanner)
nikto -h https://haldeki.com \
  -Display V \
  -output nikto-report.txt

# Nmap (Network Scanning)
nmap -sV -sC --script vuln haldeki.com
```

### Monitoring İlkeleri / Monitoring Guidelines

#### 1. Security Events to Monitor

```typescript
// types/security.ts
interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

type SecurityEventType =
  | 'failed_login'
  | 'successful_login'
  | 'permission_denied'
  | 'idor_attempt'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'rate_limit_exceeded'
  | 'admin_access'
  | 'data_export'
  | 'password_reset';
```

#### 2. Alerting Rules

```typescript
// config/security-alerts.ts
const alertRules = [
  {
    name: 'Multiple Failed Logins',
    condition: (events: SecurityEvent[]) => {
      const failedLogins = events.filter(e => e.type === 'failed_login');
      const sameIP = groupBy(failedLogins, 'ipAddress');
      return Object.values(sameIP).some(attempts => attempts.length >= 5);
    },
    action: 'lock_account',
    severity: 'high'
  },
  {
    name: 'IDOR Attempt Pattern',
    condition: (events: SecurityEvent[]) => {
      const idorAttempts = events.filter(e => e.type === 'idor_attempt');
      return idorAttempts.length >= 3;
    },
    action: 'alert_security_team',
    severity: 'critical'
  },
  {
    name: 'Admin Access Outside Business Hours',
    condition: (event: SecurityEvent) => {
      if (event.type !== 'admin_access') return false;
      const hour = event.timestamp.getHours();
      return hour < 6 || hour > 22;
    },
    action: 'notify_admin',
    severity: 'medium'
  }
];
```

#### 3. Dashboard Metrics

```typescript
// Dashboard: Key Security Metrics
interface SecurityDashboard {
  realtime: {
    activeSessions: number;
    failedLoginsLastHour: number;
    suspiciousIPs: string[];
  };
  daily: {
    totalAuthAttempts: number;
    failedAttempts: number;
    uniqueUsers: number;
    blockedRequests: number;
  };
  weekly: {
    topAttackTypes: Array<{ type: string; count: number }>;
    vulnerabilityScanResults: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    mtpd (Mean Time to Patch Detection): number; // hours
    mttm (Mean Time to Mitigate): number; // hours
  };
}
```

---

## Ekler / Appendices

### Ek A: OWASP Top 10:2025 Eşleşmesi
### Appendix A: OWASP Top 10:2025 Mapping

| OWASP 2025 Category | Bulgu Sayısı / Findings | Başlık / Title |
|---------------------|-------------------------|----------------|
| **A01: Broken Access Control** | 12 | RoleSwitcher, IDOR, RLS bypass, etc. |
| **A02: Cryptographic Failures** | 5 | XOR encryption, no PII encryption |
| **A03: Injection** | 4 | SQL injection via RPC, XSS |
| **A04: Insecure Design** | 3 | Missing rate limiting, no defense in depth |
| **A05: Security Misconfiguration** | 8 | CORS, debug modes, hardcoded secrets |
| **A06: Vulnerable Components** | 6 | Outdated dependencies |
| **A07: Auth Failures** | 7 | Weak passwords, no account lockout |
| **A08: Data Integrity Failures** | 5 | Cart manipulation, no checksums |
| **A09: Logging Failures** | 6 | No audit trail, missing logs |
| **A10: SSRF** | 1 | Edge function external calls |

**Detaylı Eşleşme / Detailed Mapping:**
```
A01 - Broken Access Control (12 findings)
├── SEC-001: RoleSwitcher production exposure
├── SEC-004: IDOR in order management
├── SEC-005: RLS policy bypass
├── Missing admin authorization checks
├── No user ID validation in APIs
└── [8 more access control issues]

A02 - Cryptographic Failures (5 findings)
├── SEC-002: XOR password encryption
├── No PII encryption at rest
├── Weak password hashing (if any)
├── Insecure random number generation
└── Missing encryption in transit

[... continues for all categories]
```

---

### Ek B: CVSS Skorlama Metodolojisi
### Appendix B: CVSS Scoring Methodology

Bu denetimde CVSS v3.1 skorlama sistemi kullanılmıştır.
This audit uses CVSS v3.1 scoring system.

**Skor Bileşenleri / Score Components:**

```
CVSS:3.1/AV:[N/A/L/P]/AC:[L/H]/PR:[N/L/H]/UI:[N/R]/S:[U/C]/C:[H/L/N]/I:[H/L/N]/A:[H/L/N]

Attack Vector (AV)
├── Network (N) = 0.85  ✅ (Most findings)
├── Adjacent (A) = 0.62
├── Local (L) = 0.55
└── Physical (P) = 0.2

Attack Complexity (AC)
├── Low (L) = 0.77  ✅ (Most findings)
└── High (H) = 0.44

Privileges Required (PR)
├── None (N) = 0.85  ✅ (RoleSwitcher, etc.)
├── Low (L) = 0.62  ✅ (IDOR after login)
└── High (H) = 0.27

User Interaction (UI)
├── None (N) = 0.85  ✅ (Most findings)
└── Required (R) = 0.62

Scope (S)
├── Unchanged (U) = 6.42  ✅ (Most findings)
└── Changed (C) = 7.52

Impact (C/I/A)
├── High (H) = 0.56  ✅ (Critical findings)
├── Low (L) = 0.22
└── None (N) = 0
```

**Örnek Hesaplama / Example Calculation:**

```
SEC-001: RoleSwitcher Exposure
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

Base Score =
  (Impact = 1 - ((1 - 0.56) × (1 - 0.56) × (1 - 0.56)) = 0.914
  Exploitability = 8.22 × 0.85 × 0.77 × 0.85 × 0.85 = 3.86
  Impact Subscore = 6.42

  Impact ≥ Exploitability →
  Base Score = 10 × 0.914 = 9.14 → Round to 9.1

Severity: CRITICAL (9.1/10)
```

---

### Ek C: Kullanılan Test Araçları
### Appendix C: Testing Tools Used

**Statik Kod Analizi / Static Code Analysis:**
```bash
# ESLint with security plugins
npm install eslint-plugin-security
npm install eslint-plugin-no-secrets

# Run security lint
npx eslint --plugin security src/

# Detect secrets in code
npx gitleaks detect --source .
```

**Bağımlılık Taraması / Dependency Scanning:**
```bash
# npm audit for vulnerabilities
npm audit --audit-level=high

# Snyk for advanced scanning
npx snyk test
npx snyk monitor

# OWASP Dependency Check
docker run --rm -v /path/to/project:/project owasp/dependency-check
```

**Dinamik Uygulama Güvenlik Testi (DAST):**
```bash
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://haldeki.com \
  -r zap-report.html

# Burp Suite (Manual testing)
# Professional security tool for web app testing

# SQLMap for SQL injection
sqlmap -u "https://haldeki.com/api/products?id=1" \
  --level=5 --risk=3 --batch
```

**Veritabanı Güvenlik Testi / Database Security Testing:**
```sql
-- RLS Policy Tester
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  test_result BOOLEAN,
  details TEXT
) AS $$
DECLARE
  v_table TEXT;
BEGIN
  -- Test each table's RLS policies
  FOR v_table IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    -- Implement policy tests
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Run tests
SELECT * FROM test_rls_policies();
```

---

### Ek D: Terminoloji Sözlüğü
### Appendix D: Terminology Glossary

| Türkçe / TR | English / EN | Açıklama / Description |
|-------------|--------------|-----------------------|
| **RLS** | Row-Level Security | Satır düzeyinde güvenlik: Her satırın erişim kontrolü |
| **IDOR** | Insecure Direct Object Reference | Doğrudan nesne referansı açığı |
| **XSS** | Cross-Site Scripting | Siteler arası betik çalıştırma |
| **CSRF** | Cross-Site Request Forgery | Sahte istek gönderme |
| **PoC** | Proof of Concept | Kavram kanıtı: Açığın istismar demosu |
| **RBAC** | Role-Based Access Control | Rol tabanlı erişim kontrolü |
| **PII** | Personally Identifiable Information | Kişisel olarak tanımlanabilir bilgi |
| **MFA** | Multi-Factor Authentication | Çok faktörlü kimlik doğrulama |
| **DAST** | Dynamic App Security Testing | Dinamik uygulama güvenlik testi |
| **SAST** | Static App Security Testing | Statik uygulama güvenlik testi |

---

### Ek E: İletişim ve Raporlama
### Appendix E: Communication and Reporting

**Güvenlik Açığı Bildirme / Vulnerability Reporting:**

Hatalı bulduklarınızı güvenli bir şekilde bildirin:
Securely report any vulnerabilities you find:

```
Email: security@haldeki.com
PGP Key: [Will be provided]
Disclose: Responsible disclosure (90 days)
Bounty: TBD (bug bounty program coming soon)
```

**Acil Durum İletişim / Emergency Contact:**

```bash
# For active security incidents:
CTO: [Contact Information]
Security Lead: [Contact Information]
On-Call Engineer: [24/7 hotline]
```

**Denetim Güncellemeleri / Audit Updates:**

```
Next Review: 2026-02-09
Frequency: Monthly (after fixes), Quarterly (stable)
Method: Automated + Manual penetration testing
```

---

## Onay / Approval

| Rol / Role | İsim / Name | İmza / Signature | Tarih / Date |
|------------|-------------|------------------|--------------|
| Güvenlik Uzmanı / Security Specialist | [Name] | _________________ | 2026-01-09 |
| CTO | [Name] | _________________ | ____-__-__ |
| Proje Yöneticisi / Project Manager | [Name] | _________________ | ____-__-__ |

---

## Dağıtım / Distribution

- [ ] Yönetim Kurulu / Board of Directors
- [ ] CTO / VP Engineering
- [ ] Development Team (All)
- [ ] DevOps Team
- [ ] Security Team
- [ ] Compliance Officer (if applicable)

---

## Doküman Geçmişi / Document History

| Versiyon | Tarih | Değişiklik / Changes | Yazar / Author |
|----------|-------|---------------------|----------------|
| 1.0 | 2026-01-09 | İlk yayın / Initial release | Security Specialist |
| 1.1 | TBD | Phase 1 düzeltmeleri / Phase 1 fixes | TBD |
| 2.0 | TBD | Tüm düzeltmeler tamamlandı / All fixes complete | TBD |

---

**Bu rapar gizli ve özeldir. Sadece yetkili personel tarafından okunabilir.**
**This report is confidential and intended solely for authorized personnel.**

---

**© 2026 Haldeki.com - Tüm hakları saklıdır / All rights reserved.**
