import { useState } from 'react';
import { Check, Sliders, Wrench } from 'lucide-react';
import {
  Area,
  AreaChart,
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
import { THRESHOLD_PRESETS, WEEKLY_QUALITY_DATA } from '../data/workflowData';
import { StatusLabel } from '../components/StatusLabel';
import type {
  CalibrationRecord,
  QualityThresholds,
  SensorReading,
} from '../types/water';
import type { EvaluatedTelemetry } from '../utils/telemetryEngine';

interface WaterQualityPageProps {
  reading: SensorReading;
  history: SensorReading[];
  evalResult: EvaluatedTelemetry;
  thresholds: QualityThresholds;
  onUpdateThresholds: (next: QualityThresholds) => void;
  calibrationRecords: CalibrationRecord[];
  onCalibrateSensor: (
    sensorType: CalibrationRecord['sensorType'],
    offset: number
  ) => void;
}

export function WaterQualityPage({
  reading,
  history,
  evalResult,
  thresholds,
  onUpdateThresholds,
  calibrationRecords,
  onCalibrateSensor,
}: WaterQualityPageProps) {
  const [selectedSensor, setSelectedSensor] =
    useState<CalibrationRecord['sensorType']>('pH Probe');
  const [offsetInput, setOffsetInput] = useState<string>('0.0');
  const [calibrationToast, setCalibrationToast] = useState<string | null>(null);

  const handlePresetChange = (preset: QualityThresholds['standardName']) => {
    onUpdateThresholds(THRESHOLD_PRESETS[preset]);
  };

  const handleFieldChange = (field: keyof QualityThresholds, value: number) => {
    if (Number.isNaN(value)) return;
    onUpdateThresholds({
      ...thresholds,
      standardName: 'Custom',
      [field]: value,
    });
  };

  const handleApplyCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    const numericOffset = Number(offsetInput);
    if (Number.isNaN(numericOffset)) return;
    onCalibrateSensor(selectedSensor, numericOffset);
    setCalibrationToast(
      `${selectedSensor} calibrated with offset ${numericOffset >= 0 ? '+' : ''}${numericOffset.toFixed(2)}`
    );
    setTimeout(() => setCalibrationToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">
            Water Quality Analysis &amp; Standards Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phase 1 &amp; Phase 2 workflows: Inspect pH level history, turbidity trends, weekly potability hours, and probe calibration.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-slate-500">pH Status</div>
            <StatusLabel status={evalResult.phStatus} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Turbidity Status</div>
            <StatusLabel status={evalResult.turbidityStatus} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Temperature</div>
            <span className="font-mono tabular-nums text-sm font-semibold text-slate-900">
              {reading.temperature.toFixed(1)} °C
            </span>
          </div>
        </div>
      </section>

      {/* pH History & Turbidity Trends */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                pH Level History
              </h2>
              <p className="text-xs text-slate-500">
                Safe drinking band: {thresholds.phMin} – {thresholds.phMax} pH
              </p>
            </div>
            <span className="font-mono tabular-nums text-sm font-semibold text-sky-700">
              {reading.ph.toFixed(2)} pH
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[4.5, 10]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <ReferenceLine y={thresholds.phMax} stroke="#D97706" strokeDasharray="4 4" />
                <ReferenceLine y={thresholds.phMin} stroke="#D97706" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="ph"
                  name="pH Level"
                  stroke="#0284C7"
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
                Turbidity Trends (NTU)
              </h2>
              <p className="text-xs text-slate-500">
                Warning ≥ {thresholds.turbidityWarn} NTU · Critical ≥ {thresholds.turbidityCrit} NTU
              </p>
            </div>
            <span className="font-mono tabular-nums text-sm font-semibold text-amber-700">
              {reading.turbidity.toFixed(2)} NTU
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <ReferenceLine y={thresholds.turbidityWarn} stroke="#D97706" strokeDasharray="4 4" />
                <ReferenceLine y={thresholds.turbidityCrit} stroke="#DC2626" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="turbidity"
                  name="Turbidity (NTU)"
                  stroke="#D97706"
                  fill="#FEF3C7"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Weekly Water Quality Analysis */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Weekly Water Quality Analysis
          </h2>
          <p className="text-xs text-slate-500">
            Daily distribution of compliant safe supply hours vs. elevated turbidity/pH warning windows
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_QUALITY_DATA} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="safeHours" name="Safe Supply Hours" stackId="a" fill="#0284C7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warningHours" name="Warning Hours" stackId="a" fill="#D97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Configurable Thresholds & Sensor Calibration Workflows */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configure Quality Threshold */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Configure Drinking-Water Thresholds
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select an official regulatory standard or adjust custom safety limits.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
            {(['BIS IS 10500:2012', 'WHO Guidelines', 'Custom'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  thresholds.standardName === preset
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Min pH</span>
              <input
                type="number"
                step="0.1"
                value={thresholds.phMin}
                onChange={(e) => handleFieldChange('phMin', parseFloat(e.target.value))}
                className="w-full h-9 px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Max pH</span>
              <input
                type="number"
                step="0.1"
                value={thresholds.phMax}
                onChange={(e) => handleFieldChange('phMax', parseFloat(e.target.value))}
                className="w-full h-9 px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Turbidity Warning (NTU)</span>
              <input
                type="number"
                step="0.1"
                value={thresholds.turbidityWarn}
                onChange={(e) => handleFieldChange('turbidityWarn', parseFloat(e.target.value))}
                className="w-full h-9 px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Turbidity Critical (NTU)</span>
              <input
                type="number"
                step="0.1"
                value={thresholds.turbidityCrit}
                onChange={(e) => handleFieldChange('turbidityCrit', parseFloat(e.target.value))}
                className="w-full h-9 px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Min Pressure (bar)</span>
              <input
                type="number"
                step="0.1"
                value={thresholds.pressureMin}
                onChange={(e) => handleFieldChange('pressureMin', parseFloat(e.target.value))}
                className="w-full h-9 px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Max Pressure (bar)</span>
              <input
                type="number"
                step="0.1"
                value={thresholds.pressureMax}
                onChange={(e) => handleFieldChange('pressureMax', parseFloat(e.target.value))}
                className="w-full h-9 px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </label>
          </div>
        </div>

        {/* Calibrate Monitoring Sensor */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-600" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold text-slate-900">
                Calibrate Monitoring Sensor
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Apply a zero-point or standard buffer offset when probe readings drift.
            </p>
          </div>

          <form onSubmit={handleApplyCalibration} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Sensor Probe</span>
              <select
                value={selectedSensor}
                onChange={(e) =>
                  setSelectedSensor(e.target.value as CalibrationRecord['sensorType'])
                }
                className="w-full h-9 px-2.5 text-xs font-medium border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                {calibrationRecords.map((rec) => (
                  <option key={rec.sensorType} value={rec.sensorType}>
                    {rec.sensorType}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Calibration Offset</span>
              <input
                type="number"
                step="0.05"
                value={offsetInput}
                onChange={(e) => setOffsetInput(e.target.value)}
                className="w-full h-9 px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </label>

            <button
              type="submit"
              className="h-9 px-4 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap"
            >
              Apply Calibration
            </button>
          </form>

          {calibrationToast && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{calibrationToast}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">Sensor</th>
                  <th className="py-2 font-medium text-right">Offset</th>
                  <th className="py-2 font-medium text-right">Last Calibrated</th>
                  <th className="py-2 font-medium text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calibrationRecords.map((rec) => (
                  <tr key={rec.sensorType} className="h-10">
                    <td className="py-2 font-medium text-slate-900">{rec.sensorType}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                      {rec.offset >= 0 ? '+' : ''}
                      {rec.offset.toFixed(2)} {rec.unit}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-slate-500">
                      {rec.lastCalibrated}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-700">
                      {rec.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
