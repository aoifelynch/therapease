import { describe, expect, test } from '@jest/globals';
import { formatAppointmentDate, getAppointmentDateTime, getTodayDateKey } from '../clientListUtils.js';

describe('clientListUtils', () => {
  test('builds appointment date times', () => {
    const result = getAppointmentDateTime({ date: '2026-04-22T00:00:00.000Z', startTime: '09:15' });
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(15);
  });

  test('formats appointment dates and today key', () => {
    expect(formatAppointmentDate(null)).toBe('No appointment');
    expect(getTodayDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});