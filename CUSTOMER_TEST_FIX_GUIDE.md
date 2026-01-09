# Customer E2E Test Fix Implementation Guide

## Overview
This guide provides step-by-step instructions to fix the failing customer E2E tests by adding the required `data-testid` attributes to UI components.

## Priority Order

### Phase 1: Critical Path (Authentication) - 2 hours

#### 1. Header Component - `src/components/layout/Header.tsx`

**Find line 199:**
```typescript
<Button variant="ghost" size="icon" onClick={openAuthDrawer}>
  <User className="h-5 w-5" />
</Button>
```

**Replace with:**
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={openAuthDrawer}
  data-testid="auth-drawer-trigger"
>
  <User className="h-5 w-5" />
</Button>
```

**Find line 278 (mobile login button):**
```typescript
<Button
  className="w-full bg-primary text-primary-foreground"
  onClick={openAuthDrawer}
>
  Giriş Yap
</Button>
```

**Replace with:**
```typescript
<Button
  className="w-full bg-primary text-primary-foreground"
  onClick={openAuthDrawer}
  data-testid="auth-drawer-trigger"
>
  Giriş Yap
</Button>
```

**Add user menu testid (around line 165):**
```typescript
<DropdownMenuTrigger data-testid="user-menu-trigger" asChild>
  <Button variant="ghost" size="icon">
    <User className="h-5 w-5" />
  </Button>
</DropdownMenuTrigger>
```

**Add logout button testid (line 192):**
```typescript
<DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer" data-testid="logout-button">
  <LogOut className="h-4 w-4 mr-2" />
  Çıkış Yap
</DropdownMenuItem>
```

#### 2. AuthDrawer Component - `src/components/auth/AuthDrawer.tsx`

**Update Sheet wrapper (line 83):**
```typescript
<Sheet open={isAuthDrawerOpen} onOpenChange={closeAuthDrawer}>
  <SheetContent
    side="right"
    className="w-full sm:max-w-md p-0 bg-card"
    data-testid="auth-drawer"
  >
```

**Update Tabs (line 95):**
```typescript
<Tabs defaultValue="login" className="w-full">
  <TabsList className="grid w-full grid-cols-2 mb-6">
    <TabsTrigger value="login" data-testid="auth-login-tab">Giriş Yap</TabsTrigger>
    <TabsTrigger value="signup" data-testid="auth-signup-tab">Üye Ol</TabsTrigger>
  </TabsList>
```

**Update Login Form (line 101):**
```typescript
<TabsContent value="login" className="space-y-4">
  <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
    <div className="space-y-2">
      <Label htmlFor="login-email">E-posta</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="login-email"
          type="email"
          placeholder="ornek@email.com"
          className="pl-10"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          disabled={isLoading}
          data-testid="login-email"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="login-password">Şifre</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          className="pl-10"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          disabled={isLoading}
          data-testid="login-password"
        />
      </div>
    </div>

    <Button
      type="submit"
      className="w-full h-12 text-base"
      disabled={isLoading}
      data-testid="login-submit"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Giriş yapılıyor...
        </>
      ) : (
        "Giriş Yap"
      )}
    </Button>
  </form>
```

**Update Signup Form (line 194):**
```typescript
<TabsContent value="signup" className="space-y-4">
  <form onSubmit={handleSignup} className="space-y-4" data-testid="signup-form">
    <div className="space-y-2">
      <Label htmlFor="signup-name">Ad Soyad</Label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="signup-name"
          type="text"
          placeholder="Adınız Soyadınız"
          className="pl-10"
          value={signupName}
          onChange={(e) => setSignupName(e.target.value)}
          disabled={isLoading}
          data-testid="signup-name"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="signup-email">E-posta</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="signup-email"
          type="email"
          placeholder="ornek@email.com"
          className="pl-10"
          value={signupEmail}
          onChange={(e) => setSignupEmail(e.target.value)}
          disabled={isLoading}
          data-testid="signup-email"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="signup-password">Şifre</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="signup-password"
          type="password"
          placeholder="En az 6 karakter"
          className="pl-10"
          value={signupPassword}
          onChange={(e) => setSignupPassword(e.target.value)}
          disabled={isLoading}
          data-testid="signup-password"
        />
      </div>
    </div>

    <Button
      type="submit"
      className="w-full h-12 text-base"
      disabled={isLoading}
      data-testid="signup-submit"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Kayıt yapılıyor...
        </>
      ) : (
        "Üye Ol"
      )}
    </Button>
  </form>
```

### Phase 2: Navigation & Products - 2 hours

#### 3. Add Navigation Testids

**In Header.tsx, update nav links:**
```typescript
<Link
  to="/urunler"
  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
  data-testid="nav-products"
>
  <PackageOpen className="h-4 w-4" />
  Ürünler
</Link>

<Link
  to="/sepet"
  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
  data-testid="nav-cart"
>
  <ShoppingCart className="h-4 w-4" />
  Sepet
  {cartCount > 0 && (
    <Badge className="ml-1 bg-primary text-primary-foreground" data-testid="cart-count">
      {cartCount}
    </Badge>
  )}
</Link>
```

#### 4. ProductCard Component - `src/components/product/ProductCard.tsx`

**Find the card wrapper and add testid:**
```typescript
<div
  data-testid={`product-${product.id}`}
  className="group relative bg-card rounded-lg border hover:shadow-lg transition-all"
>
```

**Find the add to cart button and add testid:**
```typescript
<Button
  onClick={handleAddToCart}
  className="w-full"
  data-testid="add-to-cart"
>
  <ShoppingCart className="h-4 w-4 mr-2" />
  Sepete Ekle
</Button>
```

#### 5. ProductDetail Page - `src/pages/ProductDetail.tsx`

**Add product info testids:**
```typescript
<h1 className="text-3xl font-bold" data-testid="product-name">
  {product.name}
</h1>

<p className="text-2xl font-bold text-primary" data-testid="product-price">
  {product.price} TL
</p>
```

**Add action buttons testids:**
```typescript
<Button
  size="lg"
  onClick={handleAddToCart}
  data-testid="add-to-cart"
>
  Sepete Ekle
</Button>

<Button
  variant="outline"
  size="icon"
  onClick={handleToggleWishlist}
  data-testid="add-to-wishlist"
>
  <Heart className={isInWishlist ? "fill-current" : ""} />
</Button>

<Button
  variant="outline"
  size="icon"
  onClick={handleAddToCompare}
  data-testid="add-to-compare"
>
  <GitCompare />
</Button>
```

### Phase 3: Cart & Checkout - 2 hours

#### 6. Cart Page - `src/pages/Cart.tsx`

**Add cart container testid:**
```typescript
<div className="container mx-auto px-4 py-8" data-testid="cart-page">
```

**Add empty cart testid:**
```typescript
{items.length === 0 && (
  <div className="text-center py-12" data-testid="empty-cart">
    <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
    <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
  </div>
)}
```

**Add cart item testids:**
```typescript
<div
  key={item.product.id}
  data-testid={`cart-item-${item.product.id}`}
  className="flex items-center gap-4 py-4 border-b"
>
```

**Add quantity controls testids:**
```typescript
<Input
  type="number"
  min="1"
  value={item.quantity}
  onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
  className="w-20"
  data-testid="quantity-input"
/>

<Button
  variant="outline"
  size="sm"
  onClick={() => updateQuantity(item.product.id, item.quantity)}
  data-testid="update-quantity"
>
  Güncelle
</Button>

<Button
  variant="ghost"
  size="sm"
  onClick={() => removeFromCart(item.product.id)}
  data-testid="remove-item"
>
  <Trash2 className="h-4 w-4" />
</Button>
```

**Add cart total and checkout button testids:**
```typescript
<div className="text-2xl font-bold" data-testid="cart-total">
  {total.toFixed(2)} TL
</div>

<Button
  size="lg"
  className="w-full"
  onClick={handleCheckout}
  data-testid="proceed-to-checkout"
>
  Sepeti Onayla
</Button>
```

#### 7. Checkout Pages

**Add checkout testids based on your checkout implementation**

### Phase 4: Dashboard & Account - 1 hour

#### 8. Customer Dashboard

Add testids for:
- `customer-dashboard`
- `nav-profile`
- `nav-addresses`
- Profile fields
- Save buttons

### Phase 5: Create Test User - 30 minutes

#### 9. Create Test Customer User

**Option A: Via Supabase Dashboard**
1. Go to Authentication > Users
2. Click "Add user"
3. Email: `test-customer@haldeki.com`
4. Password: `Test1234!`
5. Click "Auto Confirm User"
6. Create user
7. Note the user ID

**Option B: Via SQL Migration**

Create `supabase/migrations/20260109_create_test_customer.sql`:
```sql
-- ============================================================================
-- CREATE TEST CUSTOMER USER
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'test-customer@haldeki.com',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    '{"name": "Test Customer"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    now(),
    now()
  );

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_user_id, 'test-customer@haldeki.com', 'Test Customer')
  ON CONFLICT (id) DO NOTHING;

  -- Assign user role (not customer - customer is the default authenticated role)
  -- No need to insert into user_roles as 'user' is the default

  RAISE NOTICE 'Test customer created: test-customer@haldeki.com (ID: %)', v_user_id;
END $$;
```

Run the migration:
```bash
npx supabase db push
```

### Phase 6: Verify & Test - 30 minutes

#### 10. Test the Fixes

**Run single test first:**
```bash
npx playwright test tests/e2e/customer/customer-workflow.spec.ts -g "should login successfully" --project=chromium
```

**If successful, run all customer tests:**
```bash
npx playwright test tests/e2e/customer/customer-workflow.spec.ts
```

**Check results:**
```bash
npx playwright show-report
```

## Testing Checklist

- [ ] Auth drawer opens with testid
- [ ] Login form accepts credentials
- [ ] Customer can login successfully
- [ ] Products display with testids
- [ ] Cart items have testids
- [ ] Checkout flow works
- [ ] Dashboard elements have testids
- [ ] All 37 tests pass

## Common Issues

### Issue: Timeout still occurs
**Fix:** Increase test timeout in `customer-workflow.spec.ts`:
```typescript
test.beforeEach(async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Issue: Test user not found
**Fix:** Verify user exists in database:
```sql
SELECT * FROM auth.users WHERE email = 'test-customer@haldeki.com';
```

### Issue: Element not visible
**Fix:** Add explicit waits:
```typescript
await page.waitForSelector('[data-testid="auth-drawer"]', { state: 'visible' });
```

## Estimated Timeline

- Phase 1: 2 hours
- Phase 2: 2 hours
- Phase 3: 2 hours
- Phase 4: 1 hour
- Phase 5: 0.5 hours
- Phase 6: 0.5 hours
- **Total: 8 hours**

## Success Criteria

- [ ] All 37 customer tests pass
- [ ] Test user exists and can login
- [ ] No test timeouts
- [ ] Full coverage of customer flows
- [ ] Tests are reliable and repeatable

---

**Next Steps:**
1. Start with Phase 1 (Authentication)
2. Test login flow
3. Continue with remaining phases
4. Run full test suite
5. Document results
