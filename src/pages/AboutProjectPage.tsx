import { useState } from 'react';
import { CheckCircle2, Cpu, Send, ShieldAlert } from 'lucide-react';
import { WORKFLOW_PHASES } from '../data/workflowData';

interface AboutProjectPageProps {
  onHardwarePacketSent: () => Promise<void>;
}

const HARDWARE_SENSORS = [
  {
    sensor: 'pH Sensor Module (SEN0161)',
    parameter: 'Acidity / Alkalinity (0–14 pH)',
    interfacePin: 'ESP32 ADC Pin GPIO34',
    standardRange: '6.5 – 8.5 pH (BIS IS 10500)',
  },
  {
    sensor: 'Optical Turbidity Sensor (SEN0189)',
    parameter: 'Suspended Solids (NTU)',
    interfacePin: 'ESP32 ADC Pin GPIO35',
    standardRange: '< 1.0 NTU acceptable · ≥ 5.0 critical',
  },
  {
    sensor: 'DS18B20 Waterproof Probe',
    parameter: 'Water Temperature (°C)',
    interfacePin: 'OneWire Digital GPIO4',
    standardRange: '10 °C – 30 °C',
  },
  {
    sensor: 'YF-S201 Hall-Effect Flow Meter',
    parameter: 'Volumetric Flow Rate (L/min)',
    interfacePin: 'Interrupt Pulse GPIO18',
    standardRange: 'Compared against hourly baseline',
  },
  {
    sensor: '0–1.2 MPa Pressure Transducer',
    parameter: 'Hydraulic Line Pressure (bar)',
    interfacePin: 'ESP32 ADC Pin GPIO32',
    standardRange: '2.2 – 5.8 bar operating band',
  },
  {
    sensor: 'HC-SR04 / JSN-SR04T Ultrasonic',
    parameter: 'Overhead Tank Level (%)',
    interfacePin: 'TRIG GPIO5 / ECHO GPIO19',
    standardRange: '> 30% reserve recommended',
  },
  {
    sensor: 'Flow-Drop & Acoustic Leak Node',
    parameter: 'Leakage Pattern Index (0–100)',
    interfacePin: 'Computed on Edge + Cloud API',
    standardRange: 'Probabilistic inference (< 100%)',
  },
];

export function AboutProjectPage({ onHardwarePacketSent }: AboutProjectPageProps) {
  const [testPh, setTestPh] = useState('7.15');
  const [testTurbidity, setTestTurbidity] = useState('0.85');
  const [testPressure, setTestPressure] = useState('3.75');
  const [testFlow, setTestFlow] = useState('122');
  const [testTank, setTestTank] = useState('76');
  const [ingestFeedback, setIngestFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTestHardwareIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setIngestFeedback(null);
    try {
      const res = await fetch('/api/sensors/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'ESP32-DEMO-BENCH',
          ph: Number(testPh),
          turbidity: Number(testTurbidity),
          temperature: 23.2,
          flowRate: Number(testFlow),
          pressure: Number(testPressure),
          tankLevel: Number(testTank),
          leakSignal: Number(testPressure) < 2.2 ? 74 : 11,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setIngestFeedback(errData.error ?? 'Failed to ingest hardware test packet.');
      } else {
        setIngestFeedback(
          'Hardware packet accepted! Switch to "Hardware Mode" on the Monitoring Dashboard to view this live ESP32 packet.'
        );
        await onHardwarePacketSent();
      }
    } catch {
      setIngestFeedback('Network error while posting to /api/sensors/ingest.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Introduction for Students */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          About the Smart Water Supply Monitoring Project
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
          This application demonstrates an end-to-end engineering platform for monitoring potable water quality and pipeline mechanical stress. Designed so first-year engineering students can explain the complete lifecycle—from physical microcontroller sensors up to AI-assisted maintenance scheduling—it separates simulated classroom data from live hardware telemetry and presents probabilistic confidence rather than overstated guarantees.
        </p>
      </section>

      {/* How the 5-Phase System Works */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          How the 5-Phase Engineering Architecture Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {WORKFLOW_PHASES.map((phase) => (
            <div
              key={phase.phaseNumber}
              className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50"
            >
              <div className="text-xs font-mono font-semibold text-sky-700">
                Phase 0{phase.phaseNumber}
              </div>
              <div className="font-display font-semibold text-sm text-slate-900">
                {phase.title.replace(/^Phase \d+: /, '')}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {phase.objective}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Hardware Architecture & Arduino/ESP32 Pinout */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-600" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Arduino / ESP32 Sensor Integration Blueprint
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          Connect physical water sensors to an ESP32 or Arduino + Wi-Fi shield and send JSON readings to{' '}
          <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
            POST /api/sensors/ingest
          </code>
          .
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 font-medium">Hardware Sensor</th>
                <th className="py-2.5 font-medium">Measured Parameter</th>
                <th className="py-2.5 font-medium">Microcontroller Pin</th>
                <th className="py-2.5 font-medium">Operating Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HARDWARE_SENSORS.map((row) => (
                <tr key={row.sensor} className="h-10">
                  <td className="py-2 font-medium text-slate-900">{row.sensor}</td>
                  <td className="py-2 text-slate-700">{row.parameter}</td>
                  <td className="py-2 font-mono text-sky-700">{row.interfacePin}</td>
                  <td className="py-2 text-slate-600">{row.standardRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Hardware Payload Tester */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Test Hardware Ingestion Endpoint (ESP32 Simulator)
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Demonstrate real backend IoT ingestion during a lab presentation by sending a custom JSON sensor packet directly to{' '}
            <code className="font-mono text-slate-900">/api/sensors/ingest</code>.
          </p>

          <form onSubmit={handleTestHardwareIngest} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">pH</span>
              <input
                type="number"
                step="0.01"
                value={testPh}
                onChange={(e) => setTestPh(e.target.value)}
                className="w-full h-9 px-3 font-mono text-sm border border-slate-200 rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Turbidity (NTU)</span>
              <input
                type="number"
                step="0.05"
                value={testTurbidity}
                onChange={(e) => setTestTurbidity(e.target.value)}
                className="w-full h-9 px-3 font-mono text-sm border border-slate-200 rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Pressure (bar)</span>
              <input
                type="number"
                step="0.05"
                value={testPressure}
                onChange={(e) => setTestPressure(e.target.value)}
                className="w-full h-9 px-3 font-mono text-sm border border-slate-200 rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Flow (L/min)</span>
              <input
                type="number"
                step="1"
                value={testFlow}
                onChange={(e) => setTestFlow(e.target.value)}
                className="w-full h-9 px-3 font-mono text-sm border border-slate-200 rounded-lg"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Tank (%)</span>
              <input
                type="number"
                step="1"
                value={testTank}
                onChange={(e) => setTestTank(e.target.value)}
                className="w-full h-9 px-3 font-mono text-sm border border-slate-200 rounded-lg"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{submitting ? 'Sending...' : 'Send Packet'}</span>
              </button>
            </div>
          </form>

          {ingestFeedback && (
            <div className="flex items-start gap-2 text-xs font-medium text-sky-900 bg-sky-50 border border-sky-200 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{ingestFeedback}</span>
            </div>
          )}
        </div>

        {/* Accuracy & Ethics Disclaimer */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-slate-900">
              Engineering Accuracy &amp; Calibration Methodology
            </h2>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-disc pl-4">
            <li>
              <strong className="text-slate-900">No 100% Certainty Claims:</strong>{' '}
              Sensor drift, transient pump surges, and temperature shifts create uncertainty. Leakage and anomaly detectors always express bounded confidence (typically 65%–94%).
            </li>
            <li>
              <strong className="text-slate-900">Simulated vs. Hardware Separation:</strong>{' '}
              Demo Mode uses mathematical hydraulic models for classroom testing, while Hardware Mode reads validated JSON packets from physical ESP32/Arduino nodes.
            </li>
            <li>
              <strong className="text-slate-900">Standards-Based Thresholds:</strong>{' '}
              Evaluations default to BIS IS 10500:2012 drinking-water standards and can be switched to WHO Guidelines or custom laboratory limits anytime.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
