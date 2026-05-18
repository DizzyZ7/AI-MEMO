"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, Mic, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const storageKey = "ai-memo-onboarding-dismissed";

const steps = [
  { label: "Голос или текст", icon: Mic },
  { label: "Задачи и теги", icon: CheckCircle2 },
  { label: "Поиск по смыслу", icon: Search },
] as const;

export function DashboardOnboarding() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(storageKey) !== "true");
  }, []);

  function dismiss() {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold">Первый запуск</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            AI Memo уже работает локально. После входа новые мемо будут уходить в БД,
            обрабатываться сервером и участвовать в облачном поиске.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Скрыть" onClick={dismiss}>
          <X />
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex items-center gap-3 rounded-md border bg-muted/20 p-3">
              <Icon className="size-4 text-primary" />
              <span className="text-sm font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/sign-in">
            <Cloud />
            Подключить аккаунт
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={dismiss}>
          Оставить локально
        </Button>
      </div>
    </div>
  );
}
