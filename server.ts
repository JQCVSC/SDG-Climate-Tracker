import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Resilient helper to call Gemini with model fallback if a model is under high demand (503) or rate-limited/quota-exhausted (429)
async function generateContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  responseMimeType: string = 'application/json'
): Promise<{ text: string; modelUsed: string } | null> {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType
        }
      });
      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      const errMessage = (err?.message || JSON.stringify(err) || '').toLowerCase();
      const isRecoverableIssue = 
        err?.status === 'UNAVAILABLE' || 
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.code === 503 || 
        err?.code === 429 ||
        errMessage.includes('quota') ||
        errMessage.includes('rate') ||
        errMessage.includes('resource_exhausted') ||
        errMessage.includes('429') ||
        errMessage.includes('503') ||
        errMessage.includes('high demand') ||
        errMessage.includes('unavailable');

      if (isRecoverableIssue) {
        // Silently move to next fallback model or fallback engine
        continue;
      }
      // For other unexpected issues, log once
      console.warn(`[Gemini note for ${model}]:`, err?.message || err);
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// POST /api/gemini/recommendations
// Generates intelligent, location- and AQI-aware climate and health insights
// -----------------------------------------------------------------------------
app.post('/api/gemini/recommendations', async (req, res) => {
  try {
    const { 
      locationName = 'Current Location', 
      aqiValue = 50, 
      aqiCategory = 'Good', 
      dominantPollutant = 'pm25',
      lat,
      lng 
    } = req.body;

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `
You are an expert atmospheric scientist and urban environmental health advisor for the SDG 13 Clean Air Initiative.

Analyze the following live environmental data:
- Location: ${locationName} (Coordinates: ${lat ?? 'N/A'}, ${lng ?? 'N/A'})
- Air Quality Index (AQI): ${aqiValue}
- Category: ${aqiCategory}
- Dominant Pollutant: ${dominantPollutant}

Provide tailored, intelligent, and logical insights. You must return a valid JSON object with the following schema:
{
  "headline": "A punchy, accurate 1-sentence assessment of current atmospheric conditions for this specific city/area and AQI.",
  "aiSummary": "A concise 2-3 sentence intelligent insight explaining why these conditions exist (terrain, commuter flow, atmospheric inversion, seasonal patterns) and what the community must prioritize today.",
  "outdoorAdvice": "Specific guidance for outdoor runners, cyclists, children, and elderly.",
  "indoorAdvice": "Specific indoor ventilation, HEPA filtration, or window timing advice.",
  "commuteAdvice": "Specific transit, eco-routing, cycling, or EV/public transit recommendation.",
  "actionRecommendation": "The #1 high-impact action a citizen or business can take right now to prevent further localized pollution.",
  "keyPollutantInsight": "1 sentence on the dominant pollutant (${dominantPollutant}) and its health impact.",
  "urgencyTier": "optimal" | "moderate" | "elevated" | "hazardous"
}
Only return JSON.
`;

      const aiResult = await generateContentWithFallback(
        ai,
        prompt,
        'You are an environmental science AI providing structured, actionable air quality advice. Output raw JSON only.',
        'application/json'
      );

      if (aiResult && aiResult.text) {
        try {
          const parsed = JSON.parse(aiResult.text);
          return res.json({
            success: true,
            source: `Google Gemini AI (${aiResult.modelUsed})`,
            data: parsed
          });
        } catch (parseErr) {
          console.warn('Gemini response JSON parsing issue:', parseErr);
        }
      }
    }

    // High-quality deterministic fallback if GEMINI_API_KEY is not set or transiently offline
    const isGood = aqiValue <= 50;
    const isModerate = aqiValue > 50 && aqiValue <= 100;
    const isUnhealthySensitive = aqiValue > 100 && aqiValue <= 150;
    const isUnhealthy = aqiValue > 150;

    let fallbackData;
    if (isGood) {
      fallbackData = {
        headline: `Clean, pristine atmospheric conditions across ${locationName} (AQI ${aqiValue}).`,
        aiSummary: `Air dispersion indices indicate low concentrations of fine particulate matter. Favorable atmospheric circulation in ${locationName} makes this an optimal window for high-exertion outdoor activities and natural building aeration.`,
        outdoorAdvice: `Ideal conditions for all outdoor sports, running, cycling, and school sports. Zero respiratory risk for general population.`,
        indoorAdvice: `Maximize cross-ventilation by opening windows during peak daytime hours to flush out indoor CO2 and VOCs.`,
        commuteAdvice: `Take advantage of clean air by walking, biking, or choosing active micromobility options.`,
        actionRecommendation: `Commit to a zero-idling pledge at school pickups and commercial loading zones to preserve this clean baseline.`,
        keyPollutantInsight: `Particulate levels (${dominantPollutant.toUpperCase()}) are well below WHO annual target thresholds.`,
        urgencyTier: 'optimal'
      };
    } else if (isModerate) {
      fallbackData = {
        headline: `Moderate air quality in ${locationName} (AQI ${aqiValue}). Acceptable for most, mild caution for sensitive groups.`,
        aiSummary: `Urban commuter corridors and localized particulate buildup have elevated ${dominantPollutant.toUpperCase()} slightly. While the general public can enjoy normal activities, individuals with asthma or COPD should monitor their breathing.`,
        outdoorAdvice: `Outdoor recreation is generally safe; unusually sensitive individuals should take frequent breaks during prolonged exertion.`,
        indoorAdvice: `Ventilate living spaces during mid-day when traffic rush hours have subsided. Keep HVAC filters clean.`,
        commuteAdvice: `Opt for public transit or rail to prevent adding vehicular combustion particles to urban street canyons.`,
        actionRecommendation: `Practice smooth acceleration, eliminate unnecessary vehicle idling, and bundle errands into single trips.`,
        keyPollutantInsight: `${dominantPollutant.toUpperCase()} is the primary driver; concentrations remain within moderate regulatory bounds.`,
        urgencyTier: 'moderate'
      };
    } else if (isUnhealthySensitive) {
      fallbackData = {
        headline: `Elevated particulate levels in ${locationName} (AQI ${aqiValue}). Sensitive groups should limit prolonged exertion.`,
        aiSummary: `Stagnant atmospheric conditions and regional emissions are trapping ${dominantPollutant.toUpperCase()} in the lower boundary layer. Sensitive residents will experience respiratory irritation without protective measures.`,
        outdoorAdvice: `Children, active adults with asthma, and seniors should reduce outdoor exertion and reschedule intense cardio workouts indoors.`,
        indoorAdvice: `Close windows facing busy thoroughfares. Run HEPA air cleaners or set HVAC to recirculation mode.`,
        commuteAdvice: `Avoid active roadside walking/cycling near major highway corridors; choose sealed transit or filtered cabin transport.`,
        actionRecommendation: `Do not use wood-burning stoves, leaf blowers, or aerosol sprays today; report high-emission industrial idling.`,
        keyPollutantInsight: `Fine particulate ${dominantPollutant.toUpperCase()} penetrates deep into lung tissue; proactive filtration is strongly advised.`,
        urgencyTier: 'elevated'
      };
    } else {
      fallbackData = {
        headline: `High pollution alert for ${locationName} (AQI ${aqiValue}). Community-wide health alert in effect.`,
        aiSummary: `Severe particulate accumulation is exceeding safe thresholds across ${locationName}. Ground-level stagnation requires immediate protective protocol for all residents to minimize cardiovascular and respiratory strain.`,
        outdoorAdvice: `Everyone should avoid prolonged or heavy exertion outdoors. Sensitive individuals should remain indoors in clean-air spaces.`,
        indoorAdvice: `Keep all windows firmly sealed. Operate portable HEPA filtration at maximum setting in primary bedrooms and work spaces.`,
        commuteAdvice: `Wear well-fitted N95/FFP2 respirators if walking outdoors; utilize filtered vehicles and avoid opening windows.`,
        actionRecommendation: `Cease all open combustion and non-essential vehicle trips. Coordinate with community clean air cooling centers.`,
        keyPollutantInsight: `Severe ${dominantPollutant.toUpperCase()} levels present acute respiratory irritation; follow local municipal health alerts.`,
        urgencyTier: 'hazardous'
      };
    }

    return res.json({
      success: true,
      source: 'Clean Air Intelligence Engine (GCP Standard)',
      data: fallbackData
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate recommendations' 
    });
  }
});

// -----------------------------------------------------------------------------
// POST /api/gemini/analyze-pledge
// Generates intelligent AI action milestone analysis for community pledges
// -----------------------------------------------------------------------------
app.post('/api/gemini/analyze-pledge', async (req, res) => {
  try {
    const { 
      name = 'Community Member', 
      category = 'Mobility', 
      pledgeText = '', 
      impactTier = 'High Impact', 
      locationName = 'Local Area' 
    } = req.body;

    const ai = getGeminiClient();

    if (ai && pledgeText) {
      const prompt = `
Participant Name: ${name}
Location: ${locationName}
Action Category: ${category}
Impact Tier: ${impactTier}
Pledge Commitment: "${pledgeText}"

Generate a short 1-sentence impact analysis and 3 specific sequential steps (Step 1 Today, Step 2 This Week, Step 3 Month 1+) for this participant to turn this pledge into real community clean air action.
Return JSON:
{
  "analysis": "1 concise sentence evaluating the emissions impact",
  "step1": "Immediate 24-hour action step",
  "step2": "Neighborhood / workplace activation step for this week",
  "step3": "Long-term community or policy advocacy step for month 1+"
}
`;
      const aiResult = await generateContentWithFallback(
        ai,
        prompt,
        'You are an environmental science AI advisor. Output raw JSON only.',
        'application/json'
      );

      if (aiResult && aiResult.text) {
        try {
          const parsed = JSON.parse(aiResult.text);
          return res.json({
            success: true,
            source: `Google Gemini AI (${aiResult.modelUsed})`,
            data: parsed
          });
        } catch (e) {
          console.warn('Pledge analysis JSON parse issue:', e);
        }
      }
    }

    return res.json({
      success: true,
      source: 'Clean Air Pledge Engine',
      data: {
        analysis: `Pledge in ${category} will directly mitigate localized particulate pollution in ${locationName}.`,
        step1: 'Establish your personal zero-emissions habit and setup anti-idling routines.',
        step2: 'Share your clean air commitment with neighbors, colleagues, and school groups.',
        step3: 'Advocate for expanded clean transit corridors and hyper-local air quality sensors.'
      }
    });
  } catch (error) {
    console.error('Error analyzing pledge:', error);
    return res.status(500).json({ success: false, error: 'Failed to analyze pledge' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
