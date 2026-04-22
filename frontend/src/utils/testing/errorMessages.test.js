import { describe, expect, test } from '@jest/globals';
import { cleanErrorMessage, getFormErrorMessage } from '../errorMessages.js';

describe('errorMessages', () => {
  test('cleans prefixed error messages', () => {
    expect(cleanErrorMessage(' 400: Error: Invalid appointment ')).toBe('Invalid appointment');
    expect(cleanErrorMessage('[409] Something went wrong')).toBe('Something went wrong');
  });

  test('drops axios status code messages', () => {
    expect(cleanErrorMessage('Request failed with status code 500')).toBe('');
  });

  test('getFormErrorMessage prefers backend message then fallback', () => {
    expect(getFormErrorMessage({ response: { data: { message: '400: Email is required' } } }, 'Fallback')).toBe('Email is required');
    expect(getFormErrorMessage({ message: 'Error: Network down' }, 'Fallback')).toBe('Network down');
    expect(getFormErrorMessage({}, 'Fallback')).toBe('Fallback');
  });
});