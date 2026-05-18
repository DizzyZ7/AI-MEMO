import { Resend } from "resend";
import { db } from "@/lib/db";
import { openai } from "@/lib/openai";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function buildWeeklyDigest(userId: string) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const memos = await db.memo.findMany({
    where: {
      userId,
      deletedAt: null,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: {
      summary: true,
      mood: true,
      tags: true,
      createdAt: true,
    },
  });

  if (!openai) {
    return {
      digest:
        "OpenAI не настроен. Дайджест будет сгенерирован после добавления OPENAI_API_KEY.",
      memos,
    };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Создай дружеский еженедельный отчет на русском на основе заметок пользователя. Включи топ-темы недели, изменения настроения, выполненные задачи, интересные паттерны и короткий мотивирующий вывод. Тон теплый, личный, не занудный.",
      },
      {
        role: "user",
        content: JSON.stringify(memos),
      },
    ],
  });

  return {
    digest: response.choices[0]?.message.content ?? "",
    memos,
  };
}

export async function sendWeeklyDigest(userId: string) {
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email) {
    return { sent: false, reason: "User email is missing" };
  }

  const { digest } = await buildWeeklyDigest(userId);

  const email = await resend.emails.send({
    from: "AI Memo <digest@aimemo.app>",
    to: user.email,
    subject: "Твоя неделя в мемо",
    text: digest,
  });

  return { sent: true, email };
}
