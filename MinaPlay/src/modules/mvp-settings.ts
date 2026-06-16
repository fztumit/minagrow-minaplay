export type MirrorPlanPreset = 'balanced' | 'mouth-first' | 'tongue-first';
export type SleepSoundPreset = 'lullaby' | 'ocean' | 'white';
export type MvpModuleId = 'touch' | 'match' | 'mirror' | 'sleep' | 'peekaboo';

export interface MirrorPlanSettings {
  preset: MirrorPlanPreset;
}

export interface SleepSettings {
  sound: SleepSoundPreset;
  durationMinutes: 0 | 5 | 10 | 20 | 30;
  volume: number;
}

export type ModuleVisibilitySettings = Record<MvpModuleId, boolean>;

export const MIRROR_PLAN_KEY = 'minaplay_mirror_plan_v1';
export const SLEEP_SETTINGS_KEY = 'minaplay_sleep_settings_v1';
export const MODULE_VISIBILITY_KEY = 'minaplay_module_visibility_v1';
export const MVP_MODULE_IDS: MvpModuleId[] = ['touch', 'match', 'mirror', 'sleep', 'peekaboo'];

export const DEFAULT_MIRROR_PLAN: MirrorPlanSettings = {
  preset: 'balanced'
};

export const DEFAULT_SLEEP_SETTINGS: SleepSettings = {
  sound: 'lullaby',
  durationMinutes: 10,
  volume: 0.55
};

export const DEFAULT_MODULE_VISIBILITY: ModuleVisibilitySettings = {
  touch: true,
  match: true,
  mirror: true,
  sleep: true,
  peekaboo: true
};

const MIRROR_ORDERS: Record<MirrorPlanPreset, string[]> = {
  balanced: ['tongue-out', 'open-mouth', 'pucker', 'teeth', 'tongue-left', 'tongue-right'],
  'mouth-first': ['open-mouth', 'pucker', 'teeth', 'tongue-out', 'tongue-left', 'tongue-right'],
  'tongue-first': ['tongue-out', 'tongue-left', 'tongue-right', 'open-mouth', 'pucker', 'teeth']
};

export function normalizeMirrorPlan(raw: unknown): MirrorPlanSettings {
  const preset = isRecord(raw) && isMirrorPreset(raw.preset) ? raw.preset : DEFAULT_MIRROR_PLAN.preset;
  return { preset };
}

export function mirrorExerciseOrder(settings: MirrorPlanSettings): string[] {
  return [...MIRROR_ORDERS[settings.preset]];
}

export function normalizeSleepSettings(raw: unknown): SleepSettings {
  if (!isRecord(raw)) {
    return { ...DEFAULT_SLEEP_SETTINGS };
  }

  return {
    sound: isSleepSound(raw.sound) ? raw.sound : DEFAULT_SLEEP_SETTINGS.sound,
    durationMinutes: isSleepDuration(raw.durationMinutes) ? raw.durationMinutes : DEFAULT_SLEEP_SETTINGS.durationMinutes,
    volume: clampNumber(raw.volume, 0.2, 1, DEFAULT_SLEEP_SETTINGS.volume)
  };
}

export function normalizeModuleVisibility(raw: unknown): ModuleVisibilitySettings {
  if (!isRecord(raw)) {
    return { ...DEFAULT_MODULE_VISIBILITY };
  }

  const normalized = Object.fromEntries(
    MVP_MODULE_IDS.map((id) => [id, typeof raw[id] === 'boolean' ? raw[id] : DEFAULT_MODULE_VISIBILITY[id]])
  ) as ModuleVisibilitySettings;

  if (!MVP_MODULE_IDS.some((id) => normalized[id])) {
    normalized.touch = true;
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isMirrorPreset(value: unknown): value is MirrorPlanPreset {
  return value === 'balanced' || value === 'mouth-first' || value === 'tongue-first';
}

function isSleepSound(value: unknown): value is SleepSoundPreset {
  return value === 'lullaby' || value === 'ocean' || value === 'white';
}

function isSleepDuration(value: unknown): value is SleepSettings['durationMinutes'] {
  return value === 0 || value === 5 || value === 10 || value === 20 || value === 30;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Number(value)));
}
