import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TermeniSiConditiiPage, { metadata } from '@/app/termeni-si-conditii/page';

describe('TermeniSiConditiiPage', () => {
  it('sets a canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/termeni-si-conditii');
  });

  it('renders the page heading and the liability-limitation section', () => {
    render(<TermeniSiConditiiPage />);
    expect(screen.getByRole('heading', { name: 'Termeni și condiții' })).toBeInTheDocument();
    expect(screen.getByText('3. Limitarea răspunderii')).toBeInTheDocument();
  });
});
