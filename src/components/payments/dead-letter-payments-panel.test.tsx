import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeadLetterPaymentsPanel } from './dead-letter-payments-panel';

const mocks = vi.hoisted(() => ({ fetchPayments: vi.fn() }));

vi.mock('@/services/paymentService', () => ({
  PaymentService: { fetchPayments: mocks.fetchPayments },
}));

describe('DeadLetterPaymentsPanel', () => {
  beforeEach(() => {
    mocks.fetchPayments.mockReset();
  });

  it('shows failure taxonomy and opens the payment retry drawer', async () => {
    mocks.fetchPayments.mockResolvedValue({
      items: [
        {
          id: 'pay-failed-1',
          amount: '12.00',
          assetCode: 'USDC',
          failureReason: 'Insufficient Balance',
        },
      ],
      total: 1,
      page: 1,
      page_size: 100,
    });
    const onSelectPayment = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DeadLetterPaymentsPanel onSelectPayment={onSelectPayment} />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Insufficient Balance')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Retry payment pay-failed-1' })
    );
    expect(onSelectPayment).toHaveBeenCalledWith('pay-failed-1');
  });
});
