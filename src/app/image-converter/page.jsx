"use client";
import { useEffect, useRef, useState } from "react";

/*
 Final Image Converter (auto-convert on upload)
 - Same UI look & feel (no CSS theme changes)
 - Layout: Left = Upload/Image, Right = Converted (shows pixelated placeholder while converting)
 - Auto conversion when user uploads file
 - Pixelated blurry placeholder on right during processing
 - Pixel -> HD decode reveal animation when conversion completes
 - Auto-scroll to Download button and pulse it
*/

const FORMATS = [
  { key: "image/jpeg", label: "JPG", ext: "jpg", lossy: true, supportsAlpha: false, icon: "🖼️" },
  { key: "image/png", label: "PNG", ext: "png", lossy: false, supportsAlpha: true, icon: "🖼️" },
  { key: "image/webp", label: "WEBP", ext: "webp", lossy: true, supportsAlpha: true, icon: "🖼️" },
  { key: "image/avif", label: "AVIF", ext: "avif", lossy: true, supportsAlpha: true, icon: "🖼️" },
  { key: "image/svg+xml", label: "SVG", ext: "svg", lossy: false, supportsAlpha: true, icon: "📐" },
];

const fmtByMime = (mime) => FORMATS.find((f) => f.key === mime) || null;

// helper: canvas -> blob promise
const canvasToBlobAsync = (canvas, mime, quality) =>
  new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), mime, quality);
    } catch (e) {
      console.warn("canvas.toBlob error", e);
      resolve(null);
    }
  });

const blobToDataURL = (blob) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });

const loadImageFromSource = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = src;
  });

export default function ImageConverterAuto() {
  // formats and file state
  const [fromFormat, setFromFormat] = useState("image/png");
  const [toFormat, setToFormat] = useState("image/webp");
  const [fileName, setFileName] = useState("");
  const [origDataUrl, setOrigDataUrl] = useState(null);
  const [origMime, setOrigMime] = useState(null);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [convertedDataUrl, setConvertedDataUrl] = useState(null);

  // settings & UI
  const [quality, setQuality] = useState(0.9);
  const [maxDimension, setMaxDimension] = useState(0);
  const [preserveAlpha, setPreserveAlpha] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // placeholder & animation
  const [pixelPlaceholder, setPixelPlaceholder] = useState(null); // dataURL for pixelated placeholder
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const leftRef = useRef(null); // original image container (glow)
  const rightRef = useRef(null); // converted image container (reveal)
  const downloadBtnRef = useRef(null);

  // small wait util
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // read file & auto-start conversion
  const handleFile = (file) => {
    if (!file) return;
    setError("");
    setConvertedBlob(null);
    setConvertedDataUrl(null);
    setProcessing(false);
    setPixelPlaceholder(null);

    const name = file.name || `image.${file.type === "image/svg+xml" ? "svg" : "png"}`;
    setFileName(name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target.result;
      if (file.type === "image/svg+xml" || (typeof result === "string" && result.trim().startsWith("<svg"))) {
        const svgText = typeof result === "string" ? result : new TextDecoder().decode(result);
        const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
        setOrigDataUrl(url);
        setOrigMime("image/svg+xml");

        // generate pixel placeholder from svg by rendering into canvas then creating small scaled image
        try {
          const img = await loadImageFromSource(url);
          const placeholder = await makePixelPlaceholderFromImage(img, 32); // tiny pixel grid
          setPixelPlaceholder(placeholder);
        } catch (err) {
          // ignore placeholder
          console.warn("placeholder generation failed for svg", err);
        }

        // start conversion automatically
        startAutoConvert(url, "image/svg+xml");
      } else {
        // ArrayBuffer => blob => objectURL
        const blob = new Blob([e.target.result], { type: file.type || "image/*" });
        const url = URL.createObjectURL(blob);
        setOrigDataUrl(url);
        setOrigMime(file.type || "image/*");

        // create pixel placeholder by drawing small/resized canvas
        try {
          const img = await loadImageFromSource(url);
          const placeholder = await makePixelPlaceholderFromImage(img, 32);
          setPixelPlaceholder(placeholder);
        } catch (err) {
          console.warn("placeholder generation failed", err);
        }

        // start conversion automatically
        startAutoConvert(url, file.type || "image/*");
      }
    };

    // read accordingly
    if (file.type === "image/svg+xml") reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  };

  // create pixelated placeholder: draw image to small canvas and scale up (use image-rendering pixelated in CSS too)
  const makePixelPlaceholderFromImage = (img, pixelSize = 32) => {
    return new Promise((resolve) => {
      try {
        // small canvas at pixelSize (keeping aspect ratio)
        const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        let w = pixelSize;
        let h = Math.round(pixelSize / ratio);
        if (!h || h <= 0) h = pixelSize;

        const smallCanvas = document.createElement("canvas");
        smallCanvas.width = w;
        smallCanvas.height = h;
        const sctx = smallCanvas.getContext("2d");
        // draw scaled down image
        sctx.drawImage(img, 0, 0, w, h);

        // get data URL of small image
        const tinyData = smallCanvas.toDataURL("image/png");

        // create a scaled-up canvas to get an upscale image (we'll use CSS image-rendering: pixelated when displaying)
        const bigCanvas = document.createElement("canvas");
        // scale factor for preview size
        const scale = 8; // enlarge tiny image for visible pixelation
        bigCanvas.width = w * scale;
        bigCanvas.height = h * scale;
        const bctx = bigCanvas.getContext("2d");
        // disable smoothing so it looks pixelated when drawing
        bctx.imageSmoothingEnabled = false;
        const tmpImg = new Image();
        tmpImg.onload = () => {
          bctx.drawImage(tmpImg, 0, 0, bigCanvas.width, bigCanvas.height);
          const dataUrl = bigCanvas.toDataURL("image/png");
          resolve(dataUrl);
        };
        tmpImg.src = tinyData;
      } catch (e) {
        console.warn("makePixelPlaceholderFromImage failed", e);
        resolve(null);
      }
    });
  };

  // start auto conversion (called from handleFile)
  const startAutoConvert = async (sourceDataUrl, sourceMime) => {
    setProcessing(true);
    setError("");

    // animation refs
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    const downloadBtn = downloadBtnRef.current;

    // clear classes
    leftEl?.classList.remove("anim-glow", "anim-flash");
    rightEl?.classList.remove("reveal-pixel-decode");
    downloadBtn?.classList.remove("pulse-download");

    // add small delay so placeholder appears
    await wait(80);

    // Start glow pulses on left (non-blocking)
    if (leftEl) leftEl.classList.add("anim-glow");

    // Show placeholder on right (we already set pixelPlaceholder)
    // (UI will display pixelPlaceholder while processing)

    // Do actual conversion in background
    const convertPromise = (async () => {
      try {
        const targetMime = toFormat;
        const targetFmt = fmtByMime(targetMime);
        if (!targetFmt) {
          setError("Unsupported target format.");
          return;
        }

        // If target is SVG and original is SVG, pass-through
        if (targetMime === "image/svg+xml") {
          if (sourceMime === "image/svg+xml" && sourceDataUrl.startsWith("data:image/svg+xml")) {
            const commaIdx = sourceDataUrl.indexOf(",");
            const payload = sourceDataUrl.slice(commaIdx + 1);
            const svgText = decodeURIComponent(payload);
            const blob = new Blob([svgText], { type: "image/svg+xml" });
            setConvertedBlob(blob);
            setConvertedDataUrl(URL.createObjectURL(blob));
            return;
          }
          // raster embed into SVG
          let embedData = sourceDataUrl;
          if (sourceDataUrl.startsWith("blob:")) {
            const r = await fetch(sourceDataUrl);
            const b = await r.blob();
            embedData = await blobToDataURL(b);
          }
          // determine size
          let width = 800, height = 600;
          try {
            const img = await loadImageFromSource(embedData);
            width = img.naturalWidth || img.width || width;
            height = img.naturalHeight || img.height || height;
          } catch (e) {}
          const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><image href="${embedData}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>`;
          const blob = new Blob([svgText], { type: "image/svg+xml" });
          setConvertedBlob(blob);
          setConvertedDataUrl(URL.createObjectURL(blob));
          return;
        }

        // Raster conversion
        const img = await loadImageFromSource(sourceDataUrl);

        let outW = img.naturalWidth || img.width;
        let outH = img.naturalHeight || img.height;
        if (maxDimension > 0) {
          const ratio = Math.min(1, maxDimension / Math.max(outW, outH));
          outW = Math.round(outW * ratio);
          outH = Math.round(outH * ratio);
        }

        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d", { alpha: preserveAlpha });

        const supportsAlpha = fmtByMime(toFormat)?.supportsAlpha ?? true;
        if (!preserveAlpha && !supportsAlpha) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, outW, outH);
        } else {
          ctx.clearRect(0, 0, outW, outH);
        }

        ctx.drawImage(img, 0, 0, outW, outH);

        // convert to blob
        const q = Math.max(0.01, Math.min(1, quality));
        const blob = await canvasToBlobAsync(canvas, toFormat, q);
        if (!blob) {
          // fallback to PNG
          const fallback = await canvasToBlobAsync(canvas, "image/png", 1);
          setConvertedBlob(fallback);
          setConvertedDataUrl(URL.createObjectURL(fallback));
          setError(`Conversion to ${fmtByMime(toFormat)?.label} not supported — PNG fallback applied.`);
          return;
        }

        setConvertedBlob(blob);
        setConvertedDataUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error(e);
        setError(e.message || "Conversion failed.");
      }
    })();

    // Simulate processing flow with synchronized animation:
    // 1) left anim-glow pulses (CSS anim count 3) ~2100ms
    // 2) right shows pixelPlaceholder with heavy blur
    // 3) when conversion done, run pixel->HD decode reveal:
    //    - step1: keep pixelPlaceholder visible
    //    - step2: swap to convertedDataUrl and run reveal animation (reveal-pixel-decode)
    // We'll wait for a minimum visible time so animation feels consistent even for fast conversions.

    const minProcessingMs = 1200; // ensure user sees placeholder
    const startTs = performance.now();

    // ensure pixelPlaceholder is present before continuing
    // (we already created it earlier)
    // Wait for either conversion to finish or minProcessingMs
    await Promise.all([convertPromise, wait(minProcessingMs)]);

    // At this point, convertedDataUrl may or may not be ready. If not ready, wait until conversion completes.
    const convertTimeout = 8000; // safety cap: 8s
    const deadline = performance.now() + convertTimeout;
    while (!convertedDataUrl && performance.now() < deadline) {
      // small wait
      // This loop prevents reveal until conversion finishes.
      // It keeps left glow anim running.
      // After conversion finishes we break and reveal.
      await wait(120);
    }

    // Stop left glow (it has finished its CSS pulses usually)
    leftEl?.classList.remove("anim-glow");

    // Pixel -> HD decode reveal:
    // If we have a pixelPlaceholder, show it first (UI should already show it).
    // Then when convertedDataUrl exists, perform reveal animation:
    if (rightEl) {
      // add a class to show pixel->decode effect
      // 'reveal-pixel-decode' will animate blur -> sharpen + slight scale and glow.
      rightEl.classList.add("reveal-pixel-decode");

      // Keep the class for a moment while replacing the img src to convertedDataUrl
      // We do a small timing sequence:
      await wait(150); // let early part of animation run
      // Now set converted src (component will display convertedDataUrl)
      // (convertedDataUrl set by conversionPromise)
      // Wait a bit for the animation to play out
      await wait(500);
      // remove the class after animation ends so it can re-trigger later
      setTimeout(() => {
        rightEl && rightEl.classList.remove("reveal-pixel-decode");
      }, 900);
    }

    // Auto-scroll to download button and pulse it
    if (downloadBtnRef.current) {
      downloadBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        downloadBtnRef.current.classList.add("pulse-download");
        setTimeout(() => {
          downloadBtnRef.current && downloadBtnRef.current.classList.remove("pulse-download");
        }, 3000);
      }, 500);
    }

    setProcessing(false);
  };

  // handle file input change (calls handleFile for first file)
  const onFileInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  // drag/drop global listeners
  useEffect(() => {
    const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
    const onDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
    const onDrop = (e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  // download converted
  const downloadConverted = () => {
    if (!convertedBlob) return;
    const ext = fmtByMime(toFormat)?.ext || "img";
    const outName = fileName ? `${fileName.replace(/\.[^.]+$/, "")}.${ext}` : `converted.${ext}`;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // copy converted data url
  const copyConvertedDataUrl = async () => {
    try {
      if (!convertedBlob) return;
      const dataUrl = await blobToDataURL(convertedBlob);
      await navigator.clipboard.writeText(dataUrl);
      alert("Data URL copied to clipboard.");
    } catch (e) {
      setError("Copy failed.");
    }
  };

  // utility for file size label
  const getFileSize = (blob) => {
    if (!blob) return "0 KB";
    const sizeInKB = blob.size / 1024;
    return sizeInKB < 1024 ? `${sizeInKB.toFixed(1)} KB` : `${(sizeInKB / 1024).toFixed(1)} MB`;
  };

  // CSS animations (no theme changes)
  const animationStyles = `
  @keyframes glowPulse {
    0% { box-shadow: 0 0 0px rgba(34,211,238,0.0); transform: scale(1); }
    20% { box-shadow: 0 0 18px rgba(34,211,238,0.25); transform: scale(1.01); }
    50% { box-shadow: 0 0 28px rgba(236,72,153,0.28); transform: scale(1.02); }
    100% { box-shadow: 0 0 0px rgba(34,211,238,0.0); transform: scale(1); }
  }
  .anim-glow {
    animation-name: glowPulse;
    animation-duration: 700ms;
    animation-iteration-count: 3;
    animation-timing-function: ease-in-out;
    position: relative;
    z-index: 5;
  }
  .anim-flash::after {
    content: "";
    position: absolute;
    inset: 0;
    background: white;
    opacity: 0.12;
    animation: flashIt 220ms ease-in-out;
    pointer-events: none;
    z-index: 10;
  }
  @keyframes flashIt {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }

  /* Pixel -> HD decode reveal animation */
  .reveal-pixel-decode {
    position: relative;
    animation: decodeReveal 900ms cubic-bezier(.2,.9,.2,1) forwards;
    /* this animation will animate filter blur -> none and scale from 0.995 -> 1 */
  }
  @keyframes decodeReveal {
    0% { filter: blur(10px) saturate(0.6) contrast(0.9); transform: scale(0.995); opacity: 0.0; }
    30% { filter: blur(6px) saturate(0.8) contrast(0.95); transform: scale(0.998); opacity: 0.6; }
    60% { filter: blur(2px) saturate(1.05) contrast(1.02); transform: scale(1.003); opacity: 1; }
    100% { filter: none; transform: scale(1); opacity: 1; }
  }

  /* pulse download */
  .pulse-download {
    animation: pulseGlow 1200ms ease-in-out infinite;
  }
  @keyframes pulseGlow {
    0% { box-shadow: 0 0 0 rgba(34,211,238,0.0); transform: translateY(0); }
    40% { box-shadow: 0 0 24px rgba(34,211,238,0.22); transform: translateY(-4px); }
    100% { box-shadow: 0 0 0 rgba(34,211,238,0.0); transform: translateY(0); }
  }

  /* Pixelated placeholder image style */
  .pixelated {
    image-rendering: pixelated;
    /* for good measure */
    -ms-interpolation-mode: nearest-neighbor;
    image-rendering: crisp-edges;
  }

  /* processing overlay skeleton on right while conversion pending */
  .processing-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.25);
    backdrop-filter: blur(2px);
  }

  /* subtle shimmer for the placeholder text */
  .shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%);
    animation: shimmer 1200ms linear infinite;
    padding: 8px 12px;
    border-radius: 8px;
    color: #cbd5e1;
    font-size: 13px;
  }
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: 200px 0; }
  }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f0f10] to-black text-white">
      <style>{animationStyles}</style>

      <div className="mx-auto bg-gray-800/30 backdrop-blur-xl border border-white/10  overflow-hidden ">
        {/* Header */}
        <div className="md:px-6 px-2 py-4 border-b border-white/10 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse" />
            <div>
              <h1 className="md:text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Image Converter</h1>
              <p className="text-[10px] text-gray-400">Choose settings → upload image → conversion starts automatically</p>
            </div>
          </div>
        </div>

        {/* MAIN: Settings (top) */}
        <div className="md:p-6 p-2">
          <div className="grid grid-cols-1 lg:grid-cols-4 md:gap-6 gap-2 mb-6 md:px-6 px-2">
            <div>
              <label className="text-xs text-gray-300 uppercase">Input Format</label>
              <select value={fromFormat} onChange={(e) => setFromFormat(e.target.value)} className="mt-2 w-full bg-gray-900/40 border border-gray-600 rounded-lg p-3 text-gray-200">
                {FORMATS.map((f) => <option key={f.key} value={f.key}>{f.icon} {f.label}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-2">Actual input type is detected from the file.</div>
            </div>

            <div>
              <label className="text-xs text-gray-300 uppercase">Output Format</label>
              <select value={toFormat} onChange={(e) => setToFormat(e.target.value)} className="mt-2 w-full bg-gray-900/40 border border-gray-600 rounded-lg p-3 text-gray-200">
                {FORMATS.map((f) => <option key={f.key} value={f.key}>{f.icon} {f.label}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-2">Choose format to convert to.</div>
            </div>

            <div>
              <label className="text-xs text-gray-300 uppercase">Quality: {Math.round(quality * 100)}%</label>
              <input type="range" min="0.1" max="1" step="0.01" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full mt-2" />
            </div>

            <div>
              <div className="text-xs text-gray-300 uppercase">Resize / Transparency</div>
              <div className="mt-2">
                <div className="text-xs text-gray-400 mb-1">Max dimension (px)</div>
                <input type="number" min="0" value={maxDimension} onChange={(e) => setMaxDimension(Number(e.target.value))} className="w-full bg-gray-900/40 border border-gray-600 rounded-lg p-2 text-gray-200" placeholder="0 = keep original" />
                <div className="flex items-center gap-2 mt-3">
                  <input id="preserveAlpha" type="checkbox" checked={preserveAlpha} onChange={(e) => setPreserveAlpha(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                  <label htmlFor="preserveAlpha" className="text-xs text-gray-300">Preserve transparency</label>
                </div>
              </div>
            </div>
          </div>

          {/* LEFT / RIGHT boxes (upload left, converted right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
            {/* LEFT: Upload box (replaces dropzone with image after upload) */}
            <div className="bg-gray-900/20 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-200">Upload</h3>
                {fileName && <div className="text-xs text-gray-400 px-2 py-1 rounded-full bg-gray-800/50">{fileName}</div>}
              </div>

              <div className={`border-2 rounded-lg p-4 bg-black/20 min-h-[300px] flex items-center justify-center relative ${dragActive ? "border-emerald-500 bg-emerald-500/6" : "border-gray-600"}`}>
                <div ref={leftRef} className="w-full h-full flex items-center justify-center">
                  {origDataUrl ? (
                    <img src={origDataUrl} alt="original" className="max-h-64 object-contain rounded" />
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📁</div>
                      <div>Drop an image here or click Upload</div>
                      <div className="text-sm mt-2 text-gray-400">Supported: JPG, PNG, WEBP, AVIF, SVG</div>
                    </div>
                  )}
                </div>

                {/* hidden file input */}
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.avif,.svg" onChange={onFileInputChange} className="hidden" />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500">Upload Image</button>
                <div className="text-xs text-gray-400">Uploads auto-start conversion</div>
              </div>
            </div>

            {/* RIGHT: Converted preview box */}
            <div className="bg-gray-900/20 rounded-xl p-6 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-200">Converted</h3>
                {convertedBlob && <div className="text-xs text-gray-400 px-2 py-1 rounded-full bg-gray-800/50">{getFileSize(convertedBlob)}</div>}
              </div>

              <div className="border-2 rounded-lg p-4 bg-black/20 min-h-[300px] flex items-center justify-center relative">
                {/* processing overlay */}
                {(processing && (pixelPlaceholder || !convertedDataUrl)) && (
                  <div className="processing-overlay">
                    <div className="flex flex-col items-center gap-3">
                      {/* pixel placeholder or shimmer */}
                      {pixelPlaceholder ? (
                        <img src={pixelPlaceholder} alt="processing-pixel" className="pixelated max-h-40 object-contain rounded shadow-sm" style={{ filter: "blur(2px)" }} />
                      ) : (
                        <div className="shimmer">Processing image…</div>
                      )}
                      <div className="text-xs text-gray-300">Converting — please wait</div>
                    </div>
                  </div>
                )}

                <div ref={rightRef} className="w-full h-full flex items-center justify-center">
                  {/* Priority for showing convertedDataUrl -> convertedBlob -> pixelPlaceholder -> empty */}
                  {convertedDataUrl ? (
                    <img src={convertedDataUrl} alt="converted" className="max-h-64 object-contain rounded" />
                  ) : convertedBlob ? (
                    <img src={URL.createObjectURL(convertedBlob)} alt="converted" className="max-h-64 object-contain rounded" />
                  ) : pixelPlaceholder ? (
                    <img src={pixelPlaceholder} alt="placeholder" className="pixelated max-h-64 object-contain rounded" style={{ filter: "blur(3px)" }} />
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">✨</div>
                      <div>Converted image will appear here</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button ref={downloadBtnRef} onClick={downloadConverted} disabled={!convertedBlob} className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all ${convertedBlob ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-xl" : "bg-gray-600 cursor-not-allowed"}`}>
                  Download Converted
                </button>

                <button onClick={copyConvertedDataUrl} disabled={!convertedBlob} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                  Copy URL
                </button>
              </div>
            </div>
          </div>

          {/* hidden canvas for conversion + placeholder generation */}
          <div style={{ display: "none" }}>
            <canvas ref={canvasRef} />
          </div>

          {/* error */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                <div>{error}</div>
              </div>
            </div>
          )}
        </div>

     
      </div>
    </div>
  );
}
