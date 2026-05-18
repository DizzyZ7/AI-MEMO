import type { Mood } from "@prisma/client";
import { db } from "@/lib/db";
import { openai } from "@/lib/openai";
import type { MemoAnalysis } from "@/types/memo";
import { createEmbedding, updateMemoEmbedding } from "@/server/services/embedding.service";
import { transcribeAudioUrl } from "@/server/services/voice.service";

const allowedMoods = new Set(["POSITIVE", "NEUTRAL", "NEGATIVE"]);

function normalizeTaskTitle(value: string) {
  const title = value.replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function taskKey(value: string) {
  return normalizeTaskTitle(value).toLowerCase();
}

function dateAtHour(offsetDays: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date;
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

function fallbackAnalysis(content: string): MemoAnalysis {
  return {
    summary: content.length > 180 ? `${content.slice(0, 177).trim()}...` : content,
    mood: "NEUTRAL",
    tags: ["memo"],
    tasks: [],
  };
}

function normalizeAnalysis(value: unknown, content: string): MemoAnalysis {
  if (!value || typeof value !== "object") {
    return fallbackAnalysis(content);
  }

  const raw = value as Partial<MemoAnalysis>;
  const mood = allowedMoods.has(String(raw.mood)) ? (raw.mood as MemoAnalysis["mood"]) : "NEUTRAL";

  return {
    summary: typeof raw.summary === "string" && raw.summary.length > 0 ? raw.summary : fallbackAnalysis(content).summary,
    mood,
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 5)
      : ["memo"],
    tasks: Array.isArray(raw.tasks)
      ? raw.tasks.filter((task): task is string => typeof task === "string").slice(0, 8)
      : [],
    keyInsight: typeof raw.keyInsight === "string" ? raw.keyInsight : undefined,
  };
}

export async function analyzeMemoContent(content: string): Promise<MemoAnalysis> {
  if (!openai) {
    return fallbackAnalysis(content);
  }

  const analysis = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты - личный ИИ-ассистент. Анализируй заметку и верни только JSON: {\"summary\":\"краткое резюме 1-2 предложения\",\"mood\":\"POSITIVE|NEUTRAL|NEGATIVE\",\"tags\":[\"тег1\",\"тег2\"],\"tasks\":[\"задача1\"],\"keyInsight\":\"главная мысль\"}. Теги - максимум 5 существительных. Задачи - только явно упомянутые действия.",
      },
      {
        role: "user",
        content,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = analysis.choices[0]?.message.content;
  if (!raw) {
    return fallbackAnalysis(content);
  }

  try {
    return normalizeAnalysis(JSON.parse(raw), content);
  } catch {
    return fallbackAnalysis(content);
  }
}

export async function processMemo(memoId: string) {
  const memo = await db.memo.findUnique({
    where: { id: memoId },
  });

  if (!memo || memo.deletedAt) {
    return null;
  }

  let content = memo.content;
  if (memo.audioUrl) {
    const transcript = await transcribeAudioUrl(memo.audioUrl);
    if (transcript) {
      content = transcript;
      await db.memo.update({
        where: { id: memoId },
        data: { transcript },
      });
    }
  }

  const result = await analyzeMemoContent(content);
  const embedding = await createEmbedding(content);
  const existingTasks = await db.task.findMany({
    where: {
      memoId,
      userId: memo.userId,
    },
    select: {
      title: true,
    },
  });
  const existingTaskKeys = new Set(existingTasks.map((task) => taskKey(task.title)));
  const newTasks = result.tasks
    .map((title) => normalizeTaskTitle(title))
    .filter((title) => title.length > 0 && !existingTaskKeys.has(taskKey(title)));

  await db.$transaction([
    db.memo.update({
      where: { id: memoId },
      data: {
        summary: result.summary,
        mood: result.mood as Mood,
        tags: result.tags,
        processed: true,
      },
    }),
    ...newTasks.map((title) =>
      db.task.create({
        data: {
          userId: memo.userId,
          memoId,
          title,
          dueDate: inferDueDate(title),
        },
      }),
    ),
  ]);

  if (embedding) {
    await updateMemoEmbedding(memoId, embedding);
  }

  return { memoId, analysis: result };
}
