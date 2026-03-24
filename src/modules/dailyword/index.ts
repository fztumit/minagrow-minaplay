import { getWordProfile } from '../data/wordProfiles.js';
import type { VocabularyItem, VocabularyWord } from '../data/vocabulary.js';
import {
  loadCustomAudioMap,
  normalizeSpeechKey,
  saveCustomAudioMap,
  type CustomAudioMap
} from '../speech/customAudio.js';

export class DailyWordModule {
  private readonly rootEl: HTMLElement;
  private readonly outputEl: HTMLElement;
  private readonly recordStartBtn: HTMLButtonElement;
  private readonly recordStopBtn: HTMLButtonElement;
  private readonly playBtn: HTMLButtonElement;
  private readonly deleteBtn: HTMLButtonElement;
  private readonly statusEl: HTMLElement;
  private readonly vocabulary: VocabularyItem[];
  private selectedWordId: VocabularyWord | null = null;
  private customAudioMap: CustomAudioMap = {};
  private mediaRecorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private recordingStream: MediaStream | null = null;

  constructor(rootEl: HTMLElement, outputEl: HTMLElement, vocabulary: VocabularyItem[]) {
    const recordStartBtn = rootEl.querySelector<HTMLButtonElement>('#daily-word-record-start');
    const recordStopBtn = rootEl.querySelector<HTMLButtonElement>('#daily-word-record-stop');
    const playBtn = rootEl.querySelector<HTMLButtonElement>('#daily-word-play');
    const deleteBtn = rootEl.querySelector<HTMLButtonElement>('#daily-word-delete');
    const statusEl = rootEl.querySelector<HTMLElement>('#daily-word-record-status');

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

  init(): void {
    this.selectedWordId = this.pickWordOfDay();
    this.renderSelectedWord();
    this.bindEvents();
    this.syncRecordingState();
    this.syncRecorderSupportState();

    window.addEventListener('word-profiles-updated', () => {
      this.renderSelectedWord();
      this.syncRecordingState();
    });
  }

  private pickWordOfDay(): VocabularyWord {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayIndex = Math.floor(dayStart / 86_400_000);
    const vocabIndex = Math.abs(dayIndex) % this.vocabulary.length;

    return this.vocabulary[vocabIndex].word;
  }

  private renderSelectedWord(): void {
    const selectedWord = this.getSelectedWordLabel();
    this.outputEl.textContent = selectedWord.toLocaleUpperCase('tr-TR');
  }

  private getSelectedWordLabel(): string {
    if (!this.selectedWordId) {
      return '';
    }

    return getWordProfile(this.selectedWordId, this.vocabulary).label;
  }

  private bindEvents(): void {
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

  private syncRecorderSupportState(): void {
    const supported =
      typeof window.MediaRecorder !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    if (supported) {
      return;
    }

    this.recordStartBtn.disabled = true;
    this.recordStopBtn.disabled = true;
    this.statusEl.textContent = 'Bu tarayicida gunun kelimesi icin kayit desteklenmiyor.';
  }

  private getWordAudioKey(): string {
    return normalizeSpeechKey(this.getSelectedWordLabel());
  }

  private syncRecordingState(): void {
    this.customAudioMap = loadCustomAudioMap();
    const key = this.getWordAudioKey();
    const hasRecording = Boolean(key && this.customAudioMap[key]);

    this.playBtn.disabled = !hasRecording;
    this.deleteBtn.disabled = !hasRecording;
    const selectedWord = this.getSelectedWordLabel();
    this.rootEl.setAttribute('data-daily-word', selectedWord);
    this.rootEl.setAttribute('data-daily-word-has-audio', String(hasRecording));

    if (hasRecording) {
      this.statusEl.textContent = `"${selectedWord}" icin ebeveyn kaydi hazir.`;
    }
  }

  private async startRecording(): Promise<void> {
    const key = this.getWordAudioKey();
    if (!key) {
      return;
    }

    if (
      typeof window.MediaRecorder === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
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
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
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
      this.statusEl.textContent = `"${this.getSelectedWordLabel()}" icin kayit aliniyor...`;
    } catch {
      this.cleanupRecordingResources();
      this.statusEl.textContent = 'Mikrofon acilamadi. Tarayici izinlerini kontrol et.';
    }
  }

  private stopRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      this.statusEl.textContent = 'Kayit aktif degil.';
      return;
    }

    this.mediaRecorder.stop();
    this.recordStopBtn.disabled = true;
    this.statusEl.textContent = 'Kayit isleniyor...';
  }

  private async finalizeRecording(key: string): Promise<void> {
    try {
      const blob = new Blob(this.recordingChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
      if (blob.size === 0) {
        this.statusEl.textContent = 'Bos kayit alindi, tekrar dene.';
        return;
      }

      const dataUrl = await this.blobToDataUrl(blob);
      this.customAudioMap[key] = dataUrl;
      saveCustomAudioMap(this.customAudioMap);
      this.statusEl.textContent = `"${this.getSelectedWordLabel()}" kaydedildi.`;
      this.syncRecordingState();
    } finally {
      this.cleanupRecordingResources();
      this.recordStartBtn.disabled = false;
      this.recordStopBtn.disabled = true;
    }
  }

  private playRecording(): void {
    this.syncRecordingState();
    const key = this.getWordAudioKey();
    const dataUrl = key ? this.customAudioMap[key] : null;
    if (!dataUrl) {
      this.statusEl.textContent = `"${this.getSelectedWordLabel()}" icin kayit yok.`;
      return;
    }

    const audio = new Audio(dataUrl);
    audio.play().catch(() => {
      this.statusEl.textContent = 'Kayit calinamadi.';
    });
    this.statusEl.textContent = `"${this.getSelectedWordLabel()}" kaydi caliniyor.`;
  }

  private deleteRecording(): void {
    this.syncRecordingState();
    const key = this.getWordAudioKey();
    if (!key || !this.customAudioMap[key]) {
      this.statusEl.textContent = `"${this.getSelectedWordLabel()}" icin kayit yok.`;
      return;
    }

    delete this.customAudioMap[key];
    saveCustomAudioMap(this.customAudioMap);
    this.statusEl.textContent = `"${this.getSelectedWordLabel()}" kaydi silindi.`;
    this.syncRecordingState();
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
}
