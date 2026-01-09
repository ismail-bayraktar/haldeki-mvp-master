/**
 * Test Setup for Phase 12
 * Configures test environment for Phase 12 tests
 */

import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test setup
beforeAll(() => {
  // Suppress console errors during tests unless debugging
  if (!process.env.DEBUG) {
    global.console.error = (...args: any[]) => {
      const errorMsg = args[0];
      if (
        typeof errorMsg === 'string' &&
        (errorMsg.includes('Warning:') ||
          errorMsg.includes('Not implemented:') ||
          errorMsg.includes('deprecated'))
      ) {
        return;
      }
      console.error(...args);
    };
  }
});
