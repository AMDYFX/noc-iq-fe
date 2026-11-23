import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import OutagesPageClient from '@/app/outages/components/outages-page-client';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null, toString: () => '' }),
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'operator-1' } }),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <OutagesPageClient />
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('mobile outage filter drawer (#953)', () => {
  it('starts collapsed with a keyboard-accessible toggle', () => {
    renderPage();

    const toggle = screen.getByTestId('outage-filter-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'outage-filter-controls');
    expect(screen.getByTestId('outage-filter-controls')).toHaveClass('hidden');
  });

  it('opens and closes the filter controls', () => {
    renderPage();

    const toggle = screen.getByTestId('outage-filter-toggle');
    const controls = screen.getByTestId('outage-filter-controls');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(controls).toHaveClass('flex');
    expect(controls).not.toHaveClass('hidden');

    fireEvent.keyDown(toggle, { key: 'Enter' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(controls).toHaveClass('hidden');
    // Filters stay available to desktop layouts via responsive utilities.
    expect(controls).toHaveClass('md:flex');
  });
});
