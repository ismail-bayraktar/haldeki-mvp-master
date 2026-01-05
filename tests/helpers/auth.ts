import { Page, Locator } from '@playwright/test';

/**
 * Test user credentials for different roles
 * These should match the test accounts created by the migration
 */
export const TEST_USERS = {
  superadmin: {
    email: 'test-superadmin@haldeki.com',
    password: 'Test123!',
    role: 'superadmin',
  },
  admin: {
    email: 'test-admin@haldeki.com',
    password: 'Test123!',
    role: 'admin',
  },
  dealer: {
    email: 'test-dealer@haldeki.com',
    password: 'Test123!',
    role: 'dealer',
  },
  supplier: {
    email: 'test-supplier@haldeki.com',
    password: 'Test123!',
    role: 'supplier',
  },
  business: {
    email: 'test-business@haldeki.com',
    password: 'Test123!',
    role: 'business',
  },
  customer: {
    email: 'test-customer@haldeki.com',
    password: 'Test123!',
    role: 'user',
  },
} as const;

export type TestUserRole = keyof typeof TEST_USERS;

/**
 * Authentication helper class for E2E tests
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Open the auth drawer
   */
  async openAuthDrawer(): Promise<void> {
    await this.page.click('[data-testid="auth-drawer-trigger"]');
    await this.page.waitForSelector('[data-testid="auth-drawer"]', { state: 'visible' });
  }

  /**
   * Close the auth drawer
   */
  async closeAuthDrawer(): Promise<void> {
    const drawer = this.page.locator('[data-testid="auth-drawer"]');
    if (await drawer.isVisible()) {
      await this.page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Switch to login tab
   */
  async switchToLoginTab(): Promise<void> {
    await this.page.click('[data-testid="auth-login-tab"]');
    await this.page.waitForSelector('[data-testid="login-form"]', { state: 'visible' });
  }

  /**
   * Switch to signup tab
   */
  async switchToSignupTab(): Promise<void> {
    await this.page.click('[data-testid="auth-signup-tab"]');
    await this.page.waitForSelector('[data-testid="signup-form"]', { state: 'visible' });
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.page.fill('[data-testid="login-email"]', email);
    await this.page.fill('[data-testid="login-password"]', password);
  }

  /**
   * Fill signup form
   */
  async fillSignupForm(name: string, email: string, password: string): Promise<void> {
    await this.page.fill('[data-testid="signup-name"]', name);
    await this.page.fill('[data-testid="signup-email"]', email);
    await this.page.fill('[data-testid="signup-password"]', password);
  }

  /**
   * Submit login form
   */
  async submitLogin(): Promise<void> {
    await this.page.click('[data-testid="login-submit"]');
  }

  /**
   * Submit signup form
   */
  async submitSignup(): Promise<void> {
    await this.page.click('[data-testid="signup-submit"]');
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.openAuthDrawer();
    await this.switchToLoginTab();
    await this.fillLoginForm(email, password);
    await this.submitLogin();
    // Wait for successful login - drawer should close or redirect
    await this.page.waitForTimeout(1000);
  }

  /**
   * Complete login flow for a test role
   */
  async loginAs(role: TestUserRole): Promise<void> {
    const user = TEST_USERS[role];
    await this.login(user.email, user.password);
  }

  /**
   * Complete signup flow
   */
  async signup(name: string, email: string, password: string): Promise<void> {
    await this.openAuthDrawer();
    await this.switchToSignupTab();
    await this.fillSignupForm(name, email, password);
    await this.submitSignup();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu-trigger"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('**/');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const trigger = this.page.locator('[data-testid="user-menu-trigger"]');
    return await trigger.isVisible();
  }

  /**
   * Get current user info from UI
   */
  async getCurrentUserName(): Promise<string> {
    return await this.page.textContent('[data-testid="user-menu-trigger"]') || '';
  }

  /**
   * Navigate to role-specific dashboard
   */
  async navigateToDashboard(role: TestUserRole): Promise<void> {
    const dashboardPaths: Record<TestUserRole, string> = {
      superadmin: '/admin',
      admin: '/admin',
      dealer: '/bayi',
      supplier: '/tedarikci',
      business: '/isletme',
      customer: '/hesabim',
    };
    await this.page.goto(dashboardPaths[role]);
  }

  /**
   * Wait for role to be checked
   */
  async waitForRoleCheck(): Promise<void> {
    // Wait for roles to be loaded
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if user has specific role access
   */
  async hasRoleAccess(role: TestUserRole): Promise<boolean> {
    const dashboardPaths: Record<TestUserRole, string> = {
      superadmin: '/admin',
      admin: '/admin',
      dealer: '/bayi',
      supplier: '/tedarikci',
      business: '/isletme',
      customer: '/hesabim',
    };

    await this.page.goto(dashboardPaths[role]);
    await this.waitForRoleCheck();

    // Check if we're not redirected or shown access denied
    const currentUrl = this.page.url();
    return !currentUrl.includes('/giris') && !currentUrl.includes('/beklemede');
  }
}

/**
 * Auth fixture setup
 */
export async function setupAuthHelper(page: Page): Promise<AuthHelper> {
  return new AuthHelper(page);
}
