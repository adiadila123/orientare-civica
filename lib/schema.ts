import { z } from 'zod';

export const InstitutionSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable(),
  website_url: z.string().url().nullable(),
  contact_form_url: z.string().url().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  address: z.string().nullable(),
});
