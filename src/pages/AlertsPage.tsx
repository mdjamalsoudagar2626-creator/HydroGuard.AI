import { useState } from 'react';
import { Check, Search } from 'lucide-react';
import { StatusLabel } from '../components/StatusLabel';
import type { AlertItem, MaintenanceTask } from '../types/water';

interface AlertsPageProps {
  alerts: AlertItem[];
  onUpdateAlertStatus: (id: string, status: AlertItem['status']) => void;
  maintenanceTasks: MaintenanceTask[];
  onUpdateTaskStatus: (id: string, status: MaintenanceTask['status']) => void;
}

export function AlertsPage({
  alerts,
  onUpdateAlertStatus,
  maintenanceTasks,
  onUpdateTaskStatus,
}: AlertsPageProps) {
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Critical' | 'Warning' | 'Normal'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity =
      severityFilter === 'All' || alert.severity === severityFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesQuery;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && a.status !== 'Resolved').length;
  const warningCount = alerts.filter((a) => a.severity === 'Warning' && a.status !== 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Alerts, Notifications &amp; Maintenance Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phase 4 &amp; Phase 5 operations: Track turbidity, pH, pressure, leakage, tank level, and water quality alerts with color + text indicators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-slate-500">Critical Active</div>
            <StatusLabel status="Critical" label={`${criticalCount} Critical`} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Warning Active</div>
            <StatusLabel status="Warning" label={`${warningCount} Warning`} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Indicator Legend</div>
            <span className="text-xs text-slate-600">
              Green: Normal · Yellow: Warning · Red: Critical
            </span>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(['All', 'Critical', 'Warning', 'Normal'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  severityFilter === sev
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category or alert..."
              className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="py-10 text-center space-y-2 border-t border-slate-100">
            <div className="text-sm font-semibold text-slate-900">
              No matching alerts in this view
            </div>
            <p className="text-xs text-slate-500">
              Switch scenarios on the Home or Top Bar (e.g., High Turbidity Spike or Suspected Pipe Leak) to observe automated alert triage.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                    <StatusLabel status={alert.severity} compact />
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{alert.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{alert.timestamp}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Phase 0{alert.phaseNumber}: {alert.workflowName}
                    </span>
                  </div>
                  <div className="font-display font-semibold text-sm text-slate-900">
                    {alert.title} —{' '}
                    <span className="font-mono text-sky-700">{alert.metricValue}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-slate-600 mr-1">
                    {alert.status}
                  </span>
                  {alert.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => onUpdateAlertStatus(alert.id, 'Investigating')}
                      className="h-8 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Investigate
                    </button>
                  )}
                  {alert.status !== 'Resolved' && (
                    <button
                      type="button"
                      onClick={() => onUpdateAlertStatus(alert.id, 'Resolved')}
                      className="h-8 px-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Phase 5 Scheduled Maintenance Tasks */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Phase 5: Scheduled Pipeline Maintenance Work Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track physical inspections and seal/filtration repairs generated from monitoring abnormalities.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-medium">Task ID</th>
                <th className="py-2.5 font-medium">Target Segment</th>
                <th className="py-2.5 font-medium">Inspection / Action</th>
                <th className="py-2.5 font-medium">Priority</th>
                <th className="py-2.5 font-medium">Scheduled Date</th>
                <th className="py-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenanceTasks.map((task) => (
                <tr key={task.id} className="h-11">
                  <td className="py-2 font-mono font-medium text-slate-900">{task.id}</td>
                  <td className="py-2 font-medium text-slate-800">{task.segmentName}</td>
                  <td className="py-2 text-slate-600">{task.title}</td>
                  <td className="py-2 font-medium text-slate-700">{task.priority}</td>
                  <td className="py-2 font-mono tabular-nums text-slate-600">
                    {task.scheduledDate}
                  </td>
                  <td className="py-2 text-right">
                    <select
                      aria-label={`Update status for ${task.id}`}
                      value={task.status}
                      onChange={(e) =>
                        onUpdateTaskStatus(
                          task.id,
                          e.target.value as MaintenanceTask['status']
                        )
                      }
                      className="h-7 px-2 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
