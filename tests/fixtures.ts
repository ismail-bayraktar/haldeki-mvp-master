import { test as base } from '@playwright/test';
import { PageFactory } from '../helpers/pages';
import { AuthHelper, TEST_USERS, TestUserRole } from '../helpers/auth';
import { DatabaseHelper } from '../helpers/database';

/**
 * Custom test fixtures extending Playwright's base fixtures
 */

// Declare your fixtures types
type MyFixtures = {
  pageFactory: PageFactory;
  authHelper: AuthHelper;
  dbHelper: DatabaseHelper;
  TEST_USERS: typeof TEST_USERS;
};

// Extend base test with our fixtures
export const test = base.extend<MyFixtures>({
  pageFactory: async ({ page }, use) => {
    await use(new PageFactory(page));
  },

  authHelper: async ({ page }, use) => {
    await use(new AuthHelper(page));
  },

  dbHelper: async ({}, use) => {
    const helper = new DatabaseHelper();
    await use(helper);
  },

  TEST_USERS: async ({}, use) => {
    await use(TEST_USERS);
  },
});

export { expect } from '@playwright/test';

// Re-export TestUserRole type for convenience
export type { TestUserRole };
