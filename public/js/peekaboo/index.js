const HIDEOUT_SEQUENCE = ['curtain', 'sofa', 'table'];
const INITIAL_VISIBLE_MS = navigator.webdriver ? 420 : 1200;
const HIDE_WAIT_MS = navigator.webdriver ? 850 : 1500;
const REVEAL_VISIBLE_MS = navigator.webdriver ? 880 : 1800;
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
    isPaused = false;
    cycleIndex = 0;
    revealCount = 0;
    childReactionCount = 0;
    parentHoldTimeoutId = null;
    currentHideMode = 'self';
    currentHideout = null;
    currentState = 'idle';
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
        this.rootEl.setAttribute('data-hide-mode', 'self');
        this.rootEl.setAttribute('data-current-hideout', '');
        this.rootEl.setAttribute('data-peek-reveals', '0');
        this.rootEl.setAttribute('data-peek-reactions', '0');
        this.rootEl.setAttribute('data-can-tap-reveal', 'false');
        this.bindEvents();
    }
    start() {
        this.isPaused = false;
        this.clearTimers();
        this.setPhoenixPosition(this.getAnchorPosition('center'));
        this.enterVisiblePhase(true);
    }
    pause() {
        this.isPaused = true;
        this.clearTimers();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
    bindEvents() {
        this.rootEl.addEventListener('peekaboo-resume', () => {
            if (this.rootEl.classList.contains('active')) {
                this.start();
            }
        });
        this.rootEl.addEventListener('peekaboo-pause', () => {
            this.pause();
        });
        this.stageTapEl.addEventListener('click', () => {
            if (this.currentState === 'revealed') {
                this.handleChildReaction();
            }
        });
        this.hideoutButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const hideout = button.dataset.hideout;
                if (!hideout) {
                    return;
                }
                if (this.currentState === 'hidden' &&
                    this.currentHideMode === 'environment' &&
                    this.currentHideout === hideout) {
                    this.revealPhoenix(true);
                    return;
                }
                if (this.currentState === 'revealed') {
                    this.handleChildReaction();
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
    enterVisiblePhase(initial = false) {
        if (this.isPaused) {
            return;
        }
        this.currentState = 'visible';
        this.currentHideout = null;
        this.currentHideMode = this.cycleIndex % 2 === 0 ? 'self' : 'environment';
        this.rootEl.setAttribute('data-peek-state', this.currentState);
        this.rootEl.setAttribute('data-hide-mode', this.currentHideMode);
        this.rootEl.setAttribute('data-current-hideout', '');
        this.rootEl.setAttribute('data-can-tap-reveal', 'false');
        this.hideoutButtons.forEach((button) => button.classList.remove('is-active-hideout', 'is-tappable-hideout'));
        this.statusEl.textContent = 'Anka görünüyor.';
        this.mascot.setMessage(initial ? 'Cee oyunu.' : 'Anka yine geldi.');
        this.setPhoenixPosition(this.getAnchorPosition('center'));
        const timeoutId = window.setTimeout(() => {
            this.hidePhoenix();
        }, initial ? INITIAL_VISIBLE_MS : INITIAL_VISIBLE_MS + 160);
        this.timeoutIds.push(timeoutId);
    }
    hidePhoenix() {
        if (this.isPaused) {
            return;
        }
        this.currentState = 'hidden';
        this.rootEl.setAttribute('data-peek-state', this.currentState);
        this.statusEl.textContent = 'Anka saklandı.';
        if (this.currentHideMode === 'self') {
            this.rootEl.setAttribute('data-can-tap-reveal', 'false');
            this.mascot.setMessage('Anka saklandı.');
        }
        else {
            const hideout = HIDEOUT_SEQUENCE[this.cycleIndex % HIDEOUT_SEQUENCE.length];
            this.currentHideout = hideout;
            this.rootEl.setAttribute('data-current-hideout', hideout);
            this.rootEl.setAttribute('data-can-tap-reveal', 'true');
            const targetButton = this.getHideoutButton(hideout);
            targetButton?.classList.add('is-active-hideout', 'is-tappable-hideout');
            this.setPhoenixPosition(this.getAnchorPosition(hideout), 0.9);
            this.mascot.setMessage('Anka saklandı.');
        }
        const timeoutId = window.setTimeout(() => {
            this.revealPhoenix(false);
        }, HIDE_WAIT_MS + (this.currentHideMode === 'environment' && !navigator.webdriver ? 420 : 0));
        this.timeoutIds.push(timeoutId);
    }
    revealPhoenix(triggeredByTap) {
        if (this.isPaused) {
            return;
        }
        this.clearTimers();
        if (this.currentHideout) {
            this.getHideoutButton(this.currentHideout)?.classList.remove('is-active-hideout', 'is-tappable-hideout');
        }
        const revealAnchor = this.currentHideMode === 'environment' && this.currentHideout ? this.currentHideout : 'center';
        this.setPhoenixPosition(this.getAnchorPosition(revealAnchor), 1);
        this.currentState = 'revealed';
        this.revealCount += 1;
        this.rootEl.setAttribute('data-peek-state', this.currentState);
        this.rootEl.setAttribute('data-peek-reveals', String(this.revealCount));
        this.rootEl.setAttribute('data-can-tap-reveal', 'false');
        this.statusEl.textContent = triggeredByTap ? 'Anka ortaya çıktı.' : 'Ceee!';
        this.mascot.setMessage('Ceee!');
        this.playRevealAudio();
        const runtime = window;
        runtime.__peekabooPromptLog = runtime.__peekabooPromptLog ?? [];
        runtime.__peekabooPromptLog.push('Ceee!');
        if ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined') {
            const utterance = new SpeechSynthesisUtterance('Ceee!');
            utterance.lang = 'tr-TR';
            utterance.rate = 0.95;
            utterance.pitch = 1.18;
            utterance.volume = 0.9;
            try {
                window.speechSynthesis.speak(utterance);
            }
            catch {
                // Optional voice prompt.
            }
        }
        const timeoutId = window.setTimeout(() => {
            this.cycleIndex += 1;
            this.enterVisiblePhase();
        }, REVEAL_VISIBLE_MS);
        this.timeoutIds.push(timeoutId);
    }
    handleChildReaction() {
        this.childReactionCount += 1;
        this.rootEl.setAttribute('data-peek-reactions', String(this.childReactionCount));
        this.statusEl.textContent = 'Çocuk tepki verdi.';
        this.playChildReactionAudio();
        this.clearTimers();
        const timeoutId = window.setTimeout(() => {
            this.cycleIndex += 1;
            this.enterVisiblePhase();
        }, navigator.webdriver ? 220 : 520);
        this.timeoutIds.push(timeoutId);
    }
    setPhoenixPosition(position, scale = 1) {
        this.phoenixShellEl.style.setProperty('--peek-x', `${position.x}px`);
        this.phoenixShellEl.style.setProperty('--peek-y', `${position.y}px`);
        this.phoenixShellEl.style.setProperty('--peek-scale', String(scale));
    }
    getAnchorPosition(anchor) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const shellRect = this.phoenixShellEl.getBoundingClientRect();
        const shellWidth = shellRect.width || 110;
        const shellHeight = shellRect.height || 110;
        if (anchor === 'center') {
            return {
                x: stageRect.width / 2 - shellWidth / 2,
                y: Math.max(36, stageRect.height * 0.2)
            };
        }
        const hideoutButton = this.getHideoutButton(anchor);
        if (!hideoutButton) {
            return {
                x: stageRect.width / 2 - shellWidth / 2,
                y: Math.max(36, stageRect.height * 0.2)
            };
        }
        const hideoutRect = hideoutButton.getBoundingClientRect();
        let x = hideoutRect.left - stageRect.left + hideoutRect.width / 2 - shellWidth / 2;
        let y = hideoutRect.top - stageRect.top + hideoutRect.height * 0.12;
        if (anchor === 'curtain') {
            x = hideoutRect.left - stageRect.left + hideoutRect.width * 0.24;
            y = hideoutRect.top - stageRect.top + hideoutRect.height * 0.18;
        }
        else if (anchor === 'sofa') {
            y = hideoutRect.top - stageRect.top - shellHeight * 0.05;
        }
        else if (anchor === 'table') {
            y = hideoutRect.top - stageRect.top - shellHeight * 0.1;
        }
        return {
            x: Math.max(6, Math.min(x, stageRect.width - shellWidth - 6)),
            y: Math.max(10, Math.min(y, stageRect.height - shellHeight - 10))
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
    playRevealAudio() {
        const runtime = window;
        runtime.__peekabooSoundLog = runtime.__peekabooSoundLog ?? [];
        runtime.__peekabooSoundLog.push('ceee');
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
        master.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
        master.gain.exponentialRampToValueAtTime(0.0001, start + 0.82);
        this.playTone(context, master, start, 740, 0.12, 'triangle');
        this.playTone(context, master, start + 0.08, 980, 0.14, 'sine');
        this.playTone(context, master, start + 0.24, 660, 0.12, 'triangle');
        this.playSweep(context, master, start + 0.34, 620, 980, 0.22, 'triangle');
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
        this.playTone(context, master, start, 880, 0.1, 'sine');
        this.playTone(context, master, start + 0.08, 1120, 0.12, 'triangle');
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
        gainNode.gain.exponentialRampToValueAtTime(0.26, start + 0.04);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gainNode);
        gainNode.connect(destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.04);
    }
}
//# sourceMappingURL=index.js.map