"use client";

import React, { useEffect, useRef } from "react";

export interface CircuitGridBackgroundProps {
  isDarkMode?: boolean;
}

/**
 * Animated living Circuit Grid Background with traveling light pulses,
 * glowing junction flares, and orthogonal PCB trace lines.
 * Supports both Day Mode (Light) and Night Mode (Dark).
 */
export const CircuitGridBackground: React.FC<CircuitGridBackgroundProps> = ({
  isDarkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const step = 64; // Grid cell size in pixels

    // Initialize traveling light pulses along the grid lines
    const pulseCount = window.innerWidth > 768 ? 16 : 8;
    const pulses = Array.from({ length: pulseCount }, () => ({
      x: Math.floor(Math.random() * (window.innerWidth / step)) * step,
      y: Math.floor(Math.random() * (window.innerHeight / step)) * step,
      horizontal: Math.random() > 0.5,
      dir: Math.random() > 0.5 ? 1 : -1,
      speed: 1.2 + Math.random() * 1.8,
      len: 45 + Math.random() * 55,
      color: Math.random() > 0.5 ? "cyan" : "indigo",
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Subtle Dashed Circuit Grid Lines
      ctx.beginPath();
      ctx.strokeStyle = isDarkMode
        ? "rgba(148, 163, 184, 0.08)"
        : "rgba(99, 102, 241, 0.09)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]); // Thin dashed line pattern

      for (let x = 0; x < canvas.width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash for light pulses

      // 2. Draw Traveling Light Pulses along the grid
      pulses.forEach((p) => {
        const glowColor =
          p.color === "cyan"
            ? isDarkMode
              ? "#38bdf8"
              : "#0284c7"
            : isDarkMode
              ? "#818cf8"
              : "#6366f1";

        const headX = p.x;
        const headY = p.y;
        const tailX = p.horizontal ? p.x - p.dir * p.len : p.x;
        const tailY = p.horizontal ? p.y : p.y - p.dir * p.len;

        const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, "rgba(0, 0, 0, 0)");
        grad.addColorStop(1, glowColor);

        // Trail line
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = isDarkMode ? 2.5 : 2;
        ctx.lineCap = "round";
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        // Glowing Head Flare
        ctx.beginPath();
        ctx.arc(headX, headY, isDarkMode ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = isDarkMode ? 10 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Move pulse along grid axis
        if (p.horizontal) {
          p.x += p.speed * p.dir;
          if (p.x > canvas.width + 100 || p.x < -100) {
            p.x = p.dir > 0 ? -50 : canvas.width + 50;
            p.y = Math.floor(Math.random() * (canvas.height / step)) * step;
          }
        } else {
          p.y += p.speed * p.dir;
          if (p.y > canvas.height + 100 || p.y < -100) {
            p.y = p.dir > 0 ? -50 : canvas.height + 50;
            p.x = Math.floor(Math.random() * (canvas.width / step)) * step;
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-colors duration-500 z-0 overflow-hidden ${
        isDarkMode ? "bg-[#090d16]" : "bg-[#f8fafc]"
      }`}
      aria-hidden="true"
    >
      {/* Canvas for dynamic grid & traveling light pulses */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* SVG Layer for Curved Orthogonal Circuit Traces & Glowing Nodes (as seen in reference images) */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${
          isDarkMode ? "opacity-35 stroke-slate-600/60" : "opacity-30 stroke-indigo-400/50"
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Upper left to center loop */}
          <path d="M 0 192 H 18% Q 21% 192 21% 224 V 384 Q 21% 416 24% 416 H 38%" />
          {/* Top center down trace */}
          <path d="M 52% 0 V 128 Q 52% 160 55% 160 H 76% Q 79% 160 79% 192 V 320" />
          {/* Right horizontal circuit trace */}
          <path d="M 100% 256 H 82% Q 79% 256 79% 288 V 512 Q 79% 544 76% 544 H 65%" />
          {/* Lower left trace */}
          <path d="M 14% 100% V 640 Q 14% 608 17% 608 H 32% Q 35% 608 35% 576 V 480" />
          {/* Lower right to center trace */}
          <path d="M 68% 100% V 704 Q 68% 672 65% 672 H 48% Q 45% 672 45% 640 V 544" />

          {/* Solder junction nodes */}
          <circle
            cx="21%"
            cy="192"
            r="3"
            className={isDarkMode ? "fill-cyan-400" : "fill-indigo-500"}
          />
          <circle
            cx="79%"
            cy="192"
            r="3"
            className={isDarkMode ? "fill-indigo-400" : "fill-blue-600"}
          />
          <circle
            cx="35%"
            cy="480"
            r="3"
            className={isDarkMode ? "fill-cyan-400" : "fill-indigo-500"}
          />
          <circle
            cx="76%"
            cy="544"
            r="3"
            className={isDarkMode ? "fill-indigo-400" : "fill-blue-600"}
          />
        </g>
      </svg>

      {/* Subtle Ambient Radial Lighting Haze */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          isDarkMode
            ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(56,189,248,0.06),transparent_80%)]"
            : "bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(99,102,241,0.05),transparent_80%)]"
        }`}
      />
    </div>
  );
};
