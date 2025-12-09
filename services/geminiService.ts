import { Criterion, AnalysisResult } from '../types';

// The endpoint for the Netlify Function
const API_ENDPOINT = '/.netlify/functions/analyze';

// SECURE CREDENTIALS (Hardcoded for internal app use)
// External apps should use this same key in the 'x-talc-api-key' header.
const API_KEY = 'TALC_API_KEY_SECURE_882910';

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
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-talc-api-key': API_KEY
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