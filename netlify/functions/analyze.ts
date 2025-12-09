import { GoogleGenAI, Schema, Type } from "@google/genai";

// -- Shared Types (Duplicated here for serverless isolation) --
interface Criterion {
  id: string;
  label: string;
  type: 'forbidden' | 'desired';
  strictness?: 'Low' | 'Medium' | 'High';
}

// -- SECURE CREDENTIAL CONFIG --
// In production, this should be in process.env.TALC_API_KEY
const APP_SECRET_KEY = process.env.TALC_API_KEY || 'TALC_API_KEY_SECURE_882910';

export default async (req: Request, context: any) => {
  // 1. Handle CORS Preflight (Allows external apps to access if needed)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, x-talc-api-key",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  // 2. Method Check
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // 3. Security Check (API Key Validation)
  const clientKey = req.headers.get("x-talc-api-key");
  if (clientKey !== APP_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid API Credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
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
    const googleApiKey = process.env.API_KEY;
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

    // 7. Call Gemini API (1.5 Flash for cost efficiency)
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        role: 'user',
        parts: [
          { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI model");

    // 8. Return Result
    return new Response(text, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Allow external access
      }
    });

  } catch (error: any) {
    console.error("Function Execution Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};