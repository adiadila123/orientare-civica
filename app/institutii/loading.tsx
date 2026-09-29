import { PageSkeleton, SkeletonBlock } from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <PageSkeleton>
      <SkeletonBlock className="h-12" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
    </PageSkeleton>
  );
}
