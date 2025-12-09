import { Criterion, AnalysisResult } from '../types';

// The endpoint for the Netlify Function
const API_ENDPOINT = '/.netlify/functions/analyze';

// NOTE: Do NOT commit secrets into frontend code. When this application
// runs in a browser, any injected key becomes public. Instead prefer one
// of the following:
// 1. Call a backend endpoint that stores the secret server-side (recommended).
// 2. Use a short-lived session token from an identity provider (Netlify Identity, OAuth, etc.).
// For local development you may provide a build-time variable VITE_TALC_API_KEY
// (but this will be visible in the client bundle and should not be used in production).
const API_KEY = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TALC_API_KEY
  ? (import.meta as any).env.VITE_TALC_API_KEY
  : '';

export const analyzePhoto = async (
  file: File,
  criteria: Criterion[]
): Promise<AnalysisResult> => {
  
  // 1. Convert File to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data:image/xyz;base64, prefix to get raw bytes
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 2. Call the Netlify Function
  // We pass the criteria dynamically so any UI changes are immediately reflected in the API prompt.
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['x-talc-api-key'] = API_KEY;

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        ...headers
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: file.type || 'image/jpeg',
        criteria: criteria
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis API Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    return result as AnalysisResult;

  } catch (error) {
    console.error("API Call Failed:", error);
    throw error;
  }
};