/**
 * Time Window Helper
 * Phase 11 - Warehouse MVP
 *
 * Türkiye saat dilimi (Europe/Istanbul - TRT) için zaman penceresi hesaplaması
 * Night Shift: Dün 17:00 → Bugün 08:00
 * Day Shift: Bugün 08:00 → Bugün 17:00
 */

export type ShiftType = 'night' | 'day';

export interface TimeWindow {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Gece shift zaman penceresi (Night: 17:00-08:00)
 * Önceki gün 17:00'den bugün 08:00'e kadar
 */
export function getNightShiftWindow(): TimeWindow {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Dün 17:00
  const start = new Date(today);
  start.setDate(start.getDate() - 1);
  start.setHours(17, 0, 0, 0);

  // Bugün 08:00
  const end = new Date(today);
  end.setHours(8, 0, 0, 0);

  return {
    start,
    end,
    label: 'Gece (17:00 - 08:00)',
  };
}

/**
 * Gündüz shift zaman penceresi (Day: 08:00-17:00)
 * Bugün 08:00'den bugün 17:00'e kadar
 */
export function getDayShiftWindow(): TimeWindow {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Bugün 08:00
  const start = new Date(today);
  start.setHours(8, 0, 0, 0);

  // Bugün 17:00
  const end = new Date(today);
  end.setHours(17, 0, 0, 0);

  return {
    start,
    end,
    label: 'Gündüz (08:00 - 17:00)',
  };
}

/**
 * Mevcut saate göre hangi shift'in aktif olduğunu belirler
 * 00:00 - 08:00 → Night (dünün 17:00'sinden başlayan)
 * 08:00 - 17:00 → Day
 * 17:00 - 24:00 → Night (yarına kadar geçerli)
 */
export function getCurrentShift(): ShiftType {
  const hour = new Date().getHours();

  if (hour >= 8 && hour < 17) {
    return 'day';
  }
  return 'night';
}

/**
 * Aktif shift'in zaman penceresini döndürür
 */
export function getCurrentShiftWindow(): TimeWindow {
  const shift = getCurrentShift();
  return shift === 'day' ? getDayShiftWindow() : getNightShiftWindow();
}

/**
 * Tüm shift pencerelerini döndürür
 */
export function getAllShiftWindows(): TimeWindow[] {
  return [
    getDayShiftWindow(),
    getNightShiftWindow(),
  ];
}
