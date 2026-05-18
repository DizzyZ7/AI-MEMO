"use client";

import { useMemo } from "react";
import { CalendarClock, CheckSquare, Tags, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { useMemoStore } from "@/store/memo-store";
import type { Mood } from "@/types/memo";

const moodLabels: Record<Mood, string> = {
  POSITIVE: "позитивный",
  NEUTRAL: "ровный",
  NEGATIVE: "напряженный",
};

function isSameLocalDay(value: string, date: Date) {
  const current = new Date(value);

  return (
    current.getFullYear() === date.getFullYear() &&
    current.getMonth() === date.getMonth() &&
    current.getDate() === date.getDate()
  );
}

export function DashboardOverview() {
  const memos = useMemoStore((state) => state.memos);

  const overview = useMemo(() => {
    const today = new Date();
    const todaysMemos = memos.filter((memo) => isSameLocalDay(memo.createdAt, today));
    const tasks = memos
      .flatMap((memo) => memo.tasks.map((task) => ({ ...task, memoId: memo.id })))
      .sort((a, b) => {
        if (a.done !== b.done) {
          return a.done ? 1 : -1;
        }

        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;

        return aDue - bDue;
      });
    const openTasks = tasks.filter((task) => !task.done);
    const moodCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.mood] += 1;
        return acc;
      },
      { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 } satisfies Record<Mood, number>,
    );
    const dominantMood = (Object.keys(moodCounts) as Mood[]).sort(
      (a, b) => moodCounts[b] - moodCounts[a],
    )[0];
    const topTags = Array.from(
      memos.reduce((acc, memo) => {
        memo.tags.forEach((tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1));
        return acc;
      }, new Map<string, number>()),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    return {
      todaysCount: todaysMemos.length,
      openTasks,
      dominantMood,
      topTags,
      nextTask: openTasks[0],
    };
  }, [memos]);

  return (
    <aside className="space-y-4">
      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Сегодня</p>
          <CalendarClock className="size-5 text-primary" />
        </div>
        <p className="mt-3 text-3xl font-semibold">{overview.todaysCount}</p>
        <p className="mt-1 text-sm text-muted-foreground">мемо добавлено за текущий день</p>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Задачи</p>
          <CheckSquare className="size-5 text-primary" />
        </div>
        <p className="mt-3 text-3xl font-semibold">{overview.openTasks.length}</p>
        <p className="mt-1 text-sm text-muted-foreground">активных действий из заметок</p>
        {overview.nextTask ? (
          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Ближайшее</p>
            <p className="mt-1 text-sm font-medium">{overview.nextTask.title}</p>
            {overview.nextTask.dueDate ? (
              <p className="mt-1 text-xs text-muted-foreground">
                до {formatDateTime(overview.nextTask.dueDate)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Паттерн</p>
          <TrendingUp className="size-5 text-primary" />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Сейчас в ленте преобладает {moodLabels[overview.dominantMood]} тон.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {overview.topTags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
          {overview.topTags.length === 0 ? <Badge variant="secondary">нет тегов</Badge> : null}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center gap-2">
          <Tags className="size-5 text-primary" />
          <p className="text-sm font-semibold">Следующий шаг</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Продолжай писать мемо с явными действиями: демо сохранит их локально и покажет
          сроки, если в тексте есть «сегодня», «завтра» или «послезавтра».
        </p>
      </div>
    </aside>
  );
}
