import { Page, Locator, expect } from '@playwright/test';

/**
 * Order-related page helpers for E2E tests
 * Supports both business and customer order flows
 */

/**
 * Business Orders page helper
 */
export class BusinessOrdersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/isletme');
  }

  /**
   * Navigate to orders section within business dashboard
   */
  async navigateToOrders(): Promise<void> {
    await this.page.click('[data-testid="business-nav-orders"]');
    await this.page.waitForURL('**/isletme/**');
  }

  /**
   * Switch to completed orders tab
   */
  async goToCompletedTab(): Promise<void> {
    await this.page.click('[data-testid="tab-completed"]');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to active orders tab
   */
  async goToActiveTab(): Promise<void> {
    await this.page.click('[data-testid="tab-active"]');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to cancelled orders tab
   */
  async goToCancelledTab(): Promise<void> {
    await this.page.click('[data-testid="tab-cancelled"]');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click repeat order button for a specific order
   */
  async clickRepeatOrder(orderId: string): Promise<void> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    await orderRow.locator('[data-testid="repeat-order-button"]').click();
  }

  /**
   * Expand order details
   */
  async expandOrder(orderId: string): Promise<void> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    await orderRow.locator('[data-testid="accordion-trigger"]').click();
  }

  /**
   * Get order items list
   */
  getOrderItems(orderId: string): Locator {
    return this.page.locator(`[data-testid="order-${orderId}"]`).locator('[data-testid="order-items"]');
  }

  /**
   * Check if repeat order button is visible
   */
  async isRepeatOrderButtonVisible(orderId: string): Promise<boolean> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    const button = orderRow.locator('[data-testid="repeat-order-button"]');
    return await button.isVisible();
  }
}

/**
 * Customer Orders page helper
 */
export class CustomerOrdersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/hesabim/siparisler');
  }

  /**
   * Navigate from account page to orders
   */
  async navigateFromAccount(): Promise<void> {
    await this.page.click('[data-testid="nav-account-orders"]');
    await this.page.waitForURL('**/siparisler');
  }

  /**
   * Click repeat order button for a specific order
   */
  async clickRepeatOrder(orderId: string): Promise<void> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    await orderRow.locator('[data-testid="repeat-order-button"]').click();
  }

  /**
   * Expand order details
   */
  async expandOrder(orderId: string): Promise<void> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    await orderRow.locator('[data-testid="accordion-trigger"]').click();
  }

  /**
   * Get order items list
   */
  getOrderItems(orderId: string): Locator {
    return this.page.locator(`[data-testid="order-${orderId}"]`).locator('[data-testid="order-items"]');
  }

  /**
   * Get order items count
   */
  async getOrderItemsCount(orderId: string): Promise<number> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    const countText = await orderRow.locator('[data-testid="order-items-count"]').textContent();
    return parseInt(countText || '0', 10);
  }

  /**
   * Get order total amount
   */
  async getOrderTotal(orderId: string): Promise<string> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    return await orderRow.locator('[data-testid="order-total"]').textContent() || '';
  }

  /**
   * Check if order has delivered status
   */
  async isOrderDelivered(orderId: string): Promise<boolean> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    const statusBadge = orderRow.locator('[data-testid="order-status"]');
    const statusText = await statusBadge.textContent();
    return statusText?.includes('Teslim Edildi') || false;
  }

  /**
   * Check if repeat order button is visible
   */
  async isRepeatOrderButtonVisible(orderId: string): Promise<boolean> {
    const orderRow = this.page.locator(`[data-testid="order-${orderId}"]`);
    const button = orderRow.locator('[data-testid="repeat-order-button"]');
    return await button.isVisible();
  }
}

/**
 * Repeat Order Dialog helper
 */
export class RepeatOrderDialog {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for dialog to be visible
   */
  async waitForVisible(): Promise<void> {
    await this.page.waitForSelector('[data-testid="repeat-order-dialog"]', { state: 'visible' });
  }

  /**
   * Check if dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.page.locator('[data-testid="repeat-order-dialog"]').isVisible();
  }

  /**
   * Get dialog title
   */
  getTitle(): Locator {
    return this.page.locator('[data-testid="repeat-order-dialog-title"]');
  }

  /**
   * Get available items list
   */
  getAvailableItems(): Locator {
    return this.page.locator('[data-testid="available-items"]');
  }

  /**
   * Get unavailable items list
   */
  getUnavailableItems(): Locator {
    return this.page.locator('[data-testid="unavailable-items"]');
  }

  /**
   * Get price change warning
   */
  getPriceChangeWarning(): Locator {
    return this.page.locator('[data-testid="price-change-warning"]');
  }

  /**
   * Get available items count
   */
  async getAvailableItemsCount(): Promise<number> {
    const countBadge = this.page.locator('[data-testid="available-items-count"]');
    const countText = await countBadge.textContent();
    return parseInt(countText || '0', 10);
  }

  /**
   * Get unavailable items count
   */
  async getUnavailableItemsCount(): Promise<number> {
    const countBadge = this.page.locator('[data-testid="unavailable-items-count"]');
    const countText = await countBadge.textContent();
    return parseInt(countText || '0', 10);
  }

  /**
   * Check if price increased
   */
  async hasPriceIncrease(): Promise<boolean> {
    const warning = this.page.locator('[data-testid="price-change-warning"]');
    const text = await warning.textContent();
    return text?.includes('Artış') || false;
  }

  /**
   * Get old price from warning
   */
  async getOldPrice(): Promise<string> {
    const oldPriceEl = this.page.locator('[data-testid="old-price"]');
    return await oldPriceEl.textContent() || '';
  }

  /**
   * Get new price from warning
   */
  async getNewPrice(): Promise<string> {
    const newPriceEl = this.page.locator('[data-testid="new-price"]');
    return await newPriceEl.textContent() || '';
  }

  /**
   * Click confirm button
   */
  async clickConfirm(): Promise<void> {
    await this.page.click('[data-testid="confirm-repeat-order"]');
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.page.click('[data-testid="cancel-repeat-order"]');
  }

  /**
   * Check if confirm button is enabled
   */
  async isConfirmEnabled(): Promise<boolean> {
    const button = this.page.locator('[data-testid="confirm-repeat-order"]');
    return await button.isEnabled();
  }

  /**
   * Check if dialog shows error
   */
  async showsError(): Promise<boolean> {
    return await this.page.locator('[data-testid="repeat-order-error"]').isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    const errorEl = this.page.locator('[data-testid="repeat-order-error"]');
    return await errorEl.textContent() || '';
  }

  /**
   * Wait for dialog to close
   */
  async waitForHidden(): Promise<void> {
    await this.page.waitForSelector('[data-testid="repeat-order-dialog"]', { state: 'hidden' });
  }
}

/**
 * Extend PageFactory to include order-related pages
 */
export class OrdersPageFactory {
  constructor(private page: Page) {}

  businessOrders(): BusinessOrdersPage {
    return new BusinessOrdersPage(this.page);
  }

  customerOrders(): CustomerOrdersPage {
    return new CustomerOrdersPage(this.page);
  }

  repeatOrderDialog(): RepeatOrderDialog {
    return new RepeatOrderDialog(this.page);
  }
}
