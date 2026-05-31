// import { useState, useEffect, useRef, useCallback } from "react";
// import {
//   LayoutDashboard, Image, Video, Radio, History, MessageSquare,
//   Upload, X, CheckCircle, AlertTriangle, Clock, Zap, Camera,
//   ChevronDown, Search, Filter, Play, Pause, SkipForward,
//   Flag, Send, Eye, ThumbsUp, Cpu, Activity, Shield,
//   ChevronRight, MoreHorizontal, RefreshCw, Download,
//   TrendingUp, Car, FileVideo, Layers
// } from "lucide-react";

// // ─── MOCK DATA ─────────────────────────────────────────────────────────────────

// const HISTORY_DATA = [
//   {
//     id: "SCN-001", timestamp: "2025-06-15 08:23:14", source: "Live Stream",
//     thumbnail: null, plate: "30K-123.45", plateType: "1-line", confidence: 97.2,
//     status: "success", vehicleColor: "#1a56db", make: "Toyota Camry"
//   },
//   {
//     id: "SCN-002", timestamp: "2025-06-15 08:45:02", source: "Image Upload",
//     thumbnail: null, plate: "51F-456.78", plateType: "1-line", confidence: 94.5,
//     status: "success", vehicleColor: "#e3a008", make: "Honda CR-V"
//   },
//   {
//     id: "SCN-003", timestamp: "2025-06-15 09:12:33", source: "Video Upload",
//     thumbnail: null, plate: "29A\n123.45", plateType: "2-line", confidence: 61.8,
//     status: "correction_pending", vehicleColor: "#c81e1e", make: "Hyundai Accent"
//   },
//   {
//     id: "SCN-004", timestamp: "2025-06-15 09:34:55", source: "Image Upload",
//     thumbnail: null, plate: "43B-987.65", plateType: "1-line", confidence: 98.1,
//     status: "success", vehicleColor: "#111827", make: "Mazda 6"
//   },
//   {
//     id: "SCN-005", timestamp: "2025-06-15 10:02:17", source: "Video Upload",
//     thumbnail: null, plate: "92H\n543.21", plateType: "2-line", confidence: 88.3,
//     status: "success", vehicleColor: "#374151", make: "Ford Ranger"
//   },
//   {
//     id: "SCN-006", timestamp: "2025-06-15 10:15:44", source: "Live Stream",
//     thumbnail: null, plate: "51G-321.00", plateType: "1-line", confidence: 72.4,
//     status: "correction_pending", vehicleColor: "#065f46", make: "Kia Morning"
//   },
//   {
//     id: "SCN-007", timestamp: "2025-06-15 10:48:09", source: "Image Upload",
//     thumbnail: null, plate: "30H-654.32", plateType: "1-line", confidence: 95.7,
//     status: "success", vehicleColor: "#4c1d95", make: "VinFast Lux A2.0"
//   },
// ];

// const FEEDBACK_DATA = [
//   {
//     id: "FB-001", scanId: "SCN-003", submittedAt: "2025-06-15 09:20:00",
//     systemText: "29A\n1Z3.45", correctedText: "29A\n123.45",
//     errorType: "Character Confusion O/0",
//     notes: "The character 'Z' was misread, it should be '2'.",
//     status: "pending", confidence: 61.8
//   },
//   {
//     id: "FB-002", scanId: "SCN-006", submittedAt: "2025-06-15 10:22:11",
//     systemText: "51G-3B1.00", correctedText: "51G-321.00",
//     errorType: "Character Confusion",
//     notes: "B was confused with 2 in low-light conditions.",
//     status: "pending", confidence: 72.4
//   },
//   {
//     id: "FB-003", scanId: "SCN-001", submittedAt: "2025-06-14 17:45:30",
//     systemText: "30K-123.45", correctedText: "30K-123.45",
//     errorType: "Wrong Bounding Box",
//     notes: "Bounding box extended beyond plate boundary.",
//     status: "approved", confidence: 97.2
//   },
// ];

// const LIVE_DETECTIONS = [
//   { id: 1, plate: "30K-123.45", time: "10:48:23", confidence: 97.2 },
//   { id: 2, plate: "51F-789.01", time: "10:48:19", confidence: 91.5 },
//   { id: 3, plate: "29B-456.78", time: "10:48:14", confidence: 88.7 },
//   { id: 4, plate: "43A-321.65", time: "10:48:09", confidence: 95.3 },
//   { id: 5, plate: "92H-543.21", time: "10:48:02", confidence: 79.4 },
// ];

// const VIDEO_PLATES = [
//   { id: 1, plate: "30K-123.45", timestamp: "00:03", frame: 90, confidence: 97.2 },
//   { id: 2, plate: "51F-456.78", timestamp: "00:07", frame: 210, confidence: 94.1 },
//   { id: 3, plate: "29A-789.01", timestamp: "00:12", frame: 360, confidence: 88.5 },
//   { id: 4, plate: "43B-654.32", timestamp: "00:18", frame: 540, confidence: 92.7 },
//   { id: 5, plate: "92H-321.00", timestamp: "00:24", frame: 720, confidence: 85.3 },
// ];

// // ─── HELPERS ────────────────────────────────────────────────────────────────────

// const confidenceColor = (score) => {
//   if (score >= 90) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
//   if (score >= 75) return "text-amber-400 bg-amber-400/10 border-amber-400/30";
//   return "text-red-400 bg-red-400/10 border-red-400/30";
// };

// const confidenceDot = (score) => {
//   if (score >= 90) return "bg-emerald-400";
//   if (score >= 75) return "bg-amber-400";
//   return "bg-red-400";
// };

// const statusBadge = (status) => {
//   if (status === "success") return "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20";
//   if (status === "approved") return "text-sky-400 bg-sky-400/10 border border-sky-400/20";
//   return "text-amber-400 bg-amber-400/10 border border-amber-400/20";
// };

// function PlateDisplay({ plate, size = "md" }) {
//   const isTwo = plate.includes("\n");
//   const parts = plate.split("\n");
//   const baseClass = size === "lg"
//     ? "font-mono font-bold tracking-widest text-lg"
//     : "font-mono font-bold tracking-wider text-sm";
//   return (
//     <div className={`inline-flex items-center justify-center bg-[#f5e642] rounded border-2 border-yellow-500 px-2 py-0.5 min-w-[80px] ${isTwo ? "flex-col gap-0 py-1" : ""}`}>
//       {isTwo ? (
//         <>
//           <span className={`${baseClass} text-gray-900 leading-tight`}>{parts[0]}</span>
//           <span className="w-full h-px bg-gray-700/30 my-0.5" />
//           <span className={`${baseClass} text-gray-900 leading-tight`}>{parts[1]}</span>
//         </>
//       ) : (
//         <span className={`${baseClass} text-gray-900`}>{plate}</span>
//       )}
//     </div>
//   );
// }

// function Toast({ message, type = "success", onClose }) {
//   useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
//   return (
//     <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-slide-up
//       ${type === "success" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-amber-500/20 border-amber-500/40 text-amber-300"}`}>
//       {type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
//       <span className="text-sm font-medium">{message}</span>
//     </div>
//   );
// }

// // ─── SCAN CANVAS (Live plate overlay animation) ──────────────────────────────

// function LiveStreamCanvas({ isPlaying }) {
//   const canvasRef = useRef(null);
//   const animRef = useRef(null);
//   const stateRef = useRef({ scanY: 60, scanDir: 1, boxes: [], tick: 0 });

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     const W = canvas.width, H = canvas.height;

//     const mockBoxes = [
//       { x: 80, y: 120, w: 220, h: 70, plate: "30K-123.45", conf: 97, active: false, alpha: 0 },
//       { x: 360, y: 160, w: 180, h: 60, plate: "51F-456.78", conf: 91, active: false, alpha: 0 },
//     ];
//     stateRef.current.boxes = mockBoxes;

//     const draw = () => {
//       const s = stateRef.current;
//       s.tick++;
//       ctx.clearRect(0, 0, W, H);

//       // Dark video BG
//       const grad = ctx.createLinearGradient(0, 0, 0, H);
//       grad.addColorStop(0, "#0f1117");
//       grad.addColorStop(1, "#1a1f2e");
//       ctx.fillStyle = grad;
//       ctx.fillRect(0, 0, W, H);

//       // Grid overlay
//       ctx.strokeStyle = "rgba(56,189,248,0.05)";
//       ctx.lineWidth = 1;
//       for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
//       for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

//       if (!isPlaying) {
//         ctx.fillStyle = "rgba(0,0,0,0.5)";
//         ctx.fillRect(0, 0, W, H);
//         ctx.fillStyle = "rgba(148,163,184,0.8)";
//         ctx.font = "bold 16px monospace";
//         ctx.textAlign = "center";
//         ctx.fillText("⏸  STREAM PAUSED", W / 2, H / 2);
//         animRef.current = requestAnimationFrame(draw);
//         return;
//       }

//       // Scan line
//       s.scanY += s.scanDir * 2;
//       if (s.scanY > H - 20) s.scanDir = -1;
//       if (s.scanY < 20) s.scanDir = 1;
//       const scanGrad = ctx.createLinearGradient(0, s.scanY - 8, 0, s.scanY + 8);
//       scanGrad.addColorStop(0, "transparent");
//       scanGrad.addColorStop(0.5, "rgba(56,189,248,0.6)");
//       scanGrad.addColorStop(1, "transparent");
//       ctx.fillStyle = scanGrad;
//       ctx.fillRect(0, s.scanY - 8, W, 16);

//       // Mock car shapes
//       const t = s.tick;
//       [[60, 180, "#1e3a5f"], [280, 200, "#2d1b1b"], [480, 175, "#1a2e1a"]].forEach(([bx, by, col], i) => {
//         const ox = Math.sin(t * 0.005 + i) * 8;
//         ctx.fillStyle = col;
//         ctx.beginPath();
//         ctx.roundRect(bx + ox, by, 130, 55, 6);
//         ctx.fill();
//         ctx.fillStyle = col === "#1e3a5f" ? "#2563eb" : col === "#2d1b1b" ? "#dc2626" : "#16a34a";
//         ctx.beginPath();
//         ctx.roundRect(bx + ox + 15, by - 25, 100, 30, 8);
//         ctx.fill();
//       });

//       // Detection boxes
//       mockBoxes.forEach((box, i) => {
//         const proximity = Math.abs(s.scanY - (box.y + box.h / 2));
//         if (proximity < 60 && !box.active) { box.active = true; }
//         if (box.active) box.alpha = Math.min(1, box.alpha + 0.05);

//         if (box.alpha > 0) {
//           ctx.save();
//           ctx.globalAlpha = box.alpha;
//           const blink = Math.sin(t * 0.1) > 0 ? 1 : 0.6;
//           ctx.strokeStyle = `rgba(52,211,153,${blink})`;
//           ctx.lineWidth = 2;
//           ctx.setLineDash([6, 3]);
//           ctx.strokeRect(box.x, box.y, box.w, box.h);

//           // Corner marks
//           const cs = 12;
//           ctx.setLineDash([]);
//           ctx.lineWidth = 3;
//           [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]].forEach(([cx, cy], ci) => {
//             ctx.beginPath();
//             ctx.moveTo(cx + (ci % 2 === 0 ? cs : -cs), cy);
//             ctx.lineTo(cx, cy);
//             ctx.lineTo(cx, cy + (ci < 2 ? cs : -cs));
//             ctx.stroke();
//           });

//           // Label
//           ctx.fillStyle = "rgba(52,211,153,0.9)";
//           ctx.fillRect(box.x, box.y - 22, 140, 20);
//           ctx.fillStyle = "#111";
//           ctx.font = "bold 11px monospace";
//           ctx.textAlign = "left";
//           ctx.fillText(`${box.plate}  ${box.conf}%`, box.x + 6, box.y - 7);
//           ctx.restore();
//         }
//       });

//       // HUD corners
//       const hud = (x, y, dir) => {
//         ctx.strokeStyle = "rgba(56,189,248,0.4)";
//         ctx.lineWidth = 2;
//         ctx.setLineDash([]);
//         ctx.beginPath();
//         ctx.moveTo(x, y + dir * 20); ctx.lineTo(x, y); ctx.lineTo(x + 20, y);
//         ctx.stroke();
//       };
//       hud(10, 10, 1); hud(W - 10, 10, 1); hud(10, H - 10, -1); hud(W - 10, H - 10, -1);

//       // Status text
//       ctx.fillStyle = "rgba(56,189,248,0.7)";
//       ctx.font = "10px monospace";
//       ctx.textAlign = "left";
//       ctx.fillText(`LIVE  ●  REC  ${new Date().toLocaleTimeString()}`, 20, 24);
//       ctx.textAlign = "right";
//       ctx.fillText(`AI: YOLOv11 + CRNN  |  FPS: 30`, W - 20, 24);

//       animRef.current = requestAnimationFrame(draw);
//     };
//     animRef.current = requestAnimationFrame(draw);
//     return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
//   }, [isPlaying]);

//   return <canvas ref={canvasRef} width={620} height={340} className="w-full rounded-xl" />;
// }

// // ─── VIDEO SCAN CANVAS ────────────────────────────────────────────────────────

// function VideoScanCanvas({ progress, currentFrame, totalFrames, isProcessing }) {
//   const canvasRef = useRef(null);
//   const animRef = useRef(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     const W = canvas.width, H = canvas.height;
//     let tick = 0;

//     const draw = () => {
//       tick++;
//       ctx.clearRect(0, 0, W, H);

//       // BG
//       ctx.fillStyle = "#0d1117";
//       ctx.fillRect(0, 0, W, H);

//       // Grid
//       ctx.strokeStyle = "rgba(139,92,246,0.06)";
//       ctx.lineWidth = 1;
//       for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
//       for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

//       // Mock road scene
//       ctx.fillStyle = "#1c2333";
//       ctx.fillRect(0, H * 0.55, W, H * 0.45);
//       ctx.fillStyle = "#252d3d";
//       const laneW = 40;
//       for (let x = -tick * 3 % 100; x < W + 100; x += 100) {
//         ctx.fillRect(x, H * 0.72, 60, 8);
//       }

//       // Moving cars
//       const carProgress = (tick * 1.2 + progress * 500) % (W + 200) - 100;
//       [[0, "#1e3a5f", "#2563eb"], [180, "#3d1a1a", "#dc2626"]].forEach(([offset, body, roof]) => {
//         const cx = (carProgress + offset) % (W + 200) - 100;
//         const cy = H * 0.45;
//         ctx.fillStyle = body;
//         ctx.beginPath();
//         ctx.roundRect(cx, cy, 140, 60, 6);
//         ctx.fill();
//         ctx.fillStyle = roof;
//         ctx.beginPath();
//         ctx.roundRect(cx + 15, cy - 28, 110, 32, 8);
//         ctx.fill();

//         // Plate on car
//         if (cx > 20 && cx < W - 160) {
//           ctx.fillStyle = "#f5e642";
//           ctx.fillRect(cx + 30, cy + 38, 80, 20);
//           ctx.fillStyle = "#111";
//           ctx.font = "bold 9px monospace";
//           ctx.textAlign = "center";
//           ctx.fillText("30K-123.45", cx + 70, cy + 52);

//           // Detection box - appears at certain progress
//           if (isProcessing && Math.sin(tick * 0.05) > 0.3) {
//             ctx.save();
//             const pulse = 0.6 + Math.sin(tick * 0.15) * 0.4;
//             ctx.strokeStyle = `rgba(52,211,153,${pulse})`;
//             ctx.lineWidth = 2;
//             ctx.setLineDash([5, 3]);
//             ctx.strokeRect(cx + 20, cy - 32, 120, 96);
//             ctx.setLineDash([]);
//             ctx.strokeStyle = `rgba(52,211,153,${pulse})`;
//             ctx.lineWidth = 3;
//             [[cx + 20, cy - 32], [cx + 140, cy - 32], [cx + 20, cy + 64], [cx + 140, cy + 64]].forEach(([ex, ey], ei) => {
//               ctx.beginPath(); ctx.moveTo(ex + (ei % 2 === 0 ? 10 : -10), ey); ctx.lineTo(ex, ey); ctx.lineTo(ex, ey + (ei < 2 ? 10 : -10)); ctx.stroke();
//             });
//             ctx.fillStyle = `rgba(52,211,153,0.9)`;
//             ctx.fillRect(cx + 20, cy - 52, 120, 18);
//             ctx.fillStyle = "#000";
//             ctx.font = "bold 10px monospace";
//             ctx.textAlign = "center";
//             ctx.fillText("30K-123.45  97%", cx + 80, cy - 39);
//             ctx.restore();
//           }
//         }
//       });

//       // Frame progress bar
//       if (isProcessing) {
//         const barX = 20, barY = H - 30, barW = W - 40, barH = 6;
//         ctx.fillStyle = "rgba(30,30,40,0.8)";
//         ctx.beginPath();
//         ctx.roundRect(barX, barY, barW, barH, 3);
//         ctx.fill();
//         ctx.fillStyle = "#8b5cf6";
//         ctx.beginPath();
//         ctx.roundRect(barX, barY, barW * progress, barH, 3);
//         ctx.fill();

//         ctx.fillStyle = "rgba(139,92,246,0.9)";
//         ctx.font = "11px monospace";
//         ctx.textAlign = "left";
//         ctx.fillText(`Frame ${currentFrame}/${totalFrames}`, barX, barY - 8);
//         ctx.textAlign = "right";
//         ctx.fillText(`${Math.round(progress * 100)}% analyzed`, barX + barW, barY - 8);
//       }

//       // HUD
//       ctx.fillStyle = "rgba(139,92,246,0.6)";
//       ctx.font = "10px monospace";
//       ctx.textAlign = "left";
//       ctx.fillText("AI VIDEO ANALYSIS  ●  YOLOv11 + CRNN", 16, 18);

//       animRef.current = requestAnimationFrame(draw);
//     };
//     animRef.current = requestAnimationFrame(draw);
//     return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
//   }, [progress, currentFrame, totalFrames, isProcessing]);

//   return <canvas ref={canvasRef} width={620} height={320} className="w-full rounded-xl" />;
// }

// // ─── IMAGE SCAN MODULE ────────────────────────────────────────────────────────

// function ImageScanModule() {
//   const [dragOver, setDragOver] = useState(false);
//   const [scanning, setScanning] = useState(false);
//   const [result, setResult] = useState(null);
//   const [progress, setProgress] = useState(0);

//   const handleDrop = useCallback((e) => {
//     e.preventDefault();
//     setDragOver(false);
//     simulate();
//   }, []);

//   const simulate = () => {
//     setScanning(true);
//     setResult(null);
//     setProgress(0);
//     let p = 0;
//     const iv = setInterval(() => {
//       p += Math.random() * 15 + 5;
//       setProgress(Math.min(p, 100));
//       if (p >= 100) {
//         clearInterval(iv);
//         setScanning(false);
//         setResult({
//           plate: "30K-123.45", confidence: 96.39, time: 42,
//           plateType: "1-line", region: "Hà Nội",
//           bbox: { x: 22, y: 68, w: 56, h: 14 }
//         });
//       }
//     }, 120);
//   };

//   return (
//     <div className="space-y-5">
//       <div
//         onDrop={handleDrop}
//         onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//         onDragLeave={() => setDragOver(false)}
//         onClick={simulate}
//         className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
//           ${dragOver ? "border-violet-400 bg-violet-400/5 scale-[1.01]" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"}`}
//       >
//         {scanning ? (
//           <div className="space-y-3">
//             <div className="w-12 h-12 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
//             <p className="text-slate-300 text-sm font-medium">Analyzing image...</p>
//             <div className="w-64 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
//               <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
//             </div>
//             <p className="text-slate-500 text-xs">{Math.round(progress)}% — Running YOLOv11 detection</p>
//           </div>
//         ) : (
//           <>
//             <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
//               <Upload size={24} className="text-violet-400" />
//             </div>
//             <p className="text-slate-200 font-semibold mb-1">Drop vehicle image here</p>
//             <p className="text-slate-500 text-sm">or click to simulate scan  ·  PNG, JPG, WebP</p>
//           </>
//         )}
//       </div>

//       {result && (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
//           <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
//             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Detection Result</p>
//             <div className="relative bg-slate-900 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <div className="w-3/4 h-1/2 border-2 border-emerald-400 rounded" style={{ position: "absolute", left: "12%", top: "30%" }}>
//                   <div className="absolute -top-6 left-0 bg-emerald-400 text-black text-xs font-bold px-2 py-0.5 rounded">vehicle 99.1%</div>
//                   <div className="absolute bottom-2 left-2 right-2 h-[18%] border-2 border-yellow-400 rounded">
//                     <div className="absolute -top-5 left-0 bg-yellow-400 text-black text-xs font-bold px-2 rounded">plate 96.39%</div>
//                   </div>
//                 </div>
//                 <div className="absolute inset-0 flex items-end justify-center pb-2">
//                   <div className="grid grid-cols-8 gap-1 px-4 w-full opacity-20">
//                     {Array.from({ length: 8 }).map((_, i) => (
//                       <div key={i} className="h-16 bg-slate-600 rounded" />
//                     ))}
//                   </div>
//                 </div>
//               </div>
//               <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-0.5 text-xs text-slate-300 font-mono">vehicle_001.jpg</div>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="bg-slate-800 rounded-lg border border-white/10 px-3 py-2 flex-1">
//                 <p className="text-xs text-slate-500 mb-1">Cropped Plate</p>
//                 <div className="bg-[#f5e642] rounded px-2 py-1 inline-block">
//                   <span className="font-mono font-bold text-gray-900 text-sm tracking-widest">{result.plate}</span>
//                 </div>
//               </div>
//               <div className="bg-slate-800 rounded-lg border border-white/10 px-3 py-2">
//                 <p className="text-xs text-slate-500 mb-1">Type</p>
//                 <p className="text-xs font-medium text-slate-300">{result.plateType}</p>
//               </div>
//             </div>
//           </div>

//           <div className="space-y-3">
//             {[
//               { label: "Detected Plate", value: result.plate, accent: "emerald" },
//               { label: "Confidence Score", value: `${result.confidence}%`, accent: "emerald" },
//               { label: "Processing Time", value: `${result.time}ms`, accent: "sky" },
//               { label: "Plate Type", value: result.plateType, accent: "violet" },
//               { label: "Region", value: result.region, accent: "violet" },
//             ].map(({ label, value, accent }) => (
//               <div key={label} className="flex items-center justify-between bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
//                 <span className="text-sm text-slate-400">{label}</span>
//                 <span className={`text-sm font-semibold ${accent === "emerald" ? "text-emerald-400" : accent === "sky" ? "text-sky-400" : "text-violet-400"}`}>{value}</span>
//               </div>
//             ))}
//             <button
//               onClick={() => setResult(null)}
//               className="w-full mt-2 flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
//             >
//               <RefreshCw size={14} /> Scan Another
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── VIDEO SCAN MODULE ────────────────────────────────────────────────────────

// function VideoScanModule() {
//   const [uploaded, setUploaded] = useState(false);
//   const [processing, setProcessing] = useState(false);
//   const [done, setDone] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [currentFrame, setCurrentFrame] = useState(0);
//   const totalFrames = 450;
//   const [discoveredPlates, setDiscoveredPlates] = useState([]);
//   const [dragOver, setDragOver] = useState(false);

//   const startProcessing = () => {
//     setUploaded(true);
//     setProcessing(true);
//     setDiscoveredPlates([]);
//     setProgress(0);
//     setCurrentFrame(0);

//     let frame = 0;
//     let plateIdx = 0;
//     const iv = setInterval(() => {
//       frame += 6;
//       setCurrentFrame(Math.min(frame, totalFrames));
//       setProgress(Math.min(frame / totalFrames, 1));

//       if (plateIdx < VIDEO_PLATES.length && frame >= VIDEO_PLATES[plateIdx].frame) {
//         const p = VIDEO_PLATES[plateIdx];
//         setDiscoveredPlates(prev => [...prev, p]);
//         plateIdx++;
//       }

//       if (frame >= totalFrames) {
//         clearInterval(iv);
//         setProcessing(false);
//         setDone(true);
//       }
//     }, 100);
//   };

//   return (
//     <div className="space-y-5">
//       {!uploaded ? (
//         <div
//           onDrop={(e) => { e.preventDefault(); setDragOver(false); startProcessing(); }}
//           onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//           onDragLeave={() => setDragOver(false)}
//           onClick={startProcessing}
//           className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
//             ${dragOver ? "border-purple-400 bg-purple-400/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"}`}
//         >
//           <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
//             <FileVideo size={24} className="text-purple-400" />
//           </div>
//           <p className="text-slate-200 font-semibold mb-1">Drop video file here</p>
//           <p className="text-slate-500 text-sm">or click to simulate · MP4, AVI, MOV</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//           <div className="lg:col-span-2 space-y-3">
//             <VideoScanCanvas progress={progress} currentFrame={Math.min(currentFrame, totalFrames)} totalFrames={totalFrames} isProcessing={processing} />

//             <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 space-y-2">
//               <div className="flex items-center justify-between text-xs text-slate-400">
//                 <span className="flex items-center gap-1.5">
//                   <Cpu size={12} className="text-purple-400" />
//                   {processing ? `Analyzing: Frame ${currentFrame} / ${totalFrames}` : "Analysis complete"}
//                 </span>
//                 <span className="font-mono text-purple-400">{Math.round(progress * 100)}%</span>
//               </div>
//               <div className="h-2 bg-white/5 rounded-full overflow-hidden">
//                 <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-200" style={{ width: `${progress * 100}%` }} />
//               </div>
//               {done && (
//                 <p className="text-xs text-emerald-400 flex items-center gap-1.5">
//                   <CheckCircle size={12} /> Processing complete — {discoveredPlates.length} plates found
//                 </p>
//               )}
//             </div>
//           </div>

//           <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
//             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
//               Discovered Plates {discoveredPlates.length > 0 && <span className="text-purple-400 ml-1">({discoveredPlates.length})</span>}
//             </p>
//             <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
//               {discoveredPlates.length === 0 && (
//                 <div className="text-center py-8">
//                   <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
//                   <p className="text-xs text-slate-500">Scanning frames...</p>
//                 </div>
//               )}
//               {discoveredPlates.map((p) => (
//                 <div key={p.id} className="flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg p-2.5 cursor-pointer transition-all group">
//                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-1.5">
//                       <PlateDisplay plate={p.plate} size="sm" />
//                     </div>
//                     <p className="text-xs text-slate-500 mt-0.5">@ {p.timestamp} · {p.confidence}%</p>
//                   </div>
//                   <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400" />
//                 </div>
//               ))}
//             </div>
//             {done && (
//               <button
//                 onClick={() => { setUploaded(false); setDone(false); setDiscoveredPlates([]); }}
//                 className="w-full mt-3 flex items-center justify-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-lg px-3 py-2 text-xs font-medium transition-all"
//               >
//                 <RefreshCw size={12} /> Upload New Video
//               </button>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── MEDIA SCAN PAGE ─────────────────────────────────────────────────────────

// function MediaScanPage() {
//   const [tab, setTab] = useState("image");
//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-xl font-semibold text-white">Media Scan</h2>
//         <p className="text-sm text-slate-400 mt-0.5">Upload images or videos for AI-powered license plate recognition</p>
//       </div>
//       <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/8 w-fit">
//         {[
//           { id: "image", label: "Image Scan", icon: Image },
//           { id: "video", label: "Video File Scan", icon: Video },
//         ].map(({ id, label, icon: Icon }) => (
//           <button
//             key={id}
//             onClick={() => setTab(id)}
//             className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? "bg-white/10 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
//           >
//             <Icon size={14} /> {label}
//           </button>
//         ))}
//       </div>
//       <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5">
//         {tab === "image" ? <ImageScanModule /> : <VideoScanModule />}
//       </div>
//     </div>
//   );
// }

// // ─── LIVE STREAM PAGE ─────────────────────────────────────────────────────────

// function LiveStreamPage() {
//   const [isPlaying, setIsPlaying] = useState(true);
//   const [detections, setDetections] = useState([...LIVE_DETECTIONS]);
//   const [count, setCount] = useState(LIVE_DETECTIONS.length);

//   useEffect(() => {
//     if (!isPlaying) return;
//     const plates = ["30K-123.45", "51F-789.01", "43A-321.65", "29B-456.78", "92H-543.21", "17H-888.88", "36B-111.22"];
//     const iv = setInterval(() => {
//       const plate = plates[Math.floor(Math.random() * plates.length)];
//       const conf = (80 + Math.random() * 18).toFixed(1);
//       const now = new Date();
//       const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
//       setCount(c => c + 1);
//       setDetections(prev => [{ id: Date.now(), plate, time, confidence: parseFloat(conf) }, ...prev.slice(0, 14)]);
//     }, 2200);
//     return () => clearInterval(iv);
//   }, [isPlaying]);

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-xl font-semibold text-white">Live Stream</h2>
//           <p className="text-sm text-slate-400 mt-0.5">Real-time CCTV monitoring with AI detection</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${isPlaying ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : "bg-slate-400/10 text-slate-400 border-slate-400/20"}`}>
//             <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
//             {isPlaying ? "LIVE" : "PAUSED"}
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <div className="lg:col-span-2 space-y-3">
//           <LiveStreamCanvas isPlaying={isPlaying} />
//           <div className="flex gap-2">
//             <button
//               onClick={() => setIsPlaying(p => !p)}
//               className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border
//                 ${isPlaying ? "bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/20 text-amber-400" : "bg-emerald-400/10 hover:bg-emerald-400/20 border-emerald-400/20 text-emerald-400"}`}
//             >
//               {isPlaying ? <><Pause size={14} /> Pause Stream</> : <><Play size={14} /> Resume Stream</>}
//             </button>
//             <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-slate-300 transition-all">
//               <Download size={14} /> Export Log
//             </button>
//           </div>
//         </div>

//         <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-4">
//           <div className="flex items-center justify-between mb-4">
//             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Detections</p>
//             <span className="text-xs font-mono text-slate-500">{count} total</span>
//           </div>
//           <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
//             {detections.map((d, i) => (
//               <div key={d.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${i === 0 ? "bg-emerald-400/5 border-emerald-400/20" : "bg-white/[0.02] border-white/5"}`}>
//                 <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
//                 <div className="flex-1 min-w-0">
//                   <PlateDisplay plate={d.plate} size="sm" />
//                   <p className="text-xs text-slate-500 mt-0.5 font-mono">{d.time}</p>
//                 </div>
//                 <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${confidenceColor(d.confidence)}`}>{d.confidence}%</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-3">
//         {[
//           { label: "Total Detected (Session)", value: count, icon: Car, color: "violet" },
//           { label: "Avg Confidence", value: "91.4%", icon: TrendingUp, color: "emerald" },
//           { label: "Stream Latency", value: "45ms", icon: Zap, color: "sky" },
//         ].map(({ label, value, icon: Icon, color }) => (
//           <div key={label} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 flex items-center gap-3">
//             <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color === "violet" ? "bg-violet-500/10 text-violet-400" : color === "emerald" ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"}`}>
//               <Icon size={16} />
//             </div>
//             <div>
//               <p className="text-lg font-bold text-white">{value}</p>
//               <p className="text-xs text-slate-500">{label}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── SCAN HISTORY PAGE ────────────────────────────────────────────────────────

// function ScanHistoryPage({ onReportError }) {
//   const [search, setSearch] = useState("");
//   const [sourceFilter, setSourceFilter] = useState("all");
//   const [typeFilter, setTypeFilter] = useState("all");
//   const [confFilter, setConfFilter] = useState("all");
//   const [page, setPage] = useState(1);
//   const perPage = 5;

//   const filtered = HISTORY_DATA.filter(r => {
//     const matchSearch = !search || r.plate.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
//     const matchSource = sourceFilter === "all" || r.source === sourceFilter;
//     const matchType = typeFilter === "all" || r.plateType === typeFilter;
//     const matchConf = confFilter === "all" ||
//       (confFilter === "high" && r.confidence >= 90) ||
//       (confFilter === "mid" && r.confidence >= 75 && r.confidence < 90) ||
//       (confFilter === "low" && r.confidence < 75);
//     return matchSearch && matchSource && matchType && matchConf;
//   });

//   const paged = filtered.slice((page - 1) * perPage, page * perPage);
//   const totalPages = Math.ceil(filtered.length / perPage);

//   const FilterSelect = ({ value, onChange, options }) => (
//     <select
//       value={value}
//       onChange={e => onChange(e.target.value)}
//       className="bg-white/[0.04] border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/50"
//     >
//       {options.map(o => <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>)}
//     </select>
//   );

//   return (
//     <div className="space-y-5">
//       <div>
//         <h2 className="text-xl font-semibold text-white">Scan History</h2>
//         <p className="text-sm text-slate-400 mt-0.5">Complete log of all license plate detection events</p>
//       </div>

//       <div className="flex flex-wrap gap-2">
//         <div className="relative flex-1 min-w-[200px]">
//           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
//           <input
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Search plate, ID..."
//             className="w-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-violet-500/50 placeholder:text-slate-600"
//           />
//         </div>
//         <FilterSelect value={sourceFilter} onChange={setSourceFilter} options={[
//           { value: "all", label: "All Sources" }, { value: "Image Upload", label: "Image Upload" },
//           { value: "Video Upload", label: "Video Upload" }, { value: "Live Stream", label: "Live Stream" }
//         ]} />
//         <FilterSelect value={typeFilter} onChange={setTypeFilter} options={[
//           { value: "all", label: "All Types" }, { value: "1-line", label: "1-Line" }, { value: "2-line", label: "2-Line Square" }
//         ]} />
//         <FilterSelect value={confFilter} onChange={setConfFilter} options={[
//           { value: "all", label: "All Confidence" }, { value: "high", label: "High (≥90%)" },
//           { value: "mid", label: "Mid (75-90%)" }, { value: "low", label: "Low (<75%)" }
//         ]} />
//       </div>

//       <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-white/8">
//                 {["ID", "Timestamp", "Source", "Plate", "Type", "Confidence", "Status", "Actions"].map(h => (
//                   <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {paged.map((row, i) => (
//                 <tr key={row.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === paged.length - 1 ? "border-0" : ""}`}>
//                   <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.id}</td>
//                   <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{row.timestamp}</td>
//                   <td className="px-4 py-3">
//                     <span className={`text-xs px-2 py-0.5 rounded-full border ${row.source === "Live Stream" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : row.source === "Video Upload" ? "text-purple-400 bg-purple-400/10 border-purple-400/20" : "text-sky-400 bg-sky-400/10 border-sky-400/20"}`}>
//                       {row.source}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <PlateDisplay plate={row.plate} size="sm" />
//                   </td>
//                   <td className="px-4 py-3 text-xs text-slate-400">{row.plateType === "2-line" ? "2-Line Square" : "1-Line Std"}</td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-2">
//                       <div className={`w-2 h-2 rounded-full ${confidenceDot(row.confidence)}`} />
//                       <span className="text-sm font-medium text-slate-300">{row.confidence}%</span>
//                     </div>
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(row.status)}`}>
//                       {row.status === "success" ? "Success" : "Correction Pending"}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex items-center gap-1.5">
//                       <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all" title="View">
//                         <Eye size={12} />
//                       </button>
//                       <button
//                         onClick={() => onReportError(row)}
//                         className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs transition-all"
//                       >
//                         <Flag size={10} /> Report
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         {totalPages > 1 && (
//           <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
//             <p className="text-xs text-slate-500">{filtered.length} records · Page {page} of {totalPages}</p>
//             <div className="flex gap-1">
//               <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/10 transition-all">Prev</button>
//               <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/10 transition-all">Next</button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── FEEDBACK MODAL ───────────────────────────────────────────────────────────

// function FeedbackModal({ scan, onClose, onSubmit }) {
//   const [corrected, setCorrected] = useState("");
//   const [errorType, setErrorType] = useState("Character Confusion O/0");
//   const [notes, setNotes] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   const handleSubmit = () => {
//     if (!corrected.trim()) return;
//     setSubmitting(true);
//     setTimeout(() => { onSubmit({ scan, corrected, errorType, notes }); }, 800);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
//       <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
//         <div className="flex items-center justify-between p-5 border-b border-white/8">
//           <div>
//             <h3 className="font-semibold text-white">Report Detection Error</h3>
//             <p className="text-xs text-slate-400 mt-0.5">Scan ID: {scan.id}</p>
//           </div>
//           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all"><X size={16} /></button>
//         </div>
//         <div className="p-5 space-y-4">
//           <div>
//             <label className="text-xs font-medium text-slate-400 block mb-1.5">System Detected (Read-only)</label>
//             <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm text-slate-300">{scan.plate}</div>
//           </div>
//           <div>
//             <label className="text-xs font-medium text-slate-400 block mb-1.5">Corrected Plate Number <span className="text-red-400">*</span></label>
//             <input
//               value={corrected}
//               onChange={e => setCorrected(e.target.value)}
//               placeholder="e.g. 30K-123.45"
//               className="w-full bg-white/[0.04] border border-white/10 focus:border-violet-500/50 rounded-xl px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
//             />
//           </div>
//           <div>
//             <label className="text-xs font-medium text-slate-400 block mb-1.5">Error Type</label>
//             <select
//               value={errorType}
//               onChange={e => setErrorType(e.target.value)}
//               className="w-full bg-white/[0.04] border border-white/10 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500/50"
//             >
//               {["Character Confusion O/0", "Missing Character", "Extra Character", "Plate Missed", "Wrong Bounding Box", "Low Lighting Error", "Other"].map(o => (
//                 <option key={o} value={o} className="bg-slate-900">{o}</option>
//               ))}
//             </select>
//           </div>
//           <div>
//             <label className="text-xs font-medium text-slate-400 block mb-1.5">Additional Notes</label>
//             <textarea
//               value={notes}
//               onChange={e => setNotes(e.target.value)}
//               rows={3}
//               placeholder="Describe the issue in detail..."
//               className="w-full bg-white/[0.04] border border-white/10 focus:border-violet-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none transition-all"
//             />
//           </div>
//         </div>
//         <div className="flex gap-2 p-5 pt-0">
//           <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/[0.04] transition-all">Cancel</button>
//           <button
//             onClick={handleSubmit}
//             disabled={submitting || !corrected.trim()}
//             className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium disabled:opacity-50 transition-all"
//           >
//             {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
//             {submitting ? "Submitting..." : "Submit Feedback"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── FEEDBACK MANAGEMENT PAGE ─────────────────────────────────────────────────

// function FeedbackPage({ feedbacks, onApprove }) {
//   return (
//     <div className="space-y-5">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-xl font-semibold text-white">Feedback Management</h2>
//           <p className="text-sm text-slate-400 mt-0.5">Review and approve user corrections for AI training</p>
//         </div>
//         <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full">
//           <AlertTriangle size={12} />
//           {feedbacks.filter(f => f.status === "pending").length} pending review
//         </div>
//       </div>

//       <div className="space-y-3">
//         {feedbacks.map((fb) => (
//           <div key={fb.id} className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 space-y-4">
//             <div className="flex items-start justify-between">
//               <div>
//                 <div className="flex items-center gap-2">
//                   <span className="font-mono text-xs text-slate-500">{fb.id}</span>
//                   <span className="text-slate-700">·</span>
//                   <span className="font-mono text-xs text-slate-500">Scan: {fb.scanId}</span>
//                 </div>
//                 <p className="text-xs text-slate-500 mt-0.5">{fb.submittedAt}</p>
//               </div>
//               <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(fb.status)}`}>
//                 {fb.status === "approved" ? "✓ Approved" : "Pending Review"}
//               </span>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
//                 <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1"><X size={10} /> System Detected</p>
//                 <div className="bg-[#f5e642] rounded px-2 py-1 inline-block">
//                   <span className="font-mono font-bold text-gray-900 text-sm tracking-widest whitespace-pre">{fb.systemText}</span>
//                 </div>
//                 <p className="text-xs text-slate-500 mt-2">Confidence: {fb.confidence}%</p>
//               </div>
//               <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
//                 <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1"><CheckCircle size={10} /> User Correction</p>
//                 <div className="bg-[#f5e642] rounded px-2 py-1 inline-block">
//                   <span className="font-mono font-bold text-gray-900 text-sm tracking-widest whitespace-pre">{fb.correctedText}</span>
//                 </div>
//                 <p className="text-xs text-slate-500 mt-2">Error Type: {fb.errorType}</p>
//               </div>
//             </div>

//             {fb.notes && (
//               <div className="bg-white/[0.03] rounded-lg px-3 py-2">
//                 <p className="text-xs text-slate-500">Notes: <span className="text-slate-300">{fb.notes}</span></p>
//               </div>
//             )}

//             {fb.status === "pending" && (
//               <div className="flex gap-2 pt-1">
//                 <button
//                   onClick={() => onApprove(fb.id)}
//                   className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-medium transition-all"
//                 >
//                   <ThumbsUp size={13} /> Approve & Send to AI Training Pipeline
//                 </button>
//                 <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition-all">
//                   <X size={13} /> Reject
//                 </button>
//               </div>
//             )}
//             {fb.status === "approved" && (
//               <div className="flex items-center gap-2 text-xs text-emerald-400">
//                 <CheckCircle size={12} />
//                 <span>Correction approved and queued for next training cycle</span>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── DASHBOARD OVERVIEW ───────────────────────────────────────────────────────

// function DashboardOverview({ onNavigate }) {
//   const stats = [
//     { label: "Total Scans Today", value: "1,284", delta: "+12.4%", color: "violet" },
//     { label: "Avg Confidence", value: "93.7%", delta: "+0.8%", color: "emerald" },
//     { label: "Pending Corrections", value: "7", delta: "-2", color: "amber" },
//     { label: "Model Accuracy", value: "97.2%", delta: "+0.3%", color: "sky" },
//   ];

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-xl font-semibold text-white">Dashboard Overview</h2>
//         <p className="text-sm text-slate-400 mt-0.5">AI-Powered License Plate Recognition System · June 15, 2025</p>
//       </div>

//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//         {stats.map(({ label, value, delta, color }) => (
//           <div key={label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
//             <p className="text-xs text-slate-500 mb-2">{label}</p>
//             <p className={`text-2xl font-bold ${color === "violet" ? "text-violet-300" : color === "emerald" ? "text-emerald-300" : color === "amber" ? "text-amber-300" : "text-sky-300"}`}>{value}</p>
//             <p className={`text-xs mt-1 ${delta.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{delta} vs yesterday</p>
//           </div>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5">
//           <div className="flex items-center justify-between mb-4">
//             <p className="text-sm font-semibold text-slate-200">Recent Detections</p>
//             <button onClick={() => onNavigate("history")} className="text-xs text-violet-400 hover:text-violet-300">View all →</button>
//           </div>
//           <div className="space-y-2.5">
//             {HISTORY_DATA.slice(0, 4).map(r => (
//               <div key={r.id} className="flex items-center gap-3">
//                 <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${confidenceDot(r.confidence)}`} />
//                 <PlateDisplay plate={r.plate} size="sm" />
//                 <div className="flex-1">
//                   <p className="text-xs text-slate-400">{r.source}</p>
//                 </div>
//                 <span className={`text-xs px-1.5 py-0.5 rounded border ${confidenceColor(r.confidence)}`}>{r.confidence}%</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5">
//           <p className="text-sm font-semibold text-slate-200 mb-4">Detection Sources</p>
//           {[
//             { label: "Image Upload", pct: 42, color: "bg-sky-400" },
//             { label: "Live Stream", pct: 35, color: "bg-emerald-400" },
//             { label: "Video Upload", pct: 23, color: "bg-purple-400" },
//           ].map(({ label, pct, color }) => (
//             <div key={label} className="mb-3">
//               <div className="flex justify-between text-xs text-slate-400 mb-1.5">
//                 <span>{label}</span>
//                 <span>{pct}%</span>
//               </div>
//               <div className="h-2 bg-white/5 rounded-full overflow-hidden">
//                 <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
//               </div>
//             </div>
//           ))}

//           <div className="mt-5 pt-4 border-t border-white/8 grid grid-cols-2 gap-3">
//             {[
//               { label: "1-Line Standard", count: "68%", icon: Layers },
//               { label: "2-Line Square", count: "32%", icon: Layers },
//             ].map(({ label, count, icon: Icon }) => (
//               <div key={label} className="flex items-center gap-2 bg-white/[0.03] rounded-lg p-2.5">
//                 <Icon size={14} className="text-slate-400" />
//                 <div>
//                   <p className="text-sm font-semibold text-white">{count}</p>
//                   <p className="text-xs text-slate-500">{label}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="bg-gradient-to-r from-violet-500/5 to-cyan-500/5 border border-violet-500/15 rounded-2xl p-5">
//         <div className="flex items-start gap-4">
//           <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
//             <Activity size={18} className="text-violet-400" />
//           </div>
//           <div className="flex-1">
//             <p className="font-semibold text-slate-200 mb-1">AI Model Status</p>
//             <p className="text-sm text-slate-400">YOLOv11 + CRNN pipeline is running optimally. Last training update: 3 days ago. 2 pending feedback items ready for next training cycle.</p>
//           </div>
//           <button onClick={() => onNavigate("feedback")} className="flex-shrink-0 flex items-center gap-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/20 text-violet-400 rounded-xl px-3 py-2 text-sm font-medium transition-all">
//             Review <ChevronRight size={14} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── MAIN APP ─────────────────────────────────────────────────────────────────

// export default function App() {
//   const [page, setPage] = useState("dashboard");
//   const [feedbackModal, setFeedbackModal] = useState(null);
//   const [feedbacks, setFeedbacks] = useState(FEEDBACK_DATA);
//   const [toast, setToast] = useState(null);
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const showToast = (message, type = "success") => setToast({ message, type });

//   const handleReportError = (scan) => setFeedbackModal(scan);
//   const handleFeedbackSubmit = ({ scan, corrected, errorType, notes }) => {
//     const newFb = {
//       id: `FB-${String(feedbacks.length + 1).padStart(3, "0")}`,
//       scanId: scan.id,
//       submittedAt: new Date().toLocaleString("sv-SE").replace("T", " "),
//       systemText: scan.plate,
//       correctedText: corrected,
//       errorType, notes, status: "pending", confidence: scan.confidence
//     };
//     setFeedbacks(prev => [newFb, ...prev]);
//     setFeedbackModal(null);
//     showToast("Feedback submitted successfully! Thank you for improving our model.", "success");
//   };
//   const handleApprove = (id) => {
//     setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: "approved" } : f));
//     showToast("Correction approved and queued for AI training pipeline.", "success");
//   };

//   const navItems = [
//     { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { id: "media", label: "Media Scan", icon: Image },
//     { id: "live", label: "Live Stream", icon: Radio },
//     { id: "history", label: "Scan History", icon: History },
//     { id: "feedback", label: "Feedback", icon: MessageSquare },
//   ];

//   const pendingCount = feedbacks.filter(f => f.status === "pending").length;

//   return (
//     <div className="min-h-screen bg-[#080c14] text-white flex" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
//         * { box-sizing: border-box; }
//         ::-webkit-scrollbar { width: 4px; }
//         ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
//         .animate-fade-in { animation: fadeIn 0.4s ease; }
//         .animate-slide-up { animation: slideUp 0.3s ease; }
//         @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
//         @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
//         canvas { display: block; }
//         select option { background: #1e2433; }
//       `}</style>

//       {/* Sidebar */}
//       <aside className={`${sidebarOpen ? "w-56" : "w-16"} flex-shrink-0 bg-[#0d1117] border-r border-white/[0.06] flex flex-col transition-all duration-300`}>
//         <div className="px-4 py-5 border-b border-white/[0.06] flex items-center gap-3">
//           <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
//             <Shield size={14} className="text-white" />
//           </div>
//           {sidebarOpen && (
//             <div>
//               <p className="text-sm font-bold text-white leading-none">LPR System</p>
//               <p className="text-xs text-slate-500 mt-0.5">v2.4.1</p>
//             </div>
//           )}
//         </div>

//         <nav className="flex-1 p-2 space-y-0.5">
//           {navItems.map(({ id, label, icon: Icon }) => {
//             const active = page === id;
//             return (
//               <button
//                 key={id}
//                 onClick={() => setPage(id)}
//                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
//                   ${active ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}
//               >
//                 <Icon size={16} className="flex-shrink-0" />
//                 {sidebarOpen && <span>{label}</span>}
//                 {id === "feedback" && pendingCount > 0 && (
//                   <span className={`${sidebarOpen ? "ml-auto" : "absolute top-1 right-1"} bg-amber-500 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center`}>
//                     {pendingCount}
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </nav>

//         <div className="p-3 border-t border-white/[0.06]">
//           <button
//             onClick={() => setSidebarOpen(p => !p)}
//             className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
//           >
//             <ChevronRight size={16} className={`transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
//           </button>
//         </div>
//       </aside>

//       {/* Main */}
//       <div className="flex-1 flex flex-col min-w-0">
//         {/* Top Bar */}
//         <header className="h-14 border-b border-white/[0.06] px-6 flex items-center justify-between bg-[#0a0f18]/80 backdrop-blur-sm flex-shrink-0">
//           <div className="flex items-center gap-1.5 text-xs">
//             <span className="text-slate-500">LPR</span>
//             <ChevronRight size={12} className="text-slate-600" />
//             <span className="text-slate-300 font-medium capitalize">{navItems.find(n => n.id === page)?.label}</span>
//           </div>
//           <div className="flex items-center gap-3">
//             {[
//               { icon: Cpu, label: "YOLOv11 + CRNN", status: "active", color: "emerald" },
//               { icon: Camera, label: "Camera Online", status: "active", color: "emerald" },
//               { icon: Zap, label: "45ms", status: "active", color: "sky" },
//             ].map(({ icon: Icon, label, color }) => (
//               <div key={label} className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border
//                 ${color === "emerald" ? "text-emerald-400 bg-emerald-400/8 border-emerald-400/15" : "text-sky-400 bg-sky-400/8 border-sky-400/15"}`}>
//                 <div className={`w-1.5 h-1.5 rounded-full ${color === "emerald" ? "bg-emerald-400" : "bg-sky-400"} animate-pulse`} />
//                 <Icon size={11} />
//                 <span>{label}</span>
//               </div>
//             ))}
//             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-400 flex items-center justify-center text-xs font-bold">A</div>
//           </div>
//         </header>

//         {/* Content */}
//         <main className="flex-1 overflow-y-auto p-6">
//           <div className="max-w-5xl mx-auto animate-fade-in">
//             {page === "dashboard" && <DashboardOverview onNavigate={setPage} />}
//             {page === "media" && <MediaScanPage />}
//             {page === "live" && <LiveStreamPage />}
//             {page === "history" && <ScanHistoryPage onReportError={handleReportError} />}
//             {page === "feedback" && <FeedbackPage feedbacks={feedbacks} onApprove={handleApprove} />}
//           </div>
//         </main>
//       </div>

//       {/* Feedback Modal */}
//       {feedbackModal && (
//         <FeedbackModal
//           scan={feedbackModal}
//           onClose={() => setFeedbackModal(null)}
//           onSubmit={handleFeedbackSubmit}
//         />
//       )}

//       {/* Toast */}
//       {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
//     </div>
//   );
// }
