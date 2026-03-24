import { VOCABULARY } from '../data/vocabulary.js';
import { clearWordImage, getAllWordProfiles, normalizeWordLabel, updateWordImage, updateWordLabel } from '../data/wordProfiles.js';
import { getTopSentenceListens, getWordListenCount, incrementWordListen, renameWordListenKey, resetListenProgress } from '../progress/listening.js';
import { buildCustomAudioBackup, listCustomAudioEntries, loadCustomAudioMap, mergeCustomAudioMaps, normalizeSpeechKey, renameCustomAudioKey, parseCustomAudioBackup, saveCustomAudioMap } from './customAudio.js';
const SETTINGS_STORAGE_KEY = 'konusu_yorum_speech_settings_v1';
const SCENE_VOCABULARY = VOCABULARY.filter((item) => item.featuredOnScene);
const GUIDE_REMINDER_DELAY_MS = navigator.webdriver ? 1400 : 9400;
const GUIDE_REMINDER_VARIANCE_MS = navigator.webdriver ? 0 : 2400;
const GUIDE_REMINDER_RETRY_MS = navigator.webdriver ? 300 : 1800;
const GUIDE_WAIT_PROMPTS = {
    su: 'Ben suyun yanında bekliyorum.',
    top: 'Ben topun yanında bekliyorum.',
    araba: 'Ben arabanın yanında bekliyorum.',
    kitap: 'Ben kitabın yanında bekliyorum.',
    elma: 'Ben elmanın yanında bekliyorum.',
    süt: 'Ben sütün yanında bekliyorum.'
};
export class SpeechGameModule {
    rootEl;
    stageEl;
    gridEl;
    guideLayerEl;
    guideMascotEl;
    parentPanelTriggerBtn;
    feedbackEl;
    repeatModeSelect;
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
    settings = {
        repeatMode: 'default'
    };
    constructor(rootEl, mascot, controlsRootEl = rootEl) {
        const stageEl = rootEl.querySelector('#speech-stage');
        const gridEl = rootEl.querySelector('#speech-grid');
        const guideLayerEl = rootEl.querySelector('#speech-guide-layer');
        const guideMascotEl = rootEl.querySelector('#speech-guide-mascot');
        const parentPanelTriggerBtn = rootEl.querySelector('#parent-panel-trigger');
        const feedbackEl = rootEl.querySelector('#speech-feedback');
        const repeatModeSelect = controlsRootEl.querySelector('#speech-repeat-mode');
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
            !guideLayerEl ||
            !guideMascotEl ||
            !parentPanelTriggerBtn ||
            !feedbackEl ||
            !repeatModeSelect ||
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
        this.guideLayerEl = guideLayerEl;
        this.guideMascotEl = guideMascotEl;
        this.parentPanelTriggerBtn = parentPanelTriggerBtn;
        this.feedbackEl = feedbackEl;
        this.repeatModeSelect = repeatModeSelect;
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
    }
    init() {
        this.renderCards(this.getSceneProfiles());
        this.loadSettings();
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
        this.syncSettingsToDom();
        this.renderRecordingLibrary();
        this.renderProgressPanel();
        this.bindGuideLifecycleEvents();
        window.addEventListener('word-profiles-updated', () => {
            this.handleWordProfilesUpdated();
        });
        window.requestAnimationFrame(() => {
            this.activateInitialTarget();
        });
        this.mascot.sayHint();
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
              <img class="word-object-image" src="${this.escapeHtml(item.imageSrc)}" alt="" />
            </div>
            <span class="visually-hidden">${this.escapeHtml(item.label)}</span>
          </button>
        `;
        })
            .join('');
    }
    getSceneProfiles() {
        return getAllWordProfiles(SCENE_VOCABULARY);
    }
    getResolvedWordProfile(wordId) {
        const profile = getAllWordProfiles().find((item) => item.word === wordId);
        if (!profile) {
            throw new Error(`Unknown word profile: ${wordId}`);
        }
        return profile;
    }
    handleWordProfilesUpdated() {
        const previousActiveWordId = this.activeNextButton?.dataset.wordId;
        this.renderCards(this.getSceneProfiles());
        this.renderProgressPanel();
        this.renderRecordingLibrary();
        const nextWordLabel = this.rootEl.getAttribute('data-next-word') ?? '';
        const restoredButton = (previousActiveWordId
            ? Array.from(this.gridEl.querySelectorAll('.word-card')).find((button) => button.dataset.wordId === previousActiveWordId)
            : null) ??
            Array.from(this.gridEl.querySelectorAll('.word-card')).find((button) => button.dataset.wordLabel === nextWordLabel) ??
            this.gridEl.querySelector('.word-card');
        if (restoredButton) {
            this.clearCurrentNextTarget();
            this.activeNextButton = restoredButton;
            restoredButton.classList.add('is-next-target');
            restoredButton.setAttribute('data-next-target', 'true');
            this.rootEl.setAttribute('data-next-word', restoredButton.dataset.wordLabel ?? '');
            this.placeGuideMascot(restoredButton);
        }
    }
    notifyWordProfilesUpdated() {
        window.dispatchEvent(new CustomEvent('word-profiles-updated'));
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
    async updateWordImageFromFile(wordId, file) {
        if (!file.type.startsWith('image/')) {
            this.customAudioStatusEl.textContent = 'Lutfen gecerli bir gorsel sec.';
            return;
        }
        const dataUrl = await this.blobToDataUrl(file);
        updateWordImage(wordId, dataUrl);
        this.renderCards(this.getSceneProfiles());
        this.renderProgressPanel();
        this.notifyWordProfilesUpdated();
        this.customAudioStatusEl.textContent = `"${this.getResolvedWordProfile(wordId).label}" gorseli guncellendi.`;
    }
    bindEvents() {
        this.gridEl.addEventListener('click', (event) => {
            const target = event.target.closest('.word-card');
            if (!target) {
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
                this.renderCards(this.getSceneProfiles());
                this.renderProgressPanel();
                this.notifyWordProfilesUpdated();
                this.customAudioStatusEl.textContent = `"${nextLabel}" gorseli silindi.`;
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
                this.customAudioStatusEl.textContent = `"${activeProfile.label}" kaydi silindi.`;
            }
        });
        this.progressWordListEl.addEventListener('change', (event) => {
            const target = event.target;
            if (!target || !target.classList.contains('progress-image-input')) {
                return;
            }
            const wordId = target.dataset.wordId;
            const file = target.files?.[0];
            if (!wordId || !file) {
                return;
            }
            void this.updateWordImageFromFile(wordId, file).finally(() => {
                target.value = '';
            });
        });
    }
    bindGuideLifecycleEvents() {
        this.rootEl.addEventListener('speech-guidance-pause', () => {
            this.clearIdleReminder();
            this.clearAttentionState();
        });
        this.rootEl.addEventListener('speech-guidance-resume', () => {
            if (!this.activeNextButton) {
                this.activateInitialTarget();
                return;
            }
            this.placeGuideMascot(this.activeNextButton);
            this.rootEl.setAttribute('data-guide-active', 'true');
            if (!this.rootEl.getAttribute('data-guide-prompt')) {
                this.rootEl.setAttribute('data-guide-prompt', 'Hadi dokun');
            }
            this.scheduleIdleReminder(this.activeNextButton);
        });
    }
    bindSettingsEvents() {
        this.repeatModeSelect.addEventListener('change', () => {
            const repeatMode = this.repeatModeSelect.value;
            this.settings.repeatMode = repeatMode;
            this.saveSettings();
            this.syncSettingsToDom();
            this.feedbackEl.textContent = 'Ebeveyn ayarlari guncellendi.';
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
    bindParentPanelAccess() {
        this.parentPanelTriggerBtn.addEventListener('click', () => {
            this.rootEl.dispatchEvent(new CustomEvent('open-parent-panel', { bubbles: true }));
        });
        let holdTimeoutId = null;
        const clearHold = () => {
            if (holdTimeoutId !== null) {
                window.clearTimeout(holdTimeoutId);
                holdTimeoutId = null;
            }
            this.guideMascotEl.classList.remove('is-holding');
        };
        this.guideMascotEl.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) {
                return;
            }
            clearHold();
            this.guideMascotEl.classList.add('is-holding');
            holdTimeoutId = window.setTimeout(() => {
                this.parentPanelTriggerBtn.click();
                clearHold();
            }, 700);
        });
        this.guideMascotEl.addEventListener('pointerup', clearHold);
        this.guideMascotEl.addEventListener('pointerleave', clearHold);
        this.guideMascotEl.addEventListener('pointercancel', clearHold);
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
            return {
                id: item.word,
                word: item.word,
                label: item.label,
                imageSrc: item.imageSrc,
                hasCustomImage: item.hasCustomImage,
                hasRecording,
                listenCount
            };
        });
        const withRecordingCount = wordRows.filter((row) => row.hasRecording).length;
        const totalListens = wordRows.reduce((sum, row) => sum + row.listenCount, 0);
        const topSentences = getTopSentenceListens(5);
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
          </div>
        `)
            .join('');
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
        this.progressResetStatusEl.textContent = 'İlerleme sayaçları sıfırlandı. Kayıtlar korunuyor.';
        this.feedbackEl.textContent = 'Dinleme ilerlemesi sıfırlandı.';
        this.mascot.setMessage('Sıfırlandı.');
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
        const resolvedRepeats = this.resolveRepeats(defaultRepeats);
        this.rootEl.setAttribute('data-last-word', wordLabel);
        this.clearPendingSpeech();
        this.clearPendingGuidance();
        this.clearIdleReminder();
        this.clearAttentionState();
        this.clearCurrentNextTarget();
        const visualDuration = this.triggerVisual(button, wordId);
        const speechDuration = this.triggerSpeech({ word: wordLabel, repeats: resolvedRepeats });
        const sequenceDuration = Math.max(visualDuration, speechDuration);
        const nextButton = this.getNextButton(wordId);
        this.mascot.sayPraise();
        this.scheduleGuidedTransition(button, nextButton, sequenceDuration);
    }
    activateInitialTarget() {
        const firstButton = this.gridEl.querySelector('.word-card');
        if (!firstButton) {
            return;
        }
        this.activeNextButton = firstButton;
        firstButton.classList.add('is-next-target');
        firstButton.setAttribute('data-next-target', 'true');
        this.rootEl.setAttribute('data-next-word', firstButton.dataset.wordLabel ?? '');
        this.rootEl.setAttribute('data-guide-prompt', 'Hadi dokun');
        this.rootEl.setAttribute('data-guide-active', 'true');
        this.feedbackEl.textContent = 'Bir nesneye dokun.';
        this.placeGuideMascot(firstButton);
        this.scheduleIdleReminder(firstButton);
    }
    resolveRepeats(defaultRepeats) {
        if (this.settings.repeatMode === 'default') {
            return defaultRepeats;
        }
        return Number(this.settings.repeatMode);
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
        }, 1600);
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
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    }
    syncSettingsToDom() {
        this.repeatModeSelect.value = this.settings.repeatMode;
        this.rootEl.setAttribute('data-repeat-mode', this.settings.repeatMode);
        this.rootEl.setAttribute('data-custom-audio-count', String(Object.keys(this.customAudioMap).length));
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
    clearIdleReminder() {
        if (this.idleReminderTimeoutId !== null) {
            window.clearTimeout(this.idleReminderTimeoutId);
            this.idleReminderTimeoutId = null;
        }
    }
    clearAttentionState() {
        this.guideLayerEl.classList.remove('is-attention');
        this.activeNextButton?.classList.remove('is-attention-target');
        if (this.attentionResetTimeoutId !== null) {
            window.clearTimeout(this.attentionResetTimeoutId);
            this.attentionResetTimeoutId = null;
        }
        if (this.guideMotionResetTimeoutId !== null) {
            window.clearTimeout(this.guideMotionResetTimeoutId);
            this.guideMotionResetTimeoutId = null;
        }
        this.rootEl.setAttribute('data-guide-mode', 'idle');
    }
    clearCurrentNextTarget() {
        if (this.activeNextButton) {
            this.activeNextButton.classList.remove('is-next-target');
            this.activeNextButton.classList.remove('is-attention-target');
            this.activeNextButton.removeAttribute('data-next-target');
            this.activeNextButton = null;
        }
        this.rootEl.setAttribute('data-next-word', '');
        this.rootEl.setAttribute('data-guide-active', 'false');
    }
    scheduleGuidedTransition(currentButton, nextButton, delayMs) {
        if (!nextButton) {
            return;
        }
        this.guideTimeoutId = window.setTimeout(() => {
            this.moveGuideMascot(currentButton, nextButton);
            this.activeNextButton = nextButton;
            nextButton.classList.add('is-next-target');
            nextButton.setAttribute('data-next-target', 'true');
            this.rootEl.setAttribute('data-next-word', nextButton.dataset.wordLabel ?? '');
            this.rootEl.setAttribute('data-guide-prompt', 'Şimdi buna dokun');
            this.rootEl.setAttribute('data-guide-active', 'true');
            this.feedbackEl.textContent = `Siradaki hedef: ${(nextButton.dataset.wordLabel ?? '').toLocaleUpperCase('tr-TR')}`;
            this.mascot.sayNextPrompt();
            this.scheduleIdleReminder(nextButton);
            this.guideTimeoutId = null;
        }, delayMs);
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
    setGuideTransform(x, y, scale) {
        this.guideMascotEl.style.setProperty('--guide-x', `${x}px`);
        this.guideMascotEl.style.setProperty('--guide-y', `${y}px`);
        this.guideMascotEl.style.setProperty('--guide-scale', String(scale));
    }
    resolveGuidePosition(button) {
        const stageRect = this.stageEl.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const mascotSize = this.guideMascotEl.getBoundingClientRect().width || 84;
        const x = buttonRect.left - stageRect.left + buttonRect.width / 2 - mascotSize / 2;
        const y = buttonRect.top - stageRect.top - mascotSize * 0.82;
        return {
            x: Math.max(4, Math.min(x, Math.max(4, stageRect.width - mascotSize - 4))),
            y: Math.max(0, y)
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
        return buttons[(currentIndex + 1) % buttons.length] ?? null;
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
            this.runAttentionSequence(targetButton);
            this.scheduleIdleReminder(targetButton);
        }, resolvedDelay);
    }
    runAttentionSequence(targetButton) {
        const target = this.resolveGuidePosition(targetButton);
        const prompt = this.buildGuideWaitPrompt(targetButton.dataset.wordId);
        this.clearAttentionState();
        this.guideLayerEl.classList.add('is-active');
        this.guideLayerEl.classList.remove('is-attention');
        targetButton.classList.remove('is-attention-target');
        void this.guideLayerEl.offsetWidth;
        this.setGuideTransform(target.x, target.y, 1.06);
        this.guideLayerEl.classList.add('is-attention');
        targetButton.classList.add('is-attention-target');
        this.rootEl.setAttribute('data-guide-mode', 'attention');
        this.rootEl.setAttribute('data-guide-prompt', prompt);
        this.rootEl.setAttribute('data-guide-active', 'true');
        this.feedbackEl.textContent = prompt;
        this.mascot.sayAttention(prompt);
        this.attentionResetTimeoutId = window.setTimeout(() => {
            if (this.activeNextButton === targetButton) {
                targetButton.classList.remove('is-attention-target');
            }
            this.guideLayerEl.classList.remove('is-attention');
            this.setGuideTransform(target.x, target.y, 1);
            this.rootEl.setAttribute('data-guide-mode', 'idle');
            this.attentionResetTimeoutId = null;
        }, 1550);
    }
    buildGuideWaitPrompt(word) {
        if (!word) {
            return 'Ben burada bekliyorum.';
        }
        const fallbackLabel = this.getResolvedWordProfile(word).label;
        if (fallbackLabel !== word) {
            return `${fallbackLabel} icin bekliyorum.`;
        }
        return GUIDE_WAIT_PROMPTS[word] ?? `${fallbackLabel} icin bekliyorum.`;
    }
}
//# sourceMappingURL=index.js.map