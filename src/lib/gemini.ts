import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export function getGemini() {
  if (genAI) return genAI;

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "") {
    // We throw a descriptive error that will be caught by the service layers
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  genAI = new GoogleGenAI({ apiKey });
  return genAI;
}

export const GEMINI_MODEL = "gemini-3-flash-preview";
