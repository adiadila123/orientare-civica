import type { Metadata } from 'next';
import { MyRecordsView } from '@/components/MyRecordsView';

export const metadata: Metadata = {
  title: 'Dosarele mele — Unde Merg?',
  // Its content is a per-browser localStorage list — nothing here is the
  // same between two visitors, so indexing it has no search value.
  robots: { index: false, follow: false },
};

export default function MyRecordsPage() {
  return <MyRecordsView />;
}
