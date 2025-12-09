import { GoogleGenAI, Schema, Type } from "@google/genai";

// -- Shared Types (Duplicated here for serverless isolation) --
interface Criterion {
  id: string;
  label: string;
  type: 'forbidden' | 'desired';
  strictness?: 'Low' | 'Medium' | 'High';
}

// -- SECURE CREDENTIAL CONFIG --
// The secret key must be provided via environment variable and MUST NOT
// have a hard-coded default. Falling back to a literal value here would
// allow attackers or other apps to discover a usable credential.
const APP_SECRET_KEY = process.env.TALC_API_KEY || '';

// Control which origins are allowed to access this function from browsers.
// Provide a comma-separated list in TALC_ALLOWED_ORIGINS. If unset, we
// default to an empty list (deny-by-default) to avoid accidental wide-open CORS.
const ALLOWED_ORIGINS = (process.env.TALC_ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export default async (req: Request, context: any) => {
  // 1. Handle CORS Preflight.
  // To avoid letting all origins access the endpoint, we echo back only
  // allowed origins. If no allowed origins are configured, respond with
  // a 403 so browser-based cross-origin requests will not succeed.
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    const allowed = ALLOWED_ORIGINS.length === 0 ? false : ALLOWED_ORIGINS.includes(origin);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'CORS origin not allowed' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type, x-talc-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  // 2. Method Check
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // 3. Security Check (API Key Validation)
  // Reject if the server hasn't been configured with a secret. This
  // prevents accidental use of a baked-in default key.
  if (!APP_SECRET_KEY) {
    console.error('Server config error: TALC_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Server Configuration Error: TALC_API_KEY is missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const clientKey = req.headers.get('x-talc-api-key');
  if (clientKey !== APP_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // 4. Parse Body
    const body = await req.json();
    const { imageBase64, mimeType, criteria } = body;

    if (!imageBase64 || !criteria) {
      return new Response(JSON.stringify({ error: "Bad Request: Missing 'imageBase64' or 'criteria'" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 5. Initialize Gemini
    // Support both API_KEY and GEMINI_API_KEY env names so local .env/.env.local works
    const googleApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!googleApiKey) {
      return new Response(JSON.stringify({ error: "Server Configuration Error: Google API Key missing" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ai = new GoogleGenAI({ apiKey: googleApiKey });

    // 6. Construct Dynamic Prompt based on provided criteria
    const forbidden = (criteria as Criterion[]).filter(c => c.type === 'forbidden');
    const desired = (criteria as Criterion[]).filter(c => c.type === 'desired');

    const promptText = `
      Act as a professional photo screener for a child education organization (TALC).
      Your task is to analyze the provided image to see if it meets quality standards.

      Strictly evaluate the image based on the following FORBIDDEN criteria.
      If ANY of these are met based on their strictness level, you MUST Reject the photo.
      
      FORBIDDEN CRITERIA (Reject if present):
      ${forbidden.map(c => `- ${c.label} (Strictness Level: ${c.strictness || 'Medium'})`).join('\n')}

      DESIRED CRITERIA (Good to have, but not mandatory):
      ${desired.map(c => `- ${c.label}`).join('\n')}

      Guidelines for Strictness:
      - Low: Only flag if the issue is severe and obvious.
      - Medium: Flag if the issue is noticeable.
      - High: Flag even minor occurrences.

      Return a JSON object indicating PASS or FAIL with reasons.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: ["PASS", "FAIL"],
          description: "The final verdict.",
        },
        reasons: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of reasons for failure. If PASS, this can be empty or contain minor warnings.",
        },
        feedback: {
          type: Type.STRING,
          description: "A short, helpful tip for the photographer based on the analysis.",
        },
      },
      required: ["status", "reasons", "feedback"],
    };

    // 7. Call Gemini API
    // Try 'gemini-1.5-flash' first (preferred). If the model is unavailable or not
    // supported for this method in the current API, automatically try a few
    // fallbacks so the function remains usable in multiple environments.
    const modelCandidates = [
      'gemini-1.5-flash',
      'gemini-1.5',
      // Some deployments / SDK versions might expose different names; include
      // fallback textual models so the function can still respond.
      'gemini-1.0',
      'text-bison@001'
    ];

    let response: any | null = null;
    let lastErr: any = null;

    for (const modelName of modelCandidates) {
      try {
        // Attempt to generate with the candidate model
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            role: 'user',
            parts: [
              { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
              { text: promptText }
            ]
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema
          }
        });

        // If we got a result, stop trying candidates
        if (response && response.text) {
          console.info(`Used model: ${modelName}`);
          break;
        }

      } catch (err) {
        // If the model is not found / not supported, keep trying the next
        // candidate. Save the last error to report if no candidate works.
        lastErr = err;
        console.warn(`Model ${modelName} failed: ${err && err.message ? err.message : String(err)}`);
      }
    }

    if (!response || !response.text) {
      // Nothing worked — return a helpful error that includes any last error
      console.error('All model candidates failed', lastErr);
      return new Response(JSON.stringify({ error: lastErr ? String(lastErr) : 'No model available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");

    // 8. Return Result
    // Only return Access-Control-Allow-Origin for allowed origins. If the
    // request did not include an Origin header (server-to-server), we skip
    // CORS headers entirely.
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (origin && ALLOWED_ORIGINS.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;

    return new Response(text, { headers });

  } catch (error: any) {
    console.error("Function Execution Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};