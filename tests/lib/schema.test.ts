import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { InstitutionSchema } from '@/lib/schema';

describe('InstitutionSchema', () => {
  it('accepts a valid institution', () => {
    const result = InstitutionSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
      code: 'ANPC',
      name: 'Autoritatea Națională pentru Protecția Consumatorilor',
      description: 'Protecția consumatorilor',
      category: 'protectia_consumatorului',
      website_url: 'https://anpc.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an institution with an invalid website url', () => {
    const result = InstitutionSchema.safeParse({
      id: '1',
      code: 'ANPC',
      name: 'ANPC',
      description: null,
      category: null,
      website_url: 'not-a-url',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('seed data', () => {
  it('includes every core institution code', () => {
    const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
    const seed = readFileSync(seedPath, 'utf-8');
    const expectedCodes = ['ANPC', 'ANAF', 'PRIMARIE', 'POLITIE_LOCALA', 'ANRE', 'ANCOM', 'CNAS', 'ITM'];
    for (const code of expectedCodes) {
      expect(seed).toContain(`'${code}'`);
    }
  });
});
