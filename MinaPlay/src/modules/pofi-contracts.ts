export type PofiSupportType = 'softRedirect' | 'hint' | 'repeat' | 'model' | 'calm';

export const POFI_SUPPORT_TYPES: PofiSupportType[] = ['softRedirect', 'hint', 'repeat', 'model', 'calm'];

export const POFI_SUPPORT_LABELS: Record<PofiSupportType, string> = {
  softRedirect: 'Yumuşak yönlendirme',
  hint: 'İpucu',
  repeat: 'Tekrar çağrısı',
  model: 'Model gösterimi',
  calm: 'Sakin eşlik'
};

export const POFI_CONTRACTS = {
  peekabooClassicCoverReveal: 'classic-cover-reveal',
  mirrorExerciseModel: 'exercise-model',
  mirrorRewardAfterExercise: 'reward-after-exercise',
  sleepReadyOnly: 'sleep-ready-only',
  sleepOnly: 'sleep-only',
  sentenceContextModel: 'context-model',
  sentenceSoftCommunicationSupport: 'soft-communication-support',
  sentenceWarmAffirm: 'warm-affirm',
  sentenceSpeechPracticePrompt: 'speech-practice-prompt',
  sentenceNeedsBoardGuide: 'needs-board-guide',
  sentenceChoiceRepeatGuide: 'choice-repeat-guide',
  storyNarrator: 'story-narrator',
  storyInteractionWaitGuide: 'interaction-wait-guide',
  storyWarmAffirm: 'warm-story-affirm',
  storyGentleContinuation: 'gentle-continuation',
  storyIdle: 'story-idle'
} as const;

export type PofiContract = (typeof POFI_CONTRACTS)[keyof typeof POFI_CONTRACTS];

export function createInitialPofiSupportTypes(): Record<PofiSupportType, number> {
  return Object.fromEntries(POFI_SUPPORT_TYPES.map((type) => [type, 0])) as Record<PofiSupportType, number>;
}
