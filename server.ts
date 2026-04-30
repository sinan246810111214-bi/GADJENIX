import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";

dotenv.config();

console.log("Starting initialization...");

let resend: any = null;
let ai: any = null;
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  try {
    console.log("Starting server function...");
    
    // Move all initializations inside try-catch to prevent startup crashes
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary configured.");

    try {
      if (process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
        console.log("Resend initialized.");
      } else {
        console.warn("WARNING: RESEND_API_KEY is missing. Email notifications will fail.");
      }
    } catch (e) {
      console.error("Resend initialization error:", e);
    }

    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("WARNING: NEXT_PUBLIC_GEMINI_API_KEY is missing in backend environment.");
    } else {
      console.log("Gemini API Key detected (First 4 chars):", geminiKey.substring(0, 4) + "...");
    }
    ai = new GoogleGenAI({ apiKey: geminiKey || "" });
    console.log("Gemini AI initialized.");

    const app = express();
    const PORT = 3000;

    app.use(express.json());

  // Smart Search API: Intent Analysis
  app.post("/api/search/analyze", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
      res.json(result);
    } catch (error) {
      console.error("Gemini Intent Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze search intent" });
    }
  });

  // Smart Search API: Suggestions
  app.get("/api/search/suggestions", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== "string") return res.json({ suggestions: [] });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
      res.json(result);
    } catch (error) {
      console.error("Gemini Suggestions Error:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // Chat Assistant API
  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({ error: "Messages are required" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: messages.map((m: any) => ({
          role: m.role,
          parts: [{ text: m.parts }]
        })),
        config: {
          systemInstruction: `You are the Gadgenix AI Assistant. Your goal is to help users find the best gadgets.
          
          Knowledge base: 
          - P9 Headset: Premium sound, 10h battery life, sleek design.
          - M19 Earbuds: Features a power bank case, LED display, price range around 800.
          
          Specific Rules:
          - If a user asks for a recommendation based on budget (e.g., 'earbuds under 1000'), suggest the M19.
          - Tone: Tech-savvy, friendly, and helpful.
          - Language: Use a mix of Malayalam and English (Manglish) for a local feel.
          - Always mention that we have a WhatsApp Support for bulk orders or tracking.
          
          Keep responses concise and engaging.`,
        },
      });

      res.json({ text: response.text || "Sorry, I couldn't process that." });
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Query Correction API
  app.post("/api/search/correct", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Correct the following misspelled tech gadget search query: "${query}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correctedQuery: { type: Type.STRING },
            },
            required: ["correctedQuery"],
          },
        },
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error) {
      console.error("Gemini Correction Error:", error);
      res.status(500).json({ error: "Failed to correct query" });
    }
  });

  // Admin API: Generate Product Features
  app.post("/api/admin/generate-features", async (req, res) => {
    const { name, category } = req.body;
    if (!name || !category) return res.status(400).json({ error: "Name and category are required" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
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
      res.json(result);
    } catch (error) {
      console.error("Gemini Feature Generation Error:", error);
      res.status(500).json({ error: "Failed to generate features" });
    }
  });

  // Image Upload API
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: "gadgenix_uploads",
        timeout: 60000 
      });

      res.json({ url: result.secure_url });
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      res.status(500).json({ error: "Image upload protocol failure" });
    }
  });

  // Order Notification API (Resend)
  app.post("/api/notify-order", async (req, res) => {
    const { orderData } = req.body;
    if (!orderData) return res.status(400).json({ error: "Order data is required" });

    try {
      const { customer, items, total } = orderData;
      
      if (!resend) {
        console.warn("Order notification requested but Resend client is not initialized.");
        return res.status(503).json({ error: "Email service currently unavailable." });
      }

      const itemsList = items.map((item: any) => 
        `<li>${item.name} x ${item.quantity} - ₹${item.price * item.quantity}</li>`
      ).join("");

      const { data, error } = await resend.emails.send({
        from: "Gadgenix Store <onboarding@resend.dev>",
        to: ["klgadjenix@gmail.com"],
        subject: `New Order Received: ₹${total}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
            <h1 style="color: #000; border-bottom: 3px solid #f97316; padding-bottom: 10px;">New Order Detected</h1>
            <div style="background: #f8fafc; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
              <h3 style="margin-top: 0; color: #f97316;">Customer Details:</h3>
              <p><strong>Name:</strong> ${customer.name}</p>
              <p><strong>Phone:</strong> ${customer.phone}</p>
              <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
            </div>

            <div style="background: #f8fafe; padding: 20px; border-radius: 15px; margin-bottom: 25px;">
              <h3 style="margin-top: 0; color: #3b82f6;">Logistic Coordinates:</h3>
              <p><strong>House/Bldg:</strong> ${customer.houseInfo}</p>
              <p><strong>Address:</strong> ${customer.address}</p>
              <p><strong>Landmark:</strong> ${customer.landmark || 'N/A'}</p>
              <p><strong>Pincode:</strong> ${customer.pincode}</p>
            </div>

            <div style="background: #fff7ed; padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 1px solid #fed7aa;">
              <h3 style="margin-top: 0; color: #ea580c;">Transaction Protocol:</h3>
              <p><strong>Method:</strong> ${customer.paymentMethod.toUpperCase()}</p>
              ${orderData.codFee > 0 ? `<p><strong>COD Processing Fee:</strong> ₹${orderData.codFee}</p>` : ''}
              <p><strong>Total Due:</strong> ₹${total}</p>
            </div>
            
            <h3 style="margin-top: 30px;">Items Registry:</h3>
            <ul style="list-style: none; padding: 0;">
              ${items.map((item: any) => `
                <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  ${item.name} <span style="color: #666;">x ${item.quantity}</span> 
                  <strong style="float: right;">₹${item.price * item.quantity}</strong>
                </li>
              `).join('')}
            </ul>
            
            <h2 style="margin-top: 20px; color: #f97316; text-align: right;">Total Amount: ₹${total}</h2>
            
            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666; text-align: center;">This is an automated notification from Gadgenix Command Center.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend Error:", error);
        return res.status(500).json({ error: "Failed to send email" });
      }

      res.json({ success: true, id: data?.id });
    } catch (error) {
      console.error("Order Notification Error:", error);
      res.status(500).json({ error: "Internal notification protocol failure" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (error) {
    console.error("CRITICAL: Server failed to start:", error);
  }
}

startServer();
