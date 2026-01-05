import { FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  // You can perform global setup here, such as:
  // - Starting a dev server (if not using webServer config)
  // - Seeding database with test data
  // - Setting up test environment variables

  console.log('🔧 E2E Test Global Setup');
  console.log('Base URL:', config.projects?.[0]?.use?.baseURL);
  console.log('Workers:', config.workers);

  // Example: Ensure test users exist
  // This would typically be done via a migration or a dedicated setup script
  console.log('✅ E2E Test Setup Complete');
}

export default globalSetup;
