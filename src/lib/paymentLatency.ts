import type { Payment } from '@/types/payment';

export const PAYMENT_SLOW_THRESHOLD_MS = 10000;

export const PAYMENT_LATENCY_BUCKETS = [
  { label: '0-2s', min: 0, max: 2000, isSlow: false },
  { label: '2-5s', min: 2000, max: 5000, isSlow: false },
  { label: '5-10s', min: 5000, max: 10000, isSlow: false },
  { label: '>10s', min: 10000, max: Infinity, isSlow: true },
] as const;

export interface PaymentLatencyBucket {
  label: string;
  count: number;
  isSlow: boolean;
}

export interface PaymentLatencySummary {
  count: number;
  slowCount: number;
  averageMs: number;
  maxMs: number;
  buckets: PaymentLatencyBucket[];
}

export function getPaymentLatencyMs(payment: Payment): number | null {
  if (!payment.confirmedAt || !payment.createdAt) return null;
  const created = new Date(payment.createdAt).getTime();
  const confirmed = new Date(payment.confirmedAt).getTime();
  if (!Number.isFinite(created) || !Number.isFinite(confirmed)) return null;
  const latency = confirmed - created;
  return latency >= 0 ? latency : null;
}

export function summarizePaymentLatency(
  payments: Payment[]
): PaymentLatencySummary {
  const buckets: PaymentLatencyBucket[] = PAYMENT_LATENCY_BUCKETS.map(
    (bucket) => ({ label: bucket.label, count: 0, isSlow: bucket.isSlow })
  );
  let count = 0;
  let slowCount = 0;
  let totalMs = 0;
  let maxMs = 0;

  for (const payment of payments) {
    const latency = getPaymentLatencyMs(payment);
    if (latency === null) continue;

    count += 1;
    totalMs += latency;
    maxMs = Math.max(maxMs, latency);
    if (latency > PAYMENT_SLOW_THRESHOLD_MS) slowCount += 1;

    const bucketIndex = PAYMENT_LATENCY_BUCKETS.findIndex(
      (bucket) => latency >= bucket.min && latency < bucket.max
    );
    const bucket = buckets[bucketIndex] ?? buckets[buckets.length - 1];
    bucket.count += 1;
  }

  return {
    count,
    slowCount,
    averageMs: count === 0 ? 0 : Math.round(totalMs / count),
    maxMs: Math.round(maxMs),
    buckets,
  };
}
