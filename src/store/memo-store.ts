"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Memo, MemoAnalysis, MemoTask, Mood } from "@/types/memo";

type MemoState = {
  memos: Memo[];
  search: string;
  activeTag?: string;
  addMemo: (input: { content: string; audioUrl?: string }) => Memo;
  deleteMemo: (id: string) => void;
  importLocalData: (input: { memos: Memo[]; search?: string; activeTag?: string }) => void;
  replaceMemo: (localId: string, memo: Memo) => void;
  resetDemoData: () => void;
  setSearch: (value: string) => void;
  setActiveTag: (tag?: string) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, input: Partial<Pick<MemoTask, "title" | "dueDate" | "done">>) => void;
  deleteTask: (id: string) => void;
  upsertMemos: (memos: Memo[]) => void;
};

const positiveWords = ["рад", "класс", "успех", "получилось", "идея", "спокой"];
const negativeWords = ["трев", "устал", "страх", "злю", "плохо", "сложно", "рис"];
const stopWords = new Set([
  "после",
  "нужно",
  "надо",
  "очень",
  "снова",
  "когда",
  "кажется",
  "сегодня",
  "завтра",
  "это",
  "что",
  "как",
  "для",
  "или",
  "еще",
]);

function getSeedMemos(): Memo[] {
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 1);
  soon.setHours(18, 0, 0, 0);

  return [
    {
      id: "memo-1",
      content:
        "После созвона понял, что нужно пересобрать онбординг и отдельно выписать риски по запуску. Еще стоит поговорить с Аней завтра про метрики удержания.",
      summary:
        "Нужно обновить онбординг и заранее обозначить риски запуска, отдельно обсудив удержание.",
      mood: "NEUTRAL",
      tags: ["онбординг", "запуск", "метрики"],
      tasks: [
        {
          id: "task-1",
          memoId: "memo-1",
          title: "Поговорить с Аней завтра про метрики удержания",
          done: false,
          dueDate: soon.toISOString(),
          createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
        },
      ],
      processed: true,
      createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "memo-2",
      content:
        "Снова тревожусь из-за понедельников. Кажется, помогает, когда план на неделю готов в воскресенье вечером.",
      summary:
        "Повторяется тревога перед понедельником, но предварительное планирование снижает напряжение.",
      mood: "NEGATIVE",
      tags: ["тревога", "планирование", "понедельник"],
      tasks: [],
      processed: true,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 26).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: "memo-3",
      content:
        "Идея: сделать быстрый режим голосовой заметки, где после записи сразу видны теги, настроение и похожие прошлые мысли.",
      summary:
        "Стоит сделать voice-first сценарий с мгновенным анализом и похожими заметками.",
      mood: "POSITIVE",
      tags: ["голос", "продукт", "поиск"],
      tasks: [
        {
          id: "task-2",
          memoId: "memo-3",
          title: "Спроектировать быстрый режим голосовой заметки",
          done: true,
          createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 51).toISOString(),
        },
      ],
      processed: true,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 51).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 51).toISOString(),
    },
  ];
}

function normalizeTaskTitle(value: string) {
  const title = value.replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function dateAtHour(offsetDays: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function inferDueDate(text: string) {
  const value = text.toLowerCase();

  if (value.includes("послезавтра")) {
    return dateAtHour(2);
  }

  if (value.includes("завтра")) {
    return dateAtHour(1);
  }

  if (value.includes("сегодня")) {
    return dateAtHour(0);
  }

  return undefined;
}

function sortMemos(memos: Memo[]) {
  return [...memos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function analyzeMemo(content: string): MemoAnalysis {
  const text = content.toLowerCase();
  const moodScore =
    positiveWords.filter((word) => text.includes(word)).length -
    negativeWords.filter((word) => text.includes(word)).length;
  const mood: Mood = moodScore > 0 ? "POSITIVE" : moodScore < 0 ? "NEGATIVE" : "NEUTRAL";
  const words = text.match(/[а-яa-zё]{4,}/gi) ?? [];
  const tags = Array.from(
    new Set(
      words
        .map((word) => word.toLowerCase())
        .filter((word) => !stopWords.has(word))
        .slice(0, 10),
    ),
  ).slice(0, 5);
  const taskMatches =
    content.match(
      /(?:нужно|надо|стоит|сделать|поговорить|проверить|подготовить|запланировать|написать|обсудить|созвониться)[^.?!]*/gi,
    ) ??
    [];

  return {
    summary: content.length > 150 ? `${content.slice(0, 147).trim()}...` : content,
    mood,
    tags: tags.length > 0 ? tags : ["заметка"],
    tasks: taskMatches.map((task) => task.trim()).slice(0, 4),
  };
}

export const useMemoStore = create<MemoState>()(
  persist(
    (set) => ({
      memos: getSeedMemos(),
      search: "",
      activeTag: undefined,
      addMemo: ({ content, audioUrl }) => {
        const analysis = analyzeMemo(content);
        const createdAt = new Date().toISOString();
        const memoId = crypto.randomUUID();
        const tasks: MemoTask[] = analysis.tasks.map((title) => {
          const normalizedTitle = normalizeTaskTitle(title);

          return {
            id: crypto.randomUUID(),
            memoId,
            title: normalizedTitle,
            done: false,
            dueDate: inferDueDate(normalizedTitle),
            createdAt,
          };
        });
        const memo: Memo = {
          id: memoId,
          content,
          audioUrl,
          summary: analysis.summary,
          mood: analysis.mood,
          tags: analysis.tags,
          tasks,
          processed: true,
          createdAt,
          updatedAt: createdAt,
        };

        set((state) => ({
          memos: [memo, ...state.memos],
        }));

        return memo;
      },
      deleteMemo: (id) =>
        set((state) => ({ memos: state.memos.filter((memo) => memo.id !== id) })),
      importLocalData: ({ memos, search = "", activeTag }) =>
        set({
          memos: sortMemos(memos),
          search,
          activeTag,
        }),
      replaceMemo: (localId, memo) =>
        set((state) => ({
          memos: sortMemos([
            memo,
            ...state.memos.filter((item) => item.id !== localId && item.id !== memo.id),
          ]),
        })),
      resetDemoData: () => set({ memos: getSeedMemos(), search: "", activeTag: undefined }),
      setSearch: (search) => set({ search }),
      setActiveTag: (activeTag) => set({ activeTag }),
      toggleTask: (id) =>
        set((state) => ({
          memos: state.memos.map((memo) => ({
            ...memo,
            tasks: memo.tasks.map((task) =>
              task.id === id ? { ...task, done: !task.done } : task,
            ),
          })),
        })),
      updateTask: (id, input) =>
        set((state) => ({
          memos: state.memos.map((memo) => ({
            ...memo,
            tasks: memo.tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    ...input,
                    title: input.title?.trim() || task.title,
                  }
                : task,
            ),
          })),
        })),
      deleteTask: (id) =>
        set((state) => ({
          memos: state.memos.map((memo) => ({
            ...memo,
            tasks: memo.tasks.filter((task) => task.id !== id),
          })),
        })),
      upsertMemos: (memos) =>
        set((state) => {
          const byId = new Map(state.memos.map((memo) => [memo.id, memo]));

          for (const memo of memos) {
            byId.set(memo.id, memo);
          }

          return {
            memos: sortMemos(Array.from(byId.values())),
          };
        }),
    }),
    {
      name: "ai-memo-local-state",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        memos: state.memos.map((memo) => ({
          ...memo,
          audioUrl: memo.audioUrl?.startsWith("data:") ? memo.audioUrl : undefined,
        })),
        search: state.search,
        activeTag: state.activeTag,
      }),
    },
  ),
);
