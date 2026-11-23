'use client';

import { useMemo } from 'react';

import {
  PAYMENT_SLOW_THRESHOLD_MS,
  summarizePaymentLatency,
} from '@/lib/paymentLatency';
import { cn } from '@/lib/utils';
import type { Payment } from '@/types/payment';

export interface PaymentLatencyChartProps {
  payments: Payment[];
  className?: string;
}

export default function PaymentLatencyChart({
  payments,
  className,
}: PaymentLatencyChartProps) {
  const summary = useMemo(() => summarizePaymentLatency(payments), [payments]);

  if (summary.count === 0) {
    return (
      <div
        data-testid="payment-latency-chart-empty"
        className={cn(
          'rounded-lg border border-slate-200 p-4 text-sm text-slate-400',
          className
        )}
      >
        No confirmation latency recorded yet.
      </div>
    );
  }

  const width = 520;
  const height = 180;
  const left = 16;
  const right = 16;
  const top = 24;
  const bottom = 36;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const step = plotWidth / summary.buckets.length;
  const barWidth = step * 0.6;
  const maxCount = Math.max(1, ...summary.buckets.map((bucket) => bucket.count));
  const thresholdX = left + step * 3;
  const caption = `${summary.count} confirmed transaction${
    summary.count === 1 ? '' : 's'
  }; ${summary.slowCount} exceeded ${PAYMENT_SLOW_THRESHOLD_MS / 1000} seconds. Average ${summary.averageMs}ms, max ${summary.maxMs}ms.`;

  return (
    <section
      className={cn('rounded-lg border border-slate-200 p-4', className)}
      aria-labelledby="payment-latency-chart-title"
      data-testid="payment-latency-chart"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="payment-latency-chart-title"
          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Confirmation latency distribution
        </h2>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            summary.slowCount > 0
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700'
          )}
          data-testid="payment-latency-slow-count"
        >
          {summary.slowCount} over 10s
        </span>
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={caption}
        className="w-full"
      >
        <title>Payment transaction confirmation latency distribution</title>
        <desc>{caption}</desc>

        <line
          data-testid="payment-latency-threshold-line"
          x1={thresholdX}
          x2={thresholdX}
          y1={top - 8}
          y2={height - bottom}
          stroke="currentColor"
          className="text-amber-500"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text
          x={thresholdX + 4}
          y={top - 10}
          fontSize={9}
          className="fill-amber-600"
        >
          {PAYMENT_SLOW_THRESHOLD_MS / 1000}s threshold
        </text>

        {summary.buckets.map((bucket, index) => {
          const barHeight = (bucket.count / maxCount) * plotHeight;
          const x = left + index * step + (step - barWidth) / 2;
          const y = top + plotHeight - barHeight;
          const centerX = x + barWidth / 2;
          return (
            <g key={bucket.label}>
              <rect
                data-testid={
                  bucket.isSlow ? 'payment-latency-slow-bar' : 'payment-latency-bar'
                }
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill="currentColor"
                className={bucket.isSlow ? 'text-amber-500' : 'text-indigo-600'}
              />
              <title>
                {bucket.label}: {bucket.count} transaction
                {bucket.count === 1 ? '' : 's'}
              </title>
              <text
                x={centerX}
                y={Math.max(top - 2, y - 4)}
                textAnchor="middle"
                fontSize={10}
                className="fill-slate-600"
              >
                {bucket.count}
              </text>
              <text
                x={centerX}
                y={height - 12}
                textAnchor="middle"
                fontSize={10}
                className="fill-slate-500"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>

      <table className="sr-only">
        <caption>Payment transaction confirmation latency distribution</caption>
        <thead>
          <tr>
            <th scope="col">Latency range</th>
            <th scope="col">Transactions</th>
          </tr>
        </thead>
        <tbody data-testid="payment-latency-data-table">
          {summary.buckets.map((bucket) => (
            <tr key={bucket.label}>
              <th scope="row">{bucket.label}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
