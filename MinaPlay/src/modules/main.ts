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
  DEFAULT_MODULE_VISIBILITY,
  DEFAULT_MIRROR_PLAN,
  DEFAULT_POFI_GUIDE_SETTINGS,
  DEFAULT_SLEEP_SETTINGS,
  MIRROR_PLAN_KEY,
  MODULE_VISIBILITY_KEY,
  MVP_MODULE_IDS,
  POFI_GUIDE_SETTINGS_KEY,
  SLEEP_SETTINGS_KEY,
  mirrorExerciseOrder,
  normalizeModuleVisibility,
  normalizeMirrorPlan,
  normalizePofiGuideSettings,
  normalizeSleepSettings,
  pofiGuideDelay,
  type ModuleVisibilitySettings,
  type MirrorPlanSettings,
  type MvpModuleId,
  type PofiGuideSettings,
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
import {
  POFI_CONTRACTS,
  POFI_SUPPORT_LABELS,
  POFI_SUPPORT_TYPES,
  createInitialPofiSupportTypes,
  type PofiContract,
  type PofiSupportType
} from './pofi-contracts.js';
import {
  createMediaVaultBackup,
  isEncryptedMediaVaultPayload,
  mediaVaultBackupFileName,
  parseMediaVaultBackup,
  type EncryptedMediaVaultPayload
} from './media-vault-backup.js';

declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        MinaPlayKiosk?: {
          setChildLockActive?: (options: { active: boolean }) => Promise<{ active?: boolean }>;
          keepFullscreen?: () => Promise<void>;
          dismissInput?: () => Promise<void>;
          speak?: (options: { text: string; rate: number; pitch: number; volume: number }) => Promise<{ spoken?: boolean }>;
          downloadAndInstallUpdate?: (options: { url: string }) => Promise<{ status?: 'permission_required' | 'installer_opened' }>;
        };
      };
    };
    MinaPlayAndroid?: {
      setChildLockActive?: (active: boolean) => void;
      keepFullscreen?: () => void;
    };
  }
}

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
  | 'mirrorOpenMouth'
  | 'mirrorSmile'
  | 'mirrorPucker'
  | 'mirrorTeeth'
  | 'mirrorSoundA'
  | 'mirrorSoundO'
  | 'mirrorClosedMouth'
  | 'mirrorSurprise'
  | 'mirrorSuccess'
  | 'tryAgain';
type PofiMood = PofiState | 'attention' | 'blink' | 'settle' | 'sleepBlink';
type PofiParts = { body: string; eyes: string; mouth: string; hands?: string; eyebrows?: string; effect?: string };
type PofiPartFolder = 'body' | 'eyes' | 'mouth' | 'hands' | 'eyebrows' | 'effects';
type PofiRole = 'welcome' | 'idle' | 'guide' | 'attention' | 'model' | 'affirm' | 'celebrate' | 'softRedirect' | 'sleep' | 'play' | 'wait';
type PeekabooState = 'ready' | 'cover' | 'reveal' | 'celebrate';
type PeekabooCelebration = 'sparkle' | 'pop' | 'halo' | 'confetti' | 'bounce' | 'big';
type PeekabooMotion = 'float' | 'swoop' | 'peek';
type TouchPofiMotion = 'idle' | 'focus' | 'listen' | 'speak' | 'affirm' | 'reassure';
type MatchPofiMotion = 'focus' | 'model' | 'listen' | 'guide' | 'affirm' | 'reassure';


interface PofiExpression {
  role: PofiRole;
  parts: PofiParts;
}

interface ModuleStats {
  opens: number;
  actions: number;
  correct: number;
  softRedirects: number;
  pofiSupportTypes?: Record<PofiSupportType, number>;
  pofiSupportTargets?: Record<string, PofiSupportTargetStats>;
  pofiFatigueEvents?: number;
}

interface PofiSupportTargetStats {
  label: string;
  total: number;
  repeatSignals: number;
  supportTypes: Record<PofiSupportType, number>;
}

interface PofiActionContext {
  targetId?: string;
  targetLabel?: string;
  supportType?: PofiSupportType;
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

interface ParentInsight {
  title: string;
  note: string;
  focusLabel: string;
  stageLabel: string;
  comprehensionLabel: string;
  planTitle: string;
  steps: [string, string, string];
}

interface ParentTodaySummary {
  modules: ParentModuleSummary[];
  supportSummary: string;
  supportTypeSummary: string[];
  supportDetailSummary: string[];
  detailAnalysis: ParentDetailAnalysis;
  fatigueSummary: string;
  independenceRate: number;
  supportRate: number;
  learnedWords: string[];
  recommendedWords: ParentWordRecommendation[];
  plan: string[];
}

interface ParentModuleSummary {
  label: string;
  opens: number;
  actions: number;
  independent: number;
  supported: number;
  supportTypes: Record<PofiSupportType, number>;
  topSupportTarget?: PofiSupportTargetStats;
  activityRate: number;
}

interface ParentWordRecommendation {
  label: string;
  level: string;
  reason: string;
  priority: number;
}

interface ParentDetailAnalysis {
  focusLabel: string;
  priorityLabel: string;
  reason: string;
  nextMode: string;
  supportRhythm: string;
  watchNote: string;
  rows: Array<{ label: string; value: string; note: string }>;
}

interface TouchVoiceVariation {
  id: string;
  label: string;
  text: string;
  rhythm: string;
}

type TouchSoundIntent = 'pofi' | 'word' | 'repeat';
type TouchSoundSource = 'user' | 'default';
type TouchRepeatStyle = 'gentle' | 'melodic' | 'playful';

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
  focusCardId: string;
  style: TouchRepeatStyle;
  maxDurationSeconds: number;
  maxRepeats: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  resourceUrl: string;
  note: string;
  useParentAudio: boolean;
}

interface TouchRepeatMediaEntry {
  externalUrl: string;
  audioDataUrl: string;
  audioMimeType: string;
  audioUpdatedAt: string;
  videoDataUrl: string;
  videoMimeType: string;
  videoUpdatedAt: string;
}

type TouchRepeatMediaLibrary = Record<string, TouchRepeatMediaEntry>;
type TouchRepeatMediaKind = 'audio' | 'video';

type EncryptedTouchRepeatMediaVault = EncryptedMediaVaultPayload;

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
type MirrorExerciseId = 'open-mouth' | 'smile' | 'pucker' | 'teeth' | 'sound-a' | 'sound-o' | 'closed-mouth' | 'surprised-face';

type StoryState = 'idle' | 'attention' | 'narration' | 'interaction' | 'waiting' | 'success' | 'continue' | 'closure';
type StoryStepKind = 'attention' | 'narration' | 'interaction' | 'repeat' | 'closure';
type StoryEffect = 'sparkle' | 'water' | 'chime' | 'step' | 'warm' | 'sleep' | 'pop';
type ChildLockSettings = {
  enabled: boolean;
  keepAwake: boolean;
  parentTapCount: number;
  parentPullDistance: number;
  introSeen: boolean;
  parentPin: string;
};
type ChildProfile = { name: string };
type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener: (type: 'release', listener: () => void) => void };
type NavigatorWithWakeLock = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

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
  actionImage?: string;
  actionAlt?: string;
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
const MODULE_VISIBILITY_LABELS: Record<MvpModuleId, string> = {
  touch: 'Dokun',
  match: 'Eşleme',
  sentence: 'İfade',
  story: 'Hikaye',
  mirror: 'Ayna',
  sleep: 'Uyku',
  peekaboo: 'Ceee'
};

const POFI_PARTS_ROOT = '/assets/pofi/parts';
const TOUCH_ACTIVE_MS = 900;
const MATCH_ATTENTION_MS = 950;
const MATCH_TARGETING_MS = 1200;
const MATCH_WAITING_MS = 12_000;
const MATCH_HINT_STEP_MS = 12_000;
const MATCH_SUCCESS_MS = 1100;
const MATCH_RETRY_MS = 1600;
const MATCH_POFI_MIN_HOLD_MS = 820;
const MATCH_FATIGUE_WRONG_STREAK = 2;
const PEEKABOO_IDLE_MS = 900;
const PEEKABOO_CALM_IDLE_MIN_MS = 4200;
const PEEKABOO_CALM_IDLE_MAX_MS = 6200;
const PEEKABOO_CALM_EVERY = 3;
const PEEKABOO_COVER_MIN_MS = 2200;
const PEEKABOO_COVER_MAX_MS = 3400;
const PEEKABOO_REVEAL_MS = 850;
const PEEKABOO_CELEBRATE_MS = 1050;
const PEEKABOO_SEARCH_TEMPLATES = [
  () => 'Neredesin?',
  () => 'Haniymiş?',
  () => 'Seni bulabilecek miyim?',
  () => 'Nereye saklandın?'
] as const;
const PEEKABOO_MOTIONS: PeekabooMotion[] = ['float', 'swoop', 'peek'];
const PEEKABOO_CELEBRATIONS: PeekabooCelebration[] = ['sparkle', 'pop', 'halo', 'confetti', 'bounce'];
const PEEKABOO_BIG_CELEBRATION_EVERY = 6;
const SLEEP_RECORDED_TRACKS: Partial<Record<SleepSettings['sound'], string>> = {
  'sleep-besik': '/sounds/sleep/Beşik Başında (Sade Ninni).m4a',
  'sleep-bulut': '/sounds/sleep/Bulutların Üzerinde Uyku.m4a',
  'sleep-dunya': '/sounds/sleep/Dünya Biraz Dursun.m4a',
  'sleep-esek': '/sounds/sleep/Eşek senin ağzınla.m4a',
  'sleep-gul': '/sounds/sleep/Gül Kokulu Ninni.m4a',
  'sleep-derin': '/sounds/sleep/Pofi ile Derin Uyku.m4a',
  'sleep-pofi-vocal-v2': "/sounds/sleep/Pofi'nin Ninnisi (Vokalli) - Versiyon 2.mp4",
  'sleep-pofi-vocal': "/sounds/sleep/Pofi'nin Ninnisi (Vokalli).mp4",
  'sleep-pofi-pis-pis-vocal': "/sounds/sleep/Pofi'nin Pış Pış Ninnisi (Vokalli).m4a",
  'sleep-pofi-pisss': "/sounds/sleep/Pofi'nin Pışşş Ninnisi .m4a",
  'sleep-ambient': "/sounds/sleep/Pofi'nin Uyku Frekansı (Ambient).m4a",
  'sleep-ambient-v2': "/sounds/sleep/Pofi'nin Uyku Frekansı - Versiyon 2.m4a",
  'sleep-pis-pis-hipnotik': '/sounds/sleep/Pış Pış (Hipnotik Ninni).m4a',
  'sleep-yum-gozlerini': '/sounds/sleep/Yum Gözlerini Canım Bebeğim.m4a'
};
const SLEEP_RECORDED_SEQUENCE = [
  SLEEP_RECORDED_TRACKS['sleep-besik'],
  SLEEP_RECORDED_TRACKS['sleep-bulut'],
  SLEEP_RECORDED_TRACKS['sleep-dunya'],
  SLEEP_RECORDED_TRACKS['sleep-gul'],
  SLEEP_RECORDED_TRACKS['sleep-derin'],
  SLEEP_RECORDED_TRACKS['sleep-pofi-vocal-v2'],
  SLEEP_RECORDED_TRACKS['sleep-pofi-vocal'],
  SLEEP_RECORDED_TRACKS['sleep-pofi-pis-pis-vocal'],
  SLEEP_RECORDED_TRACKS['sleep-pofi-pisss'],
  SLEEP_RECORDED_TRACKS['sleep-ambient'],
  SLEEP_RECORDED_TRACKS['sleep-ambient-v2'],
  SLEEP_RECORDED_TRACKS['sleep-pis-pis-hipnotik'],
  SLEEP_RECORDED_TRACKS['sleep-yum-gozlerini'],
  SLEEP_RECORDED_TRACKS['sleep-esek']
].filter((src): src is string => Boolean(src));
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
const TOUCH_REPEAT_MEDIA_KEY = 'minaplay_touch_repeat_media_v1';
const CHILD_LOCK_SETTINGS_KEY = 'minaplay_child_lock_settings_v1';
const CHILD_PROFILE_KEY = 'minaplay_child_profile_v1';
const PARENT_GESTURE_ZONE_PX = 160;
const DEFAULT_PARENT_PIN = '2468';
const TOUCH_DB_NAME = 'minaplay_touch_cards_v1';
const TOUCH_DB_STORE = 'touchSettings';
const TOUCH_DB_VERSION = 1;
const TOUCH_MAX_GIF_BYTES = 3_200_000;
const TOUCH_MAX_IMAGE_EDGE = 720;
const TOUCH_SETTINGS_STORAGE_WARNING_BYTES = 4_500_000;
const TOUCH_REPEAT_AUDIO_MAX_MS = 10_000;
const TOUCH_REPEAT_VIDEO_MAX_MS = 12_000;
const TOUCH_REPEAT_MEDIA_BACKUP_MAX_BYTES = 128 * 1024 * 1024;
const TOUCH_REPEAT_MEDIA_VAULT_VERSION = 1;
const TOUCH_REPEAT_MEDIA_KDF_ITERATIONS = 180_000;
const TOUCH_DEFAULT_LEARNING_GOALS: Record<string, string> = {
  su: 'ihtiyaç ifade etme',
  baba: 'yakın kişiyi tanıma',
  top: 'oyun başlatma',
  araba: 'nesne ve hareket ilişkisi',
  elma: 'istek ve seçim belirtme',
  anne: 'yakın kişiyi tanıma',
  bebek: 'yakın kişiyi tanıma',
  kedi: 'canlıyı tanıma',
  kopek: 'canlıyı tanıma',
  mama: 'beslenme ihtiyacını tanıma',
  bardak: 'günlük nesneyi tanıma',
  tabak: 'günlük nesneyi tanıma',
  kasik: 'günlük nesneyi tanıma',
  yatak: 'uyku rutini nesnesini tanıma',
  tuvalet: 'öz bakım ihtiyacını tanıma',
  mont: 'giyinme nesnesini tanıma',
  ayakkabi: 'giyinme nesnesini tanıma',
  corap: 'giyinme nesnesini tanıma',
  pantolon: 'giyinme nesnesini tanıma',
  sapka: 'giyinme nesnesini tanıma',
  gozluk: 'aksesuarı tanıma',
  canta: 'günlük nesneyi tanıma',
  kitap: 'öğrenme nesnesini tanıma',
  kalem: 'öğrenme nesnesini tanıma',
  telefon: 'günlük nesneyi tanıma',
  kapi: 'ev nesnesini tanıma',
  pencere: 'ev nesnesini tanıma',
  anahtar: 'ev nesnesini tanıma',
  kilit: 'ev nesnesini tanıma',
  masa: 'ev nesnesini tanıma',
  sandalye: 'ev nesnesini tanıma',
  lamba: 'ev nesnesini tanıma',
  oyuncak: 'oyun nesnesini tanıma'
};
const OBJECT_ASSET_ROOT = '/assets/cards/objects';
const PEOPLE_ASSET_ROOT = '/assets/cards/people';
const ACTION_ASSET_ROOT = '/assets/cards/actions';
const TOUCH_OBJECT_ASSETS: Record<string, string> = {
  su: `${OBJECT_ASSET_ROOT}/water.png`,
  baba: `${PEOPLE_ASSET_ROOT}/dad.png`,
  top: `${OBJECT_ASSET_ROOT}/ball.png`,
  araba: `${OBJECT_ASSET_ROOT}/car.png`,
  elma: `${OBJECT_ASSET_ROOT}/apple.png`,
  anne: `${PEOPLE_ASSET_ROOT}/mom.png`,
  bebek: `${PEOPLE_ASSET_ROOT}/baby.png`,
  kedi: `${OBJECT_ASSET_ROOT}/cat.png`,
  kopek: `${OBJECT_ASSET_ROOT}/dog.png`,
  mama: `${OBJECT_ASSET_ROOT}/mama.png`,
  bardak: `${OBJECT_ASSET_ROOT}/glass.png`,
  tabak: `${OBJECT_ASSET_ROOT}/plate.png`,
  kasik: `${OBJECT_ASSET_ROOT}/spoon.png`,
  yatak: `${OBJECT_ASSET_ROOT}/bed.png`,
  tuvalet: `${OBJECT_ASSET_ROOT}/toilet.png`,
  mont: `${OBJECT_ASSET_ROOT}/coat.png`,
  ayakkabi: `${OBJECT_ASSET_ROOT}/shoes.png`,
  corap: `${OBJECT_ASSET_ROOT}/socks.png`,
  pantolon: `${OBJECT_ASSET_ROOT}/pants.png`,
  sapka: `${OBJECT_ASSET_ROOT}/hat.png`,
  gozluk: `${OBJECT_ASSET_ROOT}/glasses.png`,
  canta: `${OBJECT_ASSET_ROOT}/bag.png`,
  kitap: `${OBJECT_ASSET_ROOT}/book.png`,
  kalem: `${OBJECT_ASSET_ROOT}/pencil.png`,
  telefon: `${OBJECT_ASSET_ROOT}/phone.png`,
  kapi: `${OBJECT_ASSET_ROOT}/door.png`,
  pencere: `${OBJECT_ASSET_ROOT}/window.png`,
  anahtar: `${OBJECT_ASSET_ROOT}/key.png`,
  kilit: `${OBJECT_ASSET_ROOT}/lock.png`,
  masa: `${OBJECT_ASSET_ROOT}/table.png`,
  sandalye: `${OBJECT_ASSET_ROOT}/chair.png`,
  lamba: `${OBJECT_ASSET_ROOT}/lamp.png`,
  oyuncak: `${OBJECT_ASSET_ROOT}/toy.png`
};
const TOUCH_DEFAULT_REPEAT_SETTINGS: TouchRepeatSettings = {
  enabled: false,
  focusCardId: 'baba',
  style: 'melodic',
  maxDurationSeconds: 30,
  maxRepeats: 8,
  minIntervalMs: 1800,
  maxIntervalMs: 3200,
  resourceUrl: '',
  note: '',
  useParentAudio: false
};

const DEFAULT_TOUCH_CARDS: TouchCard[] = [
  createDefaultTouchCard('su', 'Su', 'Su', 0),
  createDefaultTouchCard('baba', 'Baba', 'Baba', 1),
  createDefaultTouchCard('top', 'Top', 'Top', 2),
  createDefaultTouchCard('araba', 'Araba', 'Araba', 3),
  createDefaultTouchCard('elma', 'Elma', 'Elma', 4),
  createDefaultTouchCard('anne', 'Anne', 'Anne', 5),
  createDefaultTouchCard('bebek', 'Bebek', 'Bebek', 6),
  createDefaultTouchCard('kedi', 'Kedi', 'Kedi', 7),
  createDefaultTouchCard('kopek', 'Köpek', 'Köpek', 8),
  createDefaultTouchCard('mama', 'Mama', 'Mama', 9),
  createDefaultTouchCard('bardak', 'Bardak', 'Bardak', 10),
  createDefaultTouchCard('tabak', 'Tabak', 'Tabak', 11),
  createDefaultTouchCard('kasik', 'Kaşık', 'Kaşık', 12),
  createDefaultTouchCard('yatak', 'Yatak', 'Yatak', 13),
  createDefaultTouchCard('tuvalet', 'Tuvalet', 'Tuvalet', 14),
  createDefaultTouchCard('mont', 'Mont', 'Mont', 15),
  createDefaultTouchCard('ayakkabi', 'Ayakkabı', 'Ayakkabı', 16),
  createDefaultTouchCard('corap', 'Çorap', 'Çorap', 17),
  createDefaultTouchCard('pantolon', 'Pantolon', 'Pantolon', 18),
  createDefaultTouchCard('sapka', 'Şapka', 'Şapka', 19),
  createDefaultTouchCard('gozluk', 'Gözlük', 'Gözlük', 20),
  createDefaultTouchCard('canta', 'Çanta', 'Çanta', 21),
  createDefaultTouchCard('kitap', 'Kitap', 'Kitap', 22),
  createDefaultTouchCard('kalem', 'Kalem', 'Kalem', 23),
  createDefaultTouchCard('telefon', 'Telefon', 'Telefon', 24),
  createDefaultTouchCard('kapi', 'Kapı', 'Kapı', 25),
  createDefaultTouchCard('pencere', 'Pencere', 'Pencere', 26),
  createDefaultTouchCard('anahtar', 'Anahtar', 'Anahtar', 27),
  createDefaultTouchCard('kilit', 'Kilit', 'Kilit', 28),
  createDefaultTouchCard('masa', 'Masa', 'Masa', 29),
  createDefaultTouchCard('sandalye', 'Sandalye', 'Sandalye', 30),
  createDefaultTouchCard('lamba', 'Lamba', 'Lamba', 31),
  createDefaultTouchCard('oyuncak', 'Oyuncak', 'Oyuncak', 32)
];

const MIRROR_EXERCISES: MirrorExercise[] = [
  { id: 'open-mouth', command: 'Ağzını aç', success: 'Harika', pofiState: 'mirrorOpenMouth', durationMs: 3900, level: 1 },
  { id: 'smile', command: 'Gülümse', success: 'Çok güzel', pofiState: 'mirrorSmile', durationMs: 3600, level: 1 },
  { id: 'pucker', command: 'Dudaklarını büz', success: 'Harika', pofiState: 'mirrorPucker', durationMs: 3900, level: 1 },
  { id: 'sound-a', command: 'A sesi yap', success: 'Çok güzel', pofiState: 'mirrorSoundA', durationMs: 3900, level: 1 },
  { id: 'sound-o', command: 'O sesi yap', success: 'Harika', pofiState: 'mirrorSoundO', durationMs: 3900, level: 1 },
  { id: 'closed-mouth', command: 'Dudaklarını kapat', success: 'Çok güzel', pofiState: 'mirrorClosedMouth', durationMs: 3600, level: 1 },
  { id: 'teeth', command: 'Dişlerini göster', success: 'Harika', pofiState: 'mirrorTeeth', durationMs: 4200, level: 2 },
  { id: 'surprised-face', command: 'Şaşırmış yüz yap', success: 'Çok güzel', pofiState: 'mirrorSurprise', durationMs: 3900, level: 2 }
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
        image: '/assets/cards/sentences/water-request.png',
        alt: 'Su isteyen çocuk ve su bardağı'
      },
      {
        id: 'water-drink-child',
        context: 'Su içelim.',
        detail: 'su içen çocuk',
        cue: 'water',
        image: '/assets/cards/sentences/water-drink.png',
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
        image: '/assets/cards/sentences/food-request.png',
        alt: 'Yemek isteyen çocuk ve yemek tabağı'
      },
      {
        id: 'food-eat-child',
        context: 'Yemek yiyelim.',
        detail: 'yemek yiyen çocuk',
        cue: 'food',
        image: '/assets/cards/sentences/food-eat.png',
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
        image: '/assets/cards/sentences/toilet-need.png',
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
        image: '/assets/cards/sentences/sleepy-child.png',
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
        image: '/assets/cards/sentences/pain-child.png',
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
        image: '/assets/cards/sentences/cold-child.png',
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
        image: '/assets/cards/sentences/hot-child.png',
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
        image: '/assets/cards/sentences/mother-come.png',
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
        image: '/assets/cards/sentences/father-come.png',
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
        image: '/assets/cards/sentences/help-child.png',
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
        image: '/assets/cards/sentences/walk-request.png',
        alt: 'Gezmek isteyen çocuk'
      }
    ]
  }
];

const SENTENCE_RECORDED_SPEECH: Record<string, string> = {
  'su istiyorum': '/sounds/sentence/su-istiyorum.wav',
  'su içelim': '/sounds/sentence/su-icelim.wav',
  'yemek istiyorum': '/sounds/sentence/yemek-istiyorum.wav',
  'yemek yiyelim': '/sounds/sentence/yemek-yiyelim.wav',
  tuvalet: '/sounds/sentence/tuvalet.wav',
  'uykum var': '/sounds/sentence/uykum-var.wav',
  acıdı: '/sounds/sentence/acidi.wav',
  üşüdüm: '/sounds/sentence/usudum.wav',
  'sıcak oldu': '/sounds/sentence/sicak-oldu.wav',
  'anne gel': '/sounds/sentence/anne-gel.wav',
  'baba gel': '/sounds/sentence/baba-gel.wav',
  'yardım et': '/sounds/sentence/yardim-et.wav',
  'gezmek istiyorum': '/sounds/sentence/gezmek-istiyorum.wav',
  'hadi söyle': '/sounds/sentence/hadi-soyle.wav',
  'bir daha bakalım': '/sounds/sentence/bir-daha-bakalim.wav'
};

const STORY_LIBRARY: StoryDefinition[] = [
  {
    id: 'water-little-cloud',
    title: 'Küçük Su Molası',
    theme: 'need',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/cards/sentences/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'child-thirsty', kind: 'narration', text: 'Çocuk susadı', sceneImage: '/assets/cards/sentences/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'water' },
      { id: 'water-request', kind: 'narration', text: 'Su istiyorum', sceneImage: '/assets/cards/sentences/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'chime' },
      {
        id: 'what-needed',
        kind: 'interaction',
        text: 'Ne istiyor?',
        sceneImage: '/assets/cards/sentences/water-request.png',
        sceneAlt: 'Su isteyen çocuk',
        effect: 'water',
        successText: 'Evet. Su istiyorum.',
        fallbackText: 'Su istiyorum.',
        choices: [
          { id: 'su', label: 'Su', correct: true, symbol: '✓', image: '/assets/cards/sentences/water-drink.png', alt: 'Su içen çocuk' },
          { id: 'yemek', label: 'Yemek', correct: false, symbol: '•', image: '/assets/cards/sentences/food-request.png', alt: 'Yemek isteyen çocuk' }
        ]
      },
      { id: 'water-drink', kind: 'narration', text: 'Su içti', sceneImage: '/assets/cards/sentences/water-drink.png', sceneAlt: 'Su içen çocuk', effect: 'water' },
      { id: 'repeat-water', kind: 'repeat', text: 'Hadi söyle. Su istiyorum', sceneImage: '/assets/cards/sentences/water-request.png', sceneAlt: 'Su isteyen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'done', kind: 'closure', text: 'Oh, iyi oldu', sceneImage: '/assets/cards/sentences/water-drink.png', sceneAlt: 'Su içen çocuk', effect: 'sparkle' }
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
      { id: 'baba-comes', kind: 'narration', text: 'Baba geldi', cardIds: ['baba'], actionImage: `${ACTION_ASSET_ROOT}/come.png`, actionAlt: 'Gelme eylemi', effect: 'step' },
      {
        id: 'who-throws',
        kind: 'interaction',
        text: 'Topu kim atacak?',
        cardIds: ['top'],
        actionImage: `${ACTION_ASSET_ROOT}/give.png`,
        actionAlt: 'Topu verme eylemi',
        effect: 'pop',
        successText: 'Evet. Baba top attı.',
        fallbackText: 'Baba top attı.',
        choices: [
          { id: 'baba', cardId: 'baba', correct: true, symbol: '↷', label: 'Baba' },
          { id: 'top', cardId: 'top', correct: false, symbol: '•', label: 'Top' }
        ]
      },
      { id: 'baba-throw', kind: 'narration', text: 'Baba top attı', cardIds: ['baba', 'top'], actionImage: `${ACTION_ASSET_ROOT}/give.png`, actionAlt: 'Top atma eylemi', effect: 'pop' },
      { id: 'repeat', kind: 'repeat', text: 'Hadi söyle. Top attı', cardIds: ['top'], actionImage: `${ACTION_ASSET_ROOT}/say.png`, actionAlt: 'Söyleme eylemi', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'done', kind: 'closure', text: 'Bitti', cardIds: ['top'], actionSymbol: '✓', effect: 'sparkle' }
    ]
  },
  {
    id: 'cold-coat',
    title: 'Mont Giyelim',
    theme: 'comfort',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/cards/sentences/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'cold', kind: 'narration', text: 'Çocuk üşüdü', sceneImage: '/assets/cards/sentences/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'warm' },
      { id: 'say-cold', kind: 'narration', text: 'Üşüdüm', sceneImage: '/assets/cards/sentences/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'chime' },
      {
        id: 'what-say',
        kind: 'interaction',
        text: 'Ne söyleyelim?',
        sceneImage: '/assets/cards/sentences/cold-child.png',
        sceneAlt: 'Üşüyen çocuk',
        effect: 'warm',
        successText: 'Evet. Üşüdüm.',
        fallbackText: 'Üşüdüm.',
        choices: [
          { id: 'cold', label: 'Üşüdüm', correct: true, symbol: '✓', image: '/assets/cards/sentences/cold-child.png', alt: 'Üşüyen çocuk' },
          { id: 'hot', label: 'Sıcak oldu', correct: false, symbol: '•', image: '/assets/cards/sentences/hot-child.png', alt: 'Sıcaklayan çocuk' }
        ]
      },
      { id: 'coat', kind: 'narration', text: 'Mont geldi', sceneImage: '/assets/cards/sentences/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'warm' },
      { id: 'repeat-cold', kind: 'repeat', text: 'Hadi söyle. Üşüdüm', sceneImage: '/assets/cards/sentences/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'warm-done', kind: 'closure', text: 'Şimdi iyi', sceneImage: '/assets/cards/sentences/cold-child.png', sceneAlt: 'Üşüyen çocuk', effect: 'sparkle' }
    ]
  },
  {
    id: 'food-time',
    title: 'Yemek Zamanı',
    theme: 'need',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/cards/sentences/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'hungry', kind: 'narration', text: 'Çocuk acıktı', sceneImage: '/assets/cards/sentences/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'chime' },
      { id: 'food-request', kind: 'narration', text: 'Yemek istiyorum', sceneImage: '/assets/cards/sentences/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'chime' },
      { id: 'food-eat', kind: 'narration', text: 'Yemek geldi', sceneImage: '/assets/cards/sentences/food-eat.png', sceneAlt: 'Yemek yiyen çocuk', effect: 'pop' },
      { id: 'repeat-food', kind: 'repeat', text: 'Hadi söyle. Yemek istiyorum', sceneImage: '/assets/cards/sentences/food-request.png', sceneAlt: 'Yemek isteyen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'done', kind: 'closure', text: 'Afiyet olsun', sceneImage: '/assets/cards/sentences/food-eat.png', sceneAlt: 'Yemek yiyen çocuk', effect: 'sparkle' }
    ]
  },
  {
    id: 'sleep-soft',
    title: 'Uyku Bulutu',
    theme: 'sleep',
    steps: [
      { id: 'look', kind: 'attention', text: 'Bak', sceneImage: '/assets/cards/sentences/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sparkle', pauseMs: STORY_ATTENTION_MS },
      { id: 'sleepy', kind: 'narration', text: 'Uykum var', sceneImage: '/assets/cards/sentences/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' },
      { id: 'soft', kind: 'narration', text: 'Yastık yumuşak', sceneImage: '/assets/cards/sentences/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' },
      { id: 'quiet', kind: 'narration', text: 'Pofi sessiz', sceneImage: '/assets/cards/sentences/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' },
      { id: 'repeat-sleep', kind: 'repeat', text: 'Hadi söyle. Uykum var', sceneImage: '/assets/cards/sentences/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'chime', pauseMs: STORY_REPEAT_MS },
      { id: 'good-night', kind: 'closure', text: 'İyi uykular', sceneImage: '/assets/cards/sentences/sleepy-child.png', sceneAlt: 'Uykusu gelen çocuk', effect: 'sleep' }
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
      mouth: 'open-smile-soft-v01.png',
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
  mirrorSmile: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
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
  mirrorSoundA: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'sound-a-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorSoundO: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'wide-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'sound-o-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorClosedMouth: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'closed-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  mirrorSurprise: {
    role: 'model',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'surprised-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'open-o-v01.png',
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
      eyes: 'closed-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'closed-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  sleepReady: {
    role: 'sleep',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'half-open-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'closed-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  peekaboo: {
    role: 'play',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'happy-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
      effect: POFI_WARMTH_EFFECT
    }
  },
  peekabooHidden: {
    role: 'play',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'closed-soft-v01.png',
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'smile-v01.png',
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
      eyebrows: POFI_HAPPY_EYEBROWS,
      mouth: 'closed-v01.png',
      effect: POFI_WARMTH_EFFECT
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
const pofiRenderTokens = new WeakMap<HTMLElement, number>();
const pofiAssetLoads = new Map<string, Promise<void>>();
let peekabooState: PeekabooState = 'ready';
let peekabooReturnTimer: number | undefined;
let peekabooAutoTimer: number | undefined;
let peekabooSearchPhraseIndex = -1;
let peekabooCelebrationIndex = -1;
let peekabooCelebrationCount = 0;
let peekabooCelebration: PeekabooCelebration = 'sparkle';
let peekabooMotionIndex = 0;
let peekabooMotion: PeekabooMotion = 'float';
let peekabooAutoCycleCount = 0;
let peekabooSearchAudioCount = 0;
let peekabooRevealAudioCount = 0;
let childProfile: ChildProfile = { name: 'Mina' };
let appPermissionSettings = { camera: true, microphone: true };
let touchRepeatTimer: number | undefined;
let touchActiveTimer: number | undefined;
let touchAffirmTimer: number | undefined;
let touchIdleRecoveryTimer: number | undefined;
let touchAffirmUntil = 0;
let touchVariationIndex = 0;
let touchAudioUnlocked = false;
let touchAudioPools: Record<string, HTMLAudioElement[]> = {};
let touchAudioPoolLoads: Record<string, Promise<HTMLAudioElement[]>> = {};
let currentTouchAudio: HTMLAudioElement | undefined;
let lastTouchAudioSrc: string | undefined;
let voiceQueue: Promise<void> = Promise.resolve();
let voiceQueueEpoch = 0;
let lastTouchVariationId: string | undefined;
let touchSettings: TouchSettingsState = cloneDefaultTouchSettings();
let touchRepeatMediaLibrary: TouchRepeatMediaLibrary = {};
let touchRepeatPendingPlainMediaLibrary: TouchRepeatMediaLibrary = {};
let touchRepeatMediaVaultKey: CryptoKey | undefined;
let touchRepeatMediaVaultSalt = '';
let touchRepeatMediaVaultExists = false;
let touchRepeatRecorder:
  | {
      cardId: string;
      kind: TouchRepeatMediaKind;
      recorder: MediaRecorder;
      stream: MediaStream;
      chunks: Blob[];
      timeout: number;
    }
  | undefined;
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
let recentMatchTargetIds: string[] = [];
let matchProgress: MatchProgressState = {};
let matchRound: MatchRound | undefined;
let matchTimer: number | undefined;
let matchPofiSettleTimer: number | undefined;
let matchPofiLastChangeAt = 0;
let matchPofiSettledState: PofiState | undefined;
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
let sentenceAudioClips: Record<string, HTMLAudioElement> = {};
let pofiGuideAudioClips: Record<string, HTMLAudioElement> = {};
let pofiGuideManifestPromise: Promise<Record<string, string>> | undefined;
let storyTimer: number | undefined;
let storySession: StorySession | undefined;
let storyCursor = 0;
let sleepAudioContext: AudioContext | undefined;
let sleepAudioElement: HTMLAudioElement | undefined;
let sleepMusicNodes: Array<OscillatorNode | GainNode> = [];
let sleepMelodyTimer: number | undefined;
let sleepAutoStopTimer: number | undefined;
let sleepMusicRunning = false;
let sleepRecordedSequenceIndex = 0;
let sleepRecordedSequenceFailures = 0;
let storyFlowToken = 0;
let mirrorState: MirrorState = 'idle';
let mirrorExerciseIndex = 0;
let mirrorTimer: number | undefined;
let mirrorFlowToken = 0;
let mirrorCameraStream: MediaStream | undefined;
let mirrorCameraRequested = false;
let mirrorPlanSettings: MirrorPlanSettings = { ...DEFAULT_MIRROR_PLAN };
let sleepSettings: SleepSettings = { ...DEFAULT_SLEEP_SETTINGS };
let moduleVisibilitySettings: ModuleVisibilitySettings = { ...DEFAULT_MODULE_VISIBILITY };
let pofiGuideSettings: PofiGuideSettings = { ...DEFAULT_POFI_GUIDE_SETTINGS };
let childLockSettings: ChildLockSettings = {
  enabled: true,
  keepAwake: true,
  parentTapCount: 3,
  parentPullDistance: 80,
  introSeen: false,
  parentPin: DEFAULT_PARENT_PIN
};
let wakeLockSentinel: WakeLockSentinelLike | undefined;
let wakeLockRequestInFlight = false;
let deferredInstallPrompt: BeforeInstallPromptEvent | undefined;
let parentGestureStartY = 0;
let parentGestureStartAt = 0;
let parentGestureReadyForPull = false;

const DEFAULT_STATE: AnalyticsState = {
  sessions: 0,
  repeats: 0,
  modules: {}
};

const APP_VERSION = '1.0.35';
const APP_UPDATE_VERSION = 'MinaPlay APK · 2026-07-17 · v1.0.35';
const APP_UPDATE_APK_URL = 'http://192.168.1.104:3100/downloads/minaplay-latest.apk';
const APP_UPDATE_METADATA_URL = 'http://192.168.1.104:3100/api/update';

export function createInitialModuleStats(): ModuleStats {
  return {
    opens: 0,
    actions: 0,
    correct: 0,
    softRedirects: 0,
    pofiSupportTypes: createInitialPofiSupportTypes(),
    pofiSupportTargets: {},
    pofiFatigueEvents: 0
  };
}

function moduleSupportTypes(stats: ModuleStats): Record<PofiSupportType, number> {
  return {
    ...createInitialPofiSupportTypes(),
    ...(stats.pofiSupportTypes ?? {})
  };
}

function normalizePofiSupportTargetStats(stats: Partial<PofiSupportTargetStats> | undefined, fallbackLabel: string): PofiSupportTargetStats {
  return {
    label: String(stats?.label ?? fallbackLabel),
    total: Number(stats?.total ?? 0),
    repeatSignals: Number(stats?.repeatSignals ?? 0),
    supportTypes: {
      ...createInitialPofiSupportTypes(),
      ...(stats?.supportTypes ?? {})
    }
  };
}

function normalizePofiSupportTargets(
  targets: Record<string, Partial<PofiSupportTargetStats>> | undefined
): Record<string, PofiSupportTargetStats> {
  return Object.fromEntries(Object.entries(targets ?? {}).map(([id, stats]) => [id, normalizePofiSupportTargetStats(stats, id)]));
}

function normalizeModuleStats(stats: Partial<ModuleStats> | undefined): ModuleStats {
  return {
    opens: Number(stats?.opens ?? 0),
    actions: Number(stats?.actions ?? 0),
    correct: Number(stats?.correct ?? 0),
    softRedirects: Number(stats?.softRedirects ?? 0),
    pofiSupportTypes: {
      ...createInitialPofiSupportTypes(),
      ...(stats?.pofiSupportTypes ?? {})
    },
    pofiSupportTargets: normalizePofiSupportTargets(stats?.pofiSupportTargets),
    pofiFatigueEvents: Number(stats?.pofiFatigueEvents ?? 0)
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
          value: 'Kısa başlangıç',
          note: 'Bugün için Dokun ya da Eşleme ile iki dakikalık tanıdık bir başlangıç yeterli.'
        }
      : {
          value: parentSessionRhythmLabel(state.sessions),
          note:
            totals.soft > totals.correct && totals.soft > 0
              ? `Bugün Pofi ${totals.soft} kez destek verdi. Süreyi kısa, kartları tanıdık tutun.`
              : `${parentModuleLabel(mostOpenedModule?.[0] ?? 'touch')} bugün en çok açılan alan. İlgi bu yöne dönmüş görünüyor.`
        };

  const repeat =
    supportTarget.score > 0
      ? {
          value: supportTarget.label,
          note: `${supportTarget.reason}. ${supportTarget.label} kelimesini kısa, melodik ve aralıklı tekrar etmek iyi olur.`
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
          note: `${supportTarget.label} için önce Dokun'da dinle-dokun, sonra Eşleme'de bir genelleme turu deneyin.`
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

export function createParentInsight(
  state: AnalyticsState,
  touchState: TouchProgressState = {},
  matchState: MatchProgressState = {},
  labels: Record<string, string> = {}
): ParentInsight {
  const supportTarget = strongestSupportTarget(touchState, matchState, labels);
  const focusId = supportTarget.id || strongestProgressTarget(touchState, matchState, labels) || Object.keys(labels)[0] || 'baba';
  const focusLabel = labels[focusId] ?? focusId;
  const touchEntry = touchState[focusId];
  const matchEntry = matchState[focusId];
  const touchMastered = isMastered(touchEntry);
  const matchMastered = isMatchMastered(matchEntry);
  const attempts = (touchEntry?.success ?? 0) + (touchEntry?.fail ?? 0) + (matchEntry?.success ?? 0) + (matchEntry?.fail ?? 0);
  const successes = (touchEntry?.success ?? 0) + (matchEntry?.success ?? 0);
  const rate = attempts > 0 ? successes / attempts : 0;
  const bestStreak = Math.max(touchEntry?.consecutiveCorrectCount ?? 0, matchEntry?.consecutiveCorrectCount ?? 0);
  const stageLabel =
    matchMastered || (matchEntry?.conceptGeneralizationSuccess ?? 0) >= 2
      ? 'Genelleme'
      : touchMastered
        ? 'Seçimi güçlü'
        : successes > 0
          ? 'Tanıma başladı'
          : state.sessions > 0
            ? 'Duyma ve yönelme'
            : 'Başlangıç';
  const comprehensionLabel =
    matchMastered || touchMastered
      ? 'Yüksek anlaşılma'
      : rate >= 0.65 && bestStreak >= 2
        ? 'Orta-yüksek'
        : supportTarget.score > 0
          ? 'Destekle artıyor'
          : attempts > 0
            ? 'Yeni şekilleniyor'
            : 'Henüz veri yok';
  const title =
    state.sessions === 0
      ? 'Bugün kısa başlangıç yeterli.'
      : supportTarget.score >= 3
        ? `${focusLabel} tekrar ile güçlenir.`
        : matchMastered || touchMastered
          ? `${focusLabel} pekişiyor.`
          : 'Bugün tanıma pratiği önde.';
  const note =
    state.sessions === 0
      ? 'İlk hedef uzun çalışma değil, çocuğun tanıdık iki kartla oyuna sakin girmesi.'
      : supportTarget.score > 0
        ? `${focusLabel} için destek ihtiyacı görülüyor. Bu başarısızlık değil; öğretmen diliyle aynı hedefi kısa, net ve aralıklı sunma ihtiyacıdır.`
        : 'Bugünkü veriler çocuğun tanıdık kartlarla daha rahat ilerlediğini gösteriyor. Yeni kart eklemeden önce kısa pekiştirme iyi olur.';

  return {
    title,
    note,
    focusLabel,
    stageLabel,
    comprehensionLabel,
    planTitle: `${focusLabel} için rehberli 3 dakika`,
    steps: [
      `${focusLabel} kelimesini 4-6 kez aynı yüz ifadesi ve sakin sesle dinletin.`,
      `Sonra Dokun'da ${focusLabel} için tek hedefli kısa bir dinle-dokun turu açın.`,
      touchMastered || matchMastered
        ? `Eşleme'de ${focusLabel} için farklı görselle genelleme deneyin.`
        : 'Zorlanırsa yardım edin, süreyi uzatmayın; olumlu bir denemede kapatın.'
    ]
  };
}

export function createParentTodaySummary(
  state: AnalyticsState,
  touchState: TouchProgressState = {},
  matchState: MatchProgressState = {},
  labels: Record<string, string> = {}
): ParentTodaySummary {
  const modules = Object.entries(state.modules)
    .filter(([, stats]) => stats.opens > 0 || stats.actions > 0)
    .sort((a, b) => b[1].opens + b[1].actions - (a[1].opens + a[1].actions));
  const totals = modules.reduce(
    (acc, [, stats]) => {
      acc.correct += stats.correct;
      acc.soft += stats.softRedirects;
      acc.actions += stats.actions;
      return acc;
    },
    { correct: 0, soft: 0, actions: 0 }
  );
  const moduleSummaries = createParentModuleSummaries(modules);
  const supportTypeSummary = createPofiSupportTypeSummary(modules.map(([, stats]) => stats));
  const supportDetailSummary = createPofiSupportDetailSummary(modules);
  const fatigueSummary = createPofiFatigueSummary(modules.map(([, stats]) => stats));
  const learnedWords = learnedWordLabels(touchState, matchState, labels);
  const recommendedWords = createParentWordRecommendations(touchState, matchState, labels);
  const insight = createParentInsight(state, touchState, matchState, labels);
  const detailAnalysis = createParentDetailAnalysis(state, touchState, matchState, labels);
  const supportFocusLabel = topPofiSupportFocus(modules)?.label ?? insight.focusLabel;
  const attemptTotal = totals.correct + totals.soft;
  const independenceRate = attemptTotal > 0 ? Math.round((totals.correct / attemptTotal) * 100) : 0;
  const supportRate = attemptTotal > 0 ? Math.round((totals.soft / attemptTotal) * 100) : 0;

  return {
    modules: moduleSummaries,
    supportSummary:
      totals.actions > 0 || attemptTotal > 0
        ? `Bugün Pofi ${totals.soft} kez destek verdi; ${supportFocusLabel} kelimesinde tekrar iyi olur. ${independenceRate}% bağımsız deneme, ${supportRate}% destekle deneme.`
        : 'Henüz bağımsız deneme verisi oluşmadı.',
    supportTypeSummary,
    supportDetailSummary,
    detailAnalysis,
    fatigueSummary,
    independenceRate,
    supportRate,
    learnedWords,
    recommendedWords,
    plan: insight.steps
  };
}

export function createParentDetailAnalysis(
  state: AnalyticsState,
  touchState: TouchProgressState = {},
  matchState: MatchProgressState = {},
  labels: Record<string, string> = {}
): ParentDetailAnalysis {
  const modules = Object.entries(state.modules);
  const supportTarget = strongestSupportTarget(touchState, matchState, labels);
  const focusId = supportTarget.id || strongestProgressTarget(touchState, matchState, labels) || Object.keys(labels)[0] || 'baba';
  const focusLabel = labels[focusId] ?? focusId;
  const touch = touchState[focusId];
  const match = matchState[focusId];
  const touchAttempts = (touch?.success ?? 0) + (touch?.fail ?? 0);
  const matchAttempts = (match?.success ?? 0) + (match?.fail ?? 0);
  const repeatNeeds = (touch?.repeatNeeds ?? 0) + (match?.repeatNeeds ?? 0) + supportTarget.score;
  const supportTotal = modules.reduce((sum, [, stats]) => sum + stats.softRedirects, 0);
  const independentTotal = modules.reduce((sum, [, stats]) => sum + stats.correct, 0);
  const fatigueEvents = modules.reduce((sum, [, stats]) => sum + (stats.pofiFatigueEvents ?? 0), 0);
  const touchReady = isMastered(touch);
  const matchReady = isMatchMastered(match) || (match?.conceptGeneralizationSuccess ?? 0) >= 2;
  const priorityLabel =
    repeatNeeds >= 4 || supportTotal > independentTotal
      ? 'Yüksek'
      : repeatNeeds > 0 || touchAttempts + matchAttempts > 0
        ? 'Orta'
        : 'Düşük';
  const nextMode = matchReady
    ? 'Hikaye veya İfade'
    : touchReady
      ? 'Eşleme'
      : 'Dokun';
  const supportRhythm =
    fatigueEvents > 0
      ? 'Destek arası açılmalı'
      : supportTotal > independentTotal && supportTotal > 0
        ? 'Kısa ve aralıklı destek'
        : 'Ritim dengeli';
  const reason =
    supportTarget.score > 0
      ? `${focusLabel} için Pofi desteği ve tekrar sinyali birikmiş.`
      : touchReady || matchReady
        ? `${focusLabel} güçlenmiş; farklı bağlama taşıma zamanı.`
        : `${focusLabel} erken hedef olarak kısa tanıma turuna uygun.`;
  const watchNote =
    priorityLabel === 'Yüksek'
      ? 'Aynı hedefi uzun süre zorlamayın; olumlu bir denemede kapatın.'
      : nextMode === 'Dokun'
        ? 'Önce dinle-dokun güveni kurulsun, sonra seçenek sayısı artsın.'
        : 'Genelleme için aynı kelimeyi farklı görsel veya kısa hikaye içinde deneyin.';

  return {
    focusLabel,
    priorityLabel,
    reason,
    nextMode,
    supportRhythm,
    watchNote,
    rows: [
      { label: 'Odak', value: focusLabel, note: reason },
      { label: 'Öncelik', value: priorityLabel, note: watchNote },
      { label: 'Sıradaki mod', value: nextMode, note: `${focusLabel} için önerilen bir sonraki çalışma alanı.` },
      { label: 'Pofi ritmi', value: supportRhythm, note: createPofiFatigueSummary(modules.map(([, stats]) => stats)) }
    ]
  };
}

function createParentModuleSummaries(modules: Array<[string, ModuleStats]>): ParentModuleSummary[] {
  const maxActivity = Math.max(1, ...modules.map(([, stats]) => stats.opens + stats.actions));
  return modules.length > 0
    ? modules.slice(0, 6).map(([name, stats]) => {
        const supportTypes = moduleSupportTypes(stats);
        return {
          label: parentModuleLabel(name),
          opens: stats.opens,
          actions: stats.actions,
          independent: stats.correct,
          supported: stats.softRedirects,
          supportTypes,
          topSupportTarget: topPofiSupportTarget(stats),
          activityRate: Math.round(((stats.opens + stats.actions) / maxActivity) * 100)
        };
      })
    : [
        {
          label: 'Henüz oyun yok',
          opens: 0,
          actions: 0,
          independent: 0,
          supported: 0,
          supportTypes: createInitialPofiSupportTypes(),
          topSupportTarget: undefined,
          activityRate: 0
        }
      ];
}

function topPofiSupportTarget(stats: ModuleStats): PofiSupportTargetStats | undefined {
  return Object.values(normalizePofiSupportTargets(stats.pofiSupportTargets)).sort((a, b) => b.total - a.total)[0];
}

function topPofiSupportFocus(modules: Array<[string, ModuleStats]>): PofiSupportTargetStats | undefined {
  return modules
    .flatMap(([, stats]) => Object.values(normalizePofiSupportTargets(stats.pofiSupportTargets)))
    .sort((a, b) => b.repeatSignals - a.repeatSignals || b.total - a.total)[0];
}

function createPofiSupportTypeSummary(statsList: ModuleStats[]): string[] {
  const totals = statsList.reduce(
    (acc, stats) => {
      const supportTypes = moduleSupportTypes(stats);
      POFI_SUPPORT_TYPES.forEach((type) => {
        acc[type] += supportTypes[type] ?? 0;
      });
      return acc;
    },
    createInitialPofiSupportTypes()
  );

  const entries = POFI_SUPPORT_TYPES.filter((type) => totals[type] > 0).map((type) => `${POFI_SUPPORT_LABELS[type]} ${totals[type]}`);
  return entries.length > 0 ? entries : ['Henüz Pofi destek izi yok'];
}

function createPofiSupportDetailSummary(modules: Array<[string, ModuleStats]>): string[] {
  const entries = modules.flatMap(([name, stats]) =>
    Object.values(normalizePofiSupportTargets(stats.pofiSupportTargets)).map((target) => {
      const topType = POFI_SUPPORT_TYPES.map((type) => ({ type, count: target.supportTypes[type] ?? 0 })).sort((a, b) => b.count - a.count)[0];
      return {
        moduleLabel: parentModuleLabel(name),
        target,
        topType: topType?.type ?? 'hint',
        topCount: topType?.count ?? 0
      };
    })
  );

  const summary = entries
    .filter((entry) => entry.target.total > 0)
    .sort((a, b) => b.target.repeatSignals - a.target.repeatSignals || b.target.total - a.target.total)
    .slice(0, 4)
    .map((entry) => `${entry.target.label}: ${POFI_SUPPORT_LABELS[entry.topType]} ${entry.topCount} (${entry.moduleLabel})`);

  return summary.length > 0 ? summary : ['Henüz kelime bazlı destek detayı yok'];
}

function createPofiFatigueSummary(statsList: ModuleStats[]): string {
  const fatigueEvents = statsList.reduce((sum, stats) => sum + (stats.pofiFatigueEvents ?? 0), 0);
  return fatigueEvents > 0
    ? `Aynı hedefte ${fatigueEvents} kez sık destek birikti; Pofi arayı açıp daha sakin modelle ilerlemeli.`
    : 'Destek ritmi şu an sakin; sık ve robotik tekrar izi yok.';
}

function createParentWordRecommendations(
  touchState: TouchProgressState,
  matchState: MatchProgressState,
  labels: Record<string, string>
): ParentWordRecommendation[] {
  const ids = new Set([...Object.keys(labels), ...Object.keys(touchState), ...Object.keys(matchState)]);
  const recommendations = [...ids].map((id) => {
    const touch = touchState[id];
    const match = matchState[id];
    const success = (touch?.success ?? 0) + (match?.success ?? 0);
    const fail = (touch?.fail ?? 0) + (match?.fail ?? 0);
    const repeatNeeds = (touch?.repeatNeeds ?? 0) + (match?.repeatNeeds ?? 0);
    const generalization = match?.conceptGeneralizationSuccess ?? 0;
    const mastered = isMastered(touch) || isMatchMastered(match);
    const priority = parentWordBasePriority(id) + repeatNeeds * 4 + fail * 2 + success + (mastered ? -8 : 0);
    const level = parentWordLevel(id);
    const reason =
      repeatNeeds > 0 || fail > 0
        ? 'tekrar ve destek ihtiyacı var'
        : mastered || generalization > 0
          ? 'genelleme için hazır'
          : success > 0
            ? 'tanıma izi başladı'
            : 'erken hedef kelime';
    return {
      label: labels[id] ?? id,
      level,
      reason,
      priority
    };
  });

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
}

function parentWordLevel(id: string): string {
  if (['anne', 'baba', 'su', 'mama', 'top'].includes(id)) {
    return 'Seviye 1';
  }
  if (['elma', 'bardak', 'tabak', 'kasik', 'yatak', 'tuvalet', 'bebek'].includes(id)) {
    return 'Seviye 2';
  }
  if (['araba', 'kitap', 'kapi', 'pencere', 'ayakkabi', 'mont', 'canta'].includes(id)) {
    return 'Seviye 3';
  }
  return 'Seviye 4';
}

function parentWordBasePriority(id: string): number {
  if (['anne', 'baba', 'su', 'mama'].includes(id)) {
    return 24;
  }
  if (['top', 'elma', 'bardak', 'tuvalet', 'yatak'].includes(id)) {
    return 18;
  }
  if (['araba', 'mont', 'ayakkabi', 'kapi', 'kitap'].includes(id)) {
    return 12;
  }
  return 8;
}

function parentSessionRhythmLabel(sessions: number): string {
  if (sessions <= 2) {
    return 'Kısa temas';
  }
  if (sessions <= 8) {
    return 'Dengeli gün';
  }
  if (sessions <= 24) {
    return 'Yoğun pratik';
  }
  return 'Çok yoğun';
}

function learnedWordLabels(
  touchState: TouchProgressState,
  matchState: MatchProgressState,
  labels: Record<string, string>
): string[] {
  const learnedIds = new Set<string>();
  Object.entries(touchState).forEach(([id, entry]) => {
    if (isMastered(entry)) {
      learnedIds.add(id);
    }
  });
  Object.entries(matchState).forEach(([id, entry]) => {
    if (isMatchMastered(entry) || entry.conceptGeneralizationSuccess >= 2) {
      learnedIds.add(id);
    }
  });

  return [...learnedIds].map((id) => labels[id] ?? id).slice(0, 4);
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

function strongestProgressTarget(
  touchState: TouchProgressState,
  matchState: MatchProgressState,
  labels: Record<string, string>
): string {
  return [...new Set([...Object.keys(labels), ...Object.keys(touchState), ...Object.keys(matchState)])]
    .map((id) => ({
      id,
      score: (touchState[id]?.success ?? 0) + (matchState[id]?.success ?? 0) + (isMastered(touchState[id]) ? 3 : 0) + (isMatchMastered(matchState[id]) ? 4 : 0)
    }))
    .sort((a, b) => b.score - a.score)[0]?.id ?? '';
}

function readAnalytics(): AnalyticsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
    return {
      ...parsed,
      modules: Object.fromEntries(
        Object.entries(parsed.modules ?? {}).map(([name, stats]) => [name, normalizeModuleStats(stats as Partial<ModuleStats>)])
      )
    };
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
    const parsed = raw ? ({ ...childLockSettings, ...JSON.parse(raw) } as Partial<ChildLockSettings>) : { ...childLockSettings };
    const parentPin = typeof parsed.parentPin === 'string' && /^\d{4}$/.test(parsed.parentPin) ? parsed.parentPin : DEFAULT_PARENT_PIN;
    return {
      enabled: parsed.enabled ?? childLockSettings.enabled,
      keepAwake: parsed.keepAwake ?? childLockSettings.keepAwake,
      parentTapCount: parsed.parentTapCount ?? childLockSettings.parentTapCount,
      parentPullDistance: Math.min(180, Math.max(40, Number(parsed.parentPullDistance ?? childLockSettings.parentPullDistance))),
      introSeen: parsed.introSeen ?? childLockSettings.introSeen,
      parentPin
    };
  } catch {
    return { ...childLockSettings };
  }
}

function writeChildLockSettings(settings: ChildLockSettings): void {
  localStorage.setItem(CHILD_LOCK_SETTINGS_KEY, JSON.stringify(settings));
}

function readChildProfile(): ChildProfile {
  try {
    const raw = localStorage.getItem(CHILD_PROFILE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { name?: unknown }) : undefined;
    return { name: sanitizeChildName(typeof parsed?.name === 'string' ? parsed.name : 'Mina') };
  } catch {
    return { name: 'Mina' };
  }
}

function writeChildProfile(profile: ChildProfile): void {
  localStorage.setItem(CHILD_PROFILE_KEY, JSON.stringify(profile));
}

function isChildMode(view: ViewName | string | undefined): boolean {
  return view === 'home' || view === 'peekaboo' || PRIMARY_VIEWS.includes(view as ViewName);
}

function shouldLockChildNavigation(view: ViewName | string | undefined = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView): boolean {
  return childLockSettings.enabled && (isChildMode(view) || view === 'parent');
}

function renderChildLockSettings(): void {
  const enabledInput = document.querySelector<HTMLInputElement>('[data-child-lock-enabled]');
  const awakeInput = document.querySelector<HTMLInputElement>('[data-child-lock-awake]');
  const pinInput = document.querySelector<HTMLInputElement>('[data-parent-pin-setting]');
  const pullInput = document.querySelector<HTMLInputElement>('[data-parent-gesture-pull]');
  const status = document.querySelector<HTMLElement>('[data-child-lock-status]');
  if (enabledInput) {
    enabledInput.checked = childLockSettings.enabled;
  }
  if (awakeInput) {
    awakeInput.checked = childLockSettings.keepAwake;
  }
  if (pinInput) {
    pinInput.value = childLockSettings.parentPin;
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

function renderChildProfile(): void {
  const name = sanitizeChildName(childProfile.name);
  const input = document.querySelector<HTMLInputElement>('[data-child-profile-name]');
  const nameLabels = document.querySelectorAll<HTMLElement>('[data-parent-profile-name]');
  const initials = document.querySelectorAll<HTMLElement>('[data-parent-profile-initial]');

  if (input && input.value !== name) {
    input.value = name;
  }

  nameLabels.forEach((label) => {
    label.textContent = name;
  });

  initials.forEach((initial) => {
    initial.textContent = name.slice(0, 1).toLocaleUpperCase('tr-TR');
  });
}

function saveChildProfileFromPanel(): void {
  const input = document.querySelector<HTMLInputElement>('[data-child-profile-name]');
  const status = document.querySelector<HTMLElement>('[data-child-profile-status]');
  const name = sanitizeChildName(input?.value || childProfile.name || 'Mina');

  childProfile = { name };
  writeChildProfile(childProfile);
  renderChildProfile();

  if (status) {
    status.textContent = `${name} adı kaydedildi. Pofi yönergelerde bu isimle seslenecek.`;
  }
}

function parentGestureGuideText(): string {
  return `Sol üstteki yıldıza dokunun; ardından Parent şifresini girin.`;
}

function syncChildLockMode(view: ViewName | string | undefined = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView): void {
  const locked = shouldLockChildNavigation(view);
  document.querySelector<HTMLElement>('.app-shell')?.setAttribute('data-child-lock', String(locked));
  renderChildLockSettings();
  void syncNativeChildLock(locked);
  void syncScreenWakeLock();
}

async function syncNativeChildLock(locked: boolean): Promise<void> {
  const kiosk = window.Capacitor?.Plugins?.MinaPlayKiosk;
  try {
    if (kiosk?.setChildLockActive) {
      await kiosk.setChildLockActive({ active: locked });
      if (!locked) {
        await kiosk.keepFullscreen?.();
      }
      return;
    }

    window.MinaPlayAndroid?.setChildLockActive?.(locked);
    if (!locked) {
      window.MinaPlayAndroid?.keepFullscreen?.();
    }
  } catch {
    // Native kiosk support depends on Android screen pinning/device policy settings.
  }
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

function readModuleVisibilitySettings(): ModuleVisibilitySettings {
  try {
    return normalizeModuleVisibility(JSON.parse(localStorage.getItem(MODULE_VISIBILITY_KEY) ?? '{}'));
  } catch {
    return { ...DEFAULT_MODULE_VISIBILITY };
  }
}

function writeModuleVisibilitySettings(): void {
  localStorage.setItem(MODULE_VISIBILITY_KEY, JSON.stringify(moduleVisibilitySettings));
}

function readPofiGuideSettings(): PofiGuideSettings {
  try {
    return normalizePofiGuideSettings(JSON.parse(localStorage.getItem(POFI_GUIDE_SETTINGS_KEY) ?? '{}'));
  } catch {
    return { ...DEFAULT_POFI_GUIDE_SETTINGS };
  }
}

function writePofiGuideSettings(): void {
  localStorage.setItem(POFI_GUIDE_SETTINGS_KEY, JSON.stringify(pofiGuideSettings));
}

function guideDelay(baseDelayMs: number): number {
  return pofiGuideDelay(baseDelayMs, pofiGuideSettings);
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
      return `<article class="touch-progress-row" style="--progress:${rate}%">
        <strong>${card.word}</strong>
        <span>${card.learningGoal}</span>
        <span class="progress-visual" aria-label="İlerleme yüzde ${rate}"><i></i></span>
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
      return `<article class="touch-progress-row" style="--progress:${rate}%">
        <strong>${card.word}</strong>
        <span>${level}. seviye</span>
        <span class="progress-visual" aria-label="İlerleme yüzde ${rate}"><i></i></span>
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
  const pofiGuideFrequency = document.querySelector<HTMLSelectElement>('[data-pofi-guide-frequency]');
  document.querySelectorAll<HTMLInputElement>('[data-module-visibility]').forEach((input) => {
    const moduleId = input.dataset.moduleVisibility as MvpModuleId | undefined;
    input.checked = Boolean(moduleId && moduleVisibilitySettings[moduleId]);
  });
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
  if (pofiGuideFrequency) {
    pofiGuideFrequency.value = String(pofiGuideSettings.frequencyMultiplier);
  }
}

function syncModuleVisibility(): void {
  MVP_MODULE_IDS.forEach((moduleId) => {
    const isVisible = moduleVisibilitySettings[moduleId];
    document.querySelectorAll<HTMLElement>(`[data-view="${moduleId}"]`).forEach((element) => {
      element.toggleAttribute('hidden', !isVisible);
      element.setAttribute('aria-hidden', String(!isVisible));
    });
  });
}

function isModuleVisible(view: ViewName): boolean {
  return (MVP_MODULE_IDS as string[]).includes(view) ? moduleVisibilitySettings[view as MvpModuleId] : true;
}

function saveModuleVisibilitySettingsFromPanel(): void {
  const rawSettings = Object.fromEntries(
    MVP_MODULE_IDS.map((moduleId) => [
      moduleId,
      document.querySelector<HTMLInputElement>(`[data-module-visibility="${moduleId}"]`)?.checked ?? moduleVisibilitySettings[moduleId]
    ])
  );
  moduleVisibilitySettings = normalizeModuleVisibility(rawSettings);
  writeModuleVisibilitySettings();
  syncModuleVisibility();
  renderMvpModuleSettings();

  const enabledLabels = MVP_MODULE_IDS.filter((moduleId) => moduleVisibilitySettings[moduleId]).map(
    (moduleId) => MODULE_VISIBILITY_LABELS[moduleId]
  );
  const status = document.querySelector<HTMLElement>('[data-module-settings-status]');
  if (status) {
    status.textContent = `Görünen çocuk modları: ${enabledLabels.join(', ')}. En az bir mod açık kalır.`;
  }
}

function ensureModule(state: AnalyticsState, view: string): ModuleStats {
  state.modules[view] = normalizeModuleStats(state.modules[view]);
  return state.modules[view];
}

function pofiSupportTypeForAction(action: string): PofiSupportType | undefined {
  if (action.includes('wrong') || action.includes('offtarget')) {
    return 'softRedirect';
  }
  if (action.includes('guide') || action.includes('hint')) {
    return 'hint';
  }
  if (action.includes('repeat')) {
    return 'repeat';
  }
  if (action.includes('mirror') || action.includes('sentence') || action.includes('story')) {
    return 'model';
  }
  if (action.includes('sleep') || action.includes('peekaboo')) {
    return 'calm';
  }
  return undefined;
}

function pofiSupportTargetKey(action: string, context: PofiActionContext | undefined): string | undefined {
  if (context?.targetId) {
    return context.targetId;
  }
  if (action.startsWith('sleep') || action.startsWith('peekaboo')) {
    return action.split('-')[0];
  }
  return undefined;
}

function recordPofiSupportType(module: ModuleStats, supportType: PofiSupportType, action: string, context?: PofiActionContext): void {
  module.pofiSupportTypes = moduleSupportTypes(module);
  module.pofiSupportTypes[supportType] += 1;

  const targetKey = pofiSupportTargetKey(action, context);
  if (!targetKey) {
    return;
  }

  module.pofiSupportTargets = normalizePofiSupportTargets(module.pofiSupportTargets);
  const target = module.pofiSupportTargets[targetKey] ?? normalizePofiSupportTargetStats(undefined, context?.targetLabel ?? targetKey);
  target.label = context?.targetLabel ?? target.label;
  target.total += 1;
  target.supportTypes[supportType] += 1;
  if (supportType === 'repeat' || target.supportTypes[supportType] >= 3) {
    target.repeatSignals += 1;
  }
  if (target.repeatSignals > 0 && target.total >= 4) {
    module.pofiFatigueEvents = (module.pofiFatigueEvents ?? 0) + 1;
  }
  module.pofiSupportTargets[targetKey] = target;
}

function touchCardActionContext(cardId: string | undefined, supportType?: PofiSupportType): PofiActionContext | undefined {
  if (!cardId) {
    return supportType ? { supportType } : undefined;
  }
  const card = touchSettings.cards.find((entry) => entry.id === cardId);
  return {
    targetId: cardId,
    targetLabel: card?.word ?? card?.label ?? cardId,
    supportType
  };
}

function matchActionContext(supportType?: PofiSupportType): PofiActionContext | undefined {
  return touchCardActionContext(matchRound?.targetId ?? matchTargetId, supportType);
}

function sentenceActionContext(supportType?: PofiSupportType): PofiActionContext | undefined {
  if (!sentenceRound) {
    return supportType ? { supportType } : undefined;
  }
  return {
    targetId: sentenceKey(sentenceRound.prompt.subjectId, sentenceRound.prompt.verbId),
    targetLabel: sentencePhrase(sentenceRound.prompt),
    supportType
  };
}

function storyActionContext(choice: StoryChoice | undefined, supportType?: PofiSupportType): PofiActionContext | undefined {
  const step = currentStoryStep();
  const card = choice?.cardId ? touchSettings.cards.find((entry) => entry.id === choice.cardId) : undefined;
  const targetId = choice?.cardId ?? choice?.id ?? step?.id;
  if (!targetId) {
    return supportType ? { supportType } : undefined;
  }
  return {
    targetId,
    targetLabel: choice?.label ?? card?.word ?? step?.text ?? targetId,
    supportType
  };
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

function trackAction(action: string, _sourceElement?: HTMLElement, context?: PofiActionContext): void {
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

  const supportType = context?.supportType ?? pofiSupportTypeForAction(action);
  if (supportType) {
    recordPofiSupportType(module, supportType, action, context);
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
  if (!isModuleVisible(view)) {
    activateView('home');
    return;
  }

  if (view !== 'parent' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
    void window.Capacitor?.Plugins?.MinaPlayKiosk?.dismissInput?.();
  }

  // Layered transparent Pofi parts can render as black/"melting" rectangles in
  // Huawei WebView while cloned between screens. Child views open atomically.
  const shell = document.querySelector<HTMLElement>('.app-shell');
  shell?.classList.remove('view-transitioning');

  document.querySelectorAll<HTMLElement>('[data-view-panel]').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.viewPanel === view);
  });

  document.querySelectorAll<HTMLButtonElement>('.bottom-nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });

  shell?.setAttribute('data-active-view', view);
  supersedeVoiceQueue();
  if (['touch', 'match', 'sentence', 'story', 'mirror', 'peekaboo'].includes(view)) {
    unlockTouchAudio();
  }
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
}

async function leaveParentAndActivate(view: ViewName): Promise<void> {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  await window.Capacitor?.Plugins?.MinaPlayKiosk?.dismissInput?.().catch(() => undefined);
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  activateView(view);
}

function handleNativeBackButton(): void {
  const shell = document.querySelector<HTMLElement>('.app-shell');
  const activeView = (shell?.dataset.activeView ?? 'home') as ViewName;

  if (activeView === 'parent') {
    activateView('home');
    return;
  }

  if (activeView === 'sleep' && sleepMusicRunning) {
    renderSleepMode();
    return;
  }

  if (shouldLockChildNavigation(activeView)) {
    setPofiBaseState(POFI_VIEW_STATES[activeView] ?? 'neutral');
    return;
  }

  if (activeView !== 'home') {
    activateView('home');
  }
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
    unlockTouchAudio();
    peekabooState = 'ready';
    peekabooAutoCycleCount = 0;
    renderPeekabooMode();
    schedulePeekabooRound();
  }
}

function renderPeekabooMode(): void {
  const surface = document.querySelector<HTMLElement>('[data-peekaboo-surface]');
  const label = document.querySelector<HTMLElement>('[data-peekaboo-label]');
  const hint = document.querySelector<HTMLElement>('[data-peekaboo-hint]');
  if (!surface || !label || !hint) {
    return;
  }

  surface.dataset.peekabooState = peekabooState;
  delete surface.dataset.peekabooSpot;
  surface.dataset.peekabooContract = POFI_CONTRACTS.peekabooClassicCoverReveal;
  surface.dataset.peekabooScore = 'false';
  surface.dataset.peekabooReward = String(peekabooState === 'celebrate');
  surface.dataset.peekabooCelebration = peekabooCelebration;
  surface.dataset.peekabooMotion = peekabooMotion;
  surface.dataset.peekabooSearchAudioCount = String(peekabooSearchAudioCount);
  surface.dataset.peekabooRevealAudioCount = String(peekabooRevealAudioCount);

  if (peekabooState === 'cover') {
    label.textContent = 'Pofi gözlerini kapattı';
    hint.textContent = peekabooSearchText();
    return;
  }

  if (peekabooState === 'reveal' || peekabooState === 'celebrate') {
    label.textContent = 'Ceee!';
    hint.textContent = 'Pofi yüzünü açtı ve gülümsedi.';
    return;
  }

  label.textContent = 'Pofi hazır';
  hint.textContent = 'Ekrana dokun, ce-ee başlasın.';
}

function handlePeekabooToggle(button: HTMLElement): void {
  startPeekabooRound(button);
}

function startPeekabooRound(sourceElement?: HTMLElement): void {
  unlockTouchAudio();
  clearPeekabooAutoTimer();
  if (peekabooReturnTimer) {
    window.clearTimeout(peekabooReturnTimer);
    peekabooReturnTimer = undefined;
  }

  peekabooState = 'cover';
  advancePeekabooMotion();
  advancePeekabooSearchPhrase();
  renderPeekabooMode();
  trackAction('peekaboo-start', sourceElement);
  setPofiBaseState('peekabooHidden');
  playPeekabooSearchCue();
  peekabooReturnTimer = window.setTimeout(() => {
    peekabooReturnTimer = undefined;
    revealPeekabooRound();
  }, peekabooCoverDelayMs());
}

function revealPeekabooRound(): void {
  if (!document.querySelector<HTMLElement>('#view-peekaboo')?.classList.contains('active')) {
    return;
  }
  stopPeekabooSearchCue();
  peekabooState = 'reveal';
  renderPeekabooMode();
  setPofiBaseState('peekabooFound');
  playMatchStateTone('success');
  void playPeekabooVoice();
  peekabooReturnTimer = window.setTimeout(() => {
    peekabooReturnTimer = undefined;
    celebratePeekabooRound();
  }, PEEKABOO_REVEAL_MS);
}

function celebratePeekabooRound(): void {
  if (!document.querySelector<HTMLElement>('#view-peekaboo')?.classList.contains('active')) {
    return;
  }
  peekabooState = 'celebrate';
  advancePeekabooCelebration();
  renderPeekabooMode();
  setPofiBaseState('peekabooFound');
  peekabooReturnTimer = window.setTimeout(() => {
    peekabooReturnTimer = undefined;
    resetPeekabooRound();
  }, PEEKABOO_CELEBRATE_MS);
}

function resetPeekabooRound(): void {
  if (!document.querySelector<HTMLElement>('#view-peekaboo')?.classList.contains('active')) {
    return;
  }
  peekabooState = 'ready';
  renderPeekabooMode();
  setPofiBaseState('peekaboo');
  schedulePeekabooRound();
}

function clearPeekabooAutoTimer(): void {
  if (peekabooAutoTimer) {
    window.clearTimeout(peekabooAutoTimer);
    peekabooAutoTimer = undefined;
  }
}

function schedulePeekabooRound(): void {
  clearPeekabooAutoTimer();
  const delay = peekabooAutoDelayMs();
  peekabooAutoTimer = window.setTimeout(() => {
    peekabooAutoTimer = undefined;
    if (!document.querySelector<HTMLElement>('#view-peekaboo')?.classList.contains('active')) {
      return;
    }
    startPeekabooRound();
  }, delay);
}

function peekabooCoverDelayMs(): number {
  return randomBetween(PEEKABOO_COVER_MIN_MS, PEEKABOO_COVER_MAX_MS);
}

function peekabooAutoDelayMs(): number {
  peekabooAutoCycleCount += 1;
  if (peekabooAutoCycleCount > 1 && peekabooAutoCycleCount % PEEKABOO_CALM_EVERY === 0) {
    return randomBetween(PEEKABOO_CALM_IDLE_MIN_MS, PEEKABOO_CALM_IDLE_MAX_MS);
  }

  return PEEKABOO_IDLE_MS;
}

function advancePeekabooMotion(): void {
  if (PEEKABOO_MOTIONS.length <= 1) {
    return;
  }

  const nextIndex = randomBetween(0, PEEKABOO_MOTIONS.length - 2);
  peekabooMotionIndex = nextIndex >= peekabooMotionIndex ? nextIndex + 1 : nextIndex;
  peekabooMotion = PEEKABOO_MOTIONS[peekabooMotionIndex];
}

function advancePeekabooCelebration(): void {
  peekabooCelebrationCount += 1;
  if (peekabooCelebrationCount % PEEKABOO_BIG_CELEBRATION_EVERY === 0) {
    peekabooCelebration = 'big';
    return;
  }

  peekabooCelebrationIndex = (peekabooCelebrationIndex + 1) % PEEKABOO_CELEBRATIONS.length;
  peekabooCelebration = PEEKABOO_CELEBRATIONS[peekabooCelebrationIndex];
}

function sanitizeChildName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, ' ').split(' ')[0] ?? 'Mina';
  return cleaned.slice(0, 18) || 'Mina';
}

function advancePeekabooSearchPhrase(): void {
  peekabooSearchPhraseIndex = (peekabooSearchPhraseIndex + 1) % PEEKABOO_SEARCH_TEMPLATES.length;
}

function peekabooSearchText(): string {
  const index = peekabooSearchPhraseIndex >= 0 ? peekabooSearchPhraseIndex : 0;
  return PEEKABOO_SEARCH_TEMPLATES[index]();
}

function playPeekabooSearchCue(): void {
  void playRecordedPofiText(peekabooSearchText(), 0.82).then((played) => {
    if (played) {
      peekabooSearchAudioCount += 1;
      renderPeekabooMode();
    }
  });
}

function stopPeekabooSearchCue(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function playPeekabooVoice(): Promise<void> {
  return playRecordedPofiText('Ceee!', 0.94).then((played) => {
    if (played) {
      peekabooRevealAudioCount += 1;
      renderPeekabooMode();
    }
  });
}

function openParentWithUnlock(): void {
  activateView('parent');
}

function showParentSecretIntroIfNeeded(): void {
  document.querySelector<HTMLElement>('[data-parent-secret-intro]')?.setAttribute('hidden', '');
}

function acceptParentSecretIntro(): void {
  childLockSettings = { ...childLockSettings, introSeen: true };
  writeChildLockSettings(childLockSettings);
  document.querySelector<HTMLElement>('[data-parent-secret-intro]')?.setAttribute('hidden', '');
}

function resetParentGesture(): void {
  parentGestureStartY = 0;
  parentGestureStartAt = 0;
  parentGestureReadyForPull = false;
  document.querySelector<HTMLElement>('[data-parent-gesture-zone]')?.classList.remove('ready');
}

function isInParentGestureZonePoint(clientX: number, clientY: number): boolean {
  const zone = document.querySelector<HTMLElement>('[data-parent-gesture-zone]');
  const rect = zone?.getBoundingClientRect();
  if (rect) {
    return clientX >= rect.left - 8 && clientX <= rect.right + 8 && clientY >= rect.top - 8 && clientY <= rect.bottom + 8;
  }

  return clientX <= PARENT_GESTURE_ZONE_PX && clientY <= PARENT_GESTURE_ZONE_PX;
}

function beginParentGesture(clientX: number, clientY: number): void {
  if (!isInParentGestureZonePoint(clientX, clientY)) {
    resetParentGesture();
    return;
  }

  resetParentGesture();
  parentGestureStartY = clientY;
  parentGestureStartAt = Date.now();
  parentGestureReadyForPull = true;
}

function finishParentGesture(_clientY?: number): void {
  if (parentGestureReadyForPull && parentGestureStartAt > 0) {
    resetParentGesture();
    openParentPinModal();
    return;
  }

  resetParentGesture();
}

function updateParentGesture(clientY: number): void {
  if (!parentGestureReadyForPull) {
    return;
  }

  if (clientY - parentGestureStartY >= childLockSettings.parentPullDistance) {
    resetParentGesture();
    openParentPinModal();
  }
}

function openParentPinModal(): void {
  const modal = document.querySelector<HTMLElement>('[data-parent-pin-modal]');
  const input = document.querySelector<HTMLInputElement>('[data-parent-pin-input]');
  const status = document.querySelector<HTMLElement>('[data-parent-pin-status]');
  if (!modal || !input) {
    return;
  }

  pauseChildRuntimeForParentGate();
  input.value = '';
  if (status) {
    status.textContent = '';
  }
  modal.hidden = false;
  window.setTimeout(() => input.focus(), 80);
}

function closeParentPinModal(): void {
  document.querySelector<HTMLElement>('[data-parent-pin-modal]')?.setAttribute('hidden', '');
  const activeView = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView as ViewName | undefined;
  if (activeView && isChildMode(activeView)) {
    activateView(activeView);
  }
}

function hideParentPinModal(): void {
  document.querySelector<HTMLElement>('[data-parent-pin-modal]')?.setAttribute('hidden', '');
}

function pauseChildRuntimeForParentGate(): void {
  stopTouchRitual();
  clearMatchTimer();
  clearSentenceTimer();
  clearStoryTimer();
  clearMirrorTimer();
  clearPeekabooAutoTimer();
  if (peekabooReturnTimer) {
    window.clearTimeout(peekabooReturnTimer);
    peekabooReturnTimer = undefined;
  }
  supersedeVoiceQueue();
  void stopSleepMusic();
}

function submitParentPin(): void {
  const input = document.querySelector<HTMLInputElement>('[data-parent-pin-input]');
  const status = document.querySelector<HTMLElement>('[data-parent-pin-status]');
  const value = input?.value.trim() ?? '';
  if (value === childLockSettings.parentPin) {
    hideParentPinModal();
    openParentWithUnlock();
    return;
  }

  if (status) {
    status.textContent = 'Şifre yanlış.';
  }
  input?.select();
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

function ensurePofiFaceTeam(container: HTMLElement): HTMLElement {
  const existing = container.querySelector<HTMLElement>('.pofi-face-team');
  if (existing) {
    return existing;
  }
  const team = document.createElement('span');
  team.className = 'pofi-face-team';
  container.querySelectorAll<HTMLImageElement>(':scope > .pofi-face').forEach((layer) => team.append(layer));
  container.append(team);
  return team;
}

function ensurePofiFaceLayer(container: HTMLElement, className: string): HTMLImageElement {
  const team = ensurePofiFaceTeam(container);
  const layerClass = className.trim().split(/\s+/).at(-1);
  const existing = layerClass ? team.querySelector<HTMLImageElement>(`.${layerClass}`) : undefined;
  if (existing) {
    return existing;
  }
  const image = pofiImage('', className);
  team.append(image);
  return image;
}

function preloadPofiAsset(path: string): Promise<void> {
  const existing = pofiAssetLoads.get(path);
  if (existing) {
    return existing;
  }
  const load = new Promise<void>((resolve) => {
    const image = new Image();
    const done = (): void => resolve();
    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
    image.src = path;
    if (image.complete) {
      resolve();
    }
  });
  pofiAssetLoads.set(path, load);
  return load;
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
  const token = (pofiRenderTokens.get(container) ?? 0) + 1;
  pofiRenderTokens.set(container, token);
  const paths = [
    pofiPartPath('body', parts.body),
    pofiPartPath('eyes', parts.eyes),
    pofiPartPath('mouth', parts.mouth),
    parts.eyebrows ? pofiPartPath('eyebrows', parts.eyebrows) : '',
    parts.effect ? pofiPartPath('effects', parts.effect) : '',
    parts.hands ? pofiPartPath('hands', parts.hands) : ''
  ].filter(Boolean);

  void Promise.all(paths.map(preloadPofiAsset)).then(() => {
    if (pofiRenderTokens.get(container) !== token) {
      return;
    }
    window.requestAnimationFrame(() => {
      if (pofiRenderTokens.get(container) !== token) {
        return;
      }
      container.dataset.pofiMood = mood;
      container.dataset.pofiRole = POFI_EXPRESSIONS[mood].role;
      updatePofiLayer(ensurePofiLayer(container, 'pofi-body'), pofiPartPath('body', parts.body));
      updateOptionalPofiLayer(ensurePofiLayer(container, 'pofi-effect pofi-blush'), 'effects', parts.effect);
      updateOptionalPofiLayer(ensurePofiFaceLayer(container, 'pofi-face pofi-eyebrows'), 'eyebrows', parts.eyebrows);
      updatePofiLayer(ensurePofiFaceLayer(container, 'pofi-face pofi-eyes'), pofiPartPath('eyes', parts.eyes));
      updatePofiLayer(ensurePofiFaceLayer(container, 'pofi-face pofi-mouth'), pofiPartPath('mouth', parts.mouth));
      updateOptionalPofiLayer(ensurePofiLayer(container, 'pofi-hands'), 'hands', parts.hands);
      container.dataset.pofiPoseReady = 'true';
      if (animateExpression) {
        container.classList.remove('pofi-expression-change');
        void container.offsetWidth;
        container.classList.add('pofi-expression-change');
        pofiExpressionTimer = window.setTimeout(() => {
          container.classList.remove('pofi-expression-change');
        }, POFI_EXPRESSION_CHANGE_MS);
      }
    });
  });
}

function renderPofiAvatar(container: HTMLElement, mood: PofiMood): void {
  renderPofiParts(container, mood, POFI_EXPRESSIONS[mood].parts);
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

    renderPofiAvatar(avatar, pofiBaseState === 'sleep' ? 'sleepBlink' : 'blink');
    pofiReturnTimer = window.setTimeout(() => {
      const nextAvatar = activePofiAvatar();
      if (nextAvatar) {
        renderPofiAvatar(nextAvatar, pofiBaseState);
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

function createDefaultTouchCard(id: string, label: string, word: string, order: number): TouchCard {
  const image = touchObjectAssetFor(id);
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
  const texts = presets[lowerId] ?? [word];
  return texts.map((text, index) => ({
    id: `${lowerId}-${index + 1}`,
    label: text,
    text,
    rhythm: index === 0 ? 'normal' : `ritim-${index + 1}`
  }));
}

function isLegacyGeneratedTouchVariation(variation: TouchVoiceVariation, word: string): boolean {
  const normalizedWord = word.trim().toLocaleLowerCase('tr-TR');
  const normalizedText = variation.text.trim().toLocaleLowerCase('tr-TR');
  const repeatedWord = `${normalizedWord} ${normalizedWord}`;
  const spelledWord = word
    .trim()
    .split('')
    .join('-')
    .toLocaleLowerCase('tr-TR');
  return normalizedText === repeatedWord || normalizedText === spelledWord;
}

function normalizeTouchVariations(cardId: string, word: string, variations?: TouchVoiceVariation[]): TouchVoiceVariation[] {
  if (!variations?.length) {
    return createDefaultVariations(cardId, word);
  }

  const cleaned = variations.filter((variation) => !isLegacyGeneratedTouchVariation(variation, word));
  return cleaned.length > 0 ? cleaned : createDefaultVariations(cardId, word);
}

function touchObjectAssetFor(id: string): string {
  return TOUCH_OBJECT_ASSETS[id.toLowerCase()] ?? TOUCH_OBJECT_ASSETS.top;
}

function normalizeTouchImageSource(card: Pick<TouchCard, 'id' | 'image'>): string {
  if (!card.image || card.image.startsWith('toy:') || card.image.startsWith('data:image/svg+xml')) {
    return touchObjectAssetFor(card.id);
  }
  return card.image;
}

function touchCardImageSource(card: TouchCard): string {
  const image = touchRoundImages[card.id] ?? card.image;
  return normalizeTouchImageSource({ id: card.id, image });
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
  return `<img src="${image}" alt="" decoding="async" data-touch-runtime-image />`;
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

function repeatFocusCard(): TouchCard {
  const enabled = enabledTouchCards();
  return (
    enabled.find((card) => card.id === touchSettings.repeat.focusCardId) ??
    touchSettings.cards.find((card) => card.id === touchSettings.repeat.focusCardId) ??
    selectedTouchCard()
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

let touchCardRenderEpoch = 0;

async function renderTouchCards(): Promise<void> {
  const grid = document.querySelector<HTMLElement>('[data-touch-card-grid]');
  if (!grid) {
    return;
  }

  const renderEpoch = ++touchCardRenderEpoch;
  const cards = visibleTouchCards();
  const markup = cards
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

  const staging = document.createElement('div');
  staging.innerHTML = markup;
  const images = [...staging.querySelectorAll<HTMLImageElement>('[data-touch-runtime-image]')];
  grid.setAttribute('aria-busy', 'true');

  const decoded = await Promise.all(images.map(async (image) => {
    if (!image.complete) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener('load', done, { once: true });
        image.addEventListener('error', done, { once: true });
      });
    }
    if (image.naturalWidth > 0) {
      try {
        await image.decode();
      } catch {
        return false;
      }
    }
    return image.naturalWidth > 0;
  }));

  if (renderEpoch !== touchCardRenderEpoch) {
    return;
  }

  if (decoded.length !== cards.length || decoded.some((ready) => !ready)) {
    grid.removeAttribute('aria-busy');
    return;
  }

  staging.querySelectorAll<HTMLElement>('.touch-card').forEach((card) => card.classList.add('touch-card-ready'));
  grid.replaceChildren(...Array.from(staging.children));
  grid.removeAttribute('aria-busy');
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

function clearMatchPofiSettleTimer(): void {
  if (matchPofiSettleTimer) {
    window.clearTimeout(matchPofiSettleTimer);
    matchPofiSettleTimer = undefined;
  }
}

function applyMatchPofiState(state: PofiState): void {
  matchPofiSettledState = state;
  matchPofiLastChangeAt = Date.now();
  setPofiBaseState(state);
}

function setMatchPofiState(state: PofiState, options: { immediate?: boolean } = {}): void {
  clearMatchPofiSettleTimer();
  if (matchPofiSettledState === state) {
    return;
  }

  const elapsed = Date.now() - matchPofiLastChangeAt;
  if (options.immediate || !matchPofiSettledState || elapsed >= MATCH_POFI_MIN_HOLD_MS) {
    applyMatchPofiState(state);
    return;
  }

  matchPofiSettleTimer = window.setTimeout(() => {
    matchPofiSettleTimer = undefined;
    if (!isMatchViewActive()) {
      return;
    }
    applyMatchPofiState(state);
  }, MATCH_POFI_MIN_HOLD_MS - elapsed);
}

function startMatchRound(): void {
  clearMatchTimer();
  const round = createMatchRound();
  if (!round) {
    matchRound = undefined;
    clearMatchPofiSettleTimer();
    renderMatchingGame();
    return;
  }

  matchRound = round;
  matchTargetId = round.targetId;
  recentMatchTargetIds = [...recentMatchTargetIds, round.targetId].slice(-4);
  setMatchPofiState('matchGuide', { immediate: true });
  renderMatchingGame();
  matchTimer = window.setTimeout(() => enterMatchState('targeting'), MATCH_ATTENTION_MS);
}

function createMatchRound(): MatchRound | undefined {
  const cards = matchCards();
  if (cards.length === 0) {
    return undefined;
  }

  const targetSource = matchTargetSource(cards);
  const recentLimit = Math.min(3, Math.max(1, targetSource.length - 1));
  const recentIds = recentMatchTargetIds.slice(-recentLimit);
  const pool = targetSource.length > 1 ? targetSource.filter((card) => !recentIds.includes(card.id)) : targetSource;
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

function matchTargetSource(cards: TouchCard[]): TouchCard[] {
  const masteredTargets = cards.filter((card) => touchMastery.masteredWords.includes(card.id));
  if (masteredTargets.length >= 3) {
    return masteredTargets;
  }

  const practiced = cards.filter((card) => (touchProgress[card.id]?.success ?? 0) > 0);
  const blended = [...masteredTargets, ...practiced.filter((card) => !touchMastery.masteredWords.includes(card.id))];
  if (blended.length >= 3) {
    return blended;
  }

  return cards;
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
    setMatchPofiState('matchTargeting');
    void playMatchTargetSound('targeting');
    matchTimer = window.setTimeout(() => enterMatchState('waiting'), MATCH_TARGETING_MS);
  }

  if (state === 'waiting') {
    setMatchPofiState('matchWaiting');
    matchTimer = window.setTimeout(() => enterMatchHint(1), guideDelay(MATCH_WAITING_MS));
  }

  if (state === 'hint') {
    setMatchPofiState('matchHint');
    recordMatchHint(matchRound.targetId, hintLevel);
    trackAction('match-hint', undefined, matchActionContext('hint'));
    if (hintLevel === 1 || hintLevel === 3) {
      void playMatchTargetSound('hint');
    }
    if (hintLevel < 4) {
      matchTimer = window.setTimeout(() => enterMatchHint((hintLevel + 1) as 1 | 2 | 3 | 4), guideDelay(MATCH_HINT_STEP_MS));
    }
  }

  if (state === 'success') {
    setMatchPofiState('matchSuccess', { immediate: true });
    playMatchStateTone('success');
    matchTimer = window.setTimeout(() => startMatchRound(), MATCH_SUCCESS_MS);
  }

  if (state === 'retry') {
    setMatchPofiState('matchRetry', { immediate: true });
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
    await playTouchCardSound(card, style === 'success' ? 'pofi' : 'word', style === 'hint' ? 0.66 : 0.76, card.label);
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

  target.innerHTML = `<span class="match-target-label sr-only">Aynısını bul</span>
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
      ? 22
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
    return 'Pofi bekliyor.';
  }

  if (matchRound.state === 'targeting' || matchRound.state === 'waiting') {
    return `${card.word} kartını bulalım.`;
  }

  if (matchRound.state === 'hint') {
    if (matchRound.hintLevel === 1) {
      return `${card.word}`;
    }
    if (matchRound.hintLevel === 2) {
      return 'Bir daha birlikte bakalım.';
    }
    if (matchRound.hintLevel === 3) {
      return 'Pofi destek veriyor.';
    }
    return `${card.word} olan karta dokunalım.`;
  }

  if (matchRound.state === 'success') {
    return `${card.word}. Güzel.`;
  }

  if (matchRound.state === 'retry') {
    return correctChoice ? 'Birlikte tekrar bakalım.' : 'Pofi destek verecek.';
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
  trackAction(correct ? 'match-correct' : 'match-wrong', element, matchActionContext(correct ? undefined : 'softRedirect'));
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
            image: '/assets/cards/sentences/help-child.png',
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
    sentenceTimer = window.setTimeout(() => enterSentenceHint(1), guideDelay(SENTENCE_HINT_LEVEL_1_MS));
  }

  if (state === 'hint') {
    setPofiBaseState('sentenceHint');
    recordSentenceHint(hintLevel);
    trackAction('sentence-hint', undefined, sentenceActionContext('hint'));
    if (hintLevel < 4) {
      void scheduleSentenceStateAfterSpeech(token, 'hint', guideDelay(SENTENCE_HINT_STEP_MS), () =>
        enterSentenceHint((hintLevel + 1) as 1 | 2 | 3 | 4)
      );
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
    trackAction('sentence-repeat', undefined, sentenceActionContext('repeat'));
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
  surface.dataset.sentencePofiContract = sentencePofiContract(sentenceRound.state, sentenceMode);
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
  surface.dataset.sentencePofiContract = sentencePofiContract(sentenceRound?.state ?? 'board', 'board');
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

function sentencePofiContract(state: SentenceState | 'board', mode: SentenceMode): PofiContract {
  if (mode === 'board') {
    return state === 'success' || state === 'repeat_prompt' ? POFI_CONTRACTS.sentenceChoiceRepeatGuide : POFI_CONTRACTS.sentenceNeedsBoardGuide;
  }

  if (state === 'success') {
    return POFI_CONTRACTS.sentenceWarmAffirm;
  }

  if (state === 'repeat_prompt') {
    return POFI_CONTRACTS.sentenceSpeechPracticePrompt;
  }

  if (state === 'hint' || state === 'retry') {
    return POFI_CONTRACTS.sentenceSoftCommunicationSupport;
  }

  return POFI_CONTRACTS.sentenceContextModel;
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
  trackAction('sentence-expression', element, sentenceActionContext('model'));
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
  trackAction('sentence-board-select', element, sentenceActionContext('model'));
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
  if (!sentenceRound) {
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

async function speakSentenceText(text: string, kind: 'targeting' | 'success' | 'repeat' | 'hint' | 'retry'): Promise<void> {
  const surface = document.querySelector<HTMLElement>('[data-sentence-surface]');
  surface?.classList.add('sentence-speaking');
  try {
  const key = text.toLocaleLowerCase('tr-TR').replace(/[.!?,;:]/g, '').replace(/\s+/g, ' ').trim();
  const source = SENTENCE_RECORDED_SPEECH[key];
  if (source) {
    const cached = sentenceAudioClips[source];
    const audio = cached ?? (await loadAudioCandidate(source));
    if (audio) {
      sentenceAudioClips[source] = audio;
      await enqueueAudioPlayback(audio, 0.86);
      return;
    }
  }
  await enqueueSpeechText(text, { ...sentenceSpeechProfile(kind), volume: 0.82 });
  } finally {
    surface?.classList.remove('sentence-speaking');
  }
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
    }, guideDelay(STORY_WAITING_MS));
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
  surface.dataset.storyPofiContract = storyPofiContract(storySession?.state ?? 'idle');
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

function storyPofiContract(state: StoryState): PofiContract {
  if (state === 'interaction' || state === 'waiting') {
    return POFI_CONTRACTS.storyInteractionWaitGuide;
  }

  if (state === 'success') {
    return POFI_CONTRACTS.storyWarmAffirm;
  }

  if (state === 'closure' || state === 'continue') {
    return POFI_CONTRACTS.storyGentleContinuation;
  }

  if (state === 'attention' || state === 'narration') {
    return POFI_CONTRACTS.storyNarrator;
  }

  return POFI_CONTRACTS.storyIdle;
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
  const action = step.actionImage
    ? `<span class="story-action-image-wrap"><img class="story-action-image" src="${step.actionImage}" alt="${step.actionAlt ?? step.text}" decoding="async" draggable="false"></span>`
    : step.actionSymbol
      ? `<span class="story-action-symbol" aria-hidden="true">${step.actionSymbol}</span>`
      : '';
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
  const choice = step.choices?.find((entry) => entry.id === choiceId);
  trackAction('story-interaction', element, storyActionContext(choice, choice?.correct ? 'model' : 'softRedirect'));
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

async function speakStoryText(text: string, kind: 'attention' | 'narration' | 'interaction' | 'success' | 'repeat' | 'closure'): Promise<void> {
  const surface = document.querySelector<HTMLElement>('[data-story-surface]');
  surface?.classList.add('story-speaking');
  try {
    await playRecordedPofiText(text, kind === 'success' ? 0.9 : 0.84);
  } finally {
    surface?.classList.remove('story-speaking');
  }
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
  const order = mirrorExerciseOrder(mirrorPlanSettings);
  mirrorExerciseIndex = mirrorPlanSettings.preset === 'balanced' && order.length > 1
    ? Math.floor(Math.random() * order.length)
    : 0;
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
    await speakMirrorText('Bana bak', 'attention');
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
  void runMirrorDemonstration(token, exercise);
}

async function runMirrorDemonstration(token: number, exercise: MirrorExercise): Promise<void> {
  await speakMirrorText(exercise.command, 'exercise');
  if (token !== mirrorFlowToken || !isMirrorViewActive()) {
    return;
  }
  await speakMirrorText('Şimdi sen yap', 'exercise');
  if (token !== mirrorFlowToken || !isMirrorViewActive()) {
    return;
  }
  mirrorTimer = window.setTimeout(() => {
    if (token !== mirrorFlowToken || !isMirrorViewActive()) {
      return;
    }
    enterMirrorWaiting(token);
  }, 420);
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
  surface.dataset.mirrorPofiContract =
    mirrorState === 'success' ? POFI_CONTRACTS.mirrorRewardAfterExercise : POFI_CONTRACTS.mirrorExerciseModel;
  pofi.dataset.pofiState = mirrorState === 'attention' ? 'mirrorAttention' : mirrorState === 'success' ? 'mirrorSuccess' : exercise.pofiState;
  pofi.dataset.pofiContract = surface.dataset.mirrorPofiContract;
  renderPofiAvatar(pofi, pofi.dataset.pofiState as PofiState);
  fallback.textContent = mirrorCameraStream
    ? ''
    : mirrorCameraRequested
      ? 'Kamera hazır değil. Pofi ile egzersize devam edebilirsin.'
      : 'Pofi hareketi gösterecek. Sen de onu taklit et.';
  video.classList.toggle('active', Boolean(mirrorCameraStream));
  progress.style.setProperty('--mirror-duration', `${exercise.durationMs}ms`);
  progress.classList.toggle('running', mirrorState === 'waiting');
  status.textContent = mirrorState === 'success' ? exercise.success : exercise.command;
}

async function ensureMirrorCamera(): Promise<void> {
  if (!appPermissionSettings.camera) {
    mirrorCameraRequested = false;
    renderMirrorMode();
    return;
  }
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
  const surface = document.querySelector<HTMLElement>('[data-mirror-surface]');
  surface?.classList.add('mirror-speaking');
  return playRecordedPofiText(text, kind === 'success' ? 0.9 : 0.84)
    .then(() => undefined)
    .finally(() => surface?.classList.remove('mirror-speaking'));
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
  surface.dataset.sleepPofiContract = sleepMusicRunning ? POFI_CONTRACTS.sleepOnly : POFI_CONTRACTS.sleepReadyOnly;
  const stopLocked = sleepMusicRunning && childLockSettings.enabled;
  toggle.hidden = stopLocked;
  toggle.disabled = stopLocked;
  toggle.setAttribute('aria-pressed', String(sleepMusicRunning));
  toggle.setAttribute('aria-label', sleepMusicRunning ? 'Uyku müziğini durdur' : 'Uyku müziğini başlat');
  toggle.setAttribute('aria-hidden', String(stopLocked));
  label.textContent = sleepMusicRunning ? 'Durdur' : 'Başlat';

  const shell = document.querySelector<HTMLElement>('.app-shell');
  if (shell) {
    shell.dataset.sleepRunning = String(sleepMusicRunning);
  }
  const nextPofiState: PofiState = sleepMusicRunning ? 'sleep' : 'sleepReady';
  if (shell?.dataset.activeView === 'sleep' && pofiBaseState !== nextPofiState) {
    setPofiBaseState(nextPofiState);
  }
}

async function toggleSleepMusic(button?: HTMLElement): Promise<void> {
  if (sleepMusicRunning) {
    if (childLockSettings.enabled) {
      renderSleepMode();
      return;
    }
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

  if (sleepSettings.sound === 'sleep-sequence') {
    sleepRecordedSequenceIndex = randomSleepTrackIndex();
    sleepRecordedSequenceFailures = 0;
    startRecordedSleepSequence();
    return;
  }

  const recordedSrc = SLEEP_RECORDED_TRACKS[sleepSettings.sound];
  if (recordedSrc) {
    startRecordedSleepMusic(recordedSrc, true);
    return;
  }

  startGeneratedSleepMusic();
}

function randomSleepTrackIndex(except = -1): number {
  if (SLEEP_RECORDED_SEQUENCE.length <= 1) {
    return 0;
  }
  let next = Math.floor(Math.random() * SLEEP_RECORDED_SEQUENCE.length);
  if (next === except) {
    next = (next + 1) % SLEEP_RECORDED_SEQUENCE.length;
  }
  return next;
}

function startRecordedSleepSequence(): void {
  if (SLEEP_RECORDED_SEQUENCE.length === 0) {
    startGeneratedSleepMusic();
    return;
  }

  startRecordedSleepMusic(SLEEP_RECORDED_SEQUENCE[sleepRecordedSequenceIndex % SLEEP_RECORDED_SEQUENCE.length], false);
}

function playNextRecordedSleepTrack(): void {
  if (!sleepMusicRunning || sleepSettings.sound !== 'sleep-sequence') {
    return;
  }
  sleepRecordedSequenceFailures = 0;
  sleepRecordedSequenceIndex = randomSleepTrackIndex(sleepRecordedSequenceIndex);
  startRecordedSleepMusic(SLEEP_RECORDED_SEQUENCE[sleepRecordedSequenceIndex], false, false);
}

function startRecordedSleepMusic(src: string, loop: boolean, resetRunning = true): void {
  sleepMusicRunning = true;
  if (resetRunning) {
    sleepMusicNodes = [];
  }
  sleepAudioElement?.pause();
  const audio = new Audio(src);
  sleepAudioElement = audio;
  audio.loop = loop;
  audio.preload = 'auto';
  audio.volume = Math.min(0.82, sleepSettings.volume);
  if (!loop) {
    audio.addEventListener('ended', playNextRecordedSleepTrack, { once: true });
  }
  audio.addEventListener(
    'error',
    () => {
      handleRecordedSleepFailure(audio, loop);
    },
    { once: true }
  );
  void audio.play().catch(() => handleRecordedSleepFailure(audio, loop));
  if (resetRunning) {
    scheduleSleepAutoStop();
  }
  renderSleepMode();
}

function handleRecordedSleepFailure(audio: HTMLAudioElement, loop: boolean): void {
  if (sleepAudioElement !== audio) {
    return;
  }

  sleepAudioElement = undefined;
  if (sleepSettings.sound === 'sleep-sequence' && !loop && SLEEP_RECORDED_SEQUENCE.length > 0) {
    sleepRecordedSequenceFailures += 1;
    if (sleepRecordedSequenceFailures < SLEEP_RECORDED_SEQUENCE.length) {
      sleepRecordedSequenceIndex = randomSleepTrackIndex(sleepRecordedSequenceIndex);
      startRecordedSleepMusic(SLEEP_RECORDED_SEQUENCE[sleepRecordedSequenceIndex], false, false);
      return;
    }
  }

  sleepMusicRunning = false;
  if (sleepAutoStopTimer) {
    window.clearTimeout(sleepAutoStopTimer);
    sleepAutoStopTimer = undefined;
  }
  sleepRecordedSequenceFailures = 0;
  startGeneratedSleepMusic();
}

function startGeneratedSleepMusic(): void {
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
  scheduleSleepAutoStop();
  renderSleepMode();
}

function scheduleSleepAutoStop(): void {
  if (sleepSettings.durationMinutes > 0) {
    sleepAutoStopTimer = window.setTimeout(() => {
      sleepAutoStopTimer = undefined;
      void stopSleepMusic();
    }, sleepSettings.durationMinutes * 60_000);
  }
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

  if (!sleepMusicRunning && !sleepAudioContext && !sleepAudioElement) {
    renderSleepMode();
    return;
  }

  sleepMusicRunning = false;
  if (sleepAudioElement) {
    const audio = sleepAudioElement;
    sleepAudioElement = undefined;
    const startVolume = audio.volume;
    for (let step = 5; step >= 0; step -= 1) {
      audio.volume = startVolume * (step / 5);
      await wait(70);
    }
    audio.pause();
    audio.currentTime = 0;
  }

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
    return '';
  }

  if (touchSpeechSnapshot?.state === 'success') {
    return '';
  }

  if (touchSpeechSnapshot?.state === 'retry') {
    return '';
  }

  if (touchSpeechSnapshot?.state === 'hint') {
    return '';
  }

  if (touchSpeechSnapshot?.state === 'targeting' || touchSpeechSnapshot?.state === 'waiting') {
    return '';
  }

  return isActive ? variation?.text ?? '' : '';
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

function normalizePofiGuideText(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/[.!?,;:]/g, '').replace(/\s+/g, ' ').trim();
}

function loadPofiGuideManifest(): Promise<Record<string, string>> {
  if (!pofiGuideManifestPromise) {
    pofiGuideManifestPromise = fetch('/sounds/pofi-guides/manifest.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<Record<string, string>> : {})
      .catch(() => ({}));
  }
  return pofiGuideManifestPromise;
}

async function playRecordedPofiText(text: string, volume: number): Promise<boolean> {
  const manifest = await loadPofiGuideManifest();
  const source = manifest[normalizePofiGuideText(text)];
  if (!source) {
    console.warn(`Pofi kayıtlı ses bulunamadı: ${text}`);
    return false;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const cached = pofiGuideAudioClips[source];
    const audio = cached ?? await loadAudioCandidate(source);
    if (!audio) {
      delete pofiGuideAudioClips[source];
      continue;
    }
    pofiGuideAudioClips[source] = audio;
    await enqueueAudioPlayback(audio, volume);
    return true;
  }

  console.warn(`Pofi kayıtlı ses oynatılamadı: ${source}`);
  return false;
}

async function loadAudioPool(paths: string[]): Promise<HTMLAudioElement[]> {
  const loaded = await Promise.all(paths.map((path) => loadAudioCandidate(path)));
  return loaded.filter((audio): audio is HTMLAudioElement => Boolean(audio));
}

function touchSoundPaths(card: TouchCard, source: TouchSoundSource): string[] {
  const id = card.id.toLowerCase().replace(/[^a-z0-9-]/g, '');
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
}

async function touchAudioPoolFor(card: TouchCard): Promise<HTMLAudioElement[]> {
  if (touchAudioPools[card.id]) {
    return touchAudioPools[card.id];
  }
  if (!touchAudioPoolLoads[card.id]) {
    touchAudioPoolLoads[card.id] = loadTouchAudioForCard(card);
  }
  const pool = await touchAudioPoolLoads[card.id];
  touchAudioPools[card.id] = pool;
  delete touchAudioPoolLoads[card.id];
  return pool;
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
  const epoch = voiceQueueEpoch;
  const next = voiceQueue
    .catch(() => undefined)
    .then(() => wait(VOICE_QUEUE_GAP_MS))
    .then(() => (epoch === voiceQueueEpoch ? task() : undefined));
  voiceQueue = next.catch(() => undefined);
  return next;
}

function supersedeVoiceQueue(): void {
  voiceQueueEpoch += 1;
  voiceQueue = Promise.resolve();
  stopCurrentTouchAudio();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
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

  const softProfile = {
    rate: Math.min(0.92, Math.max(0.7, profile.rate)),
    pitch: Math.min(1.14, Math.max(1.02, profile.pitch)),
    volume: Math.min(0.9, Math.max(0.55, profile.volume))
  };

  const nativeSpeaker = window.Capacitor?.Plugins?.MinaPlayKiosk?.speak;
  if (nativeSpeaker) {
    return enqueueVoiceTask(async () => {
      try {
        const result = await nativeSpeaker({ text, ...softProfile });
        if (result.spoken !== false) {
          await wait(estimatedSpeechDurationMs(text, softProfile.rate));
          return;
        }
      } catch {
        // Capacitor's web proxy can expose the method even when no native implementation is available.
      }
      await speakWithWebSpeech(text, softProfile);
    });
  }

  if (!('speechSynthesis' in window)) {
    return enqueueVoiceTask(() => {
      playSoftTouchTone();
      return wait(420);
    });
  }

  return enqueueVoiceTask(() => speakWithWebSpeech(text, softProfile));
}

function speakWithWebSpeech(text: string, profile: { rate: number; pitch: number; volume: number }): Promise<void> {
  return new Promise<void>((resolve) => {
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
    const availableVoices = typeof window.speechSynthesis.getVoices === 'function' ? window.speechSynthesis.getVoices() : [];
    const preferredVoice = selectSoftTurkishVoice(availableVoices);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.addEventListener('end', finish, { once: true });
    utterance.addEventListener('error', finish, { once: true });
    window.speechSynthesis.speak(utterance);
  });
}

function selectSoftTurkishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const turkishVoices = voices.filter((voice) => voice.lang.toLocaleLowerCase('tr-TR').startsWith('tr'));
  const softVoicePattern = /female|woman|kadın|filiz|yelda|seda|aylin|emel|google türkçe/i;
  return turkishVoices.find((voice) => softVoicePattern.test(`${voice.name} ${voice.voiceURI}`)) ?? turkishVoices[0];
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

function touchFallbackSpeechProfile(intent: TouchSoundIntent): { rate: number; pitch: number; volume: number } {
  if (intent === 'repeat') {
    return { rate: 0.76, pitch: 1.08, volume: 0.86 };
  }
  if (intent === 'pofi') {
    return { rate: 0.8, pitch: 1.1, volume: 0.9 };
  }
  return { rate: 0.78, pitch: 1.08, volume: 0.86 };
}

async function playTouchCardSound(card: TouchCard, intent: TouchSoundIntent, volume: number, phrase = card.label): Promise<void> {
  if (intent === 'repeat' && shouldUseParentRepeatAudio(card)) {
    await enqueueAudioPlayback(new Audio(currentTouchRepeatMediaEntry().audioDataUrl), 0.72);
    return;
  }

  const pool = await touchAudioPoolFor(card);
  const audio = selectTouchAudio(pool);

  if (!audio) {
    playSoftTouchTone();
    await enqueueSpeechText(phrase || card.label || card.word, touchFallbackSpeechProfile(intent));
    return;
  }

  await enqueueAudioPlayback(audio, volume);
}

function shouldUseParentRepeatAudio(card: TouchCard): boolean {
  return (
    touchSettings.repeat.useParentAudio === true &&
    touchRepeatMediaVaultUnlocked() &&
    touchSettings.repeat.focusCardId === card.id &&
    Boolean(currentTouchRepeatMediaEntry().audioDataUrl)
  );
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
  const card = repeatFocusCard();
  selectedTouchCardId = card.id;
  void handleTouchCardPlayback(card, 'repeat', touchSettings.repeat.style);
  renderTouchRepeatState();

  const adaptiveInterval = touchRepeatInterval(card, touchRepeatCount);
  trackTouchAnalyticsDetail('repeat', card.id, { intervalMs: adaptiveInterval });
  touchRepeatTimer = window.setTimeout(runTouchRepeatCue, adaptiveInterval);
}

function touchRepeatInterval(card: TouchCard, count: number): number {
  const baseInterval = adaptiveRepeatInterval(touchProgress[card.id], touchSettings.repeat.minIntervalMs, touchSettings.repeat.maxIntervalMs);
  if (touchSettings.repeat.style === 'gentle') {
    return Math.min(touchSettings.repeat.maxIntervalMs + 1200, Math.max(baseInterval, 3200));
  }
  if (touchSettings.repeat.style === 'playful') {
    const playfulSteps = [1200, 1800, 1400, 2200];
    return playfulSteps[(count - 1) % playfulSteps.length] ?? baseInterval;
  }
  const melodicSteps = [1400, 1900, 2400, 1600, 2200];
  return melodicSteps[(count - 1) % melodicSteps.length] ?? baseInterval;
}

function renderTouchRepeatState(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-touch-repeat-toggle]');
  const status = document.querySelector<HTMLElement>('[data-touch-repeat-status]');
  if (toggle) {
    toggle.classList.toggle('active', touchRepeatActive);
    toggle.textContent = touchRepeatActive ? `${repeatFocusCard().label} tekrarı açık` : 'Ahenkli tekrar';
  }
  if (status) {
    status.textContent = touchRepeatActive ? `${repeatFocusCard().label} ${touchRepeatCount}/${touchSettings.repeat.maxRepeats}` : 'Kapalı';
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
    waitingMs: guideDelay(12_000),
    hintStepMs: guideDelay(12_000),
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
      trackAction('touch-hint', undefined, touchCardActionContext(event.item.id, 'hint'));
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
    setTouchStatus();
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
  setTouchStatus();
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
  supersedeVoiceQueue();
  activeTouchWeather = TOUCH_WEATHER_EFFECTS[randomBetween(0, TOUCH_WEATHER_EFFECTS.length - 1)];
  renderTouchSelection(variation, true);
  await playTouchCardSound(card, event.intent === 'success' ? 'pofi' : 'word', event.intent === 'success' ? 0.9 : 0.78, variation.text);
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

async function handleTouchCardPlayback(card: TouchCard, intent: TouchSoundIntent, rhythm: TouchVoiceVariation['rhythm'] = 'normal'): Promise<void> {
  const variation = nextTouchVariation(card, rhythm);
  activeTouchWeather = TOUCH_WEATHER_EFFECTS[randomBetween(0, TOUCH_WEATHER_EFFECTS.length - 1)];
  renderTouchSelection(variation, true);
  const repeatPrefix = intent === 'repeat' ? touchRepeatStatusPrefix() : card.label;
  setTouchStatus(`${repeatPrefix}: ${variation.label}`);
  showPofiReaction(intent === 'repeat' ? 'waiting' : touchSuccessPofiState());
  await playTouchCardSound(card, intent, intent === 'pofi' ? 0.9 : 0.78, variation.text);
}

function touchRepeatStatusPrefix(): string {
  if (touchSettings.repeat.style === 'playful') {
    return 'Oyunlu tekrar';
  }
  if (touchSettings.repeat.style === 'gentle') {
    return 'Sakin tekrar';
  }
  return 'Melodik tekrar';
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
    const stateBeforeSubmit = touchSpeechSnapshot?.state;
    const targetId = touchSpeechSnapshot?.targetId;
    const acceptsTouch = Boolean(stateBeforeSubmit && ['targeting', 'waiting', 'hint'].includes(stateBeforeSubmit));
    if (!acceptsTouch) {
      trackAction('touch-busy-tap', element, touchCardActionContext(targetId));
      return;
    }
    supersedeVoiceQueue();
    const correctTargetPress =
      card.id === targetId;
    touchSpeechMachine.submit(card.id);
    if (!correctTargetPress) {
      void handleTouchCardPlayback(card, 'word', 'normal');
    }
    trackAction(
      card.id === targetId ? 'touch-correct' : 'touch-offtarget',
      element,
      touchCardActionContext(targetId ?? card.id, card.id === targetId ? undefined : 'softRedirect')
    );
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
    trackAction('touch-guide', element, touchCardActionContext(touchSpeechSnapshot?.targetId, 'hint'));
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

async function readRawTouchRepeatMediaPayload(): Promise<unknown> {
  if (!('indexedDB' in window)) {
    return undefined;
  }

  try {
    const db = await openTouchDb();
    return await new Promise<unknown>((resolve) => {
      const transaction = db.transaction(TOUCH_DB_STORE, 'readonly');
      const request = transaction.objectStore(TOUCH_DB_STORE).get(TOUCH_REPEAT_MEDIA_KEY);
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => resolve(undefined));
    });
  } catch {
    return undefined;
  }
}

async function writeRawTouchRepeatMediaPayload(payload: EncryptedTouchRepeatMediaVault): Promise<void> {
  if (!('indexedDB' in window)) {
    throw new Error('indexeddb-unavailable');
  }

  const db = await openTouchDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(TOUCH_DB_STORE, 'readwrite');
    transaction.objectStore(TOUCH_DB_STORE).put(payload, TOUCH_REPEAT_MEDIA_KEY);
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('media-vault-write-failed')));
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('media-vault-write-aborted')));
  });
}

async function writeTouchRepeatMediaLibrary(): Promise<void> {
  if (!('indexedDB' in window)) {
    setTouchParentStatus('Bu tarayıcı yerel medya kaydını desteklemiyor.');
    return;
  }
  if (!touchRepeatMediaVaultKey || !touchRepeatMediaVaultSalt) {
    setTouchParentStatus('Önce medya kasasını açın.');
    return;
  }

  try {
    const db = await openTouchDb();
    const payload = await encryptTouchRepeatMediaLibrary(touchRepeatMediaLibrary);
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(TOUCH_DB_STORE, 'readwrite');
      transaction.objectStore(TOUCH_DB_STORE).put(payload, TOUCH_REPEAT_MEDIA_KEY);
      transaction.addEventListener('complete', () => resolve());
      transaction.addEventListener('error', () => resolve());
    });
    touchRepeatMediaVaultExists = true;
    touchRepeatPendingPlainMediaLibrary = {};
  } catch {
    setTouchParentStatus('Kayıt bu cihazda saklanamadı. Daha kısa kayıt deneyin.');
  }
}

function isEncryptedTouchRepeatMediaVault(value: unknown): value is EncryptedTouchRepeatMediaVault {
  return isEncryptedMediaVaultPayload(value) && value.version === TOUCH_REPEAT_MEDIA_VAULT_VERSION;
}

function normalizeTouchRepeatMediaLibrary(value: unknown): TouchRepeatMediaLibrary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, Partial<TouchRepeatMediaEntry>>)
      .filter(([cardId]) => touchSettings.cards.some((card) => card.id === cardId))
      .map(([cardId, entry]) => [
        cardId,
        {
          externalUrl: typeof entry.externalUrl === 'string' ? entry.externalUrl : '',
          audioDataUrl: typeof entry.audioDataUrl === 'string' && entry.audioDataUrl.startsWith('data:audio/') ? entry.audioDataUrl : '',
          audioMimeType: typeof entry.audioMimeType === 'string' ? entry.audioMimeType : '',
          audioUpdatedAt: typeof entry.audioUpdatedAt === 'string' ? entry.audioUpdatedAt : '',
          videoDataUrl: typeof entry.videoDataUrl === 'string' && entry.videoDataUrl.startsWith('data:video/') ? entry.videoDataUrl : '',
          videoMimeType: typeof entry.videoMimeType === 'string' ? entry.videoMimeType : '',
          videoUpdatedAt: typeof entry.videoUpdatedAt === 'string' ? entry.videoUpdatedAt : ''
        }
      ])
  );
}

function touchRepeatMediaCryptoSupported(): boolean {
  return Boolean(window.crypto?.subtle && window.crypto.getRandomValues);
}

async function deriveTouchRepeatMediaVaultKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = base64ToArrayBuffer(saltBase64);
  const baseKey = await window.crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: TOUCH_REPEAT_MEDIA_KDF_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptTouchRepeatMediaLibrary(library: TouchRepeatMediaLibrary): Promise<EncryptedTouchRepeatMediaVault> {
  if (!touchRepeatMediaVaultKey || !touchRepeatMediaVaultSalt) {
    throw new Error('media-vault-locked');
  }
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(library));
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, touchRepeatMediaVaultKey, encoded);
  return {
    version: TOUCH_REPEAT_MEDIA_VAULT_VERSION,
    salt: touchRepeatMediaVaultSalt,
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(new Uint8Array(encrypted))
  };
}

async function decryptTouchRepeatMediaLibrary(payload: EncryptedTouchRepeatMediaVault, key: CryptoKey): Promise<TouchRepeatMediaLibrary> {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(payload.iv) },
    key,
    base64ToArrayBuffer(payload.data)
  );
  const parsed = JSON.parse(new TextDecoder().decode(decrypted));
  return normalizeTouchRepeatMediaLibrary(parsed);
}

function randomSaltBase64(): string {
  return arrayBufferToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToArrayBuffer(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
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

  const normalizedCards = stored.cards.map((card, index) => {
    const id = card.id || `card-${Date.now()}-${index}`;
    const image = normalizeTouchImageSource({ id, image: card.image });
    return {
      ...card,
      id,
      label: card.label || card.word || 'Kart',
      word: card.word || card.label || 'Kart',
      learningGoal: card.learningGoal || TOUCH_DEFAULT_LEARNING_GOALS[id] || 'kavramı tanıma',
      image,
      images: (card.images?.length ? card.images : [image]).map((source) => normalizeTouchImageSource({ id, image: source })),
      enabled: card.enabled !== false,
      order: Number.isFinite(card.order) ? card.order : index,
      variations: normalizeTouchVariations(id, card.word || card.label || 'Kart', card.variations)
    };
  });
  const storedCardIds = new Set(normalizedCards.map((card) => card.id));
  const missingDefaultCards = defaults.cards
    .filter((card) => !storedCardIds.has(card.id))
    .map((card, index) => ({
      ...card,
      order: normalizedCards.length + index
    }));
  const cards = [...normalizedCards, ...missingDefaultCards];

  return {
    cards: cards.sort((a, b) => a.order - b.order).map((card, order) => ({ ...card, order })),
    repeat: normalizeTouchRepeatSettings(stored.repeat, cards)
  };
}

function normalizeTouchRepeatSettings(stored: Partial<TouchRepeatSettings> | undefined, cards: TouchCard[]): TouchRepeatSettings {
  const focusCardId = cards.some((card) => card.id === stored?.focusCardId)
    ? String(stored?.focusCardId)
    : cards.find((card) => card.id === TOUCH_DEFAULT_REPEAT_SETTINGS.focusCardId)?.id ?? cards[0]?.id ?? TOUCH_DEFAULT_REPEAT_SETTINGS.focusCardId;

  return {
    ...TOUCH_DEFAULT_REPEAT_SETTINGS,
    ...stored,
    enabled: false,
    focusCardId,
    style: isTouchRepeatStyle(stored?.style) ? stored.style : TOUCH_DEFAULT_REPEAT_SETTINGS.style,
    maxDurationSeconds: clampNumber(Number(stored?.maxDurationSeconds), 5, 180, TOUCH_DEFAULT_REPEAT_SETTINGS.maxDurationSeconds),
    maxRepeats: clampNumber(Number(stored?.maxRepeats), 1, 60, TOUCH_DEFAULT_REPEAT_SETTINGS.maxRepeats),
    minIntervalMs: clampNumber(Number(stored?.minIntervalMs), 900, 5000, TOUCH_DEFAULT_REPEAT_SETTINGS.minIntervalMs),
    maxIntervalMs: clampNumber(Number(stored?.maxIntervalMs), 1200, 8000, TOUCH_DEFAULT_REPEAT_SETTINGS.maxIntervalMs),
    resourceUrl: '',
    note: typeof stored?.note === 'string' ? stored.note : '',
    useParentAudio: stored?.useParentAudio === true
  };
}

function isTouchRepeatStyle(value: unknown): value is TouchRepeatStyle {
  return value === 'gentle' || value === 'melodic' || value === 'playful';
}

async function initializeTouchSettings(): Promise<void> {
  const stored = await readTouchSettings();
  touchSettings = normalizeTouchSettings(stored);
  await initializeTouchRepeatMediaVault();
  selectedTouchCardId = enabledTouchCards()[0]?.id ?? touchSettings.cards[0]?.id ?? 'baba';
  touchAudioPools = {};
  touchAudioPoolLoads = {};
  renderTouchCards();
  renderParentTouchSettings();
  renderTouchProgressTable();
  renderMatchProgressTable();
  renderMatchingGame();
  renderSentenceGame();
}

async function initializeTouchRepeatMediaVault(): Promise<void> {
  const raw = await readRawTouchRepeatMediaPayload();
  if (isEncryptedTouchRepeatMediaVault(raw)) {
    touchRepeatMediaVaultExists = true;
    touchRepeatMediaVaultSalt = raw.salt;
    touchRepeatMediaLibrary = {};
    touchRepeatPendingPlainMediaLibrary = {};
    return;
  }
  touchRepeatMediaVaultExists = false;
  touchRepeatMediaVaultSalt = '';
  touchRepeatMediaLibrary = {};
  touchRepeatPendingPlainMediaLibrary = normalizeTouchRepeatMediaLibrary(raw);
}

function renderParentTouchSettings(): void {
  const editor = document.querySelector<HTMLElement>('[data-touch-card-editor]');
  const focus = document.querySelector<HTMLSelectElement>('[data-touch-repeat-focus]');
  const style = document.querySelector<HTMLSelectElement>('[data-touch-repeat-style]');
  const duration = document.querySelector<HTMLInputElement>('[data-touch-repeat-duration]');
  const repeats = document.querySelector<HTMLInputElement>('[data-touch-repeat-count]');
  const resource = document.querySelector<HTMLInputElement>('[data-touch-repeat-resource]');
  const useParentAudio = document.querySelector<HTMLInputElement>('[data-touch-repeat-use-parent-audio]');
  const note = document.querySelector<HTMLTextAreaElement>('[data-touch-repeat-note]');
  if (focus) {
    focus.innerHTML = enabledTouchCards()
      .map((card) => `<option value="${card.id}" ${card.id === touchSettings.repeat.focusCardId ? 'selected' : ''}>${card.label}</option>`)
      .join('');
  }
  if (style) {
    style.value = touchSettings.repeat.style;
  }
  if (duration) {
    duration.value = String(touchSettings.repeat.maxDurationSeconds);
  }
  if (repeats) {
    repeats.value = String(touchSettings.repeat.maxRepeats);
  }
  if (resource) {
    resource.value = touchRepeatMediaVaultUnlocked() ? currentTouchRepeatMediaEntry().externalUrl : '';
    resource.disabled = !touchRepeatMediaVaultUnlocked();
  }
  if (useParentAudio) {
    useParentAudio.checked = touchSettings.repeat.useParentAudio;
    useParentAudio.disabled = !touchRepeatMediaVaultUnlocked();
  }
  if (note) {
    note.value = touchSettings.repeat.note;
  }
  renderTouchRepeatMediaPanel();
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

function blankTouchRepeatMediaEntry(): TouchRepeatMediaEntry {
  return {
    externalUrl: '',
    audioDataUrl: '',
    audioMimeType: '',
    audioUpdatedAt: '',
    videoDataUrl: '',
    videoMimeType: '',
    videoUpdatedAt: ''
  };
}

function currentTouchRepeatMediaEntry(): TouchRepeatMediaEntry {
  if (!touchRepeatMediaVaultUnlocked()) {
    return blankTouchRepeatMediaEntry();
  }
  return touchRepeatMediaLibrary[touchSettings.repeat.focusCardId] ?? blankTouchRepeatMediaEntry();
}

function updateCurrentTouchRepeatMediaEntry(update: Partial<TouchRepeatMediaEntry>): TouchRepeatMediaEntry {
  const cardId = touchSettings.repeat.focusCardId;
  const entry = { ...blankTouchRepeatMediaEntry(), ...touchRepeatMediaLibrary[cardId], ...update };
  touchRepeatMediaLibrary = { ...touchRepeatMediaLibrary, [cardId]: entry };
  return entry;
}

function touchRepeatRecordingSupported(): boolean {
  return Boolean(navigator.mediaDevices) && typeof navigator.mediaDevices.getUserMedia === 'function' && 'MediaRecorder' in window;
}

function touchRepeatMediaVaultUnlocked(): boolean {
  return Boolean(touchRepeatMediaVaultKey);
}

function renderTouchRepeatMediaPanel(): void {
  const support = document.querySelector<HTMLElement>('[data-touch-repeat-media-support]');
  const preview = document.querySelector<HTMLElement>('[data-touch-repeat-media-preview]');
  const vaultStatus = document.querySelector<HTMLElement>('[data-touch-media-vault-status]');
  const vaultPass = document.querySelector<HTMLInputElement>('[data-touch-media-vault-pass]');
  const vaultUnlock = document.querySelector<HTMLButtonElement>('[data-touch-media-vault-unlock]');
  const vaultLock = document.querySelector<HTMLButtonElement>('[data-touch-media-vault-lock]');
  const vaultExport = document.querySelector<HTMLButtonElement>('[data-touch-media-vault-export]');
  const vaultImport = document.querySelector<HTMLButtonElement>('[data-touch-media-vault-import]');
  const recordButtons = document.querySelectorAll<HTMLButtonElement>('[data-touch-repeat-record]');
  const entry = currentTouchRepeatMediaEntry();
  const card = repeatFocusCard();
  const unlocked = touchRepeatMediaVaultUnlocked();

  if (vaultStatus) {
    vaultStatus.textContent = !touchRepeatMediaCryptoSupported()
      ? 'Bu tarayıcı şifreli medya kasasını desteklemiyor.'
      : unlocked
        ? 'Medya kasası açık. Kayıtlar bu oturumda görülebilir.'
        : touchRepeatMediaVaultExists
          ? 'Medya kasası kilitli. Kayıtları görmek için şifreyi girin.'
          : 'İlk kullanımda en az 6 karakterli bir kasa şifresi belirleyin.';
  }
  if (vaultUnlock) {
    vaultUnlock.disabled = !touchRepeatMediaCryptoSupported();
    vaultUnlock.textContent = touchRepeatMediaVaultExists ? 'Kasayı aç' : 'Kasa oluştur';
  }
  if (vaultLock) {
    vaultLock.disabled = !unlocked;
  }
  if (vaultPass) {
    vaultPass.disabled = !touchRepeatMediaCryptoSupported();
  }
  if (vaultExport) {
    vaultExport.disabled = !touchRepeatMediaVaultExists || !('indexedDB' in window);
  }
  if (vaultImport) {
    vaultImport.disabled = !touchRepeatMediaCryptoSupported() || !('indexedDB' in window);
  }

  if (support) {
    support.textContent = !unlocked ? 'Kasa kilitli' : touchRepeatRecordingSupported() ? `${card.label} için şifreli kayıt` : 'Bu cihaz desteklemiyor';
  }

  recordButtons.forEach((button) => {
    const kind = button.dataset.touchRepeatRecord === 'video' ? 'video' : 'audio';
    const isRecording = touchRepeatRecorder?.kind === kind;
    button.textContent = isRecording ? 'Kaydı bitir' : kind === 'video' ? 'Video kaydet' : 'Ses kaydet';
    button.classList.toggle('active', isRecording);
    button.disabled = (!unlocked || !touchRepeatRecordingSupported()) && !isRecording;
  });

  if (!preview) {
    return;
  }

  if (!unlocked) {
    preview.innerHTML = '<p class="recording-guide">Ses, video ve dış linkler kilitli kasada saklanır. Görmek veya eklemek için kasayı açın.</p>';
    return;
  }

  const parts: string[] = [];
  if (entry.audioDataUrl) {
    parts.push(`
      <article class="repeat-media-item">
        <strong>Ses kaydı</strong>
        <audio controls src="${entry.audioDataUrl}"></audio>
        <small>${formatDateTime(entry.audioUpdatedAt)}</small>
        <button class="soft-admin-button" type="button" data-touch-repeat-media-delete="audio">Sesi sil</button>
      </article>`);
  }
  if (entry.videoDataUrl) {
    parts.push(`
      <article class="repeat-media-item">
        <strong>Video kaydı</strong>
        <video controls playsinline src="${entry.videoDataUrl}"></video>
        <small>${formatDateTime(entry.videoUpdatedAt)}</small>
        <button class="soft-admin-button" type="button" data-touch-repeat-media-delete="video">Videoyu sil</button>
      </article>`);
  }
  if (entry.externalUrl) {
    const safeUrl = escapeHtml(entry.externalUrl);
    parts.push(`
      <article class="repeat-media-item">
        <strong>Dış link</strong>
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>
      </article>`);
  }

  preview.innerHTML = parts.join('') || '<p class="recording-guide">Henüz ses, video veya dış link eklenmedi.</p>';
}

function formatDateTime(value: string): string {
  if (!value) {
    return 'Bugün kaydedildi';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Bugün kaydedildi';
  }
  return date.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

async function unlockTouchRepeatMediaVault(): Promise<void> {
  const input = document.querySelector<HTMLInputElement>('[data-touch-media-vault-pass]');
  const passphrase = input?.value.trim() ?? '';
  if (!touchRepeatMediaCryptoSupported()) {
    setTouchParentStatus('Bu tarayıcı şifreli medya kasasını desteklemiyor.');
    renderTouchRepeatMediaPanel();
    return;
  }
  if (passphrase.length < 6) {
    setTouchParentStatus('Medya kasası için en az 6 karakterli bir şifre girin.');
    renderTouchRepeatMediaPanel();
    return;
  }

  const raw = await readRawTouchRepeatMediaPayload();
  try {
    if (isEncryptedTouchRepeatMediaVault(raw)) {
      const key = await deriveTouchRepeatMediaVaultKey(passphrase, raw.salt);
      touchRepeatMediaLibrary = await decryptTouchRepeatMediaLibrary(raw, key);
      touchRepeatMediaVaultKey = key;
      touchRepeatMediaVaultSalt = raw.salt;
      touchRepeatMediaVaultExists = true;
      setTouchParentStatus('Medya kasası açıldı.');
    } else {
      touchRepeatMediaVaultSalt = randomSaltBase64();
      touchRepeatMediaVaultKey = await deriveTouchRepeatMediaVaultKey(passphrase, touchRepeatMediaVaultSalt);
      touchRepeatMediaLibrary = { ...touchRepeatPendingPlainMediaLibrary };
      touchRepeatMediaVaultExists = true;
      await writeTouchRepeatMediaLibrary();
      setTouchParentStatus('Medya kasası oluşturuldu. Kayıtlar artık şifreli saklanır.');
    }
    if (input) {
      input.value = '';
    }
  } catch {
    touchRepeatMediaVaultKey = undefined;
    touchRepeatMediaLibrary = {};
    setTouchParentStatus('Medya kasası açılamadı. Şifre yanlış olabilir.');
  }
  renderParentTouchSettings();
}

function lockTouchRepeatMediaVault(): void {
  if (touchRepeatRecorder) {
    stopTouchRepeatRecording();
  }
  touchRepeatMediaVaultKey = undefined;
  touchRepeatMediaLibrary = {};
  renderParentTouchSettings();
  setTouchParentStatus('Medya kasası kilitlendi.');
}

async function exportTouchRepeatMediaVault(): Promise<void> {
  try {
    const raw = await readRawTouchRepeatMediaPayload();
    if (!isEncryptedTouchRepeatMediaVault(raw)) {
      setTouchParentStatus('Dışa aktarılacak şifreli medya kasası bulunamadı.');
      return;
    }

    const backup = createMediaVaultBackup(raw);
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = mediaVaultBackupFileName();
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setTouchParentStatus('Şifreli medya kasası yedeği indirildi. Kasa şifrenizi ayrı ve güvenli saklayın.');
  } catch {
    setTouchParentStatus('Şifreli medya kasası yedeği hazırlanamadı.');
  }
}

function openTouchRepeatMediaVaultImport(): void {
  document.querySelector<HTMLInputElement>('[data-touch-media-vault-file]')?.click();
}

async function importTouchRepeatMediaVault(file: File): Promise<void> {
  if (file.size > TOUCH_REPEAT_MEDIA_BACKUP_MAX_BYTES) {
    setTouchParentStatus('Yedek dosyası beklenen sınırdan büyük. En fazla 128 MB dosya seçin.');
    return;
  }

  try {
    const backup = parseMediaVaultBackup(await file.text());
    if (touchRepeatMediaVaultExists && !window.confirm('Mevcut şifreli medya kasası bu yedekle değiştirilsin mi?')) {
      setTouchParentStatus('Yedek yükleme iptal edildi; mevcut kasa korundu.');
      return;
    }

    await writeRawTouchRepeatMediaPayload(backup.vault);
    touchRepeatMediaVaultKey = undefined;
    touchRepeatMediaLibrary = {};
    touchRepeatPendingPlainMediaLibrary = {};
    touchRepeatMediaVaultSalt = backup.vault.salt;
    touchRepeatMediaVaultExists = true;
    renderParentTouchSettings();
    setTouchParentStatus('Şifreli yedek yüklendi. Kayıtları görmek için yedeğin kasa şifresini girin.');
  } catch {
    setTouchParentStatus('Yedek yüklenemedi. Geçerli bir MinaPlay şifreli kasa dosyası seçin.');
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[char] ?? char;
  });
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
    image: touchObjectAssetFor('top'),
    images: [touchObjectAssetFor('top')],
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
  const focus = document.querySelector<HTMLSelectElement>('[data-touch-repeat-focus]');
  const style = document.querySelector<HTMLSelectElement>('[data-touch-repeat-style]');
  const duration = document.querySelector<HTMLInputElement>('[data-touch-repeat-duration]');
  const repeats = document.querySelector<HTMLInputElement>('[data-touch-repeat-count]');
  const resource = document.querySelector<HTMLInputElement>('[data-touch-repeat-resource]');
  const useParentAudio = document.querySelector<HTMLInputElement>('[data-touch-repeat-use-parent-audio]');
  const note = document.querySelector<HTMLTextAreaElement>('[data-touch-repeat-note]');
  const externalUrl = normalizeExternalMediaUrl(resource?.value.trim() ?? '');
  if ((resource?.value.trim() ?? '') && !externalUrl) {
    setTouchParentStatus('Ses/video linki yalnız http veya https olmalı.');
    return;
  }
  if (externalUrl && !touchRepeatMediaVaultUnlocked()) {
    setTouchParentStatus('Linki saklamak için önce medya kasasını açın.');
    renderTouchRepeatMediaPanel();
    return;
  }
  touchSettings.repeat = normalizeTouchRepeatSettings(
    {
      ...touchSettings.repeat,
      focusCardId: focus?.value,
      style: style?.value as TouchRepeatStyle | undefined,
      maxDurationSeconds: Number(duration?.value),
      maxRepeats: Number(repeats?.value),
      resourceUrl: '',
      note: note?.value.trim() ?? '',
      useParentAudio: Boolean(useParentAudio?.checked && touchRepeatMediaVaultUnlocked())
    },
    touchSettings.cards
  );
  if (touchRepeatMediaVaultUnlocked()) {
    updateCurrentTouchRepeatMediaEntry({ externalUrl });
  }
  renderTouchRepeatState();
  renderParentTouchSettings();
  setTouchParentStatus(`${repeatFocusCard().label} için ${touchRepeatStatusPrefix().toLowerCase()} ayarları kaydedildi.`);
  void writeTouchSettings();
  if (touchRepeatMediaVaultUnlocked()) {
    void writeTouchRepeatMediaLibrary();
  }
}

function normalizeExternalMediaUrl(value: string): string {
  if (!value) {
    return '';
  }
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

async function toggleTouchRepeatRecording(kind: TouchRepeatMediaKind): Promise<void> {
  if ((kind === 'audio' || kind === 'video') && !appPermissionSettings.microphone) {
    const status = document.querySelector<HTMLElement>('[data-touch-media-vault-status]');
    if (status) status.textContent = 'Mikrofon kullanımı Kontrol bölümünden kapatılmış.';
    return;
  }
  if (touchRepeatRecorder) {
    stopTouchRepeatRecording();
    return;
  }
  await startTouchRepeatRecording(kind);
}

async function startTouchRepeatRecording(kind: TouchRepeatMediaKind): Promise<void> {
  if (!touchRepeatMediaVaultUnlocked()) {
    setTouchParentStatus('Kayıt almak için önce medya kasasını açın.');
    renderTouchRepeatMediaPanel();
    return;
  }
  if (!touchRepeatRecordingSupported()) {
    setTouchParentStatus('Bu tarayıcı kısa ses/video kaydını desteklemiyor.');
    renderTouchRepeatMediaPanel();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(kind === 'video' ? { video: true, audio: true } : { audio: true });
    const mimeType = preferredTouchRepeatMimeType(kind);
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const cardId = touchSettings.repeat.focusCardId;
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    recorder.addEventListener('stop', () => {
      void finishTouchRepeatRecording();
    });
    touchRepeatRecorder = {
      cardId,
      kind,
      recorder,
      stream,
      chunks,
      timeout: window.setTimeout(stopTouchRepeatRecording, kind === 'video' ? TOUCH_REPEAT_VIDEO_MAX_MS : TOUCH_REPEAT_AUDIO_MAX_MS)
    };
    recorder.start();
    setTouchParentStatus(kind === 'video' ? 'Video kaydı başladı. En fazla 12 saniye.' : 'Ses kaydı başladı. En fazla 10 saniye.');
    renderTouchRepeatMediaPanel();
  } catch {
    setTouchParentStatus(kind === 'video' ? 'Kamera veya mikrofon izni alınamadı.' : 'Mikrofon izni alınamadı.');
    renderTouchRepeatMediaPanel();
  }
}

function stopTouchRepeatRecording(): void {
  const active = touchRepeatRecorder;
  if (!active) {
    return;
  }
  if (active.recorder.state !== 'inactive') {
    active.recorder.stop();
  }
}

async function finishTouchRepeatRecording(): Promise<void> {
  const active = touchRepeatRecorder;
  if (!active) {
    return;
  }

  window.clearTimeout(active.timeout);
  active.stream.getTracks().forEach((track) => track.stop());
  touchRepeatRecorder = undefined;

  const mimeType = active.recorder.mimeType || preferredTouchRepeatMimeType(active.kind) || (active.kind === 'video' ? 'video/webm' : 'audio/webm');
  const blob = new Blob(active.chunks, { type: mimeType });
  if (blob.size === 0) {
    setTouchParentStatus('Kayıt alınamadı. Bir daha deneyin.');
    renderTouchRepeatMediaPanel();
    return;
  }

  const dataUrl = await readBlobAsDataUrl(blob);
  const updatedAt = new Date().toISOString();
  const update =
    active.kind === 'video'
      ? { videoDataUrl: dataUrl, videoMimeType: mimeType, videoUpdatedAt: updatedAt }
      : { audioDataUrl: dataUrl, audioMimeType: mimeType, audioUpdatedAt: updatedAt };
  touchRepeatMediaLibrary = {
    ...touchRepeatMediaLibrary,
    [active.cardId]: { ...blankTouchRepeatMediaEntry(), ...touchRepeatMediaLibrary[active.cardId], ...update }
  };
  await writeTouchRepeatMediaLibrary();
  renderTouchRepeatMediaPanel();
  setTouchParentStatus(active.kind === 'video' ? 'Kısa video kaydı saklandı.' : 'Kısa ses kaydı saklandı.');
}

function preferredTouchRepeatMimeType(kind: TouchRepeatMediaKind): string {
  const options = kind === 'video' ? ['video/webm;codecs=vp8,opus', 'video/webm'] : ['audio/webm;codecs=opus', 'audio/webm'];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

function deleteTouchRepeatMedia(kind: TouchRepeatMediaKind): void {
  if (!touchRepeatMediaVaultUnlocked()) {
    setTouchParentStatus('Silmek için önce medya kasasını açın.');
    renderTouchRepeatMediaPanel();
    return;
  }
  const update =
    kind === 'video'
      ? { videoDataUrl: '', videoMimeType: '', videoUpdatedAt: '' }
      : { audioDataUrl: '', audioMimeType: '', audioUpdatedAt: '' };
  updateCurrentTouchRepeatMediaEntry(update);
  renderTouchRepeatMediaPanel();
  setTouchParentStatus(kind === 'video' ? 'Video kaydı silindi.' : 'Ses kaydı silindi.');
  void writeTouchRepeatMediaLibrary();
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

  document.getElementById('metric-sessions')!.textContent = parentSessionRhythmLabel(state.sessions);
  document.getElementById('metric-correct')!.textContent = String(totals.correct);
  document.getElementById('metric-soft')!.textContent = String(totals.soft);
  document.getElementById('metric-repeats')!.textContent = String(state.repeats);

  const log = document.getElementById('module-log');
  if (!log) {
    return;
  }

  const maxModuleAction = Math.max(1, ...modules.map(([, stats]) => stats.actions + stats.opens));
  log.innerHTML =
    modules.length === 0
      ? '<p>Henüz kayıt yok. İlk oyun açıldığında burada sakin bir özet oluşacak.</p>'
      : modules
          .map(([name, stats]) => {
            const activityRate = Math.round(((stats.actions + stats.opens) / maxModuleAction) * 100);
            return `<article class="module-detail-row">
              <div>
                <strong>${parentModuleLabel(name)}</strong>
                <span>${stats.opens} açılış · ${stats.actions} etkileşim</span>
              </div>
              <div class="module-detail-bars" aria-label="${parentModuleLabel(name)} bölüm özeti">
                <span><b>Bağımsız</b><em>${stats.correct}</em></span>
                <span><b>Destekle</b><em>${stats.softRedirects}</em></span>
              </div>
              <div class="module-detail-note">${createPofiSupportTypeSummary([stats]).join(' · ')}</div>
              <span class="parent-bar-track" aria-hidden="true"><span style="width: ${activityRate}%"></span></span>
            </article>`;
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
      `<article class="module-detail-row">
        <div>
          <strong>Dokun öğrenme ipucu</strong>
          <span>İpucu seviyeleri: ${hintSummary || '0'} · ortalama bağımsız dokunma ${averageLatency} ms</span>
        </div>
        <div class="module-detail-note">Tekrar odağı: ${state.touch.repeatNeeds}</div>
      </article>`
    );
  }

  renderParentTodaySummary(state);
  renderParentInsight(state);
  renderParentGuidance(state);
  renderParentDetailAnalysis(state);
}

function renderParentTodaySummary(state: AnalyticsState): void {
  const container = document.querySelector<HTMLElement>('[data-parent-today-summary]');
  if (!container) {
    return;
  }

  const labels = Object.fromEntries(touchSettings.cards.map((card) => [card.id, card.word]));
  const summary = createParentTodaySummary(state, touchProgress, matchProgress, labels);
  const learnedText = summary.learnedWords.length > 0 ? summary.learnedWords.join(', ') : 'Henüz net öğrenildi işareti yok';
  const recommendedWords =
    summary.recommendedWords.length > 0
      ? summary.recommendedWords
          .map(
            (word) => `
              <li>
                <strong>${word.label}</strong>
                <span>${word.level} · ${word.reason}</span>
              </li>`
          )
          .join('')
      : '<li><strong>Baba</strong><span>Seviye 1 · erken hedef kelime</span></li>';

  container.innerHTML = `
    <article class="parent-today-card">
      <span>Bölüm ağırlığı</span>
      <div class="parent-module-bars" aria-label="Bölüm bazlı kullanım özeti">
        ${summary.modules
          .map(
            (module) => `
              <div class="parent-module-bar">
                <div>
                  <strong>${module.label}</strong>
                  <small>${module.opens} açılış · ${module.actions} eylem${
                    module.topSupportTarget ? ` · odak ${module.topSupportTarget.label}` : ''
                  }</small>
                </div>
                <span class="parent-bar-track" aria-hidden="true"><span style="width: ${module.activityRate}%"></span></span>
              </div>`
          )
          .join('')}
      </div>
    </article>
    <article class="parent-today-card">
      <span>Bağımsızlık dengesi</span>
      <strong>${summary.supportSummary}</strong>
      <div class="parent-ratio-bars" aria-label="Bağımsız ve destekle deneme oranı">
        <span style="--value: ${summary.independenceRate}%"><b>Bağımsız</b><em>${summary.independenceRate}%</em></span>
        <span style="--value: ${summary.supportRate}%"><b>Destekle</b><em>${summary.supportRate}%</em></span>
      </div>
      <small>Bağımsız deneme çocuğun kendi yaptığı olumlu seçimdir; destekle deneme yardım aldıktan sonra tamamlanan denemedir.</small>
    </article>
    <article class="parent-today-card">
      <span>Pofi destek türleri</span>
      <ul class="parent-word-level-list">
        ${summary.supportTypeSummary.map((entry) => `<li><strong>${entry}</strong><span>Bugünkü oyun akışından</span></li>`).join('')}
      </ul>
      <small>${summary.fatigueSummary}</small>
    </article>
    <article class="parent-today-card">
      <span>Detaylı destek izi</span>
      <ul class="parent-word-level-list">
        ${summary.supportDetailSummary.map((entry) => `<li><strong>${entry}</strong><span>Kelime/mod kırılımı</span></li>`).join('')}
      </ul>
      <small>Detaylar çocuk ekranına yazı bindirmeden, Pofi'nin rehber rolünü aile için ayrıştırır.</small>
    </article>
    <article class="parent-today-card">
      <span>Önerilen kelimeler</span>
      <ul class="parent-word-level-list">
        ${recommendedWords}
      </ul>
      <small>Kelimeler iletişim önceliği, bilişsel seviye ve bugünkü destek ihtiyacına göre sıralanır.</small>
    </article>
    <article class="parent-today-card">
      <span>Güçlenen kelimeler</span>
      <strong>${learnedText}</strong>
      <small>Öğrenildi işareti yoksa bu normaldir; önce tanıma, sonra seçme, en son genelleme beklenir.</small>
    </article>
    <article class="parent-today-card plan">
      <span>Ev çalışması</span>
      <ol>
        ${summary.plan.map((step) => `<li>${step}</li>`).join('')}
      </ol>
    </article>`;
}

function renderParentDetailAnalysis(state: AnalyticsState): void {
  const container = document.querySelector<HTMLElement>('[data-parent-detail-analysis]');
  if (!container) {
    return;
  }

  const labels = Object.fromEntries(touchSettings.cards.map((card) => [card.id, card.word]));
  const analysis = createParentDetailAnalysis(state, touchProgress, matchProgress, labels);
  container.innerHTML = `
    <article class="parent-detail-priority" data-priority="${analysis.priorityLabel}">
      <span>Bugünün odak kararı</span>
      <strong>${analysis.focusLabel} · ${analysis.priorityLabel}</strong>
      <small>${analysis.reason}</small>
    </article>
    <div class="parent-detail-analysis-grid">
      ${analysis.rows
        .map(
          (row) => `
            <article>
              <span>${row.label}</span>
              <strong>${row.value}</strong>
              <small>${row.note}</small>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderParentInsight(state: AnalyticsState): void {
  const container = document.querySelector<HTMLElement>('[data-parent-insight]');
  if (!container) {
    return;
  }

  const labels = Object.fromEntries(touchSettings.cards.map((card) => [card.id, card.word]));
  const insight = createParentInsight(state, touchProgress, matchProgress, labels);
  container.innerHTML = `
    <article class="parent-insight-main">
      <strong>${insight.title}</strong>
      <p>${insight.note}</p>
      <div class="parent-insight-tags" aria-label="Gelişim ve anlaşılma özeti">
        <span>Odak: ${insight.focusLabel}</span>
        <span>Basamak: ${insight.stageLabel}</span>
        <span>Anlaşılma: ${insight.comprehensionLabel}</span>
      </div>
    </article>
    <article class="parent-insight-plan">
      <strong>${insight.planTitle}</strong>
      <ol>
        ${insight.steps.map((step) => `<li>${step}</li>`).join('')}
      </ol>
    </article>`;
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

function setParentTab(tab: 'today' | 'edit' | 'control', focusSelector?: string): void {
  document.querySelectorAll<HTMLButtonElement>('[data-parent-tab]').forEach((button) => {
    const isActive = button.dataset.parentTab === tab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  document.querySelectorAll<HTMLElement>('[data-parent-tab-section]').forEach((section) => {
    section.toggleAttribute('hidden', section.dataset.parentTabSection !== tab);
  });

  if (focusSelector) {
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(focusSelector);
      const parentBlock = target?.closest<HTMLDetailsElement>('details');
      if (parentBlock) {
        parentBlock.open = true;
      }
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
    }, 80);
  }
}

function isParentTab(value: string | undefined): value is 'today' | 'edit' | 'control' {
  return value === 'today' || value === 'edit' || value === 'control';
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

function tabletInstallUrl(): string {
  return window.location.origin;
}

function appRunsStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as NavigatorWithStandalone).standalone);
}

function renderTabletInstallStatus(): void {
  const url = document.querySelector<HTMLElement>('[data-tablet-install-url]');
  const note = document.querySelector<HTMLElement>('[data-tablet-install-note]');
  const status = document.querySelector<HTMLElement>('[data-tablet-install-status]');
  const action = document.querySelector<HTMLButtonElement>('[data-tablet-install-action]');
  if (!url || !note || !status || !action) {
    return;
  }

  url.textContent = tabletInstallUrl();

  if (appRunsStandalone()) {
    action.disabled = true;
    action.textContent = 'Kuruldu';
    note.textContent = 'MinaPlay ana ekrandan uygulama gibi açılıyor.';
    status.textContent = 'Tablet uygulaması hazır.';
    return;
  }

  if (deferredInstallPrompt) {
    action.disabled = false;
    action.textContent = 'Uygulamayı yükle';
    note.textContent = 'Bu tarayıcı doğrudan uygulama kurulumunu destekliyor.';
    status.textContent = 'Kurulum hazır. Düğmeye basıp onaylayın.';
    return;
  }

  action.disabled = true;
  action.textContent = 'Menüden ekle';
  note.textContent = 'Huawei Browser, Chrome veya Edge menüsünden Ana ekrana ekle seçeneğini kullanın.';
  status.textContent = 'Tablette bu adresi açın; tarayıcı menüsünden ana ekrana ekleyin.';
}

function renderAppUpdateStatus(): void {
  const version = document.querySelector<HTMLElement>('[data-app-update-version]');
  const note = document.querySelector<HTMLElement>('[data-app-update-note]');
  const status = document.querySelector<HTMLElement>('[data-app-update-status]');
  const action = document.querySelector<HTMLButtonElement>('[data-app-update-action]');
  if (!version || !note || !status || !action) {
    return;
  }

  const apkUrl = new URL(APP_UPDATE_APK_URL, window.location.origin).href;
  version.textContent = APP_UPDATE_VERSION;
  note.textContent = window.Capacitor?.Plugins?.MinaPlayKiosk?.downloadAndInstallUpdate
    ? 'MinaPlay güncellemeyi uygulama içinde indirir ve Android kurulum ekranını açar.'
    : `APK adresi: ${apkUrl}`;
  action.hidden = true;
  status.textContent = 'Yeni sürüm olup olmadığını kontrol edin.';
}

async function checkForAppUpdate(): Promise<void> {
  const status = document.querySelector<HTMLElement>('[data-app-update-status]');
  const checks = document.querySelectorAll<HTMLButtonElement>('[data-app-update-check]');
  const downloads = document.querySelectorAll<HTMLButtonElement>('[data-app-update-action], [data-app-update-quick]');
  checks.forEach((button) => {
    button.disabled = true;
    button.textContent = 'Kontrol ediliyor…';
  });
  try {
    const response = await fetch(APP_UPDATE_METADATA_URL, { cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Update metadata is unavailable');
    }
    const release = (await response.json()) as { version?: string };
    const available = Boolean(release.version && release.version !== APP_VERSION);
    downloads.forEach((button) => {
      button.hidden = !available;
    });
    if (status) {
      status.textContent = available ? `Yeni sürüm hazır: v${release.version}` : `MinaPlay güncel: v${APP_VERSION}`;
    }
  } catch {
    downloads.forEach((button) => {
      button.hidden = false;
    });
    if (status) {
      status.textContent = 'Sürüm bilgisi alınamadı. Güncellemeyi indirerek devam edebilirsiniz.';
    }
  } finally {
    checks.forEach((button) => {
      button.disabled = false;
      button.textContent = 'Güncellemeyi kontrol et';
    });
  }
}

async function openAppUpdateDownload(): Promise<void> {
  const apkUrl = new URL(APP_UPDATE_APK_URL, window.location.origin).href;
  const status = document.querySelector<HTMLElement>('[data-app-update-status]');
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-app-update-action], [data-app-update-quick]');
  if (status) {
    status.textContent = 'Güncelleme MinaPlay içinde indiriliyor. Lütfen bekleyin…';
  }
  buttons.forEach((button) => {
    button.disabled = true;
    button.textContent = 'İndiriliyor…';
  });

  const nativeUpdater = window.Capacitor?.Plugins?.MinaPlayKiosk?.downloadAndInstallUpdate;
  try {
    if (nativeUpdater) {
      const result = await nativeUpdater({ url: apkUrl });
      if (status) {
        status.textContent =
          result.status === 'permission_required'
            ? 'Açılan ekranda “Bu kaynaktan izin ver” seçeneğini açın, MinaPlay’e dönün ve Güncellemeyi indir düğmesine tekrar basın.'
            : 'Android güncelleme ekranı açıldı. Güncelle/Yükle onayını verin.';
      }
      return;
    }
    window.location.href = apkUrl;
  } catch (error) {
    if (status) {
      const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
      status.textContent = `Güncelleme tamamlanamadı${detail}. Yeniden deneyin.`;
    }
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
      button.textContent = 'Güncellemeyi indir';
    });
  }
}

async function installTabletApp(): Promise<void> {
  if (!deferredInstallPrompt) {
    renderTabletInstallStatus();
    return;
  }

  const prompt = deferredInstallPrompt;
  deferredInstallPrompt = undefined;
  await prompt.prompt();
  await prompt.userChoice.catch(() => undefined);
  renderTabletInstallStatus();
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
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });
    if ('caches' in window) {
      void caches.keys().then((keys) => {
        keys
          .filter((key) => key.startsWith('minaplay-'))
          .forEach((key) => {
            void caches.delete(key);
          });
      });
    }
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

function registerTabletInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    renderTabletInstallStatus();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = undefined;
    renderTabletInstallStatus();
  });

  window.addEventListener('load', renderTabletInstallStatus);
}

let viewportLayoutFrame = 0;

function syncTabletViewport(): void {
  const shell = document.querySelector<HTMLElement>('.app-shell');
  const height = Math.round(window.visualViewport?.height ?? window.innerHeight);
  document.documentElement.style.setProperty('--minaplay-viewport-height', `${height}px`);
  shell?.setAttribute('data-viewport-settling', 'true');
  window.cancelAnimationFrame(viewportLayoutFrame);
  viewportLayoutFrame = window.requestAnimationFrame(() => {
    viewportLayoutFrame = window.requestAnimationFrame(() => {
      const settledHeight = Math.round(window.visualViewport?.height ?? window.innerHeight);
      document.documentElement.style.setProperty('--minaplay-viewport-height', `${settledHeight}px`);
      shell?.removeAttribute('data-viewport-settling');
      if (shell?.dataset.activeView === 'touch') {
        void renderTouchCards();
      }
    });
  });
}

function boot(): void {
  syncTabletViewport();
  window.addEventListener('resize', syncTabletViewport);
  window.addEventListener('orientationchange', syncTabletViewport);
  window.visualViewport?.addEventListener('resize', syncTabletViewport);
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : undefined;
    const touchCardTrigger = target?.closest<HTMLElement>('[data-touch-card-id]');
    const touchPofiTrigger = target?.closest<HTMLElement>('[data-touch-pofi-trigger]');
    const touchRepeatTrigger = target?.closest<HTMLElement>('[data-touch-repeat-toggle]');
    const touchCardAdd = target?.closest<HTMLElement>('[data-touch-card-add]');
    const touchRepeatSave = target?.closest<HTMLElement>('[data-touch-repeat-save]');
    const touchRepeatRecord = target?.closest<HTMLElement>('[data-touch-repeat-record]');
    const touchRepeatMediaDelete = target?.closest<HTMLElement>('[data-touch-repeat-media-delete]');
    const touchMediaVaultUnlock = target?.closest<HTMLElement>('[data-touch-media-vault-unlock]');
    const touchMediaVaultLock = target?.closest<HTMLElement>('[data-touch-media-vault-lock]');
    const touchMediaVaultExport = target?.closest<HTMLElement>('[data-touch-media-vault-export]');
    const touchMediaVaultImport = target?.closest<HTMLElement>('[data-touch-media-vault-import]');
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
      if (!mirrorCameraStream && mirrorCameraRequested) {
        mirrorCameraRequested = false;
        void ensureMirrorCamera();
      }
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

    if (touchMediaVaultUnlock) {
      void unlockTouchRepeatMediaVault();
      return;
    }

    if (touchMediaVaultLock) {
      lockTouchRepeatMediaVault();
      return;
    }

    if (touchMediaVaultExport) {
      void exportTouchRepeatMediaVault();
      return;
    }

    if (touchMediaVaultImport) {
      openTouchRepeatMediaVaultImport();
      return;
    }

    if (touchRepeatRecord?.dataset.touchRepeatRecord) {
      void toggleTouchRepeatRecording(touchRepeatRecord.dataset.touchRepeatRecord === 'video' ? 'video' : 'audio');
      return;
    }

    if (touchRepeatMediaDelete?.dataset.touchRepeatMediaDelete) {
      deleteTouchRepeatMedia(touchRepeatMediaDelete.dataset.touchRepeatMediaDelete === 'video' ? 'video' : 'audio');
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
      if (!isModuleVisible(requestedView)) {
        return;
      }
      const activeView = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView;
      const isBottomNavTrigger = Boolean(viewTrigger.closest('.bottom-nav'));
      const isBrandHomeTrigger = viewTrigger.classList.contains('brand-home') && requestedView === 'home';
      if (activeView === 'sleep' && sleepMusicRunning && requestedView !== 'sleep' && !isBrandHomeTrigger) {
        return;
      }
      if (shouldLockChildNavigation(activeView) && !isBrandHomeTrigger && !isChildMode(requestedView)) {
        return;
      }
      const nextView = isBottomNavTrigger && requestedView === activeView ? 'home' : requestedView;
      if (activeView === 'parent' && nextView !== 'parent') {
        void leaveParentAndActivate(nextView);
        return;
      }
      activateView(nextView);
      return;
    }

  });

  document.addEventListener('change', (event) => {
    const targetElement = event.target instanceof Element ? event.target : undefined;
    const vaultBackupFile = targetElement instanceof HTMLInputElement && targetElement.hasAttribute('data-touch-media-vault-file')
      ? targetElement
      : undefined;
    if (vaultBackupFile?.files?.[0]) {
      void importTouchRepeatMediaVault(vaultBackupFile.files[0]).finally(() => {
        vaultBackupFile.value = '';
      });
      return;
    }
    const repeatFocus = targetElement instanceof HTMLSelectElement ? targetElement.closest<HTMLSelectElement>('[data-touch-repeat-focus]') : undefined;
    if (repeatFocus) {
      touchSettings.repeat = normalizeTouchRepeatSettings({ ...touchSettings.repeat, focusCardId: repeatFocus.value }, touchSettings.cards);
      renderParentTouchSettings();
      return;
    }

    const target = targetElement instanceof HTMLInputElement ? targetElement : undefined;
    if (!target) {
      return;
    }

    if (target.dataset.appPermission === 'camera' || target.dataset.appPermission === 'microphone') {
      appPermissionSettings = { ...appPermissionSettings, [target.dataset.appPermission]: target.checked };
      localStorage.setItem('minaplay-app-permissions-v1', JSON.stringify(appPermissionSettings));
      if (!appPermissionSettings.camera) stopMirrorCamera();
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

  document.addEventListener('click', (event) => {
    const peekabooButton = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-peekaboo-toggle]') : undefined;
    if (peekabooButton) {
      event.preventDefault();
      handlePeekabooToggle(peekabooButton);
    }
  });

  document.querySelectorAll<HTMLButtonElement>('[data-track-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!button.hasAttribute('data-peekaboo-toggle')) {
        const action = button.dataset.trackAction ?? 'action';
        showActionCue(button, action);
        trackAction(action, button);
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-parent-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isParentTab(button.dataset.parentTab)) {
        setParentTab(button.dataset.parentTab);
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-parent-tab-target]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isParentTab(button.dataset.parentTabTarget)) {
        setParentTab(button.dataset.parentTabTarget, button.dataset.parentFocusTarget);
      }
    });
  });

  document.querySelector<HTMLButtonElement>('[data-sleep-toggle]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    void toggleSleepMusic(event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined);
  });

  document.addEventListener('minaplay:native-back', handleNativeBackButton);

  const sleepSurface = document.querySelector<HTMLElement>('[data-sleep-surface]');
  sleepSurface?.addEventListener('click', (event) => {
    const clickedToggle = event.target instanceof HTMLElement && Boolean(event.target.closest('[data-sleep-toggle]'));
    if (!sleepMusicRunning || clickedToggle || childLockSettings.enabled) {
      return;
    }
    void stopSleepMusic();
  });
  const parentGestureZone = document.querySelector<HTMLElement>('[data-parent-gesture-zone]');
  parentGestureZone?.addEventListener('pointerdown', (event) => {
    try {
      parentGestureZone.setPointerCapture(event.pointerId);
    } catch {
      // Older WebViews can reject pointer capture; touch fallback below still handles the gate.
    }
    beginParentGesture(event.clientX, event.clientY);
  });
  parentGestureZone?.addEventListener('click', (event) => {
    event.preventDefault();
  });
  parentGestureZone?.addEventListener('pointermove', (event) => {
    updateParentGesture(event.clientY);
  });
  parentGestureZone?.addEventListener('pointerup', (event) => {
    finishParentGesture(event.clientY);
  });
  parentGestureZone?.addEventListener('pointercancel', resetParentGesture);
  parentGestureZone?.addEventListener('pointerleave', (event) => {
    updateParentGesture(event.clientY);
    if (!parentGestureReadyForPull) {
      resetParentGesture();
    }
  });
  parentGestureZone?.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches.item(0);
      if (!touch) {
        return;
      }
      event.preventDefault();
      beginParentGesture(touch.clientX, touch.clientY);
    },
    { passive: false }
  );
  parentGestureZone?.addEventListener(
    'touchmove',
    (event) => {
      const touch = event.touches.item(0);
      if (!touch) {
        return;
      }
      event.preventDefault();
      updateParentGesture(touch.clientY);
    },
    { passive: false }
  );
  parentGestureZone?.addEventListener(
    'touchend',
    (event) => {
      const touch = event.changedTouches.item(0);
      event.preventDefault();
      finishParentGesture(touch?.clientY);
    },
    { passive: false }
  );

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
    const pinInput = document.querySelector<HTMLInputElement>('[data-parent-pin-setting]');
    const pullInput = document.querySelector<HTMLInputElement>('[data-parent-gesture-pull]');
    const parentPin = /^\d{4}$/.test(pinInput?.value.trim() ?? '') ? pinInput!.value.trim() : childLockSettings.parentPin;
    const parentPullDistance = Math.min(180, Math.max(40, Number(pullInput?.value ?? childLockSettings.parentPullDistance)));
    childLockSettings = { ...childLockSettings, parentPin, parentPullDistance };
    writeChildLockSettings(childLockSettings);
    resetParentGesture();
    renderChildLockSettings();
  });

  document.querySelector<HTMLFormElement>('[data-parent-pin-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    submitParentPin();
  });
  document.querySelector<HTMLElement>('[data-parent-pin-cancel]')?.addEventListener('click', closeParentPinModal);

  document.querySelector<HTMLElement>('[data-child-profile-save]')?.addEventListener('click', saveChildProfileFromPanel);

  document.querySelector<HTMLElement>('[data-parent-secret-accept]')?.addEventListener('click', acceptParentSecretIntro);

  document.querySelector<HTMLButtonElement>('[data-tablet-install-action]')?.addEventListener('click', () => {
    void installTabletApp();
  });
  document.querySelector<HTMLButtonElement>('[data-app-update-action]')?.addEventListener('click', openAppUpdateDownload);
  document.querySelector<HTMLButtonElement>('[data-app-update-quick]')?.addEventListener('click', openAppUpdateDownload);
  document.querySelectorAll<HTMLButtonElement>('[data-app-update-check]').forEach((button) => {
    button.addEventListener('click', checkForAppUpdate);
  });

  document.querySelector<HTMLElement>('[data-module-visibility-save]')?.addEventListener('click', saveModuleVisibilitySettingsFromPanel);

  document.querySelector<HTMLElement>('[data-pofi-guide-frequency-save]')?.addEventListener('click', () => {
    const frequencyMultiplier = Number(document.querySelector<HTMLSelectElement>('[data-pofi-guide-frequency]')?.value);
    pofiGuideSettings = normalizePofiGuideSettings({ frequencyMultiplier });
    writePofiGuideSettings();
    renderMvpModuleSettings();
    const status = document.querySelector<HTMLElement>('[data-pofi-guide-frequency-status]');
    if (status) {
      status.textContent =
        pofiGuideSettings.frequencyMultiplier === 1
          ? 'Pofi normal yönlendirme ritminde çalışacak.'
          : `Pofi yönlendirmeleri ${pofiGuideSettings.frequencyMultiplier} kat daha sık çalışacak.`;
    }
  });

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
  childProfile = readChildProfile();
  try {
    appPermissionSettings = { ...appPermissionSettings, ...JSON.parse(localStorage.getItem('minaplay-app-permissions-v1') ?? '{}') };
  } catch {
    appPermissionSettings = { camera: true, microphone: true };
  }
  document.querySelectorAll<HTMLInputElement>('[data-app-permission]').forEach((input) => {
    const key = input.dataset.appPermission as 'camera' | 'microphone';
    input.checked = appPermissionSettings[key];
  });
  touchProgress = readTouchProgress();
  touchMastery = readTouchMastery();
  matchProgress = readMatchProgress();
  mirrorPlanSettings = readMirrorPlanSettings();
  sleepSettings = readSleepSettings();
  moduleVisibilitySettings = readModuleVisibilitySettings();
  pofiGuideSettings = readPofiGuideSettings();
  sentenceProgress = readSentenceProgress();
  publishTouchMasteryForMatching();
  renderPofiAvatars();
  syncModuleVisibility();
  syncChildLockMode();
  renderChildProfile();
  showParentSecretIntroIfNeeded();
  renderParentMetrics();
  void renderDeviceStatus();
  renderTabletInstallStatus();
  renderAppUpdateStatus();
  renderTouchProgressTable();
  renderMatchProgressTable();
  renderMvpModuleSettings();
  renderMatchingGame();
  renderSentenceGame();
  renderStory();
  renderTouchCards();
  void initializeTouchSettings();
  registerTabletInstallPrompt();
  registerServiceWorker();
}

if (typeof document !== 'undefined') {
  boot();
}
