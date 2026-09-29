import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageSkeleton, SkeletonBlock } from '@/components/PageSkeleton';

describe('PageSkeleton', () => {
  it('exposes a status role so assistive tech announces the loading state', () => {
    render(<PageSkeleton />);
    expect(screen.getByRole('status', { name: 'Se încarcă' })).toBeInTheDocument();
  });

  it('renders any children passed to it', () => {
    render(
      <PageSkeleton>
        <SkeletonBlock className="h-24" />
      </PageSkeleton>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
