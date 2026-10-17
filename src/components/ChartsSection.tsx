"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";

interface DailyCommit {
  date: string;
  label: string;
  commits: number;
}

interface LanguageItem {
  name: string;
  count: number;
  percentage: number;
}

interface ChartsSectionProps {
  dailyCommits: DailyCommit[];
  languages: LanguageItem[];
  isLoading?: boolean;
  theme?: "dark" | "light";
}

const PALETTE = [
  "#5c62ec", // Primary Indigo
  "#38bdf8", // Sky Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
];

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f59e0b",
  Python: "#38bdf8",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#8b5cf6",
  PHP: "#4F5D95",
  Java: "#b07219",
  Ruby: "#701516",
  Shell: "#10b981",
  C: "#64748b",
  "C++": "#ec4899",
  "C#": "#178600",
  Kotlin: "#a855f7",
  Swift: "#f97316",
  Dart: "#00B4AB",
};

export function ChartsSection({
  dailyCommits,
  languages,
  isLoading,
  theme = "dark",
}: ChartsSectionProps) {
  const [timeFilter, setTimeFilter] = useState<"30d" | "14d" | "7d">("14d");

  // Filtered commits based on range
  const displayCommits = useMemo(() => {
    if (timeFilter === "7d") {
      return dailyCommits.slice(-7);
    }
    if (timeFilter === "14d") {
      return dailyCommits.slice(-14);
    }
    return dailyCommits.slice(-30);
  }, [dailyCommits, timeFilter]);

  const totalPeriodCommits = useMemo(() => {
    return displayCommits.reduce((acc, curr) => acc + curr.commits, 0);
  }, [displayCommits]);

  const totalReposInLanguages = useMemo(() => {
    return languages.reduce((acc, curr) => acc + curr.count, 0);
  }, [languages]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-[var(--border-main)]/50 animate-pulse border border-[var(--border-main)]" />
        <div className="h-80 rounded-2xl bg-[var(--border-main)]/50 animate-pulse border border-[var(--border-main)]" />
      </div>
    );
  }

  const axisStroke = theme === "dark" ? "#5e6f88" : "#8d9bb0";
  const surfaceStroke = theme === "dark" ? "#131926" : "#ffffff";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* 1. Live Analytics (Area Chart) - Matching FieldPro Live Analytics */}
      <div className="lg:col-span-2 card-surface p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5c62ec] animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  Live Analytics
                </h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Aktivitas komit harian & tren pengembangan
              </p>
            </div>

            {/* Time Filter Dropdown / Pill */}
            <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-main)] text-xs font-semibold">
              <button
                onClick={() => setTimeFilter("30d")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeFilter === "30d"
                    ? "bg-[#5c62ec] text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setTimeFilter("14d")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeFilter === "14d"
                    ? "bg-[#5c62ec] text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                14 Hari
              </button>
              <button
                onClick={() => setTimeFilter("7d")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeFilter === "7d"
                    ? "bg-[#5c62ec] text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                7 Hari
              </button>
            </div>
          </div>

          {/* Large Stat Metric (FieldPro style: $48,750 ↑ 15%) */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {totalPeriodCommits} Commits
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18% vs periode lalu</span>
            </div>
          </div>
        </div>

        {/* Area Chart Container */}
        <div className="h-56 w-full mt-2">
          <ResponsiveContainer key={`area-${theme}-${timeFilter}`} width="100%" height="100%">
            <AreaChart data={displayCommits} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="primaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5c62ec" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#5c62ec" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xl text-xs">
                        <p className="font-medium text-[var(--text-secondary)]">{label}</p>
                        <p className="text-base font-bold text-[#5c62ec] dark:text-[#8b91ff] mt-0.5">
                          {payload[0].value} Commit
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="#5c62ec"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#primaryAreaGradient)"
                activeDot={{
                  r: 6,
                  fill: "#5c62ec",
                  stroke: surfaceStroke,
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Language Distribution (Donut Chart) - Matching FieldPro Job Distribution */}
      <div className="card-surface p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Distribusi Bahasa
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Komposisi teknologi repositori
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-main)] px-2.5 py-1 rounded-lg border border-[var(--border-main)]">
              <BarChart2 className="w-3.5 h-3.5 text-[#5c62ec]" />
              <span>Aktif</span>
            </div>
          </div>

          {languages.length === 0 ? (
            <div className="text-center py-12 text-xs text-[var(--text-muted)]">
              Belum ada data bahasa pemrograman
            </div>
          ) : (
            <>
              {/* Donut Chart with Centered Total */}
              <div className="relative h-44 w-full flex items-center justify-center my-1">
                <ResponsiveContainer
                  key={`pie-${theme}-${languages.length}`}
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={languages}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="count"
                      stroke={surfaceStroke}
                      strokeWidth={2}
                    >
                      {languages.map((entry, index) => {
                        const color =
                          LANGUAGE_COLORS[entry.name] || PALETTE[index % PALETTE.length];
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as LanguageItem;
                          return (
                            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xl text-xs">
                              <p className="font-bold text-[var(--text-primary)]">{item.name}</p>
                              <p className="text-[var(--text-secondary)] font-medium">
                                {item.count} Repo ({item.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    {totalReposInLanguages}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Total Repo
                  </span>
                </div>
              </div>

              {/* Clean Legend List (FieldPro style) */}
              <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
                {languages.slice(0, 5).map((lang, idx) => {
                  const color = LANGUAGE_COLORS[lang.name] || PALETTE[idx % PALETTE.length];
                  return (
                    <div
                      key={lang.name}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold truncate text-[var(--text-primary)]">
                          {lang.name}
                        </span>
                      </div>
                      <span className="text-[var(--text-secondary)] font-semibold shrink-0">
                        {lang.count} ({lang.percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <p className="text-[11px] text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border-main)]">
          Dihitung berdasarkan bahasa utama tiap repositori GitHub.
        </p>
      </div>
    </div>
  );
}
