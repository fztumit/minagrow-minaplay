import { normalizeSpeechKey } from '../speech/customAudio.js';
const DAILY_ACTIVITY_STORAGE_KEY = 'konusu_yorum_daily_activity_v1';
function createState(dateKey) {
    return {
        dateKey,
        words: [],
        stories: [],
        interactions: 0
    };
}
export class DailyActivityModule {
    rootEl;
    summaryEl;
    wordsTaskEl;
    storyTaskEl;
    interactionTaskEl;
    dateEl;
    state;
    constructor(rootEl) {
        const summaryEl = rootEl.querySelector('#daily-activity-summary');
        const wordsTaskEl = rootEl.querySelector('#daily-task-words');
        const storyTaskEl = rootEl.querySelector('#daily-task-story');
        const interactionTaskEl = rootEl.querySelector('#daily-task-interaction');
        const dateEl = rootEl.querySelector('#daily-activity-date');
        if (!summaryEl || !wordsTaskEl || !storyTaskEl || !interactionTaskEl || !dateEl) {
            throw new Error('Daily activity module requires card outputs.');
        }
        this.rootEl = rootEl;
        this.summaryEl = summaryEl;
        this.wordsTaskEl = wordsTaskEl;
        this.storyTaskEl = storyTaskEl;
        this.interactionTaskEl = interactionTaskEl;
        this.dateEl = dateEl;
        this.state = createState(this.getTodayKey());
    }
    init() {
        this.state = this.loadState();
        this.ensureCurrentDate();
        this.render();
    }
    trackWord(word) {
        this.ensureCurrentDate();
        const key = normalizeSpeechKey(word);
        if (!key) {
            return;
        }
        if (!this.state.words.includes(key)) {
            this.state.words.push(key);
            this.saveState();
            this.render();
        }
    }
    trackStory(sentence) {
        this.ensureCurrentDate();
        const key = normalizeSpeechKey(sentence);
        if (!key) {
            return;
        }
        if (!this.state.stories.includes(key)) {
            this.state.stories.push(key);
            this.saveState();
            this.render();
        }
    }
    trackInteraction() {
        this.ensureCurrentDate();
        this.state.interactions += 1;
        this.saveState();
        this.render();
    }
    render() {
        const wordsDone = Math.min(3, this.state.words.length);
        const storiesDone = Math.min(1, this.state.stories.length);
        const interactionsDone = Math.min(1, this.state.interactions);
        const completedCount = [wordsDone >= 3, storiesDone >= 1, interactionsDone >= 1].filter(Boolean).length;
        this.summaryEl.textContent = `${completedCount}/3 tamamlandı`;
        this.wordsTaskEl.textContent = `${wordsDone >= 3 ? '✅' : '⬜'} 3 kelime: ${wordsDone}/3`;
        this.storyTaskEl.textContent = `${storiesDone >= 1 ? '✅' : '⬜'} 1 hikaye: ${storiesDone}/1`;
        this.interactionTaskEl.textContent = `${interactionsDone >= 1 ? '✅' : '⬜'} 1 etkileşim: ${interactionsDone}/1`;
        this.dateEl.textContent = `Bugün: ${this.state.dateKey}`;
        this.rootEl.setAttribute('data-daily-task-date', this.state.dateKey);
        this.rootEl.setAttribute('data-daily-task-words', String(wordsDone));
        this.rootEl.setAttribute('data-daily-task-story', String(storiesDone));
        this.rootEl.setAttribute('data-daily-task-interaction', String(interactionsDone));
        this.rootEl.setAttribute('data-daily-task-completed-count', String(completedCount));
    }
    ensureCurrentDate() {
        const todayKey = this.getTodayKey();
        if (this.state.dateKey === todayKey) {
            return;
        }
        this.state = createState(todayKey);
        this.saveState();
    }
    loadState() {
        const todayKey = this.getTodayKey();
        const raw = localStorage.getItem(DAILY_ACTIVITY_STORAGE_KEY);
        if (!raw) {
            return createState(todayKey);
        }
        try {
            const parsed = JSON.parse(raw);
            const dateKey = typeof parsed.dateKey === 'string' ? parsed.dateKey : todayKey;
            const words = this.normalizeStringArray(parsed.words);
            const stories = this.normalizeStringArray(parsed.stories);
            const interactions = Number.isFinite(parsed.interactions)
                ? Math.max(0, Math.floor(Number(parsed.interactions)))
                : 0;
            return {
                dateKey,
                words,
                stories,
                interactions
            };
        }
        catch {
            return createState(todayKey);
        }
    }
    saveState() {
        localStorage.setItem(DAILY_ACTIVITY_STORAGE_KEY, JSON.stringify(this.state));
    }
    getTodayKey() {
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    normalizeStringArray(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        const seen = new Set();
        const values = [];
        for (const item of value) {
            if (typeof item !== 'string') {
                continue;
            }
            const normalized = normalizeSpeechKey(item);
            if (!normalized || seen.has(normalized)) {
                continue;
            }
            seen.add(normalized);
            values.push(normalized);
        }
        return values;
    }
}
//# sourceMappingURL=index.js.map