import { PageSkeleton, SkeletonBlock } from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <PageSkeleton>
      <SkeletonBlock className="h-16" />
      <SkeletonBlock className="h-[600px]" />
    </PageSkeleton>
  );
}
