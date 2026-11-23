import type { Payment } from '@/types/payment';

export interface BatchSettlementSummary {
  batchCount: number;
  settlementVolume: number;
  successRate: number;
  completedBatches: number;
  ongoingBatches: number;
  failedRetries: number;
  progressPercent: number;
  assetCode: string | null;
}

const SUCCESS_STATUSES = new Set([
  'confirmed',
  'released',
  'completed',
  'success',
  'settled',
]);
const FAILED_STATUSES = new Set(['failed', 'error', 'reversed', 'rejected']);

function batchId(payment: Payment): string {
  return payment.commissionId ?? payment.outageId ?? payment.id;
}

function resolveAssetCode(payments: Payment[]): string | null {
  let assetCode: string | null = null;
  let mixed = false;
  for (const payment of payments) {
    if (!payment.assetCode) continue;
    if (assetCode === null) assetCode = payment.assetCode;
    else if (assetCode !== payment.assetCode) mixed = true;
  }
  return mixed ? null : assetCode;
}

export function summarizeBatchSettlements(
  payments: Payment[]
): BatchSettlementSummary {
  const batches = new Map<string, Payment[]>();
  for (const payment of payments) {
    const id = batchId(payment);
    const group = batches.get(id);
    if (group) group.push(payment);
    else batches.set(id, [payment]);
  }

  let completedBatches = 0;
  let failedBatches = 0;
  let settlementVolume = 0;
  let failedRetries = 0;

  for (const group of batches.values()) {
    const status = (group[group.length - 1]?.status ?? '').toLowerCase();
    if (SUCCESS_STATUSES.has(status)) completedBatches += 1;
    else if (FAILED_STATUSES.has(status)) failedBatches += 1;

    for (const payment of group) {
      if (payment.type === 'penalty') {
        const amount = payment.amountValue;
        if (Number.isFinite(amount)) settlementVolume += Math.abs(amount);
      }
      if (FAILED_STATUSES.has((payment.status ?? '').toLowerCase())) {
        failedRetries += 1;
      }
    }
  }

  const batchCount = batches.size;
  const finalizedBatches = completedBatches + failedBatches;

  return {
    batchCount,
    settlementVolume: Math.round(settlementVolume * 100) / 100,
    successRate:
      batchCount === 0 ? 0 : Math.round((completedBatches / batchCount) * 100),
    completedBatches,
    ongoingBatches: Math.max(0, batchCount - finalizedBatches),
    failedRetries,
    progressPercent:
      batchCount === 0 ? 0 : Math.round((finalizedBatches / batchCount) * 100),
    assetCode: resolveAssetCode(payments),
  };
}
