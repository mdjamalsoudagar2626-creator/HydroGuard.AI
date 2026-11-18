import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

interface HardwarePacket {
  deviceId: string;
  ph: number;
  turbidity: number;
  temperature: number;
  flowRate: number;
  pressure: number;
  tankLevel: number;
  leakSignal: number;
  receivedAt: string;
}

let latestHardwareReading: HardwarePacket | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'hydroguard-water-monitoring',
    hardwareConnected: latestHardwareReading !== null,
  });
});

app.post('/api/sensors/ingest', (req, res) => {
  const body = req.body ?? {};
  const ph = Number(body.ph);
  const turbidity = Number(body.turbidity);
  const temperature = Number(body.temperature);
  const flowRate = Number(body.flowRate);
  const pressure = Number(body.pressure);
  const tankLevel = Number(body.tankLevel);
  const leakSignal = Number(body.leakSignal ?? 10);

  if (
    [ph, turbidity, temperature, flowRate, pressure, tankLevel].some((v) =>
      Number.isNaN(v)
    )
  ) {
    return res.status(400).json({
      error:
        'Invalid sensor payload. Numeric ph, turbidity, temperature, flowRate, pressure, and tankLevel fields are required.',
    });
  }

  latestHardwareReading = {
    deviceId:
      typeof body.deviceId === 'string' && body.deviceId.trim()
        ? body.deviceId.trim()
        : 'ESP32-NODE-01',
    ph,
    turbidity,
    temperature,
    flowRate,
    pressure,
    tankLevel,
    leakSignal: Number.isNaN(leakSignal) ? 10 : Math.min(94, Math.max(0, leakSignal)),
    receivedAt: new Date().toISOString(),
  };

  return res.status(201).json({
    accepted: true,
    packet: latestHardwareReading,
  });
});

app.get('/api/sensors/latest', (_req, res) => {
  if (!latestHardwareReading) {
    return res.status(404).json({
      connected: false,
      message:
        'No live hardware telemetry packet received yet. POST JSON to /api/sensors/ingest from an ESP32/Arduino node or test from About Project.',
    });
  }
  return res.json({
    connected: true,
    packet: latestHardwareReading,
  });
});

app.post('/api/ai-analyze', async (req, res) => {
  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      error:
        'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets to run live Gemini diagnostics.',
    });
  }

  const { reading, thresholds, segments, recentHistory } = req.body ?? {};
  if (!reading || !thresholds) {
    return res.status(400).json({
      error: 'Missing reading or thresholds payload for AI analysis.',
    });
  }

  const prompt = `Analyze this smart water supply and pipeline telemetry snapshot for a first-year engineering demonstration.

Telemetry Source: ${reading.source === 'hardware' ? 'Live IoT Hardware Node (' + reading.deviceId + ')' : 'Simulated Engineering Sandbox (' + reading.deviceId + ')'}
Active Drinking-Water Standard: ${thresholds.standardName}

Current Sensor Readings:
- pH Level: ${reading.ph} (Allowed: ${thresholds.phMin} to ${thresholds.phMax})
- Turbidity: ${reading.turbidity} NTU (Warning >= ${thresholds.turbidityWarn}, Critical >= ${thresholds.turbidityCrit})
- Water Temperature: ${reading.temperature} C (Allowed: ${thresholds.tempMin} to ${thresholds.tempMax} C)
- Flow Rate: ${reading.flowRate} L/min (Normal Baseline: ${thresholds.flowBaseline} L/min)
- Pipeline Pressure: ${reading.pressure} bar (Operating Band: ${thresholds.pressureMin} to ${thresholds.pressureMax} bar)
- Water Tank Level: ${reading.tankLevel}% (Low Warning <= ${thresholds.tankLowWarn}%, Critical <= ${thresholds.tankLowCrit}%)
- Acoustic/Flow-Drop Leak Signal: ${reading.leakSignal}/100

Pipeline Segment Summary:
${JSON.stringify(segments ?? [], null, 2)}

Recent Reading Trend (last ${Array.isArray(recentHistory) ? recentHistory.length : 0} samples):
${JSON.stringify((recentHistory ?? []).slice(-6), null, 2)}

Strict Rules:
1. Classify overallAssessment strictly as "Safe", "Warning", or "Critical".
2. NEVER claim 100% detection certainty. Keep confidencePercent realistically between 65 and 94.
3. Explicitly note in limitationsNote whether the readings are simulated or from hardware, and explain why hydraulic/quality inference is probabilistic.
4. Explain detected issues in clear, approachable language suitable for engineering students.
5. Provide concrete recommendations such as inspecting pipeline joints, checking filtration media, calibrating the pH probe, inspecting leak zones, or scheduling maintenance.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a water quality and hydraulic pipeline engineering assistant. Return concise, accurate structured JSON diagnostics without claiming 100% certainty.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAssessment: {
              type: Type.STRING,
              enum: ['Safe', 'Warning', 'Critical'],
            },
            confidencePercent: {
              type: Type.NUMBER,
              description: 'Realistic confidence between 65 and 94. Never 100.',
            },
            summaryExplanation: {
              type: Type.STRING,
              description:
                'Plain-English 2-3 sentence explanation of current water quality, pipe stress, and anomalies.',
            },
            detectedIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    enum: ['Safe', 'Warning', 'Critical'],
                  },
                  explanation: { type: Type.STRING },
                  confidencePercent: { type: Type.NUMBER },
                  observedMetric: { type: Type.STRING },
                },
                required: [
                  'category',
                  'severity',
                  'explanation',
                  'confidencePercent',
                  'observedMetric',
                ],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  action: { type: Type.STRING },
                  targetComponent: { type: Type.STRING },
                  priority: {
                    type: Type.STRING,
                    enum: ['Low', 'Medium', 'High'],
                  },
                  phaseLabel: { type: Type.STRING },
                },
                required: [
                  'title',
                  'action',
                  'targetComponent',
                  'priority',
                  'phaseLabel',
                ],
              },
            },
            maintenancePrediction: {
              type: Type.OBJECT,
              properties: {
                urgency: {
                  type: Type.STRING,
                  enum: ['Routine', 'Inspect Soon', 'Immediate Inspection'],
                },
                estimatedWindowDays: { type: Type.INTEGER },
                reasoning: { type: Type.STRING },
              },
              required: ['urgency', 'estimatedWindowDays', 'reasoning'],
            },
            limitationsNote: {
              type: Type.STRING,
            },
          },
          required: [
            'overallAssessment',
            'confidencePercent',
            'summaryExplanation',
            'detectedIssues',
            'recommendations',
            'maintenancePrediction',
            'limitationsNote',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const clampedConfidence = Math.min(
      94,
      Math.max(55, Math.round(Number(parsed.confidencePercent ?? 82)))
    );

    return res.json({
      ...parsed,
      confidencePercent: clampedConfidence,
      analyzedAt: new Date().toISOString(),
      dataSource: reading.source === 'hardware' ? 'hardware' : 'simulated',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to run Gemini diagnostic request.';
    console.error('Gemini analysis error:', err);
    return res.status(502).json({
      error: `AI diagnostic service error: ${message}`,
    });
  }
});

async function startServer() {
  const port = Number(process.env.PORT ?? 3000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HydroGuard AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
