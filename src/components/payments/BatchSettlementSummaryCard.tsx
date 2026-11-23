'use client';

import { useMemo } from 'react';

import { summarizeBatchSettlements } from '@/lib/batchSettlement';
import { formatTotal } from '@/lib/paymentTotals';
import { cn } from '@/lib/utils';
import type { Payment } from '@/types/payment';

export interface BatchSettlementSummaryCardProps {
  payments: Payment[];
  className?: string;
}

export default function BatchSettlementSummaryCard({
  payments,
  className,
}: BatchSettlementSummaryCardProps) {
  const summary = useMemo(() => summarizeBatchSettlements(payments), [payments]);

  return (
    <section
      className={cn('rounded-xl bg-white p-5 shadow-sm', className)}
      aria-labelledby="batch-settlement-summary-title"
      data-testid="batch-settlement-summary"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="batch-settlement-summary-title"
          className="text-sm font-semibold text-gray-600 uppercase tracking-wide"
        >
          Batch Settlement Payouts
        </h2>
        <span className="text-xs text-gray-500">
          {summary.completedBatches} completed · {summary.ongoingBatches} ongoing
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600">Total Batches</p>
          <p
            className="mt-1 text-xl font-bold text-slate-900"
            data-testid="batch-settlement-count"
          >
            {summary.batchCount}
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-600">Settlement Volume</p>
          <p
            className="mt-1 text-xl font-bold text-blue-700"
            data-testid="batch-settlement-volume"
          >
            {formatTotal(summary.settlementVolume, summary.assetCode)}
          </p>
        </div>
        <div className="rounded-lg border border-green-100 bg-green-50 p-3">
          <p className="text-xs font-medium text-green-600">Success Rate</p>
          <p
            className="mt-1 text-xl font-bold text-green-700"
            data-testid="batch-settlement-success-rate"
          >
            {summary.successRate}%
          </p>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-medium text-red-600">Failed Retries</p>
          <p
            className="mt-1 text-xl font-bold text-red-700"
            data-testid="batch-settlement-failed-retries"
          >
            {summary.failedRetries}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
          <span>Ongoing batch payouts</span>
          <span>{summary.progressPercent}% complete</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-label="Ongoing batch payout progress"
          aria-valuenow={summary.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          data-testid="batch-settlement-progress"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-200"
            style={{ width: `${summary.progressPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
