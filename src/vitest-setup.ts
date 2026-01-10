import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Make jest globals available for compatibility
global.jest = {
  mock: vi.mock,
  fn: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  requireActual: vi.importActual,
};
