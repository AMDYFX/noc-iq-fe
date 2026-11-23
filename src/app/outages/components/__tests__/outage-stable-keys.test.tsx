import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import OutagesPageClient, {
  getOutageRowKey,
} from '@/app/outages/components/outages-page-client';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null, toString: () => '' }),
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'operator-1' } }),
}));

type OutageRow = {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  createdAt: string;
};

const outage = (id: string, title: string): OutageRow => ({
  id,
  title,
  severity: 'medium',
  status: 'open',
  createdAt: '2026-11-10T10:00:00.000Z',
});

function renderPage(data: Outage[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <OutagesPageClient data={data} />
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('stable outage row keys (#957)', () => {
  it('uses the outage id as the React key', () => {
    expect(getOutageRowKey(outage('out-7', 'Core'))).toBe('out-7');
  });

  it('preserves a row node when the list is reordered', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container, rerender } = render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <OutagesPageClient
            data={[outage('a', 'Alpha'), outage('b', 'Beta')]}
          />
        </ToastProvider>
      </QueryClientProvider>
    );

    const alpha = container.querySelector('[data-outage-id="a"]');
    expect(alpha).toHaveTextContent('Alpha');

    rerender(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <OutagesPageClient
            data={[outage('b', 'Beta'), outage('a', 'Alpha')]}
          />
        </ToastProvider>
      </QueryClientProvider>
    );

    const sameAlpha = container.querySelector('[data-outage-id="a"]');
    expect(sameAlpha).toBe(alpha);
    expect(container.querySelectorAll('[data-outage-id]')).toHaveLength(2);
  });
});
