"use client";

import React from "react";

export interface DashboardLogoProps {
  className?: string;
  animate?: boolean;
}

/**
 * DashboardLogo component using the exact hexagon SVG, Git branch nodes,
 * trending analytics arrow, and real-time pulse indicator requested by the user,
 * with a 3D coin-spinning backwards animation (rotateY into 3D space) and enhanced clarity.
 */
export const DashboardLogo = ({ className = "w-11 h-12", animate = true }: DashboardLogoProps) => (
  <div
    className={`relative inline-flex items-center justify-center group ${className}`}
    style={{ perspective: "800px" }}
  >
    {/* 3D Coin Container - Spinning backwards around the 3D Y-axis */}
    <div
      className={`w-full h-full flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105 ${
        animate ? "animate-coin-spin group-hover:[animation-duration:2.5s]" : ""
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <svg
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-md overflow-visible"
      >
        <defs>
          {/* Clip path heksagon presisi untuk efek kilau permukaan */}
          <clipPath id="logoHexClip">
            <path d="M50 4 L92 27 L92 73 L50 96 L8 73 L8 27 Z" />
          </clipPath>

          {/* Gradien Heksagon Luar - Lebih vibrant dan tajam */}
          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Gradien Shading 3D Dinding Dalam */}
          <linearGradient id="innerShade" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#1e184a" />
            <stop offset="100%" stopColor="#2e2b69" />
          </linearGradient>

          {/* Gradien Sheen Kilauan (Shimmer Light Flare) */}
          <linearGradient id="sparkleSheenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Glow Filter untuk Bintang Berkilau (Sparkles) */}
          <filter id="sparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="#38bdf8"
              floodOpacity="0.9"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.75" />
          </filter>

          {/* Glow Filter untuk Grafik Analytics agar sangat jelas */}
          <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1.5"
              floodColor="#ffffff"
              floodOpacity="0.8"
            />
          </filter>

          {/* Shadow Filter untuk Keseluruhan Logo */}
          <filter id="logoDepth" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#4f46e5" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Frame Heksagon Luar - Garis dipertebal & diperjelas */}
        <path
          d="M50 4 L92 27 L92 73 L50 96 L8 73 L8 27 Z"
          fill="url(#hexGrad)"
          stroke="#818cf8"
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="url(#logoDepth)"
        />

        {/* Dinding Dalam / Efek Dimensi 3D */}
        <path
          d="M50 14 L82 32 L82 68 L50 86 L18 68 L18 32 Z"
          fill="url(#innerShade)"
          stroke="#4338ca"
          strokeWidth="1.2"
          opacity="0.95"
        />

        {/* Efek Kilau Permukaan (Shimmer Sheen) - Melintas elegan di atas koin */}
        <g clipPath="url(#logoHexClip)" className="pointer-events-none">
          <g className={animate ? "animate-shimmer-sweep" : "hidden"}>
            <rect
              x="-60"
              y="-30"
              width="50"
              height="180"
              fill="url(#sparkleSheenGrad)"
              transform="rotate(28 50 55)"
            />
          </g>
        </g>

        {/* Garis Git Branch & Node - Stroke dipertebal agar sangat kontras */}
        <path
          d="M32 68 V45 C32 38 42 34 52 34 H68"
          stroke="#60a5fa"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path d="M52 34 V52" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />

        {/* Panah Branch */}
        <path
          d="M64 28 L72 34 L64 40"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Node Lingkaran Git - Lebih kontras dengan stroke biru terang */}
        <circle cx="32" cy="58" r="4.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
        <circle cx="52" cy="52" r="4" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />

        {/* Grafik Analytics Naik - Sangat jelas dan tajam dengan filter glow */}
        <path
          d="M28 66 L42 56 L52 62 L66 44"
          stroke="#ffffff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#whiteGlow)"
        />
        <path
          d="M60 44 H66 V50"
          stroke="#ffffff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#whiteGlow)"
        />

        {/* Indikator Real-time Pulse - Radar berputar */}
        <circle
          cx="68"
          cy="68"
          r="10"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="4 3"
          opacity="0.85"
        />
        <circle cx="68" cy="68" r="5" fill="#38bdf8" className="animate-pulse" />

        {/* === EFEK BERKILAU: BINTANG GLINT (SPARKLES) === */}

        {/* Sparkle 1: Kilauan di Ujung Panah Grafik Naik (66, 44) */}
        <g transform="translate(66, 44)" className="pointer-events-none">
          <g
            className={animate ? "animate-sparkle-1" : "hidden"}
            style={{ transformOrigin: "0 0" }}
          >
            <path
              d="M 0 -8 Q 1 -1 8 0 Q 1 1 0 8 Q -1 1 -8 0 Q -1 -1 0 -8 Z"
              fill="#ffffff"
              filter="url(#sparkleGlow)"
            />
            <line
              x1="-3"
              y1="-3"
              x2="3"
              y2="3"
              stroke="#e0f2fe"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <line
              x1="-3"
              y1="3"
              x2="3"
              y2="-3"
              stroke="#e0f2fe"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />
          </g>
        </g>

        {/* Sparkle 2: Kilauan di Sudut Kanan Atas Heksagon (80, 22) */}
        <g transform="translate(80, 22)" className="pointer-events-none">
          <g
            className={animate ? "animate-sparkle-2" : "hidden"}
            style={{ transformOrigin: "0 0" }}
          >
            <path
              d="M 0 -6.5 Q 0.8 -0.8 6.5 0 Q 0.8 0.8 0 6.5 Q -0.8 0.8 -6.5 0 Q -0.8 -0.8 0 -6.5 Z"
              fill="#ffffff"
              filter="url(#sparkleGlow)"
            />
            <circle cx="0" cy="0" r="1.2" fill="#818cf8" />
          </g>
        </g>

        {/* Sparkle 3: Kilauan di Sisi Kiri Atas Heksagon (22, 34) */}
        <g transform="translate(22, 34)" className="pointer-events-none">
          <g
            className={animate ? "animate-sparkle-3" : "hidden"}
            style={{ transformOrigin: "0 0" }}
          >
            <path
              d="M 0 -6 Q 0.7 -0.7 6 0 Q 0.7 0.7 0 6 Q -0.7 0.7 -6 0 Q -0.7 -0.7 0 -6 Z"
              fill="#ffffff"
              filter="url(#sparkleGlow)"
            />
            <circle cx="0" cy="0" r="1.2" fill="#38bdf8" />
          </g>
        </g>

        {/* Sparkle 4: Kilauan Halus di Puncak Heksagon (50, 7) */}
        <g transform="translate(50, 7)" className="pointer-events-none">
          <g
            className={animate ? "animate-sparkle-4" : "hidden"}
            style={{ transformOrigin: "0 0" }}
          >
            <path
              d="M 0 -5 Q 0.6 -0.6 5 0 Q 0.6 0.6 0 5 Q -0.6 0.6 -5 0 Q -0.6 -0.6 0 -5 Z"
              fill="#ffffff"
              filter="url(#sparkleGlow)"
            />
            <circle cx="0" cy="0" r="1" fill="#c084fc" />
          </g>
        </g>
      </svg>
    </div>
  </div>
);

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

export function Logo({ size = "md", showText = true, className = "", animate = true }: LogoProps) {
  // Ukuran diperbesar sedikit agar logo dan detail di dalamnya terlihat jelas
  const sizeConfig = {
    sm: {
      icon: "w-11 h-12",
      title: "text-base",
      subtitle: "text-[10px]",
    },
    md: {
      icon: "w-13 h-14",
      title: "text-lg",
      subtitle: "text-[11px]",
    },
    lg: {
      icon: "w-22 h-24",
      title: "text-2xl",
      subtitle: "text-xs",
    },
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-3.5 select-none group cursor-pointer ${className}`}
    >
      {/* 3D Coin Rotating DashboardLogo */}
      <DashboardLogo className={sizeConfig.icon} animate={animate} />

      {/* Typography: .Dashboard GITHUB REAL-TIME */}
      {showText && (
        <div className="flex flex-col">
          <div
            className={`font-bold tracking-tight text-[var(--text-primary)] ${sizeConfig.title} flex items-center leading-tight transition-colors`}
          >
            <span className="text-[#38bdf8] dark:text-[#60a5fa] mr-0.5 inline-block animate-pulse">
              .
            </span>
            <span>Dashboard</span>
          </div>
          <div
            className={`font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors ${sizeConfig.subtitle} leading-normal`}
          >
            GITHUB REAL-TIME
          </div>
        </div>
      )}
    </div>
  );
}
