'use client';

import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '@/components/ui/empty-state';
import { queryKeys } from '@/lib/queryKeys';
import { PaymentService } from '@/services/paymentService';

export function DeadLetterPaymentsPanel({
  onSelectPayment,
}: {
  onSelectPayment: (paymentId: string) => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.payments.list({ status: 'FAILED', page: 1 }),
    queryFn: () =>
      PaymentService.fetchPayments({
        status: 'FAILED',
        page: 1,
        page_size: 100,
      }),
  });

  if (error) {
    return (
      <p
        role="alert"
        className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        Dead letter payments are unavailable. Please try again.
      </p>
    );
  }

  return (
    <section aria-labelledby="dead-letter-payments-title" className="space-y-3">
      <h2 id="dead-letter-payments-title" className="text-lg font-semibold">
        Failed payments awaiting retry
      </h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Failure reason</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Loading dead letter payments…
                </td>
              </tr>
            ) : data?.items.length ? (
              data.items.map((payment) => (
                <tr key={payment.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-mono">{payment.id}</td>
                  <td className="px-4 py-3">
                    {payment.amount} {payment.assetCode}
                  </td>
                  <td className="px-4 py-3">
                    {payment.failureReason ?? 'Failure reason unavailable'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectPayment(payment.id)}
                      className="rounded bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
                      aria-label={`Retry payment ${payment.id}`}
                    >
                      Retry Payment
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8">
                  <EmptyState
                    title="No dead letter payments"
                    description="Failed payments routed for operator review will appear here."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
