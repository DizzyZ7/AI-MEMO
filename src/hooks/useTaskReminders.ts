"use client";

import { useEffect } from "react";
import { useMemoStore } from "@/store/memo-store";

const reminderPrefix = "ai-memo-reminder:";
const maxDelay = 2_147_483_647;

function canUseNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestTaskReminderPermission() {
  if (!canUseNotifications()) {
    return "unsupported" as const;
  }

  return Notification.requestPermission();
}

export function useTaskReminders() {
  const tasks = useMemoStore((state) =>
    state.memos.flatMap((memo) =>
      memo.tasks.map((task) => ({
        ...task,
        memoContent: memo.content,
      })),
    ),
  );

  useEffect(() => {
    if (!canUseNotifications() || Notification.permission !== "granted") {
      return;
    }

    const now = Date.now();
    const timers = tasks
      .filter((task) => !task.done && task.dueDate)
      .map((task) => {
        const dueAt = new Date(task.dueDate as string).getTime();
        const delay = dueAt - now;
        const storageKey = `${reminderPrefix}${task.id}:${task.dueDate}`;

        if (delay <= 0 || delay > maxDelay || localStorage.getItem(storageKey) === "shown") {
          return undefined;
        }

        return window.setTimeout(() => {
          localStorage.setItem(storageKey, "shown");
          new Notification("AI Memo", {
            body: task.title,
            tag: task.id,
          });
        }, delay);
      })
      .filter((timer): timer is number => typeof timer === "number");

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [tasks]);
}
