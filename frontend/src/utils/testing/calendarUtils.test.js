import { describe, expect, test } from '@jest/globals';
import {
  addHoursToTime,
  buildDateTime,
  buildTimeOptions,
  formatEventTime,
  getAppointmentClientId,
  getCalendarDateFromQuery,
  getDateKey,
  getPaymentLinkTimingLabel,
  getViewRangeLabel,
  getWeekStart,
  parseFeeValue,
} from '../calendarUtils.js';

describe('calendarUtils', () => {
  test('calculates week start and date keys', () => {
    const weekStart = getWeekStart(new Date(2026, 3, 22, 14, 0));
    expect(weekStart.getDate()).toBe(20);
    expect(getDateKey(new Date(2026, 3, 22, 14, 0))).toBe('2026-04-22');
  });

  test('parses appointment and fee data', () => {
    expect(parseFeeValue(45)).toBe('45.00');
    expect(parseFeeValue(-1)).toBe('');
    expect(getAppointmentClientId({ client: 'client-123' })).toBe('client-123');
    expect(getAppointmentClientId({ client: { id: 'client-456' } })).toBe('client-456');
  });

  test('formats payment timing labels and date conversion', () => {
    expect(getPaymentLinkTimingLabel('before')).toBe('Before Session');
    expect(getCalendarDateFromQuery('2026-04-22')).toEqual(new Date(2026, 3, 22, 12, 0, 0, 0));
  });

  test('builds date times and time options', () => {
    const dateTime = buildDateTime('2026-04-22', '09:30');
    expect(dateTime.getHours()).toBe(9);
    expect(dateTime.getMinutes()).toBe(30);
    expect(addHoursToTime('23:30', 1)).toBe('00:30');
    expect(buildTimeOptions({ startHour: 8, endHour: 8, minuteStep: 30 })).toEqual(['08:00', '08:30']);
  });

  test('formats view range and event time', () => {
    const range = getViewRangeLabel(new Date(2026, 3, 1), new Date(2026, 3, 8));
    expect(range).toMatch(/Apr/i);
    expect(formatEventTime(new Date(2026, 3, 22, 14, 5))).toMatch(/14:05|2:05/i);
  });
});