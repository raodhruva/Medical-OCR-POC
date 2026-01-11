import { useMemo, useRef, useState } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [error, setError] = useState("");

  const [aiText, setAiText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const canRunOcr = useMemo(
    () => !!imageFile && !isOcrRunning,
    [imageFile, isOcrRunning]
  );

  const canSummarize = useMemo(
    () => !!ocrText.trim() && !isSummarizing,
    [ocrText, isSummarizing]
  );

  function resetOutputs() {
    setError("");
    setProgress(0);
    setOcrText("");
    setAiText("");
  }

  function onPickFile(e) {
    const file = e.target.files?.[0];
    resetOutputs();

    if (!file) {
      setImageFile(null);
      setImageUrl("");
      return;
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  }

  function onClear() {
    resetOutputs();
    setImageFile(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function runOcr() {
    if (!imageFile) return;

    setIsOcrRunning(true);
    setError("");
    setProgress(0);
    setOcrText("");
    setAiText("");

    try {
      const result = await Tesseract.recognize(imageFile, "eng", {
        logger: (m) => {
          if (typeof m.progress === "number") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const raw = result?.data?.text ?? "";

      const cleaned = raw
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
        .join("\n")
        .trim();

      setOcrText(cleaned || "(No text detected)");
    } catch (e) {
      setError(String(e));
    } finally {
      setIsOcrRunning(false);
    }
  }

  async function summarizeMedication() {
    if (!ocrText.trim()) return;

    setIsSummarizing(true);
    setError("");
    setAiText("");

    try {
      const resp = await fetch("http://localhost:5055/api/summarize-med", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || data.details || "Summarize failed");

      setAiText(data.text || "(No response)");
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSummarizing(false);
    }
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,0.12), transparent 60%)," +
        "radial-gradient(900px 500px at 90% 20%, rgba(16,185,129,0.10), transparent 55%)," +
        "linear-gradient(180deg, #fafafa, #f5f7fb)",
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      color: "#0f172a",
    },
    container: {
      padding: 20,
    },
    header: {
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.9)",
      borderRadius: 16,
      padding: 18,
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      marginBottom: 16,
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      flexWrap: "wrap",
      gap: 12,
    },
    title: {
      margin: 0,
      fontSize: 26,
    },
    subtitle: {
      marginTop: 6,
      color: "rgba(15,23,42,0.7)",
    },
    toolbar: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 14,
    },
    btn: {
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid rgba(15,23,42,0.12)",
      background: "white",
      cursor: "pointer",
      fontWeight: 600,
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
      color: "white",
    },
    btnSuccess: {
      background: "linear-gradient(135deg, #10b981, #059669)",
      color: "white",
    },
    btnDisabled: {
      opacity: 0.45,
      cursor: "not-allowed",
    },
    error: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      background: "rgba(254,242,242,0.9)",
      border: "1px solid rgba(239,68,68,0.25)",
      color: "#991b1b",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1.2fr",
      gap: 16,
    },
    card: {
      border: "1px solid rgba(15,23,42,0.08)",
      background: "rgba(255,255,255,0.9)",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      overflow: "hidden",
    },
    cardTitle: {
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "rgba(15,23,42,0.6)",
      marginBottom: 10,
    },
    preview: {
      flex: 1,
      border: "1px dashed rgba(15,23,42,0.2)",
      borderRadius: 12,
      display: "flex",
      alignItems: "flex-start",   // 🔑 top-align
      justifyContent: "center",
      padding: 10,
      overflow: "auto",
    },
    img: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    },
    textarea: {
      flex: 1,
      width: "100%",
      resize: "none",
      borderRadius: 12,
      border: "1px solid rgba(15,23,42,0.12)",
      padding: 12,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
      fontSize: 12.5,
      lineHeight: 1.5,

      boxSizing: "border-box",
      overflow: "auto",
      minWidth: 0,
    },
    output: {
      flex: 1,
      borderRadius: 12,
      border: "1px solid rgba(15,23,42,0.12)",
      padding: 12,
      whiteSpace: "pre-wrap",
      lineHeight: 1.55,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>Medical OCR + Medication Explainer</h1>
            <span>{isOcrRunning || isSummarizing ? "Working…" : "Ready"}</span>
          </div>
          <p style={styles.subtitle}>
            Upload a prescription image, extract text with OCR, then generate a
            patient-friendly explanation.
          </p>

          <div style={styles.toolbar}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
            />

            <button
              onClick={runOcr}
              disabled={!canRunOcr}
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...(canRunOcr ? {} : styles.btnDisabled),
              }}
            >
              Run OCR
            </button>

            <button
              onClick={summarizeMedication}
              disabled={!canSummarize}
              style={{
                ...styles.btn,
                ...styles.btnSuccess,
                ...(canSummarize ? {} : styles.btnDisabled),
              }}
            >
              Summarize
            </button>

            <button onClick={onClear} style={styles.btn}>
              Clear
            </button>

            {(isOcrRunning || isSummarizing) && <span>{progress}%</span>}
          </div>

          {error && <div style={styles.error}>{error}</div>}
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Image</div>
            <div style={styles.preview}>
              {imageUrl ? (
                <img src={imageUrl} alt="Prescription" style={styles.img} />
              ) : (
                <span>No image selected</span>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>OCR Text</div>
            <textarea
              value={ocrText}
              readOnly
              style={styles.textarea}
              placeholder="OCR text will appear here…"
            />
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Patient-friendly explanation</div>
            <div style={styles.output}>
              {isSummarizing
                ? "Summarizing…"
                : aiText || "Run OCR, then click Summarize."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}