import type { RouterOutputs } from "@/lib/trpc/types";
import type { Memo, MemoTask, Mood } from "@/types/memo";

type RemoteMemo =
  | RouterOutputs["memo"]["list"]["items"][number]
  | RouterOutputs["memo"]["create"];

const moods = new Set<Mood>(["POSITIVE", "NEUTRAL", "NEGATIVE"]);

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function normalizeMood(value: Mood | null | undefined): Mood {
  return value && moods.has(value) ? value : "NEUTRAL";
}

function toClientTask(task: RemoteMemo["tasks"][number]): MemoTask {
  return {
    id: task.id,
    memoId: task.memoId ?? undefined,
    title: task.title,
    done: task.done,
    dueDate: toIsoString(task.dueDate),
    createdAt: toIsoString(task.createdAt) ?? new Date().toISOString(),
  };
}

export function toClientMemo(memo: RemoteMemo): Memo {
  const createdAt = toIsoString(memo.createdAt) ?? new Date().toISOString();

  return {
    id: memo.id,
    content: memo.transcript || memo.content,
    audioUrl: memo.audioUrl ?? undefined,
    transcript: memo.transcript ?? undefined,
    summary: memo.summary ?? undefined,
    mood: normalizeMood(memo.mood),
    tags: memo.tags,
    tasks: memo.tasks.map(toClientTask),
    processed: memo.processed,
    createdAt,
    updatedAt: toIsoString(memo.updatedAt) ?? createdAt,
  };
}
