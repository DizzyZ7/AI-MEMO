"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  DatabaseBackup,
  Download,
  Gauge,
  GitBranch,
  Loader2,
  Mail,
  RotateCcw,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { requestTaskReminderPermission } from "@/hooks/useTaskReminders";
import { createLocalMemoBackup, parseLocalMemoBackup } from "@/lib/local-memo-backup";
import { trpc } from "@/lib/trpc/client";
import { formatDay } from "@/lib/utils";
import { useMemoStore } from "@/store/memo-store";

const envItems = [
  ["DATABASE_URL", "Supabase Postgres + pgvector"],
  ["OPENAI_API_KEY", "GPT-4o mini, Whisper, embeddings"],
  ["QSTASH_TOKEN", "Async processing and cron"],
  ["CF_R2_BUCKET", "Voice uploads"],
  ["RESEND_API_KEY", "Weekly digest email"],
];

export function SettingsView() {
  const { status } = useSession();
  const memos = useMemoStore((state) => state.memos);
  const search = useMemoStore((state) => state.search);
  const activeTag = useMemoStore((state) => state.activeTag);
  const importLocalData = useMemoStore((state) => state.importLocalData);
  const resetDemoData = useMemoStore((state) => state.resetDemoData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [backupStatus, setBackupStatus] = useState<{
    type: "success" | "error";
    message: string;
  }>();
  const aiUsage = trpc.ai.usage.useQuery(undefined, {
    enabled: status === "authenticated",
    retry: false,
    staleTime: 60_000,
  });
  const taskCount = memos.reduce((count, memo) => count + memo.tasks.length, 0);
  const usage = aiUsage.data;
  const usagePercent =
    usage?.limit && usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;

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

  function handleExportLocalData() {
    const backup = createLocalMemoBackup({ memos, search, activeTag });
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `ai-memo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setBackupStatus({ type: "success", message: "Экспорт локальных данных подготовлен." });
  }

  async function handleImportLocalData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed = parseLocalMemoBackup(JSON.parse(await file.text()));
      importLocalData(parsed);
      setBackupStatus({
        type: "success",
        message: `Импортировано ${parsed.memos.length} мемо.`,
      });
    } catch (error) {
      const message =
        error instanceof SyntaxError
          ? "Не удалось прочитать JSON-файл."
          : error instanceof Error
            ? error.message
            : "Не удалось импортировать файл.";

      setBackupStatus({
        type: "error",
        message,
      });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Настройки</h1>
        <p className="mt-1 max-w-full text-sm leading-6 text-muted-foreground">
          Профиль, тариф, интеграции и готовность инфраструктуры.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-md border p-3 sm:flex sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Mail className="size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Google OAuth</p>
                  <p className="text-xs text-muted-foreground">Через Auth.js v5</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">Подключить</Button>
            </div>
            <div className="grid gap-3 rounded-md border p-3 sm:flex sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <GitBranch className="size-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">GitHub OAuth</p>
                  <p className="text-xs text-muted-foreground">Через Auth.js v5</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">Подключить</Button>
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
                  <Sparkles className="size-5 shrink-0" />
                  <p className="font-semibold">Free</p>
                </div>
              <p className="mt-2 text-sm leading-6 opacity-80">
                30 мемо в месяц, 10 AI-обработок, базовый текстовый поиск.
              </p>
            </div>
            <div className="rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Gauge className="size-5 shrink-0 text-primary" />
                  <p className="text-sm font-semibold">AI-лимит месяца</p>
                </div>
                {usage ? <Badge variant="outline">{usage.plan}</Badge> : null}
              </div>
              {status !== "authenticated" ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Войди в аккаунт, чтобы видеть облачный расход AI-обработок.
                </p>
              ) : aiUsage.isLoading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Загружаю счётчик
                </div>
              ) : aiUsage.error ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4" />
                  {aiUsage.error.message}
                </div>
              ) : usage ? (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-2xl font-semibold">
                        {usage.limit === null ? usage.used : `${usage.used} / ${usage.limit}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {usage.limit === null
                          ? "обработок в текущем месяце"
                          : `${usage.remaining} обработок осталось`}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      до {formatDay(usage.periodEnd)}
                    </p>
                  </div>
                  {usage.limit !== null ? (
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  ) : null}
                  {!usage.tracked ? (
                    <p className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                      Redis не настроен, поэтому лимит не применяется в локальном демо.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <Button className="w-full">Перейти на Pro за $9/мес</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Локальные данные</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <DatabaseBackup className="size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{memos.length} мемо сохранено в браузере</p>
                <p className="text-xs text-muted-foreground">
                  {taskCount} задач восстановятся после перезагрузки
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={handleExportLocalData}>
                <Download />
                Экспорт
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload />
                Импорт
              </Button>
              <Button type="button" variant="outline" onClick={resetDemoData}>
                <RotateCcw />
                Сбросить демо
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleImportLocalData}
          />
          {backupStatus ? (
            <div
              className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm"
              aria-live="polite"
            >
              {backupStatus.type === "success" ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <AlertTriangle className="size-4 text-destructive" />
              )}
              <span
                className={
                  backupStatus.type === "error" ? "text-destructive" : "text-muted-foreground"
                }
              >
                {backupStatus.message}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Инфраструктура</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {envItems.map(([name, label]) => (
            <div key={name} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <Shield className="size-5 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Еженедельный дайджест</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
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
          <div className="flex min-w-0 items-center gap-3">
            <Bell className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
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
            className="shrink-0"
          >
            <Bell />
            Включить
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
