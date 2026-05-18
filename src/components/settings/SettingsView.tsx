"use client";

import { useEffect, useState } from "react";
import { Bell, DatabaseBackup, GitBranch, Mail, RotateCcw, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { requestTaskReminderPermission } from "@/hooks/useTaskReminders";
import { useMemoStore } from "@/store/memo-store";

const envItems = [
  ["DATABASE_URL", "Supabase Postgres + pgvector"],
  ["OPENAI_API_KEY", "GPT-4o mini, Whisper, embeddings"],
  ["QSTASH_TOKEN", "Async processing and cron"],
  ["CF_R2_BUCKET", "Voice uploads"],
  ["RESEND_API_KEY", "Weekly digest email"],
];

export function SettingsView() {
  const memos = useMemoStore((state) => state.memos);
  const resetDemoData = useMemoStore((state) => state.resetDemoData);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const taskCount = memos.reduce((count, memo) => count + memo.tasks.length, 0);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      return;
    }

    setNotificationPermission("unsupported");
  }, []);

  async function handleEnableReminders() {
    const permission = await requestTaskReminderPermission();
    setNotificationPermission(permission);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Настройки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Профиль, тариф, интеграции и готовность инфраструктуры.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Google OAuth</p>
                  <p className="text-xs text-muted-foreground">Через Auth.js v5</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Подключить</Button>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <GitBranch className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">GitHub OAuth</p>
                  <p className="text-xs text-muted-foreground">Через Auth.js v5</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Подключить</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Тариф</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-secondary p-4 text-secondary-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5" />
                <p className="font-semibold">Free</p>
              </div>
              <p className="mt-2 text-sm opacity-80">
                30 мемо в месяц, 10 AI-обработок, базовый текстовый поиск.
              </p>
            </div>
            <Button className="w-full">Перейти на Pro за $9/мес</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Локальные данные</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DatabaseBackup className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{memos.length} мемо сохранено в браузере</p>
              <p className="text-xs text-muted-foreground">{taskCount} задач восстановятся после перезагрузки</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={resetDemoData}>
            <RotateCcw />
            Сбросить демо
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Инфраструктура</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {envItems.map(([name, label]) => (
            <div key={name} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <Shield className="size-5 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Еженедельный дайджест</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Письмо каждое воскресенье в 09:00</p>
            <p className="text-xs text-muted-foreground">QStash cron + Resend email</p>
          </div>
          <Switch checked onCheckedChange={() => undefined} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Напоминания</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {notificationPermission === "granted"
                  ? "Браузерные напоминания включены"
                  : "Браузерные напоминания выключены"}
              </p>
              <p className="text-xs text-muted-foreground">
                Сработают для задач с датой из формулировок «сегодня», «завтра» и
                «послезавтра».
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={notificationPermission === "unsupported" || notificationPermission === "granted"}
            onClick={handleEnableReminders}
          >
            <Bell />
            Включить
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
