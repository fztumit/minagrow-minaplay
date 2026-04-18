import { normalizeSpeechKey } from '../speech/customAudio.js';

const LISTEN_PROGRESS_STORAGE_KEY = 'konusu_yorum_listen_progress_v1';

export type ListenProgress = {
  wordListens: Record<string, number>;
  sentenceListens: Record<string, number>;
  packSentenceListens: Record<string, number>;
  packDailyListens: Record<string, number>;
};

function createEmptyProgress(): ListenProgress {
  return {
    wordListens: {},
    sentenceListens: {},
    packSentenceListens: {},
    packDailyListens: {}
  };
}

export function loadListenProgress(): ListenProgress {
  const raw = localStorage.getItem(LISTEN_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return createEmptyProgress();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ListenProgress>;
    return {
      wordListens: normalizeCountMap(parsed.wordListens),
      sentenceListens: normalizeCountMap(parsed.sentenceListens),
      packSentenceListens: normalizeCountMap(parsed.packSentenceListens),
      packDailyListens: normalizeCountMap(parsed.packDailyListens)
    };
  } catch {
    return createEmptyProgress();
  }
}

export function saveListenProgress(progress: ListenProgress): void {
  localStorage.setItem(LISTEN_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function incrementWordListen(word: string, amount = 1): void {
  incrementByKey('wordListens', word, amount);
}

export function incrementSentenceListen(sentence: string, amount = 1): void {
  incrementByKey('sentenceListens', sentence, amount);
}

export function incrementPackSentenceListen(pack: string, sentence: string, amount = 1): void {
  const sentenceKey = makePackSentenceKey(pack, sentence);
  const dailyKey = makePackDailyKey(pack, new Date());
  if (!sentenceKey || !dailyKey) {
    return;
  }

  incrementByKey('packSentenceListens', sentenceKey, amount);
  incrementByKey('packDailyListens', dailyKey, amount);
}

export function resetListenProgress(): void {
  saveListenProgress(createEmptyProgress());
}

export function getWordListenCount(word: string): number {
  const progress = loadListenProgress();
  return progress.wordListens[normalizeSpeechKey(word)] ?? 0;
}

export function getTopSentenceListens(limit = 5): Array<{ sentence: string; count: number }> {
  const progress = loadListenProgress();
  return Object.entries(progress.sentenceListens)
    .filter((entry) => entry[0].length > 0 && entry[1] > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([sentence, count]) => ({ sentence, count }));
}

export function getPackSentenceProgress(
  pack: string,
  sentences: string[]
): {
  totalListens: number;
  topSentence: string;
  topSentenceCount: number;
  listenedSentenceCount: number;
} {
  const normalizedPack = normalizeSpeechKey(pack);
  if (!normalizedPack || sentences.length === 0) {
    return {
      totalListens: 0,
      topSentence: '',
      topSentenceCount: 0,
      listenedSentenceCount: 0
    };
  }

  const progress = loadListenProgress();
  const uniqueSentences = new Map<string, string>();
  for (const sentence of sentences) {
    const normalizedSentence = normalizeSpeechKey(sentence);
    if (!normalizedSentence || uniqueSentences.has(normalizedSentence)) {
      continue;
    }

    uniqueSentences.set(normalizedSentence, sentence.trim().replace(/\s+/g, ' '));
  }

  let totalListens = 0;
  let listenedSentenceCount = 0;
  let topSentence = '';
  let topSentenceCount = 0;

  for (const [normalizedSentence, sentenceLabel] of uniqueSentences) {
    const key = `${normalizedPack}::${normalizedSentence}`;
    const count = progress.packSentenceListens[key] ?? 0;
    totalListens += count;
    if (count > 0) {
      listenedSentenceCount += 1;
    }
    if (count > topSentenceCount) {
      topSentence = sentenceLabel;
      topSentenceCount = count;
    }
  }

  return {
    totalListens,
    topSentence,
    topSentenceCount,
    listenedSentenceCount
  };
}

export function getPackWeeklyMomentum(
  pack: string,
  now: Date = new Date()
): {
  currentWeekListens: number;
  previousWeekListens: number;
  change: number;
} {
  const normalizedPack = normalizeSpeechKey(pack);
  if (!normalizedPack) {
    return {
      currentWeekListens: 0,
      previousWeekListens: 0,
      change: 0
    };
  }

  const progress = loadListenProgress();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let currentWeekListens = 0;
  let previousWeekListens = 0;

  for (let dayOffset = 0; dayOffset <= 13; dayOffset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - dayOffset);
    const key = makePackDailyKey(normalizedPack, day);
    if (!key) {
      continue;
    }

    const count = progress.packDailyListens[key] ?? 0;
    if (dayOffset <= 6) {
      currentWeekListens += count;
    } else {
      previousWeekListens += count;
    }
  }

  return {
    currentWeekListens,
    previousWeekListens,
    change: currentWeekListens - previousWeekListens
  };
}

function incrementByKey(
  type: 'wordListens' | 'sentenceListens' | 'packSentenceListens' | 'packDailyListens',
  text: string,
  amount: number
): void {
  const normalized = normalizeSpeechKey(text);
  if (!normalized) {
    return;
  }

  const safeAmount = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
  const progress = loadListenProgress();
  progress[type][normalized] = (progress[type][normalized] ?? 0) + safeAmount;
  saveListenProgress(progress);
}

function makePackSentenceKey(pack: string, sentence: string): string {
  const normalizedPack = normalizeSpeechKey(pack);
  const normalizedSentence = normalizeSpeechKey(sentence);
  if (!normalizedPack || !normalizedSentence) {
    return '';
  }

  return `${normalizedPack}::${normalizedSentence}`;
}

function makePackDailyKey(pack: string, date: Date): string {
  const normalizedPack = normalizeSpeechKey(pack);
  if (!normalizedPack) {
    return '';
  }

  return `${normalizedPack}::${toLocalDateKey(date)}`;
}

function toLocalDateKey(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeCountMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value)
    .filter(
      (entry): entry is [string, number] =>
        typeof entry[0] === 'string' && Number.isFinite(entry[1]) && Number(entry[1]) > 0
    )
    .map(([key, count]) => [normalizeSpeechKey(key), Math.floor(count)]);

  return Object.fromEntries(entries);
}
