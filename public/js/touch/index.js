import { VOCABULARY } from '../data/vocabulary.js';
import { getAllWordProfiles } from '../data/wordProfiles.js';
import { getTopSentenceListens, getWordListenCount, incrementWordListen } from '../progress/listening.js';
import { loadCustomAudioMap, normalizeSpeechKey } from '../speech/customAudio.js';
const SETTINGS_STORAGE_KEY = 'konusu_yorum_speech_settings_v1';
const SHARED_SPEECH_DATA_EVENT = 'speech-shared-data-updated';
const GUIDE_REMINDER_DELAY_MS = navigator.webdriver ? 4800 : 9400;
const GUIDE_REMINDER_VARIANCE_MS = navigator.webdriver ? 0 : 2400;
const GUIDE_REMINDER_RETRY_MS = navigator.webdriver ? 300 : 1800;
const GUIDE_TRAVEL_MS = 720;
const TOUCH_SCENE_VOCABULARY = VOCABULARY.filter((item) => item.featuredOnScene);
const GUIDE_WAIT_PROMPTS = {
    su: 'Ben suyun yanında bekliyorum.',
    baba: 'Ben babanın yanında bekliyorum.',
    top: 'Ben topun yanında bekliyorum.',
    araba: 'Ben arabanın yanında bekliyorum.',
    elma: 'Ben elmanın yanında bekliyorum.'
};
const GUIDE_WORD_ANCHORS = {
    su: { xAlign: 'center', yAlign: 'top', xShift: 0, yShift: -6 },
    baba: { xAlign: 'center', yAlign: 'top', xShift: 0, yShift: -8 },
    top: { xAlign: 'center', yAlign: 'top', xShift: 0, yShift: -8 },
    araba: { xAlign: 'center', yAlign: 'top', xShift: 0, yShift: -8 },
    elma: { xAlign: 'center', yAlign: 'top', xShift: 0, yShift: -8 }
};
export class TouchGameModule {
    rootEl;
    stageEl;
    gridEl;
    guideLayerEl;
    guideMascotEl;
    feedbackEl;
    waterFocusOverlayEl;
    mascot;
    repeatModeSelect;
    settings = {
        repeatMode: 'default'
    };
    customAudioMap = {};
    activeNextButton = null;
    timeoutIds = [];
    sequenceTimeoutIds = [];
    guideTimeoutId = null;
    visualResetTimeoutId = null;
    waterFocusTimeoutId = null;
    guideMotionResetTimeoutId = null;
    idleReminderTimeoutId = null;
    attentionResetTimeoutId = null;
    attentionEffectIndex = 0;
    attentionEffectBag = [];
    idleReminderCount = 0;
    sceneAudioContext = null;
    targetSequence = [];
    targetSequenceIndex = 0;
    constructor(rootEl, mascot, controlsRootEl = rootEl) {
        const stageEl = rootEl.querySelector('#touch-stage');
        const gridEl = rootEl.querySelector('#touch-grid');
        const guideLayerEl = rootEl.querySelector('#touch-guide-layer');
        const guideMascotEl = rootEl.querySelector('#touch-guide-mascot');
        const feedbackEl = rootEl.querySelector('#touch-feedback');
        const waterFocusOverlayEl = rootEl.querySelector('#touch-water-focus-overlay');
        const repeatModeSelect = controlsRootEl.querySelector('#speech-repeat-mode');
        if (!stageEl || !gridEl || !guideLayerEl || !guideMascotEl || !feedbackEl || !waterFocusOverlayEl) {
            throw new Error('Touch module requires stage, grid, guide, feedback, and water overlay elements.');
        }
        this.rootEl = rootEl;
        this.stageEl = stageEl;
        this.gridEl = gridEl;
        this.guideLayerEl = guideLayerEl;
        this.guideMascotEl = guideMascotEl;
        this.feedbackEl = feedbackEl;
        this.waterFocusOverlayEl = waterFocusOverlayEl;
        this.mascot = mascot;
        this.repeatModeSelect = repeatModeSelect;
    }
    init() {
        this.loadSettings();
        this.renderCards(this.getSceneProfiles());
        this.bindEvents();
        this.bindGuideLifecycleEvents();
        this.bindSettingsEvents();
        this.refreshCustomAudioMap();
        this.rootEl.setAttribute('data-last-word', '');
        this.rootEl.setAttribute('data-water-spilled', 'false');
        this.rootEl.setAttribute('data-water-expanded', 'false');
        this.rootEl.setAttribute('data-next-word', '');
        this.rootEl.setAttribute('data-guide-prompt', '');
        this.rootEl.setAttribute('data-guide-active', 'false');
        this.rootEl.setAttribute('data-guide-mode', 'idle');
        this.rootEl.setAttribute('data-scene-phase', 'intro');
        this.rootEl.setAttribute('data-peek-mode', 'none');
        this.rootEl.setAttribute('data-current-target', '');
        this.rootEl.setAttribute('data-guided-target', '');
        this.rootEl.setAttribute('data-focused-word', '');
        this.rootEl.setAttribute('data-attention-strength', '1');
        this.rootEl.setAttribute('data-active-level', 'classic');
        this.rootEl.setAttribute('data-active-set', 'featured-scene');
        this.rootEl.setAttribute('data-auto-progress', 'false');
        this.rootEl.setAttribute('data-set-completion', '');
        this.syncMetricsToDom();
        window.addEventListener('word-profiles-updated', () => {
            this.handleWordProfilesUpdated();
        });
        window.addEventListener(SHARED_SPEECH_DATA_EVENT, () => {
            this.syncMetricsToDom();
        });
        window.requestAnimationFrame(() => {
            if (document.body.getAttribute('data-active-view') === 'speech') {
                this.startIntroSequence();
            }
            else {
                this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
            }
        });
    }
    renderCards(vocabulary) {
        this.gridEl.innerHTML = vocabulary
            .map((item) => {
            if (item.word === 'su') {
                return `
            <button
              class="word-card ${item.sceneClass ?? ''}"
              type="button"
              data-word-id="${item.word}"
              data-word-label="${this.escapeHtml(item.label)}"
              data-repeats="${item.repeats}"
              aria-label="${this.escapeHtml(item.label)}"
            >
              <div class="word-illustration water-visual" aria-hidden="true">
                <img class="water-glass-image" src="${this.escapeHtml(item.imageSrc || '/assets/water-glass.svg')}" alt="" />
                <div class="water-glass-shimmer"></div>
                <div class="spill-stream"></div>
                <div class="spill-pool"></div>
              </div>
              <span class="visually-hidden">${this.escapeHtml(item.label)}</span>
            </button>
          `;
            }
            return `
          <button
            class="word-card ${item.sceneClass ?? ''}"
            type="button"
            data-word-id="${item.word}"
            data-word-label="${this.escapeHtml(item.label)}"
            data-repeats="${item.repeats}"
            aria-label="${this.escapeHtml(item.label)}"
          >
            <div class="word-illustration" aria-hidden="true">
              ${item.imageSrc ? `<img class="word-object-image" src="${this.escapeHtml(item.imageSrc)}" alt="" />` : '<span class="word-object-fallback">?</span>'}
            </div>
            <span class="visually-hidden">${this.escapeHtml(item.label)}</span>
          </button>
        `;
        })
            .join('');
    }
    getSceneProfiles() {
        return getAllWordProfiles(TOUCH_SCENE_VOCABULARY);
    }
    handleWordProfilesUpdated() {
        const previousActiveWordId = this.activeNextButton?.dataset.wordId;
        this.renderCards(this.getSceneProfiles());
        this.resetTargetSequence(previousActiveWordId);
        this.syncMetricsToDom();
        const restoredButton = (previousActiveWordId
            ? Array.from(this.gridEl.querySelectorAll('.word-card')).find((button) => button.dataset.wordId === previousActiveWordId)
            : null) ?? this.gridEl.querySelector('.word-card');
        if (!restoredButton) {
            return;
        }
        this.clearCurrentNextTarget();
        this.activeNextButton = restoredButton;
        restoredButton.classList.add('is-next-target');
        restoredButton.setAttribute('data-next-target', 'true');
        this.rootEl.setAttribute('data-next-word', restoredButton.dataset.wordLabel ?? '');
        this.rootEl.setAttribute('data-current-target', restoredButton.dataset.wordId ?? '');
        this.rootEl.setAttribute('data-guided-target', restoredButton.dataset.wordId ?? '');
        this.rootEl.setAttribute('data-focused-word', restoredButton.dataset.wordId ?? '');
        this.setCardsInteractive(restoredButton);
        this.placeGuideMascot(restoredButton);
    }
    bindEvents() {
        this.gridEl.addEventListener('click', (event) => {
            const target = event.target.closest('.word-card');
            if (!target || this.rootEl.getAttribute('data-scene-phase') !== 'awaiting-tap') {
                return;
            }
            const wordId = target.dataset.wordId;
            const wordLabel = target.dataset.wordLabel ?? '';
            const defaultRepeats = Number(target.dataset.repeats ?? 1);
            if (!wordId || !wordLabel || Number.isNaN(defaultRepeats)) {
                return;
            }
            if (target === this.activeNextButton) {
                this.onTargetTapped(target, wordId, wordLabel, defaultRepeats);
                return;
            }
            this.onExploratoryTap(target, wordId, wordLabel, defaultRepeats);
        });
    }
    bindGuideLifecycleEvents() {
        this.rootEl.addEventListener('speech-guidance-pause', () => {
            this.clearPendingSpeech();
            this.clearPendingGuidance();
            this.clearIdleReminder();
            this.clearAttentionState();
            this.clearSequenceTimeouts();
            this.rootEl.setAttribute('data-guide-active', 'false');
            this.rootEl.setAttribute('data-guide-prompt', '');
        });
        this.rootEl.addEventListener('speech-guidance-resume', () => {
            if (!this.activeNextButton) {
                this.startIntroSequence();
                return;
            }
            this.placeGuideMascot(this.activeNextButton);
            this.rootEl.setAttribute('data-guide-active', 'true');
            this.rootEl.setAttribute('data-guide-prompt', 'Şimdi buna dokun');
            this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
            this.setCardsInteractive(this.activeNextButton);
            this.scheduleIdleReminder(this.activeNextButton);
        });
    }
    bindSettingsEvents() {
        this.repeatModeSelect?.addEventListener('change', () => {
            this.settings.repeatMode = this.normalizeRepeatMode(this.repeatModeSelect?.value);
            this.saveSettings();
            this.rootEl.setAttribute('data-repeat-mode', this.settings.repeatMode);
        });
    }
    onTargetTapped(button, wordId, wordLabel, defaultRepeats) {
        this.idleReminderCount = 0;
        this.rootEl.setAttribute('data-last-word', wordLabel);
        this.rootEl.setAttribute('data-scene-phase', 'playing');
        this.clearPendingSpeech();
        this.clearPendingGuidance();
        this.clearIdleReminder();
        this.clearAttentionState();
        this.clearSequenceTimeouts();
        this.setCardsInteractive(null);
        this.clearCurrentNextTarget();
        const repeats = this.resolveRepeats(defaultRepeats);
        const visualDuration = this.triggerVisual(button, wordId);
        const soundEffectDuration = this.playObjectSound(wordId);
        const speechDuration = this.triggerSpeech({ word: wordLabel, repeats });
        const sequenceDuration = Math.max(visualDuration, soundEffectDuration, speechDuration);
        const nextButton = this.getNextButton(wordId);
        const celebrateTimeoutId = window.setTimeout(() => {
            this.triggerMascotCelebrate();
            this.mascot.sayPraise();
        }, sequenceDuration);
        this.sequenceTimeoutIds.push(celebrateTimeoutId);
        this.scheduleGuidedTransition(button, nextButton, sequenceDuration);
    }
    onExploratoryTap(button, wordId, wordLabel, defaultRepeats) {
        if (!this.activeNextButton) {
            return;
        }
        this.idleReminderCount = 0;
        this.rootEl.setAttribute('data-last-word', wordLabel);
        this.rootEl.setAttribute('data-scene-phase', 'playing');
        this.clearPendingSpeech();
        this.clearIdleReminder();
        this.clearAttentionState();
        button.classList.remove('is-wrong');
        void button.offsetWidth;
        button.classList.add('is-wrong');
        const repeats = this.resolveRepeats(defaultRepeats);
        const visualDuration = this.triggerVisual(button, wordId);
        const soundEffectDuration = this.playObjectSound(wordId);
        const speechDuration = this.triggerSpeech({ word: wordLabel, repeats });
        const resetDelay = Math.max(visualDuration, soundEffectDuration, speechDuration);
        this.feedbackEl.textContent = 'Pofi doğru resmi tekrar gösteriyor.';
        this.rootEl.setAttribute('data-guide-mode', 'calm');
        this.rootEl.setAttribute('data-guide-prompt', 'Bir daha deneyelim');
        this.mascot.showCalm('Bir daha deneyelim.');
        const resetTimeoutId = window.setTimeout(() => {
            button.classList.remove('is-wrong');
            if (!this.activeNextButton) {
                return;
            }
            this.placeGuideMascot(this.activeNextButton);
            this.rootEl.setAttribute('data-guide-mode', 'idle');
            this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
            this.rootEl.setAttribute('data-guide-prompt', 'Şimdi buna dokun');
            this.scheduleIdleReminder(this.activeNextButton);
        }, resetDelay + 220);
        this.sequenceTimeoutIds.push(resetTimeoutId);
    }
    startIntroSequence() {
        const firstButton = this.getInitialTargetButton();
        if (!firstButton) {
            return;
        }
        this.setCardsInteractive(null);
        this.clearCurrentNextTarget();
        this.rootEl.setAttribute('data-scene-phase', 'intro');
        this.rootEl.setAttribute('data-guide-active', 'true');
        this.rootEl.setAttribute('data-guide-prompt', 'Hadi oynayalım');
        this.feedbackEl.textContent = 'Oyun başlıyor.';
        this.placeGuideMascotAtCenter();
        this.mascot.sayPlayStart();
        const timeoutId = window.setTimeout(() => {
            this.revealTarget(firstButton);
        }, 460);
        this.sequenceTimeoutIds.push(timeoutId);
    }
    revealTarget(targetButton) {
        this.idleReminderCount = 0;
        this.clearCurrentNextTarget();
        this.activeNextButton = targetButton;
        targetButton.classList.add('is-next-target');
        targetButton.setAttribute('data-next-target', 'true');
        this.setCardsInteractive(targetButton);
        this.rootEl.setAttribute('data-next-word', targetButton.dataset.wordLabel ?? '');
        this.rootEl.setAttribute('data-current-target', targetButton.dataset.wordId ?? '');
        this.rootEl.setAttribute('data-guided-target', targetButton.dataset.wordId ?? '');
        this.rootEl.setAttribute('data-focused-word', targetButton.dataset.wordId ?? '');
        this.rootEl.setAttribute('data-guide-prompt', 'Şimdi buna dokun');
        this.rootEl.setAttribute('data-guide-active', 'true');
        this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
        this.feedbackEl.textContent = 'Hedef nesne hazır.';
        this.placeGuideMascot(targetButton);
        this.mascot.showIdle('Şimdi buna dokun');
        this.mascot.sayNextPrompt();
        this.scheduleIdleReminder(targetButton);
    }
    scheduleGuidedTransition(currentButton, nextButton, delayMs) {
        if (!nextButton) {
            return;
        }
        this.guideTimeoutId = window.setTimeout(() => {
            this.clearCurrentNextTarget();
            this.setCardsInteractive(null);
            this.rootEl.setAttribute('data-scene-phase', 'transition');
            this.moveGuideMascot(currentButton, nextButton);
            this.feedbackEl.textContent = 'Yeni hedefe geçiliyor.';
            const revealTimeoutId = window.setTimeout(() => {
                this.revealTarget(nextButton);
            }, GUIDE_TRAVEL_MS - 80);
            this.sequenceTimeoutIds.push(revealTimeoutId);
            this.guideTimeoutId = null;
        }, delayMs);
    }
    scheduleIdleReminder(targetButton, delayMs) {
        this.clearIdleReminder();
        if (!targetButton) {
            return;
        }
        const resolvedDelay = delayMs ??
            (GUIDE_REMINDER_DELAY_MS + Math.round(Math.random() * GUIDE_REMINDER_VARIANCE_MS));
        this.idleReminderTimeoutId = window.setTimeout(() => {
            if (!this.activeNextButton || this.activeNextButton !== targetButton) {
                return;
            }
            if (!this.rootEl.classList.contains('active') || document.visibilityState !== 'visible') {
                this.scheduleIdleReminder(targetButton, GUIDE_REMINDER_RETRY_MS);
                return;
            }
            this.idleReminderCount += 1;
            this.runAttentionSequence(targetButton, this.idleReminderCount >= 2);
            this.scheduleIdleReminder(targetButton);
        }, resolvedDelay);
    }
    runAttentionSequence(targetButton, sleepyFirst = false) {
        const target = this.resolveGuidePosition(targetButton);
        const prompt = this.buildGuideWaitPrompt(targetButton.dataset.wordId);
        const effect = this.getNextAttentionEffect();
        const sleepyLeadMs = sleepyFirst ? 880 : 0;
        const attentionStrength = Math.min(3, Math.max(1, this.idleReminderCount));
        const attentionScale = Math.min(1.28, 1.08 + attentionStrength * 0.05);
        this.clearAttentionState();
        this.guideLayerEl.classList.add('is-active');
        this.guideLayerEl.classList.remove('is-attention', 'is-sleepy');
        targetButton.classList.remove('is-attention-target');
        void this.guideLayerEl.offsetWidth;
        this.setGuideTransform(target.x, target.y, sleepyFirst ? 0.98 : 1.12);
        this.rootEl.setAttribute('data-guide-active', 'true');
        this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
        this.rootEl.setAttribute('data-attention-strength', String(attentionStrength));
        if (sleepyFirst) {
            this.guideLayerEl.classList.add('is-sleepy');
            this.rootEl.setAttribute('data-guide-mode', 'sleepy');
            this.rootEl.setAttribute('data-guide-prompt', 'Pofi biraz uyukladı');
            this.feedbackEl.textContent = 'Pofi biraz uyukladı.';
            this.mascot.showSleepy('Pofi biraz uyukladı.');
        }
        const attentionTimeoutId = window.setTimeout(() => {
            if (this.activeNextButton !== targetButton) {
                return;
            }
            this.guideLayerEl.classList.remove('is-sleepy');
            this.guideLayerEl.classList.add('is-attention');
            this.guideLayerEl.dataset.attentionEffect = effect;
            targetButton.classList.add('is-attention-target');
            this.setGuideTransform(target.x, target.y, attentionScale);
            this.rootEl.setAttribute('data-guide-mode', 'attention');
            this.rootEl.setAttribute('data-guide-prompt', prompt);
            this.feedbackEl.textContent = prompt;
            this.mascot.sayAttention(prompt);
            this.attentionResetTimeoutId = window.setTimeout(() => {
                if (this.activeNextButton === targetButton) {
                    targetButton.classList.remove('is-attention-target');
                }
                this.guideLayerEl.classList.remove('is-attention');
                delete this.guideLayerEl.dataset.attentionEffect;
                this.setGuideTransform(target.x, target.y, 1);
                this.rootEl.setAttribute('data-guide-mode', 'idle');
                this.rootEl.setAttribute('data-attention-strength', '1');
                this.attentionResetTimeoutId = null;
            }, 1550);
        }, sleepyLeadMs);
        this.sequenceTimeoutIds.push(attentionTimeoutId);
    }
    triggerMascotCelebrate() {
        this.clearAttentionState();
        this.guideLayerEl.classList.remove('is-celebrating');
        void this.guideLayerEl.offsetWidth;
        this.guideLayerEl.classList.add('is-celebrating');
        this.rootEl.setAttribute('data-guide-mode', 'celebrate');
        const timeoutId = window.setTimeout(() => {
            this.guideLayerEl.classList.remove('is-celebrating');
            this.rootEl.setAttribute('data-guide-mode', 'idle');
        }, 760);
        this.sequenceTimeoutIds.push(timeoutId);
    }
    triggerVisual(button, word) {
        const duration = word === 'su' ? 1600 : 820;
        if (this.visualResetTimeoutId !== null) {
            window.clearTimeout(this.visualResetTimeoutId);
            this.visualResetTimeoutId = null;
        }
        button.classList.remove('is-speaking');
        void button.offsetWidth;
        button.classList.add('is-speaking');
        this.visualResetTimeoutId = window.setTimeout(() => {
            button.classList.remove('is-speaking');
            this.visualResetTimeoutId = null;
        }, duration);
        if (word !== 'su') {
            return duration;
        }
        this.rootEl.setAttribute('data-water-spilled', 'true');
        button.classList.remove('is-spilling');
        void button.offsetWidth;
        button.classList.add('is-spilling');
        this.triggerWaterFocusVisual();
        window.setTimeout(() => {
            button.classList.remove('is-spilling');
        }, 1100);
        return duration;
    }
    triggerWaterFocusVisual() {
        if (this.waterFocusTimeoutId !== null) {
            window.clearTimeout(this.waterFocusTimeoutId);
            this.waterFocusTimeoutId = null;
        }
        this.rootEl.setAttribute('data-water-expanded', 'true');
        this.waterFocusOverlayEl.classList.remove('is-active', 'is-spilling');
        void this.waterFocusOverlayEl.offsetWidth;
        this.waterFocusOverlayEl.classList.add('is-active', 'is-spilling');
        this.waterFocusTimeoutId = window.setTimeout(() => {
            this.waterFocusOverlayEl.classList.remove('is-active', 'is-spilling');
            this.rootEl.setAttribute('data-water-expanded', 'false');
            this.waterFocusTimeoutId = null;
        }, 2600);
    }
    triggerSpeech(payload) {
        this.refreshCustomAudioMap();
        const key = normalizeSpeechKey(payload.word);
        const customAudioData = this.customAudioMap[key] ?? null;
        this.feedbackEl.textContent = `Kelime: ${payload.word.toLocaleUpperCase('tr-TR')} (${payload.repeats} tekrar)`;
        const waitBetweenRepeatsMs = customAudioData ? 1100 : 620;
        for (let index = 0; index < payload.repeats; index += 1) {
            const timeoutId = window.setTimeout(() => {
                this.speakOnce(payload.word, customAudioData);
            }, waitBetweenRepeatsMs * index);
            this.timeoutIds.push(timeoutId);
        }
        this.rootEl.dispatchEvent(new CustomEvent('speech-trigger', { detail: payload }));
        return waitBetweenRepeatsMs * Math.max(0, payload.repeats - 1) + (customAudioData ? 900 : 760);
    }
    speakOnce(word, customAudioData) {
        const runtime = window;
        runtime.__speechLog = runtime.__speechLog ?? [];
        runtime.__speechLog.push(word);
        if (customAudioData) {
            incrementWordListen(word);
            this.playAudioDataUrl(customAudioData);
            this.syncMetricsToDom();
            this.notifySharedSpeechDataUpdated();
            return;
        }
        this.speakWithTts(word);
    }
    speakWithTts(word) {
        if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
            return;
        }
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.82;
        utterance.pitch = 1.02;
        utterance.volume = 0.88;
        try {
            window.speechSynthesis.speak(utterance);
        }
        catch {
            // Keep guidance alive even if TTS fails.
        }
    }
    clearPendingSpeech() {
        for (const timeoutId of this.timeoutIds) {
            window.clearTimeout(timeoutId);
        }
        this.timeoutIds = [];
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
    clearPendingGuidance() {
        if (this.guideTimeoutId !== null) {
            window.clearTimeout(this.guideTimeoutId);
            this.guideTimeoutId = null;
        }
        this.rootEl.setAttribute('data-guide-prompt', '');
    }
    clearSequenceTimeouts() {
        while (this.sequenceTimeoutIds.length > 0) {
            const timeoutId = this.sequenceTimeoutIds.pop();
            if (typeof timeoutId === 'number') {
                window.clearTimeout(timeoutId);
            }
        }
        this.guideLayerEl.classList.remove('is-celebrating', 'is-peek-hide', 'is-environment-hide');
    }
    clearIdleReminder() {
        if (this.idleReminderTimeoutId !== null) {
            window.clearTimeout(this.idleReminderTimeoutId);
            this.idleReminderTimeoutId = null;
        }
    }
    clearAttentionState() {
        this.guideLayerEl.classList.remove('is-attention', 'is-sleepy');
        this.activeNextButton?.classList.remove('is-attention-target');
        delete this.guideLayerEl.dataset.attentionEffect;
        this.rootEl.setAttribute('data-attention-strength', '1');
        if (this.attentionResetTimeoutId !== null) {
            window.clearTimeout(this.attentionResetTimeoutId);
            this.attentionResetTimeoutId = null;
        }
        if (this.guideMotionResetTimeoutId !== null) {
            window.clearTimeout(this.guideMotionResetTimeoutId);
            this.guideMotionResetTimeoutId = null;
        }
        if (this.rootEl.getAttribute('data-scene-phase') !== 'playing') {
            this.rootEl.setAttribute('data-guide-mode', 'idle');
        }
    }
    clearCurrentNextTarget() {
        if (this.activeNextButton) {
            this.activeNextButton.classList.remove('is-next-target', 'is-attention-target', 'is-choice-enabled', 'is-wrong');
            this.activeNextButton.removeAttribute('data-next-target');
            this.activeNextButton = null;
        }
        Array.from(this.gridEl.querySelectorAll('.word-card')).forEach((button) => {
            button.classList.remove('is-choice-enabled', 'is-wrong');
        });
        this.rootEl.setAttribute('data-next-word', '');
        this.rootEl.setAttribute('data-current-target', '');
        this.rootEl.setAttribute('data-guided-target', '');
        this.rootEl.setAttribute('data-focused-word', '');
        this.rootEl.setAttribute('data-guide-active', 'false');
        this.idleReminderCount = 0;
    }
    moveGuideMascot(currentButton, nextButton) {
        const from = this.resolveGuidePosition(currentButton);
        const to = this.resolveGuidePosition(nextButton);
        this.clearAttentionState();
        this.guideLayerEl.classList.add('is-active');
        this.setGuideTransform(from.x, from.y, 0.84);
        this.rootEl.setAttribute('data-guide-mode', 'travel');
        void this.guideMascotEl.offsetWidth;
        window.requestAnimationFrame(() => {
            this.setGuideTransform(to.x, to.y, 1);
        });
        this.guideMotionResetTimeoutId = window.setTimeout(() => {
            this.rootEl.setAttribute('data-guide-mode', 'idle');
            this.guideMotionResetTimeoutId = null;
        }, 760);
    }
    placeGuideMascot(button) {
        const target = this.resolveGuidePosition(button);
        this.guideLayerEl.classList.add('is-active');
        this.setGuideTransform(target.x, target.y, 1);
        this.rootEl.setAttribute('data-guide-mode', 'idle');
    }
    placeGuideMascotAtCenter() {
        const stageRect = this.stageEl.getBoundingClientRect();
        const mascotSize = this.guideMascotEl.getBoundingClientRect().width || 88;
        const x = stageRect.width / 2 - mascotSize / 2;
        const y = Math.max(18, stageRect.height * 0.08);
        this.guideLayerEl.classList.add('is-active');
        this.setGuideTransform(x, y, 1);
    }
    resolveGuidePosition(button) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const mascotSize = this.guideMascotEl.getBoundingClientRect().width || 84;
        const wordId = button.dataset.wordId;
        const anchor = (wordId ? GUIDE_WORD_ANCHORS[wordId] : null) ?? {
            xAlign: 'center',
            yAlign: 'top',
            xShift: 0,
            yShift: 0
        };
        const x = buttonRect.left - stageRect.left + buttonRect.width / 2 - mascotSize / 2 + (anchor.xShift ?? 0);
        const y = buttonRect.top - stageRect.top - mascotSize * 0.46 + (anchor.yShift ?? 0);
        const safeInsetX = 20;
        const safeInsetY = 18;
        return {
            x: Math.max(safeInsetX, Math.min(x, Math.max(safeInsetX, stageRect.width - mascotSize - safeInsetX))),
            y: Math.max(safeInsetY, Math.min(y, Math.max(safeInsetY, stageRect.height - mascotSize - safeInsetY)))
        };
    }
    setGuideTransform(x, y, scale) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const mascotSize = this.guideMascotEl.getBoundingClientRect().width || 84;
        const guideLift = Number.parseFloat(getComputedStyle(this.guideMascotEl).getPropertyValue('--guide-y-lift')) || 0;
        const safeX = 18;
        const safeTop = 20;
        const safeBottom = 14;
        const clampedX = Math.max(safeX, Math.min(x, Math.max(safeX, stageRect.width - mascotSize - safeX)));
        const minY = safeTop - guideLift;
        const maxY = stageRect.height - mascotSize - safeBottom - guideLift;
        const clampedY = Math.max(minY, Math.min(y, Math.max(minY, maxY)));
        this.guideMascotEl.style.setProperty('--guide-x', `${clampedX}px`);
        this.guideMascotEl.style.setProperty('--guide-y', `${clampedY}px`);
        this.guideMascotEl.style.setProperty('--guide-scale', String(scale));
    }
    setCardsInteractive(activeButton) {
        const buttons = Array.from(this.gridEl.querySelectorAll('.word-card'));
        buttons.forEach((button) => {
            const canChoose = activeButton !== null;
            const isTarget = button === activeButton;
            button.disabled = false;
            button.classList.toggle('is-choice-enabled', canChoose);
            button.classList.toggle('is-next-target', isTarget);
            button.setAttribute('aria-disabled', String(!canChoose));
        });
    }
    getInitialTargetButton() {
        if (this.targetSequence.length === 0) {
            this.resetTargetSequence();
        }
        const wordId = this.targetSequence[this.targetSequenceIndex];
        return this.findButtonByWordId(wordId) ?? this.gridEl.querySelector('.word-card');
    }
    getNextButton(currentWordId) {
        if (this.targetSequence.length === 0) {
            this.resetTargetSequence(currentWordId);
        }
        const currentIndex = this.targetSequence.indexOf(currentWordId);
        if (currentIndex >= 0) {
            this.targetSequenceIndex = currentIndex;
        }
        let nextIndex = this.targetSequenceIndex + 1;
        if (nextIndex >= this.targetSequence.length) {
            this.resetTargetSequence(currentWordId);
            nextIndex = 0;
        }
        this.targetSequenceIndex = nextIndex;
        return this.findButtonByWordId(this.targetSequence[this.targetSequenceIndex]);
    }
    refreshCustomAudioMap() {
        this.customAudioMap = loadCustomAudioMap();
    }
    syncMetricsToDom() {
        this.refreshCustomAudioMap();
        const profiles = getAllWordProfiles();
        const withRecordingCount = profiles.filter((item) => Boolean(this.customAudioMap[normalizeSpeechKey(item.label)])).length;
        const totalListens = profiles.reduce((sum, item) => sum + getWordListenCount(item.label), 0);
        const topSentences = getTopSentenceListens(5);
        this.rootEl.setAttribute('data-repeat-mode', this.settings.repeatMode);
        this.rootEl.setAttribute('data-custom-audio-count', String(Object.keys(this.customAudioMap).length));
        this.rootEl.setAttribute('data-word-recording-coverage', `${withRecordingCount}/${VOCABULARY.length}`);
        this.rootEl.setAttribute('data-total-word-listens', String(totalListens));
        this.rootEl.setAttribute('data-top-sentence', topSentences[0]?.sentence ?? '');
        this.rootEl.setAttribute('data-top-sentence-count', String(topSentences[0]?.count ?? 0));
    }
    notifySharedSpeechDataUpdated() {
        window.dispatchEvent(new CustomEvent(SHARED_SPEECH_DATA_EVENT));
    }
    loadSettings() {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            this.settings = {
                repeatMode: this.normalizeRepeatMode(parsed.repeatMode)
            };
        }
        catch {
            this.settings = {
                repeatMode: 'default'
            };
        }
    }
    saveSettings() {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
            ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}'),
            repeatMode: this.settings.repeatMode
        }));
    }
    normalizeRepeatMode(value) {
        if (value === '1' || value === '2' || value === '3') {
            return value;
        }
        return 'default';
    }
    resolveRepeats(defaultRepeats) {
        if (this.settings.repeatMode === 'default') {
            return defaultRepeats;
        }
        return Number(this.settings.repeatMode);
    }
    buildGuideWaitPrompt(word) {
        if (!word) {
            return 'Ben burada bekliyorum.';
        }
        const profile = this.getSceneProfiles().find((item) => item.word === word);
        const promptLabel = profile?.promptLabel || profile?.label || word;
        if (promptLabel !== word) {
            return `${this.capitalize(promptLabel)} icin bekliyorum.`;
        }
        return GUIDE_WAIT_PROMPTS[word] ?? `${this.capitalize(promptLabel)} icin bekliyorum.`;
    }
    getNextAttentionEffect() {
        if (this.attentionEffectBag.length === 0) {
            this.attentionEffectBag = this.shuffleArray([
                'rain',
                'snow',
                'hail',
                'lightning',
                'thunder',
                'rainbow'
            ]);
        }
        const effect = this.attentionEffectBag.shift() ?? 'rain';
        this.attentionEffectIndex += 1;
        return effect;
    }
    resetTargetSequence(avoidWord) {
        const wordIds = this.getSceneProfiles().map((item) => item.word);
        const nextSequence = this.shuffleArray(wordIds);
        if (avoidWord && nextSequence.length > 1 && nextSequence[0] === avoidWord) {
            const swapIndex = nextSequence.findIndex((wordId) => wordId !== avoidWord);
            if (swapIndex > 0) {
                [nextSequence[0], nextSequence[swapIndex]] = [nextSequence[swapIndex], nextSequence[0]];
            }
        }
        this.targetSequence = nextSequence;
        this.targetSequenceIndex = 0;
    }
    findButtonByWordId(wordId) {
        if (!wordId) {
            return null;
        }
        return (Array.from(this.gridEl.querySelectorAll('.word-card')).find((button) => button.dataset.wordId === wordId) ?? null);
    }
    shuffleArray(values) {
        const nextValues = [...values];
        for (let index = nextValues.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [nextValues[index], nextValues[swapIndex]] = [nextValues[swapIndex], nextValues[index]];
        }
        return nextValues;
    }
    primeSceneAudio() {
        if (!('AudioContext' in window)) {
            return null;
        }
        if (!this.sceneAudioContext) {
            try {
                this.sceneAudioContext = new AudioContext();
            }
            catch {
                return null;
            }
        }
        void this.sceneAudioContext.resume().catch(() => {
            // Optional game sound effect.
        });
        return this.sceneAudioContext;
    }
    playObjectSound(word) {
        const runtime = window;
        runtime.__speechSfxLog = runtime.__speechSfxLog ?? [];
        runtime.__speechSfxLog.push(word);
        const context = this.primeSceneAudio();
        if (!context || context.state !== 'running') {
            return word === 'su' ? 760 : 520;
        }
        const start = context.currentTime + 0.02;
        const master = context.createGain();
        master.connect(context.destination);
        master.gain.setValueAtTime(0.0001, start);
        master.gain.exponentialRampToValueAtTime(0.18, start + 0.04);
        master.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);
        if (word === 'su') {
            this.playTone(context, master, start, 740, 0.16, 'sine');
            this.playTone(context, master, start + 0.1, 620, 0.22, 'triangle');
            this.playTone(context, master, start + 0.22, 520, 0.24, 'triangle');
            return 760;
        }
        if (word === 'baba') {
            this.playTone(context, master, start, 320, 0.16, 'triangle');
            this.playTone(context, master, start + 0.12, 392, 0.18, 'triangle');
            return 520;
        }
        if (word === 'top') {
            this.playTone(context, master, start, 540, 0.12, 'sine');
            this.playTone(context, master, start + 0.12, 430, 0.14, 'triangle');
            this.playTone(context, master, start + 0.25, 560, 0.12, 'sine');
            return 560;
        }
        if (word === 'araba') {
            this.playSweep(context, master, start, 240, 430, 0.34, 'sawtooth');
            return 620;
        }
        this.playTone(context, master, start, 780, 0.14, 'triangle');
        this.playTone(context, master, start + 0.1, 930, 0.16, 'sine');
        return 520;
    }
    playTone(context, destination, start, frequency, duration, type) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(0.36, start + 0.02);
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
    playAudioDataUrl(dataUrl) {
        const audio = new Audio(dataUrl);
        audio.play().catch(() => {
            this.feedbackEl.textContent = 'Kayit calinamadi.';
        });
    }
    escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
    capitalize(value) {
        const normalized = value.trim();
        if (!normalized) {
            return '';
        }
        return normalized.charAt(0).toLocaleUpperCase('tr-TR') + normalized.slice(1);
    }
}
//# sourceMappingURL=index.js.map