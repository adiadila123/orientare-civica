import { PageSkeleton, SkeletonBlock } from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <PageSkeleton>
      <SkeletonBlock className="h-[500px] rounded-xl" />
    </PageSkeleton>
  );
}
