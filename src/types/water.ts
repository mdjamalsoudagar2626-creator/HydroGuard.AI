export type PageId =
  | 'home'
  | 'dashboard'
  | 'quality'
  | 'pipeline'
  | 'ai'
  | 'alerts'
  | 'reports'
  | 'about';

export type WaterStatus = 'Safe' | 'Warning' | 'Critical';

export type DataSourceMode = 'simulated' | 'hardware';

export type ScenarioId =
  | 'normal'
  | 'high_turbidity'
  | 'pipeline_leak'
  | 'pressure_surge'
  | 'ph_drift'
  | 'low_tank';

export interface SensorReading {
  id: string;
  timestamp: string;
  timeLabel: string;
  ph: number;
  turbidity: number; // NTU
  temperature: number; // °C
  flowRate: number; // L/min
  pressure: number; // bar
  tankLevel: number; // %
  leakSignal: number; // 0 to 100 acoustic/flow-drop index
  source: DataSourceMode;
  deviceId: string;
}

export interface QualityThresholds {
  standardName: 'BIS IS 10500:2012' | 'WHO Guidelines' | 'Custom';
  phMin: number;
  phMax: number;
  turbidityWarn: number;
  turbidityCrit: number;
  tempMin: number;
  tempMax: number;
  pressureMin: number;
  pressureMax: number;
  flowBaseline: number;
  tankLowWarn: number;
  tankLowCrit: number;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  category:
    | 'Turbidity'
    | 'pH Level'
    | 'Pressure'
    | 'Pipeline Leakage'
    | 'Tank Level'
    | 'Water Quality';
  severity: 'Normal' | 'Warning' | 'Critical';
  title: string;
  description: string;
  metricValue: string;
  status: 'Active' | 'Investigating' | 'Resolved';
  workflowName: string;
  phaseNumber: 1 | 2 | 3 | 4 | 5;
}

export interface PipelineSegment {
  id: string;
  name: string;
  zone: string;
  material: string;
  diameterMm: number;
  lengthMeters: number;
  flowLpm: number;
  pressureBar: number;
  stressPercent: number;
  leakProbability: number; // capped below 95%
  status: WaterStatus;
  sensorNode: string;
}

export interface LeakageIncident {
  id: string;
  date: string;
  segment: string;
  estimatedLossLiters: number;
  pressureDropBar: number;
  confidencePercent: number;
  resolution: string;
  status: 'Resolved' | 'Monitored';
}

export interface MaintenanceTask {
  id: string;
  segmentName: string;
  title: string;
  priority: 'Routine' | 'Elevated' | 'Urgent';
  scheduledDate: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  triggeredBy: string;
  notes: string;
}

export interface CalibrationRecord {
  sensorType: 'pH Probe' | 'Turbidity Optical' | 'Pressure Transducer' | 'Flow Meter';
  offset: number;
  unit: string;
  lastCalibrated: string;
  status: 'Calibrated' | 'Due Soon';
}

export interface DetectedIssue {
  category: string;
  severity: WaterStatus;
  explanation: string;
  confidencePercent: number;
  observedMetric: string;
}

export interface AIRecommendation {
  title: string;
  action: string;
  targetComponent: string;
  priority: 'Low' | 'Medium' | 'High';
  phaseLabel: string;
}

export interface AIAnalysisResult {
  overallAssessment: WaterStatus;
  confidencePercent: number;
  summaryExplanation: string;
  detectedIssues: DetectedIssue[];
  recommendations: AIRecommendation[];
  maintenancePrediction: {
    urgency: 'Routine' | 'Inspect Soon' | 'Immediate Inspection';
    estimatedWindowDays: number;
    reasoning: string;
  };
  limitationsNote: string;
  analyzedAt: string;
  dataSource: DataSourceMode;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  trigger: string;
  targetPage: PageId;
}

export interface WorkflowPhase {
  phaseNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  objective: string;
  workflows: WorkflowStep[];
}

export interface DailyConsumptionPoint {
  hour: string;
  actualLiters: number;
  baselineLiters: number;
}

export interface WeeklyQualityPoint {
  day: string;
  avgPh: number;
  avgTurbidity: number;
  safeHours: number;
  warningHours: number;
}
