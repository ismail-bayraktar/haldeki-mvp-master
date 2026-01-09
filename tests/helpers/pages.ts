import { Page, Locator, expect } from '@playwright/test';
import { AuthHelper, setupAuthHelper } from './auth';
import { OrdersPageFactory } from './pages-orders';

/**
 * Page navigation and interaction helpers for E2E tests
 */

/**
 * Home page helper
 */
export class HomePage {
  readonly page: Page;
  readonly authHelper: AuthHelper;

  constructor(page: Page) {
    this.page = page;
    this.authHelper = new AuthHelper(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async selectRegion(regionName: string): Promise<void> {
    // Wait for region modal to appear if not selected
    const modal = this.page.locator('[data-testid="region-modal"]');
    if (await modal.isVisible()) {
      await this.page.click(`[data-testid="region-${regionName}"]`);
      await modal.waitFor({ state: 'hidden' });
    }
  }

  async navigateToProducts(): Promise<void> {
    await this.page.click('[data-testid="nav-products"]');
    await this.page.waitForURL('**/urunler');
  }

  async navigateToBugunHalde(): Promise<void> {
    await this.page.click('[data-testid="nav-bugun-halde"]');
    await this.page.waitForURL('**/bugun-halde');
  }

  async navigateToCart(): Promise<void> {
    await this.page.click('[data-testid="nav-cart"]');
    await this.page.waitForURL('**/sepet');
  }

  async navigateToAccount(): Promise<void> {
    await this.page.click('[data-testid="nav-account"]');
    await this.page.waitForURL('**/hesabim');
  }

  async getCartItemCount(): Promise<number> {
    const text = await this.page.textContent('[data-testid="cart-count"]');
    const count = text?.trim() || '0';
    return parseInt(count, 10) || 0;
  }
}

/**
 * Products page helper
 */
export class ProductsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/urunler');
  }

  async selectCategory(categoryName: string): Promise<void> {
    await this.page.click(`[data-testid="category-${categoryName}"]`);
  }

  async addProductToCart(productId: string): Promise<void> {
    const productCard = this.page.locator(`[data-testid="product-${productId}"]`);
    await productCard.locator('[data-testid="add-to-cart"]').click();
  }

  async clickProduct(productId: string): Promise<void> {
    await this.page.click(`[data-testid="product-${productId}"]`);
  }

  getProductCard(productId: string): Locator {
    return this.page.locator(`[data-testid="product-${productId}"]`);
  }

  async searchProducts(query: string): Promise<void> {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.press('[data-testid="search-input"]', 'Enter');
  }
}

/**
 * Product detail page helper
 */
export class ProductDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/urun/${slug}`);
  }

  async selectVariant(variantLabel: string): Promise<void> {
    await this.page.click(`[data-testid="variant-${variantLabel}"]`);
  }

  async addToCart(): Promise<void> {
    await this.page.click('[data-testid="add-to-cart"]');
  }

  async addToWishlist(): Promise<void> {
    await this.page.click('[data-testid="add-to-wishlist"]');
  }

  async addToCompare(): Promise<void> {
    await this.page.click('[data-testid="add-to-compare"]');
  }

  async getProductPrice(): Promise<string> {
    return await this.page.textContent('[data-testid="product-price"]') || '';
  }

  async getProductName(): Promise<string> {
    return await this.page.textContent('[data-testid="product-name"]') || '';
  }
}

/**
 * Cart page helper
 */
export class CartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/sepet');
  }

  async proceedToCheckout(): Promise<void> {
    await this.page.click('[data-testid="proceed-to-checkout"]');
    await this.page.waitForURL('**/teslimat');
  }

  async updateItemQuantity(productId: string, quantity: number): Promise<void> {
    const itemRow = this.page.locator(`[data-testid="cart-item-${productId}"]`);
    await itemRow.locator('[data-testid="quantity-input"]').fill(quantity.toString());
    await itemRow.locator('[data-testid="update-quantity"]').click();
  }

  async removeItem(productId: string): Promise<void> {
    const itemRow = this.page.locator(`[data-testid="cart-item-${productId}"]`);
    await itemRow.locator('[data-testid="remove-item"]').click();
  }

  async getCartTotal(): Promise<string> {
    return await this.page.textContent('[data-testid="cart-total"]') || '';
  }

  isEmpty(): Promise<boolean> {
    return this.page.locator('[data-testid="empty-cart"]').isVisible();
  }
}

/**
 * Checkout page helper
 */
export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/teslimat');
  }

  async selectAddress(addressId: string): Promise<void> {
    await this.page.click(`[data-testid="address-${addressId}"]`);
  }

  async selectDeliverySlot(slotId: string): Promise<void> {
    await this.page.click(`[data-testid="slot-${slotId}"]`);
  }

  async placeOrder(): Promise<void> {
    await this.page.click('[data-testid="place-order"]');
    await this.page.waitForURL('**/siparis-tamamlandi');
  }

  async addNewAddress(addressData: {
    title: string;
    district: string;
    fullAddress: string;
    phone: string;
  }): Promise<void> {
    await this.page.click('[data-testid="add-address"]');
    await this.page.fill('[data-testid="address-title"]', addressData.title);
    await this.page.fill('[data-testid="address-district"]', addressData.district);
    await this.page.fill('[data-testid="address-full"]', addressData.fullAddress);
    await this.page.fill('[data-testid="address-phone"]', addressData.phone);
    await this.page.click('[data-testid="save-address"]');
  }

  async getOrderTotal(): Promise<string> {
    return await this.page.textContent('[data-testid="order-total"]') || '';
  }
}

/**
 * Admin page helper
 */
export class AdminPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }

  async navigateToSection(section: 'dashboard' | 'orders' | 'users' | 'products' | 'dealers' | 'suppliers' | 'businesses' | 'whitelist' | 'reports'): Promise<void> {
    await this.page.click(`[data-testid="admin-nav-${section}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  async approveDealer(dealerId: string): Promise<void> {
    const dealerRow = this.page.locator(`[data-testid="dealer-${dealerId}"]`);
    await dealerRow.locator('[data-testid="approve-button"]').click();
    await this.page.waitForSelector('[data-testid="approval-success"]', { state: 'visible' });
  }

  async rejectDealer(dealerId: string): Promise<void> {
    const dealerRow = this.page.locator(`[data-testid="dealer-${dealerId}"]`);
    await dealerRow.locator('[data-testid="reject-button"]').click();
  }

  async approveSupplier(supplierId: string): Promise<void> {
    const supplierRow = this.page.locator(`[data-testid="supplier-${supplierId}"]`);
    await supplierRow.locator('[data-testid="approve-button"]').click();
  }

  async approveBusiness(businessId: string): Promise<void> {
    const businessRow = this.page.locator(`[data-testid="business-${businessId}"]`);
    await businessRow.locator('[data-testid="approve-button"]').click();
  }
}

/**
 * Dealer dashboard helper
 */
export class DealerDashboard {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/bayi');
  }

  async navigateToCustomers(): Promise<void> {
    await this.page.click('[data-testid="dealer-nav-customers"]');
    await this.page.waitForURL('**/bayi/musteriler');
  }
}

/**
 * Auth page helper
 */
export class AuthPage {
  readonly page: Page;
  readonly authHelper: AuthHelper;

  constructor(page: Page) {
    this.page = page;
    this.authHelper = new AuthHelper(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/giris');
  }

  async gotoDealerRegistration(): Promise<void> {
    await this.page.goto('/bayi-kayit');
  }

  async gotoSupplierRegistration(): Promise<void> {
    await this.page.goto('/tedarikci-kayit');
  }

  async gotoBusinessRegistration(): Promise<void> {
    await this.page.goto('/isletme-kayit');
  }
}

/**
 * Page factory
 */
export class PageFactory {
  constructor(private page: Page) {}

  home(): HomePage {
    return new HomePage(this.page);
  }

  products(): ProductsPage {
    return new ProductsPage(this.page);
  }

  productDetail(): ProductDetailPage {
    return new ProductDetailPage(this.page);
  }

  cart(): CartPage {
    return new CartPage(this.page);
  }

  checkout(): CheckoutPage {
    return new CheckoutPage(this.page);
  }

  admin(): AdminPage {
    return new AdminPage(this.page);
  }

  dealer(): DealerDashboard {
    return new DealerDashboard(this.page);
  }

  auth(): AuthPage {
    return new AuthPage(this.page);
  }

  authHelper(): AuthHelper {
    return new AuthHelper(this.page);
  }

  orders(): OrdersPageFactory {
    return new OrdersPageFactory(this.page);
  }
}
