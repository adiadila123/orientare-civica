// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

const createCompletionMock = vi.fn();

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(function Groq() {
    return { chat: { completions: { create: createCompletionMock } } };
  }),
}));

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  findInstitution: vi.fn(),
}));

import { POST } from '@/app/api/triage/route';
import { findInstitution } from '@/lib/institutions';

const validTriageResult = {
  primary_intent: 'problema_anaf',
  urgency: 'normal',
  institution_type: 'ANAF',
  required_documents: ['carte de identitate'],
  recommended_channel: 'online',
  next_steps: ['Depune cererea pe portalul SPV'],
  explanation: 'Trebuie să contactezi ANAF.',
  confidence: 0.9,
};

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/triage', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GROQ_API_KEY = 'test-key';
  process.env.DATABASE_URL = 'postgres://test';
});

describe('POST /api/triage', () => {
  it('returns 400 when description is missing', async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 400 when description is too long', async () => {
    const response = await POST(makeRequest({ description: 'a'.repeat(2001) }));
    expect(response.status).toBe(400);
  });

  it('returns the triage result merged with the matched institution', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
    });
    vi.mocked(findInstitution).mockResolvedValue({
      id: '1',
      code: 'ANAF',
      name: 'ANAF',
      description: null,
      category: 'fiscal',
      website_url: 'https://www.anaf.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    });

    const response = await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.institution_type).toBe('ANAF');
    expect(json.institution.code).toBe('ANAF');
    expect(createCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'openai/gpt-oss-120b', response_format: { type: 'json_object' } })
    );
  });

  it('returns 500 when Groq responds with malformed JSON', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: 'nu pot răspunde' } }],
    });

    const response = await POST(makeRequest({ description: 'test' }));
    expect(response.status).toBe(500);
  });

  it('returns 500 when GROQ_API_KEY is missing', async () => {
    delete process.env.GROQ_API_KEY;

    const response = await POST(makeRequest({ description: 'Am o problemă cu ANAF' }));
    expect(response.status).toBe(500);
  });

  it('sends the user description to Groq in the user message', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
    });
    vi.mocked(findInstitution).mockResolvedValue(null);

    await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));

    expect(createCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Am o problemă cu declarația fiscală'),
          }),
        ]),
      })
    );
  });

  it('passes the parsed institution_type to findInstitution', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
    });
    vi.mocked(findInstitution).mockResolvedValue(null);

    await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));

    expect(findInstitution).toHaveBeenCalledWith(expect.anything(), validTriageResult.institution_type);
  });

  it('returns institution: null end-to-end when no match is found', async () => {
    createCompletionMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validTriageResult) } }],
    });
    vi.mocked(findInstitution).mockResolvedValue(null);

    const response = await POST(makeRequest({ description: 'Am o problemă cu declarația fiscală' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.institution).toBeNull();
  });
});
