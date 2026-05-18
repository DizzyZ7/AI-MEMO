"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarClock, Check, CheckSquare, Clock, Copy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { formatDateTime } from "@/lib/utils";
import type { Memo, Mood } from "@/types/memo";
import { useMemoStore } from "@/store/memo-store";

const moodLabels: Record<Mood, string> = {
  POSITIVE: "позитив",
  NEUTRAL: "нейтрально",
  NEGATIVE: "напряжение",
};

const moodVariants: Record<Mood, "positive" | "neutral" | "negative"> = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  NEGATIVE: "negative",
};

export function MemoCard({ memo }: { memo: Memo }) {
  const [copied, setCopied] = useState(false);
  const { status } = useSession();
  const utils = trpc.useUtils();
  const remoteDelete = trpc.memo.delete.useMutation({
    onSuccess: () => void utils.memo.list.invalidate(),
    onError: () => undefined,
  });
  const deleteMemo = useMemoStore((state) => state.deleteMemo);
  const setActiveTag = useMemoStore((state) => state.setActiveTag);

  async function handleCopy() {
    if (!navigator.clipboard) {
      return;
    }

    const tasks = memo.tasks.map((task) => `- ${task.title}`).join("\n");
    const text = [
      memo.content,
      memo.summary ? `Кратко: ${memo.summary}` : undefined,
      memo.tags.length > 0 ? `Теги: ${memo.tags.map((tag) => `#${tag}`).join(" ")}` : undefined,
      tasks ? `Задачи:\n${tasks}` : undefined,
    ]
      .filter(Boolean)
      .join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleDelete() {
    deleteMemo(memo.id);

    if (status === "authenticated") {
      remoteDelete.mutate({ id: memo.id });
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-4" />
            {formatDateTime(memo.createdAt)}
            {memo.audioUrl ? (
              <Badge variant="outline" className="ml-1">
                voice
              </Badge>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="icon" variant="ghost" aria-label="Скопировать" onClick={handleCopy}>
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button size="icon" variant="ghost" aria-label="Удалить" onClick={handleDelete}>
              <Trash2 />
            </Button>
          </div>
        </div>

        <p className="text-base leading-7 text-foreground">{memo.content}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {memo.summary ? (
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-sm font-medium">Кратко</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{memo.summary}</p>
          </div>
        ) : null}

        {memo.audioUrl ? (
          <div className="rounded-md border bg-muted/30 p-3">
            <audio src={memo.audioUrl} controls className="h-9 w-full" />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Badge variant={moodVariants[memo.mood]}>{moodLabels[memo.mood]}</Badge>
          {memo.tags.map((tag) => (
            <button key={tag} type="button" onClick={() => setActiveTag(tag)}>
              <Badge variant="outline">#{tag}</Badge>
            </button>
          ))}
        </div>

        {memo.tasks.length > 0 ? (
          <div className="grid gap-2">
            {memo.tasks.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CheckSquare className="size-4 text-primary" />
                <span className={task.done ? "line-through" : undefined}>{task.title}</span>
                {task.dueDate ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    <CalendarClock className="size-3.5" />
                    {formatDateTime(task.dueDate)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
