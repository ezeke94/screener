import { Criterion, AnalysisResult } from '../types';

// Use the secure server-side proxy endpoint.
// The proxy injects the API key server-side, so the frontend never touches secrets.
const API_ENDPOINT = '/.netlify/functions/proxy-analyze';

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

  // 2. Call the Netlify proxy function (no API key needed — it's injected server-side)
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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