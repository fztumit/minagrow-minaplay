import { VOCABULARY, getSpeechLevelIds, getSpeechSetDefinition, getSpeechSets, SPEECH_LEVEL_LABELS } from '../data/vocabulary.js';
import { clearWordGuidedGif, clearWordImage, getAllWordProfiles, normalizeWordLabel, updateWordGuidedGif, updateWordImage, updateWordLabel } from '../data/wordProfiles.js';
import { getTopSentenceListens, getWordListenCount, incrementWordListen, renameWordListenKey, resetListenProgress } from '../progress/listening.js';
import { bindParentGesture } from '../shared/parentGesture.js';
import { buildCustomAudioBackup, listCustomAudioEntries, loadCustomAudioMap, mergeCustomAudioMaps, normalizeSpeechKey, renameCustomAudioKey, parseCustomAudioBackup, saveCustomAudioMap } from './customAudio.js';
const SETTINGS_STORAGE_KEY = 'konusu_yorum_speech_settings_v1';
const SHARED_SPEECH_DATA_EVENT = 'speech-shared-data-updated';
const GUIDE_REMINDER_DELAY_MS = navigator.webdriver ? 4800 : 9400;
const GUIDE_REMINDER_VARIANCE_MS = navigator.webdriver ? 0 : 2400;
const GUIDE_REMINDER_RETRY_MS = navigator.webdriver ? 300 : 1800;
const GUIDE_TRAVEL_MS = 720;
const ATTENTION_EFFECT_DURATION_MS = 1240;
const GUIDE_WAIT_PROMPTS = {
    su: 'Ben suyun yanında bekliyorum.',
    baba: 'Ben babanın yanında bekliyorum.',
    top: 'Ben topun yanında bekliyorum.',
    araba: 'Ben arabanın yanında bekliyorum.',
    elma: 'Ben elmanın yanında bekliyorum.',
    anne: 'Ben annenin yanında bekliyorum.',
    kitap: 'Ben kitabın yanında bekliyorum.',
    süt: 'Ben sütün yanında bekliyorum.',
    ekmek: 'Ben ekmeğin yanında bekliyorum.'
};
const GUIDE_WORD_ANCHORS = {
    su: { xAlign: 'left', yAlign: 'top', xShift: -18, yShift: -18 },
    baba: { xAlign: 'center', yAlign: 'top', xShift: 0, yShift: -22 },
    top: { xAlign: 'right', yAlign: 'top', xShift: 18, yShift: -18 },
    araba: { xAlign: 'left', yAlign: 'middle', xShift: -28, yShift: 4 },
    elma: { xAlign: 'right', yAlign: 'middle', xShift: 28, yShift: 4 }
};
const DEFAULT_SPEECH_LEVEL = 'starter';
const DEFAULT_SPEECH_SET = 'starter-first-words';
export class SpeechGameModule {
    rootEl;
    stageEl;
    gridEl;
    focusCardBtn;
    focusKickerEl;
    focusLabelEl;
    focusPromptEl;
    focusBadgeEl;
    focusIllustrationEl;
    focusCaptionEl;
    trayStatusEl;
    guideLayerEl;
    guideMascotEl;
    parentPanelTriggerBtn;
    parentCornerHotspotEl;
    feedbackEl;
    levelSelect;
    setSelect;
    repeatModeSelect;
    autoProgressCheckbox;
    pinSetCheckbox;
    setSummaryEl;
    customAudioTextInput;
    customAudioStartBtn;
    customAudioStopBtn;
    customAudioPlayBtn;
    customAudioDeleteBtn;
    customAudioStatusEl;
    recordingLibrarySummaryEl;
    recordingExportBtn;
    recordingImportInput;
    recordingBackupStatusEl;
    recordingLibraryListEl;
    progressSummaryEl;
    progressResetBtn;
    progressResetStatusEl;
    progressWordListEl;
    progressSentenceListEl;
    waterFocusOverlayEl;
    mascot;
    activeViewName;
    timeoutIds = [];
    waterFocusTimeoutId = null;
    guideTimeoutId = null;
    visualResetTimeoutId = null;
    guideMotionResetTimeoutId = null;
    idleReminderTimeoutId = null;
    attentionResetTimeoutId = null;
    activeNextButton = null;
    customAudioMap = {};
    mediaRecorder = null;
    recordingChunks = [];
    recordingStream = null;
    sequenceTimeoutIds = [];
    sceneAudioContext = null;
    attentionEffectIndex = 0;
    attentionEffectBag = [];
    idleReminderCount = 0;
    completedWordIds = new Set();
    settings = {
        repeatMode: 'default',
        activeLevel: DEFAULT_SPEECH_LEVEL,
        activeSet: DEFAULT_SPEECH_SET,
        autoProgress: true,
        pinnedSet: false
    };
    constructor(rootEl, mascot, controlsRootEl = rootEl, options = {}) {
        const stageEl = rootEl.querySelector('#speech-stage');
        const gridEl = rootEl.querySelector('#speech-grid');
        const focusCardBtn = rootEl.querySelector('#speech-focus-card');
        const focusKickerEl = rootEl.querySelector('#speech-focus-kicker');
        const focusLabelEl = rootEl.querySelector('#speech-focus-label');
        const focusPromptEl = rootEl.querySelector('#speech-focus-prompt');
        const focusBadgeEl = rootEl.querySelector('#speech-focus-badge');
        const focusIllustrationEl = rootEl.querySelector('#speech-focus-illustration');
        const focusCaptionEl = rootEl.querySelector('#speech-focus-caption');
        const trayStatusEl = rootEl.querySelector('#speech-tray-status');
        const guideLayerEl = rootEl.querySelector('#speech-guide-layer');
        const guideMascotEl = rootEl.querySelector('#speech-guide-mascot');
        const parentPanelTriggerBtn = rootEl.querySelector('#parent-panel-trigger');
        const parentCornerHotspotEl = rootEl.querySelector('#parent-corner-hotspot');
        const feedbackEl = rootEl.querySelector('#speech-feedback');
        const levelSelect = controlsRootEl.querySelector('#speech-level-select');
        const setSelect = controlsRootEl.querySelector('#speech-set-select');
        const repeatModeSelect = controlsRootEl.querySelector('#speech-repeat-mode');
        const autoProgressCheckbox = controlsRootEl.querySelector('#speech-auto-progress');
        const pinSetCheckbox = controlsRootEl.querySelector('#speech-pin-set');
        const setSummaryEl = controlsRootEl.querySelector('#speech-set-summary');
        const customAudioTextInput = controlsRootEl.querySelector('#custom-audio-text');
        const customAudioStartBtn = controlsRootEl.querySelector('#custom-audio-record-start');
        const customAudioStopBtn = controlsRootEl.querySelector('#custom-audio-record-stop');
        const customAudioPlayBtn = controlsRootEl.querySelector('#custom-audio-play');
        const customAudioDeleteBtn = controlsRootEl.querySelector('#custom-audio-delete');
        const customAudioStatusEl = controlsRootEl.querySelector('#custom-audio-status');
        const recordingLibrarySummaryEl = controlsRootEl.querySelector('#recording-library-summary');
        const recordingExportBtn = controlsRootEl.querySelector('#recording-export-btn');
        const recordingImportInput = controlsRootEl.querySelector('#recording-import-input');
        const recordingBackupStatusEl = controlsRootEl.querySelector('#recording-backup-status');
        const recordingLibraryListEl = controlsRootEl.querySelector('#recording-library-list');
        const progressSummaryEl = controlsRootEl.querySelector('#progress-summary');
        const progressResetBtn = controlsRootEl.querySelector('#progress-reset-btn');
        const progressResetStatusEl = controlsRootEl.querySelector('#progress-reset-status');
        const progressWordListEl = controlsRootEl.querySelector('#progress-word-list');
        const progressSentenceListEl = controlsRootEl.querySelector('#progress-sentence-list');
        const waterFocusOverlayEl = rootEl.querySelector('#water-focus-overlay');
        if (!stageEl ||
            !gridEl ||
            !focusCardBtn ||
            !focusKickerEl ||
            !focusLabelEl ||
            !focusPromptEl ||
            !focusBadgeEl ||
            !focusIllustrationEl ||
            !focusCaptionEl ||
            !trayStatusEl ||
            !guideLayerEl ||
            !guideMascotEl ||
            !parentPanelTriggerBtn ||
            !parentCornerHotspotEl ||
            !feedbackEl ||
            !levelSelect ||
            !setSelect ||
            !repeatModeSelect ||
            !autoProgressCheckbox ||
            !pinSetCheckbox ||
            !setSummaryEl ||
            !customAudioTextInput ||
            !customAudioStartBtn ||
            !customAudioStopBtn ||
            !customAudioPlayBtn ||
            !customAudioDeleteBtn ||
            !customAudioStatusEl ||
            !recordingLibrarySummaryEl ||
            !recordingExportBtn ||
            !recordingImportInput ||
            !recordingBackupStatusEl ||
            !recordingLibraryListEl ||
            !progressSummaryEl ||
            !progressResetBtn ||
            !progressResetStatusEl ||
            !progressWordListEl ||
            !progressSentenceListEl ||
            !waterFocusOverlayEl) {
            throw new Error('Speech module requires game, recording library, backup, and progress elements.');
        }
        this.rootEl = rootEl;
        this.stageEl = stageEl;
        this.gridEl = gridEl;
        this.focusCardBtn = focusCardBtn;
        this.focusKickerEl = focusKickerEl;
        this.focusLabelEl = focusLabelEl;
        this.focusPromptEl = focusPromptEl;
        this.focusBadgeEl = focusBadgeEl;
        this.focusIllustrationEl = focusIllustrationEl;
        this.focusCaptionEl = focusCaptionEl;
        this.trayStatusEl = trayStatusEl;
        this.guideLayerEl = guideLayerEl;
        this.guideMascotEl = guideMascotEl;
        this.parentPanelTriggerBtn = parentPanelTriggerBtn;
        this.parentCornerHotspotEl = parentCornerHotspotEl;
        this.feedbackEl = feedbackEl;
        this.levelSelect = levelSelect;
        this.setSelect = setSelect;
        this.repeatModeSelect = repeatModeSelect;
        this.autoProgressCheckbox = autoProgressCheckbox;
        this.pinSetCheckbox = pinSetCheckbox;
        this.setSummaryEl = setSummaryEl;
        this.customAudioTextInput = customAudioTextInput;
        this.customAudioStartBtn = customAudioStartBtn;
        this.customAudioStopBtn = customAudioStopBtn;
        this.customAudioPlayBtn = customAudioPlayBtn;
        this.customAudioDeleteBtn = customAudioDeleteBtn;
        this.customAudioStatusEl = customAudioStatusEl;
        this.recordingLibrarySummaryEl = recordingLibrarySummaryEl;
        this.recordingExportBtn = recordingExportBtn;
        this.recordingImportInput = recordingImportInput;
        this.recordingBackupStatusEl = recordingBackupStatusEl;
        this.recordingLibraryListEl = recordingLibraryListEl;
        this.progressSummaryEl = progressSummaryEl;
        this.progressResetBtn = progressResetBtn;
        this.progressResetStatusEl = progressResetStatusEl;
        this.progressWordListEl = progressWordListEl;
        this.progressSentenceListEl = progressSentenceListEl;
        this.waterFocusOverlayEl = waterFocusOverlayEl;
        this.mascot = mascot;
        this.activeViewName = options.activeViewName ?? 'speech';
    }
    init() {
        this.loadSettings();
        this.ensureValidActiveSet();
        this.populateSpeechSetControls();
        this.renderCards(this.getActiveSetProfiles());
        this.renderFocusCard(this.getActiveSetProfiles()[0] ?? null);
        this.refreshCustomAudioMap();
        this.bindEvents();
        this.bindSettingsEvents();
        this.bindParentPanelAccess();
        this.syncCustomAudioSupportState();
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
        this.syncSettingsToDom();
        this.renderRecordingLibrary();
        this.renderProgressPanel();
        this.bindGuideLifecycleEvents();
        window.addEventListener('word-profiles-updated', () => {
            this.handleWordProfilesUpdated();
        });
        window.addEventListener(SHARED_SPEECH_DATA_EVENT, () => {
            this.syncSharedSpeechState();
        });
        window.requestAnimationFrame(() => {
            if (document.body.getAttribute('data-active-view') === this.activeViewName) {
                this.startIntroSequence();
            }
            else {
                this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
                this.rootEl.setAttribute('data-guide-active', 'false');
                this.rootEl.setAttribute('data-guide-prompt', '');
            }
        });
    }
    renderCards(vocabulary) {
        this.gridEl.innerHTML = vocabulary
            .map((item) => {
            return `
          <button
            class="word-card ${item.sceneClass ?? ''}"
            type="button"
            data-word-id="${item.word}"
            data-word-label="${this.escapeHtml(item.label)}"
            data-repeats="${item.repeats}"
            data-level="${item.level}"
            data-set-id="${item.setId}"
            data-order="${item.order}"
            data-media-type="${item.mediaType}"
            aria-label="${this.escapeHtml(item.label)}"
          >
            ${this.renderWordMedia(item, { variant: 'tray' })}
            <span class="word-card-label">${this.escapeHtml(this.toDisplayLabel(item.label))}</span>
            <span class="visually-hidden">${this.escapeHtml(item.label)}</span>
          </button>
        `;
        })
            .join('');
        this.syncCompletedWordState();
        this.updateTrayStatus();
    }
    getActiveSetProfiles() {
        const vocabulary = VOCABULARY.filter((item) => item.setId === this.settings.activeSet).sort((left, right) => left.order - right.order);
        return getAllWordProfiles(vocabulary);
    }
    getResolvedWordProfile(wordId) {
        const profile = getAllWordProfiles().find((item) => item.word === wordId);
        if (!profile) {
            throw new Error(`Unknown word profile: ${wordId}`);
        }
        return profile;
    }
    handleWordProfilesUpdated() {
        this.renderCards(this.getActiveSetProfiles());
        this.renderProgressPanel();
        this.renderRecordingLibrary();
        this.syncSettingsToDom();
        const activeViewId = document.body.getAttribute('data-active-view');
        if (activeViewId === this.activeViewName) {
            this.resetPlayfield(true);
            return;
        }
        this.clearCurrentNextTarget();
        this.renderFocusCard(this.getActiveSetProfiles()[0] ?? null);
    }
    notifyWordProfilesUpdated() {
        window.dispatchEvent(new CustomEvent('word-profiles-updated'));
    }
    notifySharedSpeechDataUpdated() {
        window.dispatchEvent(new CustomEvent(SHARED_SPEECH_DATA_EVENT));
    }
    applyWordLabelUpdate(wordId, nextLabel) {
        const currentProfile = this.getResolvedWordProfile(wordId);
        if (!nextLabel) {
            this.customAudioStatusEl.textContent = 'Kelime bos olamaz.';
            return;
        }
        if (currentProfile.label !== nextLabel) {
            this.customAudioMap = renameCustomAudioKey(this.customAudioMap, currentProfile.label, nextLabel);
            saveCustomAudioMap(this.customAudioMap);
            renameWordListenKey(currentProfile.label, nextLabel);
            updateWordLabel(wordId, nextLabel);
            this.notifyWordProfilesUpdated();
        }
        else {
            this.renderProgressPanel();
        }
        this.customAudioTextInput.value = nextLabel;
        this.customAudioStatusEl.textContent = `"${nextLabel}" kelimesi guncellendi.`;
    }
    async updateWordImageFromFile(wordId, file, variant = 'image') {
        if (!file.type.startsWith('image/')) {
            this.customAudioStatusEl.textContent = 'Lutfen gecerli bir gorsel sec.';
            return;
        }
        const dataUrl = await this.blobToDataUrl(file);
        if (variant === 'guided-gif') {
            updateWordGuidedGif(wordId, dataUrl);
        }
        else {
            updateWordImage(wordId, dataUrl);
        }
        this.notifyWordProfilesUpdated();
        this.customAudioStatusEl.textContent =
            variant === 'guided-gif'
                ? `"${this.getResolvedWordProfile(wordId).label}" rehber GIF gorseli guncellendi.`
                : `"${this.getResolvedWordProfile(wordId).label}" gorseli guncellendi.`;
    }
    renderWordMedia(profile, options) {
        const mediaSrc = options.preferGuidedGif && profile.guidedGifSrc ? profile.guidedGifSrc : profile.imageSrc || profile.asset || '';
        const variantClass = options.variant === 'focus' ? 'is-focus' : 'is-tray';
        if (profile.word === 'su') {
            return `
        <div class="word-illustration water-visual ${variantClass}" aria-hidden="true">
          <img class="water-glass-image" src="${this.escapeHtml(mediaSrc || '/assets/water-glass.svg')}" alt="" />
          <div class="water-glass-shimmer"></div>
          <div class="spill-stream"></div>
          <div class="spill-pool"></div>
        </div>
      `;
        }
        if (mediaSrc) {
            return `
        <div class="word-illustration ${variantClass}" aria-hidden="true">
          <img class="word-object-image" src="${this.escapeHtml(mediaSrc)}" alt="" />
        </div>
      `;
        }
        return `
      <div class="word-illustration word-illustration-fallback ${variantClass}" aria-hidden="true">
        <span class="word-object-fallback">${this.escapeHtml(this.toDisplayLabel(profile.label).slice(0, 1))}</span>
      </div>
    `;
    }
    renderFocusCard(profile, isTarget = false) {
        if (!profile) {
            this.focusCardBtn.disabled = true;
            this.focusCardBtn.classList.remove('is-target');
            this.focusCardBtn.removeAttribute('data-word-id');
            this.focusCardBtn.removeAttribute('data-word-label');
            this.focusCardBtn.removeAttribute('data-repeats');
            this.focusKickerEl.textContent = "Pofi'nin hedefi";
            this.focusLabelEl.textContent = 'Hazır mısın?';
            this.focusPromptEl.textContent = 'Pofi birazdan bir nesne gösterecek.';
            this.focusBadgeEl.textContent = 'Hazır';
            this.focusIllustrationEl.innerHTML = '';
            this.focusCaptionEl.textContent = 'Bir nesne seçilecek.';
            this.rootEl.setAttribute('data-focused-word', '');
            return;
        }
        const focusPrompt = this.buildTargetPrompt(profile);
        this.focusCardBtn.disabled = !isTarget;
        this.focusCardBtn.classList.toggle('is-target', isTarget);
        this.focusCardBtn.dataset.wordId = profile.word;
        this.focusCardBtn.dataset.wordLabel = profile.label;
        this.focusCardBtn.dataset.repeats = String(profile.repeats);
        this.focusKickerEl.textContent = isTarget ? "Pofi'nin seçtiği nesne" : "Birazdan sırada";
        this.focusLabelEl.textContent = this.toDisplayLabel(profile.label);
        this.focusPromptEl.textContent = isTarget ? focusPrompt : 'Pofi birazdan sana yön verecek.';
        this.focusBadgeEl.textContent = isTarget ? 'Hedef' : 'Sırada';
        this.focusIllustrationEl.innerHTML = this.renderWordMedia(profile, {
            variant: 'focus',
            preferGuidedGif: isTarget && Boolean(profile.guidedGifSrc)
        });
        this.focusCaptionEl.textContent = isTarget
            ? `${this.toDisplayLabel(profile.label)} burada büyük görünür.`
            : 'Pofi önce hedefi gösterecek.';
        this.rootEl.setAttribute('data-focused-word', profile.word);
    }
    getAvailableSetsForActiveLevel() {
        return getSpeechSets(this.settings.activeLevel);
    }
    ensureValidActiveSet() {
        const availableSets = this.getAvailableSetsForActiveLevel();
        if (availableSets.some((item) => item.id === this.settings.activeSet)) {
            return;
        }
        this.settings.activeSet = availableSets[0]?.id ?? DEFAULT_SPEECH_SET;
    }
    populateSpeechSetControls() {
        this.levelSelect.innerHTML = getSpeechLevelIds()
            .map((levelId) => `<option value="${levelId}">${this.escapeHtml(SPEECH_LEVEL_LABELS[levelId])}</option>`)
            .join('');
        const setOptions = this.getAvailableSetsForActiveLevel();
        this.setSelect.innerHTML = setOptions
            .map((setItem) => `<option value="${setItem.id}">${this.escapeHtml(this.toDisplayLabel(setItem.label))}</option>`)
            .join('');
    }
    syncCompletedWordState() {
        const completedIds = this.completedWordIds;
        Array.from(this.gridEl.querySelectorAll('.word-card')).forEach((button) => {
            const wordId = button.dataset.wordId;
            button.classList.toggle('is-completed', Boolean(wordId && completedIds.has(wordId)));
        });
    }
    updateTrayStatus() {
        const setDefinition = getSpeechSetDefinition(this.settings.activeSet);
        const totalCount = this.getActiveSetProfiles().length;
        const completionText = `${this.completedWordIds.size}/${totalCount}`;
        this.trayStatusEl.textContent = setDefinition
            ? `${this.toDisplayLabel(setDefinition.label)} • Tamamlanan ${completionText}`
            : `Tamamlanan ${completionText}`;
        this.rootEl.setAttribute('data-set-completion', completionText);
    }
    buildTargetPrompt(profile) {
        const promptLabel = profile.promptLabel || profile.label;
        const normalizedPrompt = promptLabel.trim();
        if (!normalizedPrompt) {
            return 'Buna dokun.';
        }
        const capitalized = normalizedPrompt.charAt(0).toLocaleUpperCase('tr-TR') + normalizedPrompt.slice(1);
        return `${capitalized} dokun.`;
    }
    toDisplayLabel(value) {
        const normalized = value.trim();
        if (!normalized) {
            return '';
        }
        return normalized.charAt(0).toLocaleUpperCase('tr-TR') + normalized.slice(1);
    }
    bindEvents() {
        this.gridEl.addEventListener('click', (event) => {
            const target = event.target.closest('.word-card');
            if (!target) {
                return;
            }
            if (this.rootEl.getAttribute('data-scene-phase') !== 'awaiting-tap') {
                return;
            }
            if (target !== this.activeNextButton) {
                const wordId = target.dataset.wordId;
                const wordLabel = target.dataset.wordLabel ?? '';
                const defaultRepeats = Number(target.dataset.repeats ?? 1);
                if (!wordId || !wordLabel || Number.isNaN(defaultRepeats)) {
                    return;
                }
                this.onWrongWordTapped(target, wordId, wordLabel, defaultRepeats);
                return;
            }
            const wordId = target.dataset.wordId;
            const wordLabel = target.dataset.wordLabel ?? '';
            const defaultRepeats = Number(target.dataset.repeats ?? 1);
            if (!wordId || !wordLabel || Number.isNaN(defaultRepeats)) {
                return;
            }
            this.onWordTapped(target, wordId, wordLabel, defaultRepeats);
        });
        this.focusCardBtn.addEventListener('click', () => {
            if (this.rootEl.getAttribute('data-scene-phase') !== 'awaiting-tap' || !this.activeNextButton) {
                return;
            }
            const wordId = this.activeNextButton.dataset.wordId;
            const wordLabel = this.activeNextButton.dataset.wordLabel ?? '';
            const defaultRepeats = Number(this.activeNextButton.dataset.repeats ?? 1);
            if (!wordId || !wordLabel || Number.isNaN(defaultRepeats)) {
                return;
            }
            this.onWordTapped(this.activeNextButton, wordId, wordLabel, defaultRepeats);
        });
        this.recordingLibraryListEl.addEventListener('click', (event) => {
            const target = event.target.closest('.recording-btn');
            if (!target) {
                return;
            }
            const action = target.dataset.action;
            const encodedKey = target.dataset.key ?? '';
            if (!action || !encodedKey) {
                return;
            }
            const key = decodeURIComponent(encodedKey);
            if (!key) {
                return;
            }
            if (action === 'play') {
                const dataUrl = this.customAudioMap[key];
                if (dataUrl) {
                    this.playAudioDataUrl(dataUrl);
                }
                return;
            }
            if (action === 'delete') {
                if (this.customAudioMap[key]) {
                    delete this.customAudioMap[key];
                    saveCustomAudioMap(this.customAudioMap);
                    this.syncSettingsToDom();
                    this.renderRecordingLibrary();
                    this.renderProgressPanel();
                    this.notifySharedSpeechDataUpdated();
                    this.recordingBackupStatusEl.textContent = `"${key}" kaydi silindi.`;
                }
                return;
            }
            if (action === 'rerecord') {
                this.customAudioTextInput.value = key;
                void this.startCustomAudioRecording(key);
            }
        });
        this.progressWordListEl.addEventListener('click', (event) => {
            const target = event.target.closest('.progress-record-btn');
            if (!target) {
                return;
            }
            const action = target.dataset.action;
            const wordId = target.dataset.wordId;
            if (!action || !wordId) {
                return;
            }
            const currentProfile = this.getResolvedWordProfile(wordId);
            const rowEl = target.closest('.progress-row');
            const inputEl = rowEl?.querySelector('.progress-word-input');
            const nextLabel = normalizeWordLabel(inputEl?.value ?? currentProfile.label);
            if (!nextLabel) {
                this.customAudioStatusEl.textContent = 'Kelime bos olamaz.';
                return;
            }
            if (action === 'save-label') {
                this.applyWordLabelUpdate(wordId, nextLabel);
                return;
            }
            if (action === 'clear-image') {
                clearWordImage(wordId);
                this.notifyWordProfilesUpdated();
                this.customAudioStatusEl.textContent = `"${nextLabel}" gorseli silindi.`;
                return;
            }
            if (action === 'clear-guided-gif') {
                clearWordGuidedGif(wordId);
                this.notifyWordProfilesUpdated();
                this.customAudioStatusEl.textContent = `"${nextLabel}" rehber GIF gorseli silindi.`;
                return;
            }
            const activeProfile = this.getResolvedWordProfile(wordId);
            const key = normalizeSpeechKey(activeProfile.label);
            if (!key) {
                return;
            }
            this.customAudioTextInput.value = activeProfile.label;
            if (action === 'record') {
                void this.startCustomAudioRecording(key);
                return;
            }
            if (action === 'play') {
                const dataUrl = this.customAudioMap[key];
                if (dataUrl) {
                    this.playAudioDataUrl(dataUrl);
                    this.customAudioStatusEl.textContent = `"${activeProfile.label}" kaydi caliniyor.`;
                }
                return;
            }
            if (action === 'delete' && this.customAudioMap[key]) {
                delete this.customAudioMap[key];
                saveCustomAudioMap(this.customAudioMap);
                this.syncSettingsToDom();
                this.renderRecordingLibrary();
                this.renderProgressPanel();
                this.notifySharedSpeechDataUpdated();
                this.customAudioStatusEl.textContent = `"${activeProfile.label}" kaydi silindi.`;
            }
        });
        this.progressWordListEl.addEventListener('change', (event) => {
            const target = event.target;
            if (!target ||
                (!target.classList.contains('progress-image-input') && !target.classList.contains('progress-guided-gif-input'))) {
                return;
            }
            const wordId = target.dataset.wordId;
            const file = target.files?.[0];
            if (!wordId || !file) {
                return;
            }
            const variant = target.classList.contains('progress-guided-gif-input') ? 'guided-gif' : 'image';
            void this.updateWordImageFromFile(wordId, file, variant).finally(() => {
                target.value = '';
            });
        });
    }
    bindGuideLifecycleEvents() {
        this.rootEl.addEventListener('speech-guidance-pause', () => {
            this.clearPendingSpeech();
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
            this.placeGuideMascot(this.getGuideTargetButton(this.activeNextButton));
            this.rootEl.setAttribute('data-guide-active', 'true');
            if (!this.rootEl.getAttribute('data-guide-prompt')) {
                this.rootEl.setAttribute('data-guide-prompt', this.buildTargetPrompt(this.getResolvedWordProfile(this.activeNextButton.dataset.wordId)));
            }
            this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
            this.setCardsInteractive(this.activeNextButton);
            this.scheduleIdleReminder(this.getGuideTargetButton(this.activeNextButton));
        });
    }
    bindSettingsEvents() {
        this.levelSelect.addEventListener('change', () => {
            const nextLevel = this.normalizeLevelId(this.levelSelect.value);
            if (nextLevel === this.settings.activeLevel) {
                return;
            }
            this.settings.activeLevel = nextLevel;
            this.ensureValidActiveSet();
            this.handleSetSelectionChange('Seviye guncellendi.');
        });
        this.setSelect.addEventListener('change', () => {
            const nextSet = this.normalizeSetId(this.setSelect.value, this.settings.activeLevel);
            if (nextSet === this.settings.activeSet) {
                return;
            }
            this.settings.activeSet = nextSet;
            const activeSetDefinition = getSpeechSetDefinition(nextSet);
            if (activeSetDefinition) {
                this.settings.activeLevel = activeSetDefinition.level;
            }
            this.handleSetSelectionChange('Set guncellendi.');
        });
        this.repeatModeSelect.addEventListener('change', () => {
            const repeatMode = this.repeatModeSelect.value;
            this.settings.repeatMode = repeatMode;
            this.saveSettings();
            this.syncSettingsToDom();
            this.feedbackEl.textContent = 'Ebeveyn ayarlari guncellendi.';
        });
        this.autoProgressCheckbox.addEventListener('change', () => {
            this.settings.autoProgress = this.autoProgressCheckbox.checked;
            this.saveSettings();
            this.syncSettingsToDom();
            this.feedbackEl.textContent = 'Set ilerleme ayari guncellendi.';
        });
        this.pinSetCheckbox.addEventListener('change', () => {
            this.settings.pinnedSet = this.pinSetCheckbox.checked;
            this.saveSettings();
            this.syncSettingsToDom();
            this.feedbackEl.textContent = 'Set sabitleme ayari guncellendi.';
        });
        this.customAudioStartBtn.addEventListener('click', () => {
            void this.startCustomAudioRecording();
        });
        this.customAudioStopBtn.addEventListener('click', () => {
            this.stopCustomAudioRecording();
        });
        this.customAudioPlayBtn.addEventListener('click', () => {
            this.playCustomAudioForInput();
        });
        this.customAudioDeleteBtn.addEventListener('click', () => {
            this.deleteCustomAudioForInput();
        });
        this.recordingExportBtn.addEventListener('click', () => {
            this.exportCustomAudioBackup();
        });
        this.recordingImportInput.addEventListener('change', () => {
            void this.importCustomAudioBackup();
        });
        this.progressResetBtn.addEventListener('click', () => {
            this.resetProgressCounters();
        });
    }
    handleSetSelectionChange(statusMessage) {
        this.saveSettings();
        this.populateSpeechSetControls();
        this.resetSetState();
        this.renderCards(this.getActiveSetProfiles());
        this.renderFocusCard(this.getActiveSetProfiles()[0] ?? null);
        this.syncSettingsToDom();
        this.renderProgressPanel();
        this.feedbackEl.textContent = statusMessage;
        if (document.body.getAttribute('data-active-view') === this.activeViewName) {
            this.resetPlayfield(true);
        }
    }
    resetSetState() {
        this.completedWordIds.clear();
        this.clearPendingSpeech();
        this.clearPendingGuidance();
        this.clearIdleReminder();
        this.clearAttentionState();
        this.clearSequenceTimeouts();
        this.clearCurrentNextTarget();
        this.rootEl.setAttribute('data-scene-phase', 'intro');
        this.rootEl.setAttribute('data-guide-prompt', '');
        this.rootEl.setAttribute('data-guide-mode', 'idle');
        this.updateTrayStatus();
    }
    resetPlayfield(playIntroIfActive = false) {
        this.resetSetState();
        this.renderCards(this.getActiveSetProfiles());
        this.renderFocusCard(this.getActiveSetProfiles()[0] ?? null);
        this.syncSettingsToDom();
        if (playIntroIfActive && document.body.getAttribute('data-active-view') === this.activeViewName) {
            this.startIntroSequence();
        }
    }
    getGuideTargetButton(targetButton) {
        const focusWordId = this.focusCardBtn.dataset.wordId;
        if (focusWordId && targetButton.dataset.wordId === focusWordId) {
            return this.focusCardBtn;
        }
        return targetButton;
    }
    scheduleSetCompletion(delayMs) {
        this.guideTimeoutId = window.setTimeout(() => {
            this.guideTimeoutId = null;
            this.rootEl.setAttribute('data-scene-phase', 'set-complete');
            this.rootEl.setAttribute('data-guide-active', 'true');
            this.rootEl.setAttribute('data-guide-mode', 'celebrate');
            this.rootEl.setAttribute('data-guide-prompt', 'Set tamamlandi');
            this.trayStatusEl.textContent = this.getEffectiveAutoProgress()
                ? 'Harika, yeni sete geciyoruz.'
                : 'Harika, ayni set yeniden baslayacak.';
            this.focusKickerEl.textContent = 'Set tamamlandı';
            this.focusPromptEl.textContent = this.getEffectiveAutoProgress()
                ? 'Pofi siradaki sete geciyor.'
                : 'Pofi bu seti yeniden baslatacak.';
            const continueTimeoutId = window.setTimeout(() => {
                this.advanceToNextSetOrRestart();
            }, 920);
            this.sequenceTimeoutIds.push(continueTimeoutId);
        }, delayMs + 280);
    }
    advanceToNextSetOrRestart() {
        const allSets = getSpeechSets();
        const currentIndex = allSets.findIndex((item) => item.id === this.settings.activeSet);
        const nextSet = this.getEffectiveAutoProgress() ? allSets[currentIndex + 1] ?? null : null;
        if (nextSet) {
            this.settings.activeLevel = nextSet.level;
            this.settings.activeSet = nextSet.id;
            this.populateSpeechSetControls();
            this.saveSettings();
            this.feedbackEl.textContent = `${this.toDisplayLabel(nextSet.label)} setine gecildi.`;
        }
        else {
            this.feedbackEl.textContent = 'Ayni set yeniden basliyor.';
        }
        this.resetPlayfield(document.body.getAttribute('data-active-view') === this.activeViewName);
    }
    bindParentPanelAccess() {
        this.parentPanelTriggerBtn.addEventListener('click', () => {
            this.rootEl.dispatchEvent(new CustomEvent('open-parent-panel', { bubbles: true }));
        });
        bindParentGesture({
            hotspotEl: this.parentCornerHotspotEl,
            onTrigger: () => {
                this.parentPanelTriggerBtn.click();
            }
        });
    }
    syncCustomAudioSupportState() {
        const supported = typeof window.MediaRecorder !== 'undefined' &&
            !!navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function';
        if (supported) {
            return;
        }
        this.customAudioStartBtn.disabled = true;
        this.customAudioStopBtn.disabled = true;
        this.customAudioPlayBtn.disabled = true;
        this.customAudioDeleteBtn.disabled = true;
        this.customAudioStatusEl.textContent = 'Bu tarayicida ses kaydi desteklenmiyor.';
    }
    getCustomAudioInputKey() {
        return normalizeSpeechKey(this.customAudioTextInput.value);
    }
    async startCustomAudioRecording(overrideKey) {
        const key = overrideKey ?? this.getCustomAudioInputKey();
        const displayLabel = normalizeWordLabel(this.customAudioTextInput.value) || key;
        if (!key) {
            this.customAudioStatusEl.textContent = 'Once kelime veya cumle yaz.';
            return;
        }
        if (typeof window.MediaRecorder === 'undefined' ||
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== 'function') {
            this.customAudioStatusEl.textContent = 'Bu tarayicida ses kaydi desteklenmiyor.';
            return;
        }
        if (this.mediaRecorder?.state === 'recording') {
            this.customAudioStatusEl.textContent = 'Kayit zaten devam ediyor.';
            return;
        }
        try {
            this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.recordingChunks = [];
            this.mediaRecorder = new MediaRecorder(this.recordingStream);
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordingChunks.push(event.data);
                }
            };
            this.mediaRecorder.onstop = () => {
                void this.finalizeCustomAudioRecording(key);
            };
            this.mediaRecorder.start();
            this.customAudioStartBtn.disabled = true;
            this.customAudioStopBtn.disabled = false;
            this.customAudioStatusEl.textContent = `"${displayLabel}" icin kayit aliniyor...`;
        }
        catch {
            this.cleanupRecordingResources();
            this.customAudioStatusEl.textContent = 'Mikrofon acilamadi. Tarayici izinlerini kontrol et.';
        }
    }
    stopCustomAudioRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
            this.customAudioStatusEl.textContent = 'Kayit aktif degil.';
            return;
        }
        this.mediaRecorder.stop();
        this.customAudioStopBtn.disabled = true;
        this.customAudioStatusEl.textContent = 'Kayit isleniyor...';
    }
    async finalizeCustomAudioRecording(key) {
        try {
            const displayLabel = normalizeWordLabel(this.customAudioTextInput.value) || key;
            const blob = new Blob(this.recordingChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
            if (blob.size === 0) {
                this.customAudioStatusEl.textContent = 'Bos kayit alindi, tekrar dene.';
                return;
            }
            const dataUrl = await this.blobToDataUrl(blob);
            this.customAudioMap[key] = dataUrl;
            saveCustomAudioMap(this.customAudioMap);
            this.syncSettingsToDom();
            this.renderRecordingLibrary();
            this.renderProgressPanel();
            this.notifySharedSpeechDataUpdated();
            this.customAudioStatusEl.textContent = `"${displayLabel}" kaydedildi.`;
            this.feedbackEl.textContent = `Kendi ses kaydi aktif: ${displayLabel}`;
        }
        finally {
            this.cleanupRecordingResources();
            this.customAudioStartBtn.disabled = false;
            this.customAudioStopBtn.disabled = true;
        }
    }
    playCustomAudioForInput() {
        const key = this.getCustomAudioInputKey();
        const displayLabel = normalizeWordLabel(this.customAudioTextInput.value) || key;
        if (!key) {
            this.customAudioStatusEl.textContent = 'Calmak icin once kelime veya cumle yaz.';
            return;
        }
        const dataUrl = this.customAudioMap[key];
        if (!dataUrl) {
            this.customAudioStatusEl.textContent = `"${displayLabel}" icin kayit yok.`;
            return;
        }
        this.playAudioDataUrl(dataUrl);
        this.customAudioStatusEl.textContent = `"${displayLabel}" kaydi caliniyor.`;
    }
    deleteCustomAudioForInput() {
        const key = this.getCustomAudioInputKey();
        const displayLabel = normalizeWordLabel(this.customAudioTextInput.value) || key;
        if (!key) {
            this.customAudioStatusEl.textContent = 'Silmek icin once kelime veya cumle yaz.';
            return;
        }
        if (!this.customAudioMap[key]) {
            this.customAudioStatusEl.textContent = `"${displayLabel}" icin kayit yok.`;
            return;
        }
        delete this.customAudioMap[key];
        saveCustomAudioMap(this.customAudioMap);
        this.syncSettingsToDom();
        this.renderRecordingLibrary();
        this.renderProgressPanel();
        this.notifySharedSpeechDataUpdated();
        this.customAudioStatusEl.textContent = `"${displayLabel}" kaydi silindi.`;
    }
    exportCustomAudioBackup() {
        this.refreshCustomAudioMap();
        const backupText = buildCustomAudioBackup(this.customAudioMap);
        const blob = new Blob([backupText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const stamp = new Date().toISOString().slice(0, 10);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `konusu-yorum-kayitlar-${stamp}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        this.recordingBackupStatusEl.textContent = 'Yedek dosyasi indirildi.';
    }
    async importCustomAudioBackup() {
        const file = this.recordingImportInput.files?.[0];
        if (!file) {
            return;
        }
        try {
            const raw = await file.text();
            const importedMap = parseCustomAudioBackup(raw);
            if (!importedMap) {
                this.recordingBackupStatusEl.textContent = 'Gecersiz yedek dosyasi.';
                return;
            }
            const result = mergeCustomAudioMaps(this.customAudioMap, importedMap);
            this.customAudioMap = result.mergedMap;
            saveCustomAudioMap(this.customAudioMap);
            this.syncSettingsToDom();
            this.renderRecordingLibrary();
            this.renderProgressPanel();
            this.notifySharedSpeechDataUpdated();
            this.recordingBackupStatusEl.textContent =
                `Yukleme tamamlandi. Yeni: ${result.added}, Guncellenen: ${result.replaced}`;
        }
        catch {
            this.recordingBackupStatusEl.textContent = 'Yedek dosyasi okunamadi.';
        }
        finally {
            this.recordingImportInput.value = '';
        }
    }
    renderRecordingLibrary() {
        this.refreshCustomAudioMap();
        const entries = listCustomAudioEntries(this.customAudioMap);
        this.recordingLibrarySummaryEl.textContent = `Toplam kayit: ${entries.length}`;
        if (entries.length === 0) {
            this.recordingLibraryListEl.innerHTML = '<p class="recording-backup-status">Henüz kayıt yok.</p>';
            return;
        }
        this.recordingLibraryListEl.innerHTML = entries
            .map((entry) => {
            const keyLabel = this.escapeHtml(entry.key);
            const encodedKey = encodeURIComponent(entry.key);
            const kindLabel = entry.kind === 'word' ? 'Kelime' : 'Cumle';
            return `
          <div class="recording-row" data-key="${encodedKey}">
            <div class="recording-meta">
              <span class="recording-key">${keyLabel}</span>
              <span class="recording-kind">${kindLabel}</span>
            </div>
            <div class="recording-row-actions">
              <button type="button" class="recording-btn" data-action="play" data-key="${encodedKey}">Cal</button>
              <button type="button" class="recording-btn" data-action="rerecord" data-key="${encodedKey}">Yeniden Kaydet</button>
              <button type="button" class="recording-btn" data-action="delete" data-key="${encodedKey}">Sil</button>
            </div>
          </div>
        `;
        })
            .join('');
    }
    renderProgressPanel() {
        this.refreshCustomAudioMap();
        const wordRows = getAllWordProfiles().map((item) => {
            const key = normalizeSpeechKey(item.label);
            const hasRecording = Boolean(this.customAudioMap[key]);
            const listenCount = getWordListenCount(item.label);
            const setDefinition = getSpeechSetDefinition(item.setId);
            return {
                id: item.word,
                word: item.word,
                label: item.label,
                level: item.level,
                setId: item.setId,
                setLabel: setDefinition?.label ?? item.setId,
                imageSrc: item.imageSrc,
                guidedGifSrc: item.guidedGifSrc,
                hasCustomImage: item.hasCustomImage,
                hasCustomGuidedGif: item.hasCustomGuidedGif,
                hasRecording,
                listenCount
            };
        });
        const withRecordingCount = wordRows.filter((row) => row.hasRecording).length;
        const totalListens = wordRows.reduce((sum, row) => sum + row.listenCount, 0);
        const topSentences = getTopSentenceListens(5);
        const activeSetRows = wordRows.filter((row) => row.setId === this.settings.activeSet);
        const activeSetRecordingCount = activeSetRows.filter((row) => row.hasRecording).length;
        this.rootEl.setAttribute('data-word-recording-coverage', `${withRecordingCount}/${VOCABULARY.length}`);
        this.rootEl.setAttribute('data-total-word-listens', String(totalListens));
        this.progressResetBtn.disabled = totalListens === 0 && topSentences.length === 0;
        this.progressSummaryEl.textContent =
            `Kayitli kelime: ${withRecordingCount}/${VOCABULARY.length} | Toplam kelime dinleme: ${totalListens}`;
        this.progressWordListEl.innerHTML = wordRows
            .map((row) => `
          <div class="progress-row" data-word-id="${row.id}">
            <div class="progress-row-head">
              <div class="progress-word-main">
                <div class="progress-word-preview">
                  ${row.imageSrc ? `<img src="${this.escapeHtml(row.imageSrc)}" alt="" />` : '<span>Gorsel</span>'}
                </div>
                <div class="progress-word-fields">
                  <input
                    class="progress-word-input"
                    data-word-id="${row.id}"
                    value="${this.escapeHtml(row.label)}"
                    aria-label="${this.escapeHtml(row.word)} kelimesi"
                  />
                  <span class="progress-value">Kayit: ${row.hasRecording ? 'Var' : 'Yok'} | Dinleme: ${row.listenCount}</span>
                  <span class="progress-value">Set: ${this.escapeHtml(this.toDisplayLabel(row.setLabel))} | Seviye: ${this.escapeHtml(SPEECH_LEVEL_LABELS[row.level])}</span>
                </div>
              </div>
            </div>
            <div class="progress-row-actions">
              <button
                type="button"
                class="progress-record-btn"
                data-action="save-label"
                data-word-id="${row.id}"
              >
                Kelimeyi Kaydet
              </button>
              <label class="progress-record-btn file-btn">
                Gorsel Ekle
                <input
                  class="progress-image-input"
                  data-word-id="${row.id}"
                  type="file"
                  accept="image/*"
                />
              </label>
              <label class="progress-record-btn file-btn">
                Rehber GIF
                <input
                  class="progress-guided-gif-input"
                  data-word-id="${row.id}"
                  type="file"
                  accept="image/*"
                />
              </label>
              <button
                type="button"
                class="progress-record-btn"
                data-action="clear-image"
                data-word-id="${row.id}"
                ${row.hasCustomImage ? '' : 'disabled'}
              >
                Gorseli Sil
              </button>
              <button
                type="button"
                class="progress-record-btn"
                data-action="clear-guided-gif"
                data-word-id="${row.id}"
                ${row.hasCustomGuidedGif ? '' : 'disabled'}
              >
                GIF'i Sil
              </button>
              <button
                type="button"
                class="progress-record-btn"
                data-action="record"
                data-word-id="${row.id}"
              >
                ${row.hasRecording ? 'Yeniden Kaydet' : 'Kaydet'}
              </button>
              <button
                type="button"
                class="progress-record-btn"
                data-action="play"
                data-word-id="${row.id}"
                ${row.hasRecording ? '' : 'disabled'}
              >
                Cal
              </button>
              <button
                type="button"
                class="progress-record-btn"
                data-action="delete"
                data-word-id="${row.id}"
                ${row.hasRecording ? '' : 'disabled'}
              >
                Sil
              </button>
            </div>
            <div class="progress-row-tail">
              <span class="progress-value">Rehber GIF: ${row.guidedGifSrc ? 'Var' : 'Yok'}</span>
            </div>
          </div>
        `)
            .join('');
        const activeSetDefinition = getSpeechSetDefinition(this.settings.activeSet);
        const completionText = `${this.completedWordIds.size}/${activeSetRows.length || 0}`;
        this.setSummaryEl.textContent = activeSetDefinition
            ? `${this.toDisplayLabel(SPEECH_LEVEL_LABELS[this.settings.activeLevel])} • ${this.toDisplayLabel(activeSetDefinition.label)} • Tamamlanan ${completionText} • Kayit ${activeSetRecordingCount}/${activeSetRows.length || 0}`
            : `Tamamlanan ${completionText}`;
        if (topSentences.length === 0) {
            this.rootEl.setAttribute('data-top-sentence', '');
            this.rootEl.setAttribute('data-top-sentence-count', '0');
            this.progressSentenceListEl.innerHTML = '<p class="progress-summary">Henüz cümle dinleme kaydı yok.</p>';
            return;
        }
        this.rootEl.setAttribute('data-top-sentence', topSentences[0].sentence);
        this.rootEl.setAttribute('data-top-sentence-count', String(topSentences[0].count));
        this.progressSentenceListEl.innerHTML = topSentences
            .map((entry) => `
          <div class="progress-row">
            <span class="progress-name">${this.escapeHtml(entry.sentence)}</span>
            <span class="progress-value">Dinleme: ${entry.count}</span>
          </div>
        `)
            .join('');
    }
    resetProgressCounters() {
        resetListenProgress();
        this.renderProgressPanel();
        this.notifySharedSpeechDataUpdated();
        this.progressResetStatusEl.textContent = 'İlerleme sayaçları sıfırlandı. Kayıtlar korunuyor.';
        this.feedbackEl.textContent = 'Dinleme ilerlemesi sıfırlandı.';
        this.mascot.setMessage('Sıfırlandı.');
    }
    syncSharedSpeechState() {
        this.refreshCustomAudioMap();
        this.syncSettingsToDom();
        this.renderRecordingLibrary();
        this.renderProgressPanel();
    }
    playAudioDataUrl(dataUrl) {
        const audio = new Audio(dataUrl);
        audio.play().catch(() => {
            this.customAudioStatusEl.textContent = 'Kayit calinamadi.';
        });
    }
    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }
    cleanupRecordingResources() {
        if (this.recordingStream) {
            for (const track of this.recordingStream.getTracks()) {
                track.stop();
            }
        }
        this.recordingStream = null;
        this.mediaRecorder = null;
        this.recordingChunks = [];
    }
    onWordTapped(button, wordId, wordLabel, defaultRepeats) {
        this.idleReminderCount = 0;
        const resolvedRepeats = this.resolveRepeats(defaultRepeats);
        this.rootEl.setAttribute('data-last-word', wordLabel);
        this.rootEl.setAttribute('data-scene-phase', 'playing');
        this.clearPendingSpeech();
        this.clearPendingGuidance();
        this.clearIdleReminder();
        this.clearAttentionState();
        this.clearSequenceTimeouts();
        this.completedWordIds.add(wordId);
        this.syncCompletedWordState();
        this.updateTrayStatus();
        this.setCardsInteractive(null);
        this.clearCurrentNextTarget();
        const visualDuration = this.triggerVisual(button, wordId);
        const soundEffectDuration = this.playObjectSound(wordId);
        const speechDuration = this.triggerSpeech({ word: wordLabel, repeats: resolvedRepeats });
        const sequenceDuration = Math.max(visualDuration, speechDuration, soundEffectDuration);
        const nextButton = this.getNextButton(wordId);
        this.renderProgressPanel();
        const celebrateTimeoutId = window.setTimeout(() => {
            this.triggerMascotCelebrate();
            this.mascot.sayPraise();
        }, sequenceDuration);
        this.sequenceTimeoutIds.push(celebrateTimeoutId);
        if (nextButton) {
            this.scheduleGuidedTransition(button, nextButton, sequenceDuration);
            return;
        }
        this.scheduleSetCompletion(sequenceDuration);
    }
    startIntroSequence() {
        const firstButton = this.gridEl.querySelector('.word-card');
        if (!firstButton) {
            return;
        }
        this.setCardsInteractive(null);
        this.clearCurrentNextTarget();
        this.rootEl.setAttribute('data-scene-phase', 'intro');
        this.rootEl.setAttribute('data-guide-active', 'true');
        this.rootEl.setAttribute('data-guide-prompt', 'Hadi oynayalım');
        this.renderFocusCard(this.getActiveSetProfiles()[0] ?? null);
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
        const profile = this.getResolvedWordProfile(targetButton.dataset.wordId);
        const promptText = this.buildTargetPrompt(profile);
        this.rootEl.setAttribute('data-guide-prompt', promptText);
        this.rootEl.setAttribute('data-guide-active', 'true');
        this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
        this.renderFocusCard(profile, true);
        this.feedbackEl.textContent = 'Hedef nesne hazır.';
        this.placeGuideMascot(this.getGuideTargetButton(targetButton));
        this.mascot.showIdle(promptText);
        this.mascot.sayNextPrompt();
        this.scheduleIdleReminder(this.getGuideTargetButton(targetButton));
    }
    onWrongWordTapped(button, wordId, wordLabel, defaultRepeats) {
        if (!this.activeNextButton) {
            return;
        }
        this.idleReminderCount = 0;
        this.rootEl.setAttribute('data-last-word', wordLabel);
        this.rootEl.setAttribute('data-scene-phase', 'playing');
        this.clearIdleReminder();
        this.clearAttentionState();
        this.clearPendingSpeech();
        button.classList.remove('is-wrong');
        void button.offsetWidth;
        button.classList.add('is-wrong');
        const resolvedRepeats = this.resolveRepeats(defaultRepeats);
        const visualDuration = this.triggerVisual(button, wordId);
        const soundEffectDuration = this.playObjectSound(wordId);
        const speechDuration = this.triggerSpeech({ word: wordLabel, repeats: resolvedRepeats });
        const resetDelay = Math.max(visualDuration, soundEffectDuration, speechDuration);
        this.feedbackEl.textContent = 'Pofi doğru resmi tekrar gösteriyor.';
        this.rootEl.setAttribute('data-guide-mode', 'calm');
        this.rootEl.setAttribute('data-guide-prompt', 'Bir daha deneyelim');
        this.mascot.showCalm('Bir daha deneyelim.');
        const resetTimeoutId = window.setTimeout(() => {
            button.classList.remove('is-wrong');
            if (this.activeNextButton) {
                const profile = this.getResolvedWordProfile(this.activeNextButton.dataset.wordId);
                const promptText = this.buildTargetPrompt(profile);
                this.renderFocusCard(profile, true);
                this.placeGuideMascot(this.getGuideTargetButton(this.activeNextButton));
                this.rootEl.setAttribute('data-scene-phase', 'awaiting-tap');
                this.rootEl.setAttribute('data-guide-mode', 'idle');
                this.rootEl.setAttribute('data-guide-prompt', promptText);
                this.scheduleIdleReminder(this.getGuideTargetButton(this.activeNextButton));
            }
        }, resetDelay + 220);
        this.sequenceTimeoutIds.push(resetTimeoutId);
    }
    placeGuideMascotAtCenter() {
        const stageRect = this.stageEl.getBoundingClientRect();
        const mascotSize = this.guideMascotEl.getBoundingClientRect().width || 88;
        const x = stageRect.width / 2 - mascotSize / 2;
        const y = Math.max(18, stageRect.height * 0.08);
        this.guideLayerEl.classList.add('is-active');
        this.setGuideTransform(x, y, 1);
        this.updateGuideWeatherField(null, y);
    }
    resolveRepeats(defaultRepeats) {
        if (this.settings.repeatMode === 'default') {
            return defaultRepeats;
        }
        return Number(this.settings.repeatMode);
    }
    triggerVisual(button, word) {
        const duration = word === 'su' ? 1600 : 820;
        const shouldAnimateFocus = this.focusCardBtn.dataset.wordId === word;
        if (this.visualResetTimeoutId !== null) {
            window.clearTimeout(this.visualResetTimeoutId);
            this.visualResetTimeoutId = null;
        }
        button.classList.remove('is-speaking');
        if (shouldAnimateFocus) {
            this.focusCardBtn.classList.remove('is-speaking');
        }
        void button.offsetWidth;
        button.classList.add('is-speaking');
        if (shouldAnimateFocus) {
            void this.focusCardBtn.offsetWidth;
            this.focusCardBtn.classList.add('is-speaking');
        }
        this.visualResetTimeoutId = window.setTimeout(() => {
            button.classList.remove('is-speaking');
            this.focusCardBtn.classList.remove('is-speaking');
            this.visualResetTimeoutId = null;
        }, duration);
        if (word !== 'su') {
            return duration;
        }
        this.rootEl.setAttribute('data-water-spilled', 'true');
        button.classList.remove('is-spilling');
        this.focusCardBtn.classList.remove('is-spilling');
        void button.offsetWidth;
        button.classList.add('is-spilling');
        if (shouldAnimateFocus) {
            this.focusCardBtn.classList.add('is-spilling');
        }
        this.triggerWaterFocusVisual();
        window.setTimeout(() => {
            button.classList.remove('is-spilling');
            this.focusCardBtn.classList.remove('is-spilling');
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
            this.renderProgressPanel();
            this.notifySharedSpeechDataUpdated();
            return;
        }
        this.speakWithTts(word);
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
    refreshCustomAudioMap() {
        this.customAudioMap = loadCustomAudioMap();
    }
    loadSettings() {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            const activeLevel = this.normalizeLevelId(parsed.activeLevel);
            this.settings = {
                repeatMode: this.normalizeRepeatMode(parsed.repeatMode),
                activeLevel,
                activeSet: this.normalizeSetId(parsed.activeSet, activeLevel),
                autoProgress: typeof parsed.autoProgress === 'boolean' ? parsed.autoProgress : true,
                pinnedSet: typeof parsed.pinnedSet === 'boolean' ? parsed.pinnedSet : false
            };
        }
        catch {
            this.settings = {
                repeatMode: 'default',
                activeLevel: DEFAULT_SPEECH_LEVEL,
                activeSet: DEFAULT_SPEECH_SET,
                autoProgress: true,
                pinnedSet: false
            };
        }
    }
    saveSettings() {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    }
    syncSettingsToDom() {
        this.levelSelect.value = this.settings.activeLevel;
        this.setSelect.value = this.settings.activeSet;
        this.repeatModeSelect.value = this.settings.repeatMode;
        this.autoProgressCheckbox.checked = this.settings.autoProgress;
        this.pinSetCheckbox.checked = this.settings.pinnedSet;
        this.rootEl.setAttribute('data-active-level', this.settings.activeLevel);
        this.rootEl.setAttribute('data-active-set', this.settings.activeSet);
        this.rootEl.setAttribute('data-auto-progress', String(this.getEffectiveAutoProgress()));
        this.rootEl.setAttribute('data-pinned-set', String(this.settings.pinnedSet));
        this.rootEl.setAttribute('data-repeat-mode', this.settings.repeatMode);
        this.rootEl.setAttribute('data-custom-audio-count', String(Object.keys(this.customAudioMap).length));
        this.updateTrayStatus();
    }
    normalizeLevelId(value) {
        return getSpeechLevelIds().includes(value)
            ? value
            : DEFAULT_SPEECH_LEVEL;
    }
    normalizeSetId(value, activeLevel = DEFAULT_SPEECH_LEVEL) {
        const matchingSet = getSpeechSets(activeLevel).find((item) => item.id === value);
        return matchingSet?.id ?? getSpeechSets(activeLevel)[0]?.id ?? DEFAULT_SPEECH_SET;
    }
    getEffectiveAutoProgress() {
        return this.settings.autoProgress && !this.settings.pinnedSet;
    }
    normalizeRepeatMode(value) {
        if (value === '1' || value === '2' || value === '3') {
            return value;
        }
        return 'default';
    }
    escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
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
            // Keep the guidance flow running even if TTS is unavailable.
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
        this.guideLayerEl.classList.remove('is-attention');
        this.guideLayerEl.classList.remove('is-sleepy');
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
            this.activeNextButton.classList.remove('is-next-target');
            this.activeNextButton.classList.remove('is-attention-target');
            this.activeNextButton.classList.remove('is-wrong');
            this.activeNextButton.classList.remove('is-choice-enabled');
            this.activeNextButton.removeAttribute('data-next-target');
            this.activeNextButton = null;
        }
        Array.from(this.gridEl.querySelectorAll('.word-card')).forEach((button) => {
            button.classList.remove('is-choice-enabled', 'is-wrong');
        });
        this.focusCardBtn.classList.remove('is-target', 'is-speaking', 'is-spilling');
        this.focusCardBtn.disabled = true;
        this.rootEl.setAttribute('data-next-word', '');
        this.rootEl.setAttribute('data-current-target', '');
        this.rootEl.setAttribute('data-guided-target', '');
        this.rootEl.setAttribute('data-guide-active', 'false');
        this.idleReminderCount = 0;
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
    moveGuideMascot(currentButton, nextButton) {
        const from = this.resolveGuidePosition(this.getGuideTargetButton(currentButton));
        const to = this.resolveGuidePosition(this.getGuideTargetButton(nextButton));
        this.clearAttentionState();
        this.guideLayerEl.classList.add('is-active');
        this.setGuideTransform(from.x, from.y, 0.84);
        this.updateGuideWeatherField(this.getGuideTargetButton(currentButton), from.y);
        this.rootEl.setAttribute('data-guide-mode', 'travel');
        void this.guideMascotEl.offsetWidth;
        window.requestAnimationFrame(() => {
            this.setGuideTransform(to.x, to.y, 1);
            this.updateGuideWeatherField(this.getGuideTargetButton(nextButton), to.y);
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
        this.updateGuideWeatherField(button, target.y);
        this.rootEl.setAttribute('data-guide-mode', 'idle');
    }
    resolveHideoutPosition(hideoutEl) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const hideoutRect = hideoutEl.getBoundingClientRect();
        const mascotSize = this.guideMascotEl.getBoundingClientRect().width || 88;
        const x = hideoutRect.left - stageRect.left + hideoutRect.width / 2 - mascotSize / 2;
        const y = hideoutRect.top - stageRect.top + Math.max(0, hideoutRect.height * 0.12);
        return {
            x: Math.max(6, Math.min(x, Math.max(6, stageRect.width - mascotSize - 6))),
            y: Math.max(0, y)
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
    updateGuideWeatherField(targetButton, guideY) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const mascotRect = this.guideMascotEl.getBoundingClientRect();
        const guideLift = Number.parseFloat(getComputedStyle(this.guideMascotEl).getPropertyValue('--guide-y-lift')) || 0;
        const targetRect = targetButton?.getBoundingClientRect();
        const fieldWidth = targetRect
            ? Math.min(stageRect.width - 32, Math.max(180, targetRect.width + 54))
            : Math.min(stageRect.width * 0.34, 220);
        const weatherStartTop = guideY + guideLift + mascotRect.height * 0.56;
        const targetBottom = targetRect
            ? targetRect.bottom - stageRect.top + 14
            : stageRect.height - 12;
        const fallHeight = Math.max(132, targetBottom - weatherStartTop);
        const targetCenterX = targetRect
            ? targetRect.left - stageRect.left + targetRect.width / 2
            : stageRect.width / 2;
        const fieldCenterX = targetCenterX - (mascotRect.left - stageRect.left);
        this.guideMascotEl.style.setProperty('--guide-weather-width', `${fieldWidth}px`);
        this.guideMascotEl.style.setProperty('--guide-weather-height', `${fallHeight}px`);
        this.guideMascotEl.style.setProperty('--guide-weather-center-x', `${fieldCenterX}px`);
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
        const canChoose = activeButton !== null;
        this.focusCardBtn.disabled = !canChoose;
        this.focusCardBtn.setAttribute('aria-disabled', String(!canChoose));
    }
    resolveGuidePosition(button) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const mascotSize = this.guideMascotEl.getBoundingClientRect().width || 84;
        if (button === this.focusCardBtn) {
            const x = buttonRect.left - stageRect.left + buttonRect.width / 2 - mascotSize / 2;
            const y = buttonRect.top - stageRect.top - mascotSize * 0.06;
            return {
                x: Math.max(20, Math.min(x, Math.max(20, stageRect.width - mascotSize - 20))),
                y: Math.max(20, Math.min(y, Math.max(20, stageRect.height - mascotSize - 20)))
            };
        }
        const wordId = button.dataset.wordId;
        const anchor = (wordId ? GUIDE_WORD_ANCHORS[wordId] : null) ?? {
            xAlign: 'center',
            yAlign: 'top',
            xShift: 0,
            yShift: 0
        };
        let x = buttonRect.left - stageRect.left + buttonRect.width / 2 - mascotSize / 2;
        if (anchor.xAlign === 'left') {
            x = buttonRect.left - stageRect.left - mascotSize * 0.64;
        }
        else if (anchor.xAlign === 'right') {
            x = buttonRect.right - stageRect.left - mascotSize * 0.36;
        }
        let y = buttonRect.top - stageRect.top - mascotSize * 0.82;
        if (anchor.yAlign === 'middle') {
            y = buttonRect.top - stageRect.top + buttonRect.height / 2 - mascotSize * 0.58;
        }
        else if (anchor.yAlign === 'bottom') {
            y = buttonRect.bottom - stageRect.top - mascotSize * 0.22;
        }
        x += anchor.xShift ?? 0;
        y += anchor.yShift ?? 0;
        const safeInsetX = 20;
        const safeInsetY = 18;
        return {
            x: Math.max(safeInsetX, Math.min(x, Math.max(safeInsetX, stageRect.width - mascotSize - safeInsetX))),
            y: Math.max(safeInsetY, Math.min(y, Math.max(safeInsetY, stageRect.height - mascotSize - safeInsetY)))
        };
    }
    getNextButton(currentWordId) {
        const buttons = Array.from(this.gridEl.querySelectorAll('.word-card'));
        const currentIndex = buttons.findIndex((button) => button.dataset.wordId === currentWordId);
        if (buttons.length === 0) {
            return null;
        }
        if (currentIndex < 0) {
            return buttons[0] ?? null;
        }
        return buttons[currentIndex + 1] ?? null;
    }
    scheduleIdleReminder(targetButton, delayMs) {
        this.clearIdleReminder();
        if (!targetButton) {
            return;
        }
        const resolvedDelay = delayMs ??
            (GUIDE_REMINDER_DELAY_MS + Math.round(Math.random() * GUIDE_REMINDER_VARIANCE_MS));
        this.idleReminderTimeoutId = window.setTimeout(() => {
            if (!this.activeNextButton || !this.isGuideTargetStillActive(targetButton)) {
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
        this.guideLayerEl.classList.remove('is-attention');
        this.guideLayerEl.classList.remove('is-sleepy');
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
            if (!this.isGuideTargetStillActive(targetButton)) {
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
                if (this.isGuideTargetStillActive(targetButton)) {
                    targetButton.classList.remove('is-attention-target');
                }
                this.guideLayerEl.classList.remove('is-attention');
                delete this.guideLayerEl.dataset.attentionEffect;
                this.setGuideTransform(target.x, target.y, 1);
                this.rootEl.setAttribute('data-guide-mode', 'idle');
                this.rootEl.setAttribute('data-attention-strength', '1');
                this.attentionResetTimeoutId = null;
            }, ATTENTION_EFFECT_DURATION_MS);
        }, sleepyLeadMs);
        this.sequenceTimeoutIds.push(attentionTimeoutId);
    }
    getNextAttentionEffect() {
        if (this.attentionEffectBag.length === 0) {
            this.attentionEffectBag = this.shuffleArray([
                'rain',
                'snow',
                'wind',
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
    shuffleArray(values) {
        const nextValues = [...values];
        for (let index = nextValues.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [nextValues[index], nextValues[swapIndex]] = [nextValues[swapIndex], nextValues[index]];
        }
        return nextValues;
    }
    isGuideTargetStillActive(targetButton) {
        const activeWordId = this.activeNextButton?.dataset.wordId ?? '';
        return Boolean(activeWordId && targetButton.dataset.wordId === activeWordId);
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
    buildGuideWaitPrompt(word) {
        if (!word) {
            return 'Ben burada bekliyorum.';
        }
        const profile = this.getResolvedWordProfile(word);
        const promptLabel = profile.promptLabel || profile.label;
        if (promptLabel !== word) {
            return `${this.toDisplayLabel(promptLabel)} icin bekliyorum.`;
        }
        return GUIDE_WAIT_PROMPTS[word] ?? `${this.toDisplayLabel(promptLabel)} icin bekliyorum.`;
    }
}
//# sourceMappingURL=index.js.map