import type {
  CalibrationRecord,
  DailyConsumptionPoint,
  LeakageIncident,
  MaintenanceTask,
  PipelineSegment,
  QualityThresholds,
  ScenarioId,
  WeeklyQualityPoint,
  WorkflowPhase,
} from '../types/water';

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  {
    phaseNumber: 1,
    title: 'Phase 1: Sensor Ingestion & Hardware Calibration',
    subtitle: 'Connection validation, probe calibration, and drinking-water standards',
    objective:
      'Establish trustworthy telemetry from either the simulated engineering sandbox or physical Arduino/ESP32 sensor nodes before evaluating water safety.',
    workflows: [
      {
        id: 'validate-sensor-connection',
        name: 'Validate Sensor Connection',
        description:
          'Verify heartbeat, sampling rate, and payload schema from physical microcontrollers or active simulation mode.',
        trigger: 'On startup or hardware mode switch',
        targetPage: 'dashboard',
      },
      {
        id: 'calibrate-monitoring-sensor',
        name: 'Calibrate Monitoring Sensor',
        description:
          'Apply zero-point and buffer calibration offsets to pH, turbidity, pressure, and flow sensors to eliminate drift.',
        trigger: 'Inconsistent readings or scheduled calibration interval',
        targetPage: 'quality',
      },
      {
        id: 'configure-quality-threshold',
        name: 'Configure Quality Threshold',
        description:
          'Select BIS IS 10500:2012, WHO Drinking Water Guidelines, or custom campus limits for automated alert scoring.',
        trigger: 'Policy setup or local water source update',
        targetPage: 'quality',
      },
    ],
  },
  {
    phaseNumber: 2,
    title: 'Phase 2: Continuous Water Quality & Tank Monitoring',
    subtitle: 'Live pH, turbidity, temperature, and reservoir autonomy tracking',
    objective:
      'Continuously stream water chemistry and storage tank volume to classify supply safety into Safe, Warning, or Critical states.',
    workflows: [
      {
        id: 'monitor-water-quality',
        name: 'Monitor Water Quality',
        description:
          'Stream pH, optical turbidity (NTU), and thermal telemetry at 3-second sampling intervals.',
        trigger: 'Continuous telemetry polling loop',
        targetPage: 'dashboard',
      },
      {
        id: 'assess-water-quality',
        name: 'Assess Water Quality',
        description:
          'Score incoming chemistry readings against active drinking-water thresholds with multi-factor status labels.',
        trigger: 'Every validated sensor packet',
        targetPage: 'quality',
      },
      {
        id: 'evaluate-tank-level',
        name: 'Evaluate Tank Level',
        description:
          'Track ultrasonic reservoir fill percentage, calculate remaining supply hours, and flag low-reserve warnings.',
        trigger: 'Tank level drops below warning threshold',
        targetPage: 'pipeline',
      },
    ],
  },
  {
    phaseNumber: 3,
    title: 'Phase 3: Pipeline Stress, Hydraulics & Leakage Detection',
    subtitle: 'Pressure anomalies, pipe stress mapping, and consumption variance',
    objective:
      'Correlate flow rates and hydraulic pressure across pipeline segments to estimate pipe stress and locate probable leaks.',
    workflows: [
      {
        id: 'analyze-pipeline-condition',
        name: 'Analyze Pipeline Condition',
        description:
          'Compute structural stress index per pipeline segment using pressure surges and sustained hydraulic load.',
        trigger: 'Hydraulic pressure delta > 0.6 bar',
        targetPage: 'pipeline',
      },
      {
        id: 'investigate-pressure-anomaly',
        name: 'Investigate Pressure Anomaly',
        description:
          'Distinguish pump transients and valve closures from sustained low-pressure drops or hazardous over-pressure.',
        trigger: 'Pressure outside 2.2–5.8 bar operating band',
        targetPage: 'pipeline',
      },
      {
        id: 'detect-pipeline-leakage',
        name: 'Detect Pipeline Leakage',
        description:
          'Compare upstream vs. downstream flow and pressure decay to output probabilistic leakage confidence (never 100%).',
        trigger: 'Unexplained flow-pressure divergence',
        targetPage: 'pipeline',
      },
      {
        id: 'review-consumption-variance',
        name: 'Review Consumption Variance',
        description:
          'Compare hourly water demand against historical baselines to spot continuous night-time draw or burst usage.',
        trigger: 'Consumption variance > 25% above baseline',
        targetPage: 'pipeline',
      },
    ],
  },
  {
    phaseNumber: 4,
    title: 'Phase 4: AI Diagnostics, Alerts & Recommendations',
    subtitle: 'Root-cause explanations, alert triage, and intelligent guidance',
    objective:
      'Translate raw sensor anomalies into clear engineering explanations, confidence-bounded alerts, and corrective actions.',
    workflows: [
      {
        id: 'investigate-water-quality-alert',
        name: 'Investigate Water Quality Alert',
        description:
          'Route turbidity, pH, pressure, tank, and leakage alerts into a triaged queue for operator acknowledgment.',
        trigger: 'Any metric crosses Warning or Critical threshold',
        targetPage: 'alerts',
      },
      {
        id: 'review-monitoring-recommendation',
        name: 'Review Monitoring Recommendation',
        description:
          'Run AI diagnostic reasoning to explain why an anomaly occurred and recommend filtration, calibration, or valve checks.',
        trigger: 'On-demand AI analysis or active warning state',
        targetPage: 'ai',
      },
    ],
  },
  {
    phaseNumber: 5,
    title: 'Phase 5: Maintenance Scheduling & Compliance Reporting',
    subtitle: 'Preventive work orders and downloadable daily/monthly summaries',
    objective:
      'Close the operational loop by converting AI predictions into scheduled inspections and exportable compliance reports.',
    workflows: [
      {
        id: 'schedule-pipeline-maintenance',
        name: 'Schedule Pipeline Maintenance',
        description:
          'Create prioritized inspection and valve/seal repair tasks linked directly to stressed pipeline segments.',
        trigger: 'Elevated pipe stress or leakage recommendation',
        targetPage: 'alerts',
      },
      {
        id: 'generate-monitoring-report',
        name: 'Generate Monitoring Report',
        description:
          'Compile sensor logs, water quality scores, abnormalities, and daily/monthly summaries into downloadable CSV/JSON/HTML.',
        trigger: 'Daily shift handover or student lab demonstration',
        targetPage: 'reports',
      },
    ],
  },
];

export const THRESHOLD_PRESETS: Record<
  QualityThresholds['standardName'],
  QualityThresholds
> = {
  'BIS IS 10500:2012': {
    standardName: 'BIS IS 10500:2012',
    phMin: 6.5,
    phMax: 8.5,
    turbidityWarn: 1.0,
    turbidityCrit: 5.0,
    tempMin: 10,
    tempMax: 30,
    pressureMin: 2.2,
    pressureMax: 5.8,
    flowBaseline: 120,
    tankLowWarn: 30,
    tankLowCrit: 15,
  },
  'WHO Guidelines': {
    standardName: 'WHO Guidelines',
    phMin: 6.5,
    phMax: 8.5,
    turbidityWarn: 1.0,
    turbidityCrit: 4.0,
    tempMin: 10,
    tempMax: 28,
    pressureMin: 2.4,
    pressureMax: 5.5,
    flowBaseline: 120,
    tankLowWarn: 35,
    tankLowCrit: 20,
  },
  Custom: {
    standardName: 'Custom',
    phMin: 6.8,
    phMax: 8.2,
    turbidityWarn: 1.5,
    turbidityCrit: 4.5,
    tempMin: 12,
    tempMax: 29,
    pressureMin: 2.5,
    pressureMax: 5.5,
    flowBaseline: 120,
    tankLowWarn: 30,
    tankLowCrit: 18,
  },
};

export const SCENARIO_CONFIGS: Record<
  ScenarioId,
  {
    label: string;
    shortDesc: string;
    ph: number;
    turbidity: number;
    temperature: number;
    flowRate: number;
    pressure: number;
    tankLevel: number;
    leakSignal: number;
  }
> = {
  normal: {
    label: 'Normal Supply',
    shortDesc: 'Balanced pH 7.2, low turbidity, nominal 3.8 bar line pressure',
    ph: 7.22,
    turbidity: 0.65,
    temperature: 22.4,
    flowRate: 118,
    pressure: 3.85,
    tankLevel: 78,
    leakSignal: 8,
  },
  high_turbidity: {
    label: 'High Turbidity Spike',
    shortDesc: 'Suspended solids spike (6.4 NTU) indicating filter media breakthrough',
    ph: 7.05,
    turbidity: 6.4,
    temperature: 23.8,
    flowRate: 114,
    pressure: 3.65,
    tankLevel: 71,
    leakSignal: 14,
  },
  pipeline_leak: {
    label: 'Suspected Pipe Leak',
    shortDesc: 'Flow spike (164 L/min) paired with sudden pressure drop to 1.75 bar',
    ph: 7.18,
    turbidity: 1.85,
    temperature: 22.9,
    flowRate: 164,
    pressure: 1.75,
    tankLevel: 54,
    leakSignal: 82,
  },
  pressure_surge: {
    label: 'Pressure Surge & Stress',
    shortDesc: 'Hydraulic water-hammer surge at 6.65 bar stressing main trunk joints',
    ph: 7.35,
    turbidity: 1.15,
    temperature: 24.1,
    flowRate: 139,
    pressure: 6.65,
    tankLevel: 84,
    leakSignal: 46,
  },
  ph_drift: {
    label: 'Acidic pH Drift',
    shortDesc: 'Water pH drops to 5.75, risking pipe corrosion and sensor calibration check',
    ph: 5.75,
    turbidity: 1.35,
    temperature: 23.1,
    flowRate: 116,
    pressure: 3.72,
    tankLevel: 69,
    leakSignal: 12,
  },
  low_tank: {
    label: 'Low Reservoir Level',
    shortDesc: 'Overhead storage tank depleted to 13% during peak demand window',
    ph: 7.28,
    turbidity: 0.92,
    temperature: 25.0,
    flowRate: 96,
    pressure: 2.35,
    tankLevel: 13,
    leakSignal: 15,
  },
};

export const INITIAL_SEGMENTS: PipelineSegment[] = [
  {
    id: 'seg-intake',
    name: 'Raw Water Intake Line',
    zone: 'Source Pump House',
    material: 'Ductile Iron (DI)',
    diameterMm: 200,
    lengthMeters: 420,
    flowLpm: 124,
    pressureBar: 4.1,
    stressPercent: 28,
    leakProbability: 6,
    status: 'Safe',
    sensorNode: 'ESP32-NODE-01',
  },
  {
    id: 'seg-filtration',
    name: 'Sand & Carbon Filtration Header',
    zone: 'Treatment Bay',
    material: 'Stainless Steel 304',
    diameterMm: 150,
    lengthMeters: 110,
    flowLpm: 120,
    pressureBar: 3.9,
    stressPercent: 24,
    leakProbability: 5,
    status: 'Safe',
    sensorNode: 'ESP32-NODE-02',
  },
  {
    id: 'seg-trunk',
    name: 'Main Distribution Trunk',
    zone: 'Campus Spine Corridor',
    material: 'HDPE PN10',
    diameterMm: 160,
    lengthMeters: 860,
    flowLpm: 118,
    pressureBar: 3.85,
    stressPercent: 34,
    leakProbability: 9,
    status: 'Safe',
    sensorNode: 'ESP32-NODE-03',
  },
  {
    id: 'seg-zone-a',
    name: 'Academic Block Branch A',
    zone: 'North Sector',
    material: 'uPVC Schedule 80',
    diameterMm: 110,
    lengthMeters: 540,
    flowLpm: 62,
    pressureBar: 3.55,
    stressPercent: 31,
    leakProbability: 8,
    status: 'Safe',
    sensorNode: 'ARDUINO-NODE-04',
  },
  {
    id: 'seg-zone-b',
    name: 'Hostel & Lab Branch B',
    zone: 'East Sector',
    material: 'uPVC Schedule 80',
    diameterMm: 110,
    lengthMeters: 620,
    flowLpm: 56,
    pressureBar: 3.45,
    stressPercent: 29,
    leakProbability: 7,
    status: 'Safe',
    sensorNode: 'ARDUINO-NODE-05',
  },
];

export const DAILY_CONSUMPTION_DATA: DailyConsumptionPoint[] = [
  { hour: '00:00', actualLiters: 420, baselineLiters: 400 },
  { hour: '03:00', actualLiters: 310, baselineLiters: 290 },
  { hour: '06:00', actualLiters: 1480, baselineLiters: 1350 },
  { hour: '09:00', actualLiters: 2650, baselineLiters: 2400 },
  { hour: '12:00', actualLiters: 2340, baselineLiters: 2200 },
  { hour: '15:00', actualLiters: 1980, baselineLiters: 2050 },
  { hour: '18:00', actualLiters: 2510, baselineLiters: 2350 },
  { hour: '21:00', actualLiters: 1640, baselineLiters: 1550 },
];

export const WEEKLY_QUALITY_DATA: WeeklyQualityPoint[] = [
  { day: 'Mon', avgPh: 7.21, avgTurbidity: 0.68, safeHours: 23, warningHours: 1 },
  { day: 'Tue', avgPh: 7.18, avgTurbidity: 0.74, safeHours: 24, warningHours: 0 },
  { day: 'Wed', avgPh: 7.34, avgTurbidity: 1.42, safeHours: 20, warningHours: 4 },
  { day: 'Thu', avgPh: 7.12, avgTurbidity: 0.89, safeHours: 22, warningHours: 2 },
  { day: 'Fri', avgPh: 6.95, avgTurbidity: 1.15, safeHours: 21, warningHours: 3 },
  { day: 'Sat', avgPh: 7.24, avgTurbidity: 0.61, safeHours: 24, warningHours: 0 },
  { day: 'Sun', avgPh: 7.26, avgTurbidity: 0.58, safeHours: 24, warningHours: 0 },
];

export const LEAKAGE_INCIDENT_HISTORY: LeakageIncident[] = [
  {
    id: 'LK-2026-104',
    date: '2026-11-14 02:40',
    segment: 'Hostel & Lab Branch B — Joint 4',
    estimatedLossLiters: 1840,
    pressureDropBar: 1.45,
    confidencePercent: 89,
    resolution: 'Gasket flange tightened & pressure re-balanced',
    status: 'Resolved',
  },
  {
    id: 'LK-2026-098',
    date: '2026-11-08 19:15',
    segment: 'Main Distribution Trunk — Valve V3',
    estimatedLossLiters: 920,
    pressureDropBar: 0.85,
    confidencePercent: 81,
    resolution: 'Air-release valve seal replaced',
    status: 'Resolved',
  },
  {
    id: 'LK-2026-091',
    date: '2026-11-02 04:05',
    segment: 'Academic Block Branch A — Meter Pit',
    estimatedLossLiters: 610,
    pressureDropBar: 0.52,
    confidencePercent: 76,
    resolution: 'Coupling clamp reseated during morning shift',
    status: 'Resolved',
  },
];

export const INITIAL_CALIBRATION_RECORDS: CalibrationRecord[] = [
  {
    sensorType: 'pH Probe',
    offset: 0.0,
    unit: 'pH',
    lastCalibrated: '2026-11-15 09:30',
    status: 'Calibrated',
  },
  {
    sensorType: 'Turbidity Optical',
    offset: 0.0,
    unit: 'NTU',
    lastCalibrated: '2026-11-14 14:10',
    status: 'Calibrated',
  },
  {
    sensorType: 'Pressure Transducer',
    offset: 0.0,
    unit: 'bar',
    lastCalibrated: '2026-11-10 11:00',
    status: 'Calibrated',
  },
  {
    sensorType: 'Flow Meter',
    offset: 0.0,
    unit: 'L/min',
    lastCalibrated: '2026-11-01 16:20',
    status: 'Due Soon',
  },
];

export const INITIAL_MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: 'MT-401',
    segmentName: 'Sand & Carbon Filtration Header',
    title: 'Backwash rapid sand filter bed & verify NTU drop',
    priority: 'Routine',
    scheduledDate: '2026-11-19',
    status: 'Scheduled',
    triggeredBy: 'Preventive weekly cycle',
    notes: 'Verify post-filter turbidity remains below 0.8 NTU.',
  },
  {
    id: 'MT-402',
    segmentName: 'Hostel & Lab Branch B',
    title: 'Inspect ultrasonic flow meter coupling & check for weeping seals',
    priority: 'Elevated',
    scheduledDate: '2026-11-18',
    status: 'In Progress',
    triggeredBy: 'Prior night-time consumption variance',
    notes: 'Re-torque flange bolts if pressure decay exceeds 0.3 bar/hr.',
  },
];
