import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI server-side with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Road Damage AI Engine',
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/analyze-damage', async (req: Request, res: Response): Promise<void> => {
  try {
    const { image, mimeType = 'image/jpeg', roadContext } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required (base64 string or data URL)' });
      return;
    }

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const systemPrompt = `You are an expert Civil & Highway Engineer and ASTM D6433 Pavement Distress Inspector.
Your mission is to perform automated computer vision inspection and structural distress detection on road pavement imagery.

Examine the image thoroughly. You MUST detect any road damage including:
- Potholes (depth, loose aggregate, broken edges)
- Alligator / Fatigue Cracking (interconnected polygon spiderweb cracks)
- Longitudinal Cracking (parallel to road centerline/wheelpaths)
- Transverse Cracking (perpendicular thermal fissures)
- Rutting & Pavement Depressions
- Edge Cracking / Shoulder Drop-off / Curb Spalling
- Ravelling & Loss of Asphalt Binder
- Utility Trench Settlement & Patch Failures

Provide accurate bounding boxes normalized [ymin, xmin, ymax, xmax] on a scale of 0 to 1000 so the frontend can render crisp visual overlay boxes directly on top of the asphalt defects.
Provide ASTM D6433 standard compliant PCI (Pavement Condition Index) deductions, realistic municipal repair estimates, labor requirements, and urgent safety ratings.`;

    const userPrompt = `Perform a comprehensive pavement distress survey on this road image.
${roadContext ? `Location context provided: ${roadContext}` : 'Evaluate urban/highway pavement condition.'}
Identify every distinct defect area with normalized bounding boxes [ymin, xmin, ymax, xmax] (0-1000). Estimate realistic repair costs, method, and traffic hazards.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Concise 1-2 sentence engineering description of damage found.',
            },
            primaryDefectType: {
              type: Type.STRING,
              description: 'Primary defect type: Pothole, Alligator Cracking, Longitudinal Cracking, Transverse Cracking, Rutting, Shoulder Drop-off, Ravelling, or Subsidence.',
            },
            overallSeverity: {
              type: Type.STRING,
              description: 'Severity: Critical, High, Medium, or Low.',
            },
            hazardRating: {
              type: Type.INTEGER,
              description: 'Hazard score from 1 to 10 (10 = catastrophic tire/rim failure or collision threat).',
            },
            pciDeductionScore: {
              type: Type.NUMBER,
              description: 'Estimated ASTM D6433 PCI deduct value (between 2.0 and 48.0).',
            },
            estimatedDimensions: {
              type: Type.OBJECT,
              properties: {
                widthCm: { type: Type.NUMBER, description: 'Estimated width in centimeters' },
                lengthCm: { type: Type.NUMBER, description: 'Estimated length in centimeters' },
                depthCategory: {
                  type: Type.STRING,
                  description: 'Shallow (<2.5 cm) | Moderate (2.5-5 cm) | Severe (>5 cm)',
                },
                estimatedAreaSqM: { type: Type.NUMBER, description: 'Estimated surface area in square meters' },
              },
              required: ['widthCm', 'lengthCm', 'depthCategory', 'estimatedAreaSqM'],
            },
            detectedDefects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  box2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] coordinates from 0 to 1000',
                  },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['id', 'label', 'confidence', 'box2d', 'severity', 'description'],
              },
            },
            rootCause: {
              type: Type.STRING,
              description: 'Physical engineering root cause (e.g., Subbase water saturation with freeze-thaw pumping, repetitive heavy axle load fatigue, asphalt binder oxidation, lack of lateral embankment support).',
            },
            recommendedRepair: {
              type: Type.OBJECT,
              properties: {
                method: { type: Type.STRING, description: 'Specific repair method (e.g. Hot-mix asphalt throw-and-roll, Full-depth mill and resurface, Hot-poured polymer modified crack seal, Infrared thermal restoration)' },
                materials: { type: Type.STRING, description: 'Asphalt or sealant grade and quantity estimate' },
                estimatedCostUsd: { type: Type.NUMBER, description: 'Estimated municipal repair cost in USD' },
                laborHours: { type: Type.NUMBER, description: 'Estimated crew hours required' },
                equipment: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of required machinery and hand tools',
                },
                responseSla: { type: Type.STRING, description: 'e.g. 24-Hour Emergency Dispatch, 72-Hour Priority Repair, 14-Day Routine Maintenance' },
              },
              required: ['method', 'materials', 'estimatedCostUsd', 'laborHours', 'equipment', 'responseSla'],
            },
            safetyAdvisory: {
              type: Type.OBJECT,
              properties: {
                vehicleRisk: { type: Type.STRING, description: 'Impact on tires, wheels, suspensions, or chassis' },
                twoWheelerRisk: { type: Type.STRING, description: 'Danger to bicycles, e-scooters, and motorcycles' },
                trafficControlRequired: { type: Type.BOOLEAN, description: 'True if temporary lane taper or flaggers are needed' },
              },
              required: ['vehicleRisk', 'twoWheelerRisk', 'trafficControlRequired'],
            },
          },
          required: [
            'summary',
            'primaryDefectType',
            'overallSeverity',
            'hazardRating',
            'pciDeductionScore',
            'estimatedDimensions',
            'detectedDefects',
            'rootCause',
            'recommendedRepair',
            'safetyAdvisory',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing road damage:', error);
    res.status(500).json({
      error: 'Failed to analyze road damage with Gemini Vision.',
      details: error?.message || String(error),
    });
  }
});

app.post('/api/generate-work-order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { report } = req.body;
    if (!report) {
      res.status(400).json({ error: 'Report data is required' });
      return;
    }

    const prompt = `You are the Municipal Road Maintenance Chief Dispatcher.
Generate a structured, authoritative municipal Work Order dispatch plan for the following road damage report:
Location: ${report.locationAddress || 'Municipal Road Sector'} (Lat: ${report.lat || '37.7749'}, Lng: ${report.lng || '-122.4194'})
Defect Type: ${report.primaryDefectType}
Severity: ${report.overallSeverity} (Hazard Rating: ${report.hazardRating}/10)
Dimensions: ${JSON.stringify(report.estimatedDimensions || {})}
Recommended Repair: ${JSON.stringify(report.recommendedRepair || {})}

Return a JSON object for this Work Order ticket.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workOrderId: { type: Type.STRING, description: 'Official ticket code e.g. WO-2026-8941' },
            department: { type: Type.STRING, description: 'Department of Public Works - Asphalt Division' },
            assignedCrew: { type: Type.STRING, description: 'Specific crew designation e.g. District 4 Rapid Response Unit B' },
            crewLead: { type: Type.STRING, description: 'Lead engineer or crew supervisor name' },
            scheduledDate: { type: Type.STRING, description: 'ISO date or time window e.g. 2026-10-25 (Night Shift 22:00)' },
            trafficManagementPlan: { type: Type.STRING, description: 'Traffic control measures (arrow boards, cones, lane tapers)' },
            materialRequisition: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Line item list of materials with units'
            },
            equipmentRequired: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            estimatedDurationHours: { type: Type.NUMBER },
            safetyPrecautions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            dispatchNotes: { type: Type.STRING }
          },
          required: [
            'workOrderId',
            'department',
            'assignedCrew',
            'crewLead',
            'scheduledDate',
            'trafficManagementPlan',
            'materialRequisition',
            'equipmentRequired',
            'estimatedDurationHours',
            'safetyPrecautions',
            'dispatchNotes'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating work order:', error);
    res.status(500).json({
      error: 'Failed to generate work order',
      details: error?.message || String(error),
    });
  }
});

// Vite middleware in dev or static serving in prod
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Road Damage Reporter server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
