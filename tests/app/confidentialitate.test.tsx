import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfidentialitatePage from '@/app/confidentialitate/page';

describe('ConfidentialitatePage', () => {
  it('renders the page heading, the legal-review caveat, and the data-recipients section', () => {
    render(<ConfidentialitatePage />);
    expect(screen.getByRole('heading', { name: 'Politica de confidențialitate' })).toBeInTheDocument();
    expect(screen.getByText(/nu a fost verificată de un avocat/)).toBeInTheDocument();
    expect(screen.getByText('5. Cui transmitem datele')).toBeInTheDocument();
    expect(screen.getByText(/Groq/)).toBeInTheDocument();
    expect(screen.getByText(/Neon/)).toBeInTheDocument();
  });
});
