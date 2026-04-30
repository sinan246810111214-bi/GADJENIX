import { Type } from "@google/genai";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini";

export async function getAssistantResponse(messages: any[]) {
  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: messages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.parts }]
      })),
      config: {
        systemInstruction: `You are a friendly and professional customer support AI for KL Gadjenix, an online tech gadget store. 
        Your job is to help customers find products like M19 earbuds, P9 headsets, and other accessories. 
        
        Knowledge base: 
        - P9 Headset: Premium sound, 10h battery life, sleek design.
        - M19 Earbuds: Features a power bank case, LED display, price range around 800.
        
        Specific Rules:
        - Answer questions politely and keep responses concise.
        - Guide customers to complete their purchase.
        - Language: Use a mix of Malayalam and English (Manglish) for a local feel as we are "KL Gadjenix".
        - Always mention that we have a WhatsApp Support for bulk orders or status tracking.
        
        Tone: Tech-savvy, friendly, and helpful.`,
      },
    });

    return response.text || "Sorry, I couldn't process that.";
  } catch (error: any) {
    if (error.message === "GEMINI_API_KEY_MISSING") {
      return "AI node offline: Gemini API Key not detected. Please configure key in System Settings.";
    }
    console.error("AI Chat Error:", error);
    return "Sorry, I'm having trouble connecting. WhatsApp support contact cheyyoo!";
  }
}

export async function getSearchSuggestions(q: string) {
  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Provide 5 search suggestions for a gadget store based on the partial query: "${q}". 
      Focus on headsets, earbuds, and smartwatches. Fix obvious typos.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["suggestions"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result.suggestions || [];
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
}

export async function analyzeSearchIntent(query: string) {
  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Analyze the following natural language search query for a gadget store: "${query}".
      Extract the intent: category (Audio, Wearables, Accessories), brand, maxPrice, and a cleaned correctedQuery (fix typos like 'hedset' to 'headset').
      Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ["Audio", "Wearables", "Accessories"] },
            brand: { type: Type.STRING },
            maxPrice: { type: Type.NUMBER },
            correctedQuery: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Relevant product tags like 'bass', 'noise-cancelling', 'waterproof'."
            }
          },
          required: ["correctedQuery"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("AI Intent Analysis Error:", error);
    return { correctedQuery: query, category: null };
  }
}

export async function generateProductFeatures(name: string, category: string) {
  try {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Generate 5 professional, tech-focused bullet points for a product named "${name}" in the "${category}" category. 
      Focus on key selling points, technical specs, and user benefits.
      Return as a single string with bullet points separated by newlines.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            features: { type: Type.STRING },
          },
          required: ["features"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result.features || "";
  } catch (error) {
    console.error("AI Feature Gen Error:", error);
    return "Failed to generate features.";
  }
}
