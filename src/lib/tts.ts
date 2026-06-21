import type { VoiceSettings } from '@shared/types';

let cachedVoices: SpeechSynthesisVoice[] = [];

const initVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      const newVoices = window.speechSynthesis.getVoices();
      cachedVoices = newVoices;
      resolve(newVoices);
    };

    setTimeout(() => {
      const fallbackVoices = window.speechSynthesis.getVoices();
      cachedVoices = fallbackVoices;
      resolve(fallbackVoices);
    }, 1000);
  });
};

export const getAvailableVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (cachedVoices.length > 0) {
    return cachedVoices;
  }
  return await initVoices();
};

export const getChineseVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  const voices = await getAvailableVoices();
  return voices.filter(v => v.lang.startsWith('zh') || v.lang === 'cmn-Hans-CN');
};

export interface SpeakOptions extends Partial<VoiceSettings> {
  text: string;
  onEnd?: () => void;
  onStart?: () => void;
  onError?: (e: SpeechSynthesisErrorEvent) => void;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speak = async (options: SpeakOptions): Promise<void> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('当前浏览器不支持语音合成');
    return;
  }

  stopSpeak();

  const {
    text,
    pitch = 1.0,
    rate = 1.0,
    voiceURI,
    lang = 'zh-CN',
    onEnd,
    onStart,
    onError,
  } = options;

  if (!text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = pitch;
  utterance.rate = rate;
  utterance.lang = lang;

  if (voiceURI) {
    const voices = await getAvailableVoices();
    const matchedVoice = voices.find(v => v.voiceURI === voiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };

  utterance.onerror = (e) => {
    currentUtterance = null;
    console.error('语音合成错误:', e);
    onError?.(e);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeak = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
};

export const isSpeaking = (): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
};

export const speakWithCharacter = async (
  text: string,
  voiceSettings?: VoiceSettings,
  callbacks?: { onEnd?: () => void; onStart?: () => void; onError?: (e: SpeechSynthesisErrorEvent) => void }
) => {
  if (!voiceSettings) {
    await speak({ text, ...callbacks });
    return;
  }
  await speak({
    text,
    pitch: voiceSettings.pitch,
    rate: voiceSettings.rate,
    voiceURI: voiceSettings.voiceURI,
    lang: voiceSettings.lang || 'zh-CN',
    ...callbacks,
  });
};
