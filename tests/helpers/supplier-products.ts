import { Page, Locator, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supplier Products Test Helper
 * Provides utilities for testing supplier product management
 */

export interface SupplierProductData {
  name: string;
  category: string;
  price: number;
  stock: number;
  unit?: string;
}

export interface TestProduct {
  id: string;
  name: string;
  category: string;
  slug: string;
}

/**
 * Helper class for managing test products in the global catalog
 */
export class ProductCatalogHelper {
  private client: SupabaseClient;
  private testProductIds: string[] = [];

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create test products in the global catalog
   */
  async createTestProducts(products: SupplierProductData[]): Promise<TestProduct[]> {
    const createdProducts: TestProduct[] = [];

    for (const product of products) {
      const { data, error } = await this.client
        .from('products')
        .insert({
          name: product.name,
          slug: `${product.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: product.category,
          unit: product.unit || 'kg',
          description: `Test ${product.name} açıklaması`,
          product_status: 'active',
          is_active: true,
        })
        .select('id, name, category, slug')
        .single();

      if (data && !error) {
        createdProducts.push(data);
        this.testProductIds.push(data.id);
      }
    }

    return createdProducts;
  }

  /**
   * Get supplier ID by user email
   */
  async getSupplierId(userId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('suppliers')
      .select('id')
      .eq('user_id', userId)
      .eq('approval_status', 'approved')
      .maybeSingle();

    if (error || !data) return null;
    return data.id;
  }

  /**
   * Get user ID by email
   */
  async getUserIdByEmail(email: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error || !data) return null;
    return data.id;
  }

  /**
   * Create supplier product link (price a product for a supplier)
   */
  async createSupplierProduct(
    supplierId: string,
    productId: string,
    price: number,
    stock: number
  ): Promise<boolean> {
    const { error } = await this.client
      .from('supplier_products')
      .insert({
        supplier_id: supplierId,
        product_id: productId,
        price,
        stock_quantity: stock,
        availability: stock > 10 ? 'plenty' : stock > 0 ? 'limited' : 'last',
        quality: 'standart',
        origin: 'Türkiye',
        min_order_quantity: 1,
        delivery_days: 1,
        is_featured: false,
        is_active: true,
      });

    return !error;
  }

  /**
   * Get supplier product by supplier and product IDs
   */
  async getSupplierProduct(supplierId: string, productId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.client
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  /**
   * Delete all test products
   */
  async cleanupTestProducts(): Promise<void> {
    if (this.testProductIds.length === 0) return;

    // First remove supplier_products links
    await this.client
      .from('supplier_products')
      .delete()
      .in('product_id', this.testProductIds);

    // Then remove the products
    await this.client
      .from('products')
      .delete()
      .in('id', this.testProductIds);

    this.testProductIds = [];
  }

  /**
   * Delete supplier products for a specific supplier
   */
  async cleanupSupplierProducts(supplierId: string): Promise<void> {
    await this.client
      .from('supplier_products')
      .delete()
      .eq('supplier_id', supplierId)
      .in('product_id', this.testProductIds);
  }

  /**
   * Check if product exists in catalog
   */
  async productExists(productId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('products')
      .select('id')
      .eq('id', productId)
      .maybeSingle();

    return !error && !!data;
  }

  /**
   * Get all products for a supplier
   */
  async getSupplierProducts(supplierId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('supplier_products')
      .select('*, products(*)')
      .eq('supplier_id', supplierId);

    if (error || !data) return [];
    return data;
  }
}

/**
 * Supplier Products Page Object
 * Encapsulates interactions with the supplier products page
 */
export class SupplierProductsPage {
  readonly page: Page;
  readonly pageUrl: string;

  // Locators
  readonly tabAllProducts: Locator;
  readonly tabMyProducts: Locator;
  readonly allProductsList: Locator;
  readonly myProductsList: Locator;
  readonly productSearch: Locator;
  readonly categoryFilter: Locator;
  readonly minPriceFilter: Locator;
  readonly maxPriceFilter: Locator;
  readonly applyFiltersButton: Locator;
  readonly filterInStock: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageUrl = '/tedarikci/urunler';

    // Tab locators
    this.tabAllProducts = page.locator('[data-testid="tab-all-products"]');
    this.tabMyProducts = page.locator('[data-testid="tab-my-products"]');
    this.allProductsList = page.locator('[data-testid="all-products-list"]');
    this.myProductsList = page.locator('[data-testid="my-products-list"]');

    // Filter locators
    this.productSearch = page.locator('[data-testid="product-search"]');
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.minPriceFilter = page.locator('[data-testid="min-price-filter"]');
    this.maxPriceFilter = page.locator('[data-testid="max-price-filter"]');
    this.applyFiltersButton = page.locator('[data-testid="apply-filters"]');
    this.filterInStock = page.locator('[data-testid="filter-in-stock"]');
  }

  /**
   * Navigate to supplier products page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.pageUrl);
  }

  /**
   * Navigate to "All Products" tab
   */
  async gotoAllProducts(): Promise<void> {
    await this.tabAllProducts.click();
    await expect(this.allProductsList).toBeVisible();
  }

  /**
   * Navigate to "My Products" tab
   */
  async gotoMyProducts(): Promise<void> {
    await this.tabMyProducts.click();
    await expect(this.myProductsList).toBeVisible();
  }

  /**
   * Search for products by name
   */
  async searchProducts(query: string): Promise<void> {
    await this.productSearch.fill(query);
    await this.productSearch.press('Enter');
    await this.page.waitForTimeout(500); // Wait for search debounce
  }

  /**
   * Filter by category
   */
  async filterByCategory(category: string): Promise<void> {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(500); // Wait for filter
  }

  /**
   * Filter by price range
   */
  async filterByPriceRange(min: number, max: number): Promise<void> {
    await this.minPriceFilter.fill(min.toString());
    await this.maxPriceFilter.fill(max.toString());
    await this.applyFiltersButton.click();
    await this.page.waitForTimeout(500); // Wait for filter
  }

  /**
   * Filter by stock availability
   */
  async filterInStockOnly(): Promise<void> {
    await this.filterInStock.click();
    await this.page.waitForTimeout(500); // Wait for filter
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.productSearch.fill('');
    await this.page.reload();
  }

  /**
   * Get product card locator by product name
   */
  getProductCard(productName: string): Locator {
    return this.page.locator(`[data-testid="product-card"]`).filter({ hasText: productName });
  }

  /**
   * Get all product cards
   */
  getAllProductCards(): Locator {
    return this.page.locator('[data-testid="product-card"]');
  }

  /**
   * Get unpriced product cards (products not yet priced by supplier)
   */
  getUnpricedProductCards(): Locator {
    return this.page.locator('[data-testid="product-card"][data-priced="false"]');
  }

  /**
   * Get priced product cards (products already priced by supplier)
   */
  getPricedProductCards(): Locator {
    return this.page.locator('[data-testid="product-card"][data-priced="true"]');
  }

  /**
   * Enter price for a product
   */
  async enterPrice(productName: string, price: string): Promise<void> {
    const productCard = this.getProductCard(productName);
    await productCard.locator('[data-testid="price-input"]').fill(price);
    await productCard.locator('[data-testid="save-price-button"]').click();
  }

  /**
   * Enter stock for a product
   */
  async enterStock(productName: string, stock: string): Promise<void> {
    const productCard = this.getProductCard(productName);
    await productCard.locator('[data-testid="stock-input"]').fill(stock);
    await productCard.locator('[data-testid="save-stock-button"]').click();
  }

  /**
   * Edit product price
   */
  async editPrice(productName: string, newPrice: string): Promise<void> {
    const productCard = this.getProductCard(productName);
    await productCard.locator('[data-testid="edit-price-button"]').click();
    await productCard.locator('[data-testid="price-input"]').fill(newPrice);
    await productCard.locator('[data-testid="save-price-button"]').click();
  }

  /**
   * Edit product stock
   */
  async editStock(productName: string, newStock: string): Promise<void> {
    const productCard = this.getProductCard(productName);
    await productCard.locator('[data-testid="edit-stock-button"]').click();
    await productCard.locator('[data-testid="stock-input"]').fill(newStock);
    await productCard.locator('[data-testid="save-stock-button"]').click();
  }

  /**
   * Wait for price success toast
   */
  async waitForPriceSuccess(): Promise<void> {
    await expect(this.page.locator('[data-testid="price-success-toast"]')).toBeVisible();
  }

  /**
   * Wait for price update success toast
   */
  async waitForPriceUpdateSuccess(): Promise<void> {
    await expect(this.page.locator('[data-testid="price-update-success-toast"]')).toBeVisible();
  }

  /**
   * Wait for stock success toast
   */
  async waitForStockSuccess(): Promise<void> {
    await expect(this.page.locator('[data-testid="stock-success-toast"]')).toBeVisible();
  }

  /**
   * Wait for error toast
   */
  async waitForError(): Promise<void> {
    const errorToast = this.page.locator('[data-testid="price-error-toast"]')
      .or(this.page.locator('[data-testid="stock-error-toast"]'))
      .or(this.page.locator('[data-testid="validation-error"]'))
      .or(this.page.locator('[data-testid="permission-error-toast"]'))
      .or(this.page.locator('[data-testid="network-error-toast"]'));
    await expect(errorToast.first()).toBeVisible();
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    const emptyState = this.page.locator('[data-testid="empty-products-state"]');
    return await emptyState.isVisible();
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    const products = this.getAllProductCards();
    return await products.count();
  }

  /**
   * Verify product is visible
   */
  async isProductVisible(productName: string): Promise<boolean> {
    const productCard = this.getProductCard(productName);
    return await productCard.isVisible();
  }

  /**
   * Get product price
   */
  async getProductPrice(productName: string): Promise<string> {
    const productCard = this.getProductCard(productName);
    const priceElement = productCard.locator('[data-testid="product-price"]');
    return await priceElement.textContent() || '';
  }

  /**
   * Get product stock
   */
  async getProductStock(productName: string): Promise<string> {
    const productCard = this.getProductCard(productName);
    const stockElement = productCard.locator('[data-testid="product-stock"]');
    return await stockElement.textContent() || '';
  }

  /**
   * Get product category
   */
  async getProductCategory(productName: string): Promise<string> {
    const productCard = this.getProductCard(productName);
    const categoryElement = productCard.locator('[data-testid="product-category"]');
    return await categoryElement.textContent() || '';
  }
}

/**
 * Factory function to create supplier products helper
 */
export async function createSupplierProductsHelper(page: Page): Promise<SupplierProductsPage> {
  return new SupplierProductsPage(page);
}

/**
 * Factory function to create product catalog helper
 */
export async function createProductCatalogHelper(): Promise<ProductCatalogHelper> {
  return new ProductCatalogHelper();
}

/**
 * Retry wrapper for flaky tests
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000 } = options;

  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Wait for product list to stabilize (useful for debounced searches)
 */
export async function waitForProductListStabilize(
  page: Page,
  options: { timeout?: number; checkInterval?: number } = {}
): Promise<void> {
  const { timeout = 5000, checkInterval = 500 } = options;
  const startTime = Date.now();
  let previousCount = -1;
  let stableCount = 0;

  while (Date.now() - startTime < timeout) {
    const currentCount = await page.locator('[data-testid="product-card"]').count();

    if (currentCount === previousCount) {
      stableCount++;
      if (stableCount >= 2) {
        return; // List is stable
      }
    } else {
      stableCount = 0;
    }

    previousCount = currentCount;
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  throw new Error('Product list did not stabilize within timeout');
}
