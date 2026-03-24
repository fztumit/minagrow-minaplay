import { getPackSentenceProgress, getPackWeeklyMomentum, incrementPackSentenceListen, incrementSentenceListen, incrementWordListen } from '../progress/listening.js';
import { loadCustomAudioMap, normalizeSpeechKey, saveCustomAudioMap } from '../speech/customAudio.js';
import { STORIES_BY_LEVEL_AND_PACK, STORY_PACK_OPTIONS } from './data.js';
const EASY_SENTENCE_STORAGE_KEY = 'konusu_yorum_easy_sentences_v1';
const CUSTOM_EASY_STORY_ID = 'easy-ozel-cumleler';
export class StoriesModule {
    rootEl;
    levelSelect;
    packSelect;
    easySentenceForm;
    easySentenceInput;
    easySentenceHint;
    easySentenceListEl;
    listEl;
    titleEl;
    sentenceEl;
    counterEl;
    listenBtn;
    repeatBtn;
    nextBtn;
    storyAudioTargetEl;
    storyAudioStatusEl;
    storyRecordStartBtn;
    storyRecordStopBtn;
    storyRecordPlayBtn;
    storyRecordDeleteBtn;
    storyPackProgressSummaryEl;
    storyPackProgressListEl;
    storyPackCompareSummaryEl;
    storyPackCompareListEl;
    mascot;
    level = 'easy';
    pack = 'core';
    storyIndex = 0;
    sentenceIndex = 0;
    lastSpokenSentence = '';
    customEasySentences = [];
    customAudioMap = {};
    mediaRecorder = null;
    recordingChunks = [];
    recordingStream = null;
    constructor(rootEl, mascot, controlsRoot = rootEl) {
        const levelSelect = controlsRoot.querySelector('#story-level-select');
        const packSelect = controlsRoot.querySelector('#story-pack-select');
        const easySentenceForm = controlsRoot.querySelector('#easy-sentence-form');
        const easySentenceInput = controlsRoot.querySelector('#easy-sentence-input');
        const easySentenceHint = controlsRoot.querySelector('#easy-sentence-hint');
        const easySentenceListEl = controlsRoot.querySelector('#easy-sentence-list');
        const listEl = rootEl.querySelector('#story-list');
        const titleEl = rootEl.querySelector('#story-title');
        const sentenceEl = rootEl.querySelector('#story-sentence');
        const counterEl = rootEl.querySelector('#story-counter');
        const listenBtn = rootEl.querySelector('#story-listen');
        const repeatBtn = rootEl.querySelector('#story-repeat');
        const nextBtn = rootEl.querySelector('#story-next');
        const storyAudioTargetEl = controlsRoot.querySelector('#story-audio-target');
        const storyAudioStatusEl = controlsRoot.querySelector('#story-audio-status');
        const storyRecordStartBtn = controlsRoot.querySelector('#story-audio-record-start');
        const storyRecordStopBtn = controlsRoot.querySelector('#story-audio-record-stop');
        const storyRecordPlayBtn = controlsRoot.querySelector('#story-audio-play');
        const storyRecordDeleteBtn = controlsRoot.querySelector('#story-audio-delete');
        const storyPackProgressSummaryEl = controlsRoot.querySelector('#story-pack-progress-summary');
        const storyPackProgressListEl = controlsRoot.querySelector('#story-pack-progress-list');
        const storyPackCompareSummaryEl = controlsRoot.querySelector('#story-pack-compare-summary');
        const storyPackCompareListEl = controlsRoot.querySelector('#story-pack-compare-list');
        if (!levelSelect ||
            !packSelect ||
            !easySentenceForm ||
            !easySentenceInput ||
            !easySentenceHint ||
            !easySentenceListEl ||
            !listEl ||
            !titleEl ||
            !sentenceEl ||
            !counterEl ||
            !listenBtn ||
            !repeatBtn ||
            !nextBtn ||
            !storyAudioTargetEl ||
            !storyAudioStatusEl ||
            !storyRecordStartBtn ||
            !storyRecordStopBtn ||
            !storyRecordPlayBtn ||
            !storyRecordDeleteBtn ||
            !storyPackProgressSummaryEl ||
            !storyPackProgressListEl ||
            !storyPackCompareSummaryEl ||
            !storyPackCompareListEl) {
            throw new Error('Stories module requires level, pack, editor, list, reader, and recording controls.');
        }
        this.rootEl = rootEl;
        this.levelSelect = levelSelect;
        this.packSelect = packSelect;
        this.easySentenceForm = easySentenceForm;
        this.easySentenceInput = easySentenceInput;
        this.easySentenceHint = easySentenceHint;
        this.easySentenceListEl = easySentenceListEl;
        this.listEl = listEl;
        this.titleEl = titleEl;
        this.sentenceEl = sentenceEl;
        this.counterEl = counterEl;
        this.listenBtn = listenBtn;
        this.repeatBtn = repeatBtn;
        this.nextBtn = nextBtn;
        this.storyAudioTargetEl = storyAudioTargetEl;
        this.storyAudioStatusEl = storyAudioStatusEl;
        this.storyRecordStartBtn = storyRecordStartBtn;
        this.storyRecordStopBtn = storyRecordStopBtn;
        this.storyRecordPlayBtn = storyRecordPlayBtn;
        this.storyRecordDeleteBtn = storyRecordDeleteBtn;
        this.storyPackProgressSummaryEl = storyPackProgressSummaryEl;
        this.storyPackProgressListEl = storyPackProgressListEl;
        this.storyPackCompareSummaryEl = storyPackCompareSummaryEl;
        this.storyPackCompareListEl = storyPackCompareListEl;
        this.mascot = mascot;
    }
    init() {
        this.loadCustomEasySentences();
        this.refreshCustomAudioMap();
        this.levelSelect.value = this.level;
        this.packSelect.value = this.pack;
        this.bindEvents();
        this.renderEasySentenceList();
        this.renderStoryList();
        this.selectStory(0);
        this.syncEasyEditorAvailability();
        this.syncAudioRecorderSupport();
        this.syncStoryAudioPanel();
        this.syncRootState();
    }
    bindEvents() {
        this.levelSelect.addEventListener('change', () => {
            this.level = this.normalizeLevel(this.levelSelect.value);
            this.storyIndex = 0;
            this.sentenceIndex = 0;
            this.lastSpokenSentence = '';
            this.renderStoryList();
            this.selectStory(0);
            this.syncEasyEditorAvailability();
            this.mascot.sayHint();
        });
        this.packSelect.addEventListener('change', () => {
            this.pack = this.normalizePack(this.packSelect.value);
            this.storyIndex = 0;
            this.sentenceIndex = 0;
            this.lastSpokenSentence = '';
            this.renderStoryList();
            this.selectStory(0);
            this.syncEasyEditorAvailability();
            this.mascot.setMessage('Yeni paket.');
        });
        this.easySentenceForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.addEasySentence();
        });
        this.easySentenceListEl.addEventListener('click', (event) => {
            const target = event.target.closest('.easy-sentence-delete');
            if (!target) {
                return;
            }
            const index = Number(target.dataset.index ?? -1);
            if (!Number.isInteger(index) || index < 0 || index >= this.customEasySentences.length) {
                return;
            }
            const [removedSentence] = this.customEasySentences.splice(index, 1);
            this.saveCustomEasySentences();
            this.renderEasySentenceList();
            if (this.level === 'easy') {
                const previousStoryId = this.currentStory()?.id ?? '';
                this.renderStoryList();
                const fallbackIndex = previousStoryId ? this.findStoryIndexById(previousStoryId) : 0;
                this.selectStory(fallbackIndex >= 0 ? fallbackIndex : 0);
            }
            this.easySentenceHint.textContent = `${removedSentence} silindi.`;
        });
        this.listEl.addEventListener('click', (event) => {
            const target = event.target.closest('.story-item');
            if (!target) {
                return;
            }
            const stories = this.currentStories();
            const nextIndex = Number(target.dataset.storyIndex ?? 0);
            if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= stories.length) {
                return;
            }
            this.selectStory(nextIndex);
        });
        this.listenBtn.addEventListener('click', () => {
            this.speakCurrentSentence();
            this.mascot.sayRepeat();
        });
        this.repeatBtn.addEventListener('click', () => {
            this.speakCurrentSentence();
            this.mascot.sayRepeat();
        });
        this.nextBtn.addEventListener('click', () => {
            this.moveToNextSentence();
            this.mascot.sayHint();
        });
        this.storyRecordStartBtn.addEventListener('click', () => {
            void this.startStoryAudioRecording();
        });
        this.storyRecordStopBtn.addEventListener('click', () => {
            this.stopStoryAudioRecording();
        });
        this.storyRecordPlayBtn.addEventListener('click', () => {
            this.playCurrentStoryRecording();
        });
        this.storyRecordDeleteBtn.addEventListener('click', () => {
            this.deleteCurrentStoryRecording();
        });
    }
    addEasySentence() {
        const normalized = this.normalizeSentence(this.easySentenceInput.value);
        if (!normalized) {
            this.easySentenceHint.textContent = 'Cümle yaz.';
            return;
        }
        if (!this.isTwoWordSentence(normalized)) {
            this.easySentenceHint.textContent = 'Kolay seviye için tam 2 kelime yaz.';
            return;
        }
        if (this.customEasySentences.includes(normalized)) {
            this.easySentenceHint.textContent = 'Bu cümle zaten var.';
            return;
        }
        this.customEasySentences.push(normalized);
        this.saveCustomEasySentences();
        this.renderEasySentenceList();
        if (this.level === 'easy') {
            this.renderStoryList();
            const customStoryIndex = this.findStoryIndexById(CUSTOM_EASY_STORY_ID);
            this.selectStory(customStoryIndex >= 0 ? customStoryIndex : 0);
        }
        this.easySentenceInput.value = '';
        this.easySentenceHint.textContent = `${normalized} eklendi.`;
        this.mascot.sayPraise();
    }
    renderEasySentenceList() {
        if (this.customEasySentences.length === 0) {
            this.easySentenceListEl.innerHTML = '<p class="easy-editor-hint">Henüz özel cümle yok.</p>';
            return;
        }
        this.easySentenceListEl.innerHTML = this.customEasySentences
            .map((sentence, index) => `
          <div class="easy-sentence-row">
            <span class="easy-sentence-text">${sentence}</span>
            <button type="button" class="easy-sentence-delete" data-index="${index}">Sil</button>
          </div>
        `)
            .join('');
    }
    syncEasyEditorAvailability() {
        const easyMode = this.level === 'easy';
        const submitButton = this.easySentenceForm.querySelector('button[type="submit"]');
        this.easySentenceInput.disabled = !easyMode;
        if (submitButton) {
            submitButton.disabled = !easyMode;
        }
        if (!easyMode) {
            this.easySentenceHint.textContent = 'Kolay cümle düzenleme sadece Kolay seviyede aktiftir.';
        }
        else if (this.customEasySentences.length === 0) {
            this.easySentenceHint.textContent = '2 kelimelik cümle yaz.';
        }
    }
    renderStoryList() {
        const stories = this.currentStories();
        this.listEl.innerHTML = stories.map((story, index) => this.renderStoryButton(story, index)).join('');
        this.syncRootState();
    }
    renderStoryButton(story, index) {
        return `
      <button type="button" class="story-item" data-story-index="${index}" data-story-id="${story.id}">
        ${story.emoji} ${story.title}
      </button>
    `;
    }
    selectStory(index) {
        const stories = this.currentStories();
        if (stories.length === 0) {
            this.titleEl.textContent = 'Hikaye';
            this.sentenceEl.textContent = 'Hikaye yok.';
            this.counterEl.textContent = '';
            this.syncStoryAudioPanel();
            this.syncRootState();
            return;
        }
        this.storyIndex = Math.min(Math.max(index, 0), stories.length - 1);
        this.sentenceIndex = 0;
        this.updateStoryListSelection();
        this.syncReader();
        this.syncStoryAudioPanel();
        this.syncRootState();
    }
    moveToNextSentence() {
        const story = this.currentStory();
        if (!story) {
            return;
        }
        this.sentenceIndex = (this.sentenceIndex + 1) % story.sentences.length;
        this.syncReader();
        this.syncStoryAudioPanel();
        this.syncRootState();
    }
    syncReader() {
        const story = this.currentStory();
        if (!story) {
            this.titleEl.textContent = 'Hikaye';
            this.sentenceEl.textContent = 'Hikaye yok.';
            this.counterEl.textContent = '';
            return;
        }
        const sentence = story.sentences[this.sentenceIndex];
        this.titleEl.textContent = `${story.emoji} ${story.title}`;
        this.sentenceEl.textContent = sentence;
        this.counterEl.textContent = `Cümle ${this.sentenceIndex + 1} / ${story.sentences.length}`;
    }
    updateStoryListSelection() {
        this.listEl.querySelectorAll('.story-item').forEach((button, index) => {
            button.classList.toggle('active', index === this.storyIndex);
        });
    }
    speakCurrentSentence() {
        const sentence = this.currentSentence();
        if (!sentence) {
            return;
        }
        this.lastSpokenSentence = sentence;
        this.rootEl.dispatchEvent(new CustomEvent('story-activity', {
            detail: {
                sentence,
                pack: this.pack,
                storyId: this.currentStory()?.id ?? ''
            }
        }));
        const runtime = window;
        runtime.__speechLog = runtime.__speechLog ?? [];
        runtime.__speechLog.push(sentence);
        this.refreshCustomAudioMap();
        const sentenceKey = normalizeSpeechKey(sentence);
        const sentenceAudio = this.customAudioMap[sentenceKey] ?? null;
        if (sentenceAudio) {
            incrementSentenceListen(sentence);
            incrementPackSentenceListen(this.pack, sentence);
            this.incrementWordListensFromSentence(sentence);
            this.playAudioDataUrl(sentenceAudio);
            this.syncRootState();
            return;
        }
        const wordKeys = this.extractWordKeys(sentence);
        const chunkAudios = wordKeys.map((wordKey) => ({ wordKey, dataUrl: this.customAudioMap[wordKey] ?? null }));
        const playableChunks = chunkAudios.filter((item) => Boolean(item.dataUrl));
        if (playableChunks.length > 0) {
            incrementSentenceListen(sentence);
            incrementPackSentenceListen(this.pack, sentence);
            const queueIntervalMs = 1150;
            playableChunks.forEach((item, index) => {
                window.setTimeout(() => {
                    if (item.dataUrl) {
                        incrementWordListen(item.wordKey);
                        this.playAudioDataUrl(item.dataUrl);
                    }
                }, index * queueIntervalMs);
            });
            this.syncRootState();
            return;
        }
        this.mascot.setMessage('Kayıt yok.');
        this.syncRootState();
    }
    extractWordKeys(sentence) {
        const cleaned = sentence
            .trim()
            .replace(/[.,!?;:"'()\[\]{}]/g, ' ')
            .replace(/\s+/g, ' ');
        return cleaned
            .split(' ')
            .map((word) => normalizeSpeechKey(word))
            .filter((word) => word.length > 0);
    }
    incrementWordListensFromSentence(sentence) {
        const words = this.extractWordKeys(sentence);
        for (const word of words) {
            incrementWordListen(word);
        }
    }
    playAudioDataUrl(dataUrl) {
        const audio = new Audio(dataUrl);
        audio.play().catch(() => {
            // no-op
        });
    }
    refreshCustomAudioMap() {
        this.customAudioMap = loadCustomAudioMap();
    }
    currentSentence() {
        const story = this.currentStory();
        if (!story) {
            return null;
        }
        return story.sentences[this.sentenceIndex] ?? null;
    }
    currentSentenceKey() {
        const sentence = this.currentSentence();
        if (!sentence) {
            return null;
        }
        return normalizeSpeechKey(sentence);
    }
    syncAudioRecorderSupport() {
        const supported = typeof window.MediaRecorder !== 'undefined' &&
            !!navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function';
        if (supported) {
            return;
        }
        this.storyRecordStartBtn.disabled = true;
        this.storyRecordStopBtn.disabled = true;
        this.storyRecordPlayBtn.disabled = true;
        this.storyRecordDeleteBtn.disabled = true;
        this.storyAudioStatusEl.textContent = 'Bu tarayicida ses kaydi desteklenmiyor.';
    }
    syncStoryAudioPanel() {
        this.refreshCustomAudioMap();
        const sentence = this.currentSentence();
        const key = this.currentSentenceKey();
        const recorderSupported = typeof window.MediaRecorder !== 'undefined' &&
            !!navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function';
        if (!sentence || !key) {
            this.storyAudioTargetEl.textContent = 'Secili cumle: -';
            this.storyRecordStartBtn.disabled = true;
            this.storyRecordStopBtn.disabled = true;
            this.storyRecordPlayBtn.disabled = true;
            this.storyRecordDeleteBtn.disabled = true;
            return;
        }
        this.storyAudioTargetEl.textContent = `Secili cumle: ${sentence}`;
        this.storyRecordStartBtn.disabled = !recorderSupported || this.mediaRecorder?.state === 'recording';
        this.storyRecordStopBtn.disabled = !recorderSupported || this.mediaRecorder?.state !== 'recording';
        const hasRecording = Boolean(this.customAudioMap[key]);
        this.storyRecordPlayBtn.disabled = !hasRecording;
        this.storyRecordDeleteBtn.disabled = !hasRecording;
        this.storyAudioStatusEl.textContent = hasRecording
            ? 'Bu cumle icin kayit var.'
            : 'Bu cumle icin henuz kayit yok.';
    }
    async startStoryAudioRecording() {
        const key = this.currentSentenceKey();
        if (!key) {
            this.storyAudioStatusEl.textContent = 'Kayit icin once cumle sec.';
            return;
        }
        if (typeof window.MediaRecorder === 'undefined' ||
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== 'function') {
            this.storyAudioStatusEl.textContent = 'Bu tarayicida ses kaydi desteklenmiyor.';
            return;
        }
        if (this.mediaRecorder?.state === 'recording') {
            this.storyAudioStatusEl.textContent = 'Kayit zaten devam ediyor.';
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
                void this.finalizeStoryAudioRecording(key);
            };
            this.mediaRecorder.start();
            this.storyRecordStartBtn.disabled = true;
            this.storyRecordStopBtn.disabled = false;
            this.storyAudioStatusEl.textContent = `"${key}" icin kayit aliniyor...`;
        }
        catch {
            this.cleanupRecordingResources();
            this.storyAudioStatusEl.textContent = 'Mikrofon acilamadi. Tarayici izinlerini kontrol et.';
        }
    }
    stopStoryAudioRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
            this.storyAudioStatusEl.textContent = 'Kayit aktif degil.';
            return;
        }
        this.mediaRecorder.stop();
        this.storyRecordStopBtn.disabled = true;
        this.storyAudioStatusEl.textContent = 'Kayit isleniyor...';
    }
    async finalizeStoryAudioRecording(key) {
        try {
            const blob = new Blob(this.recordingChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
            if (blob.size === 0) {
                this.storyAudioStatusEl.textContent = 'Bos kayit alindi, tekrar dene.';
                return;
            }
            const dataUrl = await this.blobToDataUrl(blob);
            this.customAudioMap[key] = dataUrl;
            saveCustomAudioMap(this.customAudioMap);
            this.storyAudioStatusEl.textContent = `"${key}" kaydedildi.`;
            this.syncStoryAudioPanel();
            this.syncRootState();
        }
        finally {
            this.cleanupRecordingResources();
            this.storyRecordStartBtn.disabled = false;
            this.storyRecordStopBtn.disabled = true;
        }
    }
    playCurrentStoryRecording() {
        this.refreshCustomAudioMap();
        const key = this.currentSentenceKey();
        if (!key) {
            this.storyAudioStatusEl.textContent = 'Calmak icin once cumle sec.';
            return;
        }
        const dataUrl = this.customAudioMap[key];
        if (!dataUrl) {
            this.storyAudioStatusEl.textContent = `"${key}" icin kayit yok.`;
            return;
        }
        this.playAudioDataUrl(dataUrl);
        this.storyAudioStatusEl.textContent = `"${key}" kaydi caliniyor.`;
    }
    deleteCurrentStoryRecording() {
        this.refreshCustomAudioMap();
        const key = this.currentSentenceKey();
        if (!key) {
            this.storyAudioStatusEl.textContent = 'Silmek icin once cumle sec.';
            return;
        }
        if (!this.customAudioMap[key]) {
            this.storyAudioStatusEl.textContent = `"${key}" icin kayit yok.`;
            return;
        }
        delete this.customAudioMap[key];
        saveCustomAudioMap(this.customAudioMap);
        this.storyAudioStatusEl.textContent = `"${key}" kaydi silindi.`;
        this.syncStoryAudioPanel();
        this.syncRootState();
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
    currentStory() {
        const stories = this.currentStories();
        return stories[this.storyIndex] ?? null;
    }
    currentStories() {
        return this.getStoriesForPack(this.pack);
    }
    getStoriesForPack(pack) {
        const stories = STORIES_BY_LEVEL_AND_PACK[this.level][pack];
        if (this.level !== 'easy' || this.customEasySentences.length === 0) {
            return stories;
        }
        const customStory = {
            id: CUSTOM_EASY_STORY_ID,
            title: 'Özel Cümleler',
            emoji: '✍️',
            sentences: [...this.customEasySentences]
        };
        return [...stories, customStory];
    }
    findStoryIndexById(storyId) {
        return this.currentStories().findIndex((story) => story.id === storyId);
    }
    normalizeLevel(value) {
        if (value === 'standard') {
            return value;
        }
        return 'easy';
    }
    normalizePack(value) {
        if (value === 'animals' || value === 'daily') {
            return value;
        }
        return 'core';
    }
    normalizeSentence(value) {
        return value.trim().replace(/\s+/g, ' ');
    }
    isTwoWordSentence(sentence) {
        return sentence.split(' ').length === 2;
    }
    loadCustomEasySentences() {
        const raw = localStorage.getItem(EASY_SENTENCE_STORAGE_KEY);
        if (!raw) {
            this.customEasySentences = [];
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                this.customEasySentences = [];
                return;
            }
            this.customEasySentences = parsed
                .filter((item) => typeof item === 'string')
                .map((item) => this.normalizeSentence(item))
                .filter((item) => item.length > 0 && this.isTwoWordSentence(item));
        }
        catch {
            this.customEasySentences = [];
        }
    }
    saveCustomEasySentences() {
        localStorage.setItem(EASY_SENTENCE_STORAGE_KEY, JSON.stringify(this.customEasySentences));
    }
    collectUniquePackSentences(pack) {
        const seen = new Set();
        const values = [];
        for (const story of this.getStoriesForPack(pack)) {
            for (const sentence of story.sentences) {
                const normalizedSentence = normalizeSpeechKey(sentence);
                if (!normalizedSentence || seen.has(normalizedSentence)) {
                    continue;
                }
                seen.add(normalizedSentence);
                values.push(this.normalizeSentence(sentence));
            }
        }
        return values;
    }
    buildPackProgressSnapshot(pack) {
        const sentences = this.collectUniquePackSentences(pack);
        if (sentences.length === 0) {
            return {
                pack,
                totalSentences: 0,
                recordedSentences: 0,
                listenedSentences: 0,
                totalListens: 0,
                topSentence: '',
                topSentenceCount: 0,
                weeklyCurrent: 0,
                weeklyChange: 0
            };
        }
        const recordedSentences = sentences.filter((sentence) => {
            const sentenceKey = normalizeSpeechKey(sentence);
            return Boolean(sentenceKey && this.customAudioMap[sentenceKey]);
        }).length;
        const packProgress = getPackSentenceProgress(pack, sentences);
        const weeklyMomentum = getPackWeeklyMomentum(pack);
        return {
            pack,
            totalSentences: sentences.length,
            recordedSentences,
            listenedSentences: packProgress.listenedSentenceCount,
            totalListens: packProgress.totalListens,
            topSentence: packProgress.topSentence,
            topSentenceCount: packProgress.topSentenceCount,
            weeklyCurrent: weeklyMomentum.currentWeekListens,
            weeklyChange: weeklyMomentum.change
        };
    }
    renderPackProgressPanel(snapshot) {
        this.storyPackProgressSummaryEl.textContent =
            `Paket dinleme: ${snapshot.totalListens} | Kayıt kapsama: ${snapshot.recordedSentences}/${snapshot.totalSentences} | Haftalık artış: ${this.formatSignedNumber(snapshot.weeklyChange)}`;
        const topSentenceValue = snapshot.topSentenceCount > 0
            ? `${this.escapeHtml(snapshot.topSentence)} (${snapshot.topSentenceCount})`
            : 'Henüz yok';
        this.storyPackProgressListEl.innerHTML = `
      <div class="story-pack-progress-row">
        <span class="story-pack-progress-name">En cok dinlenen cumle</span>
        <span class="story-pack-progress-value">${topSentenceValue}</span>
      </div>
      <div class="story-pack-progress-row">
        <span class="story-pack-progress-name">Dinlenen cumle sayisi</span>
        <span class="story-pack-progress-value">${snapshot.listenedSentences}/${snapshot.totalSentences}</span>
      </div>
      <div class="story-pack-progress-row">
        <span class="story-pack-progress-name">Bu hafta dinleme</span>
        <span class="story-pack-progress-value">${snapshot.weeklyCurrent}</span>
      </div>
    `;
    }
    renderPackComparisonPanel(rows) {
        if (rows.length === 0) {
            this.storyPackCompareSummaryEl.textContent = 'Henüz paket verisi yok.';
            this.storyPackCompareListEl.innerHTML = '';
            return null;
        }
        const rankedRows = [...rows].sort((left, right) => {
            if (right.totalListens !== left.totalListens) {
                return right.totalListens - left.totalListens;
            }
            return right.weeklyChange - left.weeklyChange;
        });
        const leader = rankedRows[0];
        const leaderLabel = this.getPackLabel(leader.pack);
        if (leader.totalListens > 0 || leader.weeklyChange !== 0) {
            this.storyPackCompareSummaryEl.textContent = `Lider paket: ${leaderLabel} (${leader.totalListens} dinleme)`;
        }
        else {
            this.storyPackCompareSummaryEl.textContent = 'Henüz dinleme verisi yok.';
        }
        this.storyPackCompareListEl.innerHTML = rows
            .map((row) => {
            const topSentenceLabel = row.topSentenceCount > 0 ? `${this.escapeHtml(row.topSentence)} (${row.topSentenceCount})` : 'Henüz yok';
            const weeklyLabel = this.formatSignedNumber(row.weeklyChange);
            return `
          <div class="story-pack-compare-row">
            <div class="story-pack-compare-head">
              <span class="story-pack-compare-name">${this.getPackLabel(row.pack)}</span>
              <span class="story-pack-compare-value">Toplam: ${row.totalListens}</span>
            </div>
            <span class="story-pack-compare-value">Haftalık: ${weeklyLabel} | Bu hafta: ${row.weeklyCurrent}</span>
            <span class="story-pack-compare-value">Kayıt: ${row.recordedSentences}/${row.totalSentences}</span>
            <span class="story-pack-compare-value">Top cümle: ${topSentenceLabel}</span>
          </div>
        `;
        })
            .join('');
        return leader;
    }
    syncRootState() {
        this.refreshCustomAudioMap();
        const story = this.currentStory();
        const currentSentenceKey = this.currentSentenceKey();
        const packProgress = this.buildPackProgressSnapshot(this.pack);
        const comparisonRows = STORY_PACK_OPTIONS.map((option) => this.buildPackProgressSnapshot(option.id));
        const leader = this.renderPackComparisonPanel(comparisonRows);
        this.renderPackProgressPanel(packProgress);
        this.rootEl.setAttribute('data-story-level', this.level);
        this.rootEl.setAttribute('data-story-pack', this.pack);
        this.rootEl.setAttribute('data-story-count', String(this.currentStories().length));
        this.rootEl.setAttribute('data-active-story-id', story?.id ?? '');
        this.rootEl.setAttribute('data-sentence-index', String(this.sentenceIndex));
        this.rootEl.setAttribute('data-last-spoken-sentence', this.lastSpokenSentence);
        this.rootEl.setAttribute('data-custom-easy-sentence-count', String(this.customEasySentences.length));
        this.rootEl.setAttribute('data-story-audio-record-count', String(Object.keys(this.customAudioMap).length));
        this.rootEl.setAttribute('data-pack-recording-coverage', `${packProgress.recordedSentences}/${packProgress.totalSentences}`);
        this.rootEl.setAttribute('data-pack-total-listens', String(packProgress.totalListens));
        this.rootEl.setAttribute('data-pack-top-sentence', packProgress.topSentence);
        this.rootEl.setAttribute('data-pack-top-sentence-count', String(packProgress.topSentenceCount));
        this.rootEl.setAttribute('data-pack-listened-sentence-count', String(packProgress.listenedSentences));
        this.rootEl.setAttribute('data-pack-total-sentence-count', String(packProgress.totalSentences));
        this.rootEl.setAttribute('data-pack-weekly-current', String(packProgress.weeklyCurrent));
        this.rootEl.setAttribute('data-pack-weekly-change', String(packProgress.weeklyChange));
        this.rootEl.setAttribute('data-pack-compare-leader', leader?.pack ?? '');
        this.rootEl.setAttribute('data-pack-compare-leader-total', String(leader?.totalListens ?? 0));
        this.rootEl.setAttribute('data-current-story-audio', String(Boolean(currentSentenceKey && this.customAudioMap[currentSentenceKey])));
    }
    getPackLabel(pack) {
        return STORY_PACK_OPTIONS.find((option) => option.id === pack)?.label ?? pack;
    }
    formatSignedNumber(value) {
        if (value > 0) {
            return `+${value}`;
        }
        return String(value);
    }
    escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}
//# sourceMappingURL=index.js.map