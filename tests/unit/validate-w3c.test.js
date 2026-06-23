// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  W3C_CSS_FILES,
  W3C_CSS_PROFILE,
  extractW3cMessages,
  filterW3cErrors,
  formatCssValidationErrors
} from '../../scripts/validate-w3c.mjs';

describe('validate-w3c helpers', () => {
  it('extractW3cMessages maps validator payloads', () => {
    const messages = extractW3cMessages({
      messages: [
        { type: 'error', message: 'Bad element', lastLine: 10, lastColumn: 4 }
      ]
    });

    expect(messages).toEqual([
      { type: 'error', message: 'Bad element', line: 10, column: 4 }
    ]);
  });

  it('filterW3cErrors keeps only error-level messages', () => {
    const errors = filterW3cErrors([
      { type: 'info', message: 'ignored' },
      { type: 'error', message: 'real issue', line: 1, column: 1 }
    ]);

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe('real issue');
  });

  it('formats CSS validation errors with file paths', () => {
    const formatted = formatCssValidationErrors(
      [{ line: 12, message: 'Unknown property' }],
      'games.css'
    );

    expect(formatted).toBe('  games.css:12 Unknown property');
  });

  it('targets built CSS assets served in production', () => {
    expect(W3C_CSS_FILES).toEqual(['games.css', 'tailwind.css']);
    expect(W3C_CSS_PROFILE).toBe('css3svg');
  });
});
