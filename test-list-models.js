import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyBY9tOQ8UFYprkOoSCHnCpV2efL_kDnGAs";

async function test() {
  console.log("Testing Gemini API...");
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    console.log("Listing models...");
    const response = await ai.models.list();
    console.log("Models response:", JSON.stringify(response, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }
}

test();
