import { neon } from '@neondatabase/serverless';

export function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Missing DATABASE_URL environment variable');
  }
  return neon(url);
}
