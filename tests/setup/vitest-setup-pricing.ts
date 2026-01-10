/**
 * Vitest Setup for Pricing Tests
 * Test Ortamı Yapılandırması
 *
 * Configures test environment for pricing system tests
 */

import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Supabase client for unit tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
        limit: vi.fn(),
        in: vi.fn(),
      })),
    })),
  },
}));

// Set up test environment variables
beforeAll(() => {
  // Set default test environment variables
  process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
  process.env.TEST_REGION_ID = process.env.TEST_REGION_ID || 'marmara-region';
  process.env.TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'test-product-id';
  process.env.TEST_SUPPLIER_ID = process.env.TEST_SUPPLIER_ID || 'test-supplier-id';
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console errors in tests unless debugging
const originalError = console.error;
beforeAll(() => {
  if (!process.env.DEBUG_TESTS) {
    console.error = (...args) => {
      const errorMessage = args[0]?.toString() || '';
      if (
        errorMessage.includes('Warning:') ||
        errorMessage.includes('Not implemented:')
      ) {
        return;
      }
      originalError(...args);
    };
  }
});

afterAll(() => {
  console.error = originalError;
});
