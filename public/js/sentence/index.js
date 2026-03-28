import { getWordProfile } from '../data/wordProfiles.js';
import { VOCABULARY } from '../data/vocabulary.js';
import { getCustomAudioData } from '../speech/customAudio.js';
const SENTENCE_ACTORS = [
    {
        id: 'anka',
        label: 'Pofi',
        imageSrc: '/assets/pofi-ui.svg',
        accentClass: 'is-sunrise'
    },
    {
        id: 'baba',
        label: 'Baba',
        imageSrc: '/assets/object-father.svg',
        accentClass: 'is-peach'
    }
];
const SENTENCE_OBJECTS = [
    { id: 'su', wordId: 'su', accentClass: 'is-aqua' },
    { id: 'top', wordId: 'top', accentClass: 'is-gold' },
    { id: 'elma', wordId: 'elma', accentClass: 'is-apple' },
    { id: 'araba', wordId: 'araba', accentClass: 'is-coral' }
];
const SENTENCE_MAP = {
    anka: {
        su: 'Pofi su içti.',
        top: 'Pofi top buldu.',
        elma: 'Pofi elma getirdi.',
        araba: 'Pofi arabaya baktı.'
    },
    baba: {
        su: 'Baba su içti.',
        top: 'Baba top attı.',
        elma: 'Baba elma yedi.',
        araba: 'Baba arabayı sürdü.'
    }
};
export class SentenceBuilderModule {
    rootEl;
    actorListEl;
    objectListEl;
    previewTextEl;
    previewActorEl;
    previewObjectEl;
    statusEl;
    mascot;
    selectedActor = null;
    selectedObject = null;
    activeAudioEl = null;
    playbackTimeoutId = null;
    constructor(rootEl, mascot) {
        const actorListEl = rootEl.querySelector('#sentence-actor-list');
        const objectListEl = rootEl.querySelector('#sentence-object-list');
        const previewTextEl = rootEl.querySelector('#sentence-preview-text');
        const previewActorEl = rootEl.querySelector('#sentence-preview-actor');
        const previewObjectEl = rootEl.querySelector('#sentence-preview-object');
        const statusEl = rootEl.querySelector('#sentence-status');
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
    init() {
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
    bindEvents() {
        this.actorListEl.addEventListener('click', (event) => {
            const button = event.target.closest('.sentence-choice-btn[data-actor-id]');
            if (!button) {
                return;
            }
            const actorId = button.dataset.actorId;
            if (!actorId) {
                return;
            }
            this.selectedActor = actorId;
            this.syncSelectionUi();
            this.handleSentenceReady();
        });
        this.objectListEl.addEventListener('click', (event) => {
            const button = event.target.closest('.sentence-choice-btn[data-object-id]');
            if (!button) {
                return;
            }
            const objectId = button.dataset.objectId;
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
    renderActors() {
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
    renderObjects() {
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
    syncSelectionUi() {
        const currentSentence = this.currentSentence();
        const hasAudio = currentSentence ? Boolean(getCustomAudioData(currentSentence)) : false;
        this.rootEl.setAttribute('data-selected-actor', this.selectedActor ?? '');
        this.rootEl.setAttribute('data-selected-object', this.selectedObject ?? '');
        this.rootEl.setAttribute('data-current-sentence', currentSentence ?? '');
        this.rootEl.setAttribute('data-current-sentence-has-audio', String(hasAudio));
        this.rootEl.setAttribute('data-playing', 'false');
        this.actorListEl.querySelectorAll('.sentence-choice-btn[data-actor-id]').forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.actorId === this.selectedActor);
        });
        this.objectListEl.querySelectorAll('.sentence-choice-btn[data-object-id]').forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.objectId === this.selectedObject);
        });
        this.previewActorEl.innerHTML = this.selectedActor ? this.renderActorPreview(this.selectedActor) : '<span class="sentence-preview-plus">?</span>';
        this.previewObjectEl.innerHTML = this.selectedObject ? this.renderObjectPreview(this.selectedObject) : '<span class="sentence-preview-plus">?</span>';
        this.previewTextEl.textContent = currentSentence ?? 'İki resmi seç.';
        this.statusEl.textContent = currentSentence ?? 'Cümle için iki resim seç.';
    }
    renderActorPreview(actorId) {
        const actor = SENTENCE_ACTORS.find((entry) => entry.id === actorId);
        if (!actor) {
            return '<span class="sentence-preview-plus">?</span>';
        }
        const imageSrc = actor.id === 'baba' ? getWordProfile('baba', VOCABULARY).imageSrc : actor.imageSrc;
        return `<img src="${this.escapeHtml(imageSrc)}" alt="" />`;
    }
    renderObjectPreview(objectId) {
        const item = SENTENCE_OBJECTS.find((entry) => entry.id === objectId);
        if (!item) {
            return '<span class="sentence-preview-plus">?</span>';
        }
        const profile = getWordProfile(item.wordId, VOCABULARY);
        return `<img src="${this.escapeHtml(profile.imageSrc)}" alt="" />`;
    }
    handleSentenceReady() {
        const sentence = this.currentSentence();
        if (!sentence) {
            return;
        }
        void this.playSentence(sentence);
    }
    currentSentence() {
        if (!this.selectedActor || !this.selectedObject) {
            return null;
        }
        return SENTENCE_MAP[this.selectedActor][this.selectedObject];
    }
    async playSentence(sentence) {
        this.pause();
        const customAudio = getCustomAudioData(sentence);
        const runtime = window;
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
            }
            catch {
                this.speakSentence(sentence);
            }
        }
        else {
            this.speakSentence(sentence);
        }
        this.rootEl.dispatchEvent(new CustomEvent('sentence-activity', {
            bubbles: true,
            detail: {
                sentence,
                actor: this.selectedActor,
                object: this.selectedObject
            }
        }));
        this.playbackTimeoutId = window.setTimeout(() => {
            this.rootEl.setAttribute('data-playing', 'false');
        }, 1200);
    }
    pause() {
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
    speakSentence(sentence) {
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
        }
        catch {
            // Optional guidance voice.
        }
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
//# sourceMappingURL=index.js.map