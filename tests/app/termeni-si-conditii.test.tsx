import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TermeniSiConditiiPage from '@/app/termeni-si-conditii/page';

describe('TermeniSiConditiiPage', () => {
  it('renders the page heading and the liability-limitation section', () => {
    render(<TermeniSiConditiiPage />);
    expect(screen.getByRole('heading', { name: 'Termeni și condiții' })).toBeInTheDocument();
    expect(screen.getByText('3. Limitarea răspunderii')).toBeInTheDocument();
  });
});
