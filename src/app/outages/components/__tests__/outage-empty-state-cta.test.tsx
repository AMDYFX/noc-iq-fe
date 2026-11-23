import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OutagesPageClient from '@/app/outages/components/outages-page-client';
import { ToastProvider } from '@/components/ui/toast';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
const searchParams: { values: Record<string, string> } = { values: {} };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => searchParams.values[key] ?? null,
    toString: () => new URLSearchParams(searchParams.values).toString(),
  }),
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'operator-1' } }),
}));

function renderPage(data: ComponentProps<typeof OutagesPageClient>['data']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <OutagesPageClient data={data} />
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('outage empty-state CTA (#949)', () => {
  beforeEach(() => {
    push.mockReset();
    searchParams.values = {};
  });

  it('links to the create route when there is no data', () => {
    renderPage([]);

    const cta = screen.getByRole('button', { name: 'Log an outage' });
    fireEvent.click(cta);

    expect(push).toHaveBeenCalledWith('/outages/new');
  });

  it('hides the CTA when filters remove all rows', () => {
    searchParams.values = { search: 'nonexistent-site' };
    renderPage([
      {
        id: 'outage-1',
        title: 'Lagos Core POP',
        severity: 'critical',
        status: 'open',
        createdAt: '2026-11-10T10:00:00.000Z',
      },
    ]);

    expect(
      screen.queryByRole('button', { name: 'Log an outage' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear Search' })).toBeInTheDocument();
  });
});
