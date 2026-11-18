import { useState } from 'react';
import {
  CheckCircle2,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SensorCards } from '../components/SensorCards';
import { StatusLabel } from '../components/StatusLabel';
import type {
  DataSourceMode,
  PageId,
  QualityThresholds,
  SensorReading,
} from '../types/water';
import type { EvaluatedTelemetry } from '../utils/telemetryEngine';

interface DashboardPageProps {
  reading: SensorReading;
  history: SensorReading[];
  evalResult: EvaluatedTelemetry;
  thresholds: QualityThresholds;
  dataSource: DataSourceMode;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onSwitchDataSource: (mode: DataSourceMode) => void;
  onManualSample: () => void;
  onNavigate: (page: PageId) => void;
  hardwareStatusMsg: string | null;
  onCheckHardware: () => Promise<void>;
}

export function DashboardPage({
  reading,
  history,
  evalResult,
  thresholds,
  dataSource,
  isStreaming,
  onToggleStreaming,
  onSwitchDataSource,
  onManualSample,
  onNavigate,
  hardwareStatusMsg,
  onCheckHardware,
}: DashboardPageProps) {
  const [validatingConnection, setValidatingConnection] = useState(false);

  const handleValidateConnection = async () => {
    setValidatingConnection(true);
    await onCheckHardware();
    setValidatingConnection(false);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Toolbar: Data Source Mode, Stream Controls, Connection Check */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-xl font-bold text-slate-900">
              System Monitoring Dashboard
            </h1>
            <StatusLabel status={evalResult.overallStatus} label={`Supply: ${evalResult.overallStatus}`} />
          </div>
          <p className="text-sm text-slate-500">
            Data Source:{' '}
            <span className="font-medium text-slate-800">
              {dataSource === 'hardware'
                ? 'Live Hardware Telemetry (ESP32 / Arduino)'
                : 'Demo Mode (Simulated Sensor Readings)'}
            </span>{' '}
            · Node <span className="font-mono">{reading.deviceId}</span> · Last sample{' '}
            <span className="font-mono tabular-nums">{reading.timeLabel}</span>
          </p>
          {hardwareStatusMsg && (
            <p className="text-xs text-sky-700 font-medium pt-0.5">{hardwareStatusMsg}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Data Mode Switch */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => onSwitchDataSource('simulated')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                dataSource === 'simulated'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Mode
            </button>
            <button
              type="button"
              onClick={() => onSwitchDataSource('hardware')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                dataSource === 'hardware'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hardware Mode
            </button>
          </div>

          <button
            type="button"
            onClick={handleValidateConnection}
            disabled={validatingConnection}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            <span>{validatingConnection ? 'Checking...' : 'Validate Connection'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleStreaming}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Resume Stream</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onManualSample}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sample Now</span>
          </button>
        </div>
      </section>

      {/* Overall System & Water Quality Summary Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">Overall Water Supply Status</div>
            <div className="font-display text-lg font-semibold text-slate-900 mt-1">
              {evalResult.overallStatus === 'Safe'
                ? 'Nominal Operation'
                : evalResult.overallStatus === 'Warning'
                  ? 'Attention Required'
                  : 'Critical Intervention'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Active standard: {thresholds.standardName}
            </div>
          </div>
          <StatusLabel status={evalResult.overallStatus} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">Water Quality Classification</div>
            <div className="font-display text-lg font-semibold text-slate-900 mt-1">
              {evalResult.phStatus === 'Critical' || evalResult.turbidityStatus === 'Critical'
                ? 'Unsafe — Treatment Check'
                : evalResult.phStatus === 'Warning' || evalResult.turbidityStatus === 'Warning'
                  ? 'Warning — Monitor Chemistry'
                  : 'Potable & Clear'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              pH {reading.ph.toFixed(2)} · Turbidity {reading.turbidity.toFixed(2)} NTU
            </div>
          </div>
          <StatusLabel
            status={
              evalResult.phStatus === 'Critical' || evalResult.turbidityStatus === 'Critical'
                ? 'Critical'
                : evalResult.phStatus === 'Warning' || evalResult.turbidityStatus === 'Warning'
                  ? 'Warning'
                  : 'Safe'
            }
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">Quick Phase Workflows</div>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => onNavigate('quality')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Calibrate &amp; Thresholds</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('alerts')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Review Alerts</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Sensor & Status KPI Cards */}
      <SensorCards reading={reading} evalResult={evalResult} thresholds={thresholds} />

      {/* Live Sensor Monitoring Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Live Water Quality Stream (pH &amp; Turbidity)
              </h2>
              <p className="text-xs text-slate-500">
                Real-time sliding window of last {history.length} sensor readings
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {dataSource === 'hardware' ? 'HARDWARE' : 'SIMULATED'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis yAxisId="left" domain={[4, 10]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 'auto']}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ph"
                  name="pH Level"
                  stroke="#0284C7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="turbidity"
                  name="Turbidity (NTU)"
                  stroke="#D97706"
                  strokeWidth={2}
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
                Live Pipeline Hydraulics (Flow Rate &amp; Pressure)
              </h2>
              <p className="text-xs text-slate-500">
                Tracks flow surge vs. line pressure drop for leak &amp; stress detection
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">L/min · bar</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis yAxisId="left" domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 8]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="flowRate"
                  name="Flow Rate (L/min)"
                  stroke="#0369A1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pressure"
                  name="Pressure (bar)"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
