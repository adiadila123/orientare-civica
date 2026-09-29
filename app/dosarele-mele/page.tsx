import type { Metadata } from 'next';
import { MyRecordsView } from '@/components/MyRecordsView';

export const metadata: Metadata = {
  title: 'Dosarele mele — Unde Merg?',
};

export default function MyRecordsPage() {
  return <MyRecordsView />;
}
