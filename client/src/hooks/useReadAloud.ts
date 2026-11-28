import { useCallback, useEffect, useState } from 'react';

const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const useReadAloud = (onError?: (message: string) => void) => {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  }, []);

  const toggleSpeak = useCallback(
    (id: string, rawText: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onError?.('Read aloud is not supported in this browser');
        return;
      }
      if (speakingId === id) {
        stop();
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = stripMarkdown(rawText);
      if (!cleanText) {
        return;
      }
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    },
    [speakingId, stop, onError]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speakingId, toggleSpeak, stop };
};
