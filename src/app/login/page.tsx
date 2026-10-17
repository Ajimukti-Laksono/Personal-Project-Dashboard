"use client";

import React, { useState, useEffect, useRef, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Masukkan password dashboard Anda.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          remainingAttempts?: number;
        };

        if (!res.ok) {
          if (res.status === 429) {
            setError(data.error || "Terlalu banyak percobaan. Silakan coba lagi nanti.");
          } else if (data.remainingAttempts !== undefined) {
            setError(`Password salah. Sisa percobaan: ${data.remainingAttempts}`);
          } else {
            setError(data.error || "Gagal masuk. Periksa kembali password Anda.");
          }
          return;
        }

        setIsSuccess(true);
        setTimeout(() => {
          router.push(from);
          router.refresh();
        }, 650);
      } catch {
        setError("Terjadi gangguan koneksi jaringan. Coba lagi.");
      }
    });
  };

  return (
    <div className="relative z-10 w-full max-w-[460px] mx-auto px-2">
      {/* ================= GLASSMORPHISM LOGIN CARD ================= */}
      <div
        className="relative rounded-[2.5rem] p-8 sm:p-10 transition-all duration-300"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.03) 100%), rgba(15, 23, 42, 0.42)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          boxShadow:
            "0 35px 85px -15px rgba(0, 0, 0, 0.8), inset 0 1.5px 2px rgba(255, 255, 255, 0.32), inset 0 -1px 1px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Tombol Kembali ke Dashboard jika batal login */}
        <button
          type="button"
          onClick={() => router.push(from && from !== "/login" ? from : "/")}
          className="group absolute top-5 left-5 sm:top-6 sm:left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-sm z-20"
          title="Kembali ke Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali</span>
        </button>

        {/* Header & 3D Hexagon Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Glowing 3D Hexagon Badge Container */}
          <div className="logo-glow relative mb-4 p-1">
            {/* Soft radiant ambient glow behind logo */}
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-xl" />

            <svg
              viewBox="0 0 100 110"
              className="w-18 h-18 sm:w-20 sm:h-20 drop-shadow-[0_8px_25px_rgba(99,102,241,0.65)] relative z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="hexEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="45%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="innerBg" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Outer Hexagon with 3D Bevel effect */}
              <path
                d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z"
                fill="url(#innerBg)"
                stroke="url(#hexEdge)"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Inner Hex Rim */}
              <path
                d="M50 14 L80 32 L80 68 L50 86 L20 68 L20 32 Z"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                fill="none"
              />

              {/* Git Branch Tree */}
              <path
                d="M34 68 V45 C34 38 42 34 52 34 H66"
                stroke="#93c5fd"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <path
                d="M52 34 V52"
                stroke="#93c5fd"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              {/* Arrow on branch */}
              <path
                d="M62 28 L70 34 L62 40"
                stroke="#93c5fd"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Branch nodes */}
              <circle cx="34" cy="58" r="3.5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="52" cy="52" r="3.5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="34" cy="40" r="3" fill="#60a5fa" />

              {/* Analytics Growth Line */}
              <path
                d="M26 73 L42 58 L54 66 L74 44"
                stroke="url(#arrowGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M65 44 H74 V53"
                stroke="url(#arrowGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Real-time SSE Pulse Rings */}
              <circle cx="70" cy="74" r="11" stroke="#38bdf8" strokeWidth="1.8" opacity="0.4" />
              <circle cx="70" cy="74" r="7" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />
              <circle cx="70" cy="74" r="3" fill="#38bdf8" />
            </svg>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-0.5">
            <span className="text-[#38bdf8] animate-pulse">.</span>Dashboard
          </h1>
          <p className="mt-1 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
            Personal Project &amp; GitHub Monitor
          </p>
        </div>

        {/* Inner Form Card Enclosure */}
        <div
          className="rounded-[1.75rem] p-5 sm:p-6"
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.08)",
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-slide-down">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="password-input"
                className="block text-[11px] font-bold tracking-wider text-slate-300 uppercase mb-2"
              >
                Password Dashboard
              </label>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan password Anda..."
                  disabled={isPending || isSuccess}
                  autoFocus
                  required
                  className="w-full pl-10 pr-11 py-3 text-xs sm:text-sm rounded-xl bg-white border border-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium shadow-sm disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isPending || isSuccess || !password}
              className="w-full relative group overflow-hidden py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: isSuccess
                  ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                  : "linear-gradient(135deg, #5b5ce6 0%, #686bf5 50%, #4e4ee0 100%)",
                boxShadow: isSuccess
                  ? "0 10px 25px -4px rgba(16, 185, 129, 0.55)"
                  : "0 10px 25px -4px rgba(91, 92, 230, 0.55)",
              }}
            >
              {/* Light shimmer sweep on button */}
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />

              <span className="relative flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memverifikasi...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Akses Diberikan!</span>
                  </>
                ) : (
                  <>
                    <span>Buka Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Subtitle / Footer info below card */}
      <div className="mt-5 text-center">
        <p className="text-[11px] leading-relaxed text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Real-time updates via GitHub Webhooks &amp; Server-Sent Events (SSE)
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Interactive Constellation / Particle Network with specific cluster clouds
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes: general drifting particles + specific constellation clusters matching Image 2
    const baseCount = width > 768 ? 55 : 28;
    const particles = Array.from({ length: baseCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    // Dense cluster 1 (mid-left around x: 12%, y: 32%)
    for (let i = 0; i < 18; i++) {
      particles.push({
        x: width * 0.12 + (Math.random() - 0.5) * (width * 0.14),
        y: height * 0.32 + (Math.random() - 0.5) * (height * 0.22),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.5 + 0.6,
        alpha: Math.random() * 0.55 + 0.25,
      });
    }

    // Dense cluster 2 (mid-right around x: 88%, y: 34%)
    for (let i = 0; i < 22; i++) {
      particles.push({
        x: width * 0.88 + (Math.random() - 0.5) * (width * 0.14),
        y: height * 0.34 + (Math.random() - 0.5) * (height * 0.24),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.5 + 0.6,
        alpha: Math.random() * 0.6 + 0.25,
      });
    }

    // Dense cluster 3 (bottom-left around x: 10%, y: 68%)
    for (let i = 0; i < 16; i++) {
      particles.push({
        x: width * 0.1 + (Math.random() - 0.5) * (width * 0.12),
        y: height * 0.68 + (Math.random() - 0.5) * (height * 0.2),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.4 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    // Dense cluster 4 (bottom-right around x: 89%, y: 72%)
    for (let i = 0; i < 16; i++) {
      particles.push({
        x: width * 0.89 + (Math.random() - 0.5) * (width * 0.12),
        y: height * 0.72 + (Math.random() - 0.5) * (height * 0.2),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.4 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 115) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(129, 140, 248, ${0.18 * (1 - dist / 115)})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing dots
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 180, 252, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#070b14] overflow-hidden font-sans select-none px-4 py-8">
      {/* ================= INLINE ANIMATION KEYFRAMES ================= */}
      <style>{`
        @keyframes floatSlow1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(16px, -20px) scale(1.03); }
          66% { transform: translate(-12px, 14px) scale(0.97); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-18px, 16px) scale(1.04); }
          66% { transform: translate(14px, -12px) scale(0.96); }
        }
        @keyframes floatSlow3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(16px, -14px) scale(1.04); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 16px rgba(99, 102, 241, 0.45)); }
          50% { opacity: 1; filter: drop-shadow(0 0 28px rgba(56, 189, 248, 0.85)); }
        }
        .orb-float-1 { animation: floatSlow1 20s ease-in-out infinite; }
        .orb-float-2 { animation: floatSlow2 24s ease-in-out infinite; }
        .orb-float-3 { animation: floatSlow3 18s ease-in-out infinite; }
        .logo-glow { animation: pulseGlow 4s ease-in-out infinite; }
      `}</style>

      {/* ================= 1. DEEP SPACE / SPOTLIGHT BACKGROUND ================= */}
      {/* Top-left soft spotlight haze */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 95% 80% at 22% 28%, #162447 0%, #0c1324 55%, #070b14 100%)",
        }}
      />

      {/* Ambient gradient lighting glow */}
      <div className="absolute top-[15%] left-[20%] w-[550px] h-[380px] bg-blue-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[450px] h-[350px] bg-indigo-900/20 blur-[130px] pointer-events-none" />

      {/* ================= 2. CIRCUIT TRACE & DEVELOPER GRID ================= */}
      {/* Developer square grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "3.5rem 3.5rem",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 90%)",
        }}
      />

      {/* Sleek Orthogonal Circuit Lines with Rounded Corners (matching Image 1 & 2) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30 stroke-slate-400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Top-center down and right loop */}
          <path d="M 50% 0 V 160 Q 50% 190 53% 190 H 72% Q 75% 190 75% 220 V 380" />
          {/* Left vertical to horizontal trace */}
          <path d="M 0 260 H 22% Q 25% 260 25% 290 V 460 Q 25% 490 28% 490 H 42%" />
          {/* Bottom left circuit trace */}
          <path d="M 18% 100% V 680 Q 18% 650 21% 650 H 34% Q 37% 650 37% 620 V 520" />
          {/* Right horizontal circuit trace */}
          <path d="M 100% 320 H 76% Q 73% 320 73% 350 V 560 Q 73% 590 70% 590 H 58%" />
          {/* Bottom center circuit line */}
          <path d="M 50% 100% V 720 Q 50% 690 47% 690 H 32% Q 29% 690 29% 660 V 580" />

          {/* Solder / Node junction points */}
          <circle cx="22%" cy="260" r="2.5" fill="#818cf8" stroke="none" />
          <circle cx="75%" cy="380" r="2.5" fill="#38bdf8" stroke="none" />
          <circle cx="37%" cy="520" r="2.5" fill="#818cf8" stroke="none" />
          <circle cx="70%" cy="590" r="2.5" fill="#a855f7" stroke="none" />
        </g>
      </svg>

      {/* ================= 3. CONSTELLATION PARTICLES CANVAS ================= */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* ================= 4. REALISTIC 3D FLOATING SPHERES (ORBS) ================= */}

      {/* SPHERE 1: Top-Left Purple/Blue Sphere (matching Image 1 & 2) */}
      <div className="orb-float-1 absolute top-[24%] left-[12%] sm:left-[17%] w-20 h-20 sm:w-26 sm:h-26 rounded-full pointer-events-none z-0">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #5b55eb 0%, #3e33b6 38%, #271e80 65%, #151148 85%, #090722 100%)",
            boxShadow:
              "0 24px 50px -10px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.35), inset 0 -3px 6px rgba(0, 0, 0, 0.6)",
          }}
        />
      </div>

      {/* SPHERE 2: Bottom-Left Blue Sphere (matching Image 1 & 2) */}
      <div className="orb-float-2 absolute bottom-[20%] left-[20%] sm:left-[28%] w-30 h-30 sm:w-38 sm:h-38 rounded-full pointer-events-none z-0">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, #38bdf8 0%, #2563eb 34%, #1d4ed8 60%, #162456 82%, #080f24 100%)",
            boxShadow:
              "0 28px 60px -12px rgba(0, 0, 0, 0.85), inset 0 2.5px 6px rgba(255, 255, 255, 0.38), inset 0 -4px 8px rgba(0, 0, 0, 0.65)",
          }}
        />
      </div>

      {/* SPHERE 3: Mid-Right Vibrant Cyan Sphere with Radiant Glow (matching Image 1 & 2) */}
      <div className="orb-float-3 absolute top-[30%] right-[16%] sm:right-[23%] w-26 h-26 sm:w-32 sm:h-32 rounded-full pointer-events-none z-0">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, #67e8f9 0%, #06b6d4 30%, #0284c7 56%, #1e40af 82%, #081a3e 100%)",
            boxShadow:
              "0 0 60px rgba(6, 182, 212, 0.55), 0 24px 50px -10px rgba(0, 0, 0, 0.75), inset 0 3px 6px rgba(255, 255, 255, 0.5), inset 0 -3px 7px rgba(0, 0, 0, 0.55)",
          }}
        />
      </div>

      {/* SPHERE 4: Bottom-Right Deep Purple Sphere (matching Image 1 & 2) */}
      <div className="orb-float-1 absolute bottom-[18%] right-[10%] sm:right-[15%] w-24 h-24 sm:w-32 sm:h-32 rounded-full pointer-events-none z-0">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #c084fc 0%, #9333ea 35%, #6b21a8 65%, #3b0764 85%, #140324 100%)",
            boxShadow:
              "0 24px 50px -10px rgba(0, 0, 0, 0.8), inset 0 2.5px 5px rgba(255, 255, 255, 0.32), inset 0 -3px 6px rgba(0, 0, 0, 0.6)",
          }}
        />
      </div>

      {/* DISTANT BLURRED ORBS (Distant depth layers) */}
      <div className="orb-float-2 absolute top-[5%] right-[29%] w-12 h-12 rounded-full pointer-events-none blur-[2.5px] opacity-75">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #38bdf8 0%, #4338ca 70%, #1e1b4b 100%)",
            boxShadow: "0 0 22px rgba(56, 189, 248, 0.45)",
          }}
        />
      </div>

      <div className="orb-float-3 absolute top-[11%] right-[16%] w-8 h-8 rounded-full pointer-events-none blur-[3.5px] opacity-65">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #a855f7 0%, #3b0764 100%)",
          }}
        />
      </div>

      {/* ================= 5. FORM CARD COMPONENT ================= */}
      <Suspense
        fallback={
          <div className="relative z-10 text-xs font-semibold text-slate-400">
            Memuat formulir login...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
