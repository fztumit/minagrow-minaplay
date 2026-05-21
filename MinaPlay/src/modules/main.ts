import { SpeechStateMachine, type SpeechMachineSnapshot, type SpeechPromptEvent, type SpeechSoundEvent } from './speech/index.js';

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
  | 'success'
  | 'successSoft'
  | 'successCelebrate'
  | 'tryAgain';
type PofiMood = PofiState | 'attention' | 'blink' | 'settle' | 'sleepBlink';
type PofiParts = { body: string; eyes: string; mouth: string; hands?: string; eyebrows?: string; effect?: string };
type PofiPartFolder = 'body' | 'eyes' | 'mouth' | 'hands' | 'eyebrows' | 'effects';
type PofiRole = 'welcome' | 'idle' | 'guide' | 'attention' | 'model' | 'affirm' | 'celebrate' | 'softRedirect' | 'sleep' | 'play' | 'wait';

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
  image: string;
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

const STORAGE_KEY = 'minaplay_analytics_v1';
const PRIMARY_VIEWS: ViewName[] = ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep'];

const POFI_PARTS_ROOT = '/assets/pofi/parts';
const TOUCH_ACTIVE_MS = 900;
const TOUCH_SETTINGS_KEY = 'minaplay_touch_settings_v1';
const TOUCH_DB_NAME = 'minaplay_touch_cards_v1';
const TOUCH_DB_STORE = 'touchSettings';
const TOUCH_DB_VERSION = 1;
const TOUCH_MAX_GIF_BYTES = 3_200_000;
const TOUCH_MAX_IMAGE_EDGE = 720;
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

const POFI_VIEW_STATES: Partial<Record<ViewName, PofiState>> = {
  touch: 'guide',
  match: 'playful',
  sentence: 'guide',
  story: 'calm',
  mirror: 'exercise',
  sleep: 'sleep',
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
  sleep: {
    role: 'sleep',
    parts: {
      body: POFI_STABLE_BODY,
      eyes: 'drowsy-v01.png',
      mouth: 'closed-v01.png',
      hands: 'pofi_hand_closed_v01.png'
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
  success: 'settle',
  successSoft: 'settle',
  successCelebrate: 'settle',
  tryAgain: 'guide'
};

let pofiBaseState: PofiState = 'neutral';
let pofiIdleTimer: number | undefined;
let pofiBlinkTimer: number | undefined;
let pofiReturnTimer: number | undefined;
let pofiExpressionTimer: number | undefined;
let pofiHandTimer: number | undefined;
let touchRepeatTimer: number | undefined;
let touchActiveTimer: number | undefined;
let touchVariationIndex = 0;
let touchAudioUnlocked = false;
let touchAudioPreload: Promise<void> | undefined;
let touchAudioPools: Record<string, HTMLAudioElement[]> = {};
let currentTouchAudio: HTMLAudioElement | undefined;
let lastTouchAudioSrc: string | undefined;
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
  document.querySelectorAll<HTMLElement>('[data-view-panel]').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.viewPanel === view);
  });

  document.querySelectorAll<HTMLButtonElement>('.bottom-nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });

  document.querySelector<HTMLElement>('.app-shell')?.setAttribute('data-active-view', view);
  setPofiBaseState(POFI_VIEW_STATES[view] ?? 'neutral');
  syncTouchRitual(view);
  trackViewOpen(view);
  renderParentMetrics();
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
      variations: card.variations.map((variation) => ({ ...variation }))
    })),
    repeat: { ...TOUCH_DEFAULT_REPEAT_SETTINGS }
  };
}

function createDefaultTouchCard(id: string, label: string, word: string, order: number, visual: string): TouchCard {
  return {
    id,
    label,
    word,
    image: createTouchCardImage(label, visual),
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
  return card.image.startsWith('data:image/svg+xml')
    ? createTouchCardImage(card.label, defaultToyVisualForCard(card) ?? 'ball')
    : card.image;
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

function nextTouchVariation(card: TouchCard): TouchVoiceVariation {
  const variations = card.variations.length > 0 ? card.variations : createDefaultVariations(card.id, card.word);
  const pool = variations.length > 1 ? variations.filter((variation) => variation.id !== lastTouchVariationId) : variations;
  const variation = pool[randomBetween(0, pool.length - 1)] ?? variations[touchVariationIndex % variations.length];
  touchVariationIndex += 1;
  lastTouchVariationId = variation.id;
  return variation;
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
  surface.dataset.touchTargetId = touchSpeechSnapshot?.targetId ?? '';
  surface.dataset.touchLevel = String(touchSpeechSnapshot?.level ?? 1);
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
      cards.forEach((element) => element.classList.remove('speaking'));
    }, TOUCH_ACTIVE_MS);
  }
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

async function playTouchCardSound(card: TouchCard, intent: TouchSoundIntent, volume: number): Promise<void> {
  if (!touchAudioUnlocked) {
    return;
  }

  await preloadTouchAudio();
  const pool = touchAudioPools[card.id] ?? [];
  const audio = selectTouchAudio(pool);

  stopCurrentTouchAudio();

  if (!audio) {
    playSoftTouchTone();
    return;
  }

  currentTouchAudio = audio;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = volume;
  await audio.play().catch(() => {
    playSoftTouchTone();
  });
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

  touchRepeatTimer = window.setTimeout(
    runTouchRepeatCue,
    randomBetween(touchSettings.repeat.minIntervalMs, touchSettings.repeat.maxIntervalMs)
  );
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
        audio: touchSoundPaths(card, 'default')[0]
      })),
    onStateChange: handleTouchSpeechState,
    onPrompt: handleTouchSpeechPrompt,
    onSound: handleTouchSpeechSound
  });
}

function handleTouchSpeechState(snapshot: SpeechMachineSnapshot): void {
  if (snapshot.state === 'success' && lastTouchSpeechState !== 'success') {
    touchSuccessCount += 1;
  }
  lastTouchSpeechState = snapshot.state;
  touchSpeechSnapshot = snapshot;
  if (snapshot.targetId) {
    selectedTouchCardId = snapshot.targetId;
  }

  applyTouchPofiState(snapshot.state);
  renderTouchCards();
  if (snapshot.prompt) {
    setTouchStatus(snapshot.prompt);
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

  const variation: TouchVoiceVariation = {
    id: `speech-${event.intent}-${card.id}`,
    label: event.phrase,
    text: event.phrase,
    rhythm: event.intent
  };
  activeTouchWeather = TOUCH_WEATHER_EFFECTS[randomBetween(0, TOUCH_WEATHER_EFFECTS.length - 1)];
  renderTouchSelection(variation, true);
  await playTouchCardSound(card, event.intent === 'success' ? 'pofi' : 'word', event.intent === 'success' ? 0.9 : 0.78);
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

  if (touchActiveTimer) {
    window.clearTimeout(touchActiveTimer);
    touchActiveTimer = undefined;
  }

  touchSurface()?.classList.remove('touch-speaking');
  stopCurrentTouchAudio();
}

function startTouchRitual(): void {
  touchVariationIndex = 0;
  lastTouchVariationId = undefined;
  lastTouchSpeechState = undefined;
  touchSuccessCount = 0;
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

  localStorage.setItem(TOUCH_SETTINGS_KEY, JSON.stringify(payload));

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
    image: card.image || createTouchCardImage(card.label || 'Kart', 'ball'),
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
      return `<article class="touch-card-admin" data-touch-card-admin="${card.id}">
        <div class="touch-card-admin-preview">${touchCardVisualMarkup(card)}</div>
        <div class="touch-card-admin-fields">
          <label>Kart adı <input type="text" value="${card.label}" data-touch-card-field="label" /></label>
          <label>Kelime <input type="text" value="${card.word}" data-touch-card-field="word" /></label>
          <label class="inline-check"><input type="checkbox" data-touch-card-enabled ${card.enabled ? 'checked' : ''} /> Aktif</label>
          <input type="file" accept="image/png,image/jpeg,image/gif" data-touch-card-image />
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
    image: createTouchCardImage('Yeni', 'ball'),
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

  renderParentTouchSettings();
  renderTouchCards();
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
            return `<p><strong>${name}</strong>: ${stats.opens} açılış, ${stats.actions} eylem, ${stats.correct} olumlu deneme, ${stats.softRedirects} yumuşak yönlendirme.</p>`;
          })
          .join('');
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
    const viewTrigger = target?.closest<HTMLElement>('[data-view]');
    const parentTrigger = target?.closest<HTMLElement>('[data-open-parent]');

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

    if (viewTrigger?.dataset.view) {
      const requestedView = viewTrigger.dataset.view as ViewName;
      const activeView = document.querySelector<HTMLElement>('.app-shell')?.dataset.activeView;
      const isBottomNavTrigger = Boolean(viewTrigger.closest('.bottom-nav'));
      activateView(isBottomNavTrigger && requestedView === activeView ? 'home' : requestedView);
      return;
    }

    if (parentTrigger) {
      activateView('parent');
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
      renderTouchCards();
      void writeTouchSettings();
      return;
    }

    if (target.hasAttribute('data-touch-card-enabled') && card) {
      card.enabled = target.checked;
      if (!enabledTouchCards().some((entry) => entry.id === selectedTouchCardId)) {
        selectedTouchCardId = enabledTouchCards()[0]?.id ?? card.id;
      }
      renderTouchCards();
      void writeTouchSettings();
      return;
    }

    if (target.hasAttribute('data-touch-card-image') && card && target.files?.[0]) {
      void handleTouchCardImageUpload(card, target.files[0]);
    }
  });

  document.querySelectorAll<HTMLButtonElement>('[data-track-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.trackAction ?? 'action';
      showActionCue(button, action);
      trackAction(action, button);
    });
  });

  PRIMARY_VIEWS.forEach((view) => {
    document.querySelector<HTMLButtonElement>(`.bottom-nav button[data-view="${view}"]`)?.classList.toggle('active', false);
  });

  preloadPofiParts();
  renderPofiAvatars();
  renderParentMetrics();
  renderTouchCards();
  void initializeTouchSettings().then(() => preloadTouchAudio());
  registerServiceWorker();
}

if (typeof document !== 'undefined') {
  boot();
}
