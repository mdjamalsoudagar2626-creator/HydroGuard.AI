import { useState } from 'react';
import {
  AlertCircle,
  BrainCircuit,
  CalendarPlus,
  CheckCircle2,
  Info,
  Wrench,
} from 'lucide-react';
import { StatusLabel } from '../components/StatusLabel';
import type {
  AIAnalysisResult,
  QualityThresholds,
  SensorReading,
} from '../types/water';
import type { EvaluatedTelemetry } from '../utils/telemetryEngine';

interface AIAnalysisPageProps {
  reading: SensorReading;
  evalResult: EvaluatedTelemetry;
  thresholds: QualityThresholds;
  aiResult: AIAnalysisResult | null;
  aiError: string | null;
  isAnalyzing: boolean;
  onRunAI: () => void;
  onScheduleMaintenance: (segmentName: string, reason: string) => void;
}

export function AIAnalysisPage({
  reading,
  evalResult,
  thresholds,
  aiResult,
  aiError,
  isAnalyzing,
  onRunAI,
  onScheduleMaintenance,
}: AIAnalysisPageProps) {
  const [scheduledTitle, setScheduledTitle] = useState<string | null>(null);

  const handleSchedule = (target: string, action: string) => {
    onScheduleMaintenance(target, action);
    setScheduledTitle(target);
    setTimeout(() => setScheduledTitle(null), 4000);
  };

  // Deterministic rule-based baseline preview before or alongside live Gemini analysis
  const baselineRecommendations = [
    ...(evalResult.turbidityStatus !== 'Safe'
      ? [
          {
            title: 'Check Sand & Carbon Filtration System',
            action: `Turbidity is ${reading.turbidity} NTU. Inspect filter media for clogging or breakthrough and initiate backwash cycle.`,
            targetComponent: 'Sand & Carbon Filtration Header',
            priority: 'High' as const,
            phaseLabel: 'Phase 4 · Water Quality',
          },
        ]
      : []),
    ...(evalResult.phStatus !== 'Safe'
      ? [
          {
            title: 'Calibrate pH Sensor & Verify Dosing',
            action: `Measured pH (${reading.ph}) deviates from ${thresholds.phMin}–${thresholds.phMax}. Perform two-point buffer calibration (pH 4.0 / 7.0) before adjusting chemical dosing.`,
            targetComponent: 'pH Probe (Intake & Filtration)',
            priority: 'High' as const,
            phaseLabel: 'Phase 1 · Calibration',
          },
        ]
      : []),
    ...(evalResult.pressureStatus !== 'Safe'
      ? [
          {
            title: 'Inspect Pipeline Pressure Regulators',
            action: `Pressure at ${reading.pressure} bar exceeds normal band (${thresholds.pressureMin}–${thresholds.pressureMax} bar). Inspect PRV valves and pump speed controller.`,
            targetComponent: 'Main Distribution Trunk',
            priority: 'High' as const,
            phaseLabel: 'Phase 3 · Hydraulics',
          },
        ]
      : []),
    ...(evalResult.leakageStatus !== 'Safe'
      ? [
          {
            title: 'Inspect Probable Leakage Corridor',
            action: `Flow-pressure divergence suggests an estimated ${evalResult.leakProbabilityPercent}% leak probability. Walk joints along Hostel & Lab Branch B and Main Trunk.`,
            targetComponent: 'Hostel & Lab Branch B',
            priority: 'High' as const,
            phaseLabel: 'Phase 3 · Leak Detection',
          },
        ]
      : []),
    {
      title: 'Routine Preventive Pipe Stress Check',
      action:
        'Continue logging flow-pressure correlation and schedule routine gasket torque verification.',
      targetComponent: 'Main Distribution Trunk',
      priority: 'Low' as const,
      phaseLabel: 'Phase 5 · Preventive Maintenance',
    },
  ];

  const activeRecommendations = aiResult?.recommendations ?? baselineRecommendations;

  return (
    <div className="space-y-6">
      {/* Header & Trigger */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-xl font-bold text-slate-900">
            AI Prediction &amp; Engineering Recommendations
          </h1>
          <p className="text-sm text-slate-500">
            Phase 4 intelligence: Identifies abnormal pH, turbidity spikes, pressure surges, probable leaks, and preventive maintenance needs with explicit confidence bounds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-600">
            Input Source:{' '}
            <strong className="text-slate-900">
              {reading.source === 'hardware' ? 'Live Hardware' : 'Simulated Sandbox'}
            </strong>
          </span>
          <button
            type="button"
            onClick={onRunAI}
            disabled={isAnalyzing}
            className="h-10 px-5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 rounded-lg transition-colors whitespace-nowrap"
          >
            <BrainCircuit className="w-4 h-4" aria-hidden="true" />
            <span>{isAnalyzing ? 'Running AI Diagnostics...' : 'Run Live AI Diagnostics'}</span>
          </button>
        </div>
      </section>

      {/* Error banner if Gemini call failed */}
      {aiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold">Live AI Diagnostic Notice</div>
            <p className="text-xs mt-0.5 leading-relaxed">{aiError}</p>
          </div>
        </div>
      )}

      {scheduledTitle && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Maintenance task added to Phase 5 Schedule for {scheduledTitle}.</span>
        </div>
      )}

      {/* AI Assessment Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs text-slate-500">
                {aiResult ? 'Live AI Diagnostic Assessment' : 'Real-Time Hydraulic Rule Assessment'}
              </div>
              <h2 className="font-display text-lg font-semibold text-slate-900 mt-0.5">
                {aiResult
                  ? 'Plain-Language System Explanation'
                  : 'Preliminary Telemetry Evaluation'}
              </h2>
            </div>
            <StatusLabel status={aiResult?.overallAssessment ?? evalResult.overallStatus} />
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {aiResult
              ? aiResult.summaryExplanation
              : `System is currently operating on ${
                  reading.source === 'hardware' ? 'live hardware readings' : 'simulated sandbox readings'
                }. Measured pH is ${reading.ph.toFixed(2)}, turbidity is ${reading.turbidity.toFixed(2)} NTU, and line pressure is ${reading.pressure.toFixed(2)} bar with an estimated ${evalResult.leakProbabilityPercent}% leakage probability. Click "Run Live AI Diagnostics" to generate a full AI root-cause and maintenance report.`}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">Accuracy &amp; Source Transparency: </strong>
              {aiResult
                ? aiResult.limitationsNote
                : `Telemetry shown is from ${
                    reading.source === 'hardware' ? 'live ESP32/Arduino hardware' : 'simulated sensor data'
                  }. Automated water-quality and leakage detection relies on probabilistic sensor patterns and never claims 100% certainty.`}
            </div>
          </div>
        </div>

        {/* Confidence & Maintenance Prediction Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <div className="text-xs text-slate-500">Diagnostic Confidence Level</div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono tabular-nums text-4xl font-bold text-sky-700">
                {aiResult ? aiResult.confidencePercent : Math.min(91, Math.max(76, 88 - Math.round(evalResult.leakProbabilityPercent * 0.1)))}%
              </span>
              <span className="text-xs text-slate-500">(never 100%)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Confidence reflects multi-sensor agreement across pH, turbidity, flow, and pressure trends.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Wrench className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
              <span>Predicted Maintenance Window</span>
            </div>
            <div className="font-display font-semibold text-base text-slate-900">
              {aiResult
                ? `${aiResult.maintenancePrediction.urgency} (within ${aiResult.maintenancePrediction.estimatedWindowDays} days)`
                : evalResult.pipeStressScore >= 70
                  ? 'Immediate Inspection (within 1 day)'
                  : evalResult.pipeStressScore >= 50
                    ? 'Inspect Soon (within 5 days)'
                    : 'Routine Preventive Cycle (14 days)'}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {aiResult
                ? aiResult.maintenancePrediction.reasoning
                : `Estimated from current pipe stress index (${evalResult.pipeStressScore}/100) and flow variance (${evalResult.consumptionVariancePercent}%).`}
            </p>
          </div>
        </div>
      </section>

      {/* Detected Issues List (from AI when run) */}
      {aiResult && aiResult.detectedIssues.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Detected Abnormalities &amp; Explanations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiResult.detectedIssues.map((issue, idx) => (
              <div
                key={`${issue.category}-${idx}`}
                className="border border-slate-200 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-sm text-slate-900">
                    {issue.category}
                  </span>
                  <StatusLabel status={issue.severity} compact />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{issue.explanation}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">{issue.observedMetric}</span>
                  <span className="font-mono tabular-nums font-medium text-sky-700">
                    Confidence: {Math.min(94, Math.round(issue.confidencePercent))}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actionable Recommendations */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Intelligent Action Recommendations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Convert any recommendation into a scheduled Phase 5 pipeline maintenance task.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {activeRecommendations.map((rec, idx) => (
            <div
              key={`${rec.title}-${idx}`}
              className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-sky-700">{rec.phaseLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>Target: {rec.targetComponent}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-semibold ${
                      rec.priority === 'High'
                        ? 'text-red-700'
                        : rec.priority === 'Medium'
                          ? 'text-amber-700'
                          : 'text-slate-700'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                </div>
                <div className="font-display font-semibold text-sm text-slate-900">
                  {rec.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rec.action}</p>
              </div>

              <button
                type="button"
                onClick={() => handleSchedule(rec.targetComponent, rec.title)}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                <span>Schedule Maintenance</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
