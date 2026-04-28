const STORAGE_KEY = 'dodo.soundEnabled';

let enabled = false;

if (typeof window !== 'undefined') {
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    enabled = false;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
}

export interface PlayHandle {
  stop: () => void;
}

export function playSound(url: string, volume = 0.5): PlayHandle {
  if (!enabled) {
    return { stop: () => {} };
  }
  const audio = new Audio(url);
  audio.volume = volume;
  void audio.play().catch(() => {
    // Autoplay policy or missing file — ignore silently.
  });
  return {
    stop: () => {
      audio.pause();
      audio.src = '';
    },
  };
}
