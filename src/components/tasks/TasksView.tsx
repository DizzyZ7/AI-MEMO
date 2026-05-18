"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarClock, Check, Pencil, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { useMemoStore } from "@/store/memo-store";
import { cn, formatDateTime } from "@/lib/utils";

type TaskFilter = "active" | "all" | "done";

const filters: { value: TaskFilter; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "all", label: "Все" },
  { value: "done", label: "Готовые" },
];

function toDateTimeLocal(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function isDueToday(value?: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function TasksView() {
  const [filter, setFilter] = useState<TaskFilter>("active");
  const [editingId, setEditingId] = useState<string>();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDueDate, setDraftDueDate] = useState("");
  const [cloudError, setCloudError] = useState<string>();
  const { status } = useSession();
  const utils = trpc.useUtils();
  const memos = useMemoStore((state) => state.memos);
  const toggleTask = useMemoStore((state) => state.toggleTask);
  const updateTask = useMemoStore((state) => state.updateTask);
  const deleteTask = useMemoStore((state) => state.deleteTask);
  const remoteToggle = trpc.task.toggle.useMutation({
    onSuccess: () => void utils.memo.list.invalidate(),
    onError: (error) => {
      if (error.data?.code !== "NOT_FOUND") {
        setCloudError(error.message);
      }
    },
  });
  const remoteUpdate = trpc.task.update.useMutation({
    onSuccess: () => void utils.memo.list.invalidate(),
    onError: (error) => {
      if (error.data?.code !== "NOT_FOUND") {
        setCloudError(error.message);
      }
    },
  });
  const remoteDelete = trpc.task.delete.useMutation({
    onSuccess: () => void utils.memo.list.invalidate(),
    onError: (error) => {
      if (error.data?.code !== "NOT_FOUND") {
        setCloudError(error.message);
      }
    },
  });

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
  const doneCount = tasks.length - activeCount;
  const todayCount = tasks.filter((task) => !task.done && isDueToday(task.dueDate)).length;
  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") {
      return !task.done;
    }

    if (filter === "done") {
      return task.done;
    }

    return true;
  });

  function startEditing(task: (typeof tasks)[number]) {
    setEditingId(task.id);
    setDraftTitle(task.title);
    setDraftDueDate(toDateTimeLocal(task.dueDate));
    setCloudError(undefined);
  }

  function handleToggle(id: string) {
    toggleTask(id);
    setCloudError(undefined);

    if (status === "authenticated") {
      remoteToggle.mutate({ id });
    }
  }

  function handleDelete(id: string) {
    deleteTask(id);
    setCloudError(undefined);

    if (status === "authenticated") {
      remoteDelete.mutate({ id });
    }
  }

  function handleSave(id: string) {
    const title = draftTitle.trim();

    if (!title) {
      return;
    }

    const dueDate = draftDueDate ? new Date(draftDueDate).toISOString() : undefined;
    updateTask(id, { title, dueDate });
    setEditingId(undefined);
    setCloudError(undefined);

    if (status === "authenticated") {
      remoteUpdate.mutate({
        id,
        title,
        dueDate: dueDate ?? null,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Задачи</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Явные действия, извлеченные из заметок. В демо они распознаются локально.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={activeCount > 0 ? "default" : "secondary"}>
            {activeCount} активных
          </Badge>
          <Badge variant={todayCount > 0 ? "secondary" : "outline"}>
            {todayCount} сегодня
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border bg-white p-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "h-8 rounded-sm px-3 text-xs font-medium text-muted-foreground transition-colors",
                filter === item.value && "bg-primary text-primary-foreground",
              )}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {doneCount} выполнено из {tasks.length}
        </p>
      </div>

      {cloudError ? (
        <div className="rounded-lg border bg-secondary p-4 text-sm text-secondary-foreground">
          Облако недоступно, локальные изменения сохранены: {cloudError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-white">
        {filteredTasks.length > 0 ? (
          <div className="divide-y">
            {filteredTasks.map((task) => {
              const editing = editingId === task.id;

              return (
                <div key={task.id} className="grid gap-3 p-4 md:grid-cols-[1fr_210px_136px] md:items-center">
                  <div className="min-w-0">
                    {editing ? (
                      <Input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        aria-label="Название задачи"
                      />
                    ) : (
                      <p
                        className={
                          task.done
                            ? "text-sm font-medium text-muted-foreground line-through"
                            : "text-sm font-medium"
                        }
                      >
                        {task.title}
                      </p>
                    )}
                    <p className="mt-1 truncate text-xs text-muted-foreground">{task.memoContent}</p>
                  </div>
                  <div className="grid gap-1 text-xs text-muted-foreground">
                    {editing ? (
                      <Input
                        type="datetime-local"
                        value={draftDueDate}
                        onChange={(event) => setDraftDueDate(event.target.value)}
                        aria-label="Срок задачи"
                      />
                    ) : (
                      <>
                        <span>Создано: {formatDateTime(task.createdAt)}</span>
                        {task.dueDate ? (
                          <span className="inline-flex items-center gap-1 text-foreground">
                            <CalendarClock className="size-3.5 text-primary" />
                            До: {formatDateTime(task.dueDate)}
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 md:justify-end">
                    {editing ? (
                      <>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Сохранить задачу"
                          onClick={() => handleSave(task.id)}
                        >
                          <Save />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Отменить редактирование"
                          onClick={() => setEditingId(undefined)}
                        >
                          <X />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant={task.done ? "secondary" : "outline"}
                          aria-label={task.done ? "Вернуть задачу" : "Завершить задачу"}
                          onClick={() => handleToggle(task.id)}
                        >
                          <Check />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Редактировать задачу"
                          onClick={() => startEditing(task)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Удалить задачу"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
