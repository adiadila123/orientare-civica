import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntrebariFrecventePage, { metadata } from '@/app/intrebari-frecvente/page';

describe('IntrebariFrecventePage', () => {
  it('sets a canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/intrebari-frecvente');
  });

  it('renders the page heading and all FAQ questions', () => {
    render(<IntrebariFrecventePage />);
    expect(screen.getByRole('heading', { name: 'Întrebări frecvente' })).toBeInTheDocument();
    expect(screen.getByText('Este gratuit acest serviciu?')).toBeInTheDocument();
    expect(screen.getByText('Ce fac dacă nu găsesc instituția potrivită?')).toBeInTheDocument();
  });

  it('hides answers until their question is clicked, then reveals just that answer', async () => {
    const user = userEvent.setup();
    render(<IntrebariFrecventePage />);

    const firstAnswer = 'Da, Unde Merg? este complet gratuit și nu necesită niciun abonament.';
    expect(screen.queryByText(firstAnswer)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Este gratuit acest serviciu?' }));
    expect(screen.getByText(firstAnswer)).toBeInTheDocument();
  });
});
