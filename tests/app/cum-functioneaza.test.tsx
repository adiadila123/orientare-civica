import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CumFunctioneazaPage from '@/app/cum-functioneaza/page';

describe('CumFunctioneazaPage', () => {
  it('renders the page heading and the how-it-works steps', () => {
    render(<CumFunctioneazaPage />);
    expect(screen.getByRole('heading', { name: 'Cum funcționează Unde Merg?' })).toBeInTheDocument();
    expect(screen.getByText('Cum funcționează')).toBeInTheDocument();
  });
});
