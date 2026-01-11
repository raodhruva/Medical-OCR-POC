import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    // Optional: explicitly set apiVersion if you need (defaults vary)
    // httpOptions: { apiVersion: "v1" },
});

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


const port = process.env.PORT || 5055;
app.listen(port, () => console.log(`API server on http://localhost:${port}`));
