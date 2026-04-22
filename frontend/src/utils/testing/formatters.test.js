import { describe, expect, test } from '@jest/globals';
import {
  formatClock,
  formatCurrency,
  formatLongDate,
  getClientName,
  isSameDay,
  startOfMonth,
  startOfWeek,
  withAlpha,
} from '../formatters.js';

describe('formatters', () => {
  test('withAlpha expands hex colors to rgba', () => {
    expect(withAlpha('#123456', 0.5)).toBe('rgba(18, 52, 86, 0.5)');
    expect(withAlpha('#abc', 0.25)).toBe('rgba(170, 187, 204, 0.25)');
  });

  test('isSameDay compares calendar dates only', () => {
    expect(isSameDay(new Date(2026, 3, 22, 8, 0), new Date(2026, 3, 22, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 3, 22), new Date(2026, 3, 23))).toBe(false);
  });

  test('startOfWeek returns monday at midnight', () => {
    const result = startOfWeek(new Date(2026, 3, 22, 15, 30));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(20);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  test('startOfMonth returns the first day of the month', () => {
    const result = startOfMonth(new Date(2026, 3, 22, 15, 30));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(1);
  });

  test('formats currency and date/time helpers', () => {
    expect(formatCurrency(1234)).toBe('€1,234');
    expect(formatClock(new Date(2026, 3, 22, 14, 5))).toMatch(/14:05|2:05\s*pm/i);
    expect(formatLongDate(new Date(2026, 3, 22))).toMatch(/22.*April.*2026/i);
  });

  test('getClientName handles strings, objects, and missing values', () => {
    expect(getClientName('Ava Murphy')).toBe('Ava Murphy');
    expect(getClientName({ firstName: 'Ava', lastName: 'Murphy' })).toBe('Ava Murphy');
    expect(getClientName(null)).toBe('Client unavailable');
  });
});