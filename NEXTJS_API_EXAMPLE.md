# Next.js Smart Search API Route Example

If you are using **Next.js (App Router)**, you can create a file at `app/api/search/analyze/route.ts`:

```typescript
import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  const { query } = await request.json();

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gemini Intent Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze search intent" }, { status: 500 });
  }
}
```

### How to use on the client:

```typescript
const response = await fetch('/api/search/analyze', {
  method: 'POST',
  body: JSON.stringify({ query: "earbuds under 100" })
});
const data = await response.json();
console.log(data); // { category: "Audio", maxPrice: 100, correctedQuery: "earbuds", tags: [...] }
```
