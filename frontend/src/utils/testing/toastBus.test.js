import { describe, expect, test, jest } from '@jest/globals';
import { publishToast, subscribeToToasts, toast } from '../toastBus.js';

describe('toastBus', () => {
  test('publishes normalized toasts to subscribers', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToToasts(listener);

    toast.success(' Saved ', { duration: 1000 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual(expect.objectContaining({ type: 'success', message: 'Saved', duration: 1000 }));

    unsubscribe();
  });

  test('ignores blank messages', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToToasts(listener);

    publishToast({ message: '   ' });

    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });
});