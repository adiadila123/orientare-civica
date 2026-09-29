import { PageSkeleton, SkeletonBlock } from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <PageSkeleton>
      <SkeletonBlock className="h-20" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <SkeletonBlock className="h-40" />
    </PageSkeleton>
  );
}
