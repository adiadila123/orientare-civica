import type { ReactNode } from 'react';

interface PageSkeletonProps {
  children?: ReactNode;
}

export function PageSkeleton({ children }: PageSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Se încarcă"
      className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg"
    >
      <div className="flex flex-col gap-space-xs">
        <div className="h-9 w-2/3 max-w-md rounded-lg bg-surface-container-low animate-pulse" />
        <div className="h-5 w-full max-w-xl rounded-lg bg-surface-container-low animate-pulse" />
      </div>
      {children}
    </div>
  );
}

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = 'h-32' }: SkeletonBlockProps) {
  return <div className={`w-full rounded-xl bg-surface-container-low animate-pulse ${className}`} />;
}
