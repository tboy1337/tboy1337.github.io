import { describe, expect, it } from 'vitest';
import {
  validateName,
  validateEmail,
  validateSubject,
  validateMessage
} from '../../lib/contact-validation.mjs';

describe('contact-validation', () => {
  it('validates names', () => {
    expect(validateName('Test User')).toBe(true);
    expect(validateName('A')).toBe(false);
    expect(validateName('User123')).toBe(false);
  });

  it('validates emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('validates subjects', () => {
    expect(validateSubject('Portfolio inquiry')).toBe(true);
    expect(validateSubject('Hi')).toBe(false);
  });

  it('validates messages', () => {
    expect(validateMessage('This is a valid test message.')).toBe(true);
    expect(validateMessage('short')).toBe(false);
  });
});
