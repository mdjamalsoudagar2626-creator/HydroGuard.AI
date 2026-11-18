import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PipelineSchematic } from '../components/PipelineSchematic';
import { StatusLabel } from '../components/StatusLabel';
import {
  DAILY_CONSUMPTION_DATA,
  LEAKAGE_INCIDENT_HISTORY,
} from '../data/workflowData';
import type {
  PipelineSegment,
  QualityThresholds,
  SensorReading,
} from '../types/water';
import type { EvaluatedTelemetry } from '../utils/telemetryEngine';

interface PipelineMonitoringPageProps {
  reading: SensorReading;
  history: SensorReading[];
  evalResult: EvaluatedTelemetry;
  thresholds: QualityThresholds;
  segments: PipelineSegment[];
  onScheduleMaintenance: (segmentName: string, reason: string) => void;
}

export function PipelineMonitoringPage({
  reading,
  history,
  evalResult,
  thresholds,
  segments,
  onScheduleMaintenance,
}: PipelineMonitoringPageProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(
    segments[2]?.id ?? 'seg-trunk'
  );
  const [scheduledToast, setScheduledToast] = useState<string | null>(null);

  const selectedSegment =
    segments.find((s) => s.id === selectedSegmentId) ?? segments[0];

  const handleCreateInspection = () => {
    if (!selectedSegment) return;
    onScheduleMaintenance(
      selectedSegment.name,
      `Pipe stress ${selectedSegment.stressPercent}/100 · Leak probability ${selectedSegment.leakProbability}%`
    );
    setScheduledToast(`Inspection work order scheduled for ${selectedSegment.name}.`);
    setTimeout(() => setScheduledToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Pipeline Hydraulics, Stress &amp; Leakage Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phase 3 workflows: Monitor pressure transients, consumption variance, tank autonomy, and probabilistic leakage detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500">Consumption Variance</div>
            <div className="font-mono tabular-nums text-sm font-semibold text-slate-900">
              {evalResult.consumptionVariancePercent > 0 ? '+' : ''}
              {evalResult.consumptionVariancePercent}% vs baseline
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateInspection}
            className="h-9 px-4 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap"
          >
            Schedule Segment Inspection
          </button>
        </div>
      </section>

      {scheduledToast && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium px-4 py-3 rounded-xl">
          {scheduledToast}
        </div>
      )}

      {/* Interactive SVG Pipeline Schematic */}
      <PipelineSchematic
        segments={segments}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={setSelectedSegmentId}
        tankLevel={reading.tankLevel}
      />

      {/* Pressure Variation & Daily Water Consumption Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Pipeline Pressure Variation Graph
              </h2>
              <p className="text-xs text-slate-500">
                Safe operating band: {thresholds.pressureMin} – {thresholds.pressureMax} bar
              </p>
            </div>
            <StatusLabel status={evalResult.pressureStatus} compact />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 8]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <ReferenceLine y={thresholds.pressureMax} stroke="#DC2626" strokeDasharray="4 4" />
                <ReferenceLine y={thresholds.pressureMin} stroke="#D97706" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  name="Line Pressure (bar)"
                  stroke="#0369A1"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Daily Water Consumption Graph
              </h2>
              <p className="text-xs text-slate-500">
                Hourly supply volume (Liters) compared against expected baseline profile
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs text-slate-500">
              Tank {reading.tankLevel.toFixed(0)}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_CONSUMPTION_DATA} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="actualLiters" name="Actual Consumption (L)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="baselineLiters" name="Expected Baseline (L)" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Water Leakage Incident History Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Water Leakage Incident History
            </h2>
            <p className="text-xs text-slate-500">
              Logged hydraulic anomalies with estimated confidence levels (probabilistic detection, verified in field)
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Current network leak estimate: <strong className="font-mono text-slate-900">{evalResult.leakProbabilityPercent}%</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 font-medium">Incident ID</th>
                <th className="py-2.5 font-medium">Timestamp</th>
                <th className="py-2.5 font-medium">Pipeline Segment</th>
                <th className="py-2.5 font-medium text-right">Est. Loss</th>
                <th className="py-2.5 font-medium text-right">Pressure Drop</th>
                <th className="py-2.5 font-medium text-right">Confidence</th>
                <th className="py-2.5 font-medium">Field Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {LEAKAGE_INCIDENT_HISTORY.map((inc) => (
                <tr key={inc.id} className="h-11 hover:bg-slate-50/80">
                  <td className="py-2 font-mono font-medium text-slate-900">{inc.id}</td>
                  <td className="py-2 font-mono tabular-nums text-slate-600">{inc.date}</td>
                  <td className="py-2 text-slate-900">{inc.segment}</td>
                  <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                    {inc.estimatedLossLiters} L
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                    -{inc.pressureDropBar.toFixed(2)} bar
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-sky-700 font-semibold">
                    {inc.confidencePercent}%
                  </td>
                  <td className="py-2 text-slate-600">{inc.resolution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
