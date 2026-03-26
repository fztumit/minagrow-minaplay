import { MascotGuide } from '../mascot/index.js';
import {
  loadCustomAudioMap,
  saveCustomAudioMap,
  type CustomAudioMap
} from '../speech/customAudio.js';

type SceneMode = 'room' | 'center';
type HideMode = 'self' | 'environment';
type PeekState = 'idle' | 'hide' | 'wait' | 'reveal' | 'react';
type HideoutId = 'curtain' | 'sofa' | 'table';
type AnchorId = HideoutId | 'center' | 'window' | 'toy' | 'lamp' | 'stage-left' | 'stage-right';
type PeekSequence = 'opening' | 'loop';

type PeekCyclePlan = {
  scene: SceneMode;
  hideMode: HideMode;
  anchor: AnchorId;
  hideout?: HideoutId;
  idleMs: number;
  scale: number;
  rotate: number;
  message: string;
  skipDrift?: boolean;
};

type VoiceVariant = {
  prompt: string;
  rate: number;
  pitch: number;
  volume: number;
  tone: number;
  chime: number;
};

const ROOM_ROUTE: AnchorId[] = ['window', 'toy', 'lamp', 'stage-left', 'sofa', 'stage-right', 'table'];
const HIDEOUT_SEQUENCE: HideoutId[] = ['curtain', 'sofa', 'table'];
const VOICE_VARIANTS: VoiceVariant[] = [
  { prompt: 'Ceee!', rate: 0.86, pitch: 1.14, volume: 0.95, tone: 720, chime: 980 },
  { prompt: 'Ce-eee!', rate: 0.94, pitch: 1.2, volume: 0.92, tone: 760, chime: 1080 },
  { prompt: 'Ceeey!', rate: 0.98, pitch: 1.26, volume: 0.9, tone: 820, chime: 1160 }
];

const INTRO_DELAY_MS = navigator.webdriver ? 220 : 760;
const ROOM_IDLE_MS = navigator.webdriver ? 540 : 1780;
const CENTER_IDLE_MS = navigator.webdriver ? 420 : 1480;
const HIDE_COVER_MS = navigator.webdriver ? 180 : 300;
const WAIT_MS = 1000;
const REVEAL_MS = navigator.webdriver ? 180 : 200;
const REACT_MS = navigator.webdriver ? 260 : 680;
const REVEAL_SOUND_DELAY_MS = 100;
const REVEAL_AFTERGLOW_DELAY_MS = 160;
const OPENING_SEQUENCE_LENGTH = 3;
const PEEKABOO_REVEAL_AUDIO_KEY = 'cee ee';

export class PeekabooModeModule {
  private readonly rootEl: HTMLElement;
  private readonly stageEl: HTMLElement;
  private readonly phoenixShellEl: HTMLElement;
  private readonly stageTapEl: HTMLButtonElement;
  private readonly statusEl: HTMLElement;
  private readonly parentTriggerBtn: HTMLButtonElement;
  private readonly parentHotspotEl: HTMLElement;
  private readonly hideoutButtons: HTMLButtonElement[];
  private readonly revealRecordStartBtn: HTMLButtonElement;
  private readonly revealRecordStopBtn: HTMLButtonElement;
  private readonly revealPlayBtn: HTMLButtonElement;
  private readonly revealDeleteBtn: HTMLButtonElement;
  private readonly revealStatusEl: HTMLElement;
  private readonly mascot: MascotGuide;

  private timeoutIds: number[] = [];
  private audioContext: AudioContext | null = null;
  private previewAudioEl: HTMLAudioElement | null = null;
  private audioUnlocked = false;
  private isPaused = false;
  private hasStartedOnce = false;
  private cycleIndex = 0;
  private revealCount = 0;
  private childReactionCount = 0;
  private parentHoldTimeoutId: number | null = null;
  private currentScene: SceneMode = 'room';
  private currentHideMode: HideMode = 'self';
  private currentHideout: HideoutId | null = null;
  private currentState: PeekState = 'idle';
  private currentAnchor: AnchorId = 'center';
  private currentSequence: PeekSequence = 'opening';
  private voiceVariantIndex = 0;
  private customAudioMap: CustomAudioMap = {};
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private recordingStream: MediaStream | null = null;

  constructor(rootEl: HTMLElement, mascot: MascotGuide, controlsRoot: ParentNode = rootEl.ownerDocument) {
    const stageEl = rootEl.querySelector<HTMLElement>('#peekaboo-stage');
    const phoenixShellEl = rootEl.querySelector<HTMLElement>('#peekaboo-phoenix-shell');
    const stageTapEl = rootEl.querySelector<HTMLButtonElement>('#peekaboo-stage-tap');
    const statusEl = rootEl.querySelector<HTMLElement>('#peekaboo-status');
    const parentTriggerBtn = rootEl.querySelector<HTMLButtonElement>('#peekaboo-parent-trigger');
    const parentHotspotEl = rootEl.querySelector<HTMLElement>('#peekaboo-parent-hotspot');
    const hideoutButtons = Array.from(rootEl.querySelectorAll<HTMLButtonElement>('.peekaboo-hideout'));
    const revealRecordStartBtn = controlsRoot.querySelector<HTMLButtonElement>('#peekaboo-audio-record-start');
    const revealRecordStopBtn = controlsRoot.querySelector<HTMLButtonElement>('#peekaboo-audio-record-stop');
    const revealPlayBtn = controlsRoot.querySelector<HTMLButtonElement>('#peekaboo-audio-play');
    const revealDeleteBtn = controlsRoot.querySelector<HTMLButtonElement>('#peekaboo-audio-delete');
    const revealStatusEl = controlsRoot.querySelector<HTMLElement>('#peekaboo-audio-status');

    if (
      !stageEl ||
      !phoenixShellEl ||
      !stageTapEl ||
      !statusEl ||
      !parentTriggerBtn ||
      !parentHotspotEl ||
      hideoutButtons.length === 0 ||
      !revealRecordStartBtn ||
      !revealRecordStopBtn ||
      !revealPlayBtn ||
      !revealDeleteBtn ||
      !revealStatusEl
    ) {
      throw new Error('Peekaboo module requires stage, phoenix shell, hideouts, parent access, and reveal audio controls.');
    }

    this.rootEl = rootEl;
    this.stageEl = stageEl;
    this.phoenixShellEl = phoenixShellEl;
    this.stageTapEl = stageTapEl;
    this.statusEl = statusEl;
    this.parentTriggerBtn = parentTriggerBtn;
    this.parentHotspotEl = parentHotspotEl;
    this.hideoutButtons = hideoutButtons;
    this.revealRecordStartBtn = revealRecordStartBtn;
    this.revealRecordStopBtn = revealRecordStopBtn;
    this.revealPlayBtn = revealPlayBtn;
    this.revealDeleteBtn = revealDeleteBtn;
    this.revealStatusEl = revealStatusEl;
    this.mascot = mascot;
  }

  init(): void {
    this.refreshCustomAudioMap();
    this.rootEl.setAttribute('data-peek-state', 'idle');
    this.rootEl.setAttribute('data-peek-scene', 'room');
    this.rootEl.setAttribute('data-hide-mode', 'self');
    this.rootEl.setAttribute('data-current-hideout', '');
    this.rootEl.setAttribute('data-peek-reveals', '0');
    this.rootEl.setAttribute('data-peek-reactions', '0');
    this.rootEl.setAttribute('data-can-tap-reveal', 'false');
    this.rootEl.setAttribute('data-current-anchor', 'center');
    this.rootEl.setAttribute('data-peek-sequence', 'opening');
    this.rootEl.setAttribute('data-peek-custom-audio', String(Boolean(this.getRevealAudioData())));
    this.bindEvents();
    this.bindRevealAudioControls();
    this.syncRevealAudioSupportState();
    this.syncRevealAudioState();
  }

  start(): void {
    this.isPaused = false;
    this.clearTimers();
    this.currentHideout = null;
    this.hideoutButtons.forEach((button) => button.classList.remove('is-active-hideout', 'is-tappable-hideout'));
    this.setPhoenixPosition(this.getAnchorPosition('center'), 1.1, 0);

    if (!this.hasStartedOnce) {
      this.hasStartedOnce = true;
      this.playIntro();
      return;
    }

    this.enterIdleState();
  }

  pause(): void {
    this.isPaused = true;
    this.clearTimers();
    this.hideoutButtons.forEach((button) => button.classList.remove('is-active-hideout', 'is-tappable-hideout'));
    if (this.previewAudioEl) {
      this.previewAudioEl.pause();
      this.previewAudioEl.currentTime = 0;
      this.previewAudioEl = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private bindEvents(): void {
    const unlockAudio = () => {
      this.unlockAudio();
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });

    this.rootEl.addEventListener('peekaboo-resume', () => {
      if (this.rootEl.classList.contains('active')) {
        this.start();
      }
    });

    this.rootEl.addEventListener('peekaboo-pause', () => {
      this.pause();
    });

    this.stageTapEl.addEventListener('click', () => {
      if (this.currentState === 'hide' || (this.currentState === 'wait' && this.currentHideMode === 'self')) {
        this.enterRevealState(true);
        return;
      }

      if (this.currentState === 'reveal' || this.currentState === 'react') {
        this.enterReactState(true);
      }
    });

    this.hideoutButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const hideout = button.dataset.hideout as HideoutId | undefined;
        if (!hideout) {
          return;
        }

        if (
          (this.currentState === 'hide' || this.currentState === 'wait') &&
          this.currentHideMode === 'environment' &&
          this.currentHideout === hideout
        ) {
          this.enterRevealState(true);
          return;
        }

        if (this.currentState === 'reveal' || this.currentState === 'react') {
          this.enterReactState(true);
        }
      });
    });

    this.bindParentAccess();
  }

  private bindParentAccess(): void {
    this.parentTriggerBtn.addEventListener('click', () => {
      this.rootEl.dispatchEvent(new CustomEvent('open-parent-panel', { bubbles: true }));
    });

    const clearHold = () => {
      if (this.parentHoldTimeoutId !== null) {
        window.clearTimeout(this.parentHoldTimeoutId);
        this.parentHoldTimeoutId = null;
      }
      this.parentHotspotEl.classList.remove('is-holding');
    };

    this.parentHotspotEl.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      clearHold();
      this.parentHotspotEl.classList.add('is-holding');
      this.parentHoldTimeoutId = window.setTimeout(() => {
        this.parentTriggerBtn.click();
        clearHold();
      }, 700);
    });

    this.parentHotspotEl.addEventListener('pointerup', clearHold);
    this.parentHotspotEl.addEventListener('pointerleave', clearHold);
    this.parentHotspotEl.addEventListener('pointercancel', clearHold);
  }

  private bindRevealAudioControls(): void {
    this.revealRecordStartBtn.addEventListener('click', () => {
      void this.startRevealRecording();
    });

    this.revealRecordStopBtn.addEventListener('click', () => {
      this.stopRevealRecording();
    });

    this.revealPlayBtn.addEventListener('click', () => {
      void this.playRevealRecordingPreview();
    });

    this.revealDeleteBtn.addEventListener('click', () => {
      this.deleteRevealRecording();
    });
  }

  private playIntro(): void {
    if (this.isPaused) {
      return;
    }

    this.currentScene = 'room';
    this.currentHideMode = 'self';
    this.currentHideout = null;
    this.currentAnchor = 'stage-left';
    this.setState('idle');
    this.setPhoenixPosition(this.getAnchorPosition('stage-left'), 1.06, -8);
    this.statusEl.textContent = 'Anka oyun için geldi.';
    this.mascot.setMessage('Hadi oynayalım.');
    this.playHelloAudio();
    this.speakLine('Hadi oynayalım', 0.88, 1.03, 0.88);

    const driftTimeout = window.setTimeout(() => {
      this.setPhoenixPosition(this.getAnchorPosition('window'), 1.1, 10);
    }, navigator.webdriver ? 80 : 280);

    const startTimeout = window.setTimeout(() => {
      this.enterIdleState(true);
    }, INTRO_DELAY_MS);

    this.timeoutIds.push(driftTimeout, startTimeout);
  }

  private enterIdleState(skipGreeting = false): void {
    if (this.isPaused) {
      return;
    }

    const cyclePlan = this.getCyclePlan(this.cycleIndex);
    this.currentScene = cyclePlan.scene;
    this.currentHideMode = cyclePlan.hideMode;
    this.currentHideout = cyclePlan.hideout ?? null;
    this.currentAnchor = cyclePlan.anchor;
    this.currentSequence = this.cycleIndex < OPENING_SEQUENCE_LENGTH ? 'opening' : 'loop';

    this.hideoutButtons.forEach((button) => button.classList.remove('is-active-hideout', 'is-tappable-hideout'));
    this.setState('idle');

    if (this.currentScene === 'room') {
      this.statusEl.textContent = 'Anka odada süzülüyor.';
      this.setPhoenixPosition(this.getAnchorPosition(this.currentAnchor), cyclePlan.scale, cyclePlan.rotate);
      if (!cyclePlan.skipDrift && this.currentHideMode === 'self') {
        this.scheduleRoomDrift();
      }
      if (!skipGreeting) {
        this.mascot.setMessage(cyclePlan.message);
      }
    } else {
      this.statusEl.textContent = 'Anka ortada süzülüyor.';
      this.setPhoenixPosition(this.getAnchorPosition(this.currentAnchor), cyclePlan.scale, cyclePlan.rotate);
      this.mascot.setMessage(cyclePlan.message);
    }

    const timeoutId = window.setTimeout(() => {
      this.enterHideState();
    }, cyclePlan.idleMs);
    this.timeoutIds.push(timeoutId);
  }

  private enterHideState(): void {
    if (this.isPaused) {
      return;
    }

    if (this.currentHideMode === 'environment') {
      const hideout = this.currentHideout ?? HIDEOUT_SEQUENCE[this.cycleIndex % HIDEOUT_SEQUENCE.length];
      this.currentHideout = hideout;
      this.currentAnchor = hideout;
      this.getHideoutButton(hideout)?.classList.add('is-active-hideout');
      this.setPhoenixPosition(this.getAnchorPosition(hideout), 0.9, 0);
    } else {
      this.currentHideout = null;
      const hiddenScale = this.currentScene === 'center' ? 1.18 : 1.02;
      this.setPhoenixPosition(this.getAnchorPosition(this.currentAnchor), hiddenScale, this.currentScene === 'room' ? -4 : 0);
    }

    this.statusEl.textContent = 'Anka yüzünü kapattı.';
    this.setState('hide');
    this.playHideAudio();

    const timeoutId = window.setTimeout(() => {
      this.enterWaitState();
    }, HIDE_COVER_MS);
    this.timeoutIds.push(timeoutId);
  }

  private enterWaitState(): void {
    if (this.isPaused) {
      return;
    }

    if (this.currentHideMode === 'environment' && this.currentHideout) {
      this.getHideoutButton(this.currentHideout)?.classList.add('is-tappable-hideout');
    }

    this.statusEl.textContent = 'Anka bekliyor.';
    this.setState('wait');

    const timeoutId = window.setTimeout(() => {
      this.enterRevealState(false);
    }, WAIT_MS);
    this.timeoutIds.push(timeoutId);
  }

  private enterRevealState(triggeredByTap: boolean): void {
    if (this.isPaused) {
      return;
    }

    this.clearTimers();
    if (this.currentHideout) {
      this.getHideoutButton(this.currentHideout)?.classList.remove('is-active-hideout', 'is-tappable-hideout');
    }

    const revealAnchor = this.currentHideMode === 'environment' && this.currentHideout ? this.currentHideout : this.currentAnchor;
    const revealScale = this.currentScene === 'center' ? 1.24 : 1.1;
    const revealRotation = triggeredByTap ? 6 : -6;
    this.setPhoenixPosition(this.getAnchorPosition(revealAnchor), revealScale, revealRotation);

    this.revealCount += 1;
    this.statusEl.textContent = 'Ceee!';
    this.setState('reveal');
    this.rootEl.setAttribute('data-peek-reveals', String(this.revealCount));

    const variant = VOICE_VARIANTS[this.voiceVariantIndex % VOICE_VARIANTS.length];
    this.voiceVariantIndex += 1;

    this.mascot.setMessage('Ceee!');
    const revealSoundTimeout = window.setTimeout(() => {
      if (this.isPaused || this.currentState !== 'reveal') {
        return;
      }

      void this.playRevealPromptAudio(variant);
    }, REVEAL_SOUND_DELAY_MS);

    const revealAfterglowTimeout = window.setTimeout(() => {
      if (this.isPaused || this.currentState !== 'reveal') {
        return;
      }

      this.playRevealAfterglowAudio(variant);
    }, REVEAL_AFTERGLOW_DELAY_MS);

    this.timeoutIds.push(revealSoundTimeout, revealAfterglowTimeout);

    const runtime = window as Window & { __peekabooPromptLog?: string[] };
    runtime.__peekabooPromptLog = runtime.__peekabooPromptLog ?? [];
    runtime.__peekabooPromptLog.push(variant.prompt);

    const timeoutId = window.setTimeout(() => {
      this.enterReactState(triggeredByTap);
    }, REVEAL_MS);
    this.timeoutIds.push(timeoutId);
  }

  private enterReactState(triggeredByTap: boolean): void {
    if (this.isPaused) {
      return;
    }

    this.clearTimers();
    this.childReactionCount += 1;
    this.statusEl.textContent = triggeredByTap ? 'Anka seninle sevindi.' : 'Anka sevindi.';
    this.setState('react');
    this.rootEl.setAttribute('data-peek-reactions', String(this.childReactionCount));
    this.mascot.setMessage('Aferin.');
    this.playChildReactionAudio();

    const timeoutId = window.setTimeout(() => {
      this.cycleIndex += 1;
      this.enterIdleState();
    }, REACT_MS);
    this.timeoutIds.push(timeoutId);
  }

  private setState(nextState: PeekState): void {
    this.currentState = nextState;
    this.rootEl.setAttribute('data-peek-state', this.currentState);
    this.rootEl.setAttribute('data-peek-scene', this.currentScene);
    this.rootEl.setAttribute('data-hide-mode', this.currentHideMode);
    this.rootEl.setAttribute('data-current-hideout', this.currentHideout ?? '');
    this.rootEl.setAttribute('data-current-anchor', this.currentAnchor);
    this.rootEl.setAttribute('data-peek-sequence', this.currentSequence);
    this.rootEl.setAttribute('data-can-tap-reveal', String(nextState === 'wait' || (nextState === 'hide' && this.currentHideMode === 'environment')));
  }

  private getCyclePlan(cycleIndex: number): PeekCyclePlan {
    const openingPlan = this.getOpeningCyclePlan(cycleIndex);
    if (openingPlan) {
      return openingPlan;
    }

    return this.getLoopCyclePlan(cycleIndex - OPENING_SEQUENCE_LENGTH);
  }

  private getOpeningCyclePlan(cycleIndex: number): PeekCyclePlan | null {
    const openingPlans: PeekCyclePlan[] = [
      {
        scene: 'room',
        hideMode: 'self',
        anchor: 'window',
        idleMs: navigator.webdriver ? 280 : 760,
        scale: 1.08,
        rotate: 8,
        message: 'Anka uçuyor.'
      },
      {
        scene: 'center',
        hideMode: 'self',
        anchor: 'center',
        idleMs: navigator.webdriver ? 240 : 620,
        scale: 1.22,
        rotate: 0,
        message: 'Anka burada.',
        skipDrift: true
      },
      {
        scene: 'room',
        hideMode: 'environment',
        anchor: 'sofa',
        hideout: 'curtain',
        idleMs: navigator.webdriver ? 320 : 880,
        scale: 1.04,
        rotate: -6,
        message: 'Anka saklanacak.',
        skipDrift: true
      }
    ];

    return openingPlans[cycleIndex] ?? null;
  }

  private getLoopCyclePlan(loopIndex: number): PeekCyclePlan {
    const phase = loopIndex % 3;

    if (phase === 1) {
      return {
        scene: 'center',
        hideMode: 'self',
        anchor: 'center',
        idleMs: CENTER_IDLE_MS,
        scale: 1.2,
        rotate: 0,
        message: 'Anka burada.',
        skipDrift: true
      };
    }

    if (phase === 2) {
      const hideout = HIDEOUT_SEQUENCE[loopIndex % HIDEOUT_SEQUENCE.length];
      return {
        scene: 'room',
        hideMode: 'environment',
        anchor: hideout === 'curtain' ? 'window' : hideout === 'sofa' ? 'stage-left' : 'stage-right',
        hideout,
        idleMs: navigator.webdriver ? 420 : 1180,
        scale: 1.04,
        rotate: hideout === 'table' ? 8 : -8,
        message: 'Anka saklanacak.',
        skipDrift: true
      };
    }

    const anchor = ROOM_ROUTE[loopIndex % ROOM_ROUTE.length];
    return {
      scene: 'room',
      hideMode: 'self',
      anchor,
      idleMs: ROOM_IDLE_MS,
      scale: 1.02,
      rotate: -6 + (loopIndex % 3) * 6,
      message: 'Anka uçuyor.'
    };
  }

  private scheduleRoomDrift(): void {
    if (this.currentScene !== 'room') {
      return;
    }

    const hops = navigator.webdriver ? 1 : 2;
    for (let index = 0; index < hops; index += 1) {
      const timeoutId = window.setTimeout(() => {
        if (this.isPaused || this.currentState !== 'idle' || this.currentScene !== 'room') {
          return;
        }

        const nextAnchor = ROOM_ROUTE[(this.cycleIndex + index + 1) % ROOM_ROUTE.length];
        this.currentAnchor = nextAnchor;
        this.rootEl.setAttribute('data-current-anchor', nextAnchor);
        this.setPhoenixPosition(
          this.getAnchorPosition(nextAnchor),
          index === hops - 1 ? 1.08 : 1,
          index % 2 === 0 ? 8 : -8
        );
      }, navigator.webdriver ? 120 + index * 120 : 380 + index * 360);

      this.timeoutIds.push(timeoutId);
    }
  }

  private setPhoenixPosition(position: { x: number; y: number }, scale = 1, rotate = 0): void {
    this.phoenixShellEl.style.setProperty('--peek-x', `${position.x}px`);
    this.phoenixShellEl.style.setProperty('--peek-y', `${position.y}px`);
    this.phoenixShellEl.style.setProperty('--peek-scale', String(scale));
    this.phoenixShellEl.style.setProperty('--peek-rotate', `${rotate}deg`);
  }

  private getAnchorPosition(anchor: AnchorId): { x: number; y: number } {
    const stageRect = this.stageEl.getBoundingClientRect();
    const shellRect = this.phoenixShellEl.getBoundingClientRect();
    const shellWidth = shellRect.width || 150;
    const shellHeight = shellRect.height || 150;
    const percent = (x: number, y: number) => ({
      x: stageRect.width * x - shellWidth / 2,
      y: stageRect.height * y - shellHeight / 2
    });

    let position: { x: number; y: number };

    switch (anchor) {
      case 'center':
        position = percent(0.5, 0.43);
        break;
      case 'window':
        position = percent(0.5, 0.18);
        break;
      case 'toy':
        position = percent(0.2, 0.66);
        break;
      case 'lamp':
        position = percent(0.83, 0.28);
        break;
      case 'stage-left':
        position = percent(0.3, 0.36);
        break;
      case 'stage-right':
        position = percent(0.68, 0.38);
        break;
      case 'curtain':
      case 'sofa':
      case 'table': {
        const hideoutButton = this.getHideoutButton(anchor);
        if (!hideoutButton) {
          position = percent(0.5, 0.4);
          break;
        }

        const hideoutRect = hideoutButton.getBoundingClientRect();
        let x = hideoutRect.left - stageRect.left + hideoutRect.width / 2 - shellWidth / 2;
        let y = hideoutRect.top - stageRect.top + hideoutRect.height / 2 - shellHeight / 2;

        if (anchor === 'curtain') {
          x = hideoutRect.left - stageRect.left + hideoutRect.width * 0.12;
          y = hideoutRect.top - stageRect.top + hideoutRect.height * 0.1;
        } else if (anchor === 'sofa') {
          y = hideoutRect.top - stageRect.top - shellHeight * 0.06;
        } else if (anchor === 'table') {
          y = hideoutRect.top - stageRect.top - shellHeight * 0.16;
        }

        position = { x, y };
        break;
      }
      default:
        position = percent(0.5, 0.4);
    }

    return {
      x: Math.max(10, Math.min(position.x, stageRect.width - shellWidth - 10)),
      y: Math.max(16, Math.min(position.y, stageRect.height - shellHeight - 12))
    };
  }

  private getHideoutButton(hideout: HideoutId): HTMLButtonElement | null {
    return this.hideoutButtons.find((button) => button.dataset.hideout === hideout) ?? null;
  }

  private clearTimers(): void {
    while (this.timeoutIds.length > 0) {
      const timeoutId = this.timeoutIds.pop();
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId);
      }
    }
  }

  private refreshCustomAudioMap(): void {
    this.customAudioMap = loadCustomAudioMap();
  }

  private hasRecordingSupport(): boolean {
    return (
      typeof window.MediaRecorder !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  private getRevealAudioData(): string | null {
    return this.customAudioMap[PEEKABOO_REVEAL_AUDIO_KEY] ?? null;
  }

  private syncRevealAudioSupportState(): void {
    if (this.hasRecordingSupport()) {
      return;
    }

    this.revealRecordStartBtn.disabled = true;
    this.revealRecordStopBtn.disabled = true;
    this.revealStatusEl.textContent = 'Bu tarayicida Cee-ee kaydi desteklenmiyor.';
  }

  private syncRevealAudioState(message?: string): void {
    this.refreshCustomAudioMap();
    const hasRecording = Boolean(this.getRevealAudioData());
    const isRecording = this.mediaRecorder?.state === 'recording';
    const supported = this.hasRecordingSupport();

    this.rootEl.setAttribute('data-peek-custom-audio', String(hasRecording));
    this.revealRecordStartBtn.disabled = !supported || isRecording;
    this.revealRecordStopBtn.disabled = !isRecording;
    this.revealPlayBtn.disabled = isRecording || !hasRecording;
    this.revealDeleteBtn.disabled = isRecording || !hasRecording;

    if (message) {
      this.revealStatusEl.textContent = message;
      return;
    }

    if (!supported) {
      this.revealStatusEl.textContent = 'Bu tarayicida Cee-ee kaydi desteklenmiyor.';
      return;
    }

    if (isRecording) {
      this.revealStatusEl.textContent = 'Cee-ee kaydi aliniyor...';
      return;
    }

    this.revealStatusEl.textContent = hasRecording
      ? 'Kendi Cee-ee kaydiniz hazir.'
      : 'Varsayilan Ceee sesi aktif.';
  }

  private async startRevealRecording(): Promise<void> {
    if (!this.hasRecordingSupport()) {
      this.syncRevealAudioSupportState();
      return;
    }

    if (this.mediaRecorder?.state === 'recording') {
      this.syncRevealAudioState('Cee-ee kaydi zaten suruyor.');
      return;
    }

    try {
      this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordingChunks = [];
      this.mediaRecorder = new MediaRecorder(this.recordingStream);
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        void this.finalizeRevealRecording();
      };
      this.mediaRecorder.start();
      this.syncRevealAudioState('Cee-ee kaydi aliniyor...');
    } catch {
      this.cleanupRecordingResources();
      this.syncRevealAudioState('Mikrofon acilamadi. Tarayici izinlerini kontrol et.');
    }
  }

  private stopRevealRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      this.syncRevealAudioState('Aktif Cee-ee kaydi yok.');
      return;
    }

    this.mediaRecorder.stop();
    this.revealRecordStopBtn.disabled = true;
    this.revealStatusEl.textContent = 'Cee-ee kaydi isleniyor...';
  }

  private async finalizeRevealRecording(): Promise<void> {
    let statusMessage = 'Varsayilan Ceee sesi aktif.';

    try {
      const blob = new Blob(this.recordingChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
      if (blob.size === 0) {
        statusMessage = 'Bos kayit alindi, tekrar dene.';
        return;
      }

      const dataUrl = await this.blobToDataUrl(blob);
      this.customAudioMap[PEEKABOO_REVEAL_AUDIO_KEY] = dataUrl;
      saveCustomAudioMap(this.customAudioMap);
      statusMessage = 'Kendi Cee-ee kaydiniz hazir.';
    } finally {
      this.cleanupRecordingResources();
      this.syncRevealAudioState(statusMessage);
    }
  }

  private async playRevealRecordingPreview(): Promise<void> {
    this.syncRevealAudioState();
    const dataUrl = this.getRevealAudioData();
    if (!dataUrl) {
      this.syncRevealAudioState('Kayitli Cee-ee sesi yok.');
      return;
    }

    try {
      await this.playAudioDataUrl(dataUrl);
      this.syncRevealAudioState('Kendi Cee-ee kaydiniz caliniyor.');
    } catch {
      this.syncRevealAudioState('Cee-ee kaydi calinamadi.');
    }
  }

  private deleteRevealRecording(): void {
    this.syncRevealAudioState();
    if (!this.getRevealAudioData()) {
      this.syncRevealAudioState('Silinecek Cee-ee kaydi yok.');
      return;
    }

    delete this.customAudioMap[PEEKABOO_REVEAL_AUDIO_KEY];
    saveCustomAudioMap(this.customAudioMap);
    this.syncRevealAudioState('Kayitli Cee-ee sesi silindi. Varsayilan ses kullanilacak.');
  }

  private async playAudioDataUrl(dataUrl: string): Promise<void> {
    if (this.previewAudioEl) {
      this.previewAudioEl.pause();
      this.previewAudioEl.currentTime = 0;
    }

    const audio = new Audio(dataUrl);
    this.previewAudioEl = audio;
    audio.addEventListener(
      'ended',
      () => {
        if (this.previewAudioEl === audio) {
          this.previewAudioEl = null;
        }
      },
      { once: true }
    );

    await audio.play();
  }

  private async playRevealPromptAudio(variant: VoiceVariant): Promise<void> {
    const runtime = window as Window & { __peekabooSoundLog?: string[] };
    const customRevealAudio = this.getRevealAudioData();
    if (!customRevealAudio) {
      this.playRevealVoiceAudio(variant);
      this.speakLine(variant.prompt, variant.rate, variant.pitch, variant.volume);
      return;
    }

    runtime.__peekabooSoundLog = runtime.__peekabooSoundLog ?? [];
    runtime.__peekabooSoundLog.push('custom-ceee');

    try {
      await this.playAudioDataUrl(customRevealAudio);
    } catch {
      runtime.__peekabooSoundLog.push('custom-ceee-fallback');
      this.playRevealVoiceAudio(variant);
      this.speakLine(variant.prompt, variant.rate, variant.pitch, variant.volume);
    }
  }

  private speakLine(text: string, rate: number, pitch: number, volume: number): void {
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Optional voice guidance.
    }
  }

  private primeAudio(): AudioContext | null {
    if (!('AudioContext' in window)) {
      return null;
    }

    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch {
        return null;
      }
    }

    void this.audioContext.resume().catch(() => {
      // Ignore optional audio failures.
    });

    return this.audioContext;
  }

  private unlockAudio(): void {
    const context = this.primeAudio();
    if (!context || this.audioUnlocked) {
      return;
    }

    this.audioUnlocked = true;

    const start = context.currentTime + 0.01;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, start);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.0002, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.04);
  }

  private playHelloAudio(): void {
    const context = this.primeAudio();
    if (!context || context.state !== 'running') {
      return;
    }

    const start = context.currentTime + 0.02;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.16, start + 0.03);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.56);

    this.playTone(context, master, start, 620, 0.16, 'sine');
    this.playTone(context, master, start + 0.14, 840, 0.16, 'triangle');
  }

  private playHideAudio(): void {
    const context = this.primeAudio();
    if (!context || context.state !== 'running') {
      return;
    }

    const start = context.currentTime + 0.02;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

    this.playSweep(context, master, start, 980, 620, 0.18, 'triangle');
  }

  private playRevealVoiceAudio(variant: VoiceVariant): void {
    const runtime = window as Window & { __peekabooSoundLog?: string[] };
    runtime.__peekabooSoundLog = runtime.__peekabooSoundLog ?? [];
    runtime.__peekabooSoundLog.push('ceee');

    const context = this.primeAudio();
    if (!context || context.state !== 'running') {
      return;
    }

    const start = context.currentTime + 0.02;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.22, start + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.58);

    this.playTone(context, master, start, variant.tone, 0.14, 'triangle');
    this.playTone(context, master, start + 0.09, variant.chime, 0.18, 'sine');
    this.playSweep(context, master, start + 0.19, variant.tone * 0.9, variant.chime, 0.2, 'triangle');
  }

  private playRevealAfterglowAudio(variant: VoiceVariant): void {
    const runtime = window as Window & { __peekabooSoundLog?: string[] };
    runtime.__peekabooSoundLog = runtime.__peekabooSoundLog ?? [];
    runtime.__peekabooSoundLog.push('sparkle');
    runtime.__peekabooSoundLog.push('giggle');

    const context = this.primeAudio();
    if (!context || context.state !== 'running') {
      return;
    }

    const start = context.currentTime + 0.02;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.16, start + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);

    this.playTone(context, master, start, variant.chime * 0.88, 0.12, 'sine');
    this.playTone(context, master, start + 0.11, variant.chime * 1.08, 0.1, 'triangle');
    this.playTone(context, master, start + 0.21, variant.chime * 1.18, 0.08, 'sine');
    this.playSweep(context, master, start + 0.3, 420, 620, 0.2, 'triangle');
    this.playTone(context, master, start + 0.39, 540, 0.08, 'sine');
  }

  private playChildReactionAudio(): void {
    const runtime = window as Window & { __peekabooSoundLog?: string[] };
    runtime.__peekabooSoundLog = runtime.__peekabooSoundLog ?? [];
    runtime.__peekabooSoundLog.push('tap-giggle');

    const context = this.primeAudio();
    if (!context || context.state !== 'running') {
      return;
    }

    const start = context.currentTime + 0.02;
    const master = context.createGain();
    master.connect(context.destination);
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);

    this.playTone(context, master, start, 920, 0.08, 'triangle');
    this.playTone(context, master, start + 0.08, 1180, 0.11, 'sine');
    this.playTone(context, master, start + 0.18, 1040, 0.1, 'triangle');
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  private cleanupRecordingResources(): void {
    if (this.recordingStream) {
      for (const track of this.recordingStream.getTracks()) {
        track.stop();
      }
    }

    this.recordingStream = null;
    this.mediaRecorder = null;
    this.recordingChunks = [];
  }

  private playTone(
    context: AudioContext,
    destination: GainNode,
    start: number,
    frequency: number,
    duration: number,
    type: OscillatorType
  ): void {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.34, start + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gainNode);
    gainNode.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private playSweep(
    context: AudioContext,
    destination: GainNode,
    start: number,
    fromFrequency: number,
    toFrequency: number,
    duration: number,
    type: OscillatorType
  ): void {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(fromFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(toFrequency, start + duration);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.24, start + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gainNode);
    gainNode.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }
}
