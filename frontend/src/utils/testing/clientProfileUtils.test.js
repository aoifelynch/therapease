import { describe, expect, test } from '@jest/globals';
import { formatShortDate, getAppointmentNotes, getPaymentLinkTimingLabel, isImageFile } from '../clientProfileUtils.js';

describe('clientProfileUtils', () => {
  test('filters notes by appointment id', () => {
    const notes = [
      { id: 'note-1', appointment: { id: 'appointment-1' } },
      { id: 'note-2', appointment: 'appointment-2' },
    ];

    expect(getAppointmentNotes({ id: 'appointment-1' }, notes)).toHaveLength(1);
    expect(getAppointmentNotes({ id: 'appointment-2' }, notes)[0].id).toBe('note-2');
  });

  test('formats dates, timing labels, and image detection', () => {
    expect(formatShortDate(new Date(2026, 3, 22))).toMatch(/22.*Apr.*2026/i);
    expect(getPaymentLinkTimingLabel('now')).toBe('Sent Instantly');
    expect(isImageFile({ fileName: 'report.png' })).toBe(true);
    expect(isImageFile({ fileName: 'report.pdf' })).toBe(false);
  });
});