import { useMemo, useState } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [error, setError] = useState("");

  const canRun = useMemo(
    () => !!imageFile && !isOcrRunning,
    [imageFile, isOcrRunning]
  );

  function onPickFile(e) {
    const file = e.target.files?.[0];
    setError("");
    setOcrText("");
    setProgress(0);

    if (!file) {
      setImageFile(null);
      setImageUrl("");
      return;
    }

    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  }

  async function runOcr() {
    if (!imageFile) return;

    setIsOcrRunning(true);
    setError("");
    setOcrText("");
    setProgress(0);

    try {
      //const processedBlob = await preprocessToBlob(imageFile, { scale: 3.0, threshold: 170, contrast: 1.5 });
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

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <h1>Medical OCR Web POC</h1>
      <p>Upload an image → run OCR → see extracted text.</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input type="file" accept="image/*" onChange={onPickFile} />
        <button onClick={runOcr} disabled={!canRun}>
          {isOcrRunning ? `Running OCR… ${progress}%` : "Run OCR"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "red" }}>
          <b>Error:</b> {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        <div style={{ border: "1px solid #ccc", padding: 12 }}>
          <h3>Image Preview</h3>
          {imageUrl ? (
            <img src={imageUrl} style={{ width: "100%" }} />
          ) : (
            <p>No image selected</p>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: 12 }}>
          <h3>OCR Output</h3>
          <textarea
            value={ocrText}
            readOnly
            style={{ width: "100%", minHeight: 300 }}
            placeholder="OCR text will appear here..."
          />
        </div>
      </div>
    </div>
  );
}

/*
async function preprocessToBlob(file, { scale = 2.5, threshold = 160, contrast = 1.35 } = {}) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  // grayscale + contrast + threshold
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    let v = 0.299 * r + 0.587 * g + 0.114 * b;       // grayscale
    v = (v - 128) * contrast + 128;                  // contrast
    v = v >= threshold ? 255 : 0;                    // binarize
    d[i] = d[i + 1] = d[i + 2] = v;
  }

  ctx.putImageData(imageData, 0, 0);

  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

*/
