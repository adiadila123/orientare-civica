import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

describe('NotFound', () => {
  it('renders a Romanian message and a link back into the app', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: 'Pagina nu a fost găsită' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vezi lista instituțiilor' })).toHaveAttribute(
      'href',
      '/institutii'
    );
  });
});
