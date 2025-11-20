import { describe, test, expect } from 'vitest';

describe('Vitest Setup', () => {
  test('smoke test - vitest is working', () => {
    expect(true).toBe(true);
  });

  test('TypeScript support works', () => {
    const value: string = 'test';
    expect(value).toBeTypeOf('string');
  });

  test('assertions work correctly', () => {
    expect(1 + 1).toBe(2);
    expect([1, 2, 3]).toHaveLength(3);
    expect({ name: 'test' }).toHaveProperty('name');
  });
});
