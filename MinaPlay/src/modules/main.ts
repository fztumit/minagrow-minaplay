import { SpeechStateMachine, type SpeechMachineSnapshot, type SpeechPromptEvent, type SpeechSoundEvent } from './speech/index.js';
import {
  TOUCH_MASTERY_KEY,
  TOUCH_PROGRESS_KEY,
  adaptiveRepeatInterval,
  adaptiveTargetWeight,
  isMastered,
  normalizeMastery,
  normalizeTouchProgress,
  overallSuccessRate,
  registerTouchAttempt,
  touchProgressEntry,
  type TouchMasteryState,
  type TouchProgressState
} from './touch-learning.js';
import {
  MATCH_PROGRESS_KEY,
  isMatchMastered,
  matchChoiceCount,
  matchLevelForProgress,
  matchProgressEntry,
  matchTargetWeight,
  normalizeMatchProgress,
  registerMatchAttempt,
  type MatchLevel,
  type MatchMode,
  type MatchProgressState,
  type MatchState
} from './match-learning.js';
import {
  DEFAULT_MIRROR_PLAN,
  DEFAULT_SLEEP_SETTINGS,
  MIRROR_PLAN_KEY,
  SLEEP_SETTINGS_KEY,
  mirrorExerciseOrder,
  normalizeMirrorPlan,
  normalizeSleepSettings,
  type MirrorPlanSettings,
  type SleepSettings
} from './mvp-settings.js';
import {
  SENTENCE_PROGRESS_KEY,
  normalizeSentenceProgress,
  sentenceKey,
  sentenceProgressEntry,
  sentenceTargetWeight,
  type SentenceProgressState
} from './sentence-learning.js';

type ViewName = 'home' | 'touch' | 'match' | 'sentence' | 'story' | 'mirror' | 'sleep' | 'peekaboo' | 'parent';
type PofiState =
  | 'welcome'
  | 'neutral'
  | 'guide'
  | 'attention'
  | 'targeting'
  | 'waiting'
  | 'hint'
  | 'playful'
  | 'calm'
  | 'exercise'
  | 'sleep'
  | 'peekaboo'
  | 'peekabooHidden'
  | 'peekabooFound'
  | 'success'
  | 'successSoft'
  | 'successCelebrate'
  | 'matchGuide'
  | 'matchTargeting'
  | 'matchWaiting'
  | 'matchHint'
  | 'matchSuccess'
  | 'matchRetry'
  | 'sentenceGuide'
  | 'sentenceContext'
  | 'sentenceWaiting'
  | 'sentenceHint'
  | 'sentenceSuccess'
  | 'sentenceRepeat'
  | 'sentenceRetry'
  | 'storyIdle'
  | 'storyAttention'
  | 'storyNarration'
  | 'storyInteraction'
  | 'storyWaiting'
  | 'storySuccess'
  | 'storyContinue'
  | 'sleepReady'
  | 'mirrorAttention'
  | 'mirrorTongueOut'
  | 'mirrorTongueLeft'
  | 'mirrorTongueRight'
  | 'mirrorOpenMouth'
  | 'mirrorPucker'
  | 'mirrorTeeth'
  | 'mirrorSuccess'
  | 'tryAgain';
type PofiMood = PofiState | 'attention' | 'blink' | 'settle' | 'sleepBlink';
type PofiParts = { body: string; eyes: string; mouth: string; hands?: string; eyebrows?: string; effect?: string };
type PofiPartFolder = 'body' | 'eyes' | 'mouth' | 'hands' | 'eyebrows' | 'effects';
type PofiRole = 'welcome' | 'idle' | 'guide' | 'attention' | 'model' | 'affirm' | 'celebrate' | 'softRedirect' | 'sleep' | 'play' | 'wait';
type PeekabooState = 'ready' | 'hidden' | 'found';
type TouchPofiMotion = 'idle' | 'focus' | 'listen' | 'speak' | 'affirm' | 'reassure';
type MatchPofiMotion = 'focus' | 'model' | 'listen' | 'guide' | 'affirm' | 'reassure';

interface PofiViewTransition {
  bridge: HTMLElement;
}

interface PofiExpression {
  role: PofiRole;
  parts: PofiParts;
}

interface ModuleStats {
  opens: number;
  actions: number;
  correct: number;
  softRedirects: number;
}

interface AnalyticsState {
  sessions: number;
  repeats: number;
  modules: Record<string, ModuleStats>;
  touch?: {
    hintLevels: Record<string, number>;
    successLatencyMsTotal: number;
    successLatencySamples: number;
    repeatNeeds: number;
  };
}

interface ParentGuidanceCard {
  title: string;
  value: string;
  note: string;
  tone: 'steady' | 'repeat' | 'next';
}

interface TouchVoiceVariation {
  id: string;
  label: string;
  text: string;
  rhythm: string;
}

type TouchSoundIntent = 'pofi' | 'word' | 'repeat';
type TouchSoundSource = 'user' | 'default';

interface TouchCard {
  id: string;
  label: string;
  word: string;
  learningGoal: string;
  image: string;
  images: string[];
  enabled: boolean;
  order: number;
  variations: TouchVoiceVariation[];
}

interface TouchRepeatSettings {
  enabled: boolean;
  maxDurationSeconds: number;
  maxRepeats: number;
  minIntervalMs: number;
  maxIntervalMs: number;
}

interface TouchSettingsState {
  cards: TouchCard[];
  repeat: TouchRepeatSettings;
}

interface MatchChoice {
  cardId: string;
  image: string;
  correct: boolean;
}

interface MatchRound {
  targetId: string;
  modelImage: string;
  correctImage: string;
  choices: MatchChoice[];
  mode: MatchMode;
  level: MatchLevel;
  state: MatchState;
  hintLevel: 0 | 1 | 2 | 3 | 4;
  startedAt: number;
}

type SentenceState = 'attention' | 'context' | 'waiting' | 'hint' | 'success' | 'repeat_prompt' | 'retry';
type SentenceCue = 'water' | 'food' | 'toilet' | 'sleep' | 'pain' | 'cold' | 'hot' | 'caregiver' | 'help' | 'walk';
type SentenceMode = 'learn' | 'board';
type MirrorState = 'idle' | 'attention' | 'exercise' | 'camera' | 'waiting' | 'success' | 'transition';
type MirrorExerciseId = 'tongue-out' | 'open-mouth' | 'pucker' | 'teeth' | 'tongue-left' | 'tongue-right';

type StoryState = 'idle' | 'attention' | 'narration' | 'interaction' | 'waiting' | 'success' | 'continue' | 'closure';
type StoryStepKind = 'attention' | 'narration' | 'interaction' | 'repeat' | 'closure';
type StoryEffect = 'sparkle' | 'water' | 'chime' | 'step' | 'warm' | 'sleep' | 'pop';
type ChildLockSettings = { enabled: boolean; keepAwake: boolean; parentTapCount: number; parentPullDistance: number; introSeen: boolean };
type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener: (type: 'release', listener: () => void) => void };
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };

interface SentenceScene {
  id: string;
  context: string;
  detail: string;
  cue: SentenceCue;
  image: string;
  alt: string;
}

interface SentencePrompt {
  id: string;
  subjectId: string;
  verbId: string;
  phrase: string;
  shortLabel: string;
  communicationGoal: string;
  group: 'core-needs' | 'care' | 'social' | 'movement' | 'preference';
  stage: 1 | 2 | 3;
  scenes: SentenceScene[];
}

interface MirrorExercise {
  id: MirrorExerciseId;
  command: string;
  success: string;
  pofiState: PofiState;
  durationMs: number;
  level: 1 | 2 | 3;
}

interface SentenceRound {
  prompt: SentencePrompt;
  scene: SentenceScene;
  state: SentenceState;
  hintLevel: 0 | 1 | 2 | 3 | 4;
  startedAt: number;
}

interface StoryChoice {
  id: string;
  cardId?: string;
  correct: boolean;
  symbol: string;
  label?: string;
  image?: string;
  alt?: string;
}

interface StoryStep {
  id: string;
  kind: StoryStepKind;
  text: string;
  cardIds?: string[];
  actionSymbol?: string;
  sceneImage?: string;
  sceneAlt?: string;
  effect?: StoryEffect;
  choices?: StoryChoice[];
  successText?: string;
  fallbackText?: string;
  pauseMs?: number;
}

interface StoryDefinition {
  id: string;
  title: string;
  theme: 'need' | 'play' | 'comfort' | 'sleep';
  steps: StoryStep[];
}

interface StorySession {
  story: StoryDefinition;
  stepIndex: number;
  state: StoryState;
  startedAt: number;
}

const STORAGE_KEY = 'minaplay_analytics_v1';
const PRIMARY_VIEWS: ViewName[] = ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep'];

const POFI_PARTS_ROOT = '/assets/pofi/parts';
const TOUCH_ACTIVE_MS = 900;
const MATCH_ATTENTION_MS = 620;
const MATCH_TARGETING_MS = 780;
const MATCH_WAITING_MS = 10_000;
const MATCH_HINT_STEP_MS = 10_000;
const MATCH_SUCCESS_MS = 900;
const MATCH_RETRY_MS = 1000;
const MATCH_FATIGUE_WRONG_STREAK = 2;
const PEEKABOO_AUTO_HIDE_MS = 5500;
const PEEKABOO_AUTO_REVEAL_MS = 6500;
const SENTENCE_CONTEXT_MS = 900;
const SENTENCE_HINT_LEVEL_1_MS = 5000;
const SENTENCE_HINT_STEP_MS = 3000;
const SENTENCE_REPEAT_PAUSE_MS = 750;
const SENTENCE_REPEAT_PROMPT_MS = 1600;
const SENTENCE_RETRY_MS = 900;
const STORY_ATTENTION_MS = 850;
const STORY_NARRATION_MS = 2100;
const STORY_WAITING_MS = 11000;
const STORY_SUCCESS_MS = 1200;
const STORY_REPEAT_MS = 1700;
const MIRROR_ATTENTION_MS = 700;
const MIRROR_SUCCESS_MS = 1100;
const VOICE_QUEUE_GAP_MS = 280;
const SPEECH_MIN_DURATION_MS = 900;
const SPEECH_MAX_DURATION_MS = 5200;
const AUDIO_FALLBACK_DURATION_MS = 2200;
const TOUCH_SETTINGS_KEY = 'minaplay_touch_settings_v1';
const CHILD_LOCK_SETTINGS_KEY = 'minaplay_child_lock_settings_v1';
const CHILD_LOCK_LONG_PRESS_MS = 1800;
const PARENT_GESTURE_ZONE_PX = 112;
const PARENT_GESTURE_RESET_MS = 1700;
const TOUCH_DB_NAME = 'minaplay_touch_cards_v1';
const TOUCH_DB_STORE = 'touchSettings';
const TOUCH_DB_VERSION = 1;
const TOUCH_MAX_GIF_BYTES = 3_200_000;
const TOUCH_MAX_IMAGE_EDGE = 720;
const TOUCH_SETTINGS_STORAGE_WARNING_BYTES = 4_500_000;
const TOUCH_DEFAULT_LEARNING_GOALS: Record<string, string> = {
  su: 'ihtiyaç ifade etme',
  baba: 'yakın kişiyi tanıma',
  top: 'oyun başlatma',
  araba: 'nesne ve hareket ilişkisi',
  elma: 'istek ve seçim belirtme'
};
const TOUCH_DEFAULT_REPEAT_SETTINGS: TouchRepeatSettings = {
  enabled: false,
  maxDurationSeconds: 30,
  maxRepeats: 8,
  minIntervalMs: 1800,
  maxIntervalMs: 3200
};

const DEFAULT_TOUCH_CARDS: TouchCard[] = [
  createDefaultTouchCard('su', 'Su', 'Su', 0, 'water'),
  createDefaultTouchCard('baba', 'Baba', 'Baba', 1, 'father'),
  createDefaultTouchCard('top', 'Top', 'Top', 2, 'ball'),
  createDefaultTouchCard('araba', 'Araba', 'Araba', 3, 'car'),
  createDefaultTouchCard('elma', 'Elma', 'Elma', 4, 'apple')
];

const MIRROR_EXERCISES: MirrorExercise[] = [
  { id: 'tongue-out', command: 'Dil çıkar', success: 'Harika', pofiState: 'mirrorTongueOut', durationMs: 4200, level: 1 },
  { id: 'open-mouth', command: 'Ağzını aç', success: 'Harika', pofiState: 'mirrorOpenMouth', durationMs: 3900, level: 1 },
  { id: 'pucker', command: 'Dudak büz', success: 'Çok güzel', pofiState: 'mirrorPucker', durationMs: 3900, level: 1 },
  { id: 'teeth', command: 'Diş göster', success: 'Harika', pofiState: 'mirrorTeeth', durationMs: 4200, level: 1 },
  { id: 'tongue-left', command: 'Dil sola', success: 'Çok güzel', pofiState: 'mirrorTongueLeft', durationMs: 4500, level: 2 },
  { id: 'tongue-right', command: 'Dil sağa', success: 'Harika', pofiState: 'mirrorTongueRight', durationMs: 4500, level: 2 }
];

const SENTENCE_PROMPTS: SentencePrompt[] = [
  {
    id: 'su-istiyorum',
    subjectId: 'su',
    verbId: 'istiyorum',
    phrase: 'Su istiyorum',
    shortLabel: 'Su',
    communicationGoal: 'susuzluk ve içme ihtiyacını ifade etme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'water-request-glass',
        context: 'Su istiyorum.',
        detail: 'su isteyen çocuk ve bardak',
        cue: 'water',
        image: '/assets/sentence/water-request.png',
        alt: 'Su isteyen çocuk ve su bardağı'
      },
      {
        id: 'water-drink-child',
        context: 'Su içelim.',
        detail: 'su içen çocuk',
        cue: 'water',
        image: '/assets/sentence/water-drink.png',
        alt: 'Su içen çocuk'
      }
    ]
  },
  {
    id: 'yemek-istiyorum',
    subjectId: 'yemek',
    verbId: 'istiyorum',
    phrase: 'Yemek istiyorum',
    shortLabel: 'Yemek',
    communicationGoal: 'açlık ve beslenme ihtiyacını ifade etme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'food-request-plate',
        context: 'Yemek istiyorum.',
        detail: 'yemek isteyen çocuk ve tabak',
        cue: 'food',
        image: '/assets/sentence/food-request.png',
        alt: 'Yemek isteyen çocuk ve yemek tabağı'
      },
      {
        id: 'food-eat-child',
        context: 'Yemek yiyelim.',
        detail: 'yemek yiyen çocuk',
        cue: 'food',
        image: '/assets/sentence/food-eat.png',
        alt: 'Yemek yiyen çocuk'
      }
    ]
  },
  {
    id: 'tuvalet',
    subjectId: 'tuvalet',
    verbId: 'soyle',
    phrase: 'Tuvalet',
    shortLabel: 'Tuvalet',
    communicationGoal: 'tuvalet ihtiyacını ifade etme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'toilet-need',
        context: 'Tuvalet.',
        detail: 'tuvalet ihtiyacını anlatan çocuk',
        cue: 'toilet',
        image: '/assets/sentence/toilet-need.png',
        alt: 'Tuvalet ihtiyacını anlatan çocuk'
      }
    ]
  },
  {
    id: 'uykum-var',
    subjectId: 'uyku',
    verbId: 'var',
    phrase: 'Uykum var',
    shortLabel: 'Uyku',
    communicationGoal: 'uyku ve dinlenme ihtiyacını ifade etme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'sleepy-child',
        context: 'Uykum var.',
        detail: 'uykusu gelen çocuk',
        cue: 'sleep',
        image: '/assets/sentence/sleepy-child.png',
        alt: 'Uykusu gelen çocuk'
      }
    ]
  },
  {
    id: 'acidi',
    subjectId: 'aci',
    verbId: 'soyle',
    phrase: 'Acıdı',
    shortLabel: 'Acıdı',
    communicationGoal: 'ağrı ve rahatsızlığı bildirme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'pain-child',
        context: 'Acıdı.',
        detail: 'canı acıyan çocuk',
        cue: 'pain',
        image: '/assets/sentence/pain-child.png',
        alt: 'Canı acıyan çocuk'
      }
    ]
  },
  {
    id: 'usudum',
    subjectId: 'usudum',
    verbId: 'soyle',
    phrase: 'Üşüdüm',
    shortLabel: 'Üşüdüm',
    communicationGoal: 'soğuk ve korunma ihtiyacını ifade etme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'cold-child',
        context: 'Üşüdüm.',
        detail: 'üşüyen çocuk ve mont',
        cue: 'cold',
        image: '/assets/sentence/cold-child.png',
        alt: 'Üşüyen çocuk ve mont'
      }
    ]
  },
  {
    id: 'sicak-oldu',
    subjectId: 'sicak',
    verbId: 'soyle',
    phrase: 'Sıcak oldu',
    shortLabel: 'Sıcak',
    communicationGoal: 'sıcak ve rahatlama ihtiyacını ifade etme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'hot-child',
        context: 'Sıcak oldu.',
        detail: 'sıcaklayan çocuk ve serinleme',
        cue: 'hot',
        image: '/assets/sentence/hot-child.png',
        alt: 'Sıcaklayan çocuk'
      }
    ]
  },
  {
    id: 'anne-gel',
    subjectId: 'anne',
    verbId: 'gel',
    phrase: 'Anne gel',
    shortLabel: 'Anne',
    communicationGoal: 'yakın kişiyi çağırma',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'mother-come',
        context: 'Anne gel.',
        detail: 'annesini çağıran çocuk',
        cue: 'caregiver',
        image: '/assets/sentence/mother-come.png',
        alt: 'Annesini çağıran çocuk'
      }
    ]
  },
  {
    id: 'baba-gel',
    subjectId: 'baba',
    verbId: 'gel',
    phrase: 'Baba gel',
    shortLabel: 'Baba',
    communicationGoal: 'yakın kişiyi çağırma',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'father-come',
        context: 'Baba gel.',
        detail: 'babasını çağıran çocuk',
        cue: 'caregiver',
        image: '/assets/sentence/father-come.png',
        alt: 'Babasını çağıran çocuk'
      }
    ]
  },
  {
    id: 'yardim-et',
    subjectId: 'yardim',
    verbId: 'et',
    phrase: 'Yardım et',
    shortLabel: 'Yardım',
    communicationGoal: 'destek isteme',
    group: 'core-needs',
    stage: 1,
    scenes: [
      {
        id: 'help-child',
        context: 'Yardım et.',
        detail: 'yardım isteyen çocuk',
        cue: 'help',
        image: '/assets/sentence/help-child.png',
        alt: 'Yardım isteyen çocuk'
      }
    ]
  },
  {
    id: 'gezmek-istiyorum',
    subjectId: 'gezmek',
    verbId: 'istiyorum',
    phrase: 'Gezmek istiyorum',
    shortLabel: 'Gezmek',
    communicationGoal: 'hareket ve dışarı çıkma isteğini ifade etme',
    group: 'movement',
    stage: 1,
    scenes: [
      {
        id: 'walk-request',
        context: 'Gezmek istiyorum.',
        detail: 'dışarı çıkmak isteyen çocuk',
        cue: 'walk',
        image: '/assets/sentence/walk-request.png',
        alt: 'Gezmek isteyen çocuk'
      }
    ]
  }
];

const STORY_LIBRARY: StoryDefinition[] = [
  {
    id: 'water-little-cloud',
    title: 'Küçük Su Molası',
    theme: 'need',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/sentence/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'child-thirsty', kind: 'narration', text: 'Çocuk susadı', sceneImage: '/assets/sentence/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'water' },
      { id: 'water-request', kind: 'narration', text: 'Su istiyorum', sceneImage: '/assets/sentence/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'chime' },
      {
        id: 'what-needed',
        kind: 'interaction',
        text: 'Ne istiyor?',
        sceneImage: '/assets/sentence/water-request.png',
        sceneAlt: 'Su isteyen çocuk',
        effect: 'water',
        successText: 'Evet. Su istiyorum.',
        fallbackText: 'Su istiyorum.',
        choices: [
          { id: 'su', label: 'Su', correct: true, symbol: '✓', image: '/assets/sentence/water-drink.png', alt: 'Su içen çocuk' },
          { id: 'yemek', label: 'Yemek', correct: false, symbol: '•', image: '/assets/sentence/food-request.png', alt: 'Yemek isteyen çocuk' }
        ]
      },
      { id: 'water-drink', kind: 'narration', text: 'Su içti', sceneImage: '/assets/sentence/water-drink.png', sceneAlt: 'Su içen çocuk', effect: 'water' },
      { id: 'repeat-water', kind: 'repeat', text: 'Hadi söyle. Su istiyorum', sceneImage: '/assets/sentence/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'done', kind: 'closure', text: 'Oh, iyi oldu', sceneImage: '/assets/sentence/water-drink.png', sceneAlt: 'Su içen çocuk', effect: 'sparkle' }
    ]
  },
  {
    id: 'ball-with-baba',
    title: 'Baba Top Attı',
    theme: 'play',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', cardIds: ['top'], effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'ball-exists', kind: 'narration', text: 'Top var', cardIds: ['top'], effect: 'pop' },
      { id: 'ball-floor', kind: 'narration', text: 'Top yerde', cardIds: ['top'], actionSymbol: '↓', effect: 'pop' },
      { id: 'baba-comes', kind: 'narration', text: 'Baba geldi', cardIds: ['baba'], effect: 'step' },
      {
        id: 'who-throws',
        kind: 'interaction',
        text: 'Topu kim atacak?',
        cardIds: ['top'],
        actionSymbol: '↷',
        effect: 'pop',
        successText: 'Evet. Baba top attı.',
        fallbackText: 'Baba top attı.',
        choices: [
          { id: 'baba', cardId: 'baba', correct: true, symbol: '↷', label: 'Baba' },
          { id: 'top', cardId: 'top', correct: false, symbol: '•', label: 'Top' }
        ]
      },
      { id: 'baba-throw', kind: 'narration', text: 'Baba top attı', cardIds: ['baba', 'top'], actionSymbol: '↷', effect: 'pop' },
      { id: 'repeat', kind: 'repeat', text: 'Hadi söyle. Top attı', cardIds: ['top'], actionSymbol: '↷', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'done', kind: 'closure', text: 'Bitti', cardIds: ['top'], actionSymbol: '✓', effect: 'sparkle' }
    ]
  },
  {
    id: 'cold-coat',
    title: 'Mont Giyelim',
    theme: 'comfort',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/sentence/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'cold', kind: 'narration', text: 'Çocuk üşüdü', sceneImage: '/assets/sentence/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'warm' },
      { id: 'say-cold', kind: 'narration', text: 'Üşüdüm', sceneImage: '/assets/sentence/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'chime' },
      {
        id: 'what-say',
        kind: 'interaction',
        text: 'Ne söyleyelim?',
        sceneImage: '/assets/sentence/cold-child.png',
        sceneAlt: 'Üşüyen çocuk',
        effect: 'warm',
        successText: 'Evet. Üşüdüm.',
        fallbackText: 'Üşüdüm.',
        choices: [
          { id: 'cold', label: 'Üşüdüm', correct: true, symbol: '✓', image: '/assets/sentence/cold-child.png', alt: 'Üşüyen çocuk' },
          { id: 'hot', label: 'Sıcak oldu', correct: false, symbol: '•', image: '/assets/sentence/hot-child.png', alt: 'Sıcaklayan çocuk' }
        ]
      },
      { id: 'coat', kind: 'narration', text: 'Mont geldi', sceneImage: '/assets/sentence/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'warm' },
      { id: 'repeat-cold', kind: 'repeat', text: 'Hadi söyle. Üşüdüm', sceneImage: '/assets/sentence/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'warm-done', kind: 'closure', text: 'Şimdi iyi', sceneImage: '/assets/sentence/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'sparkle' }
    ]
  },
  {
    id: 'food-time',
    title: 'Yemek Zamanı',
    theme: 'need',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/sentence/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'hungry', kind: 'narration', text: 'Çocuk acıktı', sceneImage: '/assets/sentence/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'chime' },
      { id: 'food-request', kind: 'narration', text: 'Yemek istiyorum', sceneImage: '/assets/sentence/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'chime' },
      { id: 'food-eat', kind: 'narration', text: 'Yemek geldi', sceneImage: '/assets/sentence/food-eat.png', sceneAlt: 'Yemek yiyen çocuk', effect: 'pop' },
      { id: 'repeat-food', kind: 'repeat', text: 'Hadi söyle. Yemek istiyorum', sceneImage: '/assets/sentence/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'done', kind: 'closure', text: 'Afiyet olsun', sceneImage: '/assets/sentence/food-eat.png', sceneAlt: 'Yemek yiyen çocuk', effect: 'sparkle' }
    ]
  },
  {
    id: 'sleep-soft',
    title: 'Uyku Bulutu',
    theme: 'sleep',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/sentence/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'sleepy', kind: 'narration', text: 'Uykum var', sceneImage: '/assets/sentence/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' },
      { id: 'soft', kind: 'narration', text: 'Yastık yumuşak', sceneImage: '/assets/sentence/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' },
      { id: 'quiet', kind: 'narration', text: 'Pofi sessiz', sceneImage: '/assets/sentence/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' },
      { id: 'repeat-sleep', kind: 'repeat', text: 'Hadi söyle. Uykum var', sceneImage: '/assets/sentence/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'good-night', kind: 'closure', text: 'İyi uykular', sceneImage: '/assets/sentence/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' }
    ]
  }
];

const POFI_VIEW_STATES: Partial<Record<ViewName, PofiState>> = {
  touch: 'guide',
  match: 'matchGuide',
  sentence: 'sentenceGuide',
  story: 'storyIdle',
  mirror: 'mirrorAttention',
  sleep: 'sleepReady',
  peekaboo: 'peekaboo'
};

const POFI_ACTION_STATES: Array<[string, PofiState]> = [
  ['wrong', 'tryAgain'],
  ['offtarget', 'tryAgain'],
  ['correct', 'success'],
  ['complete', 'success'],
  ['listen', 'success'],
  ['reveal', 'peekaboo']
];

const POFI_STABLE_BODY = 'default-v01.png';
const POFI_WARMTH_EFFECT = 'blush-soft-v01.png';
const POFI_HAPPY_EYEBROWS = 'happy-v01.png';
const POFI_EXPRESSION_CHANGE_MS = 220;
const POFI_POINT_HAND_MS = 1200;
const POFI_VIEW_TRANSITION_MS = 360;
const TOUCH_CUE_MS = 920;
const TOUCH_AFFIRM_MOTION_MS = 900;
const CLICK_HAND_CUE_MS = 760;
const CLICK_HAND_RIGHT_ASSET = '/assets/pofi/parts/hands/pofi_hand_click_cue_right_v01.png';
const CLICK_HAND_LEFT_ASSET = '/assets/pofi/parts/hands/pofi_hand_click_cue_left_v01.png';
const POFI_GUIDE_HAND_LEFT = 'pofi_hand_click_cue_right_v01.png';
const POFI_GUIDE_HAND_RIGHT = 'pofi_hand_click_cue_left_v01.png';
const TOUCH_WEATHER_EFFECTS = ['lightning', 'rain', 'snow', 'fog', 'rainbow'] as const;
type TouchWeatherEffect = (typeof TOUCH_WEATHER_EFFECTS)[number];

const POFI_EXPRESSIONS: Record<PofiMood, PofiExpression> = {
  welcome: {
    role: 'welcome',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      hands: 'pofi_hand_open_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  neutral: {
    role: 'idle',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  guide: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  targeting: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      hands: 'pofi_hand_open_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  waiting: {
    role: 'wait',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'waiting-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  hint: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
      hands: POFI_GUIDE_HAND_RIGHT,
      effect: POFI_WARMTH_EFFECT
    }
  },
  attention: {
    role: 'attention',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  playful: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  calm: {
    role: 'idle',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'half-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  exercise: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'tongue-out-v01.png',
      hands: 'pofi_hand_touch_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorAttention: {
    role: 'attention',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorTongueOut: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'tongue-out-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorTongueLeft: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'tongue-left-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorTongueRight: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'tongue-right-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorOpenMouth: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'surprised-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-vertical-big-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorPucker: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'pucker-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorTeeth: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'grimace-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorSuccess: {
    role: 'affirm',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      hands: 'pofi_hand_ok_right_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sleep: {
    role: 'sleep',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'drowsy-v01.png',
      mouth: 'closed-v01.png',
      hands: 'pofi_hand_closed_v01.png'
    }
  },
  sleepReady: {
    role: 'sleep',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'half-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  peekaboo: {
    role: 'play',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
      hands: 'pofi_hand_steer_left_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  peekabooHidden: {
    role: 'play',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'waiting-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      hands: 'pofi_hand_closed_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  peekabooFound: {
    role: 'affirm',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      hands: 'pofi_hand_open_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  success: {
    role: 'affirm',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      hands: 'pofi_hand_ok_right_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  successSoft: {
    role: 'affirm',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  successCelebrate: {
    role: 'celebrate',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wink-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-v01.png',
      hands: 'pofi_hand_steer_clap_v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  matchGuide: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  matchTargeting: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'talk-small-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  matchWaiting: {
    role: 'wait',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'waiting-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  matchHint: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  matchSuccess: {
    role: 'affirm',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  matchRetry: {
    role: 'softRedirect',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sentenceGuide: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sentenceContext: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'talk-small-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sentenceWaiting: {
    role: 'wait',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'waiting-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sentenceHint: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sentenceSuccess: {
    role: 'affirm',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sentenceRepeat: {
    role: 'attention',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sentenceRetry: {
    role: 'softRedirect',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  storyIdle: {
    role: 'idle',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'half-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  storyAttention: {
    role: 'attention',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  storyNarration: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'talk-small-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  storyInteraction: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  storyWaiting: {
    role: 'wait',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'waiting-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  storySuccess: {
    role: 'affirm',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  storyContinue: {
    role: 'guide',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  tryAgain: {
    role: 'softRedirect',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  blink: {
    role: 'idle',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'closed-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  settle: {
    role: 'idle',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-soft-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sleepBlink: {
    role: 'sleep',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'closed-v01.png',
      mouth: 'closed-v01.png',
      hands: 'pofi_hand_closed_v01.png'
    }
  }
};

const POFI_SETTLE_MOODS: Partial<Record<PofiState, PofiMood>> = {
  welcome: 'welcome',
  neutral: 'settle',
  guide: 'attention',
  attention: 'attention',
  targeting: 'targeting',
  waiting: 'waiting',
  hint: 'hint',
  playful: 'attention',
  calm: 'settle',
  exercise: 'exercise',
  sleep: 'sleep',
  peekaboo: 'peekaboo',
  peekabooHidden: 'peekabooHidden',
  peekabooFound: 'peekaboo',
  success: 'settle',
  successSoft: 'settle',
  successCelebrate: 'settle',
  matchGuide: 'matchGuide',
  matchTargeting: 'matchTargeting',
  matchWaiting: 'matchWaiting',
  matchHint: 'matchHint',
  matchSuccess: 'matchGuide',
  matchRetry: 'matchGuide',
  sentenceGuide: 'sentenceGuide',
  sentenceContext: 'sentenceContext',
  sentenceWaiting: 'sentenceWaiting',
  sentenceHint: 'sentenceHint',
  sentenceSuccess: 'sentenceGuide',
  sentenceRepeat: 'sentenceGuide',
  sentenceRetry: 'sentenceGuide',
  storyIdle: 'storyIdle',
  storyAttention: 'storyAttention',
  storyNarration: 'storyNarration',
  storyInteraction: 'storyInteraction',
  storyWaiting: 'storyWaiting',
  storySuccess: 'storyContinue',
  storyContinue: 'storyIdle',
  tryAgain: 'guide'
};

let pofiBaseState: PofiState = 'neutral';
let pofiIdleTimer: number | undefined;
let pofiBlinkTimer: number | undefined;
let pofiReturnTimer: number | undefined;
let pofiExpressionTimer: number | undefined;
let pofiHandTimer: number | undefined;
let peekabooState: PeekabooState = 'ready';
let peekabooReturnTimer: number | undefined;
let peekabooAutoTimer: number | undefined;
let peekabooPositionIndex = 0;
let touchRepeatTimer: number | undefined;
let touchActiveTimer: number | undefined;
let touchAffirmTimer: number | undefined;
let touchIdleRecoveryTimer: number | undefined;
let touchAffirmUntil = 0;
let touchVariationIndex = 0;
let touchAudioUnlocked = false;
let touchAudioPreload: Promise<void> | undefined;
let touchAudioPools: Record<string, HTMLAudioElement[]> = {};
let currentTouchAudio: HTMLAudioElement | undefined;
let lastTouchAudioSrc: string | undefined;
let voiceQueue: Promise<void> = Promise.resolve();
let lastTouchVariationId: string | undefined;
let touchSettings: TouchSettingsState = cloneDefaultTouchSettings();
let selectedTouchCardId = 'baba';
let activeTouchWeather: TouchWeatherEffect = 'rainbow';
let touchRepeatActive = false;
let touchRepeatStartedAt = 0;
let touchRepeatCount = 0;
let touchSpeechMachine: SpeechStateMachine | undefined;
let touchSpeechSnapshot: SpeechMachineSnapshot | undefined;
let lastTouchSpeechState: SpeechMachineSnapshot['state'] | undefined;
let touchSuccessCount = 0;
let touchProgress: TouchProgressState = {};
let touchMastery: TouchMasteryState = { masteredWords: [] };
let touchRoundImages: Record<string, string> = {};
let touchLastImageByCard: Record<string, string> = {};
let matchTargetId: string | undefined;
let lastMatchTargetId: string | undefined;
let matchProgress: MatchProgressState = {};
let matchRound: MatchRound | undefined;
let matchTimer: number | undefined;
let matchCorrectStreak = 0;
let matchWrongStreak = 0;
let sentenceRound: SentenceRound | undefined;
let sentenceTimer: number | undefined;
let sentenceMode: SentenceMode = 'learn';
let lastSentencePromptId: string | undefined;
let lastSentenceSubjectId: string | undefined;
let sentenceSameSubjectCount = 0;
let lastSentenceSceneByPrompt: Record<string, string> = {};
let sentenceProgress: SentenceProgressState = {};
let lastSentenceSpeechKind: 'targeting' | 'success' | 'repeat' | 'hint' | 'retry' | undefined;
let sentenceFlowToken = 0;
let storyTimer: number | undefined;
let storySession: StorySession | undefined;
let storyCursor = 0;
let lastStorySpeechKind: 'attention' | 'narration' | 'interaction' | 'success' | 'repeat' | 'closure' | undefined;
let sleepAudioContext: AudioContext | undefined;
let sleepMusicNodes: Array<OscillatorNode | GainNode> = [];
let sleepMelodyTimer: number | undefined;
let sleepAutoStopTimer: number | undefined;
let sleepMusicRunning = false;
let storyFlowToken = 0;
let mirrorState: MirrorState = 'idle';
let mirrorExerciseIndex = 0;
let mirrorTimer: number | undefined;
let mirrorFlowToken = 0;
let mirrorCameraStream: MediaStream | undefined;
let mirrorCameraRequested = false;
let mirrorPlanSettings: MirrorPlanSettings = { ...DEFAULT_MIRROR_PLAN };
let sleepSettings: SleepSettings = { ...DEFAULT_SLEEP_SETTINGS };
let childLockSettings: ChildLockSettings = { enabled: true, keepAwake: true, parentTapCount: 3, parentPullDistance: 80, introSeen: false };
let sleepLongPressTimer: number | undefined;
let wakeLockSentinel: WakeLockSentinelLike | undefined;
let wakeLockRequestInFlight = false;
let parentGestureTapCount = 0;
let parentGestureStartedAt = 0;
let parentGestureStartY = 0;
let parentGestureReadyForPull = false;

const DEFAULT_STATE: AnalyticsState = {
  sessions: 0,
  repeats: 0,
  modules: {}
};

export function createInitialModuleStats(): ModuleStats {
  return {
    opens: 0,
    actions: 0,
    correct: 0,
    softRedirects: 0
  };
}

export function createParentGuidanceCards(
  state: AnalyticsState,
  touchState: TouchProgressState = {},
  matchState: MatchProgressState = {},
  labels: Record<string, string> = {}
): ParentGuidanceCard[] {
  const modules = Object.entries(state.modules);
  const totals = modules.reduce(
    (acc, [_name, stats]) => {
      acc.correct += stats.correct;
      acc.soft += stats.softRedirects;
      acc.opens += stats.opens;
      return acc;
    },
    { correct: 0, soft: 0, opens: 0 }
  );
  const mostOpenedModule = modules.sort((a, b) => b[1].opens - a[1].opens)[0];
  const supportTarget = strongestSupportTarget(touchState, matchState, labels);
  const masteredTouchCount = Object.values(touchState).filter((entry) => isMastered(entry)).length;
  const masteredMatchCount = Object.values(matchState).filter((entry) => isMatchMastered(entry)).length;
  const masteredCount = masteredTouchCount + masteredMatchCount;

  const rhythm =
    state.sessions === 0
      ? {
          value: 'Henüz oyun yok',
          note: 'Bugün için Dokun ya da Eşleme ile iki dakikalık kısa bir başlangıç yeterli.'
        }
      : {
          value: `${state.sessions} oturum`,
          note:
            totals.soft > totals.correct && totals.soft > 0
              ? 'Bugün yönlendirme ihtiyacı doğru denemeden fazla. Tempo kısa ve tanıdık kalsın.'
              : `${parentModuleLabel(mostOpenedModule?.[0] ?? 'touch')} bugün en çok açılan alan. Akış sakin görünüyor.`
        };

  const repeat =
    supportTarget.score > 0
      ? {
          value: supportTarget.label,
          note: `${supportTarget.reason}. Aynı kartı kısa aralıklarla ve yumuşak sesle tekrar etmek iyi olur.`
        }
      : {
          value: masteredCount > 0 ? `${masteredCount} güçlü iz` : 'İlk izler hazırlanıyor',
          note:
            masteredCount > 0
              ? 'Öğrenilen kartları Eşleme içinde farklı görsellerle pekiştirmek için uygun zaman.'
              : 'Henüz özel tekrar odağı yok. İki tanıdık kartla sakin başlangıç yapılabilir.'
        };

  const next =
    supportTarget.score > 0
      ? {
          value: '2 kısa tur',
          note: `${supportTarget.label} için Dokun'da dinle-dokun, sonra Eşleme'de bir genelleme turu deneyin.`
        }
      : state.sessions > 0
        ? {
            value: 'Akışı koru',
            note: 'Bugünkü ritim yeterli. Yeni kart eklemeden aynı kelimeleri kısa tekrarlarla kapatın.'
          }
        : {
            value: 'Dokun ile başla',
            note: 'Baba ve su gibi tanıdık iki kartla kısa bir tur açmak yeterli.'
          };

  return [
    { title: 'Bugünkü ritim', value: rhythm.value, note: rhythm.note, tone: 'steady' },
    { title: 'Tekrar odağı', value: repeat.value, note: repeat.note, tone: 'repeat' },
    { title: 'Sonraki sakin adım', value: next.value, note: next.note, tone: 'next' }
  ];
}

function strongestSupportTarget(
  touchState: TouchProgressState,
  matchState: MatchProgressState,
  labels: Record<string, string>
): { id: string; label: string; score: number; reason: string } {
  const touchCandidates = Object.entries(touchState).map(([id, entry]) => {
    const hintCount = Object.values(entry.hintLevels).reduce((sum, count) => sum + count, 0);
    return {
      id,
      label: labels[id] ?? id,
      score: entry.fail + entry.repeatNeeds + hintCount,
      reason: `${entry.fail} yönlendirme ve ${entry.repeatNeeds} tekrar ihtiyacı`
    };
  });
  const matchCandidates = Object.entries(matchState).map(([id, entry]) => {
    const hintCount = Object.values(entry.hintLevels).reduce((sum, count) => sum + count, 0);
    return {
      id,
      label: labels[id] ?? id,
      score: entry.fail + entry.repeatNeeds + hintCount,
      reason: `${entry.fail} eşleme yönlendirmesi ve ${entry.repeatNeeds} tekrar ihtiyacı`
    };
  });

  return [...touchCandidates, ...matchCandidates].sort((a, b) => b.score - a.score)[0] ?? {
    id: '',
    label: '',
    score: 0,
    reason: ''
  };
}

function readAnalytics(): AnalyticsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeAnalytics(state: AnalyticsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readChildLockSettings(): ChildLockSettings {
  try {
    const raw = localStorage.getItem(CHILD_LOCK_SETTINGS_KEY);
    return raw ? { ...childLockSettings, ...JSON.parse(raw) } : { ...childLockSettings };
  } catch {
    return { ...childLockSettings };
  }
}

function writeChildLockSettings(settings: ChildLockSettings): void {
  localStorage.setItem(CHILD_LOCK_SETTINGS_KEY, JSON.stringify(settings));
}

function isChildMode(view: ViewName | string | undefined): boolean {
  return view === 'peekaboo' || PRIMARY_VIEWS.includes(view as ViewName);
}

function shouldLockChildNavigation(view: ViewName | string | undefined = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView): boolean {
  return childLockSettings.enabled && isChildMode(view);
}

function renderChildLockSettings(): void {
  const enabledInput = document.querySelector<HTMLInputElement>('[data-child-lock-enabled]');
  const awakeInput = document.querySelector<HTMLInputElement>('[data-child-lock-awake]');
  const tapsInput = document.querySelector<HTMLInputElement>('[data-parent-gesture-taps]');
  const pullInput = document.querySelector<HTMLInputElement>('[data-parent-gesture-pull]');
  const status = document.querySelector<HTMLElement>('[data-child-lock-status]');
  if (enabledInput) {
    enabledInput.checked = childLockSettings.enabled;
  }
  if (awakeInput) {
    awakeInput.checked = childLockSettings.keepAwake;
  }
  if (tapsInput) {
    tapsInput.value = String(childLockSettings.parentTapCount);
  }
  if (pullInput) {
    pullInput.value = String(childLockSettings.parentPullDistance);
  }
  if (status) {
    status.textContent = childLockSettings.enabled
      ? parentGestureGuideText()
      : 'Çocuk kilidi kapalı. Modlar arasında normal geçiş yapılabilir.';
  }
}

function parentGestureGuideText(): string {
  return `Sol üst köşeye ${childLockSettings.parentTapCount} kez dokunun; sonraki dokunuşta parmağı aşağı çekin.`;
}

function syncChildLockMode(view: ViewName | string | undefined = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView): void {
  document.querySelector<HTMLElement>('.app-shell')?.setAttribute('data-child-lock', String(shouldLockChildNavigation(view)));
  renderChildLockSettings();
  void syncScreenWakeLock();
}

async function syncScreenWakeLock(): Promise<void> {
  const activeView = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView;
  const shouldKeepAwake = childLockSettings.enabled && childLockSettings.keepAwake && isChildMode(activeView);
  if (!shouldKeepAwake || document.visibilityState !== 'visible') {
    if (wakeLockSentinel) {
      const sentinel = wakeLockSentinel;
      wakeLockSentinel = undefined;
      await sentinel.release().catch(() => undefined);
    }
    return;
  }

  if (wakeLockSentinel || wakeLockRequestInFlight) {
    return;
  }

  const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
  if (!wakeLock) {
    return;
  }

  wakeLockRequestInFlight = true;
  try {
    wakeLockSentinel = await wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = undefined;
    });
  } catch {
    wakeLockSentinel = undefined;
  } finally {
    wakeLockRequestInFlight = false;
  }
}

function ensureTouchAnalytics(state: AnalyticsState): NonNullable<AnalyticsState['touch']> {
  state.touch = state.touch ?? {
    hintLevels: {},
    successLatencyMsTotal: 0,
    successLatencySamples: 0,
    repeatNeeds: 0
  };
  return state.touch;
}

function trackTouchAnalyticsDetail(
  kind: 'success' | 'fail' | 'hint' | 'repeat',
  itemId: string,
  detail: { latencyMs?: number; hintLevel?: number; intervalMs?: number; submittedId?: string } = {}
): void {
  void itemId;
  void detail.intervalMs;
  void detail.submittedId;
  const state = readAnalytics();
  const touch = ensureTouchAnalytics(state);

  if (kind === 'success' && typeof detail.latencyMs === 'number') {
    touch.successLatencyMsTotal += detail.latencyMs;
    touch.successLatencySamples += 1;
  }

  if (kind === 'fail' || kind === 'repeat') {
    touch.repeatNeeds += 1;
  }

  if (kind === 'hint' && typeof detail.hintLevel === 'number') {
    const key = `level-${detail.hintLevel}`;
    touch.hintLevels[key] = (touch.hintLevels[key] ?? 0) + 1;
  }

  writeAnalytics(state);
}

function readTouchProgress(): TouchProgressState {
  try {
    return normalizeTouchProgress(JSON.parse(localStorage.getItem(TOUCH_PROGRESS_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

function writeTouchProgress(): void {
  localStorage.setItem(TOUCH_PROGRESS_KEY, JSON.stringify(touchProgress));
}

function readTouchMastery(): TouchMasteryState {
  try {
    return normalizeMastery(JSON.parse(localStorage.getItem(TOUCH_MASTERY_KEY) ?? '{}'));
  } catch {
    return { masteredWords: [] };
  }
}

function writeTouchMastery(): void {
  localStorage.setItem(TOUCH_MASTERY_KEY, JSON.stringify(touchMastery));
  publishTouchMasteryForMatching();
}

function readMatchProgress(): MatchProgressState {
  try {
    return normalizeMatchProgress(JSON.parse(localStorage.getItem(MATCH_PROGRESS_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

function readMirrorPlanSettings(): MirrorPlanSettings {
  try {
    return normalizeMirrorPlan(JSON.parse(localStorage.getItem(MIRROR_PLAN_KEY) ?? '{}'));
  } catch {
    return { ...DEFAULT_MIRROR_PLAN };
  }
}

function writeMirrorPlanSettings(): void {
  localStorage.setItem(MIRROR_PLAN_KEY, JSON.stringify(mirrorPlanSettings));
}

function readSleepSettings(): SleepSettings {
  try {
    return normalizeSleepSettings(JSON.parse(localStorage.getItem(SLEEP_SETTINGS_KEY) ?? '{}'));
  } catch {
    return { ...DEFAULT_SLEEP_SETTINGS };
  }
}

function writeSleepSettings(): void {
  localStorage.setItem(SLEEP_SETTINGS_KEY, JSON.stringify(sleepSettings));
}

function writeMatchProgress(): void {
  localStorage.setItem(MATCH_PROGRESS_KEY, JSON.stringify(matchProgress));
  renderMatchProgressTable();
}

function readSentenceProgress(): SentenceProgressState {
  try {
    return normalizeSentenceProgress(JSON.parse(localStorage.getItem(SENTENCE_PROGRESS_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

function writeSentenceProgress(): void {
  localStorage.setItem(SENTENCE_PROGRESS_KEY, JSON.stringify(sentenceProgress));
}

function publishTouchMasteryForMatching(): void {
  const globalLearning = globalThis as typeof globalThis & { MinaPlayLearning?: { masteredWords: string[]; sentenceNeedsMatch?: string[] } };
  const existing = globalLearning.MinaPlayLearning;
  globalLearning.MinaPlayLearning = {
    ...existing,
    masteredWords: [...touchMastery.masteredWords]
  };
}

function recordTouchAttempt(targetId: string, correct: boolean, latencyMs: number): void {
  const entry = touchProgressEntry(touchProgress, targetId);
  registerTouchAttempt(entry, correct);
  if (correct) {
    entry.successLatencyMsTotal += Math.max(0, latencyMs);
    entry.successLatencySamples += 1;
  }
  writeTouchProgress();
  updateTouchMastery(targetId);
  renderTouchProgressTable();
}

function recordTouchHintUsage(targetId: string, hintLevel: number): void {
  const entry = touchProgressEntry(touchProgress, targetId);
  entry.hintLevels[hintLevel] = (entry.hintLevels[hintLevel] ?? 0) + 1;
  if (hintLevel >= 2) {
    entry.repeatNeeds += 1;
  }
  writeTouchProgress();
  renderTouchProgressTable();
}

function updateTouchMastery(targetId: string): void {
  const entry = touchProgress[targetId];
  if (!isMastered(entry) || touchMastery.masteredWords.includes(targetId)) {
    return;
  }

  touchMastery = { masteredWords: [...touchMastery.masteredWords, targetId] };
  writeTouchMastery();
  renderTouchProgressTable();
  renderMatchProgressTable();
  renderMatchingGame();
  renderSentenceGame();
}

function touchProgressRateFor(cardId: string): number {
  const entry = touchProgress[cardId];
  const total = (entry?.success ?? 0) + (entry?.fail ?? 0);
  return total > 0 ? (entry?.success ?? 0) / total : 0;
}

function renderTouchProgressTable(): void {
  const table = document.querySelector<HTMLElement>('[data-touch-progress-table]');
  if (!table) {
    return;
  }

  const cards = enabledTouchCards();
  if (cards.length === 0) {
    table.textContent = 'Henüz aktif Dokun kartı yok.';
    return;
  }

  table.innerHTML = cards
    .map((card) => {
      const entry = touchProgress[card.id];
      const success = entry?.success ?? 0;
      const fail = entry?.fail ?? 0;
      const rate = Math.round(touchProgressRateFor(card.id) * 100);
      const latency =
        entry && entry.successLatencySamples > 0 ? Math.round(entry.successLatencyMsTotal / entry.successLatencySamples) : 0;
      const mastered = touchMastery.masteredWords.includes(card.id);
      const recentCorrectCount = entry?.recentResults.filter(Boolean).length ?? 0;
      const recentSummary = entry?.recentResults.length ? `${recentCorrectCount}/${entry.recentResults.length}` : '-';
      return `<article class="touch-progress-row">
        <strong>${card.word}</strong>
        <span>${card.learningGoal}</span>
        <span>${success} doğru</span>
        <span>${fail} yönlendirme</span>
        <span>%${rate}</span>
        <span>Son 5: ${recentSummary}</span>
        <span>${entry?.consecutiveCorrectCount ?? 0} seri</span>
        <span>${latency ? `${latency} ms` : '-'}</span>
        <span>${mastered ? 'Öğrenildi' : 'Çalışılıyor'}</span>
      </article>`;
    })
    .join('');
}

function renderMatchProgressTable(): void {
  const table = document.querySelector<HTMLElement>('[data-match-progress-table]');
  if (!table) {
    return;
  }

  const cards = matchCards();
  if (cards.length === 0) {
    table.textContent = 'Dokun bölümünde kelimeler çalışıldıkça Eşleme izi burada oluşacak.';
    return;
  }

  table.innerHTML = cards
    .map((card) => {
      const entry = matchProgress[card.id];
      const success = entry?.success ?? 0;
      const fail = entry?.fail ?? 0;
      const total = success + fail;
      const rate = total > 0 ? Math.round((success / total) * 100) : 0;
      const concept = entry?.conceptGeneralizationSuccess ?? 0;
      const sameImage = entry?.sameImageSuccess ?? 0;
      const hints = entry ? Object.values(entry.hintLevels).reduce((sum, count) => sum + count, 0) : 0;
      const repeatNeeds = entry?.repeatNeeds ?? 0;
      const latency = entry && entry.latencySamples > 0 ? Math.round(entry.latencyMsTotal / entry.latencySamples) : 0;
      const level = matchLevelForProgress(entry);
      const recentCorrectCount = entry?.recentResults.filter(Boolean).length ?? 0;
      const recentSummary = entry?.recentResults.length ? `${recentCorrectCount}/${entry.recentResults.length}` : '-';
      const mastered = isMatchMastered(entry);
      return `<article class="touch-progress-row">
        <strong>${card.word}</strong>
        <span>${level}. seviye</span>
        <span>${success} doğru</span>
        <span>${fail} yönlendirme</span>
        <span>%${rate}</span>
        <span>${latency ? `${latency} ms` : '-'}</span>
        <span>${concept} genelleme</span>
        <span>${sameImage} aynı görsel</span>
        <span>${hints} ipucu</span>
        <span>${repeatNeeds} tekrar</span>
        <span>Son 5: ${recentSummary}</span>
        <span>${entry?.consecutiveCorrectCount ?? 0} seri</span>
        <span>${mastered ? 'Öğrenildi' : 'Çalışılıyor'}</span>
      </article>`;
    })
    .join('');
}

function renderMvpModuleSettings(): void {
  const mirrorPreset = document.querySelector<HTMLSelectElement>('[data-mirror-plan-preset]');
  const sleepSound = document.querySelector<HTMLSelectElement>('[data-sleep-sound-setting]');
  const sleepDuration = document.querySelector<HTMLSelectElement>('[data-sleep-duration-setting]');
  const sleepVolume = document.querySelector<HTMLInputElement>('[data-sleep-volume]');
  if (mirrorPreset) {
    mirrorPreset.value = mirrorPlanSettings.preset;
  }
  if (sleepSound) {
    sleepSound.value = sleepSettings.sound;
  }
  if (sleepDuration) {
    sleepDuration.value = String(sleepSettings.durationMinutes);
  }
  if (sleepVolume) {
    sleepVolume.value = String(Math.round(sleepSettings.volume * 100));
  }
}

function ensureModule(state: AnalyticsState, view: string): ModuleStats {
  state.modules[view] ??= createInitialModuleStats();
  return state.modules[view];
}

function trackViewOpen(view: ViewName): void {
  if (view === 'home' || view === 'parent') {
    return;
  }

  const state = readAnalytics();
  state.sessions += 1;
  ensureModule(state, view).opens += 1;
  writeAnalytics(state);
}

function trackAction(action: string, _sourceElement?: HTMLElement): void {
  const activeView = document.querySelector<HTMLElement>('.view.active')?.dataset.viewPanel ?? 'home';
  const state = readAnalytics();
  const module = ensureModule(state, activeView);
  module.actions += 1;

  if (action.includes('correct') || action.includes('complete') || action.includes('listen')) {
    module.correct += 1;
  }

  if (action.includes('wrong') || action.includes('offtarget')) {
    module.softRedirects += 1;
  }

  if (action.includes('repeat') || action.includes('select')) {
    state.repeats += 1;
  }

  writeAnalytics(state);

  const actionState = pofiStateForAction(action);
  const touchMachineOwnsPofi = activeView === 'touch' && Boolean(touchSpeechMachine) && action.startsWith('touch-');
  if (touchMachineOwnsPofi) {
    renderParentMetrics();
    return;
  }

  if (actionState) {
    showPofiReaction(actionState);
  } else {
    setPofiBaseState(POFI_VIEW_STATES[activeView as ViewName] ?? 'neutral');
  }

  renderParentMetrics();
}

function activateView(view: ViewName): void {
  const transition = beginPofiViewTransition();
  const shell = document.querySelector<HTMLElement>('.app-shell');
  shell?.classList.add('view-transitioning');

  document.querySelectorAll<HTMLElement>('[data-view-panel]').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.viewPanel === view);
  });

  document.querySelectorAll<HTMLButtonElement>('.bottom-nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });

  shell?.setAttribute('data-active-view', view);
  syncChildLockMode(view);
  setPofiBaseState(POFI_VIEW_STATES[view] ?? 'neutral');
  syncTouchRitual(view);
  syncSleepMode(view);
  syncPeekabooMode(view);
  if (view === 'match') {
    startMatchRound();
  } else {
    clearMatchTimer();
  }
  if (view === 'sentence') {
    startSentenceRound();
  } else {
    clearSentenceTimer();
  }
  if (view === 'story') {
    unlockTouchAudio();
    startStorySession();
  } else {
    clearStoryTimer();
  }
  if (view === 'mirror') {
    unlockTouchAudio();
    startMirrorSession();
  } else {
    stopMirrorSession();
  }
  if (view === 'parent') {
    renderTouchProgressTable();
    renderMatchProgressTable();
    renderChildLockSettings();
    renderMvpModuleSettings();
    void renderDeviceStatus();
  }
  trackViewOpen(view);
  renderParentMetrics();
  completePofiViewTransition(transition);
  window.setTimeout(() => shell?.classList.remove('view-transitioning'), POFI_VIEW_TRANSITION_MS);
}

function syncPeekabooMode(view: ViewName): void {
  if (peekabooReturnTimer) {
    window.clearTimeout(peekabooReturnTimer);
    peekabooReturnTimer = undefined;
  }
  if (peekabooAutoTimer) {
    window.clearTimeout(peekabooAutoTimer);
    peekabooAutoTimer = undefined;
  }

  if (view === 'peekaboo') {
    peekabooState = 'ready';
    renderPeekabooMode();
    schedulePeekabooHide();
  }
}

function renderPeekabooMode(): void {
  const surface = document.querySelector<HTMLElement>('[data-peekaboo-surface]');
  const button = document.querySelector<HTMLButtonElement>('[data-peekaboo-toggle]');
  const label = document.querySelector<HTMLElement>('[data-peekaboo-label]');
  if (!surface || !button || !label) {
    return;
  }

  surface.dataset.peekabooState = peekabooState;
  surface.dataset.peekabooPosition = ['left', 'center', 'right'][peekabooPositionIndex % 3];
  button.dataset.trackAction = peekabooState === 'hidden' ? 'peekaboo-found' : 'peekaboo-hide';
  label.textContent = peekabooState === 'hidden' ? 'Pofi bulundu' : 'Pofi saklandı';
}

function handlePeekabooToggle(button: HTMLElement): void {
  clearPeekabooAutoTimer();
  if (peekabooState === 'hidden') {
    peekabooState = 'found';
    renderPeekabooMode();
    trackAction('peekaboo-found', button);
    setPofiBaseState('peekabooFound');
    peekabooReturnTimer = window.setTimeout(() => {
      peekabooReturnTimer = undefined;
      peekabooState = 'ready';
      renderPeekabooMode();
      if (document.querySelector<HTMLElement>('#view-peekaboo')?.classList.contains('active')) {
        setPofiBaseState('peekaboo');
        schedulePeekabooHide();
      }
    }, 1000);
    return;
  }

  peekabooState = 'hidden';
  renderPeekabooMode();
  trackAction('peekaboo-hide', button);
  setPofiBaseState('peekabooHidden');
  schedulePeekabooReveal();
}

function clearPeekabooAutoTimer(): void {
  if (peekabooAutoTimer) {
    window.clearTimeout(peekabooAutoTimer);
    peekabooAutoTimer = undefined;
  }
}

function schedulePeekabooHide(): void {
  clearPeekabooAutoTimer();
  peekabooAutoTimer = window.setTimeout(() => {
    peekabooAutoTimer = undefined;
    if (!document.querySelector<HTMLElement>('#view-peekaboo')?.classList.contains('active')) {
      return;
    }
    peekabooPositionIndex = (peekabooPositionIndex + 1) % 3;
    peekabooState = 'hidden';
    setPofiBaseState('peekabooHidden');
    renderPeekabooMode();
    schedulePeekabooReveal();
  }, PEEKABOO_AUTO_HIDE_MS);
}

function schedulePeekabooReveal(): void {
  clearPeekabooAutoTimer();
  peekabooAutoTimer = window.setTimeout(() => {
    peekabooAutoTimer = undefined;
    if (!document.querySelector<HTMLElement>('#view-peekaboo')?.classList.contains('active')) {
      return;
    }
    peekabooState = 'ready';
    setPofiBaseState('peekaboo');
    renderPeekabooMode();
    schedulePeekabooHide();
  }, PEEKABOO_AUTO_REVEAL_MS);
}

function openParentWithUnlock(): void {
  activateView('parent');
}

function startSleepLongPressStop(): void {
  if (!sleepMusicRunning) {
    return;
  }
  window.clearTimeout(sleepLongPressTimer);
  sleepLongPressTimer = window.setTimeout(() => {
    sleepLongPressTimer = undefined;
    void stopSleepMusic();
  }, CHILD_LOCK_LONG_PRESS_MS);
}

function clearSleepLongPressStop(): void {
  if (sleepLongPressTimer) {
    window.clearTimeout(sleepLongPressTimer);
    sleepLongPressTimer = undefined;
  }
}

function showParentSecretIntroIfNeeded(): void {
  const intro = document.querySelector<HTMLElement>('[data-parent-secret-intro]');
  const guide = document.querySelector<HTMLElement>('[data-parent-secret-guide]');
  if (!intro || !guide || childLockSettings.introSeen) {
    return;
  }
  guide.textContent = `${parentGestureGuideText()} Bu hareket ebeveyn panelini açar. İsterseniz bu şifreyi Ebeveyn panelinden güncelleyebilirsiniz.`;
  intro.hidden = false;
}

function acceptParentSecretIntro(): void {
  childLockSettings = { ...childLockSettings, introSeen: true };
  writeChildLockSettings(childLockSettings);
  document.querySelector<HTMLElement>('[data-parent-secret-intro]')?.setAttribute('hidden', '');
}

function resetParentGesture(): void {
  parentGestureTapCount = 0;
  parentGestureStartedAt = 0;
  parentGestureStartY = 0;
  parentGestureReadyForPull = false;
}

function isInParentGestureZone(event: PointerEvent): boolean {
  return event.clientX <= PARENT_GESTURE_ZONE_PX && event.clientY <= PARENT_GESTURE_ZONE_PX;
}

function handleParentGesturePointerDown(event: PointerEvent): void {
  if (!isInParentGestureZone(event)) {
    resetParentGesture();
    return;
  }

  const now = window.performance.now();
  if (!parentGestureStartedAt || now - parentGestureStartedAt > PARENT_GESTURE_RESET_MS) {
    parentGestureTapCount = 0;
  }

  parentGestureStartedAt = now;
  parentGestureStartY = event.clientY;
  parentGestureReadyForPull = parentGestureTapCount >= childLockSettings.parentTapCount;
}

function handleParentGesturePointerUp(event: PointerEvent): void {
  if (!isInParentGestureZone(event)) {
    resetParentGesture();
    return;
  }

  if (parentGestureReadyForPull) {
    resetParentGesture();
    return;
  }

  parentGestureTapCount += 1;
}

function handleParentGesturePointerMove(event: PointerEvent): void {
  if (!parentGestureReadyForPull) {
    return;
  }

  if (event.clientY - parentGestureStartY >= childLockSettings.parentPullDistance) {
    resetParentGesture();
    openParentWithUnlock();
  }
}

function pofiStateForAction(action: string): PofiState | undefined {
  return POFI_ACTION_STATES.find(([keyword]) => action.includes(keyword))?.[1];
}

function pofiImage(path: string, className: string, alt = ''): HTMLImageElement {
  const image = document.createElement('img');
  image.className = className;
  image.src = path;
  image.alt = alt;
  return image;
}

function pofiPartPath(part: PofiPartFolder, fileName: string): string {
  return `${POFI_PARTS_ROOT}/${part}/${fileName}`;
}

function preloadPofiParts(): void {
  const paths = new Set<string>();

  Object.values(POFI_EXPRESSIONS).forEach((expression) => {
    paths.add(pofiPartPath('body', expression.parts.body));
    paths.add(pofiPartPath('eyes', expression.parts.eyes));
    paths.add(pofiPartPath('mouth', expression.parts.mouth));
    if (expression.parts.eyebrows) {
      paths.add(pofiPartPath('eyebrows', expression.parts.eyebrows));
    }
    if (expression.parts.effect) {
      paths.add(pofiPartPath('effects', expression.parts.effect));
    }
    if (expression.parts.hands) {
      paths.add(pofiPartPath('hands', expression.parts.hands));
    }
  });

  paths.forEach((path) => {
    const image = new Image();
    image.src = path;
  });
}

function activePofiAvatar(): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-pofi-avatar]')).find((avatar) => {
    return avatar.closest<HTMLElement>('[data-view-panel]')?.classList.contains('active');
  });
}

function applyPofiBridgeRect(bridge: HTMLElement, rect: DOMRect): void {
  bridge.style.left = `${rect.left}px`;
  bridge.style.top = `${rect.top}px`;
  bridge.style.width = `${rect.width}px`;
  bridge.style.height = `${rect.height}px`;
}

function beginPofiViewTransition(): PofiViewTransition | undefined {
  if (!pofiMotionAllowed()) {
    return undefined;
  }

  const avatar = activePofiAvatar();
  if (!avatar) {
    return undefined;
  }

  const rect = avatar.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return undefined;
  }

  const bridge = avatar.cloneNode(true) as HTMLElement;
  bridge.classList.add('pofi-transition-bridge');
  bridge.setAttribute('aria-hidden', 'true');
  bridge.removeAttribute('aria-label');
  bridge.removeAttribute('id');
  applyPofiBridgeRect(bridge, rect);
  document.body.append(bridge);
  void bridge.offsetWidth;
  bridge.dataset.transitionPhase = 'move';

  return { bridge };
}

function completePofiViewTransition(transition?: PofiViewTransition): void {
  if (!transition) {
    return;
  }

  window.setTimeout(() => {
    const nextAvatar = activePofiAvatar();
    if (!nextAvatar) {
      transition.bridge.dataset.transitionPhase = 'exit';
      window.setTimeout(() => transition.bridge.remove(), POFI_VIEW_TRANSITION_MS);
      return;
    }

    applyPofiBridgeRect(transition.bridge, nextAvatar.getBoundingClientRect());
    transition.bridge.dataset.transitionPhase = 'arrive';
    window.setTimeout(() => transition.bridge.remove(), POFI_VIEW_TRANSITION_MS);
  }, 40);
}

function clearPofiTimers(): void {
  if (pofiIdleTimer) {
    window.clearTimeout(pofiIdleTimer);
  }

  if (pofiBlinkTimer) {
    window.clearTimeout(pofiBlinkTimer);
  }

  if (pofiReturnTimer) {
    window.clearTimeout(pofiReturnTimer);
  }

  if (pofiExpressionTimer) {
    window.clearTimeout(pofiExpressionTimer);
  }

  if (pofiHandTimer) {
    window.clearTimeout(pofiHandTimer);
  }
}

function pofiMotionAllowed(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function settlePofiMood(state: PofiState): PofiMood {
  return POFI_SETTLE_MOODS[state] ?? 'settle';
}

function ensurePofiLayer(container: HTMLElement, className: string, alt = ''): HTMLImageElement {
  const layerClass = className.trim().split(/\s+/).at(-1);
  const existing = layerClass ? container.querySelector<HTMLImageElement>(`.${layerClass}`) : undefined;
  if (existing) {
    return existing;
  }

  const image = pofiImage('', className, alt);
  container.append(image);
  return image;
}

function updatePofiLayer(image: HTMLImageElement, path: string): void {
  if (image.getAttribute('src') === path) {
    return;
  }

  image.src = path;
}

function updateOptionalPofiLayer(image: HTMLImageElement, part: PofiPartFolder, fileName?: string): void {
  if (!fileName) {
    image.removeAttribute('src');
    image.hidden = true;
    return;
  }

  image.hidden = false;
  updatePofiLayer(image, pofiPartPath(part, fileName));

  if (isPointHand(fileName)) {
    pofiHandTimer = window.setTimeout(() => {
      if (image.getAttribute('src') === pofiPartPath(part, fileName)) {
        image.removeAttribute('src');
        image.hidden = true;
      }
    }, POFI_POINT_HAND_MS);
  }
}

function isPointHand(fileName: string): boolean {
  return [POFI_GUIDE_HAND_LEFT, POFI_GUIDE_HAND_RIGHT, 'pofi_hand_point_left_v01.png', 'pofi_hand_point_right_v01.png'].includes(fileName);
}

function renderPofiParts(container: HTMLElement, mood: PofiMood, parts: PofiParts, animateExpression = true): void {
  container.dataset.pofiMood = mood;
  container.dataset.pofiRole = POFI_EXPRESSIONS[mood].role;

  if (animateExpression) {
    container.classList.remove('pofi-expression-change');
    void container.offsetWidth;
    container.classList.add('pofi-expression-change');
    pofiExpressionTimer = window.setTimeout(() => {
      container.classList.remove('pofi-expression-change');
    }, POFI_EXPRESSION_CHANGE_MS);
  }

  updatePofiLayer(ensurePofiLayer(container, 'pofi-body'), pofiPartPath('body', parts.body));
  updateOptionalPofiLayer(ensurePofiLayer(container, 'pofi-effect pofi-blush'), 'effects', parts.effect);
  updateOptionalPofiLayer(ensurePofiLayer(container, 'pofi-face pofi-eyebrows'), 'eyebrows', parts.eyebrows);
  updatePofiLayer(ensurePofiLayer(container, 'pofi-face pofi-eyes'), pofiPartPath('eyes', parts.eyes));
  updatePofiLayer(ensurePofiLayer(container, 'pofi-face pofi-mouth'), pofiPartPath('mouth', parts.mouth));
  updateOptionalPofiLayer(ensurePofiLayer(container, 'pofi-hands'), 'hands', parts.hands);
}

function renderPofiAvatar(container: HTMLElement, mood: PofiMood): void {
  renderPofiParts(container, mood, POFI_EXPRESSIONS[mood].parts);
}

function updatePofiEyes(container: HTMLElement, fileName: string): void {
  updatePofiLayer(ensurePofiLayer(container, 'pofi-face pofi-eyes'), pofiPartPath('eyes', fileName));
}

function renderActivePofi(state?: PofiState): void {
  const avatar = activePofiAvatar();
  if (!avatar) {
    return;
  }

  const nextState = state ?? pofiBaseState;
  avatar.dataset.pofiState = nextState;
  renderPofiAvatar(avatar, nextState);
}

function renderPofiAvatars(): void {
  document.querySelectorAll<HTMLElement>('[data-pofi-avatar]').forEach((avatar) => {
    const state = (avatar.dataset.pofiState as PofiState | undefined) ?? 'neutral';
    avatar.dataset.pofiState = state;
    renderPofiAvatar(avatar, state);
  });
}

function schedulePofiLife(): void {
  if (!pofiMotionAllowed()) {
    return;
  }

  pofiBlinkTimer = window.setTimeout(() => {
    const avatar = activePofiAvatar();
    if (!avatar) {
      schedulePofiLife();
      return;
    }

    const baseParts = POFI_EXPRESSIONS[pofiBaseState].parts;
    updatePofiEyes(avatar, pofiBaseState === 'sleep' ? 'closed-v01.png' : 'closed-soft-v01.png');
    pofiReturnTimer = window.setTimeout(() => {
      const nextAvatar = activePofiAvatar();
      if (nextAvatar) {
        updatePofiEyes(nextAvatar, baseParts.eyes);
      }
      schedulePofiLife();
    }, pofiBaseState === 'sleep' ? 520 : 150);
  }, randomBetween(3000, 7000));

  pofiIdleTimer = window.setTimeout(() => {
    const avatar = activePofiAvatar();
    if (!avatar) {
      return;
    }

    renderPofiAvatar(avatar, settlePofiMood(pofiBaseState));
    pofiReturnTimer = window.setTimeout(() => {
      renderActivePofi(pofiBaseState);
    }, randomBetween(1200, 1800));
  }, randomBetween(18000, 26000));
}

function setPofiBaseState(state: PofiState): void {
  pofiBaseState = state;
  clearPofiTimers();
  renderActivePofi(state);
  schedulePofiLife();
}

function showPofiReaction(state: PofiState): void {
  clearPofiTimers();
  renderActivePofi(state);
  pofiReturnTimer = window.setTimeout(() => {
    renderActivePofi(pofiBaseState);
    schedulePofiLife();
  }, state === 'tryAgain' ? 1000 : 900);
}

function touchSurface(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-touch-surface]');
}

function cloneDefaultTouchSettings(): TouchSettingsState {
  return {
    cards: DEFAULT_TOUCH_CARDS.map((card) => ({
      ...card,
      images: [...card.images],
      variations: card.variations.map((variation) => ({ ...variation }))
    })),
    repeat: { ...TOUCH_DEFAULT_REPEAT_SETTINGS }
  };
}

function createDefaultTouchCard(id: string, label: string, word: string, order: number, visual: string): TouchCard {
  const image = createTouchCardImage(label, visual);
  return {
    id,
    label,
    word,
    learningGoal: TOUCH_DEFAULT_LEARNING_GOALS[id] ?? 'kavramı tanıma',
    image,
    images: [image],
    enabled: true,
    order,
    variations: createDefaultVariations(id, word)
  };
}

function createDefaultVariations(cardId: string, word: string): TouchVoiceVariation[] {
  const lowerId = cardId.toLowerCase();
  const presets: Record<string, string[]> = {
    baba: ['Baba', 'Bab-ba', 'Ba Ba', 'Baaa Baaa', 'Baaa Ba', 'Ba Baaa'],
    su: ['Su', 'Suu', 'Ssss Su', 'Suuu'],
    top: ['Top', 'To-op', 'Tooop', 'To-op Top'],
    araba: ['Araba', 'A-ra-ba', 'Aaa-raba', 'Ara-ba'],
    elma: ['Elma', 'El-ma', 'Eeelma', 'Elmaa']
  };
  const texts = presets[lowerId] ?? [word, `${word} ${word}`, word.split('').join('-')];
  return texts.map((text, index) => ({
    id: `${lowerId}-${index + 1}`,
    label: text,
    text,
    rhythm: index === 0 ? 'normal' : `ritim-${index + 1}`
  }));
}

function createTouchCardImage(label: string, visual: string): string {
  void label;
  return `toy:${visual}`;
}

function defaultToyVisualForCard(card: TouchCard): string | undefined {
  const defaultVisuals: Record<string, string> = {
    su: 'water',
    baba: 'father',
    top: 'ball',
    araba: 'car',
    elma: 'apple'
  };
  return defaultVisuals[card.id.toLowerCase()];
}

function touchCardImageSource(card: TouchCard): string {
  const image = touchRoundImages[card.id] ?? card.image;
  return image.startsWith('data:image/svg+xml')
    ? createTouchCardImage(card.label, defaultToyVisualForCard(card) ?? 'ball')
    : image;
}

function chooseTouchRoundImage(card: TouchCard): string {
  const images = normalizedTouchImages(card);
  const previous = touchLastImageByCard[card.id];
  const pool = images.length > 1 ? images.filter((image) => image !== previous) : images;
  const image = pool[randomBetween(0, pool.length - 1)] ?? images[0] ?? card.image;
  touchLastImageByCard[card.id] = image;
  touchRoundImages[card.id] = image;
  return image;
}

function normalizedTouchImages(card: TouchCard): string[] {
  const images = card.images?.length ? card.images : [card.image];
  return [...new Set(images.filter(Boolean))];
}

function touchCardVisualMarkup(card: TouchCard): string {
  const image = touchCardImageSource(card);
  if (!image.startsWith('toy:')) {
    return `<img src="${image}" alt="" loading="lazy" />`;
  }

  const visual = image.replace('toy:', '');
  return `<span class="touch-toy touch-toy-${visual}" aria-hidden="true">
    <span class="toy-shadow"></span>
    <span class="toy-part toy-main"></span>
    <span class="toy-part toy-accent"></span>
    <span class="toy-part toy-detail"></span>
    <span class="toy-part toy-gloss"></span>
  </span>`;
}

function touchCardVisualMarkupForImage(card: TouchCard, image: string): string {
  const previous = touchRoundImages[card.id];
  touchRoundImages[card.id] = image;
  const markup = touchCardVisualMarkup(card);
  if (previous) {
    touchRoundImages[card.id] = previous;
  } else {
    delete touchRoundImages[card.id];
  }
  return markup;
}

function enabledTouchCards(): TouchCard[] {
  return [...touchSettings.cards].filter((card) => card.enabled).sort((a, b) => a.order - b.order);
}

function visibleTouchCards(): TouchCard[] {
  const enabled = enabledTouchCards();
  const visibleIds = touchSpeechSnapshot?.visibleItemIds ?? [];
  if (visibleIds.length === 0) {
    return enabled;
  }

  const visible = visibleIds
    .map((id) => enabled.find((card) => card.id === id))
    .filter((card): card is TouchCard => Boolean(card));
  return visible.length > 0 ? visible : enabled;
}

function selectedTouchCard(): TouchCard {
  const enabled = enabledTouchCards();
  return (
    enabled.find((card) => card.id === selectedTouchCardId) ??
    touchSettings.cards.find((card) => card.id === selectedTouchCardId) ??
    enabled[0] ??
    touchSettings.cards[0] ??
    DEFAULT_TOUCH_CARDS[1]
  );
}

function nextTouchVariation(card: TouchCard, rhythm: TouchVoiceVariation['rhythm'] = 'normal'): TouchVoiceVariation {
  const variations = card.variations.length > 0 ? card.variations : createDefaultVariations(card.id, card.word);
  const pool = variations.length > 1 ? variations.filter((variation) => variation.id !== lastTouchVariationId) : variations;
  const variation = pool[randomBetween(0, pool.length - 1)] ?? variations[touchVariationIndex % variations.length];
  touchVariationIndex += 1;
  lastTouchVariationId = variation.id;
  return { ...variation, rhythm };
}

function renderTouchCards(): void {
  const grid = document.querySelector<HTMLElement>('[data-touch-card-grid]');
  if (!grid) {
    return;
  }

  const cards = visibleTouchCards();
  grid.innerHTML = cards
    .map((card) => {
      const activeClass = card.id === selectedTouchCardId ? ' active' : '';
      const targetClass = card.id === touchSpeechSnapshot?.targetId ? ' active-target' : '';
      const stateClass = card.id === touchSpeechSnapshot?.targetId ? ` target-${touchSpeechSnapshot.state}` : '';
      const weatherClass = card.id === selectedTouchCardId ? ` weather-${activeTouchWeather}` : '';
      const secondaryLabel = card.label.trim().toLocaleLowerCase('tr-TR') === card.word.trim().toLocaleLowerCase('tr-TR') ? '' : card.label;
      return `<button class="touch-card${activeClass}${targetClass}${stateClass}" type="button" data-touch-card-id="${card.id}" aria-label="${card.label} kartını dinle">
        <span class="touch-weather${weatherClass}" aria-hidden="true"></span>
        <img class="touch-card-guide-hand" src="${CLICK_HAND_RIGHT_ASSET}" alt="" aria-hidden="true" />
        <span class="touch-card-image-wrap">${touchCardVisualMarkup(card)}</span>
        <span class="touch-card-label">${secondaryLabel}</span>
        <span class="touch-card-word">${card.word}</span>
        <span class="touch-card-variation">Dokun ve dinle</span>
        <span class="touch-card-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      </button>`;
    })
    .join('');
  renderTouchSelection();
}

function matchCards(): TouchCard[] {
  const enabled = enabledTouchCards();
  const mastered = touchMastery.masteredWords
    .map((id) => enabled.find((card) => card.id === id))
    .filter((card): card is TouchCard => Boolean(card));
  const practiced = enabled.filter((card) => (touchProgress[card.id]?.success ?? 0) > 0 && !mastered.some((entry) => entry.id === card.id));
  return [...mastered, ...practiced, ...enabled.filter((card) => !mastered.some((entry) => entry.id === card.id) && !practiced.some((entry) => entry.id === card.id))];
}

function isMatchViewActive(): boolean {
  return document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView === 'match';
}

function clearMatchTimer(): void {
  if (matchTimer) {
    window.clearTimeout(matchTimer);
    matchTimer = undefined;
  }
}

function startMatchRound(): void {
  clearMatchTimer();
  const round = createMatchRound();
  if (!round) {
    matchRound = undefined;
    renderMatchingGame();
    return;
  }

  matchRound = round;
  matchTargetId = round.targetId;
  lastMatchTargetId = round.targetId;
  setPofiBaseState('matchGuide');
  renderMatchingGame();
  matchTimer = window.setTimeout(() => enterMatchState('targeting'), MATCH_ATTENTION_MS);
}

function createMatchRound(): MatchRound | undefined {
  const cards = matchCards();
  if (cards.length === 0) {
    return undefined;
  }

  const masteredTargets = cards.filter((card) => touchMastery.masteredWords.includes(card.id));
  const targetSource = masteredTargets.length > 0 ? masteredTargets : cards;
  const pool = targetSource.length > 1 ? targetSource.filter((card) => card.id !== lastMatchTargetId) : targetSource;
  const selected = pickWeightedMatchCard(pool.length > 0 ? pool : targetSource);
  const baseLevel = matchLevelForProgress(matchProgress[selected.id]);
  const level = matchWrongStreak >= MATCH_FATIGUE_WRONG_STREAK ? 1 : baseLevel;
  const images = normalizedTouchImages(selected);
  const mode: MatchMode = images.length > 1 && level >= 2 ? 'concept' : 'same-image';
  const modelImage = chooseMatchImage(selected);
  const correctPool = mode === 'concept' ? images.filter((image) => image !== modelImage) : [modelImage];
  const correctImage = correctPool[randomBetween(0, correctPool.length - 1)] ?? modelImage;
  const choiceCount = matchChoiceCount(level, cards.length);
  const distractors = shuffleTouchCards(cards.filter((card) => card.id !== selected.id)).slice(0, Math.max(0, choiceCount - 1));
  const choices = shuffleMatchChoices([
    { cardId: selected.id, image: correctImage, correct: true },
    ...distractors.map((card) => ({ cardId: card.id, image: chooseMatchImage(card), correct: false }))
  ]);

  return {
    targetId: selected.id,
    modelImage,
    correctImage,
    choices,
    mode,
    level,
    state: 'attention',
    hintLevel: 0,
    startedAt: Date.now()
  };
}

function pickWeightedMatchCard(cards: TouchCard[]): TouchCard {
  const weighted = cards.map((card) => ({ card, weight: matchTargetWeight(matchProgress[card.id]) }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.random() * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.card;
    }
  }
  return cards[0];
}

function chooseMatchImage(card: TouchCard): string {
  return chooseTouchRoundImage(card);
}

function enterMatchState(state: MatchState, hintLevel: 0 | 1 | 2 | 3 | 4 = 0): void {
  if (!matchRound || !isMatchViewActive()) {
    return;
  }

  clearMatchTimer();
  matchRound = {
    ...matchRound,
    state,
    hintLevel,
    startedAt: state === 'targeting' ? Date.now() : matchRound.startedAt
  };

  if (state === 'targeting') {
    setPofiBaseState('matchTargeting');
    void playMatchTargetSound('targeting');
    matchTimer = window.setTimeout(() => enterMatchState('waiting'), MATCH_TARGETING_MS);
  }

  if (state === 'waiting') {
    setPofiBaseState('matchWaiting');
    matchTimer = window.setTimeout(() => enterMatchHint(1), MATCH_WAITING_MS);
  }

  if (state === 'hint') {
    setPofiBaseState('matchHint');
    recordMatchHint(matchRound.targetId, hintLevel);
    if (hintLevel === 1 || hintLevel === 3) {
      void playMatchTargetSound('hint');
    }
    if (hintLevel < 4) {
      matchTimer = window.setTimeout(() => enterMatchHint((hintLevel + 1) as 1 | 2 | 3 | 4), MATCH_HINT_STEP_MS);
    }
  }

  if (state === 'success') {
    setPofiBaseState('matchSuccess');
    playMatchStateTone('success');
    matchTimer = window.setTimeout(() => startMatchRound(), MATCH_SUCCESS_MS);
  }

  if (state === 'retry') {
    setPofiBaseState('matchRetry');
    playMatchStateTone('retry');
    matchTimer = window.setTimeout(() => enterMatchState('waiting'), MATCH_RETRY_MS);
  }

  renderMatchingGame();
}

function enterMatchHint(level: 1 | 2 | 3 | 4): void {
  enterMatchState('hint', level);
}

async function playMatchTargetSound(style: 'targeting' | 'hint' | 'success' = 'targeting'): Promise<void> {
  const card = touchSettings.cards.find((entry) => entry.id === matchRound?.targetId);
  if (card) {
    playMatchStateTone(style);
    await playTouchCardSound(card, style === 'success' ? 'pofi' : 'word', style === 'hint' ? 0.66 : 0.76);
  }
}

function recordMatchHint(targetId: string, hintLevel: number): void {
  const entry = matchProgressEntry(matchProgress, targetId);
  entry.hintUsed += 1;
  entry.hintLevels[hintLevel] = (entry.hintLevels[hintLevel] ?? 0) + 1;
  if (hintLevel >= 2) {
    entry.repeatNeeds += 1;
  }
  writeMatchProgress();
}

function renderMatchingGame(): void {
  const surface = document.querySelector<HTMLElement>('[data-match-surface]');
  const target = document.querySelector<HTMLElement>('[data-match-target]');
  const grid = document.querySelector<HTMLElement>('[data-match-choice-grid]');
  const status = document.querySelector<HTMLElement>('[data-match-status]');
  if (!surface || !target || !grid || !status) {
    return;
  }

  const cards = matchCards();
  if (cards.length === 0 || !matchRound) {
    target.textContent = 'Dokun bölümünde birkaç kelime çalışınca Eşleme burada hazırlanır.';
    grid.innerHTML = '';
    status.textContent = '';
    return;
  }

  const round = matchRound;
  const selected = cards.find((card) => card.id === round.targetId) ?? cards[0];
  const correctChoice = round.choices.find((choice) => choice.correct);
  const correctIndex = correctChoice ? round.choices.indexOf(correctChoice) : -1;

  target.innerHTML = `<span class="match-target-label">Model</span>
    <span class="match-model-visual">${touchCardVisualMarkupForImage(selected, round.modelImage)}</span>
    <strong>${selected.word}</strong>`;
  surface.dataset.matchTargetId = selected.id;
  surface.dataset.matchChoiceCount = String(round.choices.length);
  surface.dataset.matchState = round.state;
  surface.dataset.matchPofiMotion = matchPofiMotion(round.state);
  surface.dataset.matchLevel = String(round.level);
  surface.dataset.matchHintLevel = String(round.hintLevel);
  surface.dataset.matchMode = round.mode;
  surface.dataset.matchCorrectIndex = String(correctIndex);
  grid.innerHTML = round.choices
    .map((choice) => {
      const card = cards.find((entry) => entry.id === choice.cardId) ?? selected;
      const hintClass = choice.correct && round.state === 'hint' ? ` match-hint-${round.hintLevel}` : '';
      const correctClass = choice.correct ? ' match-answer' : '';
      return `<button class="object-tile match-choice${correctClass}${hintClass}" type="button" data-match-choice="${card.id}" aria-label="${card.label} eşleme seçeneği">
        <span class="match-choice-visual">${touchCardVisualMarkupForImage(card, choice.image)}</span>
        <span>${card.word}</span>
      </button>`;
    })
    .join('');
  status.textContent = matchStatusText(selected, correctChoice);
  positionMatchGuide(surface, correctIndex);
}

function matchPofiMotion(state: MatchState): MatchPofiMotion {
  if (state === 'attention') {
    return 'focus';
  }

  if (state === 'targeting') {
    return 'model';
  }

  if (state === 'waiting') {
    return 'listen';
  }

  if (state === 'hint') {
    return 'guide';
  }

  if (state === 'success') {
    return 'affirm';
  }

  return 'reassure';
}

function positionMatchGuide(surface: HTMLElement, correctIndex: number): void {
  const avatar = surface.querySelector<HTMLElement>('[data-pofi-avatar]');
  const targetElement = surface.querySelector<HTMLElement>('[data-match-target]');
  const surfaceRect = surface.getBoundingClientRect();

  if (!avatar || !matchRound || matchRound.state !== 'hint' || matchRound.hintLevel < 3 || correctIndex < 0) {
    surface.style.setProperty('--match-pofi-lean', '0deg');
    hideMatchGuideHand(avatar);
    positionCompactMatchGuide(surface, avatar, targetElement);
    return;
  }

  const correctElement = surface.querySelectorAll<HTMLElement>('[data-match-choice]').item(correctIndex);
  if (!correctElement) {
    positionCompactMatchGuide(surface, avatar, targetElement);
    return;
  }

  const cardRect = correctElement.getBoundingClientRect();
  const avatarRect = avatar.getBoundingClientRect();
  const cardCenter = cardRect.left + cardRect.width / 2 - surfaceRect.left;
  const avatarCenter = avatarRect.left + avatarRect.width / 2 - surfaceRect.left;
  const pointsLeft = cardCenter < avatarCenter;
  surface.style.setProperty('--match-pofi-lean', pointsLeft ? '-1.6deg' : '1.6deg');
  positionCompactMatchGuide(surface, avatar, correctElement);
  hideMatchGuideHand(avatar);
}

function hideMatchGuideHand(avatar?: HTMLElement | null): void {
  const hand = avatar?.querySelector<HTMLImageElement>('.pofi-hands');
  if (!hand) {
    return;
  }

  hand.removeAttribute('src');
  hand.hidden = true;
}

function positionCompactMatchGuide(surface: HTMLElement, avatar: HTMLElement | null | undefined, anchor?: HTMLElement | null): void {
  if (!avatar || !anchor) {
    surface.style.setProperty('--match-pofi-left', '50%');
    surface.style.setProperty('--match-pofi-top', '16px');
    surface.dataset.matchGuideAnchor = 'center';
    return;
  }

  const surfaceRect = surface.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  const targetRect = surface.querySelector<HTMLElement>('[data-match-target]')?.getBoundingClientRect() ?? anchorRect;
  const avatarRect = avatar.getBoundingClientRect();
  const anchorCenter = anchorRect.left + anchorRect.width / 2 - surfaceRect.left;
  const sideOffset = matchRound?.state === 'hint' && (matchRound.hintLevel ?? 0) >= 3 ? anchorRect.width * 0.18 : 0;
  const compactLayout = surfaceRect.width <= 760;
  const narrowLayout = surfaceRect.width <= 1180;
  const targetLeft = targetRect.left - surfaceRect.left;
  const targetTop = targetRect.top - surfaceRect.top;
  const preferredLeft = compactLayout ? anchorCenter - sideOffset : narrowLayout ? surfaceRect.width * 0.28 : targetLeft - avatarRect.width * 0.34;
  const horizontalPadding = compactLayout ? Math.max(70, Math.min(124, surfaceRect.width * 0.18)) : Math.max(150, surfaceRect.width * 0.14);
  const clampedLeft = Math.min(surfaceRect.width - horizontalPadding, Math.max(horizontalPadding, preferredLeft));
  const preferredTop = compactLayout
    ? (matchRound?.state === 'hint' && (matchRound.hintLevel ?? 0) >= 3 ? 34 : 18)
    : narrowLayout
      ? Math.max(22, targetTop - avatarRect.height * 0.34)
      : targetTop + targetRect.height * 0.26;
  const clampedTop = compactLayout ? preferredTop : Math.min(surfaceRect.height * 0.28, Math.max(12, preferredTop));

  surface.style.setProperty('--match-pofi-left', `${Math.round(clampedLeft)}px`);
  surface.style.setProperty('--match-pofi-top', `${Math.round(clampedTop)}px`);
  surface.dataset.matchGuideAnchor = compactLayout && matchRound?.state === 'hint' && (matchRound.hintLevel ?? 0) >= 3 ? 'answer' : 'model';
}

function matchStatusText(card: TouchCard, correctChoice?: MatchChoice): string {
  if (!matchRound) {
    return '';
  }

  if (matchRound.state === 'attention') {
    return 'Bak dikkatlice.';
  }

  if (matchRound.state === 'targeting' || matchRound.state === 'waiting') {
    return `${card.word}'u bulalım.`;
  }

  if (matchRound.state === 'hint') {
    if (matchRound.hintLevel === 1) {
      return `${card.word}`;
    }
    if (matchRound.hintLevel === 2) {
      return 'Model kartına bir daha bak.';
    }
    if (matchRound.hintLevel === 3) {
      return 'Doğru kart yumuşakça parlıyor.';
    }
    return `${card.word} olan karta dokunalım.`;
  }

  if (matchRound.state === 'success') {
    return `Evet! ${card.word} bu.`;
  }

  if (matchRound.state === 'retry') {
    return correctChoice ? 'Hadi tekrar bakalım.' : 'Tekrar deneyelim.';
  }

  return '';
}

function handleMatchChoice(cardId: string, element?: HTMLElement): void {
  if (!matchRound || !matchTargetId || ['success', 'retry'].includes(matchRound.state)) {
    return;
  }

  unlockTouchAudio();
  const correct = cardId === matchTargetId;
  if (element) {
    showClickHandCue(element);
    element.classList.toggle('match-correct', correct);
    element.classList.toggle('match-wrong', !correct);
  }

  recordMatchAttempt(matchTargetId, correct, matchRound.mode, Math.max(0, Date.now() - matchRound.startedAt));
  matchCorrectStreak = correct ? matchCorrectStreak + 1 : 0;
  matchWrongStreak = correct ? 0 : matchWrongStreak + 1;
  trackAction(correct ? 'match-correct' : 'match-wrong', element);
  void playMatchTargetSound(correct ? 'success' : 'hint');
  enterMatchState(correct ? 'success' : 'retry');
}

function handleMatchPofiPress(element: HTMLElement): void {
  unlockTouchAudio();
  showClickHandCue(element);

  if (!matchRound) {
    startMatchRound();
    return;
  }

  void playMatchTargetSound();
  if (matchRound.state === 'waiting') {
    enterMatchHint(1);
  }
}

function isSentenceViewActive(): boolean {
  return document.querySelector<HTMLElement>('#view-sentence')?.classList.contains('active') ?? false;
}

function clearSentenceTimer(): void {
  if (sentenceTimer) {
    window.clearTimeout(sentenceTimer);
    sentenceTimer = undefined;
  }
}

function startSentenceRound(): void {
  clearSentenceTimer();
  sentenceMode = 'learn';
  const round = createSentenceRound();
  if (!round) {
    sentenceRound = undefined;
    renderSentenceGame();
    return;
  }

  sentenceRound = round;
  const token = ++sentenceFlowToken;
  lastSentencePromptId = round.prompt.id;
  if (lastSentenceSubjectId === round.prompt.subjectId) {
    sentenceSameSubjectCount += 1;
  } else {
    lastSentenceSubjectId = round.prompt.subjectId;
    sentenceSameSubjectCount = 1;
  }
  setPofiBaseState('sentenceContext');
  renderSentenceGame();
  void scheduleSentenceStateAfterSpeech(token, 'context', SENTENCE_CONTEXT_MS, () => enterSentenceState('waiting'));
}

function selectSentenceMode(mode: SentenceMode): void {
  if (sentenceMode === mode) {
    return;
  }

  sentenceMode = mode;
  clearSentenceTimer();
  sentenceFlowToken += 1;
  if (mode === 'learn') {
    startSentenceRound();
    return;
  }

  sentenceRound = undefined;
  setPofiBaseState('sentenceGuide');
  renderSentenceGame();
}

function createSentenceRound(): SentenceRound | undefined {
  const prompts = SENTENCE_PROMPTS.filter((prompt) => sentencePromptUnlocked(prompt));
  if (prompts.length === 0) {
    return undefined;
  }

  const withoutLast = prompts.length > 1 ? prompts.filter((prompt) => prompt.id !== lastSentencePromptId) : prompts;
  const source =
    sentenceSameSubjectCount >= 2 && withoutLast.some((prompt) => prompt.subjectId !== lastSentenceSubjectId)
      ? withoutLast.filter((prompt) => prompt.subjectId !== lastSentenceSubjectId)
      : withoutLast;
  const prompt = pickWeightedSentencePrompt(source);
  const scene = chooseSentenceScene(prompt);

  return {
    prompt,
    scene,
    state: 'attention',
    hintLevel: 0,
    startedAt: Date.now()
  };
}

function sentencePromptUnlocked(prompt: SentencePrompt): boolean {
  if (prompt.stage === 1) {
    return true;
  }

  const sameGroupProgress = SENTENCE_PROMPTS.filter((entry) => entry.group === prompt.group && entry.stage < prompt.stage)
    .map((entry) => sentenceProgress[sentenceKey(entry.subjectId, entry.verbId)])
    .filter(Boolean);
  const successCount = sameGroupProgress.reduce((sum, entry) => sum + (entry?.success ?? 0), 0);
  if (prompt.stage === 2) {
    return successCount >= 8;
  }
  return successCount >= 18;
}

function pickWeightedSentencePrompt(prompts: SentencePrompt[]): SentencePrompt {
  const weighted = prompts.map((prompt) => ({
    prompt,
    weight: sentenceTargetWeight(sentenceProgress[sentenceKey(prompt.subjectId, prompt.verbId)])
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.random() * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.prompt;
    }
  }
  return prompts[0];
}

function chooseSentenceScene(prompt: SentencePrompt): SentenceScene {
  const scenes =
    prompt.scenes.length > 0
      ? prompt.scenes
      : [
          {
            id: 'default',
            context: prompt.phrase,
            detail: prompt.shortLabel,
            cue: 'help' as const,
            image: '/assets/sentence/help-child.png',
            alt: prompt.phrase
          }
        ];
  const lastSceneId = lastSentenceSceneByPrompt[prompt.id];
  const pool = scenes.length > 1 ? scenes.filter((scene) => scene.id !== lastSceneId) : scenes;
  const scene = pool[randomBetween(0, pool.length - 1)] ?? scenes[0];
  lastSentenceSceneByPrompt[prompt.id] = scene.id;
  return scene;
}

function enterSentenceState(state: SentenceState, hintLevel: 0 | 1 | 2 | 3 | 4 = 0): void {
  if (!sentenceRound || !isSentenceViewActive()) {
    return;
  }

  clearSentenceTimer();
  sentenceRound = {
    ...sentenceRound,
    state,
    hintLevel,
    startedAt: state === 'waiting' ? Date.now() : sentenceRound.startedAt
  };
  const token = ++sentenceFlowToken;

  if (state === 'waiting') {
    setPofiBaseState('sentenceWaiting');
    sentenceTimer = window.setTimeout(() => enterSentenceHint(1), SENTENCE_HINT_LEVEL_1_MS);
  }

  if (state === 'hint') {
    setPofiBaseState('sentenceHint');
    recordSentenceHint(hintLevel);
    if (hintLevel < 4) {
      void scheduleSentenceStateAfterSpeech(token, 'hint', SENTENCE_HINT_STEP_MS, () => enterSentenceHint((hintLevel + 1) as 1 | 2 | 3 | 4));
    } else {
      void playSentencePrompt('hint');
    }
  }

  if (state === 'success') {
    setPofiBaseState('sentenceSuccess');
    void scheduleSentenceStateAfterSpeech(token, 'success', SENTENCE_REPEAT_PAUSE_MS, () => enterSentenceState('repeat_prompt'));
  }

  if (state === 'repeat_prompt') {
    setPofiBaseState('sentenceRepeat');
    recordSentenceRepeatPrompt();
    void scheduleSentenceStateAfterSpeech(token, 'repeat', SENTENCE_REPEAT_PROMPT_MS, () => startSentenceRound());
  }

  if (state === 'retry') {
    setPofiBaseState('sentenceRetry');
    void scheduleSentenceStateAfterSpeech(token, 'retry', SENTENCE_RETRY_MS, () => enterSentenceState('waiting'));
  }

  renderSentenceGame();
}

async function scheduleSentenceStateAfterSpeech(
  token: number,
  speechKind: 'context' | 'hint' | 'success' | 'repeat' | 'retry',
  holdMs: number,
  next: () => void
): Promise<void> {
  await playSentencePrompt(speechKind);
  await wait(holdMs);
  if (token !== sentenceFlowToken || !isSentenceViewActive()) {
    return;
  }
  next();
}

function enterSentenceHint(level: 1 | 2 | 3 | 4): void {
  enterSentenceState('hint', level);
}

function renderSentenceGame(): void {
  const surface = document.querySelector<HTMLElement>('[data-sentence-surface]');
  const context = document.querySelector<HTMLElement>('[data-sentence-context]');
  const card = document.querySelector<HTMLElement>('[data-sentence-card]');
  const grid = document.querySelector<HTMLElement>('[data-sentence-choice-grid]');
  const status = document.querySelector<HTMLElement>('[data-sentence-status]');
  if (!surface || !context || !card || !grid || !status) {
    return;
  }

  renderSentenceModeControls();
  surface.dataset.sentenceMode = sentenceMode;
  if (sentenceMode === 'board') {
    renderSentenceBoard(surface, context, card, grid, status);
    return;
  }

  if (!sentenceRound) {
    context.textContent = '';
    card.innerHTML = '';
    grid.innerHTML = '';
    status.textContent = '';
    return;
  }

  const completeSentence = sentencePhrase(sentenceRound.prompt);
  surface.dataset.sentenceState = sentenceRound.state;
  surface.dataset.sentenceHintLevel = String(sentenceRound.hintLevel);
  surface.dataset.sentenceTargetId = sentenceRound.prompt.subjectId;
  surface.dataset.sentenceVerbId = sentenceRound.prompt.verbId;
  surface.dataset.sentenceKey = sentenceKey(sentenceRound.prompt.subjectId, sentenceRound.prompt.verbId);
  surface.dataset.sentenceGoal = sentenceRound.prompt.communicationGoal;
  surface.dataset.sentenceGroup = sentenceRound.prompt.group;
  context.textContent = '';
  card.removeAttribute('aria-hidden');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', completeSentence);
  card.dataset.sceneCue = sentenceRound.scene.cue;
  card.innerHTML = `<span class="sentence-need-card">
    <span class="sentence-need-halo" aria-hidden="true"></span>
    <img class="sentence-need-image" src="${sentenceRound.scene.image}" alt="${sentenceRound.scene.alt}" decoding="async" draggable="false">
    <span class="sentence-repeat-ring" aria-hidden="true"></span>
  </span>`;
  grid.innerHTML = '';
  status.textContent = sentenceStatusText();
}

function renderSentenceModeControls(): void {
  document.querySelectorAll<HTMLButtonElement>('.sentence-mode-button[data-sentence-mode]').forEach((button) => {
    const active = button.dataset.sentenceMode === sentenceMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderSentenceBoard(
  surface: HTMLElement,
  context: HTMLElement,
  card: HTMLElement,
  grid: HTMLElement,
  status: HTMLElement
): void {
  const activePrompt = sentenceRound?.prompt;
  surface.dataset.sentenceState = sentenceRound?.state ?? 'board';
  surface.dataset.sentenceHintLevel = String(sentenceRound?.hintLevel ?? 0);
  surface.dataset.sentenceTargetId = activePrompt?.subjectId ?? '';
  surface.dataset.sentenceVerbId = activePrompt?.verbId ?? '';
  surface.dataset.sentenceKey = activePrompt ? sentenceKey(activePrompt.subjectId, activePrompt.verbId) : '';
  surface.dataset.sentenceGoal = activePrompt?.communicationGoal ?? 'ihtiyaç seçme';
  surface.dataset.sentenceGroup = activePrompt?.group ?? 'core-needs';
  context.textContent = '';
  card.innerHTML = '';
  card.setAttribute('aria-hidden', 'true');
  card.setAttribute('tabindex', '-1');
  grid.innerHTML = sentenceBoardPrompts()
    .map((prompt) => {
      const scene = prompt.scenes[0];
      const selected = activePrompt?.id === prompt.id ? ' selected' : '';
      return `<button class="sentence-board-card${selected}" type="button" data-sentence-board-card="${prompt.id}" aria-label="${prompt.phrase}">
        <img class="sentence-board-image" src="${scene.image}" alt="${scene.alt}" decoding="async" draggable="false">
      </button>`;
    })
    .join('');
  status.textContent = activePrompt ? sentencePhrase(activePrompt) : 'İhtiyacını seç.';
}

function sentenceBoardPrompts(): SentencePrompt[] {
  return SENTENCE_PROMPTS.filter((prompt) => prompt.stage === 1);
}

function sentencePhrase(prompt: SentencePrompt): string {
  return prompt.phrase;
}

function sentenceStatusText(): string {
  if (!sentenceRound) {
    return '';
  }

  if (sentenceRound.state === 'context' || sentenceRound.state === 'waiting') {
    return sentenceRound.scene.context || sentencePhrase(sentenceRound.prompt);
  }

  if (sentenceRound.state === 'hint') {
    if (sentenceRound.hintLevel <= 1) {
      return sentencePhrase(sentenceRound.prompt);
    }
    if (sentenceRound.hintLevel === 2) {
      return 'İhtiyaç kartına bir daha bakalım.';
    }
    if (sentenceRound.hintLevel === 3) {
      return 'İhtiyaç kartı parlıyor.';
    }
    return `Pofi ${sentenceRound.prompt.shortLabel} kartını gösteriyor.`;
  }

  if (sentenceRound.state === 'success') {
    return `Evet. ${sentencePhrase(sentenceRound.prompt)}.`;
  }

  if (sentenceRound.state === 'repeat_prompt') {
    return 'Hadi söyle.';
  }

  return 'Bir daha bakalım.';
}

function handleSentenceExpressionPress(element?: HTMLElement): void {
  if (sentenceMode !== 'learn' || !sentenceRound || ['success', 'repeat_prompt', 'retry'].includes(sentenceRound.state)) {
    return;
  }

  unlockTouchAudio();
  if (element) {
    showClickHandCue(element);
    element.classList.add('sentence-correct');
  }

  recordSentenceAttempt(true);
  trackAction('sentence-expression', element);
  enterSentenceState('success');
}

function handleSentenceBoardCard(promptId: string, element?: HTMLElement): void {
  const prompt = SENTENCE_PROMPTS.find((entry) => entry.id === promptId);
  if (!prompt || sentenceMode !== 'board') {
    return;
  }

  unlockTouchAudio();
  clearSentenceTimer();
  const scene = chooseSentenceScene(prompt);
  sentenceRound = {
    prompt,
    scene,
    state: 'success',
    hintLevel: 0,
    startedAt: Date.now()
  };
  const token = ++sentenceFlowToken;
  lastSentencePromptId = prompt.id;
  lastSentenceSubjectId = prompt.subjectId;
  sentenceSameSubjectCount = 1;
  setPofiBaseState('sentenceSuccess');
  if (element) {
    showClickHandCue(element);
    element.classList.add('selected');
  }
  recordSentenceAttempt(true);
  trackAction('sentence-board-select', element);
  renderSentenceGame();
  void scheduleSentenceStateAfterSpeech(token, 'success', SENTENCE_REPEAT_PAUSE_MS, () => {
    if (sentenceMode !== 'board' || !sentenceRound) {
      return;
    }
    sentenceRound = { ...sentenceRound, state: 'repeat_prompt' };
    sentenceFlowToken += 1;
    setPofiBaseState('sentenceRepeat');
    recordSentenceRepeatPrompt();
    renderSentenceGame();
    void playSentencePrompt('repeat');
  });
}

function handleSentencePofiPress(element: HTMLElement): void {
  unlockTouchAudio();
  showClickHandCue(element);

  if (sentenceMode === 'board') {
    if (sentenceRound) {
      void playSentencePrompt(sentenceRound.state === 'repeat_prompt' ? 'repeat' : 'success');
    }
    return;
  }

  if (!sentenceRound) {
    startSentenceRound();
    return;
  }

  void playSentencePrompt(sentenceRound.state === 'success' || sentenceRound.state === 'repeat_prompt' ? 'success' : 'context');
  if (sentenceRound.state === 'waiting') {
    enterSentenceHint(1);
  }
}

function recordSentenceAttempt(correct: boolean): void {
  if (!sentenceRound) {
    return;
  }

  const key = sentenceKey(sentenceRound.prompt.subjectId, sentenceRound.prompt.verbId);
  const entry = sentenceProgressEntry(sentenceProgress, key);
  if (correct) {
    entry.success += 1;
    entry.latencyMsTotal += Math.max(0, Date.now() - sentenceRound.startedAt);
    entry.latencySamples += 1;
  } else {
    entry.fail += 1;
    publishSentenceNeedsMatch(sentenceRound.prompt.subjectId);
  }
  writeSentenceProgress();
}

function recordSentenceHint(hintLevel: number): void {
  if (!sentenceRound) {
    return;
  }

  const key = sentenceKey(sentenceRound.prompt.subjectId, sentenceRound.prompt.verbId);
  const entry = sentenceProgressEntry(sentenceProgress, key);
  entry.hintLevels[hintLevel] = (entry.hintLevels[hintLevel] ?? 0) + 1;
  writeSentenceProgress();
}

function recordSentenceRepeatPrompt(): void {
  if (!sentenceRound) {
    return;
  }

  const key = sentenceKey(sentenceRound.prompt.subjectId, sentenceRound.prompt.verbId);
  sentenceProgressEntry(sentenceProgress, key).repeatPrompts += 1;
  writeSentenceProgress();
}

function publishSentenceNeedsMatch(subjectId: string): void {
  const globalLearning = globalThis as typeof globalThis & { MinaPlayLearning?: { masteredWords: string[]; sentenceNeedsMatch?: string[] } };
  const existing = globalLearning.MinaPlayLearning ?? { masteredWords: [...touchMastery.masteredWords] };
  const needsMatch = new Set([...(existing.sentenceNeedsMatch ?? []), subjectId]);
  globalLearning.MinaPlayLearning = {
    ...existing,
    masteredWords: [...touchMastery.masteredWords],
    sentenceNeedsMatch: [...needsMatch]
  };
}

async function playSentencePrompt(kind: 'context' | 'hint' | 'success' | 'repeat' | 'retry'): Promise<void> {
  if (!sentenceRound || !touchAudioUnlocked) {
    return;
  }

  const text =
    kind === 'success'
      ? sentencePhrase(sentenceRound.prompt)
      : kind === 'repeat'
        ? 'Hadi söyle'
      : kind === 'retry'
        ? 'Bir daha bakalım'
      : kind === 'hint'
        ? sentencePhrase(sentenceRound.prompt)
        : sentenceRound.scene.context || sentencePhrase(sentenceRound.prompt);
  await speakSentenceText(text, kind === 'context' ? 'targeting' : kind === 'repeat' ? 'repeat' : kind);
}

function speakSentenceText(text: string, kind: 'targeting' | 'success' | 'repeat' | 'hint' | 'retry'): Promise<void> {
  return enqueueSpeechText(text, { ...sentenceSpeechProfile(kind), volume: 0.82 });
}

function sentenceSpeechProfile(kind: 'targeting' | 'success' | 'repeat' | 'hint' | 'retry'): { rate: number; pitch: number } {
  const profiles: Record<typeof kind, Array<{ rate: number; pitch: number }>> = {
    targeting: [
      { rate: 0.78, pitch: 1.02 },
      { rate: 0.84, pitch: 1.05 }
    ],
    success: [
      { rate: 0.94, pitch: 1.14 },
      { rate: 0.9, pitch: 1.18 }
    ],
    repeat: [
      { rate: 0.86, pitch: 1.16 },
      { rate: 0.82, pitch: 1.2 }
    ],
    hint: [
      { rate: 0.74, pitch: 1.04 },
      { rate: 0.78, pitch: 1.08 }
    ],
    retry: [
      { rate: 0.76, pitch: 1.0 },
      { rate: 0.8, pitch: 1.04 }
    ]
  };
  const kindPool = kind === lastSentenceSpeechKind ? [...profiles[kind]].reverse() : profiles[kind];
  lastSentenceSpeechKind = kind;
  return kindPool[0];
}

function isStoryViewActive(): boolean {
  return document.querySelector<HTMLElement>('#view-story')?.classList.contains('active') ?? false;
}

function clearStoryTimer(): void {
  if (storyTimer) {
    window.clearTimeout(storyTimer);
    storyTimer = undefined;
  }
}

function startStorySession(): void {
  clearStoryTimer();
  const story = STORY_LIBRARY[storyCursor % STORY_LIBRARY.length];
  storyCursor += 1;
  storySession = {
    story,
    stepIndex: 0,
    state: 'idle',
    startedAt: Date.now()
  };
  enterStoryStep(0);
}

function currentStoryStep(): StoryStep | undefined {
  return storySession?.story.steps[storySession.stepIndex];
}

function enterStoryStep(stepIndex: number): void {
  if (!storySession || !isStoryViewActive()) {
    return;
  }

  clearStoryTimer();
  const step = storySession.story.steps[stepIndex];
  if (!step) {
    storyTimer = window.setTimeout(() => startStorySession(), 1800);
    return;
  }

  const nextState = storyStateForStep(step);
  storySession = {
    ...storySession,
    stepIndex,
    state: nextState,
    startedAt: Date.now()
  };
  const token = ++storyFlowToken;
  setPofiBaseState(storyPofiState(nextState));
  renderStory();
  void scheduleStoryStepAfterAudio(token, stepIndex, step);
}

function storyStateForStep(step: StoryStep): StoryState {
  if (step.kind === 'attention') {
    return 'attention';
  }
  if (step.kind === 'interaction') {
    return 'interaction';
  }
  if (step.kind === 'closure') {
    return 'closure';
  }
  if (step.kind === 'repeat') {
    return 'continue';
  }
  return 'narration';
}

function storyPofiState(state: StoryState): PofiState {
  const states: Record<StoryState, PofiState> = {
    idle: 'storyIdle',
    attention: 'storyAttention',
    narration: 'storyNarration',
    interaction: 'storyInteraction',
    waiting: 'storyWaiting',
    success: 'storySuccess',
    continue: 'storyContinue',
    closure: 'storySuccess'
  };
  return states[state];
}

async function scheduleStoryStepAfterAudio(token: number, stepIndex: number, step: StoryStep): Promise<void> {
  await playStoryStep(step);
  if (!storyStepStillActive(token, step.id)) {
    return;
  }

  if (step.kind === 'interaction') {
    if (!storySession) {
      return;
    }
    storySession = { ...storySession, state: 'waiting' };
    setPofiBaseState('storyWaiting');
    renderStory();
    storyTimer = window.setTimeout(() => {
      if (!storyStepStillActive(token, step.id)) {
        return;
      }
      resolveStoryInteraction(undefined);
    }, STORY_WAITING_MS);
    return;
  }

  const pause = storyPostSpeechPause(step);
  await wait(pause);
  if (!storyStepStillActive(token, step.id)) {
    return;
  }
  enterStoryStep(stepIndex + 1);
}

function storyStepStillActive(token: number, stepId: string): boolean {
  return token === storyFlowToken && isStoryViewActive() && Boolean(storySession) && currentStoryStep()?.id === stepId;
}

function storyPostSpeechPause(step: StoryStep): number {
  const pause = step.pauseMs ?? (step.kind === 'attention' ? STORY_ATTENTION_MS : step.kind === 'repeat' ? STORY_REPEAT_MS : STORY_NARRATION_MS);
  return Math.max(360, pause - estimatedSpeechDurationMs(step.text, 0.82));
}

function renderStory(): void {
  const surface = document.querySelector<HTMLElement>('[data-story-surface]');
  const scene = document.querySelector<HTMLElement>('[data-story-scene]');
  const grid = document.querySelector<HTMLElement>('[data-story-choice-grid]');
  const progress = document.querySelector<HTMLElement>('[data-story-progress]');
  const status = document.querySelector<HTMLElement>('[data-story-status]');
  if (!surface || !scene || !grid || !progress || !status) {
    return;
  }

  const step = currentStoryStep();
  surface.dataset.storyState = storySession?.state ?? 'idle';
  surface.dataset.storyStep = step?.id ?? '';
  surface.dataset.storyId = storySession?.story.id ?? '';
  surface.dataset.storyTheme = storySession?.story.theme ?? '';

  if (!step) {
    scene.innerHTML = '';
    grid.innerHTML = '';
    progress.innerHTML = '';
    status.textContent = '';
    return;
  }

  scene.setAttribute('aria-label', step.text);
  scene.innerHTML = storySceneMarkup(step);
  grid.innerHTML =
    step.kind === 'interaction'
      ? (step.choices ?? [])
          .map((choice) => {
            const card = choice.cardId ? touchSettings.cards.find((entry) => entry.id === choice.cardId) : undefined;
            const label = choice.label ?? card?.word ?? choice.id;
            const visual = choice.image
              ? `<img class="story-choice-image" src="${choice.image}" alt="${choice.alt ?? label}" decoding="async" draggable="false">`
              : card
                ? touchCardVisualMarkup(card)
                : '';
            if (!visual) {
              return '';
            }
            const stateClass = storySession?.state === 'success' && choice.correct ? ' story-correct' : '';
            return `<button class="story-choice${stateClass}" type="button" data-story-choice="${choice.id}" aria-label="${label}">
              <span class="story-choice-visual">${visual}</span>
              <span class="story-choice-symbol" aria-hidden="true">${choice.symbol}</span>
            </button>`;
          })
          .join('')
      : '';
  progress.innerHTML = storySession
    ? storySession.story.steps
        .filter((entry) => entry.kind !== 'attention')
        .map((entry, index) => `<span class="${storyProgressClass(entry, index)}"></span>`)
        .join('')
    : '';
  status.textContent = step.text;
}

function storyProgressClass(step: StoryStep, visualIndex: number): string {
  if (!storySession) {
    return 'story-progress-dot';
  }
  const currentVisualIndex = storySession.story.steps.slice(0, storySession.stepIndex + 1).filter((entry) => entry.kind !== 'attention').length - 1;
  const classes = ['story-progress-dot'];
  if (visualIndex <= currentVisualIndex) {
    classes.push('active');
  }
  if (step.kind === 'interaction') {
    classes.push('interactive');
  }
  return classes.join(' ');
}

function storySceneMarkup(step: StoryStep): string {
  const cards = (step.cardIds ?? [])
    .map((id) => touchSettings.cards.find((card) => card.id === id))
    .filter((card): card is TouchCard => Boolean(card));
  const visuals = cards
    .map((card) => `<span class="story-object" data-story-object="${card.id}">${touchCardVisualMarkup(card)}</span>`)
    .join('');
  const sceneImage = step.sceneImage
    ? `<span class="story-scene-image-wrap"><img class="story-scene-image" src="${step.sceneImage}" alt="${step.sceneAlt ?? step.text}" decoding="async" draggable="false"></span>`
    : '';
  const action = step.actionSymbol ? `<span class="story-action-symbol" aria-hidden="true">${step.actionSymbol}</span>` : '';
  return `<div class="story-object-row">${sceneImage}${visuals}${action}</div>`;
}

function handleStoryPofiPress(): void {
  unlockTouchAudio();
  if (!storySession) {
    startStorySession();
    return;
  }
  const step = currentStoryStep();
  if (step) {
    void playStoryStep(step);
  }
}

function handleStoryChoice(choiceId: string, element: HTMLElement): void {
  if (!storySession) {
    return;
  }
  const step = currentStoryStep();
  if (!step || step.kind !== 'interaction') {
    return;
  }

  unlockTouchAudio();
  showClickHandCue(element);
  trackAction('story-interaction', element);
  resolveStoryInteraction(choiceId);
  element.classList.add('story-picked');
}

function resolveStoryInteraction(choiceId: string | undefined): void {
  if (!storySession) {
    return;
  }
  const step = currentStoryStep();
  if (!step || step.kind !== 'interaction') {
    return;
  }

  clearStoryTimer();
  const choice = step.choices?.find((entry) => entry.id === choiceId);
  const correctChoice = step.choices?.find((entry) => entry.correct);
  const selected = choice ?? correctChoice;
  const selectedIsCorrect = selected?.correct ?? false;
  const feedbackText = selectedIsCorrect || !choiceId ? (step.successText ?? 'Evet') : (step.fallbackText ?? step.successText ?? 'Bir daha bakalım');
  storySession = { ...storySession, state: 'success' };
  const token = ++storyFlowToken;
  const stepIndex = storySession.stepIndex;
  setPofiBaseState('storySuccess');
  renderStory();
  void scheduleStoryFeedbackAfterAudio(token, step.id, stepIndex, feedbackText, selectedIsCorrect || !choiceId ? 'sparkle' : 'chime');
}

async function scheduleStoryFeedbackAfterAudio(token: number, stepId: string, stepIndex: number, feedbackText: string, effect: StoryEffect): Promise<void> {
  await speakStoryText(feedbackText, 'success');
  await playStoryEffect(effect);
  await wait(STORY_SUCCESS_MS);
  if (!storyStepStillActive(token, stepId)) {
    return;
  }
  enterStoryStep(stepIndex + 1);
}

async function playStoryStep(step: StoryStep): Promise<void> {
  if (!touchAudioUnlocked) {
    return;
  }
  const kind =
    step.kind === 'attention'
      ? 'attention'
      : step.kind === 'interaction'
        ? 'interaction'
        : step.kind === 'repeat'
          ? 'repeat'
          : step.kind === 'closure'
            ? 'closure'
            : 'narration';
  await speakStoryText(step.text, kind);
  await playStoryEffect(step.effect);
}

function speakStoryText(text: string, kind: 'attention' | 'narration' | 'interaction' | 'success' | 'repeat' | 'closure'): Promise<void> {
  return enqueueSpeechText(text, { ...storySpeechProfile(kind), volume: 0.82 });
}

function storySpeechProfile(kind: 'attention' | 'narration' | 'interaction' | 'success' | 'repeat' | 'closure'): { rate: number; pitch: number } {
  const profiles: Record<typeof kind, Array<{ rate: number; pitch: number }>> = {
    attention: [
      { rate: 0.78, pitch: 1.08 },
      { rate: 0.82, pitch: 1.12 }
    ],
    narration: [
      { rate: 0.72, pitch: 1.02 },
      { rate: 0.76, pitch: 1.05 }
    ],
    interaction: [
      { rate: 0.76, pitch: 1.08 },
      { rate: 0.8, pitch: 1.12 }
    ],
    success: [
      { rate: 0.9, pitch: 1.16 },
      { rate: 0.86, pitch: 1.12 }
    ],
    repeat: [
      { rate: 0.78, pitch: 1.1 },
      { rate: 0.74, pitch: 1.06 }
    ],
    closure: [
      { rate: 0.78, pitch: 1.04 },
      { rate: 0.82, pitch: 1.08 }
    ]
  };
  const kindPool = kind === lastStorySpeechKind ? [...profiles[kind]].reverse() : profiles[kind];
  lastStorySpeechKind = kind;
  return kindPool[0];
}

function playStoryEffect(effect?: StoryEffect): Promise<void> {
  if (!effect || !touchAudioUnlocked) {
    return Promise.resolve();
  }

  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) {
    return Promise.resolve();
  }

  const profiles: Record<StoryEffect, { type: OscillatorType; notes: number[]; duration: number; gain: number }> = {
    sparkle: { type: 'triangle', notes: [740, 980, 1180], duration: 0.34, gain: 0.026 },
    water: { type: 'sine', notes: [520, 690, 590], duration: 0.42, gain: 0.018 },
    chime: { type: 'sine', notes: [660, 880], duration: 0.32, gain: 0.022 },
    step: { type: 'triangle', notes: [260, 310], duration: 0.28, gain: 0.018 },
    warm: { type: 'sine', notes: [430, 520, 610], duration: 0.44, gain: 0.018 },
    sleep: { type: 'sine', notes: [420, 360], duration: 0.5, gain: 0.014 },
    pop: { type: 'square', notes: [380, 620], duration: 0.22, gain: 0.014 }
  };
  const profile = profiles[effect];
  return enqueueVoiceTask(async () => {
    const context = new AudioContextConstructor();
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration + 0.08);
    gain.connect(context.destination);
    profile.notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const start = now + index * (profile.duration / profile.notes.length);
      const end = start + profile.duration / profile.notes.length + 0.04;
      oscillator.type = profile.type;
      oscillator.frequency.setValueAtTime(note, start);
      oscillator.connect(gain);
      oscillator.start(start);
      oscillator.stop(end);
    });
    await wait((profile.duration + 0.2) * 1000);
    await context.close();
  });
}

function clearMirrorTimer(): void {
  if (mirrorTimer) {
    window.clearTimeout(mirrorTimer);
    mirrorTimer = undefined;
  }
}

function currentMirrorExercise(): MirrorExercise {
  const order = mirrorExerciseOrder(mirrorPlanSettings);
  const exerciseId = order[mirrorExerciseIndex % order.length];
  return MIRROR_EXERCISES.find((exercise) => exercise.id === exerciseId) ?? MIRROR_EXERCISES[0];
}

function startMirrorSession(): void {
  clearMirrorTimer();
  mirrorFlowToken += 1;
  mirrorState = 'attention';
  setPofiBaseState('mirrorAttention');
  renderMirrorMode();
  void ensureMirrorCamera();
  void scheduleMirrorExercise(mirrorFlowToken, true);
}

function stopMirrorSession(): void {
  clearMirrorTimer();
  mirrorFlowToken += 1;
  mirrorState = 'idle';
  stopMirrorCamera();
  renderMirrorMode();
}

async function scheduleMirrorExercise(token: number, withAttention: boolean): Promise<void> {
  if (withAttention) {
    await speakMirrorText('Bak', 'attention');
    await wait(MIRROR_ATTENTION_MS);
  }
  if (token !== mirrorFlowToken || !isMirrorViewActive()) {
    return;
  }
  enterMirrorExercise(token);
}

function enterMirrorExercise(token = ++mirrorFlowToken): void {
  clearMirrorTimer();
  const exercise = currentMirrorExercise();
  mirrorState = 'exercise';
  setPofiBaseState(exercise.pofiState);
  renderMirrorMode();
  void speakMirrorText(exercise.command, 'exercise');
  mirrorTimer = window.setTimeout(() => {
    if (token !== mirrorFlowToken || !isMirrorViewActive()) {
      return;
    }
    enterMirrorWaiting(token);
  }, 900);
}

function enterMirrorWaiting(token: number): void {
  const exercise = currentMirrorExercise();
  mirrorState = 'waiting';
  setPofiBaseState(exercise.pofiState);
  renderMirrorMode();
  mirrorTimer = window.setTimeout(() => {
    if (token !== mirrorFlowToken || !isMirrorViewActive()) {
      return;
    }
    enterMirrorSuccess(token);
  }, exercise.durationMs);
}

function enterMirrorSuccess(token: number): void {
  const exercise = currentMirrorExercise();
  mirrorState = 'success';
  setPofiBaseState('mirrorSuccess');
  trackAction('mirror-complete');
  renderMirrorMode();
  void speakMirrorText(exercise.success, 'success');
  mirrorTimer = window.setTimeout(() => {
    if (token !== mirrorFlowToken || !isMirrorViewActive()) {
      return;
    }
    mirrorExerciseIndex = (mirrorExerciseIndex + 1) % MIRROR_EXERCISES.length;
    mirrorFlowToken += 1;
    void scheduleMirrorExercise(mirrorFlowToken, false);
  }, MIRROR_SUCCESS_MS);
}

function isMirrorViewActive(): boolean {
  return document.querySelector<HTMLElement>('#view-mirror')?.classList.contains('active') ?? false;
}

function renderMirrorMode(): void {
  const surface = document.querySelector<HTMLElement>('[data-mirror-surface]');
  const pofi = document.querySelector<HTMLElement>('#view-mirror [data-pofi-avatar]');
  const video = document.querySelector<HTMLVideoElement>('[data-mirror-video]');
  const fallback = document.querySelector<HTMLElement>('[data-mirror-fallback]');
  const progress = document.querySelector<HTMLElement>('[data-mirror-progress]');
  const status = document.querySelector<HTMLElement>('[data-mirror-status]');
  if (!surface || !pofi || !video || !fallback || !progress || !status) {
    return;
  }

  const exercise = currentMirrorExercise();
  surface.dataset.mirrorState = mirrorState;
  surface.dataset.mirrorExercise = exercise.id;
  pofi.dataset.pofiState = mirrorState === 'attention' ? 'mirrorAttention' : mirrorState === 'success' ? 'mirrorSuccess' : exercise.pofiState;
  renderPofiAvatar(pofi, pofi.dataset.pofiState as PofiState);
  fallback.textContent = mirrorCameraStream ? '' : mirrorCameraRequested ? 'Kamera kapalı' : '';
  video.classList.toggle('active', Boolean(mirrorCameraStream));
  progress.style.setProperty('--mirror-duration', `${exercise.durationMs}ms`);
  progress.classList.toggle('running', mirrorState === 'waiting');
  status.textContent = mirrorState === 'success' ? exercise.success : exercise.command;
}

async function ensureMirrorCamera(): Promise<void> {
  if (mirrorCameraStream || mirrorCameraRequested) {
    renderMirrorMode();
    return;
  }

  mirrorCameraRequested = true;
  const video = document.querySelector<HTMLVideoElement>('[data-mirror-video]');
  if (!video || !navigator.mediaDevices?.getUserMedia) {
    renderMirrorMode();
    return;
  }

  try {
    mirrorCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = mirrorCameraStream;
    await video.play().catch(() => undefined);
  } catch {
    mirrorCameraStream = undefined;
  }
  renderMirrorMode();
}

function stopMirrorCamera(): void {
  const video = document.querySelector<HTMLVideoElement>('[data-mirror-video]');
  mirrorCameraStream?.getTracks().forEach((track) => track.stop());
  mirrorCameraStream = undefined;
  mirrorCameraRequested = false;
  if (video) {
    video.srcObject = null;
  }
}

function speakMirrorText(text: string, kind: 'attention' | 'exercise' | 'success'): Promise<void> {
  const profiles: Record<typeof kind, { rate: number; pitch: number; volume: number }> = {
    attention: { rate: 0.84, pitch: 1.08, volume: 0.78 },
    exercise: { rate: 0.78, pitch: 1.04, volume: 0.82 },
    success: { rate: 0.92, pitch: 1.16, volume: 0.84 }
  };
  return enqueueSpeechText(text, profiles[kind]);
}

function syncSleepMode(view: ViewName): void {
  if (view === 'sleep') {
    renderSleepMode();
    return;
  }
  void stopSleepMusic();
}

function renderSleepMode(): void {
  const surface = document.querySelector<HTMLElement>('[data-sleep-surface]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-sleep-toggle]');
  const label = document.querySelector<HTMLElement>('[data-sleep-label]');
  if (!surface || !toggle || !label) {
    return;
  }

  surface.dataset.sleepRunning = String(sleepMusicRunning);
  surface.dataset.sleepSound = sleepSettings.sound;
  surface.dataset.sleepDuration = String(sleepSettings.durationMinutes);
  toggle.setAttribute('aria-pressed', String(sleepMusicRunning));
  toggle.setAttribute('aria-label', sleepMusicRunning ? 'Uyku müziğini durdur' : 'Uyku müziğini başlat');
  label.textContent = sleepMusicRunning ? 'Durdur' : 'Başlat';

  const shell = document.querySelector<HTMLElement>('.app-shell');
  const nextPofiState: PofiState = sleepMusicRunning ? 'sleep' : 'sleepReady';
  if (shell?.dataset.activeView === 'sleep' && pofiBaseState !== nextPofiState) {
    setPofiBaseState(nextPofiState);
  }
}

async function toggleSleepMusic(button?: HTMLElement): Promise<void> {
  if (sleepMusicRunning) {
    await stopSleepMusic();
    trackAction('sleep-stop', button);
    return;
  }

  startSleepMusic();
  trackAction('sleep-start', button);
  renderSleepMode();
}

function startSleepMusic(): void {
  if (sleepMusicRunning) {
    return;
  }

  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) {
    playSoftTouchTone();
    return;
  }

  sleepAudioContext = new AudioContextConstructor();
  sleepMusicRunning = true;
  sleepMusicNodes = [];
  const context = sleepAudioContext;
  const profile = sleepSoundProfile();
  const master = context.createGain();
  const padGain = context.createGain();
  const lowPad = context.createOscillator();
  const highPad = context.createOscillator();
  const now = context.currentTime;

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.1 * sleepSettings.volume, now + 1.4);
  padGain.gain.setValueAtTime(profile.padGain, now);
  lowPad.type = profile.wave;
  highPad.type = profile.wave;
  lowPad.frequency.setValueAtTime(profile.lowFrequency, now);
  highPad.frequency.setValueAtTime(profile.highFrequency, now);
  lowPad.connect(padGain);
  highPad.connect(padGain);
  padGain.connect(master);
  master.connect(context.destination);
  lowPad.start(now);
  highPad.start(now + 0.08);
  sleepMusicNodes = [master, padGain, lowPad, highPad];
  scheduleSleepMelody();
  if (sleepSettings.durationMinutes > 0) {
    sleepAutoStopTimer = window.setTimeout(() => {
      sleepAutoStopTimer = undefined;
      void stopSleepMusic();
    }, sleepSettings.durationMinutes * 60_000);
  }
  renderSleepMode();
}

function scheduleSleepMelody(): void {
  if (!sleepAudioContext || !sleepMusicRunning) {
    return;
  }

  const context = sleepAudioContext;
  const master = sleepMusicNodes[0];
  if (!(master instanceof GainNode)) {
    return;
  }

  const profile = sleepSoundProfile();
  const notes = profile.notes;
  notes.forEach((frequency, index) => {
    const start = context.currentTime + index * 0.72;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = profile.wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(profile.noteGain, start + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.68);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + 0.74);
  });

  sleepMelodyTimer = window.setTimeout(scheduleSleepMelody, profile.repeatMs);
}

async function stopSleepMusic(): Promise<void> {
  if (sleepMelodyTimer) {
    window.clearTimeout(sleepMelodyTimer);
    sleepMelodyTimer = undefined;
  }
  if (sleepAutoStopTimer) {
    window.clearTimeout(sleepAutoStopTimer);
    sleepAutoStopTimer = undefined;
  }

  if (!sleepMusicRunning && !sleepAudioContext) {
    renderSleepMode();
    return;
  }

  sleepMusicRunning = false;
  const context = sleepAudioContext;
  const master = sleepMusicNodes[0];
  if (context && master instanceof GainNode) {
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    await wait(840);
  }

  await context?.close().catch(() => undefined);
  sleepAudioContext = undefined;
  sleepMusicNodes = [];
  renderSleepMode();
}

function sleepSoundProfile(): {
  wave: OscillatorType;
  lowFrequency: number;
  highFrequency: number;
  padGain: number;
  noteGain: number;
  repeatMs: number;
  notes: number[];
} {
  if (sleepSettings.sound === 'ocean') {
    return {
      wave: 'sine',
      lowFrequency: 110,
      highFrequency: 165,
      padGain: 0.16,
      noteGain: 0.01,
      repeatMs: 7200,
      notes: [220, 196, 174, 196]
    };
  }
  if (sleepSettings.sound === 'white') {
    return {
      wave: 'triangle',
      lowFrequency: 92,
      highFrequency: 138,
      padGain: 0.12,
      noteGain: 0.006,
      repeatMs: 8400,
      notes: [138, 146, 138, 130]
    };
  }
  return {
    wave: 'sine',
    lowFrequency: 196,
    highFrequency: 294,
    padGain: 0.18,
    noteGain: 0.018,
    repeatMs: 5200,
    notes: [392, 330, 294, 262, 294, 330]
  };
}

function recordMatchAttempt(targetId: string, correct: boolean, mode: MatchMode, latencyMs: number): void {
  const entry = matchProgressEntry(matchProgress, targetId);
  registerMatchAttempt(entry, correct);
  if (correct) {
    entry.latencyMsTotal += Math.max(0, latencyMs);
    entry.latencySamples += 1;
    if (mode === 'concept') {
      entry.conceptGeneralizationSuccess += 1;
    } else {
      entry.sameImageSuccess += 1;
    }
  }
  writeMatchProgress();
}

function shuffleTouchCards(cards: TouchCard[]): TouchCard[] {
  return [...cards].sort(() => Math.random() - 0.5);
}

function shuffleMatchChoices(choices: MatchChoice[]): MatchChoice[] {
  return [...choices].sort(() => Math.random() - 0.5);
}

function renderTouchSelection(variation?: TouchVoiceVariation, active = false): void {
  const surface = touchSurface();
  const card = selectedTouchCard();
  const cards = document.querySelectorAll<HTMLElement>('[data-touch-card-id]');
  let activeCardElement: HTMLElement | undefined;

  if (!surface) {
    return;
  }

  surface.classList.toggle('touch-speaking', active);
  surface.dataset.touchState = touchSpeechSnapshot?.state ?? 'idle';
  renderTouchPofiMotion(surface, touchSpeechSnapshot?.state ?? 'idle', active);
  surface.dataset.touchTargetId = touchSpeechSnapshot?.targetId ?? '';
  surface.dataset.touchLevel = String(touchSpeechSnapshot?.level ?? 1);
  surface.dataset.touchHintLevel = String(touchSpeechSnapshot?.hintLevel ?? 0);
  surface.dataset.touchActiveCard = String(Math.max(0, enabledTouchCards().findIndex((entry) => entry.id === card.id)));
  cards.forEach((element) => {
    const isActive = element.dataset.touchCardId === card.id;
    const isTarget = element.dataset.touchCardId === touchSpeechSnapshot?.targetId;
    const elementCard = touchSettings.cards.find((entry) => entry.id === element.dataset.touchCardId);
    if (isActive) {
      activeCardElement = element;
    }
    element.classList.toggle('active', isActive);
    element.classList.toggle('active-target', isTarget);
    ['idle', 'attention', 'targeting', 'waiting', 'success', 'retry', 'hint'].forEach((state) => {
      element.classList.toggle(`target-${state}`, isTarget && touchSpeechSnapshot?.state === state);
    });
    [1, 2, 3, 4].forEach((level) => {
      element.classList.toggle(`hint-level-${level}`, isTarget && touchSpeechSnapshot?.state === 'hint' && touchSpeechSnapshot.hintLevel === level);
    });
    element.classList.toggle('speaking', active && isActive);
    element.querySelector<HTMLElement>('.touch-card-word')!.textContent = elementCard?.word ?? '';
    element.querySelector<HTMLElement>('.touch-card-variation')!.textContent = touchCardSupportText(elementCard, variation, isActive, isTarget);
    const weather = element.querySelector<HTMLElement>('.touch-weather');
    if (weather) {
      weather.className = `touch-weather${isActive ? ` weather-${activeTouchWeather}` : ''}`;
    }
  });
  positionTouchGuide(surface, activeCardElement);
  renderTouchGuideText(card, variation, active);

  if (touchActiveTimer) {
    window.clearTimeout(touchActiveTimer);
  }

  if (active) {
    touchActiveTimer = window.setTimeout(() => {
      surface.classList.remove('touch-speaking');
      renderTouchPofiMotion(surface, touchSpeechSnapshot?.state ?? 'idle', false);
      cards.forEach((element) => element.classList.remove('speaking'));
    }, TOUCH_ACTIVE_MS);
  }
}

function renderTouchPofiMotion(
  surface: HTMLElement,
  state: SpeechMachineSnapshot['state'] | 'idle',
  speaking: boolean
): void {
  if (state === 'success') {
    touchAffirmUntil = Date.now() + TOUCH_AFFIRM_MOTION_MS;
    if (touchAffirmTimer) {
      window.clearTimeout(touchAffirmTimer);
    }
    surface.dataset.pofiMotion = 'affirm';
    touchAffirmTimer = window.setTimeout(() => {
      touchAffirmUntil = 0;
      surface.dataset.pofiMotion = touchPofiMotion(
        touchSpeechSnapshot?.state ?? 'idle',
        surface.classList.contains('touch-speaking')
      );
    }, TOUCH_AFFIRM_MOTION_MS);
    return;
  }

  if (Date.now() < touchAffirmUntil) {
    return;
  }

  surface.dataset.pofiMotion = touchPofiMotion(state, speaking);
}

function touchPofiMotion(state: SpeechMachineSnapshot['state'] | 'idle', speaking: boolean): TouchPofiMotion {
  if (state === 'success') {
    return 'affirm';
  }

  if (state === 'retry') {
    return 'reassure';
  }

  if (speaking) {
    return 'speak';
  }

  if (state === 'attention' || state === 'targeting' || state === 'hint') {
    return 'focus';
  }

  if (state === 'waiting') {
    return 'listen';
  }

  return 'idle';
}

function positionTouchGuide(surface: HTMLElement, activeCardElement?: HTMLElement): void {
  if (!activeCardElement) {
    surface.style.setProperty('--touch-pofi-left', '50%');
    surface.style.setProperty('--touch-pofi-lean', '0deg');
    return;
  }

  const surfaceRect = surface.getBoundingClientRect();
  const cardRect = activeCardElement.getBoundingClientRect();
  const center = cardRect.left + cardRect.width / 2 - surfaceRect.left;
  const guidePadding = surfaceRect.width < 520 ? 106 : 42;
  const padding = Math.min(150, Math.max(guidePadding, surfaceRect.width * 0.08));
  const clampedCenter = Math.min(surfaceRect.width - padding, Math.max(padding, center));
  surface.style.setProperty('--touch-pofi-left', `${clampedCenter}px`);
  surface.style.setProperty('--touch-pofi-lean', clampedCenter < surfaceRect.width / 2 ? '-1.8deg' : '1.8deg');
  updateTouchGuideHand(surface, clampedCenter);
}

function updateTouchGuideHand(surface: HTMLElement, pofiCenter: number): void {
  const avatar = activePofiAvatar();
  if (!avatar || !avatar.closest('#view-touch')) {
    return;
  }

  const handSide = pofiCenter < surface.getBoundingClientRect().width / 2 ? 'left' : 'right';
  surface.dataset.touchHandSide = handSide;
  const hand = avatar.querySelector<HTMLImageElement>('.pofi-hands');
  if (!hand || hand.hidden) {
    return;
  }

  const fileName = handSide === 'left' ? POFI_GUIDE_HAND_LEFT : POFI_GUIDE_HAND_RIGHT;
  updatePofiLayer(hand, pofiPartPath('hands', fileName));
}

function renderTouchGuideText(card: TouchCard, variation?: TouchVoiceVariation, active = false): void {
  const hint = document.querySelector<HTMLElement>('[data-touch-pofi-trigger] .touch-pofi-hint');
  if (!hint) {
    return;
  }

  if (touchSpeechSnapshot?.prompt) {
    hint.textContent = touchSpeechSnapshot.prompt;
    return;
  }

  hint.textContent = active
    ? `Birlikte söyle: ${variation?.text ?? card.word}`
    : `${card.label} kartındayım. Dokun, ben söyleyeyim.`;
}

function touchCardSupportText(
  card: TouchCard | undefined,
  variation: TouchVoiceVariation | undefined,
  isActive: boolean,
  isTarget: boolean
): string {
  if (!card) {
    return '';
  }

  if (!isTarget) {
    return 'Bekle';
  }

  if (touchSpeechSnapshot?.state === 'success') {
    return `Evet! ${card.label}`;
  }

  if (touchSpeechSnapshot?.state === 'retry') {
    return 'Tekrar bakalım';
  }

  if (touchSpeechSnapshot?.state === 'hint') {
    return 'Burada';
  }

  if (touchSpeechSnapshot?.state === 'targeting' || touchSpeechSnapshot?.state === 'waiting') {
    return 'Dokun';
  }

  return isActive ? variation?.text ?? 'Dokun ve dinle' : 'Dokun ve dinle';
}

function setTouchStatus(message?: string): void {
  const status = touchSurface()?.querySelector<HTMLElement>('[data-touch-status]');
  if (!status) {
    return;
  }
  status.textContent = message ?? '';
  status.classList.toggle('active', Boolean(message));
}

function loadAudioCandidate(src: string): Promise<HTMLAudioElement | undefined> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, 1600);

    function cleanup(): void {
      window.clearTimeout(timeout);
      audio.removeEventListener('canplaythrough', handleReady);
      audio.removeEventListener('loadeddata', handleReady);
      audio.removeEventListener('error', handleError);
    }

    function handleReady(): void {
      cleanup();
      resolve(audio);
    }

    function handleError(): void {
      cleanup();
      resolve(undefined);
    }

    audio.preload = 'auto';
    audio.volume = 0.72;
    audio.addEventListener('canplaythrough', handleReady, { once: true });
    audio.addEventListener('loadeddata', handleReady, { once: true });
    audio.addEventListener('error', handleError, { once: true });
    audio.load();
  });
}

async function loadAudioPool(paths: string[]): Promise<HTMLAudioElement[]> {
  const loaded = await Promise.all(paths.map((path) => loadAudioCandidate(path)));
  return loaded.filter((audio): audio is HTMLAudioElement => Boolean(audio));
}

async function preloadTouchAudio(): Promise<void> {
  if (touchAudioPreload) {
    return touchAudioPreload;
  }

  touchAudioPreload = (async () => {
    const loadedEntries = await Promise.all(enabledTouchCards().map(async (card) => [card.id, await loadTouchAudioForCard(card)] as const));
    touchAudioPools = Object.fromEntries(loadedEntries);
  })();

  return touchAudioPreload;
}

function touchSoundPaths(card: TouchCard, source: TouchSoundSource): string[] {
  const id = card.id.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (source === 'default' && id !== 'baba') {
    return [`/sounds/${source}/${id}_1.wav`, `/sounds/${source}/${id}_2.wav`];
  }
  return [`/sounds/${source}/${id}_1.wav`, `/sounds/${source}/${id}_2.wav`, `/sounds/${source}/${id}_3.wav`];
}

async function loadTouchAudioForCard(card: TouchCard): Promise<HTMLAudioElement[]> {
  const userPool = await loadAudioPool(touchSoundPaths(card, 'user'));
  if (userPool.length > 0) {
    return userPool;
  }
  return loadAudioPool(touchSoundPaths(card, 'default'));
}

function unlockTouchAudio(): void {
  touchAudioUnlocked = true;
  void preloadTouchAudio();
}

function stopCurrentTouchAudio(): void {
  if (!currentTouchAudio) {
    return;
  }

  currentTouchAudio.pause();
  currentTouchAudio.currentTime = 0;
  currentTouchAudio = undefined;
}

function selectTouchAudio(pool: HTMLAudioElement[]): HTMLAudioElement | undefined {
  if (pool.length === 0) {
    return undefined;
  }

  const selectable = pool.length > 1 ? pool.filter((audio) => audio.currentSrc !== lastTouchAudioSrc) : pool;
  const audio = selectable[randomBetween(0, selectable.length - 1)];
  lastTouchAudioSrc = audio.currentSrc;
  return audio;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function enqueueVoiceTask(task: () => Promise<void> | void): Promise<void> {
  const next = voiceQueue
    .catch(() => undefined)
    .then(() => wait(VOICE_QUEUE_GAP_MS))
    .then(() => task());
  voiceQueue = next.catch(() => undefined);
  return next;
}

function estimatedSpeechDurationMs(text: string, rate: number): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const punctuationPause = (text.match(/[.,!?]/g) ?? []).length * 180;
  const base = (wordCount * 430) / Math.max(0.6, rate) + punctuationPause;
  return Math.min(SPEECH_MAX_DURATION_MS, Math.max(SPEECH_MIN_DURATION_MS, base));
}

function enqueueSpeechText(text: string, profile: { rate: number; pitch: number; volume: number }): Promise<void> {
  if (!text.trim()) {
    return Promise.resolve();
  }

  if (!('speechSynthesis' in window)) {
    return enqueueVoiceTask(() => {
      playSoftTouchTone();
      return wait(420);
    });
  }

  return enqueueVoiceTask(
    () =>
      new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        let settled = false;
        const finish = (): void => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearTimeout(timeout);
          resolve();
        };
        const timeout = window.setTimeout(finish, estimatedSpeechDurationMs(text, profile.rate) + 900);
        utterance.lang = 'tr-TR';
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;
        utterance.volume = profile.volume;
        utterance.addEventListener('end', finish, { once: true });
        utterance.addEventListener('error', finish, { once: true });
        window.speechSynthesis.speak(utterance);
      })
  );
}

function enqueueAudioPlayback(audio: HTMLAudioElement, volume: number): Promise<void> {
  return enqueueVoiceTask(
    () =>
      new Promise<void>((resolve) => {
        let settled = false;
        const durationMs = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.min(audio.duration * 1000 + 220, 5000) : AUDIO_FALLBACK_DURATION_MS;
        const finish = (): void => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearTimeout(timeout);
          audio.removeEventListener('ended', finish);
          audio.removeEventListener('error', finish);
          if (currentTouchAudio === audio) {
            currentTouchAudio = undefined;
          }
          resolve();
        };
        const timeout = window.setTimeout(finish, durationMs);
        currentTouchAudio = audio;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = volume;
        audio.addEventListener('ended', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });
        void audio.play().catch(() => {
          playSoftTouchTone();
          finish();
        });
      })
  );
}

async function playTouchCardSound(card: TouchCard, intent: TouchSoundIntent, volume: number): Promise<void> {
  if (!touchAudioUnlocked) {
    return;
  }

  await preloadTouchAudio();
  const pool = touchAudioPools[card.id] ?? [];
  const audio = selectTouchAudio(pool);

  if (!audio) {
    enqueueVoiceTask(() => {
      playSoftTouchTone();
      return wait(420);
    });
    return;
  }

  await enqueueAudioPlayback(audio, volume);
}

function playSoftTouchTone(): void {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(660, now);
  oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.36);
  oscillator.addEventListener('ended', () => {
    void context.close();
  });
}

function playMatchStateTone(style: 'targeting' | 'hint' | 'success' | 'retry'): void {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor || !touchAudioUnlocked) {
    return;
  }

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const tone = {
    targeting: { start: 520, end: 680, gain: 0.026, duration: 0.24 },
    hint: { start: 420, end: 560, gain: 0.018, duration: 0.32 },
    success: { start: 660, end: 920, gain: 0.034, duration: 0.28 },
    retry: { start: 360, end: 430, gain: 0.018, duration: 0.26 }
  }[style];

  oscillator.type = style === 'success' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(tone.start, now);
  oscillator.frequency.exponentialRampToValueAtTime(tone.end, now + tone.duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(tone.gain, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration + 0.08);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + tone.duration + 0.1);
  oscillator.addEventListener('ended', () => {
    void context.close();
  });
}

function stopTouchRepeat(): void {
  touchRepeatActive = false;
  touchSettings.repeat.enabled = false;

  if (touchRepeatTimer) {
    window.clearTimeout(touchRepeatTimer);
    touchRepeatTimer = undefined;
  }

  renderTouchRepeatState();
}

function startTouchRepeat(): void {
  unlockTouchAudio();
  touchRepeatActive = true;
  touchSettings.repeat.enabled = true;
  touchRepeatStartedAt = Date.now();
  touchRepeatCount = 0;
  renderTouchRepeatState();
  runTouchRepeatCue();
}

function toggleTouchRepeat(): void {
  if (touchRepeatActive) {
    stopTouchRepeat();
    return;
  }
  startTouchRepeat();
}

function runTouchRepeatCue(): void {
  if (!touchRepeatActive || document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView !== 'touch') {
    stopTouchRepeat();
    return;
  }

  const elapsedSeconds = (Date.now() - touchRepeatStartedAt) / 1000;
  if (elapsedSeconds >= touchSettings.repeat.maxDurationSeconds || touchRepeatCount >= touchSettings.repeat.maxRepeats) {
    setTouchStatus('Ahenkli tekrar tamamlandı.');
    stopTouchRepeat();
    return;
  }

  touchRepeatCount += 1;
  void handleTouchCardPlayback(selectedTouchCard(), 'repeat');
  renderTouchRepeatState();

  const card = selectedTouchCard();
  const adaptiveInterval = adaptiveRepeatInterval(
    touchProgress[card.id],
    touchSettings.repeat.minIntervalMs,
    touchSettings.repeat.maxIntervalMs
  );
  trackTouchAnalyticsDetail('repeat', card.id, { intervalMs: adaptiveInterval });
  touchRepeatTimer = window.setTimeout(runTouchRepeatCue, adaptiveInterval);
}

function renderTouchRepeatState(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-touch-repeat-toggle]');
  const status = document.querySelector<HTMLElement>('[data-touch-repeat-status]');
  if (toggle) {
    toggle.classList.toggle('active', touchRepeatActive);
    toggle.textContent = touchRepeatActive ? 'Ahenkli tekrar açık' : 'Ahenkli tekrar';
  }
  if (status) {
    status.textContent = touchRepeatActive ? `${touchRepeatCount}/${touchSettings.repeat.maxRepeats}` : 'Kapalı';
  }
}

function createTouchSpeechMachine(): SpeechStateMachine {
  return new SpeechStateMachine({
    items: () =>
      enabledTouchCards().map((card) => ({
        id: card.id,
        label: card.label,
        learningGoal: card.learningGoal,
        audio: touchSoundPaths(card, 'default')[0]
      })),
    targetWeight: (item) => adaptiveTargetWeight(touchProgress[item.id]),
    overallSuccessRate: () => overallSuccessRate(touchProgress),
    promptText: ({ kind, item, hintLevel }) => touchPromptText(kind, item?.id, item?.label, hintLevel),
    onStateChange: handleTouchSpeechState,
    onPrompt: handleTouchSpeechPrompt,
    onSound: handleTouchSpeechSound,
    onAttempt: (event) => {
      recordTouchAttempt(event.item.id, event.correct, event.latencyMs);
      trackTouchAnalyticsDetail(event.correct ? 'success' : 'fail', event.item.id, {
        latencyMs: event.latencyMs,
        submittedId: event.submittedId
      });
    },
    onHint: (event) => {
      recordTouchHintUsage(event.item.id, event.hintLevel);
      trackTouchAnalyticsDetail('hint', event.item.id, { hintLevel: event.hintLevel });
    }
  });
}

function touchPromptText(
  kind: SpeechPromptEvent['kind'],
  itemId?: string,
  label = '',
  hintLevel?: 1 | 2 | 3 | 4
): string | undefined {
  const card = touchSettings.cards.find((entry) => entry.id === itemId);
  const goal = card?.learningGoal;

  if (kind === 'targeting' && goal) {
    return `${label} kartına dokun. ${goal} çalışalım 😊`;
  }

  if (kind === 'hint') {
    if (hintLevel === 1) {
      return `${label}`;
    }
    if (hintLevel === 2) {
      return `${label} burada parlıyor 😊`;
    }
    if (hintLevel === 3) {
      return `Pofi ${label} kartını gösteriyor 😊`;
    }
    if (hintLevel === 4) {
      return `${label} kartına birlikte dokunalım 😊`;
    }
  }

  if (kind === 'success' && goal) {
    return `Evet, ${label}. ${goal} tamam 😊`;
  }

  return undefined;
}

function handleTouchSpeechState(snapshot: SpeechMachineSnapshot): void {
  if (touchIdleRecoveryTimer) {
    window.clearTimeout(touchIdleRecoveryTimer);
    touchIdleRecoveryTimer = undefined;
  }
  if (snapshot.state === 'success' && lastTouchSpeechState !== 'success') {
    touchSuccessCount += 1;
  }
  lastTouchSpeechState = snapshot.state;
  touchSpeechSnapshot = snapshot;
  if (snapshot.targetId) {
    selectedTouchCardId = snapshot.targetId;
    const targetCard = touchSettings.cards.find((entry) => entry.id === snapshot.targetId);
    if (targetCard && (snapshot.state === 'attention' || !touchRoundImages[targetCard.id])) {
      chooseTouchRoundImage(targetCard);
    }
  }

  applyTouchPofiState(snapshot.state);
  renderTouchCards();
  if (snapshot.prompt) {
    setTouchStatus(snapshot.prompt);
  }
  if (snapshot.state === 'idle' && document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView === 'touch') {
    touchIdleRecoveryTimer = window.setTimeout(() => {
      touchIdleRecoveryTimer = undefined;
      if (touchSpeechSnapshot?.state === 'idle' && document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView === 'touch') {
        touchSpeechMachine?.nudge();
      }
    }, 700);
  }
}

function handleTouchSpeechPrompt(event: SpeechPromptEvent): void {
  setTouchStatus(event.text);
  if (event.kind === 'attention' || event.kind === 'retry' || event.kind === 'hint') {
    playSoftTouchTone();
  }
}

async function handleTouchSpeechSound(event: SpeechSoundEvent): Promise<void> {
  const card = touchSettings.cards.find((entry) => entry.id === event.item.id);
  if (!card) {
    return;
  }

  const variation = touchVariationForSpeechSound(card, event);
  activeTouchWeather = TOUCH_WEATHER_EFFECTS[randomBetween(0, TOUCH_WEATHER_EFFECTS.length - 1)];
  renderTouchSelection(variation, true);
  await playTouchCardSound(card, event.intent === 'success' ? 'pofi' : 'word', event.intent === 'success' ? 0.9 : 0.78);
}

function touchVariationForSpeechSound(card: TouchCard, event: SpeechSoundEvent): TouchVoiceVariation {
  const variation = nextTouchVariation(card, event.style);
  if (event.intent === 'success' && event.phrase !== card.label) {
    return {
      id: `speech-${event.intent}-${card.id}-${variation.id}`,
      label: event.phrase,
      text: event.phrase,
      rhythm: event.style
    };
  }

  if (event.intent === 'target') {
    return {
      ...variation,
      label: variation.text,
      text: variation.text
    };
  }

  if (event.intent === 'hint') {
    return {
      ...variation,
      label: variation.text,
      text: variation.text
    };
  }

  return {
    ...variation,
    label: event.phrase,
    text: event.phrase
  };
}

function applyTouchPofiState(state: SpeechMachineSnapshot['state']): void {
  if (state === 'attention') {
    setPofiBaseState('attention');
    return;
  }

  if (state === 'targeting' || state === 'waiting') {
    setPofiBaseState(state === 'targeting' ? 'targeting' : 'waiting');
    return;
  }

  if (state === 'hint') {
    setPofiBaseState('hint');
    return;
  }

  if (state === 'success') {
    setPofiBaseState(touchSuccessPofiState());
    return;
  }

  if (state === 'retry') {
    setPofiBaseState('tryAgain');
    return;
  }

  setPofiBaseState('guide');
}

function touchSuccessPofiState(): PofiState {
  if (touchSuccessCount > 0 && touchSuccessCount % 8 === 0) {
    return 'successCelebrate';
  }

  return 'successSoft';
}

function stopTouchRitual(): void {
  touchSpeechMachine?.stop();
  touchSpeechMachine = undefined;
  touchSpeechSnapshot = undefined;
  lastTouchSpeechState = undefined;
  stopTouchRepeat();

  if (touchIdleRecoveryTimer) {
    window.clearTimeout(touchIdleRecoveryTimer);
    touchIdleRecoveryTimer = undefined;
  }
  if (touchActiveTimer) {
    window.clearTimeout(touchActiveTimer);
    touchActiveTimer = undefined;
  }
  if (touchAffirmTimer) {
    window.clearTimeout(touchAffirmTimer);
    touchAffirmTimer = undefined;
  }
  touchAffirmUntil = 0;

  touchSurface()?.classList.remove('touch-speaking');
  stopCurrentTouchAudio();
}

function startTouchRitual(): void {
  touchVariationIndex = 0;
  lastTouchVariationId = undefined;
  lastTouchSpeechState = undefined;
  touchSuccessCount = 0;
  touchRoundImages = {};
  touchSpeechMachine = createTouchSpeechMachine();
  renderTouchRepeatState();
  setTouchStatus();
  unlockTouchAudio();
  touchSpeechMachine.start();
}

function syncTouchRitual(view: ViewName): void {
  stopTouchRitual();

  if (view === 'touch') {
    startTouchRitual();
  }
}

async function handleTouchCardPlayback(card: TouchCard, intent: TouchSoundIntent): Promise<void> {
  const variation = nextTouchVariation(card);
  activeTouchWeather = TOUCH_WEATHER_EFFECTS[randomBetween(0, TOUCH_WEATHER_EFFECTS.length - 1)];
  renderTouchSelection(variation, true);
  setTouchStatus(`${card.label}: ${variation.label}`);
  showPofiReaction(intent === 'repeat' ? 'waiting' : touchSuccessPofiState());
  await playTouchCardSound(card, intent, intent === 'pofi' ? 0.9 : 0.78);
}

function handleTouchCardPress(cardId: string, element?: HTMLElement): void {
  const card = touchSettings.cards.find((entry) => entry.id === cardId);
  if (!card) {
    return;
  }

  unlockTouchAudio();
  selectedTouchCardId = card.id;
  renderTouchCards();
  if (element) {
    showTouchCue(element);
  }
  if (touchSpeechMachine) {
    touchSpeechMachine.submit(card.id);
    trackAction(card.id === touchSpeechSnapshot?.targetId ? 'touch-correct' : 'touch-offtarget', element);
    return;
  }

  trackAction('touch-listen', element);
  void handleTouchCardPlayback(card, 'word');
}

function handleTouchPofiPress(element?: HTMLElement): void {
  unlockTouchAudio();
  if (element) {
    showTouchCue(element);
  }
  if (touchSpeechMachine) {
    touchSpeechMachine.nudge();
    trackAction('touch-guide', element);
    return;
  }

  trackAction('touch-listen', element);
  void handleTouchCardPlayback(selectedTouchCard(), 'pofi');
}

function openTouchDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TOUCH_DB_NAME, TOUCH_DB_VERSION);
    request.addEventListener('upgradeneeded', () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TOUCH_DB_STORE)) {
        db.createObjectStore(TOUCH_DB_STORE);
      }
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

async function readTouchSettings(): Promise<TouchSettingsState | undefined> {
  try {
    if (!('indexedDB' in window)) {
      const raw = localStorage.getItem(TOUCH_SETTINGS_KEY);
      return raw ? (JSON.parse(raw) as TouchSettingsState) : undefined;
    }
    const db = await openTouchDb();
    return await new Promise<TouchSettingsState | undefined>((resolve) => {
      const transaction = db.transaction(TOUCH_DB_STORE, 'readonly');
      const request = transaction.objectStore(TOUCH_DB_STORE).get(TOUCH_SETTINGS_KEY);
      request.addEventListener('success', () => resolve(request.result as TouchSettingsState | undefined));
      request.addEventListener('error', () => resolve(undefined));
    });
  } catch {
    return undefined;
  }
}

async function writeTouchSettings(): Promise<void> {
  const payload: TouchSettingsState = {
    cards: touchSettings.cards,
    repeat: { ...touchSettings.repeat, enabled: false }
  };
  const serializedPayload = JSON.stringify(payload);

  try {
    localStorage.setItem(TOUCH_SETTINGS_KEY, serializedPayload);
    if (storageByteLength(serializedPayload) > TOUCH_SETTINGS_STORAGE_WARNING_BYTES) {
      setTouchParentStatus('Yerel kayıt alanı dolmaya yaklaştı. Büyük görselleri azaltmak iyi olur.');
    }
  } catch (error) {
    if (isStorageQuotaError(error)) {
      setTouchParentStatus('Cihazın yerel kayıt alanı dolu olabilir. Daha küçük görseller deneyin.');
    } else {
      console.warn('Touch settings localStorage write failed:', error);
    }
  }

  if (!('indexedDB' in window)) {
    return;
  }

  try {
    const db = await openTouchDb();
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(TOUCH_DB_STORE, 'readwrite');
      transaction.objectStore(TOUCH_DB_STORE).put(payload, TOUCH_SETTINGS_KEY);
      transaction.addEventListener('complete', () => resolve());
      transaction.addEventListener('error', () => resolve());
    });
  } catch {
    // localStorage fallback above is enough for older browsers.
  }
}

function storageByteLength(value: string): number {
  if ('TextEncoder' in window) {
    return new TextEncoder().encode(value).byteLength;
  }
  return value.length;
}

function isStorageQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) {
    return false;
  }
  return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014;
}

function normalizeTouchSettings(stored?: TouchSettingsState): TouchSettingsState {
  const defaults = cloneDefaultTouchSettings();
  if (!stored?.cards?.length) {
    return defaults;
  }

  const normalizedCards = stored.cards.map((card, index) => ({
    ...card,
    id: card.id || `card-${Date.now()}-${index}`,
    label: card.label || card.word || 'Kart',
    word: card.word || card.label || 'Kart',
    learningGoal: card.learningGoal || TOUCH_DEFAULT_LEARNING_GOALS[card.id] || 'kavramı tanıma',
    image: card.image || createTouchCardImage(card.label || 'Kart', 'ball'),
    images: card.images?.length ? card.images : [card.image || createTouchCardImage(card.label || 'Kart', 'ball')],
    enabled: card.enabled !== false,
    order: Number.isFinite(card.order) ? card.order : index,
    variations: card.variations?.length ? card.variations : createDefaultVariations(card.id || `card-${index}`, card.word || card.label || 'Kart')
  }));

  return {
    cards: normalizedCards.sort((a, b) => a.order - b.order).map((card, order) => ({ ...card, order })),
    repeat: { ...TOUCH_DEFAULT_REPEAT_SETTINGS, ...stored.repeat, enabled: false }
  };
}

async function initializeTouchSettings(): Promise<void> {
  const stored = await readTouchSettings();
  touchSettings = normalizeTouchSettings(stored);
  selectedTouchCardId = enabledTouchCards()[0]?.id ?? touchSettings.cards[0]?.id ?? 'baba';
  touchAudioPreload = undefined;
  renderTouchCards();
  renderParentTouchSettings();
  renderTouchProgressTable();
  renderMatchProgressTable();
  renderMatchingGame();
  renderSentenceGame();
}

function renderParentTouchSettings(): void {
  const editor = document.querySelector<HTMLElement>('[data-touch-card-editor]');
  const duration = document.querySelector<HTMLInputElement>('[data-touch-repeat-duration]');
  const repeats = document.querySelector<HTMLInputElement>('[data-touch-repeat-count]');
  if (duration) {
    duration.value = String(touchSettings.repeat.maxDurationSeconds);
  }
  if (repeats) {
    repeats.value = String(touchSettings.repeat.maxRepeats);
  }
  if (!editor) {
    return;
  }

  editor.innerHTML = [...touchSettings.cards]
    .sort((a, b) => a.order - b.order)
    .map((card, index, cards) => {
      const images = normalizedTouchImages(card);
      return `<article class="touch-card-admin" data-touch-card-admin="${card.id}">
        <div class="touch-card-admin-preview">${touchCardVisualMarkup(card)}</div>
        <div class="touch-card-admin-fields">
          <label>Kart adı <input type="text" value="${card.label}" data-touch-card-field="label" /></label>
          <label>Kelime <input type="text" value="${card.word}" data-touch-card-field="word" /></label>
          <label>Öğrenme amacı <input type="text" value="${card.learningGoal}" data-touch-card-field="learningGoal" /></label>
          <label class="inline-check"><input type="checkbox" data-touch-card-enabled ${card.enabled ? 'checked' : ''} /> Aktif</label>
          <input type="file" accept="image/png,image/jpeg,image/gif" data-touch-card-image />
          <div class="touch-image-bank" aria-label="${card.label} görsel havuzu">
            ${images
              .map(
                (image, imageIndex) => `<button class="touch-image-chip${image === card.image ? ' active' : ''}" type="button" data-touch-image-select="${imageIndex}" aria-label="Görsel ${imageIndex + 1}">
                  ${touchCardVisualMarkupForImage(card, image)}
                </button>
                <button class="touch-image-delete" type="button" data-touch-image-delete="${imageIndex}" ${images.length <= 1 ? 'disabled' : ''}>Sil</button>`
              )
              .join('')}
          </div>
        </div>
        <div class="touch-card-admin-actions">
          <button type="button" data-touch-card-move="up" ${index === 0 ? 'disabled' : ''}>Yukarı</button>
          <button type="button" data-touch-card-move="down" ${index === cards.length - 1 ? 'disabled' : ''}>Aşağı</button>
          <button type="button" data-touch-card-delete>Sil</button>
        </div>
      </article>`;
    })
    .join('');
}

function setTouchParentStatus(message: string): void {
  const status = document.querySelector<HTMLElement>('[data-touch-parent-status]');
  if (status) {
    status.textContent = message;
  }
}

function touchCardFromAdminElement(element: Element | null | undefined): TouchCard | undefined {
  const wrapper = element?.closest<HTMLElement>('[data-touch-card-admin]');
  const cardId = wrapper?.dataset.touchCardAdmin;
  return touchSettings.cards.find((card) => card.id === cardId);
}

function reorderTouchCards(): void {
  touchSettings.cards = [...touchSettings.cards]
    .sort((a, b) => a.order - b.order)
    .map((card, order) => ({ ...card, order }));
}

function addTouchCard(): void {
  const id = `kart-${Date.now()}`;
  touchSettings.cards.push({
    id,
    label: 'Yeni kart',
    word: 'Yeni',
    learningGoal: 'kavramı tanıma',
    image: createTouchCardImage('Yeni', 'ball'),
    images: [createTouchCardImage('Yeni', 'ball')],
    enabled: true,
    order: touchSettings.cards.length,
    variations: createDefaultVariations(id, 'Yeni')
  });
  renderParentTouchSettings();
  renderTouchCards();
  void writeTouchSettings();
}

function moveTouchCard(card: TouchCard, direction: 'up' | 'down'): void {
  const ordered = [...touchSettings.cards].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((entry) => entry.id === card.id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  const swap = ordered[swapIndex];
  if (!swap) {
    return;
  }
  [card.order, swap.order] = [swap.order, card.order];
  reorderTouchCards();
  renderParentTouchSettings();
  renderTouchCards();
  void writeTouchSettings();
}

function deleteTouchCard(card: TouchCard): void {
  if (touchSettings.cards.length <= 1) {
    setTouchParentStatus('En az bir Dokun kartı kalmalı.');
    return;
  }
  touchSettings.cards = touchSettings.cards.filter((entry) => entry.id !== card.id);
  reorderTouchCards();
  selectedTouchCardId = enabledTouchCards()[0]?.id ?? touchSettings.cards[0]?.id ?? selectedTouchCardId;
  renderParentTouchSettings();
  renderTouchCards();
  void writeTouchSettings();
}

function selectTouchCardImage(card: TouchCard, imageIndex: number): void {
  const image = normalizedTouchImages(card)[imageIndex];
  if (!image) {
    return;
  }
  card.image = image;
  renderParentTouchSettings();
  renderTouchCards();
  renderMatchingGame();
  renderSentenceGame();
  void writeTouchSettings();
}

function deleteTouchCardImage(card: TouchCard, imageIndex: number): void {
  const images = normalizedTouchImages(card);
  if (images.length <= 1) {
    setTouchParentStatus('Her kartta en az bir görsel kalmalı.');
    return;
  }

  const image = images[imageIndex];
  card.images = images.filter((entry) => entry !== image);
  card.image = card.images.includes(card.image) ? card.image : card.images[0];
  delete touchRoundImages[card.id];
  renderParentTouchSettings();
  renderTouchCards();
  renderMatchingGame();
  renderSentenceGame();
  setTouchParentStatus('Kart görseli silindi.');
  void writeTouchSettings();
}

async function handleTouchCardImageUpload(card: TouchCard, file: File): Promise<void> {
  if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
    setTouchParentStatus('Sadece PNG, JPEG veya GIF yüklenebilir.');
    return;
  }

  if (file.type === 'image/gif') {
    if (file.size > TOUCH_MAX_GIF_BYTES) {
      setTouchParentStatus('GIF çok büyük. Lütfen daha küçük bir animasyon seçin.');
      return;
    }
    card.image = await readFileAsDataUrl(file);
  } else {
    card.image = await resizeTouchImage(file);
  }
  card.images = [...new Set([...(card.images ?? []), card.image])];

  renderParentTouchSettings();
  renderTouchCards();
  renderMatchingGame();
  renderSentenceGame();
  setTouchParentStatus('Kart görseli güncellendi.');
  void writeTouchSettings();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function resizeTouchImage(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => reject(new Error('image-load-failed')), { once: true });
    image.src = dataUrl;
  });

  const scale = Math.min(1, TOUCH_MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  if (scale >= 1 && file.size < 900_000) {
    return dataUrl;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  context?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
}

function saveRepeatSettingsFromPanel(): void {
  const duration = document.querySelector<HTMLInputElement>('[data-touch-repeat-duration]');
  const repeats = document.querySelector<HTMLInputElement>('[data-touch-repeat-count]');
  touchSettings.repeat.maxDurationSeconds = clampNumber(Number(duration?.value), 5, 180, TOUCH_DEFAULT_REPEAT_SETTINGS.maxDurationSeconds);
  touchSettings.repeat.maxRepeats = clampNumber(Number(repeats?.value), 1, 60, TOUCH_DEFAULT_REPEAT_SETTINGS.maxRepeats);
  renderTouchRepeatState();
  renderParentTouchSettings();
  setTouchParentStatus('Ahenkli tekrar ayarları kaydedildi.');
  void writeTouchSettings();
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function resetCueClass(element: HTMLElement, className: string, duration: number): void {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => {
    element.classList.remove(className);
  }, duration);
}

function showTouchCue(element: HTMLElement): void {
  resetCueClass(element, 'touch-cue', TOUCH_CUE_MS);
}

function showClickHandCue(element: HTMLElement): void {
  let hand = element.querySelector<HTMLImageElement>('.object-click-hand');
  if (!hand) {
    hand = pofiImage(CLICK_HAND_RIGHT_ASSET, 'object-click-hand');
    element.append(hand);
  }

  const useLeftHand = shouldUseLeftClickHand(element);
  hand.src = useLeftHand ? CLICK_HAND_LEFT_ASSET : CLICK_HAND_RIGHT_ASSET;
  hand.classList.toggle('from-left', !useLeftHand);
  hand.classList.toggle('from-right', useLeftHand);
  resetCueClass(element, 'click-cue', CLICK_HAND_CUE_MS);
}

function shouldUseLeftClickHand(element: HTMLElement): boolean {
  const tileGroup = element.parentElement;
  if (!tileGroup) {
    return false;
  }

  const tileRects = Array.from(tileGroup.querySelectorAll<HTMLElement>('.object-tile')).map((tile) =>
    tile.getBoundingClientRect()
  );
  if (tileRects.length === 0) {
    return false;
  }

  const groupLeft = Math.min(...tileRects.map((rect) => rect.left));
  const groupRight = Math.max(...tileRects.map((rect) => rect.right));
  const elementRect = element.getBoundingClientRect();
  return elementRect.left + elementRect.width / 2 > groupLeft + (groupRight - groupLeft) / 2;
}

function showActionCue(element: HTMLElement, action: string): void {
  if (action.startsWith('touch-')) {
    showTouchCue(element);
    return;
  }

  showClickHandCue(element);
}

function renderParentMetrics(): void {
  const state = readAnalytics();
  const modules = Object.entries(state.modules);
  const totals = modules.reduce(
    (acc, [_name, stats]) => {
      acc.correct += stats.correct;
      acc.soft += stats.softRedirects;
      return acc;
    },
    { correct: 0, soft: 0 }
  );

  document.getElementById('metric-sessions')!.textContent = String(state.sessions);
  document.getElementById('metric-correct')!.textContent = String(totals.correct);
  document.getElementById('metric-soft')!.textContent = String(totals.soft);
  document.getElementById('metric-repeats')!.textContent = String(state.repeats);

  const log = document.getElementById('module-log');
  if (!log) {
    return;
  }

  log.innerHTML =
    modules.length === 0
      ? 'Henüz kayıt yok. İlk oyun açıldığında burada sakin bir özet oluşacak.'
      : modules
          .map(([name, stats]) => {
            return `<p><strong>${parentModuleLabel(name)}</strong>: ${stats.opens} açılış, ${stats.actions} eylem, ${stats.correct} olumlu deneme, ${stats.softRedirects} yönlendirme.</p>`;
          })
          .join('');

  if (state.touch) {
    const averageLatency =
      state.touch.successLatencySamples > 0
        ? Math.round(state.touch.successLatencyMsTotal / state.touch.successLatencySamples)
        : 0;
    const hintSummary = Object.entries(state.touch.hintLevels)
      .map(([level, count]) => `${level}: ${count}`)
      .join(', ');
    log.insertAdjacentHTML(
      'beforeend',
      `<p><strong>Dokun öğrenme</strong>: ipucu kullanımı ${hintSummary || '0'}, ortalama doğru dokunma ${averageLatency} ms, tekrar ihtiyacı ${state.touch.repeatNeeds}.</p>`
    );
  }

  renderParentGuidance(state);
}

function renderParentGuidance(state: AnalyticsState): void {
  const grid = document.querySelector<HTMLElement>('[data-parent-guidance]');
  if (!grid) {
    return;
  }

  const labels = Object.fromEntries(touchSettings.cards.map((card) => [card.id, card.word]));
  const cards = createParentGuidanceCards(state, touchProgress, matchProgress, labels);
  grid.innerHTML = cards
    .map(
      (card) => `
        <article class="parent-guidance-card" data-tone="${card.tone}">
          <span>${card.title}</span>
          <strong>${card.value}</strong>
          <small>${card.note}</small>
        </article>`
    )
    .join('');
}

async function renderDeviceStatus(): Promise<void> {
  const grid = document.querySelector<HTMLElement>('[data-device-status]');
  const note = document.querySelector<HTMLElement>('[data-device-status-note]');
  if (!grid) {
    return;
  }

  const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
  const usage = estimate?.usage ?? 0;
  const quota = estimate?.quota ?? 0;
  const usagePercent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
  const usageText = quota > 0 ? `%${usagePercent} kullanım` : 'Tarayıcı yönetiyor';
  const cameraReady = Boolean(navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices);
  const audioReady = 'speechSynthesis' in window && Boolean(window.AudioContext);

  const rows = [
    {
      label: 'Çevrimdışı',
      value: navigator.onLine ? 'Çevrimiçi' : 'Çevrimdışı mod',
      note: 'Servis worker destekliyse uygulama kabuğu saklanır.',
      status: navigator.onLine ? 'ready' : 'fallback'
    },
    {
      label: 'Kamera',
      value: cameraReady ? 'Hazır' : 'Metinle devam',
      note: 'Ayna kamera yoksa Pofi model gösterir.',
      status: cameraReady ? 'ready' : 'fallback'
    },
    {
      label: 'Ses',
      value: audioReady ? 'Hazır' : 'Yazı ve görsel destek',
      note: 'TTS veya ses kapalıysa oyun akışı durmaz.',
      status: audioReady ? 'ready' : 'fallback'
    },
    {
      label: 'Yerel kayıt',
      value: usageText,
      note: 'Kartlar, ilerleme ve ebeveyn tercihleri bu cihazda kalır.',
      status: usagePercent > 85 ? 'fallback' : 'ready'
    }
  ];

  grid.innerHTML = rows
    .map(
      (row) => `
        <article class="device-status-chip" data-status="${row.status}">
          <span>${row.label}</span>
          <strong>${row.value}</strong>
          <small>${row.note}</small>
        </article>`
    )
    .join('');

  if (note) {
    note.textContent =
      'Parent panel local-first çalışır: oyun kayıtları, modül tercihleri ve kart düzenlemeleri bu cihazda tutulur; bulut hesabı yoktur.';
  }
}

function parentModuleLabel(name: string): string {
  const labels: Record<string, string> = {
    touch: 'Dokun',
    match: 'Eşleme',
    sentence: 'İfade',
    story: 'Hikaye',
    mirror: 'Ayna',
    sleep: 'Uyku',
    peekaboo: 'Ceee'
  };
  return labels[name] ?? name;
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  if (isLocal) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

function boot(): void {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : undefined;
    const touchCardTrigger = target?.closest<HTMLElement>('[data-touch-card-id]');
    const touchPofiTrigger = target?.closest<HTMLElement>('[data-touch-pofi-trigger]');
    const touchRepeatTrigger = target?.closest<HTMLElement>('[data-touch-repeat-toggle]');
    const touchCardAdd = target?.closest<HTMLElement>('[data-touch-card-add]');
    const touchRepeatSave = target?.closest<HTMLElement>('[data-touch-repeat-save]');
    const touchCardDelete = target?.closest<HTMLElement>('[data-touch-card-delete]');
    const touchCardMove = target?.closest<HTMLElement>('[data-touch-card-move]');
    const touchImageSelect = target?.closest<HTMLElement>('[data-touch-image-select]');
    const touchImageDelete = target?.closest<HTMLElement>('[data-touch-image-delete]');
    const matchChoice = target?.closest<HTMLElement>('[data-match-choice]');
    const matchPofiTrigger = target?.closest<HTMLElement>('[data-match-pofi-trigger]');
    const sentenceModeButton = target?.closest<HTMLElement>('.sentence-mode-button[data-sentence-mode]');
    const sentenceBoardCard = target?.closest<HTMLElement>('[data-sentence-board-card]');
    const sentenceCard = target?.closest<HTMLElement>('[data-sentence-card]');
    const sentencePofiTrigger = target?.closest<HTMLElement>('[data-sentence-pofi-trigger]');
    const storyChoice = target?.closest<HTMLElement>('[data-story-choice]');
    const storyPofiTrigger = target?.closest<HTMLElement>('[data-story-pofi-trigger]');
    const mirrorRepeat = target?.closest<HTMLElement>('[data-mirror-repeat]');
    const mirrorNext = target?.closest<HTMLElement>('[data-mirror-next]');
    const viewTrigger = target?.closest<HTMLElement>('[data-view]');

    if (storyPofiTrigger) {
      handleStoryPofiPress();
      return;
    }

    if (storyChoice?.dataset.storyChoice) {
      handleStoryChoice(storyChoice.dataset.storyChoice, storyChoice);
      return;
    }

    if (mirrorRepeat) {
      mirrorFlowToken += 1;
      enterMirrorExercise(mirrorFlowToken);
      return;
    }

    if (mirrorNext) {
      mirrorExerciseIndex = (mirrorExerciseIndex + 1) % MIRROR_EXERCISES.length;
      mirrorFlowToken += 1;
      enterMirrorExercise(mirrorFlowToken);
      return;
    }

    if (sentencePofiTrigger) {
      handleSentencePofiPress(sentencePofiTrigger);
      return;
    }

    if (sentenceModeButton?.dataset.sentenceMode === 'learn' || sentenceModeButton?.dataset.sentenceMode === 'board') {
      selectSentenceMode(sentenceModeButton.dataset.sentenceMode);
      return;
    }

    if (sentenceBoardCard?.dataset.sentenceBoardCard) {
      handleSentenceBoardCard(sentenceBoardCard.dataset.sentenceBoardCard, sentenceBoardCard);
      return;
    }

    if (sentenceCard) {
      handleSentenceExpressionPress(sentenceCard);
      return;
    }

    if (matchPofiTrigger) {
      handleMatchPofiPress(matchPofiTrigger);
      return;
    }

    if (matchChoice?.dataset.matchChoice) {
      handleMatchChoice(matchChoice.dataset.matchChoice, matchChoice);
      return;
    }

    if (touchCardTrigger?.dataset.touchCardId) {
      handleTouchCardPress(touchCardTrigger.dataset.touchCardId, touchCardTrigger);
      return;
    }

    if (touchPofiTrigger) {
      handleTouchPofiPress(touchPofiTrigger);
      return;
    }

    if (touchRepeatTrigger) {
      toggleTouchRepeat();
      return;
    }

    if (touchCardAdd) {
      addTouchCard();
      return;
    }

    if (touchRepeatSave) {
      saveRepeatSettingsFromPanel();
      return;
    }

    if (touchCardDelete) {
      const card = touchCardFromAdminElement(touchCardDelete);
      if (card) {
        deleteTouchCard(card);
      }
      return;
    }

    if (touchCardMove?.dataset.touchCardMove) {
      const card = touchCardFromAdminElement(touchCardMove);
      const direction = touchCardMove.dataset.touchCardMove === 'up' ? 'up' : 'down';
      if (card) {
        moveTouchCard(card, direction);
      }
      return;
    }

    if (touchImageSelect?.dataset.touchImageSelect) {
      const card = touchCardFromAdminElement(touchImageSelect);
      if (card) {
        selectTouchCardImage(card, Number(touchImageSelect.dataset.touchImageSelect));
      }
      return;
    }

    if (touchImageDelete?.dataset.touchImageDelete) {
      const card = touchCardFromAdminElement(touchImageDelete);
      if (card) {
        deleteTouchCardImage(card, Number(touchImageDelete.dataset.touchImageDelete));
      }
      return;
    }

    if (viewTrigger?.dataset.view) {
      const requestedView = viewTrigger.dataset.view as ViewName;
      const activeView = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView;
      const isBottomNavTrigger = Boolean(viewTrigger.closest('.bottom-nav'));
      const isBrandHomeTrigger = viewTrigger.classList.contains('brand-home') && requestedView === 'home';
      if (shouldLockChildNavigation(activeView) && !isBrandHomeTrigger) {
        return;
      }
      activateView(isBottomNavTrigger && requestedView === activeView ? 'home' : requestedView);
      return;
    }

  });

  document.addEventListener('change', (event) => {
    const target = event.target instanceof HTMLInputElement ? event.target : undefined;
    if (!target) {
      return;
    }

    const card = touchCardFromAdminElement(target);
    if (target.dataset.touchCardField && card) {
      const value = target.value.trim() || 'Kart';
      if (target.dataset.touchCardField === 'label') {
        card.label = value;
      }
      if (target.dataset.touchCardField === 'word') {
        card.word = value;
        card.variations = createDefaultVariations(card.id, value);
      }
      if (target.dataset.touchCardField === 'learningGoal') {
        card.learningGoal = value;
      }
      renderTouchCards();
      renderTouchProgressTable();
      renderMatchProgressTable();
      renderMatchingGame();
      renderSentenceGame();
      renderStory();
      void writeTouchSettings();
      return;
    }

    if (target.hasAttribute('data-touch-card-enabled') && card) {
      card.enabled = target.checked;
      if (!enabledTouchCards().some((entry) => entry.id === selectedTouchCardId)) {
        selectedTouchCardId = enabledTouchCards()[0]?.id ?? card.id;
      }
      renderTouchCards();
      renderMatchingGame();
      renderSentenceGame();
      renderStory();
      void writeTouchSettings();
      return;
    }

    if (target.hasAttribute('data-touch-card-image') && card && target.files?.[0]) {
      void handleTouchCardImageUpload(card, target.files[0]);
    }
  });

  document.querySelectorAll<HTMLButtonElement>('[data-track-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.hasAttribute('data-peekaboo-toggle')) {
        handlePeekabooToggle(button);
        return;
      }

      const action = button.dataset.trackAction ?? 'action';
      showActionCue(button, action);
      trackAction(action, button);
    });
  });

  document.querySelector<HTMLButtonElement>('[data-sleep-toggle]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    void toggleSleepMusic(event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined);
  });

  const sleepSurface = document.querySelector<HTMLElement>('[data-sleep-surface]');
  sleepSurface?.addEventListener('click', (event) => {
    const clickedToggle = event.target instanceof HTMLElement && Boolean(event.target.closest('[data-sleep-toggle]'));
    if (!sleepMusicRunning || clickedToggle || childLockSettings.enabled) {
      return;
    }
    void stopSleepMusic();
  });
  sleepSurface?.addEventListener('pointerdown', () => {
    if (childLockSettings.enabled) {
      startSleepLongPressStop();
    }
  });
  sleepSurface?.addEventListener('pointerup', clearSleepLongPressStop);
  sleepSurface?.addEventListener('pointercancel', clearSleepLongPressStop);
  sleepSurface?.addEventListener('pointerleave', clearSleepLongPressStop);

  const parentGestureZone = document.querySelector<HTMLElement>('[data-parent-gesture-zone]');
  parentGestureZone?.addEventListener('pointerdown', (event) => {
    parentGestureZone.setPointerCapture(event.pointerId);
    handleParentGesturePointerDown(event);
  });
  parentGestureZone?.addEventListener('pointermove', (event) => {
    handleParentGesturePointerMove(event);
  });
  parentGestureZone?.addEventListener('pointerup', (event) => {
    handleParentGesturePointerUp(event);
  });
  parentGestureZone?.addEventListener('pointercancel', resetParentGesture);
  parentGestureZone?.addEventListener('pointerleave', (event) => {
    handleParentGesturePointerMove(event);
    if (!parentGestureReadyForPull) {
      resetParentGesture();
    }
  });

  document.querySelector<HTMLInputElement>('[data-child-lock-enabled]')?.addEventListener('change', (event) => {
    const input = event.currentTarget as HTMLInputElement;
    childLockSettings = { ...childLockSettings, enabled: input.checked };
    writeChildLockSettings(childLockSettings);
    syncChildLockMode();
  });

  document.querySelector<HTMLInputElement>('[data-child-lock-awake]')?.addEventListener('change', (event) => {
    const input = event.currentTarget as HTMLInputElement;
    childLockSettings = { ...childLockSettings, keepAwake: input.checked };
    writeChildLockSettings(childLockSettings);
    syncChildLockMode();
  });

  document.querySelector<HTMLElement>('[data-parent-gesture-save]')?.addEventListener('click', () => {
    const tapsInput = document.querySelector<HTMLInputElement>('[data-parent-gesture-taps]');
    const pullInput = document.querySelector<HTMLInputElement>('[data-parent-gesture-pull]');
    const parentTapCount = Math.min(6, Math.max(2, Number(tapsInput?.value ?? childLockSettings.parentTapCount)));
    const parentPullDistance = Math.min(180, Math.max(40, Number(pullInput?.value ?? childLockSettings.parentPullDistance)));
    childLockSettings = { ...childLockSettings, parentTapCount, parentPullDistance };
    writeChildLockSettings(childLockSettings);
    resetParentGesture();
    renderChildLockSettings();
  });

  document.querySelector<HTMLElement>('[data-parent-secret-accept]')?.addEventListener('click', acceptParentSecretIntro);

  document.querySelector<HTMLElement>('[data-mirror-plan-save]')?.addEventListener('click', () => {
    const preset = document.querySelector<HTMLSelectElement>('[data-mirror-plan-preset]')?.value;
    mirrorPlanSettings = normalizeMirrorPlan({ preset });
    mirrorExerciseIndex = 0;
    writeMirrorPlanSettings();
    renderMvpModuleSettings();
    const status = document.querySelector<HTMLElement>('[data-module-settings-status]');
    if (status) {
      status.textContent = 'Ayna egzersiz sırası kaydedildi.';
    }
  });

  document.querySelector<HTMLElement>('[data-sleep-settings-save]')?.addEventListener('click', () => {
    const sound = document.querySelector<HTMLSelectElement>('[data-sleep-sound-setting]')?.value;
    const durationMinutes = Number(document.querySelector<HTMLSelectElement>('[data-sleep-duration-setting]')?.value);
    const volume = Number(document.querySelector<HTMLInputElement>('[data-sleep-volume]')?.value) / 100;
    sleepSettings = normalizeSleepSettings({ sound, durationMinutes, volume });
    writeSleepSettings();
    renderMvpModuleSettings();
    renderSleepMode();
    const status = document.querySelector<HTMLElement>('[data-module-settings-status]');
    if (status) {
      status.textContent = 'Uyku sesi ve süresi kaydedildi.';
    }
  });

  document.addEventListener('visibilitychange', () => {
    void syncScreenWakeLock();
  });

  window.addEventListener('online', () => {
    void renderDeviceStatus();
  });
  window.addEventListener('offline', () => {
    void renderDeviceStatus();
  });

  PRIMARY_VIEWS.forEach((view) => {
    document.querySelector<HTMLButtonElement>(`.bottom-nav button[data-view="${view}"]`)?.classList.toggle('active', false);
  });

  preloadPofiParts();
  childLockSettings = readChildLockSettings();
  touchProgress = readTouchProgress();
  touchMastery = readTouchMastery();
  matchProgress = readMatchProgress();
  mirrorPlanSettings = readMirrorPlanSettings();
  sleepSettings = readSleepSettings();
  sentenceProgress = readSentenceProgress();
  publishTouchMasteryForMatching();
  renderPofiAvatars();
  syncChildLockMode();
  showParentSecretIntroIfNeeded();
  renderParentMetrics();
  void renderDeviceStatus();
  renderTouchProgressTable();
  renderMatchProgressTable();
  renderMvpModuleSettings();
  renderMatchingGame();
  renderSentenceGame();
  renderStory();
  renderTouchCards();
  void initializeTouchSettings().then(() => preloadTouchAudio());
  registerServiceWorker();
}

if (typeof document !== 'undefined') {
  boot();
}
