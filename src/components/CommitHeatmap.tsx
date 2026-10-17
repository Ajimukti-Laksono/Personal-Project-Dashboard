"use client";

import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";

interface CommitHeatmapProps {
  data: Record<string, number>; // { "YYYY-MM-DD": count }
  isLoading?: boolean;
}

export function CommitHeatmap({ data, isLoading }: CommitHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
  } | null>(null);

  // Generate 52 weeks of dates leading up to today
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: string; count: number }>> = [];
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 364); // 52 weeks

    const current = new Date(startDate);
    let currentWeek: Array<{ date: string; count: number }> = [];

    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const count = data[dateStr] || 0;

      currentWeek.push({ date: dateStr, count });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [data]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-[var(--border-main)] hover:bg-[var(--text-muted)]/30";
    if (count <= 2) return "bg-[#5c62ec]/30 hover:bg-[#5c62ec]/50";
    if (count <= 5) return "bg-[#5c62ec]/60 hover:bg-[#5c62ec]/80";
    if (count <= 9) return "bg-[#5c62ec] hover:bg-[#4e53db]";
    return "bg-[#8b91ff] shadow-sm shadow-[#5c62ec]/40 hover:scale-125";
  };

  const totalCommitsInYear = useMemo(() => {
    return Object.values(data).reduce((acc, c) => acc + c, 0);
  }, [data]);

  if (isLoading) {
    return (
      <div className="card-surface p-5 sm:p-6 mb-8">
        <div className="h-6 w-48 bg-[var(--border-main)]/50 rounded-lg animate-pulse mb-4" />
        <div className="h-32 bg-[var(--border-main)]/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="card-surface p-5 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#5c62ec]/10 text-[#5c62ec]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Commit Heatmap
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {totalCommitsInYear} commit tercatat dalam 12 bulan terakhir
            </p>
          </div>
        </div>

        {/* Hover date tooltip preview */}
        <div className="text-xs font-medium text-[var(--text-secondary)] min-h-[1.25rem] flex items-center">
          {hoveredDay ? (
            <span className="text-[var(--text-primary)] font-semibold bg-[var(--accent-soft)] px-2.5 py-1 rounded-lg border border-[var(--accent-border)]">
              {hoveredDay.count} commit pada {hoveredDay.date}
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">
              Arahkan kursor ke kotak untuk melihat detail harian
            </span>
          )}
        </div>
      </div>

      {/* Grid container with horizontal scroll on small screens */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          {/* Weekday indicator & Grid */}
          <div className="flex gap-1.5 items-start">
            <div className="flex flex-col gap-1 text-[10px] text-[var(--text-muted)] pt-0.5 pr-1 select-none font-medium">
              <span className="h-3 leading-3">Sen</span>
              <span className="h-3 leading-3 opacity-0">Sel</span>
              <span className="h-3 leading-3">Rab</span>
              <span className="h-3 leading-3 opacity-0">Kam</span>
              <span className="h-3 leading-3">Jum</span>
              <span className="h-3 leading-3 opacity-0">Sab</span>
              <span className="h-3 leading-3">Min</span>
            </div>

            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3 h-3 rounded-[3px] transition-all cursor-pointer ${getColorClass(
                        day.count,
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-4 text-[11px] text-[var(--text-secondary)]">
            <span>Lebih sedikit</span>
            <div className="w-3 h-3 rounded-[3px] bg-[var(--border-main)]" />
            <div className="w-3 h-3 rounded-[3px] bg-[#5c62ec]/30" />
            <div className="w-3 h-3 rounded-[3px] bg-[#5c62ec]/60" />
            <div className="w-3 h-3 rounded-[3px] bg-[#5c62ec]" />
            <div className="w-3 h-3 rounded-[3px] bg-[#8b91ff]" />
            <span>Lebih banyak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
