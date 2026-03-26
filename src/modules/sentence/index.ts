import { getWordProfile } from '../data/wordProfiles.js';
import { VOCABULARY, type VocabularyWord } from '../data/vocabulary.js';
import { MascotGuide } from '../mascot/index.js';
import { getCustomAudioData } from '../speech/customAudio.js';

type SentenceActorId = 'anka' | 'baba';
type SentenceObjectId = 'su' | 'top' | 'elma' | 'araba';

type SentenceActor = {
  id: SentenceActorId;
  label: string;
  imageSrc: string;
  accentClass: string;
};

type SentenceObject = {
  id: SentenceObjectId;
  wordId: VocabularyWord;
  accentClass: string;
};

const SENTENCE_ACTORS: SentenceActor[] = [
  {
    id: 'anka',
    label: 'Anka',
    imageSrc: '/assets/phoenix-ui.svg',
    accentClass: 'is-sunrise'
  },
  {
    id: 'baba',
    label: 'Baba',
    imageSrc: '/assets/object-father.svg',
    accentClass: 'is-peach'
  }
];

const SENTENCE_OBJECTS: SentenceObject[] = [
  { id: 'su', wordId: 'su', accentClass: 'is-aqua' },
  { id: 'top', wordId: 'top', accentClass: 'is-gold' },
  { id: 'elma', wordId: 'elma', accentClass: 'is-apple' },
  { id: 'araba', wordId: 'araba', accentClass: 'is-coral' }
];

const SENTENCE_MAP: Record<SentenceActorId, Record<SentenceObjectId, string>> = {
  anka: {
    su: 'Anka su içti.',
    top: 'Anka top buldu.',
    elma: 'Anka elma getirdi.',
    araba: 'Anka arabaya baktı.'
  },
  baba: {
    su: 'Baba su içti.',
    top: 'Baba top attı.',
    elma: 'Baba elma yedi.',
    araba: 'Baba arabayı sürdü.'
  }
};

export class SentenceBuilderModule {
  private readonly rootEl: HTMLElement;
  private readonly actorListEl: HTMLElement;
  private readonly objectListEl: HTMLElement;
  private readonly previewTextEl: HTMLElement;
  private readonly previewActorEl: HTMLElement;
  private readonly previewObjectEl: HTMLElement;
  private readonly statusEl: HTMLElement;
  private readonly mascot: MascotGuide;

  private selectedActor: SentenceActorId | null = null;
  private selectedObject: SentenceObjectId | null = null;
  private activeAudioEl: HTMLAudioElement | null = null;
  private playbackTimeoutId: number | null = null;

  constructor(rootEl: HTMLElement, mascot: MascotGuide) {
    const actorListEl = rootEl.querySelector<HTMLElement>('#sentence-actor-list');
    const objectListEl = rootEl.querySelector<HTMLElement>('#sentence-object-list');
    const previewTextEl = rootEl.querySelector<HTMLElement>('#sentence-preview-text');
    const previewActorEl = rootEl.querySelector<HTMLElement>('#sentence-preview-actor');
    const previewObjectEl = rootEl.querySelector<HTMLElement>('#sentence-preview-object');
    const statusEl = rootEl.querySelector<HTMLElement>('#sentence-status');

    if (!actorListEl || !objectListEl || !previewTextEl || !previewActorEl || !previewObjectEl || !statusEl) {
      throw new Error('Sentence builder module requires actor list, object list, preview, and status elements.');
    }

    this.rootEl = rootEl;
    this.actorListEl = actorListEl;
    this.objectListEl = objectListEl;
    this.previewTextEl = previewTextEl;
    this.previewActorEl = previewActorEl;
    this.previewObjectEl = previewObjectEl;
    this.statusEl = statusEl;
    this.mascot = mascot;
  }

  init(): void {
    this.renderActors();
    this.renderObjects();
    this.bindEvents();
    this.syncSelectionUi();

    window.addEventListener('word-profiles-updated', () => {
      this.renderActors();
      this.renderObjects();
      this.syncSelectionUi();
    });
  }

  private bindEvents(): void {
    this.actorListEl.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.sentence-choice-btn[data-actor-id]');
      if (!button) {
        return;
      }

      const actorId = button.dataset.actorId as SentenceActorId | undefined;
      if (!actorId) {
        return;
      }

      this.selectedActor = actorId;
      this.syncSelectionUi();
      this.handleSentenceReady();
    });

    this.objectListEl.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.sentence-choice-btn[data-object-id]');
      if (!button) {
        return;
      }

      const objectId = button.dataset.objectId as SentenceObjectId | undefined;
      if (!objectId) {
        return;
      }

      this.selectedObject = objectId;
      this.syncSelectionUi();
      this.handleSentenceReady();
    });

    this.rootEl.addEventListener('sentence-pause', () => {
      this.pause();
    });
  }

  private renderActors(): void {
    this.actorListEl.innerHTML = SENTENCE_ACTORS.map((actor) => {
      const profileImage = actor.id === 'baba' ? getWordProfile('baba', VOCABULARY).imageSrc : actor.imageSrc;
      return `
        <button
          type="button"
          class="sentence-choice-btn sentence-choice-actor ${actor.accentClass}"
          data-actor-id="${actor.id}"
          aria-label="${this.escapeHtml(actor.label)}"
        >
          <span class="sentence-choice-figure" aria-hidden="true">
            <img src="${this.escapeHtml(profileImage)}" alt="" />
          </span>
          <span class="sentence-choice-label">${this.escapeHtml(actor.label)}</span>
        </button>
      `;
    }).join('');
  }

  private renderObjects(): void {
    this.objectListEl.innerHTML = SENTENCE_OBJECTS.map((entry) => {
      const profile = getWordProfile(entry.wordId, VOCABULARY);
      return `
        <button
          type="button"
          class="sentence-choice-btn sentence-choice-object ${entry.accentClass}"
          data-object-id="${entry.id}"
          aria-label="${this.escapeHtml(profile.label)}"
        >
          <span class="sentence-choice-figure" aria-hidden="true">
            <img src="${this.escapeHtml(profile.imageSrc)}" alt="" />
          </span>
          <span class="sentence-choice-label">${this.escapeHtml(profile.label)}</span>
        </button>
      `;
    }).join('');
  }

  private syncSelectionUi(): void {
    const currentSentence = this.currentSentence();
    const hasAudio = currentSentence ? Boolean(getCustomAudioData(currentSentence)) : false;

    this.rootEl.setAttribute('data-selected-actor', this.selectedActor ?? '');
    this.rootEl.setAttribute('data-selected-object', this.selectedObject ?? '');
    this.rootEl.setAttribute('data-current-sentence', currentSentence ?? '');
    this.rootEl.setAttribute('data-current-sentence-has-audio', String(hasAudio));
    this.rootEl.setAttribute('data-playing', 'false');

    this.actorListEl.querySelectorAll<HTMLButtonElement>('.sentence-choice-btn[data-actor-id]').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.actorId === this.selectedActor);
    });

    this.objectListEl.querySelectorAll<HTMLButtonElement>('.sentence-choice-btn[data-object-id]').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.objectId === this.selectedObject);
    });

    this.previewActorEl.innerHTML = this.selectedActor ? this.renderActorPreview(this.selectedActor) : '<span class="sentence-preview-plus">?</span>';
    this.previewObjectEl.innerHTML = this.selectedObject ? this.renderObjectPreview(this.selectedObject) : '<span class="sentence-preview-plus">?</span>';
    this.previewTextEl.textContent = currentSentence ?? 'İki resmi seç.';
    this.statusEl.textContent = currentSentence ?? 'Cümle için iki resim seç.';
  }

  private renderActorPreview(actorId: SentenceActorId): string {
    const actor = SENTENCE_ACTORS.find((entry) => entry.id === actorId);
    if (!actor) {
      return '<span class="sentence-preview-plus">?</span>';
    }

    const imageSrc = actor.id === 'baba' ? getWordProfile('baba', VOCABULARY).imageSrc : actor.imageSrc;
    return `<img src="${this.escapeHtml(imageSrc)}" alt="" />`;
  }

  private renderObjectPreview(objectId: SentenceObjectId): string {
    const item = SENTENCE_OBJECTS.find((entry) => entry.id === objectId);
    if (!item) {
      return '<span class="sentence-preview-plus">?</span>';
    }

    const profile = getWordProfile(item.wordId, VOCABULARY);
    return `<img src="${this.escapeHtml(profile.imageSrc)}" alt="" />`;
  }

  private handleSentenceReady(): void {
    const sentence = this.currentSentence();
    if (!sentence) {
      return;
    }

    void this.playSentence(sentence);
  }

  private currentSentence(): string | null {
    if (!this.selectedActor || !this.selectedObject) {
      return null;
    }

    return SENTENCE_MAP[this.selectedActor][this.selectedObject];
  }

  private async playSentence(sentence: string): Promise<void> {
    this.pause();
    const customAudio = getCustomAudioData(sentence);
    const runtime = window as Window & { __sentenceLog?: string[] };
    runtime.__sentenceLog = runtime.__sentenceLog ?? [];
    runtime.__sentenceLog.push(sentence);

    this.rootEl.setAttribute('data-current-sentence', sentence);
    this.rootEl.setAttribute('data-current-sentence-has-audio', String(Boolean(customAudio)));
    this.rootEl.setAttribute('data-last-played-sentence', sentence);
    this.rootEl.setAttribute('data-playing', 'true');
    this.statusEl.textContent = sentence;
    this.previewTextEl.textContent = sentence;
    this.mascot.setMessage('Cümle kuralım.');

    if (customAudio) {
      try {
        const audio = new Audio(customAudio);
        this.activeAudioEl = audio;
        await audio.play();
      } catch {
        this.speakSentence(sentence);
      }
    } else {
      this.speakSentence(sentence);
    }

    this.rootEl.dispatchEvent(
      new CustomEvent('sentence-activity', {
        bubbles: true,
        detail: {
          sentence,
          actor: this.selectedActor,
          object: this.selectedObject
        }
      })
    );

    this.playbackTimeoutId = window.setTimeout(() => {
      this.rootEl.setAttribute('data-playing', 'false');
    }, 1200);
  }

  pause(): void {
    if (this.activeAudioEl) {
      this.activeAudioEl.pause();
      this.activeAudioEl.currentTime = 0;
      this.activeAudioEl = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.playbackTimeoutId !== null) {
      window.clearTimeout(this.playbackTimeoutId);
      this.playbackTimeoutId = null;
    }

    this.rootEl.setAttribute('data-playing', 'false');
  }

  private speakSentence(sentence: string): void {
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'tr-TR';
      utterance.rate = 0.84;
      utterance.pitch = 1.02;
      utterance.volume = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Optional guidance voice.
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
