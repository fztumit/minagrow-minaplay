type ViewName = 'home' | 'touch' | 'match' | 'sentence' | 'story' | 'mirror' | 'sleep' | 'peekaboo' | 'parent';
type PofiState = 'neutral' | 'guide' | 'playful' | 'calm' | 'exercise' | 'sleep' | 'peekaboo' | 'success' | 'tryAgain';
type PofiMood = PofiState | 'blink' | 'softSmile' | 'attention' | 'excited' | 'sleepBlink';
type PofiParts = { body: string; eyes: string; mouth: string };

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

const POFI_EXPRESSIONS: Record<PofiMood, PofiParts> = {
  neutral: {
    body: POFI_STABLE_BODY,
    eyes: 'open-v01.png',
    mouth: 'smile-soft-v01.png'
  },
  guide: {
    body: POFI_STABLE_BODY,
    eyes: 'wide-soft-v01.png',
    mouth: 'smile-v01.png'
  },
  playful: {
    body: POFI_STABLE_BODY,
    eyes: 'happy-v01.png',
    mouth: 'open-smile-v01.png'
  },
  calm: {
    body: POFI_STABLE_BODY,
    eyes: 'half-open-v01.png',
    mouth: 'smile-soft-v01.png'
  },
  exercise: {
    body: POFI_STABLE_BODY,
    eyes: 'open-v01.png',
    mouth: 'tongue-out-v01.png'
  },
  sleep: {
    body: POFI_STABLE_BODY,
    eyes: 'drowsy-v01.png',
    mouth: 'closed-v01.png'
  },
  peekaboo: {
    body: POFI_STABLE_BODY,
    eyes: 'surprised-v01.png',
    mouth: 'open-smile-alt-v01.png'
  },
  success: {
    body: POFI_STABLE_BODY,
    eyes: 'happy-v01.png',
    mouth: 'open-smile-soft-v01.png'
  },
  tryAgain: {
    body: POFI_STABLE_BODY,
    eyes: 'sad-soft-v01.png',
    mouth: 'sad-soft-v01.png'
  },
  blink: {
    body: POFI_STABLE_BODY,
    eyes: 'closed-soft-v01.png',
    mouth: 'smile-soft-v01.png'
  },
  softSmile: {
    body: POFI_STABLE_BODY,
    eyes: 'open-v01.png',
    mouth: 'smile-v01.png'
  },
  attention: {
    body: POFI_STABLE_BODY,
    eyes: 'waiting-v01.png',
    mouth: 'talk-small-v01.png'
  },
  excited: {
    body: POFI_STABLE_BODY,
    eyes: 'wide-open-v01.png',
    mouth: 'open-smile-soft-v01.png'
  },
  sleepBlink: {
    body: POFI_STABLE_BODY,
    eyes: 'closed-v01.png',
    mouth: 'closed-v01.png'
  }
};

const POFI_IDLE_MOODS: Partial<Record<PofiState, PofiMood[]>> = {
  neutral: ['softSmile', 'attention'],
  guide: ['attention', 'excited'],
  playful: ['excited', 'attention'],
  calm: ['attention', 'softSmile'],
  exercise: ['attention', 'excited'],
  sleep: ['sleepBlink'],
  peekaboo: ['excited'],
  success: ['softSmile'],
  tryAgain: ['attention']
};

let pofiBaseState: PofiState = 'neutral';
let pofiIdleTimer: number | undefined;
let pofiBlinkTimer: number | undefined;
let pofiReturnTimer: number | undefined;

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
}

function pofiMotionAllowed(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function pickPofiMood(state: PofiState): PofiMood {
  const moods = POFI_IDLE_MOODS[state] ?? POFI_IDLE_MOODS.neutral ?? ['blink'];
  return moods[Math.floor(Math.random() * moods.length)];
}

function renderPofiParts(container: HTMLElement, mood: PofiMood, parts: PofiParts): void {
  container.dataset.pofiMood = mood;
  container.classList.remove('pofi-expression-change');
  void container.offsetWidth;
  container.classList.add('pofi-expression-change');
  container.replaceChildren(
    pofiImage(`${POFI_PARTS_ROOT}/body/${parts.body}`, 'pofi-body'),
    pofiImage(`${POFI_PARTS_ROOT}/eyes/${parts.eyes}`, 'pofi-face pofi-eyes'),
    pofiImage(`${POFI_PARTS_ROOT}/mouth/${parts.mouth}`, 'pofi-face pofi-mouth')
  );
}

function renderPofiAvatar(container: HTMLElement, mood: PofiMood): void {
  renderPofiParts(container, mood, POFI_EXPRESSIONS[mood]);
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

    const baseParts = POFI_EXPRESSIONS[pofiBaseState];
    renderPofiParts(avatar, pofiBaseState === 'sleep' ? 'sleepBlink' : 'blink', {
      ...baseParts,
      eyes: pofiBaseState === 'sleep' ? 'closed-v01.png' : 'closed-soft-v01.png'
    });
    pofiReturnTimer = window.setTimeout(() => {
      renderActivePofi(pofiBaseState);
      schedulePofiLife();
    }, pofiBaseState === 'sleep' ? 520 : 150);
  }, randomBetween(2800, 6200));

  pofiIdleTimer = window.setTimeout(() => {
    const avatar = activePofiAvatar();
    if (!avatar) {
      return;
    }

    renderPofiAvatar(avatar, pickPofiMood(pofiBaseState));
    pofiReturnTimer = window.setTimeout(() => {
      renderActivePofi(pofiBaseState);
    }, randomBetween(1800, 2600));
  }, randomBetween(10000, 15000));
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
  }, state === 'tryAgain' ? 1500 : 1200);
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
      trackAction(button.dataset.trackAction ?? 'action');
    });
  });

  PRIMARY_VIEWS.forEach((view) => {
    document.querySelector<HTMLButtonElement>(`.bottom-nav button[data-view="${view}"]`)?.classList.toggle('active', false);
  });

  renderPofiAvatars();
  renderParentMetrics();
  registerServiceWorker();
}

if (typeof document !== 'undefined') {
  boot();
}
