import { z } from "zod";
import type { Memo } from "@/types/memo";

export type LocalMemoData = {
  memos: Memo[];
  search: string;
  activeTag?: string;
};

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid date",
});

const memoTaskSchema = z.object({
  id: z.string().min(1),
  memoId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(500),
  done: z.boolean(),
  dueDate: dateStringSchema.optional(),
  createdAt: dateStringSchema,
});

const memoSchema = z.object({
  id: z.string().min(1),
  content: z.string().trim().min(1).max(50000),
  audioUrl: z.string().optional(),
  transcript: z.string().max(50000).optional(),
  summary: z.string().max(5000).optional(),
  mood: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  tags: z.array(z.string().trim().min(1).max(80)).max(30),
  tasks: z.array(memoTaskSchema).max(200),
  processed: z.boolean(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

const backupSchema = z.object({
  schema: z.literal("ai-memo.local-backup"),
  version: z.literal(1),
  exportedAt: dateStringSchema,
  data: z.object({
    memos: z.array(memoSchema).max(5000),
    search: z.string().max(200).optional(),
    activeTag: z.string().trim().min(1).max(80).optional(),
  }),
});

export function createLocalMemoBackup(data: LocalMemoData) {
  return {
    schema: "ai-memo.local-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  } as const;
}

export function parseLocalMemoBackup(value: unknown): LocalMemoData {
  const parsed = backupSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error("Файл не похож на корректный экспорт AI Memo.");
  }

  const { memos, search = "", activeTag } = parsed.data.data;
  const usableActiveTag =
    activeTag && memos.some((memo) => memo.tags.includes(activeTag)) ? activeTag : undefined;

  return {
    memos,
    search,
    activeTag: usableActiveTag,
  };
}
