import React, { useState } from 'react';

export interface OutageIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  durationMinutes: number;
  slaThresholdMinutes: number;
  isScheduledMaintenance: boolean;
  createdAt: string;
}

export interface CreateOutagePayload {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  durationMinutes: number;
  slaThresholdMinutes: number;
  isScheduledMaintenance: boolean;
}

export interface SlaMetricsSummary {
  totalIncidents: number;
  evaluatedIncidents: number;
  excludedMaintenanceCount: number;
  breachedCount: number;
  complianceRate: number;
}

/**
 * Computes SLA breach metrics while excluding outages flagged as scheduled maintenance.
 */
export function calculateSlaMetrics(incidents: OutageIncident[]): SlaMetricsSummary {
  const totalIncidents = incidents.length;
  const maintenanceIncidents = incidents.filter((item) => item.isScheduledMaintenance);
  const unplannedIncidents = incidents.filter((item) => !item.isScheduledMaintenance);

  const breachedCount = unplannedIncidents.filter(
    (item) => item.durationMinutes > item.slaThresholdMinutes
  ).length;

  const evaluatedIncidents = unplannedIncidents.length;
  const complianceRate =
    evaluatedIncidents === 0
      ? 100
      : Number((((evaluatedIncidents - breachedCount) / evaluatedIncidents) * 100).toFixed(2));

  return {
    totalIncidents,
    evaluatedIncidents,
    excludedMaintenanceCount: maintenanceIncidents.length,
    breachedCount,
    complianceRate,
  };
}

export const MaintenanceBadge: React.FC = () => (
  <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-300">
    Maintenance
  </span>
);

interface CreateOutageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateOutagePayload) => void | Promise<void>;
  isSubmitting?: boolean;
}

export const CreateOutageModal: React.FC<CreateOutageModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isSubmitting = false,
}) => {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [slaThresholdMinutes, setSlaThresholdMinutes] = useState<number>(60);
  const [isScheduledMaintenance, setIsScheduledMaintenance] = useState<boolean>(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    await onCreate({
      title: title.trim(),
      severity,
      durationMinutes,
      slaThresholdMinutes,
      isScheduledMaintenance,
    });

    setTitle('');
    setSeverity('medium');
    setDurationMinutes(30);
    setSlaThresholdMinutes(60);
    setIsScheduledMaintenance(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-outage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="create-outage-modal-title" className="text-lg font-semibold text-gray-100">
            Create Outage
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="outage-title" className="mb-1 block text-sm font-medium text-gray-300">
              Title
            </label>
            <input
              id="outage-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Core Router Firmware Upgrade"
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="outage-severity"
                className="mb-1 block text-xs font-medium text-gray-300"
              >
                Severity
              </label>
              <select
                id="outage-severity"
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as 'critical' | 'high' | 'medium' | 'low')
                }
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-2.5 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="outage-duration"
                className="mb-1 block text-xs font-medium text-gray-300"
              >
                Duration (min)
              </label>
              <input
                id="outage-duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-2.5 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="outage-threshold"
                className="mb-1 block text-xs font-medium text-gray-300"
              >
                SLA Limit (min)
              </label>
              <input
                id="outage-threshold"
                type="number"
                min={1}
                value={slaThresholdMinutes}
                onChange={(e) => setSlaThresholdMinutes(Number(e.target.value))}
                className="w-full rounded-md border border-gray-700 bg-gray-950 px-2.5 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-md border border-gray-800 bg-gray-950/60 p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={isScheduledMaintenance}
                onChange={(e) => setIsScheduledMaintenance(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">
                <span className="block font-medium text-gray-200">Scheduled Maintenance</span>
                <span className="block text-xs text-gray-400">
                  Exclude this planned downtime window from SLA breach and penalty calculations.
                </span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Outage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface IncidentListProps {
  incidents: OutageIncident[];
}

export const OutageIncidentList: React.FC<IncidentListProps> = ({ incidents }) => {
  const metrics = calculateSlaMetrics(incidents);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-800 bg-gray-900/70 px-4 py-3 text-xs text-gray-300">
        <span>
          SLA Compliance: <strong className="text-gray-100">{metrics.complianceRate}%</strong>
        </span>
        <span>
          Breaches: <strong className="text-red-400">{metrics.breachedCount}</strong> /{' '}
          {metrics.evaluatedIncidents} evaluated
        </span>
        <span>
          Excluded Maintenance:{' '}
          <strong className="text-blue-300">{metrics.excludedMaintenanceCount}</strong>
        </span>
      </div>

      <ul className="divide-y divide-gray-800 rounded-lg border border-gray-800 bg-gray-900">
        {incidents.map((incident) => {
          const isBreached =
            !incident.isScheduledMaintenance &&
            incident.durationMinutes > incident.slaThresholdMinutes;

          return (
            <li key={incident.id} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-100">{incident.title}</span>
                  {incident.isScheduledMaintenance && <MaintenanceBadge />}
                  {isBreached && (
                    <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                      SLA Breach
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Severity: {incident.severity} · Duration: {incident.durationMinutes}m (SLA:{' '}
                  {incident.slaThresholdMinutes}m)
                </p>
              </div>
              <span className="text-xs text-gray-500">{incident.createdAt}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};