"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

type VoiceRecorderProps = {
  onComplete: (audioBlob: Blob) => void;
};

export function VoiceRecorder({ onComplete }: VoiceRecorderProps) {
  const { isRecording, amplitude, startRecording, stopRecording } = useVoiceRecorder({ onComplete });

  return (
    <Button
      type="button"
      aria-label={isRecording ? "Остановить запись" : "Начать запись"}
      title={isRecording ? "Остановить запись" : "Начать запись"}
      onClick={isRecording ? stopRecording : startRecording}
      className={cn(
        "size-14 shrink-0 rounded-full transition-transform",
        isRecording ? "bg-destructive hover:bg-destructive/90" : "bg-primary",
      )}
      style={{
        boxShadow: isRecording ? `0 0 ${Math.max(12, amplitude / 2)}px rgba(220, 38, 38, 0.38)` : undefined,
        transform: isRecording ? `scale(${1 + Math.min(amplitude / 900, 0.08)})` : undefined,
      }}
      size="icon"
    >
      {isRecording ? <Square className="size-5" /> : <Mic className="size-5" />}
    </Button>
  );
}
