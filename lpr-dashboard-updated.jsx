import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  Image,
  Video,
  Radio,
  History,
  MessageSquare,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Camera,
  ChevronDown,
  Search,
  Filter,
  Play,
  Pause,
  SkipForward,
  Flag,
  Send,
  Eye,
  ThumbsUp,
  Cpu,
  Activity,
  Shield,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Download,
  TrendingUp,
  Car,
  FileVideo,
  Layers,
  Loader,
} from "lucide-react";

// ─── CONFIGURATION ─────────────────────────────────────────────────────────────
const API_BASE_URL = "http://localhost:8000/api";

// ─── MOCK DATA (fallback if API unavailable) ─────────────────────────────────

const HISTORY_DATA = [
  {
    id: "SCN-001",
    timestamp: "2025-06-15 08:23:14",
    source: "Live Stream",
    thumbnail: null,
    plate: "30K-123.45",
    plateType: "1-line",
    confidence: 97.2,
    status: "success",
    vehicleColor: "#1a56db",
    make: "Toyota Camry",
  },
  {
    id: "SCN-002",
    timestamp: "2025-06-15 08:45:02",
    source: "Image Upload",
    thumbnail: null,
    plate: "51F-456.78",
    plateType: "1-line",
    confidence: 94.5,
    status: "success",
    vehicleColor: "#e3a008",
    make: "Honda CR-V",
  },
];

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

const confidenceColor = (score) => {
  if (score >= 90)
    return "text-emerald-400 bg-emerald-500/10 border-emerald-400/30";
  if (score >= 75) return "text-amber-400 bg-amber-500/10 border-amber-400/30";
  return "text-red-400 bg-red-500/10 border-red-400/30";
};

const confidenceDot = (score) => {
  if (score >= 90) return "bg-emerald-400";
  if (score >= 75) return "bg-amber-400";
  return "bg-red-400";
};

const statusBadge = (status) => {
  if (status === "success")
    return "text-emerald-400 bg-emerald-500/10 border border-emerald-400/20";
  if (status === "approved")
    return "text-sky-400 bg-sky-500/10 border border-sky-400/20";
  return "text-amber-400 bg-amber-500/10 border border-amber-400/20";
};

// Convert image to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });
};

// ─── PLATE DISPLAY COMPONENT ───────────────────────────────────────────────────

function PlateDisplay({ plate, size = "md" }) {
  const isTwo = plate.includes("\n");
  const parts = plate.split("\n");
  const baseClass =
    size === "lg"
      ? "font-mono font-bold tracking-widest text-lg"
      : "font-mono font-bold tracking-wider text-sm";
  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-500 rounded border-2 border-yellow-600 px-3 py-1 min-w-[80px] shadow-lg ${isTwo ? "flex-col gap-0 py-1.5" : ""}`}
    >
      {isTwo ? (
        <>
          <span className={`${baseClass} text-gray-950 leading-tight`}>
            {parts[0]}
          </span>
          <span className="w-full h-px bg-gray-800/40 my-0.5" />
          <span className={`${baseClass} text-gray-950 leading-tight`}>
            {parts[1]}
          </span>
        </>
      ) : (
        <span className={`${baseClass} text-gray-950`}>{plate}</span>
      )}
    </div>
  );
}

// ─── TOAST NOTIFICATION ────────────────────────────────────────────────────────

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-slide-up backdrop-blur-md
      ${
        type === "success"
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
          : type === "error"
            ? "bg-red-500/15 border-red-500/40 text-red-300"
            : "bg-amber-500/15 border-amber-500/40 text-amber-300"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={16} />
      ) : type === "error" ? (
        <AlertTriangle size={16} />
      ) : (
        <AlertTriangle size={16} />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// ─── LIVE STREAM CANVAS ────────────────────────────────────────────────────────

function LiveStreamCanvas({ isPlaying }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ scanY: 60, scanDir: 1, boxes: [], tick: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
      H = canvas.height;

    const mockBoxes = [
      {
        x: 80,
        y: 120,
        w: 220,
        h: 70,
        plate: "30K-123.45",
        conf: 97,
        active: false,
        alpha: 0,
      },
      {
        x: 360,
        y: 160,
        w: 180,
        h: 60,
        plate: "51F-456.78",
        conf: 91,
        active: false,
        alpha: 0,
      },
    ];
    stateRef.current.boxes = mockBoxes;

    const draw = () => {
      const s = stateRef.current;
      s.tick++;
      ctx.clearRect(0, 0, W, H);

      // Dark video background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0f0f15");
      grad.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid overlay
      ctx.strokeStyle = "rgba(34,197,94,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      if (!isPlaying) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(148,163,184,0.9)";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("⏸  STREAM PAUSED", W / 2, H / 2);
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      // Animated scan line
      s.scanY += s.scanDir * 2;
      if (s.scanY > H - 20) s.scanDir = -1;
      if (s.scanY < 20) s.scanDir = 1;
      const scanGrad = ctx.createLinearGradient(0, s.scanY - 8, 0, s.scanY + 8);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(34,197,94,0.8)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, s.scanY - 8, W, 16);

      // Detection boxes
      mockBoxes.forEach((box, i) => {
        const proximity = Math.abs(s.scanY - (box.y + box.h / 2));
        if (proximity < 60 && !box.active) box.active = true;
        if (box.active) box.alpha = Math.min(1, box.alpha + 0.05);

        if (box.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = box.alpha;
          const blink = Math.sin(s.tick * 0.1) > 0 ? 1 : 0.6;
          ctx.strokeStyle = `rgba(34,197,94,${blink})`;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 3]);
          ctx.strokeRect(box.x, box.y, box.w, box.h);

          // Corner marks
          const cs = 12;
          ctx.setLineDash([]);
          ctx.lineWidth = 3;
          [
            [box.x, box.y],
            [box.x + box.w, box.y],
            [box.x, box.y + box.h],
            [box.x + box.w, box.y + box.h],
          ].forEach(([cx, cy], ci) => {
            ctx.beginPath();
            ctx.moveTo(cx + (ci % 2 === 0 ? cs : -cs), cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy + (ci < 2 ? cs : -cs));
            ctx.stroke();
          });

          // Label
          ctx.fillStyle = "rgba(34,197,94,0.95)";
          ctx.fillRect(box.x, box.y - 22, 140, 20);
          ctx.fillStyle = "#0f0f15";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "left";
          ctx.fillText(`${box.plate}  ${box.conf}%`, box.x + 6, box.y - 7);
          ctx.restore();
        }
      });

      // HUD corners
      const hud = (x, y, dir) => {
        ctx.strokeStyle = "rgba(34,197,94,0.5)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x, y + dir * 20);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 20, y);
        ctx.stroke();
      };
      hud(10, 10, 1);
      hud(W - 10, 10, 1);
      hud(10, H - 10, -1);
      hud(W - 10, H - 10, -1);

      // Status text
      ctx.fillStyle = "rgba(34,197,94,0.8)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `● LIVE  ●  REC  ${new Date().toLocaleTimeString()}`,
        20,
        24,
      );
      ctx.textAlign = "right";
      ctx.fillText(`AI: YOLOv11 + CRNN  |  FPS: 30`, W - 20, 24);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={620}
      height={340}
      className="w-full rounded-2xl border border-white/5"
    />
  );
}

// ─── VIDEO SCAN CANVAS ────────────────────────────────────────────────────────

function VideoScanCanvas({
  progress,
  currentFrame,
  totalFrames,
  isProcessing,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
      H = canvas.height;
    let tick = 0;

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, W, H);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0f0f15");
      grad.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(168,85,247,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Road scene
      ctx.fillStyle = "#1c2333";
      ctx.fillRect(0, H * 0.55, W, H * 0.45);
      ctx.fillStyle = "#252d3d";
      const laneW = 40;
      for (let x = (-tick * 3) % 100; x < W + 100; x += 100) {
        ctx.fillRect(x, H * 0.72, 60, 8);
      }

      // Moving vehicles
      const carProgress = ((tick * 1.2 + progress * 500) % (W + 200)) - 100;
      [
        [0, "#1e3a5f", "#3b82f6"],
        [180, "#3d1a1a", "#ef4444"],
      ].forEach(([offset, body, roof]) => {
        const cx = ((carProgress + offset) % (W + 200)) - 100;
        const cy = H * 0.45;
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.roundRect(cx, cy, 140, 60, 6);
        ctx.fill();
        ctx.fillStyle = roof;
        ctx.beginPath();
        ctx.roundRect(cx + 15, cy - 28, 110, 32, 8);
        ctx.fill();

        // License plate on vehicle
        if (cx > 20 && cx < W - 160) {
          ctx.fillStyle = "#f5e642";
          ctx.fillRect(cx + 30, cy + 38, 80, 20);
          ctx.fillStyle = "#111";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText("30K-123.45", cx + 70, cy + 52);

          // Detection box during processing
          if (isProcessing && Math.sin(tick * 0.05) > 0.3) {
            ctx.save();
            const pulse = 0.6 + Math.sin(tick * 0.15) * 0.4;
            ctx.strokeStyle = `rgba(34,197,94,${pulse})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(cx + 20, cy - 32, 120, 96);
            ctx.setLineDash([]);
            ctx.strokeStyle = `rgba(34,197,94,${pulse})`;
            ctx.lineWidth = 3;
            [
              [cx + 20, cy - 32],
              [cx + 140, cy - 32],
              [cx + 20, cy + 64],
              [cx + 140, cy + 64],
            ].forEach(([ex, ey], ei) => {
              ctx.beginPath();
              ctx.moveTo(ex + (ei % 2 === 0 ? 10 : -10), ey);
              ctx.lineTo(ex, ey);
              ctx.lineTo(ex, ey + (ei < 2 ? 10 : -10));
              ctx.stroke();
            });
            ctx.fillStyle = `rgba(34,197,94,0.9)`;
            ctx.fillRect(cx + 20, cy - 52, 120, 18);
            ctx.fillStyle = "#000";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillText("30K-123.45  97%", cx + 80, cy - 39);
            ctx.restore();
          }
        }
      });

      // Progress bar
      if (isProcessing) {
        const barX = 20,
          barY = H - 30,
          barW = W - 40,
          barH = 6;
        ctx.fillStyle = "rgba(30,30,40,0.8)";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 3);
        ctx.fill();
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, "#a855f7");
        barGrad.addColorStop(1, "#ec4899");
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * progress, barH, 3);
        ctx.fill();

        ctx.fillStyle = "rgba(168,85,247,0.9)";
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`Frame ${currentFrame}/${totalFrames}`, barX, barY - 8);
        ctx.textAlign = "right";
        ctx.fillText(
          `${Math.round(progress * 100)}% analyzed`,
          barX + barW,
          barY - 8,
        );
      }

      // HUD
      ctx.fillStyle = "rgba(168,85,247,0.7)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("AI VIDEO ANALYSIS  ●  YOLOv11 + CRNN", 16, 18);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [progress, currentFrame, totalFrames, isProcessing]);

  return (
    <canvas
      ref={canvasRef}
      width={620}
      height={320}
      className="w-full rounded-2xl border border-white/5"
    />
  );
}

// ─── IMAGE SCAN MODULE ────────────────────────────────────────────────────────

function ImageScanModule() {
  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      scanImage(files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      scanImage(files[0]);
    }
  };

  const scanImage = async (file) => {
    setScanning(true);
    setResult(null);
    setError(null);
    setProgress(0);
    setSelectedFile(file);

    try {
      const base64 = await fileToBase64(file);

      // Simulate progress
      let p = 0;
      const progressInterval = setInterval(() => {
        p += Math.random() * 20 + 10;
        setProgress(Math.min(p, 90));
      }, 100);

      // Call API
      const response = await fetch(`${API_BASE_URL}/scan-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64,
          filename: file.name,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        setResult({
          plate: data.plate,
          confidence: data.confidence,
          time: data.processing_time_ms,
          plateType: "1-line",
          region: "Vietnam",
          bbox: data.bbox,
          originalImage: data.original_image_base64,
          croppedPlate: data.cropped_plate_base64,
        });
      } else {
        setError("No license plate detected in the image");
      }

      setScanning(false);
    } catch (err) {
      console.error("Error scanning image:", err);
      setError(err.message || "Failed to scan image. Please try again.");
      setScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm
          ${
            dragOver
              ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
              : "border-white/20 hover:border-emerald-400/50 hover:bg-white/[0.03]"
          }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-input"
        />
        <label htmlFor="image-input" className="cursor-pointer block">
          {scanning ? (
            <div className="space-y-3">
              <div className="w-12 h-12 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-300 text-sm font-medium">
                Analyzing image with YOLOv11 + CRNN...
              </p>
              <div className="w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs">
                {Math.round(progress)}% Complete
              </p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 hover:bg-emerald-500/15 transition-colors">
                <Upload size={24} className="text-emerald-400" />
              </div>
              <p className="text-slate-200 font-semibold mb-1">
                Drop vehicle image here
              </p>
              <p className="text-slate-500 text-sm">
                or click to select image · PNG, JPG, WebP
              </p>
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} />
            <span className="font-semibold">Error</span>
          </div>
          {error}
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Detection Result
            </p>
            <div
              className="relative bg-black rounded-xl overflow-hidden mb-4"
              style={{ aspectRatio: "16/9" }}
            >
              {result.originalImage && (
                <img
                  src={`data:image/jpeg;base64,${result.originalImage}`}
                  alt="Detected"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs text-slate-300 font-mono border border-white/10">
                {selectedFile?.name}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/10 px-3 py-2 flex-1">
                <p className="text-xs text-slate-500 mb-1">Cropped Plate</p>
                {result.croppedPlate && (
                  <img
                    src={`data:image/jpeg;base64,${result.croppedPlate}`}
                    alt="Cropped"
                    className="w-full h-auto rounded mb-2 border border-white/10"
                  />
                )}
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded px-2 py-1.5 inline-block border border-yellow-600">
                  <span className="font-mono font-bold text-gray-950 text-sm tracking-widest">
                    {result.plate}
                  </span>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/10 px-3 py-2">
                <p className="text-xs text-slate-500 mb-1">Type</p>
                <p className="text-xs font-medium text-slate-300">
                  {result.plateType}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Detected Plate",
                value: result.plate,
                accent: "emerald",
              },
              {
                label: "Confidence Score",
                value: `${result.confidence.toFixed(2)}%`,
                accent: "emerald",
              },
              {
                label: "Processing Time",
                value: `${result.time.toFixed(0)}ms`,
                accent: "sky",
              },
              {
                label: "Plate Type",
                value: result.plateType,
                accent: "violet",
              },
              { label: "Region", value: result.region, accent: "violet" },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm hover:border-white/20 transition-colors"
              >
                <span className="text-sm text-slate-400">{label}</span>
                <span
                  className={`text-sm font-semibold ${
                    accent === "emerald"
                      ? "text-emerald-400"
                      : accent === "sky"
                        ? "text-sky-400"
                        : "text-violet-400"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
            <button
              onClick={() => {
                setResult(null);
                setSelectedFile(null);
                setError(null);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
            >
              <RefreshCw size={14} /> Scan Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VIDEO SCAN MODULE ────────────────────────────────────────────────────────

function VideoScanModule() {
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const totalFrames = 450;
  const [discoveredPlates, setDiscoveredPlates] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      startProcessing();
    }
  };

  const startProcessing = async () => {
    setUploaded(true);
    setProcessing(true);
    setDiscoveredPlates([]);
    setProgress(0);
    setCurrentFrame(0);

    // Simulate video processing
    let frame = 0;
    const iv = setInterval(() => {
      frame += 6;
      setCurrentFrame(Math.min(frame, totalFrames));
      setProgress(Math.min(frame / totalFrames, 1));

      // Simulate plate detections
      if (frame === 90)
        setDiscoveredPlates((p) => [
          ...p,
          {
            id: 1,
            plate: "30K-123.45",
            timestamp: "00:03",
            frame: 90,
            confidence: 97.2,
          },
        ]);
      if (frame === 210)
        setDiscoveredPlates((p) => [
          ...p,
          {
            id: 2,
            plate: "51F-456.78",
            timestamp: "00:07",
            frame: 210,
            confidence: 94.1,
          },
        ]);
      if (frame === 360)
        setDiscoveredPlates((p) => [
          ...p,
          {
            id: 3,
            plate: "29A-789.01",
            timestamp: "00:12",
            frame: 360,
            confidence: 88.5,
          },
        ]);
      if (frame === 540)
        setDiscoveredPlates((p) => [
          ...p,
          {
            id: 4,
            plate: "43B-654.32",
            timestamp: "00:18",
            frame: 540,
            confidence: 92.7,
          },
        ]);
      if (frame === 720)
        setDiscoveredPlates((p) => [
          ...p,
          {
            id: 5,
            plate: "92H-321.00",
            timestamp: "00:24",
            frame: 720,
            confidence: 85.3,
          },
        ]);

      if (frame >= totalFrames) {
        clearInterval(iv);
        setProcessing(false);
        setDone(true);
      }
    }, 100);
  };

  return (
    <div className="space-y-5">
      {!uploaded ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={startProcessing}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm
            ${dragOver ? "border-purple-400 bg-purple-500/10" : "border-white/20 hover:border-purple-400/50 hover:bg-white/[0.03]"}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 hover:bg-purple-500/15 transition-colors">
            <FileVideo size={24} className="text-purple-400" />
          </div>
          <p className="text-slate-200 font-semibold mb-1">
            Drop video file here
          </p>
          <p className="text-slate-500 text-sm">
            or click to simulate processing · MP4, AVI, MOV
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <VideoScanCanvas
              progress={progress}
              currentFrame={Math.min(currentFrame, totalFrames)}
              totalFrames={totalFrames}
              isProcessing={processing}
            />

            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-2 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Cpu size={12} className="text-purple-400" />
                  {processing
                    ? `Analyzing: Frame ${currentFrame} / ${totalFrames}`
                    : "Analysis complete"}
                </span>
                <span className="font-mono text-purple-400">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              {done && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Processing complete —{" "}
                  {discoveredPlates.length} plates found
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Discovered Plates{" "}
              {discoveredPlates.length > 0 && (
                <span className="text-purple-400 ml-1">
                  ({discoveredPlates.length})
                </span>
              )}
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {discoveredPlates.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Scanning frames...</p>
                </div>
              )}
              {discoveredPlates.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg p-2.5 cursor-pointer transition-all group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <PlateDisplay plate={p.plate} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      @ {p.timestamp} · {p.confidence}%
                    </p>
                  </div>
                  <ChevronRight
                    size={12}
                    className="text-slate-600 group-hover:text-slate-400"
                  />
                </div>
              ))}
            </div>
            {done && (
              <button
                onClick={() => {
                  setUploaded(false);
                  setDone(false);
                  setDiscoveredPlates([]);
                }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg px-3 py-2 text-xs font-medium transition-all"
              >
                <RefreshCw size={12} /> Upload New Video
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MEDIA SCAN PAGE ──────────────────────────────────────────────────────────

function MediaScanPage() {
  const [tab, setTab] = useState("image");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Media Scan</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Upload images or videos for AI-powered license plate recognition
        </p>
      </div>
      <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/10 w-fit backdrop-blur-sm">
        {[
          { id: "image", label: "Image Scan", icon: Image },
          { id: "video", label: "Video Analysis", icon: Video },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? "bg-white/10 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        {tab === "image" ? <ImageScanModule /> : <VideoScanModule />}
      </div>
    </div>
  );
}

// ─── LIVE STREAM PAGE ─────────────────────────────────────────────────────────

function LiveStreamPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [detections, setDetections] = useState([
    { id: 1, plate: "30K-123.45", time: "10:48:23", confidence: 97.2 },
    { id: 2, plate: "51F-789.01", time: "10:48:19", confidence: 91.5 },
  ]);
  const [count, setCount] = useState(2);

  useEffect(() => {
    if (!isPlaying) return;
    const plates = [
      "30K-123.45",
      "51F-789.01",
      "43A-321.65",
      "29B-456.78",
      "92H-543.21",
    ];
    const iv = setInterval(() => {
      const plate = plates[Math.floor(Math.random() * plates.length)];
      const conf = (80 + Math.random() * 18).toFixed(1);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      setCount((c) => c + 1);
      setDetections((prev) => [
        { id: Date.now(), plate, time, confidence: parseFloat(conf) },
        ...prev.slice(0, 14),
      ]);
    }, 2200);
    return () => clearInterval(iv);
  }, [isPlaying]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Stream</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time CCTV monitoring with AI detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border backdrop-blur-sm ${
              isPlaying
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-400/30"
                : "bg-slate-500/15 text-slate-400 border-slate-400/30"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}
            />
            {isPlaying ? "LIVE" : "PAUSED"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <LiveStreamCanvas isPlaying={isPlaying} />
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border backdrop-blur-sm
                ${
                  isPlaying
                    ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/30 text-amber-400"
                    : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/30 text-emerald-400"
                }`}
            >
              {isPlaying ? (
                <>
                  <Pause size={14} /> Pause
                </>
              ) : (
                <>
                  <Play size={14} /> Resume
                </>
              )}
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 transition-all backdrop-blur-sm">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Live Detections
            </p>
            <span className="text-xs font-mono text-slate-500">
              {count} total
            </span>
          </div>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {detections.map((d, i) => (
              <div
                key={d.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                  i === 0
                    ? "bg-emerald-500/10 border-emerald-400/30"
                    : "bg-white/[0.02] border-white/5"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
                />
                <div className="flex-1 min-w-0">
                  <PlateDisplay plate={d.plate} size="sm" />
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {d.time}
                  </p>
                </div>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded border font-medium ${confidenceColor(d.confidence)}`}
                >
                  {d.confidence}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Detected", value: count, icon: Car, color: "violet" },
          {
            label: "Avg Confidence",
            value: "91.4%",
            icon: TrendingUp,
            color: "emerald",
          },
          { label: "Latency", value: "45ms", icon: Zap, color: "sky" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`bg-white/[0.02] border rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm ${
              color === "violet"
                ? "border-violet-400/20"
                : color === "emerald"
                  ? "border-emerald-400/20"
                  : "border-sky-400/20"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                color === "violet"
                  ? "bg-violet-500/10 text-violet-400"
                  : color === "emerald"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-sky-500/10 text-sky-400"
              }`}
            >
              <Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCAN HISTORY PAGE ────────────────────────────────────────────────────────

function ScanHistoryPage({ onReportError }) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [confFilter, setConfFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = HISTORY_DATA.filter((r) => {
    const matchSearch =
      !search ||
      r.plate.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchSource = sourceFilter === "all" || r.source === sourceFilter;
    const matchType = typeFilter === "all" || r.plateType === typeFilter;
    const matchConf =
      confFilter === "all" ||
      (confFilter === "high" && r.confidence >= 90) ||
      (confFilter === "mid" && r.confidence >= 75 && r.confidence < 90) ||
      (confFilter === "low" && r.confidence < 75);
    return matchSearch && matchSource && matchType && matchConf;
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const FilterSelect = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.04] border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500/50 backdrop-blur-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-slate-950">
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Scan History</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Complete log of all license plate detection events
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plate, ID..."
            className="w-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600 backdrop-blur-sm"
          />
        </div>
        <FilterSelect
          value={sourceFilter}
          onChange={setSourceFilter}
          options={[
            { value: "all", label: "All Sources" },
            { value: "Image Upload", label: "Image Upload" },
            { value: "Video Upload", label: "Video Upload" },
            { value: "Live Stream", label: "Live Stream" },
          ]}
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All Types" },
            { value: "1-line", label: "1-Line" },
            { value: "2-line", label: "2-Line" },
          ]}
        />
        <FilterSelect
          value={confFilter}
          onChange={setConfFilter}
          options={[
            { value: "all", label: "All Confidence" },
            { value: "high", label: "High (≥90%)" },
            { value: "mid", label: "Mid (75-90%)" },
            { value: "low", label: "Low (<75%)" },
          ]}
        />
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  "ID",
                  "Timestamp",
                  "Source",
                  "Plate",
                  "Type",
                  "Confidence",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === paged.length - 1 ? "border-0" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {row.id}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {row.timestamp}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        row.source === "Live Stream"
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-400/30"
                          : row.source === "Video Upload"
                            ? "text-purple-400 bg-purple-500/10 border-purple-400/30"
                            : "text-sky-400 bg-sky-500/10 border-sky-400/30"
                      }`}
                    >
                      {row.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PlateDisplay plate={row.plate} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {row.plateType === "2-line" ? "2-Line" : "1-Line"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${confidenceDot(row.confidence)}`}
                      />
                      <span className="text-sm font-medium text-slate-300">
                        {row.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(row.status)}`}
                    >
                      {row.status === "success" ? "Success" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all"
                        title="View"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => onReportError(row)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs transition-all"
                      >
                        <Flag size={10} /> Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
            <p className="text-xs text-slate-500">
              {filtered.length} records · Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/10 transition-all"
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/10 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FEEDBACK MODAL ───────────────────────────────────────────────────────────

function FeedbackModal({ scan, onClose, onSubmit }) {
  const [corrected, setCorrected] = useState("");
  const [errorType, setErrorType] = useState("Character Confusion");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!corrected.trim()) return;
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan_id: scan.id,
          system_detected: scan.plate,
          corrected_text: corrected,
          error_type: errorType,
          notes: notes,
          confidence: scan.confidence,
        }),
      });

      if (response.ok) {
        onSubmit({ scan, corrected, errorType, notes });
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div>
            <h3 className="font-semibold text-white">Report Detection Error</h3>
            <p className="text-xs text-slate-400 mt-0.5">Scan ID: {scan.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              System Detected (Read-only)
            </label>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm text-slate-300 backdrop-blur-sm">
              {scan.plate}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Corrected Plate <span className="text-red-400">*</span>
            </label>
            <input
              value={corrected}
              onChange={(e) => setCorrected(e.target.value)}
              placeholder="e.g. 30K-123.45"
              className="w-full bg-white/[0.03] border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all backdrop-blur-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Error Type
            </label>
            <select
              value={errorType}
              onChange={(e) => setErrorType(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500/50 backdrop-blur-sm"
            >
              {[
                "Character Confusion",
                "Missing Character",
                "Extra Character",
                "Plate Missed",
                "Wrong Bounding Box",
                "Low Lighting",
                "Other",
              ].map((o) => (
                <option key={o} value={o} className="bg-slate-950">
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the issue..."
              className="w-full bg-white/[0.03] border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none transition-all backdrop-blur-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/[0.05] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !corrected.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-medium disabled:opacity-50 transition-all shadow-lg"
          >
            {submitting ? (
              <>
                <Loader size={14} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={14} />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function LPRDashboard() {
  const [currentPage, setCurrentPage] = useState("media");
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [toast, setToast] = useState(null);

  const handleReportError = (scan) => {
    setFeedbackModal(scan);
  };

  const handleFeedbackSubmit = (feedback) => {
    setFeedbackModal(null);
    setToast({
      type: "success",
      message: "Thank you! Feedback submitted successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <Camera size={20} className="text-black" />
              </div>
              <h1 className="text-xl font-bold">LPR Dashboard</h1>
            </div>
            <div className="text-xs text-slate-400">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="relative flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-white/10 backdrop-blur-sm bg-black/20 hidden md:block">
          <nav className="p-4 space-y-1">
            {[
              { id: "media", label: "Media Scan", icon: Image },
              { id: "live", label: "Live Stream", icon: Radio },
              { id: "history", label: "Scan History", icon: History },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  currentPage === id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {currentPage === "media" && <MediaScanPage />}
            {currentPage === "live" && <LiveStreamPage />}
            {currentPage === "history" && (
              <ScanHistoryPage onReportError={handleReportError} />
            )}
          </div>
        </main>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <FeedbackModal
          scan={feedbackModal}
          onClose={() => setFeedbackModal(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
