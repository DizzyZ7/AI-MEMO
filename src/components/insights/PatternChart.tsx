"use client";

import { useMemo } from "react";
import { useMemoStore } from "@/store/memo-store";
import type { Mood } from "@/types/memo";

const moodColor: Record<Mood, string> = {
  POSITIVE: "bg-emerald-500",
  NEUTRAL: "bg-sky-500",
  NEGATIVE: "bg-rose-500",
};

export function PatternChart() {
  const memos = useMemoStore((state) => state.memos);
  const stats = useMemo(() => {
    const total = Math.max(memos.length, 1);
    const moods: Record<Mood, number> = {
      POSITIVE: 0,
      NEUTRAL: 0,
      NEGATIVE: 0,
    };
    const tagCount = new Map<string, number>();

    for (const memo of memos) {
      moods[memo.mood] += 1;
      memo.tags.forEach((tag) => tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1));
    }

    return {
      moods,
      total,
      tags: Array.from(tagCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    };
  }, [memos]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-base font-semibold">Настроение</h3>
        <div className="mt-5 space-y-4">
          {(Object.keys(stats.moods) as Mood[]).map((mood) => {
            const value = stats.moods[mood];
            const percent = Math.round((value / stats.total) * 100);
            const label =
              mood === "POSITIVE" ? "Позитив" : mood === "NEGATIVE" ? "Напряжение" : "Нейтрально";

            return (
              <div key={mood}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-muted-foreground">{percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={moodColor[mood]} style={{ width: `${percent}%`, height: "100%" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h3 className="text-base font-semibold">Повторяющиеся темы</h3>
        <div className="mt-5 grid gap-3">
          {stats.tags.map(([tag, count]) => {
            const width = Math.max(18, Math.round((count / stats.total) * 100));

            return (
              <div key={tag} className="grid grid-cols-[120px_1fr_32px] items-center gap-3 text-sm">
                <span className="truncate">#{tag}</span>
                <div className="h-8 overflow-hidden rounded-sm bg-muted">
                  <div className="h-full bg-accent" style={{ width: `${width}%` }} />
                </div>
                <span className="text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
