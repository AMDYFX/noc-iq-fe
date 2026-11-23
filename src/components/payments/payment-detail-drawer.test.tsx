import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '@/components/ui/toast';
import { PaymentDetailDrawer } from './payment-detail-drawer';

const mocks = vi.hoisted(() => ({
  fetchPayment: vi.fn(),
  fetchPaymentHistory: vi.fn(),
  retryPayment: vi.fn(),
}));

vi.mock('@/services/paymentService', () => ({
  PaymentService: {
    fetchPayment: mocks.fetchPayment,
    fetchPaymentHistory: mocks.fetchPaymentHistory,
    retryPayment: mocks.retryPayment,
  },
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'operator-1', role: 'engineer' } }),
}));

describe('PaymentDetailDrawer', () => {
  beforeEach(() => {
    mocks.fetchPayment.mockReset();
    mocks.fetchPaymentHistory.mockReset();
    mocks.retryPayment.mockReset();
    mocks.fetchPayment.mockResolvedValue({
      id: 'pay-failed-1',
      amount: '12.00',
      assetCode: 'USDC',
      status: 'FAILED',
      type: 'penalty',
      createdAt: '2026-03-27T08:00:00.000Z',
      idempotencyKey: 'sla-penalty-001',
      idempotencyStatus: 'unique',
    });
    mocks.fetchPaymentHistory.mockResolvedValue([]);
    mocks.retryPayment.mockResolvedValue({
      id: 'pay-failed-1',
      amount: '12.00',
      assetCode: 'USDC',
      status: 'PENDING',
      type: 'penalty',
      createdAt: '2026-03-27T08:00:00.000Z',
    });
  });

  it('shows and copies the idempotency key and confirms before retrying', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <PaymentDetailDrawer paymentId="pay-failed-1" onClose={vi.fn()} />
        </ToastProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('sla-penalty-001')).toBeInTheDocument();
    expect(screen.getByText('Unique')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy Idempotency Key' })
    );
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('sla-penalty-001');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry Payment' }));
    expect(
      screen.getByRole('dialog', { name: 'Retry payment?' })
    ).toBeInTheDocument();
    expect(mocks.retryPayment).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Retry' }));
    await waitFor(() => {
      expect(mocks.retryPayment).toHaveBeenCalledWith('pay-failed-1', {
        note: undefined,
      });
    });
  });
});
