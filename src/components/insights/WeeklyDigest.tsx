"use client";

import { CalendarDays, Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemoStore } from "@/store/memo-store";

export function WeeklyDigest() {
  const memos = useMemoStore((state) => state.memos);
  const topTags = Array.from(
    memos.reduce((acc, memo) => {
      memo.tags.forEach((tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1));
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
  const negativeCount = memos.filter((memo) => memo.mood === "NEGATIVE").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Еженедельный дайджест</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border bg-muted/30 p-4">
          <CalendarDays className="mb-3 size-5 text-primary" />
          <p className="text-sm font-semibold">Ритм</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            За неделю собрано {memos.length} мемо. Самые активные темы: {topTags.join(", ") || "пока нет"}.
          </p>
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <TrendingUp className="mb-3 size-5 text-primary" />
          <p className="text-sm font-semibold">Паттерн</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {negativeCount > 0
              ? "Напряжение появляется рядом с планированием и сроками."
              : "Пока преобладает ровный или позитивный тон."}
          </p>
        </div>
        <div className="rounded-md border bg-muted/30 p-4">
          <Lightbulb className="mb-3 size-5 text-primary" />
          <p className="text-sm font-semibold">Вывод</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Идеи становятся полезнее, когда рядом сразу фиксируются следующие действия.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
