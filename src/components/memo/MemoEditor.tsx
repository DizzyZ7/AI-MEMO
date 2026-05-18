"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/memo/VoiceRecorder";
import { toClientMemo } from "@/lib/memo-adapters";
import { trpc } from "@/lib/trpc/client";
import { useMemoStore } from "@/store/memo-store";

export function MemoEditor() {
  const [content, setContent] = useState("");
  const [audioUrl, setAudioUrl] = useState<string>();
  const [audioError, setAudioError] = useState<string>();
  const [cloudError, setCloudError] = useState<string>();
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const { status } = useSession();
  const utils = trpc.useUtils();
  const addMemo = useMemoStore((state) => state.addMemo);
  const replaceMemo = useMemoStore((state) => state.replaceMemo);
  const createCloudMemo = trpc.memo.create.useMutation();

  const canSubmit = !isPreparingAudio && (content.trim().length > 0 || Boolean(audioUrl));

  function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    const memo = addMemo({
      content: content.trim() || "Голосовое мемо готово к транскрипции.",
      audioUrl,
    });
    setContent("");
    setAudioUrl(undefined);
    setAudioError(undefined);
    setCloudError(undefined);

    if (status === "authenticated") {
      createCloudMemo.mutate(
        {
          content: memo.content,
          audioKey: audioUrl?.startsWith("http") ? audioUrl : undefined,
        },
        {
          onSuccess: (remoteMemo) => {
            replaceMemo(memo.id, toClientMemo(remoteMemo));
            void utils.memo.list.invalidate();
          },
          onError: (error) => {
            setCloudError(error.message);
          },
        },
      );
    }
  }

  function handleAudioComplete(audioBlob: Blob) {
    const reader = new FileReader();

    setAudioError(undefined);
    setIsPreparingAudio(true);

    reader.onload = () => {
      setIsPreparingAudio(false);

      if (typeof reader.result === "string") {
        setAudioUrl(reader.result);
        return;
      }

      setAudioError("Не удалось подготовить аудио.");
    };
    reader.onerror = () => {
      setIsPreparingAudio(false);
      setAudioError("Не удалось подготовить аудио.");
    };
    reader.readAsDataURL(audioBlob);
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Новое мемо</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Запиши мысль текстом или голосом, анализ появится в ленте.
          </p>
        </div>
        <VoiceRecorder onComplete={handleAudioComplete} />
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Например: нужно завтра обсудить запуск, я переживаю из-за сроков, но идея с быстрым режимом выглядит сильной..."
        />

        {audioUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/50 p-3">
            <audio src={audioUrl} controls className="h-9 max-w-full" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAudioUrl(undefined);
                setAudioError(undefined);
              }}
            >
              <X />
              Удалить
            </Button>
          </div>
        ) : null}

        {isPreparingAudio ? (
          <p className="text-sm text-muted-foreground">Готовлю аудио для сохранения...</p>
        ) : null}

        {audioError ? <p className="text-sm text-destructive">{audioError}</p> : null}
        {cloudError ? (
          <p className="text-sm text-destructive">
            Облако недоступно, мемо осталось локально: {cloudError}
          </p>
        ) : null}
        {createCloudMemo.isPending ? (
          <p className="text-sm text-muted-foreground">Синхронизирую мемо с аккаунтом...</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Plus className="size-4" />
            Локальная демо-обработка извлекает теги, настроение и явные задачи.
          </div>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            <Send />
            Добавить мемо
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
