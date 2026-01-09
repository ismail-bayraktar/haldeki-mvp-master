/**
 * Phase 11: Warehouse MVP - Time Window Unit Tests (P1)
 *
 * Unit tests for time window calculations:
 * 1. Night shift window (17:00 → 08:00 next day)
 * 2. Day shift window (08:00 → 17:00)
 * 3. Current shift detection
 * 4. TRT timezone handling
 *
 * @author Claude Code (orchestrator)
 * @date 2025-01-09
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getNightShiftWindow,
  getDayShiftWindow,
  getCurrentShift,
  getCurrentShiftWindow,
  getAllShiftWindows,
} from '@/lib/timeWindow';

describe('Time Window Calculations', () => {
  let originalDate: DateConstructor;

  beforeEach(() => {
    originalDate = global.Date;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe('Night Shift Window', () => {
    it('should_calculate_night_shift_window_correctly', () => {
      // Mock current time to 7 AM (during night shift)
      vi.setSystemTime(new Date('2025-01-09T07:00:00+03:00'));

      const window = getNightShiftWindow();

      // Night shift: Yesterday 17:00 → Today 08:00
      expect(window.start.getHours()).toBe(17);
      expect(window.end.getHours()).toBe(8);

      // Start should be previous day (8th), end should be current day (9th)
      expect(window.start.getDate()).toBe(8);
      expect(window.end.getDate()).toBe(9);
    });

    it('should_handle_midnight_correctly', () => {
      vi.setSystemTime(new Date('2025-01-09T00:00:00+03:00'));

      const window = getNightShiftWindow();

      expect(window.start.getHours()).toBe(17);
      expect(window.end.getHours()).toBe(8);
      expect(window.start.getDate()).toBe(8);
      expect(window.end.getDate()).toBe(9);
    });
  });

  describe('Day Shift Window', () => {
    it('should_calculate_day_shift_window_correctly', () => {
      vi.setSystemTime(new Date('2025-01-09T12:00:00+03:00'));

      const window = getDayShiftWindow();

      expect(window.start.getHours()).toBe(8);
      expect(window.end.getHours()).toBe(17);
      expect(window.start.getDate()).toBe(9);
      expect(window.end.getDate()).toBe(9);
    });

    it('should_handle_8am_boundary', () => {
      vi.setSystemTime(new Date('2025-01-09T08:00:00+03:00'));

      const window = getDayShiftWindow();

      expect(window.start.getHours()).toBe(8);
      expect(window.end.getHours()).toBe(17);
    });

    it('should_handle_5pm_boundary', () => {
      vi.setSystemTime(new Date('2025-01-09T17:00:00+03:00'));

      const window = getDayShiftWindow();

      expect(window.start.getHours()).toBe(8);
      expect(window.end.getHours()).toBe(17);
    });
  });

  describe('Current Shift Detection', () => {
    it('should_detect_night_shift_before_8am', () => {
      vi.setSystemTime(new Date('2025-01-09T07:00:00+03:00'));

      expect(getCurrentShift()).toBe('night');
    });

    it('should_detect_night_shift_after_5pm', () => {
      vi.setSystemTime(new Date('2025-01-09T18:00:00+03:00'));

      expect(getCurrentShift()).toBe('night');
    });

    it('should_detect_day_shift_during_business_hours', () => {
      vi.setSystemTime(new Date('2025-01-09T12:00:00+03:00'));

      expect(getCurrentShift()).toBe('day');
    });

    it('should_detect_day_shift_at_8am', () => {
      vi.setSystemTime(new Date('2025-01-09T08:00:00+03:00'));

      expect(getCurrentShift()).toBe('day');
    });

    it('should_detect_night_shift_at_5pm', () => {
      vi.setSystemTime(new Date('2025-01-09T17:00:00+03:00'));

      expect(getCurrentShift()).toBe('night');
    });
  });

  describe('Current Shift Window', () => {
    it('should_return_night_shift_window_when_in_night_shift', () => {
      vi.setSystemTime(new Date('2025-01-09T07:00:00+03:00'));

      const window = getCurrentShiftWindow();

      expect(window.label).toContain('Gece');
      expect(window.start.getHours()).toBe(17);
      expect(window.end.getHours()).toBe(8);
    });

    it('should_return_day_shift_window_when_in_day_shift', () => {
      vi.setSystemTime(new Date('2025-01-09T12:00:00+03:00'));

      const window = getCurrentShiftWindow();

      expect(window.label).toContain('Gündüz');
      expect(window.start.getHours()).toBe(8);
      expect(window.end.getHours()).toBe(17);
    });
  });

  describe('All Shift Windows', () => {
    it('should_return_all_shift_windows', () => {
      const windows = getAllShiftWindows();

      expect(windows).toHaveLength(2);
      expect(windows[0].label).toBeDefined();
      expect(windows[1].label).toBeDefined();
      expect(windows[0].start).toBeDefined();
      expect(windows[0].end).toBeDefined();
      expect(windows[1].start).toBeDefined();
      expect(windows[1].end).toBeDefined();
    });

    it('should_order_windows_correctly', () => {
      const windows = getAllShiftWindows();

      // First window should be day, second should be night (as returned by getAllShiftWindows)
      expect(windows[0].label).toContain('Gündüz');
      expect(windows[1].label).toContain('Gece');
    });
  });
});
