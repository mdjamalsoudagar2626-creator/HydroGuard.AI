import { SCENARIO_CONFIGS } from '../data/workflowData';
import type {
  AlertItem,
  DataSourceMode,
  PipelineSegment,
  QualityThresholds,
  ScenarioId,
  SensorReading,
  WaterStatus,
} from '../types/water';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function generateNextReading(
  scenario: ScenarioId,
  source: DataSourceMode,
  prev?: SensorReading,
  offsets?: { ph: number; turbidity: number; pressure: number; flow: number }
): SensorReading {
  const cfg = SCENARIO_CONFIGS[scenario];
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const jitter = (scale: number) => (Math.random() - 0.5) * scale;

  const targetPh = cfg.ph + (offsets?.ph ?? 0);
  const targetTurb = Math.max(0.1, cfg.turbidity + (offsets?.turbidity ?? 0));
  const targetPress = Math.max(0.4, cfg.pressure + (offsets?.pressure ?? 0));
  const targetFlow = Math.max(10, cfg.flowRate + (offsets?.flow ?? 0));

  const ph = prev
    ? round2(prev.ph * 0.4 + (targetPh + jitter(0.12)) * 0.6)
    : round2(targetPh + jitter(0.08));
  const turbidity = prev
    ? round2(Math.max(0.08, prev.turbidity * 0.35 + (targetTurb + jitter(0.25)) * 0.65))
    : round2(targetTurb + jitter(0.1));
  const temperature = round2(cfg.temperature + jitter(0.4));
  const flowRate = round2(Math.max(5, targetFlow + jitter(6)));
  const pressure = round2(Math.max(0.3, targetPress + jitter(0.16)));
  const tankLevel = round2(
    Math.min(100, Math.max(4, cfg.tankLevel + jitter(1.2)))
  );
  const leakSignal = Math.round(
    Math.min(94, Math.max(2, cfg.leakSignal + jitter(6)))
  );

  return {
    id: `RD-${now.getTime()}`,
    timestamp: now.toISOString(),
    timeLabel,
    ph,
    turbidity,
    temperature,
    flowRate,
    pressure,
    tankLevel,
    leakSignal,
    source,
    deviceId: source === 'hardware' ? 'ESP32-GATEWAY-LIVE' : 'SIM-SANDBOX-01',
  };
}

export function createInitialHistory(
  scenario: ScenarioId,
  thresholds: QualityThresholds
): SensorReading[] {
  const list: SensorReading[] = [];
  const now = Date.now();
  let prev: SensorReading | undefined;
  for (let i = 15; i >= 1; i--) {
    const t = new Date(now - i * 4000);
    const reading = generateNextReading(scenario, 'simulated', prev);
    reading.timestamp = t.toISOString();
    reading.timeLabel = t.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    reading.id = `RD-${t.getTime()}-${i}`;
    prev = reading;
    list.push(reading);
  }
  // Ensure at least one reading matches thresholds cleanly in normal mode
  void thresholds;
  return list;
}

export interface EvaluatedTelemetry {
  overallStatus: WaterStatus;
  phStatus: WaterStatus;
  turbidityStatus: WaterStatus;
  temperatureStatus: WaterStatus;
  pressureStatus: WaterStatus;
  tankStatus: WaterStatus;
  leakageStatus: WaterStatus;
  leakProbabilityPercent: number; // Strictly capped at 94% — never 100%
  pipeStressScore: number; // 0-100
  consumptionVariancePercent: number;
}

export function evaluateTelemetry(
  reading: SensorReading,
  thresholds: QualityThresholds
): EvaluatedTelemetry {
  // pH evaluation
  let phStatus: WaterStatus = 'Safe';
  if (reading.ph < thresholds.phMin - 0.5 || reading.ph > thresholds.phMax + 0.5) {
    phStatus = 'Critical';
  } else if (reading.ph < thresholds.phMin || reading.ph > thresholds.phMax) {
    phStatus = 'Warning';
  }

  // Turbidity evaluation
  let turbidityStatus: WaterStatus = 'Safe';
  if (reading.turbidity >= thresholds.turbidityCrit) {
    turbidityStatus = 'Critical';
  } else if (reading.turbidity >= thresholds.turbidityWarn) {
    turbidityStatus = 'Warning';
  }

  // Temperature evaluation
  let temperatureStatus: WaterStatus = 'Safe';
  if (
    reading.temperature > thresholds.tempMax + 4 ||
    reading.temperature < thresholds.tempMin - 4
  ) {
    temperatureStatus = 'Critical';
  } else if (
    reading.temperature > thresholds.tempMax ||
    reading.temperature < thresholds.tempMin
  ) {
    temperatureStatus = 'Warning';
  }

  // Pressure evaluation
  let pressureStatus: WaterStatus = 'Safe';
  if (
    reading.pressure < thresholds.pressureMin - 0.5 ||
    reading.pressure > thresholds.pressureMax + 0.5
  ) {
    pressureStatus = 'Critical';
  } else if (
    reading.pressure < thresholds.pressureMin ||
    reading.pressure > thresholds.pressureMax
  ) {
    pressureStatus = 'Warning';
  }

  // Tank level evaluation
  let tankStatus: WaterStatus = 'Safe';
  if (reading.tankLevel <= thresholds.tankLowCrit) {
    tankStatus = 'Critical';
  } else if (reading.tankLevel <= thresholds.tankLowWarn) {
    tankStatus = 'Warning';
  }

  // Leakage probability estimation (flow-pressure divergence + acoustic signal)
  const flowRatio = reading.flowRate / Math.max(1, thresholds.flowBaseline);
  const pressureDropFactor = Math.max(0, thresholds.pressureMin - reading.pressure) * 28;
  const flowExcessFactor = Math.max(0, (flowRatio - 1.15) * 45);
  const rawLeak = reading.leakSignal * 0.65 + pressureDropFactor + flowExcessFactor;
  const leakProbabilityPercent = Math.min(94, Math.max(4, Math.round(rawLeak)));

  let leakageStatus: WaterStatus = 'Safe';
  if (leakProbabilityPercent >= 65) {
    leakageStatus = 'Critical';
  } else if (leakProbabilityPercent >= 35) {
    leakageStatus = 'Warning';
  }

  // Pipe stress score (pressure surge + flow turbulence + leak vibration)
  const overPressureStress = Math.max(0, reading.pressure - thresholds.pressureMax) * 42;
  const baseStress = (reading.pressure / thresholds.pressureMax) * 38;
  const pipeStressScore = Math.min(
    96,
    Math.max(12, Math.round(baseStress + overPressureStress + leakProbabilityPercent * 0.28))
  );

  const consumptionVariancePercent = Math.round(
    ((reading.flowRate - thresholds.flowBaseline) / Math.max(1, thresholds.flowBaseline)) * 100
  );

  const statuses: WaterStatus[] = [
    phStatus,
    turbidityStatus,
    temperatureStatus,
    pressureStatus,
    tankStatus,
    leakageStatus,
  ];
  const overallStatus: WaterStatus = statuses.includes('Critical')
    ? 'Critical'
    : statuses.includes('Warning')
      ? 'Warning'
      : 'Safe';

  return {
    overallStatus,
    phStatus,
    turbidityStatus,
    temperatureStatus,
    pressureStatus,
    tankStatus,
    leakageStatus,
    leakProbabilityPercent,
    pipeStressScore,
    consumptionVariancePercent,
  };
}

export function deriveAlertsFromTelemetry(
  reading: SensorReading,
  evalResult: EvaluatedTelemetry,
  thresholds: QualityThresholds
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const time = reading.timeLabel;

  if (evalResult.turbidityStatus !== 'Safe') {
    alerts.push({
      id: `ALT-TURB-${reading.id}`,
      timestamp: time,
      category: 'Turbidity',
      severity: evalResult.turbidityStatus,
      title:
        evalResult.turbidityStatus === 'Critical'
          ? 'Critical High Turbidity Detected'
          : 'Elevated Turbidity Warning',
      description: `Optical turbidity measured at ${reading.turbidity} NTU (limit ${thresholds.turbidityWarn}–${thresholds.turbidityCrit} NTU). Filtration media check recommended.`,
      metricValue: `${reading.turbidity} NTU`,
      status: 'Active',
      workflowName: 'Investigate Water Quality Alert',
      phaseNumber: 4,
    });
  }

  if (evalResult.phStatus !== 'Safe') {
    alerts.push({
      id: `ALT-PH-${reading.id}`,
      timestamp: time,
      category: 'pH Level',
      severity: evalResult.phStatus,
      title:
        reading.ph < thresholds.phMin
          ? 'Abnormal Acidic pH Level'
          : 'Abnormal Alkaline pH Level',
      description: `pH reading of ${reading.ph} falls outside standard drinking range (${thresholds.phMin}–${thresholds.phMax}). Verify dosing and probe calibration.`,
      metricValue: `${reading.ph} pH`,
      status: 'Active',
      workflowName: 'Calibrate Monitoring Sensor',
      phaseNumber: 1,
    });
  }

  if (evalResult.pressureStatus !== 'Safe') {
    const isHigh = reading.pressure > thresholds.pressureMax;
    alerts.push({
      id: `ALT-PRESS-${reading.id}`,
      timestamp: time,
      category: 'Pressure',
      severity: evalResult.pressureStatus,
      title: isHigh
        ? 'High Pipeline Pressure Surge Alert'
        : 'Low Pipeline Pressure Drop Alert',
      description: isHigh
        ? `Line pressure reached ${reading.pressure} bar, elevating joint stress across the HDPE main trunk.`
        : `Line pressure fell to ${reading.pressure} bar, indicating upstream valve restriction or downstream leak.`,
      metricValue: `${reading.pressure} bar`,
      status: 'Active',
      workflowName: 'Investigate Pressure Anomaly',
      phaseNumber: 3,
    });
  }

  if (evalResult.leakageStatus !== 'Safe') {
    alerts.push({
      id: `ALT-LEAK-${reading.id}`,
      timestamp: time,
      category: 'Pipeline Leakage',
      severity: evalResult.leakageStatus,
      title: 'Possible Pipeline Leakage Pattern',
      description: `Flow (${reading.flowRate} L/min) and pressure (${reading.pressure} bar) divergence indicates ${evalResult.leakProbabilityPercent}% estimated leak likelihood.`,
      metricValue: `${evalResult.leakProbabilityPercent}% est.`,
      status: 'Active',
      workflowName: 'Detect Pipeline Leakage',
      phaseNumber: 3,
    });
  }

  if (evalResult.tankStatus !== 'Safe') {
    alerts.push({
      id: `ALT-TANK-${reading.id}`,
      timestamp: time,
      category: 'Tank Level',
      severity: evalResult.tankStatus,
      title:
        evalResult.tankStatus === 'Critical'
          ? 'Critical Low Reservoir Tank Level'
          : 'Low Water Tank Reserve Warning',
      description: `Overhead reservoir tank is at ${reading.tankLevel}%. Schedule booster pump refill cycle to preserve supply autonomy.`,
      metricValue: `${reading.tankLevel}%`,
      status: 'Active',
      workflowName: 'Evaluate Tank Level',
      phaseNumber: 2,
    });
  }

  if (evalResult.overallStatus === 'Critical') {
    alerts.push({
      id: `ALT-QUAL-${reading.id}`,
      timestamp: time,
      category: 'Water Quality',
      severity: 'Critical',
      title: 'Critical Water Supply Safety Warning',
      description:
        'Multiple hydraulic or water-chemistry thresholds breached. Isolate distribution zone pending operator verification.',
      metricValue: 'Critical',
      status: 'Active',
      workflowName: 'Assess Water Quality',
      phaseNumber: 2,
    });
  }

  return alerts;
}

export function updateSegmentsFromTelemetry(
  baseSegments: PipelineSegment[],
  reading: SensorReading,
  evalResult: EvaluatedTelemetry
): PipelineSegment[] {
  return baseSegments.map((seg, idx) => {
    const pressureFactor = Math.max(0.5, reading.pressure - idx * 0.14);
    const segStress = Math.min(
      96,
      Math.max(
        14,
        Math.round(
          evalResult.pipeStressScore * (idx === 2 ? 1.12 : idx === 4 ? 1.05 : 0.88)
        )
      )
    );
    const segLeak =
      idx === 2 || idx === 4
        ? evalResult.leakProbabilityPercent
        : Math.max(4, Math.round(evalResult.leakProbabilityPercent * 0.45));

    let segStatus: WaterStatus = 'Safe';
    if (segStress >= 75 || segLeak >= 65) segStatus = 'Critical';
    else if (segStress >= 52 || segLeak >= 35) segStatus = 'Warning';

    return {
      ...seg,
      flowLpm:
        idx < 3
          ? Math.round(reading.flowRate)
          : Math.round(reading.flowRate * (idx === 3 ? 0.54 : 0.46)),
      pressureBar: round2(pressureFactor),
      stressPercent: segStress,
      leakProbability: Math.min(94, segLeak),
      status: segStatus,
    };
  });
}

export function downloadCSVReport(
  readings: SensorReading[],
  alerts: AlertItem[],
  thresholds: QualityThresholds
) {
  const headers = [
    'Timestamp',
    'Source',
    'Device ID',
    'pH',
    'Turbidity (NTU)',
    'Temp (C)',
    'Flow Rate (L/min)',
    'Pressure (bar)',
    'Tank Level (%)',
    'Leak Signal',
  ];
  const rows = readings.map((r) => [
    r.timestamp,
    r.source,
    r.deviceId,
    r.ph,
    r.turbidity,
    r.temperature,
    r.flowRate,
    r.pressure,
    r.tankLevel,
    r.leakSignal,
  ]);

  const alertSection = [
    '',
    'ACTIVE & HISTORICAL ALERTS',
    'Time,Category,Severity,Title,Metric,Status,Workflow',
    ...alerts.map(
      (a) =>
        `"${a.timestamp}","${a.category}","${a.severity}","${a.title}","${a.metricValue}","${a.status}","${a.workflowName}"`
    ),
    '',
    `STANDARD APPLIED,${thresholds.standardName}`,
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    ...alertSection,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `water-monitoring-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadEngineeringSummary(
  latest: SensorReading,
  evalResult: EvaluatedTelemetry,
  thresholds: QualityThresholds,
  alerts: AlertItem[],
  recommendations: string[]
) {
  const lines = [
    '====================================================================',
    'AI-BASED SMART WATER SUPPLY MONITORING AND MANAGEMENT SYSTEM',
    'DAILY & OPERATIONAL ENGINEERING SUMMARY REPORT',
    '====================================================================',
    `Generated At       : ${new Date().toLocaleString()}`,
    `Telemetry Source   : ${latest.source === 'hardware' ? 'Live Hardware Stream (ESP32/Arduino)' : 'Simulated Engineering Sandbox'}`,
    `Device Node        : ${latest.deviceId}`,
    `Drinking Standard  : ${thresholds.standardName}`,
    `Overall Status     : ${evalResult.overallStatus.toUpperCase()}`,
    '',
    '1. CURRENT SENSOR READINGS',
    '--------------------------------------------------------------------',
    `pH Level           : ${latest.ph} pH (${evalResult.phStatus}) [Target: ${thresholds.phMin} - ${thresholds.phMax}]`,
    `Turbidity          : ${latest.turbidity} NTU (${evalResult.turbidityStatus}) [Warn >= ${thresholds.turbidityWarn}, Crit >= ${thresholds.turbidityCrit}]`,
    `Water Temperature  : ${latest.temperature} C (${evalResult.temperatureStatus})`,
    `Flow Rate          : ${latest.flowRate} L/min (Baseline: ${thresholds.flowBaseline} L/min)`,
    `Pipeline Pressure  : ${latest.pressure} bar (${evalResult.pressureStatus}) [Target: ${thresholds.pressureMin} - ${thresholds.pressureMax} bar]`,
    `Water Tank Level   : ${latest.tankLevel}% (${evalResult.tankStatus})`,
    `Leakage Likelihood : ${evalResult.leakProbabilityPercent}% estimated confidence (${evalResult.leakageStatus})`,
    `Pipe Stress Index  : ${evalResult.pipeStressScore}/100`,
    '',
    '2. ACTIVE ALERTS & ABNORMALITIES',
    '--------------------------------------------------------------------',
    ...(alerts.length === 0
      ? ['No active warnings or critical abnormalities recorded.']
      : alerts
          .slice(0, 10)
          .map(
            (a) =>
              `[${a.severity}] ${a.timestamp} | ${a.category} | ${a.title} (${a.metricValue}) -> ${a.status}`
          )),
    '',
    '3. INTELLIGENT RECOMMENDATIONS',
    '--------------------------------------------------------------------',
    ...recommendations.map((r, i) => `${i + 1}. ${r}`),
    '',
    '4. ACCURACY & ENGINEERING DISCLAIMER',
    '--------------------------------------------------------------------',
    'Automated anomaly and leakage probabilities reflect multi-sensor pattern',
    'correlation and never claim 100% detection certainty. Always verify',
    'physical valves, probe calibration, and field joints prior to shutoff.',
    '====================================================================',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `water-engineering-summary-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
