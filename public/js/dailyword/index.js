import { loadCustomAudioMap, normalizeSpeechKey, saveCustomAudioMap } from '../speech/customAudio.js';
export class DailyWordModule {
    rootEl;
    outputEl;
    recordStartBtn;
    recordStopBtn;
    playBtn;
    deleteBtn;
    statusEl;
    vocabulary;
    selectedWord = '';
    customAudioMap = {};
    mediaRecorder = null;
    recordingChunks = [];
    recordingStream = null;
    constructor(rootEl, outputEl, vocabulary) {
        const recordStartBtn = rootEl.querySelector('#daily-word-record-start');
        const recordStopBtn = rootEl.querySelector('#daily-word-record-stop');
        const playBtn = rootEl.querySelector('#daily-word-play');
        const deleteBtn = rootEl.querySelector('#daily-word-delete');
        const statusEl = rootEl.querySelector('#daily-word-record-status');
        if (!recordStartBtn || !recordStopBtn || !playBtn || !deleteBtn || !statusEl) {
            throw new Error('Daily word module requires recording controls.');
        }
        this.rootEl = rootEl;
        this.outputEl = outputEl;
        this.recordStartBtn = recordStartBtn;
        this.recordStopBtn = recordStopBtn;
        this.playBtn = playBtn;
        this.deleteBtn = deleteBtn;
        this.statusEl = statusEl;
        this.vocabulary = vocabulary;
    }
    init() {
        this.selectedWord = this.pickWordOfDay();
        this.outputEl.textContent = this.selectedWord.toLocaleUpperCase('tr-TR');
        this.bindEvents();
        this.syncRecordingState();
        this.syncRecorderSupportState();
    }
    pickWordOfDay() {
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dayIndex = Math.floor(dayStart / 86_400_000);
        const vocabIndex = Math.abs(dayIndex) % this.vocabulary.length;
        return this.vocabulary[vocabIndex].label;
    }
    bindEvents() {
        this.recordStartBtn.addEventListener('click', () => {
            void this.startRecording();
        });
        this.recordStopBtn.addEventListener('click', () => {
            this.stopRecording();
        });
        this.playBtn.addEventListener('click', () => {
            this.playRecording();
        });
        this.deleteBtn.addEventListener('click', () => {
            this.deleteRecording();
        });
    }
    syncRecorderSupportState() {
        const supported = typeof window.MediaRecorder !== 'undefined' &&
            !!navigator.mediaDevices &&
            typeof navigator.mediaDevices.getUserMedia === 'function';
        if (supported) {
            return;
        }
        this.recordStartBtn.disabled = true;
        this.recordStopBtn.disabled = true;
        this.statusEl.textContent = 'Bu tarayicida gunun kelimesi icin kayit desteklenmiyor.';
    }
    getWordAudioKey() {
        return normalizeSpeechKey(this.selectedWord);
    }
    syncRecordingState() {
        this.customAudioMap = loadCustomAudioMap();
        const key = this.getWordAudioKey();
        const hasRecording = Boolean(key && this.customAudioMap[key]);
        this.playBtn.disabled = !hasRecording;
        this.deleteBtn.disabled = !hasRecording;
        this.rootEl.setAttribute('data-daily-word', this.selectedWord);
        this.rootEl.setAttribute('data-daily-word-has-audio', String(hasRecording));
        if (hasRecording) {
            this.statusEl.textContent = `"${this.selectedWord}" icin ebeveyn kaydi hazir.`;
        }
    }
    async startRecording() {
        const key = this.getWordAudioKey();
        if (!key) {
            return;
        }
        if (typeof window.MediaRecorder === 'undefined' ||
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== 'function') {
            this.statusEl.textContent = 'Bu tarayicida kayit desteklenmiyor.';
            return;
        }
        if (this.mediaRecorder?.state === 'recording') {
            this.statusEl.textContent = 'Kayit zaten devam ediyor.';
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
                void this.finalizeRecording(key);
            };
            this.mediaRecorder.start();
            this.recordStartBtn.disabled = true;
            this.recordStopBtn.disabled = false;
            this.statusEl.textContent = `"${this.selectedWord}" icin kayit aliniyor...`;
        }
        catch {
            this.cleanupRecordingResources();
            this.statusEl.textContent = 'Mikrofon acilamadi. Tarayici izinlerini kontrol et.';
        }
    }
    stopRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
            this.statusEl.textContent = 'Kayit aktif degil.';
            return;
        }
        this.mediaRecorder.stop();
        this.recordStopBtn.disabled = true;
        this.statusEl.textContent = 'Kayit isleniyor...';
    }
    async finalizeRecording(key) {
        try {
            const blob = new Blob(this.recordingChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
            if (blob.size === 0) {
                this.statusEl.textContent = 'Bos kayit alindi, tekrar dene.';
                return;
            }
            const dataUrl = await this.blobToDataUrl(blob);
            this.customAudioMap[key] = dataUrl;
            saveCustomAudioMap(this.customAudioMap);
            this.statusEl.textContent = `"${this.selectedWord}" kaydedildi.`;
            this.syncRecordingState();
        }
        finally {
            this.cleanupRecordingResources();
            this.recordStartBtn.disabled = false;
            this.recordStopBtn.disabled = true;
        }
    }
    playRecording() {
        this.syncRecordingState();
        const key = this.getWordAudioKey();
        const dataUrl = key ? this.customAudioMap[key] : null;
        if (!dataUrl) {
            this.statusEl.textContent = `"${this.selectedWord}" icin kayit yok.`;
            return;
        }
        const audio = new Audio(dataUrl);
        audio.play().catch(() => {
            this.statusEl.textContent = 'Kayit calinamadi.';
        });
        this.statusEl.textContent = `"${this.selectedWord}" kaydi caliniyor.`;
    }
    deleteRecording() {
        this.syncRecordingState();
        const key = this.getWordAudioKey();
        if (!key || !this.customAudioMap[key]) {
            this.statusEl.textContent = `"${this.selectedWord}" icin kayit yok.`;
            return;
        }
        delete this.customAudioMap[key];
        saveCustomAudioMap(this.customAudioMap);
        this.statusEl.textContent = `"${this.selectedWord}" kaydi silindi.`;
        this.syncRecordingState();
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
}
//# sourceMappingURL=index.js.map