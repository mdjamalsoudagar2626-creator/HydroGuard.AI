import { StatusLabel } from './StatusLabel';
import type { QualityThresholds, SensorReading } from '../types/water';
import type { EvaluatedTelemetry } from '../utils/telemetryEngine';

interface SensorCardsProps {
  reading: SensorReading;
  evalResult: EvaluatedTelemetry;
  thresholds: QualityThresholds;
}

export function SensorCards({ reading, evalResult, thresholds }: SensorCardsProps) {
  const cards = [
    {
      label: 'Current pH Level',
      value: reading.ph.toFixed(2),
      unit: 'pH',
      status: evalResult.phStatus,
      target: `Target ${thresholds.phMin}–${thresholds.phMax}`,
    },
    {
      label: 'Turbidity Level',
      value: reading.turbidity.toFixed(2),
      unit: 'NTU',
      status: evalResult.turbidityStatus,
      target: `Warn ≥ ${thresholds.turbidityWarn} · Crit ≥ ${thresholds.turbidityCrit}`,
    },
    {
      label: 'Water Temperature',
      value: reading.temperature.toFixed(1),
      unit: '°C',
      status: evalResult.temperatureStatus,
      target: `Band ${thresholds.tempMin}–${thresholds.tempMax} °C`,
    },
    {
      label: 'Water Flow Rate',
      value: reading.flowRate.toFixed(1),
      unit: 'L/min',
      status:
        Math.abs(evalResult.consumptionVariancePercent) > 25
          ? ('Warning' as const)
          : ('Safe' as const),
      target: `Baseline ${thresholds.flowBaseline} L/min (${evalResult.consumptionVariancePercent > 0 ? '+' : ''}${evalResult.consumptionVariancePercent}%)`,
    },
    {
      label: 'Pipeline Pressure',
      value: reading.pressure.toFixed(2),
      unit: 'bar',
      status: evalResult.pressureStatus,
      target: `Operating ${thresholds.pressureMin}–${thresholds.pressureMax} bar`,
    },
    {
      label: 'Water Tank Level',
      value: reading.tankLevel.toFixed(0),
      unit: '%',
      status: evalResult.tankStatus,
      target: `Min reserve ${thresholds.tankLowWarn}%`,
    },
    {
      label: 'Leakage Detection',
      value: `${evalResult.leakProbabilityPercent}%`,
      unit: 'est. risk',
      status: evalResult.leakageStatus,
      target: 'Flow-pressure correlation (non-absolute)',
    },
    {
      label: 'Pipeline Stress Index',
      value: `${evalResult.pipeStressScore}`,
      unit: '/ 100',
      status:
        evalResult.pipeStressScore >= 75
          ? ('Critical' as const)
          : evalResult.pipeStressScore >= 52
            ? ('Warning' as const)
            : ('Safe' as const),
      target: 'Structural transient & joint load',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-slate-600">{card.label}</span>
            <StatusLabel status={card.status} compact />
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-mono tabular-nums text-3xl font-semibold tracking-tight text-slate-900">
              {card.value}
            </span>
            <span className="text-xs font-medium text-slate-500">{card.unit}</span>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-100 pt-2.5">
            {card.target}
          </div>
        </div>
      ))}
    </div>
  );
}
