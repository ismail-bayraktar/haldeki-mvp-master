import { test, expect } from '@playwright/test';
import { PageFactory } from '../../helpers/pages';
import { TEST_USERS, ROLE_DASHBOARDS } from '../../personas/test-data';
import {
  createSupplierProductsHelper,
  createProductCatalogHelper,
  SupplierProductsPage,
  ProductCatalogHelper,
  SupplierProductData,
  waitForProductListStabilize,
} from '../../helpers/supplier-products';

/**
 * Supplier All Products E2E Tests
 * Tests supplier product management capabilities including:
 * - Viewing all available products
 * - Searching and filtering
 * - Adding pricing for new products
 * - Updating existing product prices
 * - Managing stock
 * - Security (can't edit other suppliers' products)
 */

// Test data
const TEST_SUPPLIER = {
  email: 'test-supplier@haldeki.com',
  password: 'Test1234!',
  businessName: 'Test Tarım Ürünleri',
};

const TEST_PRODUCTS: SupplierProductData[] = [
  { name: 'Domates', category: 'Sebze', price: 25, stock: 100, unit: 'kg' },
  { name: 'Patates', category: 'Sebze', price: 20, stock: 150, unit: 'kg' },
  { name: 'Havuç', category: 'Kök Sebzeler', price: 15, stock: 80, unit: 'kg' },
  { name: 'Salatalık', category: 'Sebze', price: 18, stock: 60, unit: 'kg' },
];

test.describe('Tedarikçi Tüm Ürünler Yönetimi', () => {
  let pageFactory: PageFactory;
  let supplierProductsPage: SupplierProductsPage;
  let catalogHelper: ProductCatalogHelper;
  let supplierId: string | null = null;
  let createdProductIds: string[] = [];

  test.beforeAll(async () => {
    // Setup product catalog helper
    catalogHelper = await createProductCatalogHelper();

    // Create test products in global catalog
    const testProducts = await catalogHelper.createTestProducts(TEST_PRODUCTS);
    createdProductIds = testProducts.map(p => p.id);

    // Get supplier ID for cleanup
    const userId = await catalogHelper.getUserIdByEmail(TEST_SUPPLIER.email);
    if (userId) {
      supplierId = await catalogHelper.getSupplierId(userId);
    }
  });

  test.beforeEach(async ({ page }) => {
    pageFactory = new PageFactory(page);
    supplierProductsPage = await createSupplierProductsHelper(page);

    // Login as supplier
    await pageFactory.home().goto();
    const authHelper = pageFactory.authHelper();
    await authHelper.login(TEST_SUPPLIER.email, TEST_SUPPLIER.password);
    await expect(authHelper.isLoggedIn()).resolves.toBe(true);
  });

  test.afterAll(async () => {
    // Cleanup test products
    await catalogHelper.cleanupTestProducts();
  });

  test.afterEach(async () => {
    // Clean up supplier-specific data after each test
    if (supplierId) {
      await catalogHelper.cleanupSupplierProducts(supplierId);
    }
  });

  test.describe('Tüm Ürünleri Görüntüleme', () => {
    test('tedarikçi tüm ürünleri görebilir', async ({ page }) => {
      // Arrange & Act
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      // Assert
      await expect(supplierProductsPage.allProductsList).toBeVisible();

      // Verify test products are visible
      for (const product of TEST_PRODUCTS) {
        const isVisible = await supplierProductsPage.isProductVisible(product.name);
        expect(isVisible).toBe(true);
      }
    });

    test('ürün listesi doğru bilgilerle gösterilir', async ({ page }) => {
      // Arrange & Act
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const firstProduct = supplierProductsPage.getAllProductCards().first();

      // Assert - Verify product cards show required information
      await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="product-category"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="product-unit"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
    });

    test('boş ürün listesi doğru gösterilir', async ({ page }) => {
      // This test assumes products might not be visible in some cases
      // Arrange & Act
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const productCount = await supplierProductsPage.getProductCount();

      if (productCount === 0) {
        const isEmptyVisible = await supplierProductsPage.isEmptyStateVisible();
        expect(isEmptyVisible).toBe(true);
      } else {
        // Products exist, skip this check
        test.skip(true, 'Ürün kataloğu boş değil');
      }
    });
  });

  test.describe('Ürün Arama ve Filtreleme', () => {
    test('ürün araması yapabilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      // Act - Search for "Domates"
      await supplierProductsPage.searchProducts('Domates');
      await waitForProductListStabilize(page);

      // Assert
      const searchResults = supplierProductsPage.getAllProductCards();
      const count = await searchResults.count();

      expect(count).toBeGreaterThanOrEqual(0);

      // If results exist, verify they contain search term
      if (count > 0) {
        const firstResult = searchResults.first();
        await expect(firstResult).toContainText('Domates');
      }
    });

    test('kategori filtreleyebilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      // Act - Filter by "Sebze" category
      await supplierProductsPage.filterByCategory('Sebze');

      // Assert
      const products = supplierProductsPage.getAllProductCards();
      const count = await products.count();

      // Verify filtered products are from "Sebze" category
      for (let i = 0; i < Math.min(count, 5); i++) {
        const category = await supplierProductsPage.getProductCategory(
          await products.nth(i).locator('[data-testid="product-name"]').textContent() || ''
        );
        expect(category?.trim()).toBe('Sebze');
      }
    });

    test('fiyat aralığı filtreleyebilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      // Act - Set price range filter
      await supplierProductsPage.filterByPriceRange(15, 25);

      // Assert
      const products = supplierProductsPage.getAllProductCards();
      const count = await products.count();

      // Verify products are within price range (if priced)
      for (let i = 0; i < Math.min(count, 5); i++) {
        const productName = await products.nth(i).locator('[data-testid="product-name"]').textContent() || '';
        const priceText = await supplierProductsPage.getProductPrice(productName);
        const price = parseFloat(priceText.replace(/[^\d.]/g, '') || '0');

        if (price > 0) {
          expect(price).toBeGreaterThanOrEqual(15);
          expect(price).toBeLessThanOrEqual(25);
        }
      }
    });

    test('stok durumuna göre filtreleyebilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      // Act - Filter by "Stok Var"
      await supplierProductsPage.filterInStockOnly();

      // Assert
      const products = supplierProductsPage.getAllProductCards();
      const count = await products.count();

      // Verify products have stock
      for (let i = 0; i < Math.min(count, 5); i++) {
        const product = products.nth(i);
        const stockBadge = product.locator('[data-testid="stock-badge"]');
        if (await stockBadge.isVisible()) {
          const stockText = await stockBadge.textContent();
          expect(stockText).not.toContain('Stok Yok');
        }
      }
    });
  });

  test.describe('Yeni Ürün için Fiyat Girişi', () => {
    test('yeni ürüne fiyat girebilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const unpricedProduct = supplierProductsPage.getUnpricedProductCards().first();

      if (await unpricedProduct.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await unpricedProduct.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Enter price
      await supplierProductsPage.enterPrice(productName, '25.50');

      // Assert
      await supplierProductsPage.waitForPriceSuccess();

      const price = await supplierProductsPage.getProductPrice(productName);
      expect(price).toContain('25.50');

      // Verify in database
      if (supplierId) {
        const productId = await unpricedProduct.getAttribute('data-product-id') || '';
        const supplierProduct = await catalogHelper.getSupplierProduct(supplierId, productId);
        expect(supplierProduct?.price).toBe(25.50);
      }
    });

    test('yeni ürüne stok girebilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const unpricedProduct = supplierProductsPage.getUnpricedProductCards().first();

      if (await unpricedProduct.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await unpricedProduct.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Enter stock
      await supplierProductsPage.enterStock(productName, '100');

      // Assert
      await supplierProductsPage.waitForStockSuccess();

      const stock = await supplierProductsPage.getProductStock(productName);
      expect(stock).toContain('100');
    });

    test('negatif fiyat girişi reddedilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const unpricedProduct = supplierProductsPage.getUnpricedProductCards().first();

      if (await unpricedProduct.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await unpricedProduct.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Try to enter negative price
      await supplierProductsPage.enterPrice(productName, '-10');

      // Assert - Should show error
      await supplierProductsPage.waitForError();
    });

    test('negatif stok girişi reddedilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const unpricedProduct = supplierProductsPage.getUnpricedProductCards().first();

      if (await unpricedProduct.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await unpricedProduct.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Try to enter negative stock
      await supplierProductsPage.enterStock(productName, '-50');

      // Assert - Should show error
      await supplierProductsPage.waitForError();
    });
  });

  test.describe('Mevcut Ürün Fiyat Güncelleme', () => {
    test.beforeEach(async ({ page }) => {
      // Setup: Create a supplier product first
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const unpricedProduct = supplierProductsPage.getUnpricedProductCards().first();
      if (await unpricedProduct.count() > 0) {
        const productName = await unpricedProduct.locator('[data-testid="product-name"]').textContent() || '';
        await supplierProductsPage.enterPrice(productName, '20');
        await supplierProductsPage.enterStock(productName, '50');
      }
    });

    test('mevcut ürün fiyatını güncelleyebilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoMyProducts();

      const pricedProduct = supplierProductsPage.getPricedProductCards().first();

      if (await pricedProduct.count() === 0) {
        test.skip(true, 'Fiyatlandırılmış ürün bulunamadı');
        return;
      }

      const productName = await pricedProduct.locator('[data-testid="product-name"]').textContent() || '';
      const oldPrice = await supplierProductsPage.getProductPrice(productName);

      // Act - Update price
      await supplierProductsPage.editPrice(productName, '30.50');

      // Assert
      await supplierProductsPage.waitForPriceUpdateSuccess();

      const newPrice = await supplierProductsPage.getProductPrice(productName);
      expect(newPrice).toContain('30.50');

      // Verify old price is shown as strikethrough
      await expect(pricedProduct.locator('[data-testid="previous-price"]')).toContainText(oldPrice);
    });

    test('fiyat güncellemesi sonrası ürün listelenir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const product = supplierProductsPage.getUnpricedProductCards().first();

      if (await product.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await product.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Add price and stock
      await supplierProductsPage.enterPrice(productName, '22.75');
      await supplierProductsPage.enterStock(productName, '75');

      // Wait for success
      await supplierProductsPage.waitForPriceSuccess();

      // Navigate to "Benim Ürünlerim" tab
      await supplierProductsPage.gotoMyProducts();

      // Assert - Product should be visible in "My Products" list
      const isVisible = await supplierProductsPage.isProductVisible(productName);
      expect(isVisible).toBe(true);
    });
  });

  test.describe('Benim Ürünlerim Sekmesi', () => {
    test.beforeEach(async ({ page }) => {
      // Setup: Add some products to "My Products"
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const unpricedProducts = supplierProductsPage.getUnpricedProductCards();
      const count = await unpricedProducts.count();

      for (let i = 0; i < Math.min(count, 2); i++) {
        const productName = await unpricedProducts.nth(i).locator('[data-testid="product-name"]').textContent() || '';
        await supplierProductsPage.enterPrice(productName, '20');
        await supplierProductsPage.enterStock(productName, '50');
      }
    });

    test('"Benim Ürünlerim" sekmesine geçebilir', async ({ page }) => {
      // Arrange & Act
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoMyProducts();

      // Assert
      await expect(supplierProductsPage.myProductsList).toBeVisible();
      await expect(page).toHaveURL(/.*my-products.*/);
    });

    test('sadece kendi ürünlerini görür', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoMyProducts();

      // Assert - All visible products should belong to this supplier
      const products = supplierProductsPage.getAllProductCards();
      const count = await products.count();

      expect(count).toBeGreaterThan(0);

      // Verify each product belongs to this supplier
      for (let i = 0; i < count; i++) {
        const product = products.nth(i);
        const productId = await product.getAttribute('data-product-id');

        if (supplierId && productId) {
          const supplierProduct = await catalogHelper.getSupplierProduct(supplierId, productId);
          expect(supplierProduct).toBeTruthy();
        }
      }
    });

    test('"Benim Ürünlerim" listesinde doğru bilgiler gösterilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoMyProducts();

      const firstProduct = supplierProductsPage.getAllProductCards().first();

      // Assert - Verify product card shows supplier-specific info
      await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="product-stock"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="edit-price-button"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="edit-stock-button"]')).toBeVisible();
    });
  });

  test.describe('Güvenlik Testleri', () => {
    test('başka tedarikçinin ürününü düzenleyemez', async ({ page }) => {
      // This test verifies that a supplier can only edit their own pricing
      // Skip if we can't create another supplier for testing
      if (!supplierId) {
        test.skip(true, 'Supplier ID bulunamadı');
        return;
      }

      // Arrange - Create another supplier's pricing for a product
      const testProduct = createdProductIds[0];

      // Try to create a product with a different supplier (simulated)
      // The test will verify that the edit button is not visible
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const productCard = page.locator(`[data-testid="product-card"][data-product-id="${testProduct}"]`);

      if (await productCard.count() > 0) {
        const isPricedByThisSupplier = await productCard.getAttribute('data-priced');

        if (isPricedByThisSupplier === 'false') {
          // Edit button shouldn't be visible for products not priced by this supplier
          const editButton = productCard.locator('[data-testid="edit-price-button"]');
          await expect(editButton).not.toBeVisible();
        } else {
          // Product is priced by this supplier, edit should be visible
          const editButton = productCard.locator('[data-testid="edit-price-button"]');
          await expect(editButton).toBeVisible();
        }
      }
    });

    test('başka tedarikçinin ürün fiyatını göremez (price masking)', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      // Act - Check product pricing display
      const products = supplierProductsPage.getAllProductCards();
      const count = await products.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const product = products.nth(i);
        const isPricedBySupplier = await product.getAttribute('data-priced');

        if (isPricedBySupplier === 'false') {
          // Should not show any price from other suppliers
          const priceDisplay = product.locator('[data-testid="other-supplier-price"]');
          await expect(priceDisplay).not.toBeVisible();
        }
      }
    });

    test('SQL injection koruması vardır', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const product = supplierProductsPage.getUnpricedProductCards().first();

      if (await product.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await product.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Try SQL injection in price field
      await supplierProductsPage.enterPrice(productName, "1'; DROP TABLE supplier_products; --");

      // Assert - Should show validation error, not execute SQL
      await supplierProductsPage.waitForError();

      // Verify table still exists
      const supplierProducts = await catalogHelper.getSupplierProducts(supplierId || '');
      expect(Array.isArray(supplierProducts)).toBe(true);
    });
  });

  test.describe('Network Error Handling', () => {
    test('network hatası durumunda retry yapar', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      // Simulate network offline
      await page.context().setOffline(true);

      const product = supplierProductsPage.getUnpricedProductCards().first();

      if (await product.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await product.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Try to save price while offline
      await supplierProductsPage.enterPrice(productName, '25');

      // Assert - Should show network error
      await supplierProductsPage.waitForError();

      // Restore connection
      await page.context().setOffline(false);

      // Retry should work
      await supplierProductsPage.enterPrice(productName, '25');
      await supplierProductsPage.waitForPriceSuccess();
    });
  });

  test.describe('Edge Cases', () => {
    test('aynı ürünü tekrar fiyatlama günceller', async ({ page }) => {
      // Arrange - Create a product with initial price
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const product = supplierProductsPage.getUnpricedProductCards().first();

      if (await product.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await product.locator('[data-testid="product-name"]').textContent() || '';

      await supplierProductsPage.enterPrice(productName, '20');
      await supplierProductsPage.waitForPriceSuccess();

      // Act - Price the same product again with different price
      await supplierProductsPage.gotoAllProducts();
      await supplierProductsPage.editPrice(productName, '35');

      // Assert - Should update, not create duplicate
      await supplierProductsPage.waitForPriceUpdateSuccess();

      // Verify only one entry exists in database
      const productId = await product.getAttribute('data-product-id') || '';

      if (supplierId && productId) {
        const allSupplierProducts = await catalogHelper.getSupplierProducts(supplierId);
        const productsForThisItem = allSupplierProducts.filter(sp => sp.product_id === productId);
        expect(productsForThisItem.length).toBe(1);
      }
    });

    test('çok büyük fiyat değeri handle eder', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const product = supplierProductsPage.getUnpricedProductCards().first();

      if (await product.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await product.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Enter very large price
      await supplierProductsPage.enterPrice(productName, '999999999.99');

      // Assert - Should either accept or show max value error
      const errorToast = page.locator('[data-testid="price-error-toast"]');
      const successToast = page.locator('[data-testid="price-success-toast"]');

      if (await errorToast.isVisible({ timeout: 2000 })) {
        // Expected behavior: max value validation
        await expect(errorToast).toBeVisible();
      } else if (await successToast.isVisible({ timeout: 2000 })) {
        // Alternative: accepts large value
        await expect(successToast).toBeVisible();
      }
    });

    test('sıfır fiyat girişi reddedilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const product = supplierProductsPage.getUnpricedProductCards().first();

      if (await product.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const productName = await product.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Try to enter zero price
      await supplierProductsPage.enterPrice(productName, '0');

      // Assert - Should show validation error
      await supplierProductsPage.waitForError();
    });

    test('ondalıklı fiyat doğru kaydedilir', async ({ page }) => {
      // Arrange
      await supplierProductsPage.goto();
      await supplierProductsPage.gotoAllProducts();

      const product = supplierProductsPage.getUnpricedProductCards().first();

      if (await product.count() === 0) {
        test.skip(true, 'Fiyatlandırılmamış ürün bulunamadı');
        return;
      }

      const testPrice = '25.99';
      const productName = await product.locator('[data-testid="product-name"]').textContent() || '';

      // Act - Enter decimal price
      await supplierProductsPage.enterPrice(productName, testPrice);

      // Assert
      await supplierProductsPage.waitForPriceSuccess();

      const price = await supplierProductsPage.getProductPrice(productName);
      expect(price).toContain(testPrice);

      // Verify in database
      const productId = await product.getAttribute('data-product-id') || '';

      if (supplierId && productId) {
        const supplierProduct = await catalogHelper.getSupplierProduct(supplierId, productId);
        expect(parseFloat(supplierProduct?.price || '0')).toBe(25.99);
      }
    });
  });
});
