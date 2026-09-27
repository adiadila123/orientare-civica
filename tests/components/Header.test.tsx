import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/Header';

describe('Header', () => {
  it('renders the wordmark and primary nav links', () => {
    render(<Header />);
    expect(screen.getByText('Unde merg?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acasă' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cum funcționează' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instituții' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Întrebări frecvente' })).toBeInTheDocument();
  });
});
