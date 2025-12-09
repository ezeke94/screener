import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyBY9tOQ8UFYprkOoSCHnCpV2efL_kDnGAs";

async function test() {
  console.log("Testing Gemini API...");
  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-1.5-flash";
    
    console.log(`Using model: ${model}`);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        role: 'user',
        parts: [{ text: "Hello, are you working?" }]
      }
    });

    console.log("Response received:");
    console.log(response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
