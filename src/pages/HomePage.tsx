import { useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu, ShieldCheck } from 'lucide-react';
import { SCENARIO_CONFIGS, WORKFLOW_PHASES } from '../data/workflowData';
import { StatusLabel } from '../components/StatusLabel';
import type {
  DataSourceMode,
  PageId,
  QualityThresholds,
  ScenarioId,
  SensorReading,
} from '../types/water';
import type { EvaluatedTelemetry } from '../utils/telemetryEngine';

interface HomePageProps {
  reading: SensorReading;
  evalResult: EvaluatedTelemetry;
  thresholds: QualityThresholds;
  scenario: ScenarioId;
  dataSource: DataSourceMode;
  onSelectScenario: (id: ScenarioId) => void;
  onNavigate: (page: PageId) => void;
  onRunAI: () => void;
}

export function HomePage({
  reading,
  evalResult,
  thresholds,
  scenario,
  dataSource,
  onSelectScenario,
  onNavigate,
  onRunAI,
}: HomePageProps) {
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const currentPhase =
    WORKFLOW_PHASES.find((p) => p.phaseNumber === selectedPhase) ??
    WORKFLOW_PHASES[0];

  return (
    <div className="space-y-8">
      {/* Hero / Focal Anchor */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="text-xs font-medium text-sky-700">
                {dataSource === 'hardware'
                  ? 'Live Hardware Telemetry Active'
                  : 'Demo Simulation Mode Active'}{' '}
                · Standard: {thresholds.standardName}
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
                AI-Based Smart Water Supply Monitoring and Management System
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Continuously monitor drinking-water quality, pipeline hydraulic stress, tank reserves, and probable leakage patterns across a 5-phase engineering workflow—ready for both live classroom demonstration and ESP32/Arduino hardware integration.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="h-10 px-5 inline-flex items-center gap-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Open Monitoring Dashboard</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onRunAI}
                className="h-10 px-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Run AI Diagnostics</span>
              </button>
            </div>
          </div>

          {/* Live System Snapshot Panel */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs text-slate-500">Current System Posture</div>
                <div className="font-display text-base font-semibold text-slate-900">
                  Live Telemetry Snapshot
                </div>
              </div>
              <StatusLabel status={evalResult.overallStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">pH &amp; Turbidity</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {reading.ph.toFixed(2)} pH · {reading.turbidity.toFixed(2)} NTU
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Flow &amp; Pressure</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {reading.flowRate.toFixed(0)} L/m · {reading.pressure.toFixed(2)} bar
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tank Reserve</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {reading.tankLevel.toFixed(0)}% capacity
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Leakage Estimate</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {evalResult.leakProbabilityPercent}% est. risk
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Node: {reading.deviceId}</span>
              <span className="font-mono tabular-nums">{reading.timeLabel}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Demo Scenario Switcher */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Interactive Project Demonstration Scenarios
            </h2>
            <p className="text-sm text-slate-500">
              Trigger realistic water quality or hydraulic anomalies to observe alerts, charts, and AI recommendations respond immediately.
            </p>
          </div>
          {dataSource === 'hardware' && (
            <span className="text-xs font-medium text-amber-700">
              Switch back to Demo Simulation on the Dashboard to test preset scenarios.
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(SCENARIO_CONFIGS) as ScenarioId[]).map((id) => {
            const cfg = SCENARIO_CONFIGS[id];
            const active = scenario === id && dataSource === 'simulated';
            return (
              <button
                key={id}
                type="button"
                disabled={dataSource === 'hardware'}
                onClick={() => onSelectScenario(id)}
                className={`text-left p-4 rounded-xl border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-50 ${
                  active
                    ? 'bg-sky-50 border-sky-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-sm text-slate-900">
                    {cfg.label}
                  </span>
                  {active && (
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {cfg.shortDesc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5-Phase Operational Workflow Architecture */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              5-Phase System Workflow Architecture
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Explore how all 14 operational workflows connect sensor acquisition, water quality scoring, pipeline stress diagnostics, AI guidance, and compliance reporting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap self-start sm:self-auto"
          >
            View Hardware &amp; Architecture Guide →
          </button>
        </div>

        {/* Phase Segmented Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100 rounded-xl">
          {WORKFLOW_PHASES.map((phase) => {
            const isSelected = phase.phaseNumber === selectedPhase;
            return (
              <button
                key={phase.phaseNumber}
                type="button"
                onClick={() => setSelectedPhase(phase.phaseNumber)}
                className={`px-3 py-2.5 rounded-lg text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-sky-700">
                  Phase 0{phase.phaseNumber}
                </div>
                <div className="text-xs font-medium mt-0.5 truncate">
                  {phase.title.replace(/^Phase \d+: /, '')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Phase Details */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                {currentPhase.title}
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">{currentPhase.objective}</p>
            </div>
            <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
              {currentPhase.workflows.length} active workflows
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPhase.workflows.map((wf) => (
              <div
                key={wf.id}
                className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-3 bg-slate-50/40"
              >
                <div className="space-y-1.5">
                  <div className="font-display font-semibold text-sm text-slate-900">
                    {wf.name}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {wf.description}
                  </p>
                </div>
                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 truncate">
                    Trigger: {wf.trigger}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate(wf.targetPage)}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap shrink-0"
                  >
                    Open →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture & Accuracy Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700 shrink-0">
            <Cpu className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-sm text-slate-900">
              Hardware-Ready Sensor Ingestion
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Includes a live REST endpoint (<code className="font-mono text-slate-800">POST /api/sensors/ingest</code>) ready for ESP32 or Arduino Wi-Fi nodes alongside clearly labeled simulation mode.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700 shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-sm text-slate-900">
              Transparent Confidence &amp; Standards
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Leakage and anomaly detections display explicit confidence bounds (never claiming 100% accuracy) and compare readings against configurable BIS IS 10500 or WHO standards.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
