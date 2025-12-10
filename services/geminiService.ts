import { Criterion, AnalysisResult } from '../types';

// Use the secure server-side proxy endpoint.
// The proxy injects the API key server-side, so the frontend never touches secrets.
const API_ENDPOINT = '/.netlify/functions/proxy-analyze';

// Helper: Compress and resize image to reduce API costs
const compressImage = async (file: File, maxDimension: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression (0.85 quality)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:image prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.85 // Quality: 85% (good balance of quality vs size)
      );
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const analyzePhoto = async (
  file: File,
  criteria: Criterion[]
): Promise<AnalysisResult> => {
  
  // 1. Compress and Convert File to Base64 (COST SAVING: reduces input tokens by 50-80%)
  const base64Data = await compressImage(file, 1024);

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