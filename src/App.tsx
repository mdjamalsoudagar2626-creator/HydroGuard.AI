import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import {
  INITIAL_CALIBRATION_RECORDS,
  INITIAL_MAINTENANCE_TASKS,
  INITIAL_SEGMENTS,
  THRESHOLD_PRESETS,
} from './data/workflowData';
import { AboutProjectPage } from './pages/AboutProjectPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { PipelineMonitoringPage } from './pages/PipelineMonitoringPage';
import { ReportsPage } from './pages/ReportsPage';
import { WaterQualityPage } from './pages/WaterQualityPage';
import type {
  AIAnalysisResult,
  AlertItem,
  CalibrationRecord,
  DataSourceMode,
  MaintenanceTask,
  PageId,
  QualityThresholds,
  ScenarioId,
  SensorReading,
} from './types/water';
import {
  createInitialHistory,
  deriveAlertsFromTelemetry,
  evaluateTelemetry,
  generateNextReading,
  updateSegmentsFromTelemetry,
} from './utils/telemetryEngine';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [scenario, setScenario] = useState<ScenarioId>('normal');
  const [dataSource, setDataSource] = useState<DataSourceMode>('simulated');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [thresholds, setThresholds] = useState<QualityThresholds>(
    THRESHOLD_PRESETS['BIS IS 10500:2012']
  );

  const [calibrationRecords, setCalibrationRecords] = useState<CalibrationRecord[]>(
    INITIAL_CALIBRATION_RECORDS
  );

  const [history, setHistory] = useState<SensorReading[]>(() =>
    createInitialHistory('normal', THRESHOLD_PRESETS['BIS IS 10500:2012'])
  );

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'ALT-INIT-01',
      timestamp: '09:14:22',
      category: 'Water Quality',
      severity: 'Normal',
      title: 'System Baseline Verified',
      description:
        'All water chemistry and hydraulic pressure channels initialized within BIS IS 10500:2012 safe limits.',
      metricValue: '7.22 pH · 0.65 NTU',
      status: 'Resolved',
      workflowName: 'Validate Sensor Connection',
      phaseNumber: 1,
    },
  ]);

  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(
    INITIAL_MAINTENANCE_TASKS
  );

  const [hardwareStatusMsg, setHardwareStatusMsg] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);

  const calibrationOffsets = useMemo(() => {
    const findOffset = (type: CalibrationRecord['sensorType']) =>
      calibrationRecords.find((r) => r.sensorType === type)?.offset ?? 0;
    return {
      ph: findOffset('pH Probe'),
      turbidity: findOffset('Turbidity Optical'),
      pressure: findOffset('Pressure Transducer'),
      flow: findOffset('Flow Meter'),
    };
  }, [calibrationRecords]);

  const latestReading = history[history.length - 1];

  const evalResult = useMemo(
    () => evaluateTelemetry(latestReading, thresholds),
    [latestReading, thresholds]
  );

  const segments = useMemo(
    () => updateSegmentsFromTelemetry(INITIAL_SEGMENTS, latestReading, evalResult),
    [latestReading, evalResult]
  );

  const appendReadingAndAlerts = useCallback(
    (nextReading: SensorReading) => {
      setHistory((prev) => [...prev.slice(-23), nextReading]);
      const nextEval = evaluateTelemetry(nextReading, thresholds);
      const derived = deriveAlertsFromTelemetry(nextReading, nextEval, thresholds);

      if (derived.length > 0) {
        setAlerts((prev) => {
          const existingKeys = new Set(
            prev
              .filter((a) => a.status !== 'Resolved')
              .map((a) => `${a.category}:${a.severity}`)
          );
          const fresh = derived.filter(
            (a) => !existingKeys.has(`${a.category}:${a.severity}`)
          );
          if (fresh.length === 0) return prev;
          return [...fresh, ...prev].slice(0, 30);
        });
      }
    },
    [thresholds]
  );

  const fetchLatestHardwarePacket = useCallback(async () => {
    try {
      const res = await fetch('/api/sensors/latest');
      if (!res.ok) {
        setHardwareStatusMsg(
          'No hardware packet received yet. Use About Project > ESP32 Simulator or POST to /api/sensors/ingest.'
        );
        return false;
      }
      const data = await res.json();
      const pkt = data.packet;
      const now = new Date(pkt.receivedAt ?? Date.now());
      const hwReading: SensorReading = {
        id: `HW-${now.getTime()}`,
        timestamp: now.toISOString(),
        timeLabel: now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        ph: Number(pkt.ph),
        turbidity: Number(pkt.turbidity),
        temperature: Number(pkt.temperature),
        flowRate: Number(pkt.flowRate),
        pressure: Number(pkt.pressure),
        tankLevel: Number(pkt.tankLevel),
        leakSignal: Number(pkt.leakSignal ?? 10),
        source: 'hardware',
        deviceId: pkt.deviceId ?? 'ESP32-NODE-01',
      };
      appendReadingAndAlerts(hwReading);
      setHardwareStatusMsg(
        `Connected to live hardware node ${hwReading.deviceId} (packet received at ${hwReading.timeLabel}).`
      );
      return true;
    } catch {
      setHardwareStatusMsg('Unable to reach /api/sensors/latest endpoint.');
      return false;
    }
  }, [appendReadingAndAlerts]);

  // Live streaming loop
  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => {
      if (dataSource === 'hardware') {
        void fetchLatestHardwarePacket();
      } else {
        setHistory((prev) => {
          const prevLast = prev[prev.length - 1];
          const next = generateNextReading(
            scenario,
            'simulated',
            prevLast,
            calibrationOffsets
          );
          const nextEval = evaluateTelemetry(next, thresholds);
          const derived = deriveAlertsFromTelemetry(next, nextEval, thresholds);
          if (derived.length > 0) {
            setAlerts((prevAlerts) => {
              const existingKeys = new Set(
                prevAlerts
                  .filter((a) => a.status !== 'Resolved')
                  .map((a) => `${a.category}:${a.severity}`)
              );
              const fresh = derived.filter(
                (a) => !existingKeys.has(`${a.category}:${a.severity}`)
              );
              if (fresh.length === 0) return prevAlerts;
              return [...fresh, ...prevAlerts].slice(0, 30);
            });
          }
          return [...prev.slice(-23), next];
        });
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [
    isStreaming,
    dataSource,
    scenario,
    calibrationOffsets,
    thresholds,
    fetchLatestHardwarePacket,
  ]);

  const handleSelectScenario = (nextScenario: ScenarioId) => {
    setScenario(nextScenario);
    setDataSource('simulated');
    setHardwareStatusMsg(null);
    const immediate = generateNextReading(
      nextScenario,
      'simulated',
      undefined,
      calibrationOffsets
    );
    appendReadingAndAlerts(immediate);
    setAiResult(null);
  };

  const handleSwitchDataSource = async (mode: DataSourceMode) => {
    setDataSource(mode);
    if (mode === 'hardware') {
      await fetchLatestHardwarePacket();
    } else {
      setHardwareStatusMsg(null);
      const simReading = generateNextReading(
        scenario,
        'simulated',
        latestReading,
        calibrationOffsets
      );
      appendReadingAndAlerts(simReading);
    }
  };

  const handleManualSample = () => {
    if (dataSource === 'hardware') {
      void fetchLatestHardwarePacket();
    } else {
      const next = generateNextReading(
        scenario,
        'simulated',
        latestReading,
        calibrationOffsets
      );
      appendReadingAndAlerts(next);
    }
  };

  const handleCalibrateSensor = (
    sensorType: CalibrationRecord['sensorType'],
    offset: number
  ) => {
    const nowLabel = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setCalibrationRecords((prev) =>
      prev.map((rec) =>
        rec.sensorType === sensorType
          ? { ...rec, offset, lastCalibrated: nowLabel, status: 'Calibrated' }
          : rec
      )
    );
  };

  const handleUpdateAlertStatus = (id: string, status: AlertItem['status']) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleScheduleMaintenance = (segmentName: string, reason: string) => {
    const nextDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const newTask: MaintenanceTask = {
      id: `MT-${Math.floor(500 + Math.random() * 499)}`,
      segmentName,
      title: reason,
      priority: evalResult.overallStatus === 'Critical' ? 'Urgent' : 'Elevated',
      scheduledDate: nextDate,
      status: 'Scheduled',
      triggeredBy: `System Diagnostic (${latestReading.timeLabel})`,
      notes: `Generated from active telemetry (${latestReading.source}).`,
    };
    setMaintenanceTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTaskStatus = (
    id: string,
    status: MaintenanceTask['status']
  ) => {
    setMaintenanceTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const handleRunAI = async () => {
    setActivePage('ai');
    setIsAnalyzingAI(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading: latestReading,
          thresholds,
          segments,
          recentHistory: history.slice(-8),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? 'AI analysis failed to complete.');
      } else {
        setAiResult(data as AIAnalysisResult);
      }
    } catch {
      setAiError(
        'Network error reaching /api/ai-analyze. Verify the server is running.'
      );
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const activeAlertCount = alerts.filter((a) => a.status !== 'Resolved').length;

  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      scenario={scenario}
      onChangeScenario={handleSelectScenario}
      dataSource={dataSource}
      overallStatus={evalResult.overallStatus}
      activeAlertCount={activeAlertCount}
      onRunAI={handleRunAI}
      isAnalyzingAI={isAnalyzingAI}
    >
      {activePage === 'home' && (
        <HomePage
          reading={latestReading}
          evalResult={evalResult}
          thresholds={thresholds}
          scenario={scenario}
          dataSource={dataSource}
          onSelectScenario={handleSelectScenario}
          onNavigate={setActivePage}
          onRunAI={handleRunAI}
        />
      )}

      {activePage === 'dashboard' && (
        <DashboardPage
          reading={latestReading}
          history={history}
          evalResult={evalResult}
          thresholds={thresholds}
          dataSource={dataSource}
          isStreaming={isStreaming}
          onToggleStreaming={() => setIsStreaming((s) => !s)}
          onSwitchDataSource={handleSwitchDataSource}
          onManualSample={handleManualSample}
          onNavigate={setActivePage}
          hardwareStatusMsg={hardwareStatusMsg}
          onCheckHardware={async () => {
            await fetchLatestHardwarePacket();
          }}
        />
      )}

      {activePage === 'quality' && (
        <WaterQualityPage
          reading={latestReading}
          history={history}
          evalResult={evalResult}
          thresholds={thresholds}
          onUpdateThresholds={setThresholds}
          calibrationRecords={calibrationRecords}
          onCalibrateSensor={handleCalibrateSensor}
        />
      )}

      {activePage === 'pipeline' && (
        <PipelineMonitoringPage
          reading={latestReading}
          history={history}
          evalResult={evalResult}
          thresholds={thresholds}
          segments={segments}
          onScheduleMaintenance={handleScheduleMaintenance}
        />
      )}

      {activePage === 'ai' && (
        <AIAnalysisPage
          reading={latestReading}
          evalResult={evalResult}
          thresholds={thresholds}
          aiResult={aiResult}
          aiError={aiError}
          isAnalyzing={isAnalyzingAI}
          onRunAI={handleRunAI}
          onScheduleMaintenance={handleScheduleMaintenance}
        />
      )}

      {activePage === 'alerts' && (
        <AlertsPage
          alerts={alerts}
          onUpdateAlertStatus={handleUpdateAlertStatus}
          maintenanceTasks={maintenanceTasks}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      )}

      {activePage === 'reports' && (
        <ReportsPage
          reading={latestReading}
          history={history}
          evalResult={evalResult}
          thresholds={thresholds}
          alerts={alerts}
          segments={segments}
          aiResult={aiResult}
        />
      )}

      {activePage === 'about' && (
        <AboutProjectPage
          onHardwarePacketSent={async () => {
            await fetchLatestHardwarePacket();
          }}
        />
      )}
    </Layout>
  );
}
