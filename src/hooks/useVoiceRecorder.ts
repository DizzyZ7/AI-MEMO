"use client";

import { useCallback, useRef, useState } from "react";

type UseVoiceRecorderOptions = {
  onComplete: (audioBlob: Blob) => void;
};

export function useVoiceRecorder({ onComplete }: UseVoiceRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const recordingRef = useRef(false);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = () => {
      onComplete(new Blob(chunks, { type: "audio/webm" }));
      recordingRef.current = false;
      setIsRecording(false);
      setAmplitude(0);
      stopTracks();
    };

    const updateAmplitude = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((total, value) => total + value, 0) / data.length;
      setAmplitude(avg);
      if (recordingRef.current) {
        frameRef.current = requestAnimationFrame(updateAmplitude);
      }
    };

    streamRef.current = stream;
    audioContextRef.current = audioContext;
    mediaRecorderRef.current = recorder;
    recordingRef.current = true;
    setIsRecording(true);
    recorder.start();
    updateAmplitude();
  }, [onComplete, stopTracks]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  return {
    isRecording,
    amplitude,
    startRecording,
    stopRecording,
  };
}
