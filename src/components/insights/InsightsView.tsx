"use client";

import { PatternChart } from "@/components/insights/PatternChart";
import { WeeklyDigest } from "@/components/insights/WeeklyDigest";

export function InsightsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Инсайты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Паттерны строятся из тегов, настроения и повторяющихся тем в мемо.
        </p>
      </div>
      <PatternChart />
      <WeeklyDigest />
    </div>
  );
}
