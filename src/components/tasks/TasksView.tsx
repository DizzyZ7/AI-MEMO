"use client";

import { useMemo } from "react";
import { CalendarClock, Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemoStore } from "@/store/memo-store";
import { formatDateTime } from "@/lib/utils";

export function TasksView() {
  const memos = useMemoStore((state) => state.memos);
  const toggleTask = useMemoStore((state) => state.toggleTask);
  const deleteTask = useMemoStore((state) => state.deleteTask);
  const tasks = useMemo(
    () =>
      memos
        .flatMap((memo) =>
          memo.tasks.map((task) => ({
            ...task,
            memoContent: memo.content,
          })),
        )
        .sort((a, b) => {
          if (a.done !== b.done) {
            return a.done ? 1 : -1;
          }

          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;

          if (aDue !== bDue) {
            return aDue - bDue;
          }

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [memos],
  );
  const activeCount = tasks.filter((task) => !task.done).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Задачи</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Явные действия, извлеченные из заметок. В демо они распознаются локально.
          </p>
        </div>
        <Badge variant={activeCount > 0 ? "default" : "secondary"}>
          {activeCount} активных
        </Badge>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {tasks.length > 0 ? (
          <div className="divide-y">
            {tasks.map((task) => (
              <div key={task.id} className="grid gap-3 p-4 md:grid-cols-[1fr_190px_96px] md:items-center">
                <div className="min-w-0">
                  <p className={task.done ? "text-sm font-medium text-muted-foreground line-through" : "text-sm font-medium"}>
                    {task.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{task.memoContent}</p>
                </div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <span>Создано: {formatDateTime(task.createdAt)}</span>
                  {task.dueDate ? (
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <CalendarClock className="size-3.5 text-primary" />
                      До: {formatDateTime(task.dueDate)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 md:justify-end">
                  <Button size="icon" variant={task.done ? "secondary" : "outline"} onClick={() => toggleTask(task.id)}>
                    <Check />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteTask(task.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="font-medium">Задач пока нет</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Добавь мемо с формулировкой «нужно», «стоит» или «поговорить».
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
