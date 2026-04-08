export type VocabularyWord =
  | 'su'
  | 'anne'
  | 'baba'
  | 'top'
  | 'araba'
  | 'kitap'
  | 'elma'
  | 'süt'
  | 'ekmek';

export type SpeechLevelId = 'starter' | 'everyday';
export type SpeechSetId = 'starter-first-words' | 'starter-play-set' | 'everyday-home-set';
export type VocabularyMediaType = 'photo' | 'gif';

export type VocabularyItem = {
  word: VocabularyWord;
  label: string;
  repeats: number;
  asset?: string;
  level: SpeechLevelId;
  setId: SpeechSetId;
  order: number;
  mediaType: VocabularyMediaType;
  guidedGifSrc?: string;
  promptLabel?: string;
  sceneClass?: string;
  featuredOnScene?: boolean;
};

export type SpeechSetDefinition = {
  id: SpeechSetId;
  level: SpeechLevelId;
  label: string;
  description: string;
  order: number;
};

export const SPEECH_LEVEL_LABELS: Record<SpeechLevelId, string> = {
  starter: '1. Seviye',
  everyday: '2. Seviye'
};

export const SPEECH_SET_DEFINITIONS: SpeechSetDefinition[] = [
  {
    id: 'starter-first-words',
    level: 'starter',
    label: 'İlk Kelimeler',
    description: 'Su, baba ve top ile başlanır.',
    order: 0
  },
  {
    id: 'starter-play-set',
    level: 'starter',
    label: 'Oyun Zamanı',
    description: 'Araba, elma ve kitap ile devam edilir.',
    order: 1
  },
  {
    id: 'everyday-home-set',
    level: 'everyday',
    label: 'Evde Yaşam',
    description: 'Anne, süt ve ekmek ile günlük yaşam seti.',
    order: 2
  }
];

export function getSpeechLevelIds(): SpeechLevelId[] {
  return Array.from(new Set(SPEECH_SET_DEFINITIONS.map((item) => item.level)));
}

export function getSpeechSets(level?: SpeechLevelId): SpeechSetDefinition[] {
  return SPEECH_SET_DEFINITIONS.filter((item) => !level || item.level === level).sort((left, right) => left.order - right.order);
}

export function getSpeechSetDefinition(setId: SpeechSetId): SpeechSetDefinition | undefined {
  return SPEECH_SET_DEFINITIONS.find((item) => item.id === setId);
}

export const VOCABULARY: VocabularyItem[] = [
  {
    word: 'su',
    label: 'su',
    repeats: 3,
    asset: '/assets/water-glass.svg',
    level: 'starter',
    setId: 'starter-first-words',
    order: 0,
    mediaType: 'photo',
    promptLabel: 'suya',
    sceneClass: 'scene-water',
    featuredOnScene: true
  },
  {
    word: 'anne',
    label: 'anne',
    repeats: 2,
    level: 'everyday',
    setId: 'everyday-home-set',
    order: 0,
    mediaType: 'photo',
    promptLabel: 'anneye'
  },
  {
    word: 'baba',
    label: 'baba',
    repeats: 2,
    asset: '/assets/object-father.svg',
    level: 'starter',
    setId: 'starter-first-words',
    order: 1,
    mediaType: 'photo',
    promptLabel: 'babaya',
    sceneClass: 'scene-father',
    featuredOnScene: true
  },
  {
    word: 'top',
    label: 'top',
    repeats: 2,
    asset: '/assets/object-ball.svg',
    level: 'starter',
    setId: 'starter-first-words',
    order: 2,
    mediaType: 'photo',
    promptLabel: 'topa',
    sceneClass: 'scene-ball',
    featuredOnScene: true
  },
  {
    word: 'araba',
    label: 'araba',
    repeats: 2,
    asset: '/assets/object-car.svg',
    level: 'starter',
    setId: 'starter-play-set',
    order: 0,
    mediaType: 'photo',
    promptLabel: 'arabaya',
    sceneClass: 'scene-car',
    featuredOnScene: true
  },
  {
    word: 'kitap',
    label: 'kitap',
    repeats: 2,
    asset: '/assets/object-book.svg',
    level: 'starter',
    setId: 'starter-play-set',
    order: 2,
    mediaType: 'photo',
    promptLabel: 'kitaba',
    sceneClass: 'scene-book'
  },
  {
    word: 'elma',
    label: 'elma',
    repeats: 2,
    asset: '/assets/object-apple.svg',
    level: 'starter',
    setId: 'starter-play-set',
    order: 1,
    mediaType: 'photo',
    promptLabel: 'elmaya',
    sceneClass: 'scene-apple',
    featuredOnScene: true
  },
  {
    word: 'süt',
    label: 'süt',
    repeats: 2,
    asset: '/assets/object-milk.svg',
    level: 'everyday',
    setId: 'everyday-home-set',
    order: 1,
    mediaType: 'photo',
    promptLabel: 'süte',
    sceneClass: 'scene-milk'
  },
  {
    word: 'ekmek',
    label: 'ekmek',
    repeats: 2,
    level: 'everyday',
    setId: 'everyday-home-set',
    order: 2,
    mediaType: 'photo',
    promptLabel: 'ekmeğe'
  }
];
