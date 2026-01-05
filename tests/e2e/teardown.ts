import { FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 * Runs once after all tests
 */
async function globalTeardown(config: FullConfig) {
  // You can perform global cleanup here, such as:
  // - Stopping services
  // - Cleaning up test data
  // - Generating reports

  console.log('🧹 E2E Test Global Teardown');

  // Example: Clean up test data if needed
  // Note: Be careful not to delete data that might be needed for debugging

  console.log('✅ E2E Test Teardown Complete');
}

export default globalTeardown;
