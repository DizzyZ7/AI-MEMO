import { openai } from "@/lib/openai";

export async function transcribeAudioUrl(audioUrl: string) {
  if (!openai) {
    return null;
  }

  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch audio: ${response.status}`);
  }

  const blob = await response.blob();
  const file = new File([blob], "memo.webm", {
    type: blob.type || "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return transcription.text;
}
