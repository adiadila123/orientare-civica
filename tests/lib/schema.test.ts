import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { InstitutionSchema, CaseSchema } from '@/lib/schema';

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

  it('accepts an institution without the M2 guide fields (existing DB rows / fixtures)', () => {
    const result = InstitutionSchema.safeParse({
      id: '1',
      code: 'ANPC',
      name: 'ANPC',
      description: null,
      category: null,
      website_url: null,
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });
    expect(result.success).toBe(true);
  });

  it('parses and keeps the M2 guide fields when present', () => {
    const result = InstitutionSchema.safeParse({
      id: '1',
      code: 'ANAF',
      name: 'ANAF',
      description: null,
      category: null,
      website_url: null,
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
      associated_court: 'Judecătoria Sectorului 3',
      iban: 'RO49AAAA1B31007593840001',
      cod_venit: '20.01.01.01',
      cui: '22222222',
      wait_time_minutes: 25,
    });
    expect(result.success && result.data.wait_time_minutes).toBe(25);
  });
});

describe('seed data', () => {
  it('includes every core institution code', () => {
    const seedPath = path.join(process.cwd(), 'db', 'seed.sql');
    const seed = readFileSync(seedPath, 'utf-8');
    const expectedCodes = ['ANPC', 'ANAF', 'PRIMARIE', 'POLITIE_LOCALA', 'ANRE', 'ANCOM', 'CNAS', 'ITM'];
    for (const code of expectedCodes) {
      expect(seed).toContain(`'${code}'`);
    }
  });
});

describe('CaseSchema', () => {
  it('accepts a freshly-created case with only the v1 fields populated', () => {
    const result = CaseSchema.safeParse({
      id: '1',
      case_number: 'GD-2026-0001',
      user_description: 'Am primit o amendă.',
      ai_analysis: null,
      recommended_institution_id: null,
      institution_code: 'PRIMARIE',
      status: 'new',
      session_id: null,
      created_at: '2026-09-28T10:00:00.000Z',
      petitioner_name: null,
      petitioner_cnp: null,
      petitioner_address: null,
      petitioner_email: null,
      petitioner_phone: null,
      pv_series: null,
      pv_number: null,
      pv_issue_date: null,
      pv_amount: null,
      pv_penalty_points: null,
      pv_issuing_agent: null,
      grounds: null,
      annexes: [],
      revision: 1,
      updated_at: '2026-09-28T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('coerces Date objects (as returned by the real Postgres driver) into ISO strings', () => {
    const result = CaseSchema.safeParse({
      id: '1',
      case_number: 'GD-2026-0001',
      user_description: 'Am primit o amendă.',
      ai_analysis: null,
      recommended_institution_id: null,
      institution_code: 'PRIMARIE',
      status: 'new',
      session_id: null,
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      petitioner_name: null,
      petitioner_cnp: null,
      petitioner_address: null,
      petitioner_email: null,
      petitioner_phone: null,
      pv_series: null,
      pv_number: null,
      pv_issue_date: new Date('2026-09-01T00:00:00.000Z'),
      pv_amount: null,
      pv_penalty_points: null,
      pv_issuing_agent: null,
      grounds: null,
      annexes: [],
      revision: 1,
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.created_at).toBe('2026-09-28T10:00:00.000Z');
      expect(result.data.pv_issue_date).toBe('2026-09-01T00:00:00.000Z');
      expect(result.data.updated_at).toBe('2026-09-28T10:00:00.000Z');
    }
  });
});
