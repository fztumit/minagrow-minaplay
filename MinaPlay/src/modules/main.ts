type ViewName = 'home' | 'touch' | 'match' | 'sentence' | 'story' | 'mirror' | 'sleep' | 'peekaboo' | 'parent';
type PofiState =
  | 'welcome'
  | 'neutral'
  | 'guide'
  | 'playful'
  | 'calm'
  | 'exercise'
  | 'sleep'
  | 'peekaboo'
  | 'success'
  | 'tryAgain';
type PofiMood = PofiState | 'attention' | 'blink' | 'settle' | 'sleepBlink';
type PofiParts = { body: string; eyes: string; mouth: string; hands?: string; eyebrows?: string; effect?: string };
type PofiPartFolder = 'body' | 'eyes' | 'mouth' | 'hands' | 'eyebrows' | 'effects';
type PofiRole = 'welcome' | 'idle' | 'guide' | 'attention' | 'model' | 'affirm' | 'softRedirect' | 'sleep' | 'play';

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

const STORAGE_KEY = 'minaplay_analytics_v1';
const PRIMARY_VIEWS: ViewName[] = ['touch', 'match', 'sentence', 'story', 'mirror', 'sleep'];

const POFI_PARTS_ROOT = '/assets/pofi/parts';

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
const CLICK_HAND_ASSET = '/assets/pofi/parts/hands/pofi_hand_point_right_v01.png';

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
  playful: 'attention',
  calm: 'settle',
  exercise: 'exercise',
  sleep: 'sleep',
  peekaboo: 'peekaboo',
  success: 'settle',
  tryAgain: 'guide'
};

let pofiBaseState: PofiState = 'neutral';
let pofiIdleTimer: number | undefined;
let pofiBlinkTimer: number | undefined;
let pofiReturnTimer: number | undefined;
let pofiExpressionTimer: number | undefined;
let pofiHandTimer: number | undefined;

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

function trackAction(action: string): void {
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
  return fileName === 'pofi_hand_point_left_v01.png' || fileName === 'pofi_hand_point_right_v01.png';
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
    hand = pofiImage(CLICK_HAND_ASSET, 'object-click-hand');
    element.append(hand);
  }

  resetCueClass(element, 'click-cue', CLICK_HAND_CUE_MS);
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
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.addEventListener('click', () => activateView((button.dataset.view ?? 'home') as ViewName));
  });

  document.querySelectorAll<HTMLElement>('[data-open-parent]').forEach((entry) => {
    entry.addEventListener('click', () => activateView('parent'));
  });

  document.querySelectorAll<HTMLButtonElement>('[data-track-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.trackAction ?? 'action';
      showActionCue(button, action);
      trackAction(action);
    });
  });

  PRIMARY_VIEWS.forEach((view) => {
    document.querySelector<HTMLButtonElement>(`.bottom-nav button[data-view="${view}"]`)?.classList.toggle('active', false);
  });

  preloadPofiParts();
  renderPofiAvatars();
  renderParentMetrics();
  registerServiceWorker();
}

if (typeof document !== 'undefined') {
  boot();
}
