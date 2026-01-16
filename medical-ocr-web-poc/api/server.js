import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import vision from "@google-cloud/vision";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    // Optional: explicitly set apiVersion if you need (defaults vary)
    // httpOptions: { apiVersion: "v1" },
});

// Initialize Cloud Vision client
// Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
const visionClient = new vision.ImageAnnotatorClient();

app.post("/api/summarize-med", async (req, res) => {
    try {
        const ocrText = (req.body?.ocrText || "").trim();
        if (!ocrText) {
            return res.status(400).json({ error: "Missing ocrText" });
        }

        const prompt = `
    You are helping a patient understand a prescription.

    The following text comes from OCR of a handwritten or printed prescription.
    It may be messy or inaccurate.

    Write a clear, patient-friendly explanation that covers:
    - What medication(s) this appears to be
    - How the patient should take it (if stated)
    - What is unclear or should be confirmed with a pharmacist or doctor

    Do NOT invent details that are not present.
    Write in plain English for a non-medical audience.

    OCR TEXT:
    """${ocrText}"""
    `.trim();

        const resp = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text =
            resp?.text ||
            resp?.response?.text?.() ||
            "";

        return res.json({ text });
    } catch (err) {
        console.error("Gemini error:", err);
        return res.status(500).json({
            error: "Gemini call failed",
            details: String(err?.message || err),
        });
    }
});


// Cloud Vision OCR endpoint
app.post("/api/ocr/cloud-vision", async (req, res) => {
    try {
        const imageBase64 = req.body?.image;
        if (!imageBase64) {
            return res.status(400).json({ error: "Missing image (base64)" });
        }

        // Remove data URL prefix if present (e.g., "data:image/png;base64,")
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");

        const [result] = await visionClient.textDetection({
            image: { content: imageBuffer },
        });

        const detections = result.textAnnotations;
        const text = detections && detections.length > 0
            ? detections[0].description
            : "(No text detected)";

        return res.json({ text: text.trim() });
    } catch (err) {
        console.error("Cloud Vision error:", err);
        return res.status(500).json({
            error: "Cloud Vision OCR failed",
            details: String(err?.message || err),
        });
    }
});

const port = process.env.PORT || 5055;
app.listen(port, () => console.log(`API server on http://localhost:${port}`));
