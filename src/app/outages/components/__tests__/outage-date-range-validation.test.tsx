import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import OutagesPageClient from '@/app/outages/components/outages-page-client';
import { ToastProvider } from '@/components/ui/toast';

// `useUrlSync` only needs `get` and `toString`; a plain object keeps the
// fixture deterministic across jsdom versions (URLSearchParams.clear is new).
const searchParams: { values: Record<string, string> } = { values: {} };
const currentSearchParams = () => ({
  get: (key: string) => searchParams.values[key] ?? null,
  toString: () => new URLSearchParams(searchParams.values).toString(),
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => currentSearchParams(),
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'operator-1' } }),
}));

const DATA = [
  {
    id: 'outage-1',
    title: 'Lagos Core POP',
    severity: 'critical' as const,
    status: 'open' as const,
    createdAt: '2026-11-10T10:00:00.000Z',
  },
];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <OutagesPageClient data={DATA} />
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('outage date-range validation (#961)', () => {
  it('shows an inline error and suppresses rows for a reversed range', () => {
    searchParams.values = {
      date_from: '2026-11-20',
      date_to: '2026-11-01',
    };

    renderPage();

    const error = screen.getByTestId('outage-date-range-error');
    expect(error).toHaveAttribute('role', 'alert');
    expect(error).toHaveTextContent('Start date cannot be after end date.');
    expect(screen.getByLabelText('From date')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.queryByText('Lagos Core POP')).not.toBeInTheDocument();
  });

  it('clears the error when the range is valid again', () => {
    searchParams.values = {
      date_from: '2026-11-01',
      date_to: '2026-11-20',
    };

    renderPage();

    expect(
      screen.queryByTestId('outage-date-range-error')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Lagos Core POP')).toBeInTheDocument();
  });
});
