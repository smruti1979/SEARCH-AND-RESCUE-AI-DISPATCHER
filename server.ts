/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI server-side with key
const aiApiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (aiApiKey) {
  ai = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('⚠️ GEMINI_API_KEY is not defined in the environment. Using simulation fallback.');
}

// 1. Live feedback analyzer API endpoint
app.post('/api/analyze', async (req, res) => {
  const { rawText, source } = req.body;

  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'Missing rawText parameter' });
  }

  // If API key is missing, return a realistic simulation fallback to keep the app functional
  if (!ai) {
    console.log('Running analysis in simulation fallback (no API key).');
    const latBase = 34.0522;
    const lngBase = -118.2437;
    // Generate simulated structured response based on the text
    const response = simulateAnalysis(rawText, latBase, lngBase, source);
    return res.json(response);
  }

  try {
    const prompt = `
      You are an Elite Search and Rescue AI Dispatcher.
      Analyze the following incoming disaster feed report with extreme precision.
      Identify structural collapses, fire hazards, rising water, toxic gas, and signs of life.
      Prioritize urgent extraction coordinates, estimate victim count, and categorize threat levels by proximity.
      
      Feed Source: ${source || 'UNKNOWN'}
      Report Content:
      "${rawText}"
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are the lead tactical AI dispatcher for FEMA and urban search and rescue teams. You extract actionable coordinate-mapped distress and hazard telemetry. If no lat/lng is in the text, extrapolate a relative offset around central disaster coordinate range 34.050 to 34.060 latitude and -118.240 to -118.250 longitude.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Descriptive 3-5 word title of the incident" },
            summary: { type: Type.STRING, description: "One-sentence situational briefing" },
            coordinates: {
              type: Type.OBJECT,
              properties: {
                latitude: { type: Type.NUMBER, description: "Latitude coordinate of rescue point (e.g., 34.053)" },
                longitude: { type: Type.NUMBER, description: "Longitude coordinate of rescue point (e.g., -118.242)" },
              },
              required: ["latitude", "longitude"],
            },
            signsOfLife: {
              type: Type.OBJECT,
              properties: {
                detected: { type: Type.BOOLEAN, description: "Are there any indicators of survival, noise, heat signatures, audio taps or calling for help?" },
                description: { type: Type.STRING, description: "Specific details of what survival signs were detected (e.g., K9 alert, knocking sounds, high heat signature)" },
                confidence: { type: Type.INTEGER, description: "Confidence score percentage (0-100)" },
              },
              required: ["detected", "description", "confidence"],
            },
            hazards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Type of hazard (e.g., Structural Collapse, Rising Flood, Chemical Gas Leak, High Voltage, Blazing Fire)" },
                  description: { type: Type.STRING, description: "Details about the active hazard and risk" },
                  severity: { type: Type.STRING, description: "CRITICAL, HIGH, MEDIUM, or LOW" }
                },
                required: ["type", "description", "severity"],
              },
            },
            extractionPriority: { type: Type.STRING, description: "IMMEDIATE (highest danger + signs of life), HIGH, or STANDBY" },
            proximityThreats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Failing barrier, fuel tanks, aftershocks, power grid failure, etc." },
                  distanceMeters: { type: Type.NUMBER, description: "Approximate distance to victims" },
                  hazardLevel: { type: Type.STRING, description: "CRITICAL, HIGH, MEDIUM, or LOW" },
                },
                required: ["name", "distanceMeters", "hazardLevel"],
              },
            },
            dispatchRecommendation: { type: Type.STRING, description: "Specific search team or heavy equipment dispatch directions" },
            morseCodeSignal: { type: Type.STRING, description: "Any distress signaling detected or parsed, or 'N/A'" },
            victimCountEstimate: { type: Type.INTEGER, description: "Estimated victim count (at least 1 if survivors are mentioned or implied)" },
          },
          required: [
            "title",
            "summary",
            "coordinates",
            "signsOfLife",
            "hazards",
            "extractionPriority",
            "proximityThreats",
            "dispatchRecommendation",
            "morseCodeSignal",
            "victimCountEstimate",
          ],
        },
      },
    });

    const text = result.text;
    if (!text) {
      throw new Error('Empty text response from Gemini');
    }

    const parsedData = JSON.parse(text.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error('Gemini API analysis failed:', error);
    // Fallback gracefully so UI remains resilient
    const latBase = 34.051 + Math.random() * 0.01;
    const lngBase = -118.244 - Math.random() * 0.01;
    const fallbackResponse = simulateAnalysis(rawText, latBase, lngBase, source);
    return res.json({
      ...fallbackResponse,
      _isFallback: true,
      _apiError: error?.message || 'Server-side processing error',
    });
  }
});

// Mock simulation helper in case API Key is missing or service throws an error
function simulateAnalysis(text: string, defaultLat: number, defaultLng: number, source: string) {
  const lowercase = text.toLowerCase();
  
  // Extract coordinates if present, e.g., 34.053, -118.242
  let lat = defaultLat;
  let lng = defaultLng;
  const coordRegex = /(-?\d+\.\d+)[^\d-]+(-?\d+\.\d+)/;
  const match = text.match(coordRegex);
  if (match) {
    const p1 = parseFloat(match[1]);
    const p2 = parseFloat(match[2]);
    if (Math.abs(p1) < 90 && Math.abs(p2) < 180) {
      lat = p1;
      lng = p2;
    }
  }

  // Detect survival indicators
  const hasVoice = lowercase.includes('voice') || lowercase.includes('calling') || lowercase.includes('screaming') || lowercase.includes('crying');
  const hasThermal = lowercase.includes('thermal') || lowercase.includes('heat') || lowercase.includes('signature') || lowercase.includes('infrared');
  const hasAcoustic = lowercase.includes('acoustic') || lowercase.includes('tapping') || lowercase.includes('knocking') || lowercase.includes('vibration') || lowercase.includes('audio');
  const hasLife = lowercase.includes('survivor') || lowercase.includes('alive') || lowercase.includes('people') || lowercase.includes('victim') || hasVoice || hasThermal || hasAcoustic;

  // Victim estimate
  let victims = 1;
  const numMatch = lowercase.match(/(\d+)\s*(survivor|victim|people|trapped|bodies)/);
  if (numMatch) {
    victims = parseInt(numMatch[1], 10);
  } else if (lowercase.includes('multiple')) {
    victims = 4;
  }

  // Hazards list
  const hazards = [];
  if (lowercase.includes('collapse') || lowercase.includes('crushed') || lowercase.includes('rubble') || lowercase.includes('debris')) {
    hazards.push({
      type: 'Structural Collapse',
      description: 'Severe structural integrity failure with heavy masonry blockages',
      severity: 'CRITICAL',
    });
  }
  if (lowercase.includes('fire') || lowercase.includes('smoke') || lowercase.includes('blaze') || lowercase.includes('flame')) {
    hazards.push({
      type: 'Active Conflagration',
      description: 'Thermal spread threatens immediate search perimeter',
      severity: 'HIGH',
    });
  }
  if (lowercase.includes('water') || lowercase.includes('flood') || lowercase.includes('rising') || lowercase.includes('leak') || lowercase.includes('burst')) {
    hazards.push({
      type: 'Rising Water Level',
      description: 'Flooding in lower levels and basements limits survival window',
      severity: 'CRITICAL',
    });
  }
  if (lowercase.includes('gas') || lowercase.includes('toxic') || lowercase.includes('chemical') || lowercase.includes('fume')) {
    hazards.push({
      type: 'Toxic Gas Release',
      description: 'Combustible or asphyxiating atmosphere detected',
      severity: 'CRITICAL',
    });
  }
  if (lowercase.includes('power') || lowercase.includes('wire') || lowercase.includes('voltage') || lowercase.includes('electrical')) {
    hazards.push({
      type: 'Electrical Hazard',
      description: 'Active downed high-voltage lines blocking access pathways',
      severity: 'HIGH',
    });
  }

  if (hazards.length === 0) {
    hazards.push({
      type: 'General Debris Hazard',
      description: 'General unsecure physical elements impeding rescue paths',
      severity: 'MEDIUM',
    });
  }

  // Proximity threats
  const proximityThreats = [];
  if (lowercase.includes('gas') || lowercase.includes('fuel') || lowercase.includes('tank')) {
    proximityThreats.push({
      name: 'Combustible Fuel Tank Proximity',
      distanceMeters: 45,
      hazardLevel: 'CRITICAL',
    });
  }
  if (lowercase.includes('aftershock') || lowercase.includes('seismic') || lowercase.includes('unstable')) {
    proximityThreats.push({
      name: 'Unstable Secondary Brick Wall',
      distanceMeters: 15,
      hazardLevel: 'HIGH',
    });
  } else {
    proximityThreats.push({
      name: 'Unsecured Secondary Structures',
      distanceMeters: 80,
      hazardLevel: 'MEDIUM',
    });
  }

  // Extraction Priority
  let extractionPriority: 'IMMEDIATE' | 'HIGH' | 'STANDBY' = 'STANDBY';
  if (hasLife && hazards.some(h => h.severity === 'CRITICAL')) {
    extractionPriority = 'IMMEDIATE';
  } else if (hasLife || hazards.some(h => h.severity === 'CRITICAL' || h.severity === 'HIGH')) {
    extractionPriority = 'HIGH';
  }

  // Title & Summary
  let title = 'SAR Assessment';
  if (lowercase.includes('collapse')) title = 'Masonry Structural Collapse';
  else if (lowercase.includes('fire')) title = 'Structure Fire Response';
  else if (lowercase.includes('flood') || lowercase.includes('water')) title = 'Submerged Search & Extraction';
  else if (lowercase.includes('gas')) title = 'Toxic Gas Hazard Assessment';

  const summary = `Tactical team alert: Verified dispatch feed from ${source} reports danger levels and signals in immediate proximity.`;

  // Morse Code Signal
  let morseCodeSignal = 'N/A';
  if (lowercase.includes('morse') || lowercase.includes('s.o.s') || lowercase.includes('sos')) {
    morseCodeSignal = '... --- ... (SOS)';
  } else if (lowercase.includes('tapping') || lowercase.includes('acoustic')) {
    morseCodeSignal = '... (Distress Taps)';
  }

  // Dispatch recommendation
  let dispatchRecommendation = 'Deploy general search team and drone scouting.';
  if (lowercase.includes('collapse')) {
    dispatchRecommendation = 'Deploy Heavy Rescue squad with concrete cutters, hydraulic shoring, and K9 audio localization.';
  } else if (lowercase.includes('fire')) {
    dispatchRecommendation = 'Deploy Fire suppression unit first, followed by Medical rescue teams.';
  } else if (lowercase.includes('flood') || lowercase.includes('water')) {
    dispatchRecommendation = 'Deploy Aquatic rescue specialists and dive search assets immediately.';
  }

  return {
    title,
    summary,
    coordinates: { latitude: lat, longitude: lng },
    signsOfLife: {
      detected: hasLife,
      description: hasLife 
        ? `Life signs detected (${hasThermal ? 'Thermal heat trace' : ''} ${hasAcoustic ? 'Acoustic rescue tap resonance' : ''} ${hasVoice ? 'Vocal distress cries' : 'Implied vital indicators'})` 
        : 'No thermal, acoustic or visual signs of life parsed in current feed timeframe.',
      confidence: hasLife ? 85 : 15,
    },
    hazards,
    extractionPriority,
    proximityThreats,
    dispatchRecommendation,
    morseCodeSignal,
    victimCountEstimate: victims,
  };
}

// 2. Integration of Vite Middleware/Production Assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA catch-all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Elite SAR Command Center Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
