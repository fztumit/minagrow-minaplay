const ROOM_ROUTE = ['window', 'toy', 'lamp', 'stage-left', 'sofa', 'stage-right', 'table'];
const HIDEOUT_SEQUENCE = ['curtain', 'sofa', 'table'];
const VOICE_VARIANTS = [
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
export class PeekabooModeModule {
    rootEl;
    stageEl;
    phoenixShellEl;
    stageTapEl;
    statusEl;
    parentTriggerBtn;
    parentHotspotEl;
    hideoutButtons;
    mascot;
    timeoutIds = [];
    audioContext = null;
    audioUnlocked = false;
    isPaused = false;
    hasStartedOnce = false;
    cycleIndex = 0;
    revealCount = 0;
    childReactionCount = 0;
    parentHoldTimeoutId = null;
    currentScene = 'room';
    currentHideMode = 'self';
    currentHideout = null;
    currentState = 'idle';
    currentAnchor = 'center';
    currentSequence = 'opening';
    voiceVariantIndex = 0;
    constructor(rootEl, mascot) {
        const stageEl = rootEl.querySelector('#peekaboo-stage');
        const phoenixShellEl = rootEl.querySelector('#peekaboo-phoenix-shell');
        const stageTapEl = rootEl.querySelector('#peekaboo-stage-tap');
        const statusEl = rootEl.querySelector('#peekaboo-status');
        const parentTriggerBtn = rootEl.querySelector('#peekaboo-parent-trigger');
        const parentHotspotEl = rootEl.querySelector('#peekaboo-parent-hotspot');
        const hideoutButtons = Array.from(rootEl.querySelectorAll('.peekaboo-hideout'));
        if (!stageEl || !phoenixShellEl || !stageTapEl || !statusEl || !parentTriggerBtn || !parentHotspotEl || hideoutButtons.length === 0) {
            throw new Error('Peekaboo module requires stage, phoenix shell, hideouts, status, and parent access elements.');
        }
        this.rootEl = rootEl;
        this.stageEl = stageEl;
        this.phoenixShellEl = phoenixShellEl;
        this.stageTapEl = stageTapEl;
        this.statusEl = statusEl;
        this.parentTriggerBtn = parentTriggerBtn;
        this.parentHotspotEl = parentHotspotEl;
        this.hideoutButtons = hideoutButtons;
        this.mascot = mascot;
    }
    init() {
        this.rootEl.setAttribute('data-peek-state', 'idle');
        this.rootEl.setAttribute('data-peek-scene', 'room');
        this.rootEl.setAttribute('data-hide-mode', 'self');
        this.rootEl.setAttribute('data-current-hideout', '');
        this.rootEl.setAttribute('data-peek-reveals', '0');
        this.rootEl.setAttribute('data-peek-reactions', '0');
        this.rootEl.setAttribute('data-can-tap-reveal', 'false');
        this.rootEl.setAttribute('data-current-anchor', 'center');
        this.rootEl.setAttribute('data-peek-sequence', 'opening');
        this.bindEvents();
    }
    start() {
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
    pause() {
        this.isPaused = true;
        this.clearTimers();
        this.hideoutButtons.forEach((button) => button.classList.remove('is-active-hideout', 'is-tappable-hideout'));
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
    bindEvents() {
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
                const hideout = button.dataset.hideout;
                if (!hideout) {
                    return;
                }
                if ((this.currentState === 'hide' || this.currentState === 'wait') &&
                    this.currentHideMode === 'environment' &&
                    this.currentHideout === hideout) {
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
    bindParentAccess() {
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
    playIntro() {
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
    enterIdleState(skipGreeting = false) {
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
        }
        else {
            this.statusEl.textContent = 'Anka ortada süzülüyor.';
            this.setPhoenixPosition(this.getAnchorPosition(this.currentAnchor), cyclePlan.scale, cyclePlan.rotate);
            this.mascot.setMessage(cyclePlan.message);
        }
        const timeoutId = window.setTimeout(() => {
            this.enterHideState();
        }, cyclePlan.idleMs);
        this.timeoutIds.push(timeoutId);
    }
    enterHideState() {
        if (this.isPaused) {
            return;
        }
        if (this.currentHideMode === 'environment') {
            const hideout = this.currentHideout ?? HIDEOUT_SEQUENCE[this.cycleIndex % HIDEOUT_SEQUENCE.length];
            this.currentHideout = hideout;
            this.currentAnchor = hideout;
            this.getHideoutButton(hideout)?.classList.add('is-active-hideout');
            this.setPhoenixPosition(this.getAnchorPosition(hideout), 0.9, 0);
        }
        else {
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
    enterWaitState() {
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
    enterRevealState(triggeredByTap) {
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
            this.playRevealVoiceAudio(variant);
            this.speakLine(variant.prompt, variant.rate, variant.pitch, variant.volume);
        }, REVEAL_SOUND_DELAY_MS);
        const revealAfterglowTimeout = window.setTimeout(() => {
            if (this.isPaused || this.currentState !== 'reveal') {
                return;
            }
            this.playRevealAfterglowAudio(variant);
        }, REVEAL_AFTERGLOW_DELAY_MS);
        this.timeoutIds.push(revealSoundTimeout, revealAfterglowTimeout);
        const runtime = window;
        runtime.__peekabooPromptLog = runtime.__peekabooPromptLog ?? [];
        runtime.__peekabooPromptLog.push(variant.prompt);
        const timeoutId = window.setTimeout(() => {
            this.enterReactState(triggeredByTap);
        }, REVEAL_MS);
        this.timeoutIds.push(timeoutId);
    }
    enterReactState(triggeredByTap) {
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
    setState(nextState) {
        this.currentState = nextState;
        this.rootEl.setAttribute('data-peek-state', this.currentState);
        this.rootEl.setAttribute('data-peek-scene', this.currentScene);
        this.rootEl.setAttribute('data-hide-mode', this.currentHideMode);
        this.rootEl.setAttribute('data-current-hideout', this.currentHideout ?? '');
        this.rootEl.setAttribute('data-current-anchor', this.currentAnchor);
        this.rootEl.setAttribute('data-peek-sequence', this.currentSequence);
        this.rootEl.setAttribute('data-can-tap-reveal', String(nextState === 'wait' || (nextState === 'hide' && this.currentHideMode === 'environment')));
    }
    getCyclePlan(cycleIndex) {
        const openingPlan = this.getOpeningCyclePlan(cycleIndex);
        if (openingPlan) {
            return openingPlan;
        }
        return this.getLoopCyclePlan(cycleIndex - OPENING_SEQUENCE_LENGTH);
    }
    getOpeningCyclePlan(cycleIndex) {
        const openingPlans = [
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
    getLoopCyclePlan(loopIndex) {
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
    scheduleRoomDrift() {
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
                this.setPhoenixPosition(this.getAnchorPosition(nextAnchor), index === hops - 1 ? 1.08 : 1, index % 2 === 0 ? 8 : -8);
            }, navigator.webdriver ? 120 + index * 120 : 380 + index * 360);
            this.timeoutIds.push(timeoutId);
        }
    }
    setPhoenixPosition(position, scale = 1, rotate = 0) {
        this.phoenixShellEl.style.setProperty('--peek-x', `${position.x}px`);
        this.phoenixShellEl.style.setProperty('--peek-y', `${position.y}px`);
        this.phoenixShellEl.style.setProperty('--peek-scale', String(scale));
        this.phoenixShellEl.style.setProperty('--peek-rotate', `${rotate}deg`);
    }
    getAnchorPosition(anchor) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const shellRect = this.phoenixShellEl.getBoundingClientRect();
        const shellWidth = shellRect.width || 150;
        const shellHeight = shellRect.height || 150;
        const percent = (x, y) => ({
            x: stageRect.width * x - shellWidth / 2,
            y: stageRect.height * y - shellHeight / 2
        });
        let position;
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
                }
                else if (anchor === 'sofa') {
                    y = hideoutRect.top - stageRect.top - shellHeight * 0.06;
                }
                else if (anchor === 'table') {
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
    getHideoutButton(hideout) {
        return this.hideoutButtons.find((button) => button.dataset.hideout === hideout) ?? null;
    }
    clearTimers() {
        while (this.timeoutIds.length > 0) {
            const timeoutId = this.timeoutIds.pop();
            if (typeof timeoutId === 'number') {
                window.clearTimeout(timeoutId);
            }
        }
    }
    speakLine(text, rate, pitch, volume) {
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
        }
        catch {
            // Optional voice guidance.
        }
    }
    primeAudio() {
        if (!('AudioContext' in window)) {
            return null;
        }
        if (!this.audioContext) {
            try {
                this.audioContext = new AudioContext();
            }
            catch {
                return null;
            }
        }
        void this.audioContext.resume().catch(() => {
            // Ignore optional audio failures.
        });
        return this.audioContext;
    }
    unlockAudio() {
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
    playHelloAudio() {
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
    playHideAudio() {
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
    playRevealVoiceAudio(variant) {
        const runtime = window;
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
    playRevealAfterglowAudio(variant) {
        const runtime = window;
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
    playChildReactionAudio() {
        const runtime = window;
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
    playTone(context, destination, start, frequency, duration, type) {
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
    playSweep(context, destination, start, fromFrequency, toFrequency, duration, type) {
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
//# sourceMappingURL=index.js.map