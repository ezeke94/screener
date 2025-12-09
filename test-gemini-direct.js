import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyBY9tOQ8UFYprkOoSCHnCpV2efL_kDnGAs";

async function test() {
  console.log("Testing Gemini API with gemini-2.0-flash-lite...");
  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-2.0-flash";
    
    const promptText = "Analyze this image.";
    // Tiny 1x1 transparent PNG
    const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
    const mimeType = "image/png";



    console.log(`Attempting model: ${modelName}`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        role: 'user',
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: promptText }
        ]
      },
      config: {
        responseMimeType: 'application/json',
      }
    });

    console.log("Response received:");
    console.log(response.text);

  } catch (error) {
    console.error("Error details:", JSON.stringify(error, null, 2));
    console.error("Full error:", error);
  }
}

test();
