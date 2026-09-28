import { describe, expect, it } from 'vitest';
import { isValidCnp } from '@/lib/cnp';

describe('isValidCnp', () => {
  it('accepts a CNP with a correct control digit', () => {
    expect(isValidCnp('1900010140017')).toBe(true);
  });

  it('rejects a CNP with an incorrect control digit', () => {
    expect(isValidCnp('1900010140010')).toBe(false);
  });

  it('rejects a truncated 11-digit CNP', () => {
    expect(isValidCnp('19000101400')).toBe(false);
  });

  it('rejects a CNP containing non-digit characters', () => {
    expect(isValidCnp('19000101400AB')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidCnp('')).toBe(false);
  });
});
