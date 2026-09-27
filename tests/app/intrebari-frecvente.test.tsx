import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import IntrebariFrecventePage from '@/app/intrebari-frecvente/page';

describe('IntrebariFrecventePage', () => {
  it('renders the page heading and all FAQ questions', () => {
    render(<IntrebariFrecventePage />);
    expect(screen.getByRole('heading', { name: 'Întrebări frecvente' })).toBeInTheDocument();
    expect(screen.getByText('Este gratuit acest serviciu?')).toBeInTheDocument();
    expect(screen.getByText('Ce fac dacă nu găsesc instituția potrivită?')).toBeInTheDocument();
  });
});
