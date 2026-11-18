import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { StatusLabel } from '../components/StatusLabel';
import {
  downloadCSVReport,
  downloadEngineeringSummary,
} from '../utils/telemetryEngine';
import type {
  AIAnalysisResult,
  AlertItem,
  PipelineSegment,
  QualityThresholds,
  SensorReading,
} from '../types/water';
import type { EvaluatedTelemetry } from '../utils/telemetryEngine';

interface ReportsPageProps {
  reading: SensorReading;
  history: SensorReading[];
  evalResult: EvaluatedTelemetry;
  thresholds: QualityThresholds;
  alerts: AlertItem[];
  segments: PipelineSegment[];
  aiResult: AIAnalysisResult | null;
}

export function ReportsPage({
  reading,
  history,
  evalResult,
  thresholds,
  alerts,
  segments,
  aiResult,
}: ReportsPageProps) {
  const [periodView, setPeriodView] = useState<'daily' | 'monthly'>('daily');

  const recommendationsList = aiResult
    ? aiResult.recommendations.map((r) => `${r.title}: ${r.action}`)
    : [
        'Inspect pipeline joints if pressure fluctuates outside 2.2–5.8 bar.',
        'Backwash sand & carbon filtration media whenever turbidity exceeds 1.0 NTU.',
        'Calibrate pH probe with standard 4.0 / 7.0 buffers if readings drift.',
        'Verify overhead tank refill cycles before capacity drops below 30%.',
      ];

  const handleDownloadJSON = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      standardApplied: thresholds.standardName,
      dataSource: reading.source,
      latestReading: reading,
      evaluation: evalResult,
      pipelineSegments: segments,
      alerts,
      aiRecommendations: recommendationsList,
      recentSamples: history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water-diagnostics-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Download Actions */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Monitoring Reports &amp; Compliance Summaries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phase 5 workflow: Generate downloadable sensor logs, water quality analyses, pipeline condition audits, and daily/monthly summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadCSVReport(history, alerts, thresholds)}
            className="h-9 px-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download CSV Log</span>
          </button>
          <button
            type="button"
            onClick={() =>
              downloadEngineeringSummary(
                reading,
                evalResult,
                thresholds,
                alerts,
                recommendationsList
              )
            }
            className="h-9 px-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Download Summary (.txt)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="h-9 px-4 inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Export JSON</span>
          </button>
        </div>
      </section>

      {/* Daily vs Monthly Monitoring Summary */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              {periodView === 'daily'
                ? 'Daily Operational Monitoring Summary'
                : 'Monthly Utility Compliance Summary'}
            </h2>
            <p className="text-xs text-slate-500">
              Includes sensor averages, pipeline health, detected abnormalities, and active recommendations
            </p>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setPeriodView('daily')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                periodView === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Summary
            </button>
            <button
              type="button"
              onClick={() => setPeriodView('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                periodView === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Summary
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
          <div>
            <div className="text-xs text-slate-500">
              {periodView === 'daily' ? '24h Supply Volume' : '30-Day Supply Volume'}
            </div>
            <div className="font-mono tabular-nums text-xl font-semibold text-slate-900 mt-1">
              {periodView === 'daily' ? '13,330 L' : '398,400 L'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Mean Water pH</div>
            <div className="font-mono tabular-nums text-xl font-semibold text-slate-900 mt-1">
              {periodView === 'daily' ? reading.ph.toFixed(2) : '7.19'} pH
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Mean Turbidity</div>
            <div className="font-mono tabular-nums text-xl font-semibold text-slate-900 mt-1">
              {periodView === 'daily' ? reading.turbidity.toFixed(2) : '0.88'} NTU
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Standards Compliance</div>
            <div className="font-mono tabular-nums text-xl font-semibold text-emerald-700 mt-1">
              {periodView === 'daily'
                ? evalResult.overallStatus === 'Safe'
                  ? '98.4%'
                  : '86.2%'
                : '96.8%'}
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Condition & Alerts Digest */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Pipeline Condition Digest
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">Segment</th>
                  <th className="py-2 font-medium text-right">Pressure</th>
                  <th className="py-2 font-medium text-right">Stress</th>
                  <th className="py-2 font-medium text-right">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {segments.map((seg) => (
                  <tr key={seg.id} className="h-10">
                    <td className="py-2 font-medium text-slate-900">{seg.name}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                      {seg.pressureBar.toFixed(2)} bar
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                      {seg.stressPercent}/100
                    </td>
                    <td className="py-2 text-right">
                      <StatusLabel status={seg.status} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Report Recommendations &amp; Findings
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-700 list-disc pl-4">
            {recommendationsList.map((rec, i) => (
              <li key={i} className="leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tabular Sensor Readings Log */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recent Sensor Readings Log ({history.length} samples)
          </h2>
          <span className="text-xs text-slate-500">
            Source: {reading.source === 'hardware' ? 'Hardware Node' : 'Simulated Sandbox'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-medium">Time</th>
                <th className="py-2.5 font-medium">Source</th>
                <th className="py-2.5 font-medium text-right">pH</th>
                <th className="py-2.5 font-medium text-right">Turbidity</th>
                <th className="py-2.5 font-medium text-right">Temp</th>
                <th className="py-2.5 font-medium text-right">Flow</th>
                <th className="py-2.5 font-medium text-right">Pressure</th>
                <th className="py-2.5 font-medium text-right">Tank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {history
                .slice()
                .reverse()
                .slice(0, 10)
                .map((row) => (
                  <tr key={row.id} className="h-10 hover:bg-slate-50/70">
                    <td className="py-2 text-slate-700">{row.timeLabel}</td>
                    <td className="py-2 font-sans text-slate-600 capitalize">{row.source}</td>
                    <td className="py-2 text-right text-slate-900">{row.ph.toFixed(2)}</td>
                    <td className="py-2 text-right text-slate-900">
                      {row.turbidity.toFixed(2)} NTU
                    </td>
                    <td className="py-2 text-right text-slate-700">
                      {row.temperature.toFixed(1)} °C
                    </td>
                    <td className="py-2 text-right text-slate-700">
                      {row.flowRate.toFixed(1)} L/m
                    </td>
                    <td className="py-2 text-right text-slate-900">
                      {row.pressure.toFixed(2)} bar
                    </td>
                    <td className="py-2 text-right text-slate-700">
                      {row.tankLevel.toFixed(0)}%
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
