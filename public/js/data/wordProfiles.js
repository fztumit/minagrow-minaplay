import { VOCABULARY } from './vocabulary.js';
const WORD_PROFILE_STORAGE_KEY = 'konusu_yorum_word_profiles_v1';
export function normalizeWordLabel(value) {
    return value.trim().replace(/\s+/g, ' ');
}
export function loadWordProfileOverrides() {
    const raw = localStorage.getItem(WORD_PROFILE_STORAGE_KEY);
    if (!raw) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }
        return Object.fromEntries(Object.entries(parsed)
            .filter((entry) => typeof entry[0] === 'string')
            .map(([wordId, value]) => {
            const label = typeof value?.label === 'string' ? normalizeWordLabel(value.label) : '';
            const imageDataUrl = typeof value?.imageDataUrl === 'string' ? value.imageDataUrl : '';
            return [
                wordId,
                {
                    ...(label ? { label } : {}),
                    ...(imageDataUrl.startsWith('data:image/') ? { imageDataUrl } : {})
                }
            ];
        })
            .filter((entry) => Object.keys(entry[1]).length > 0));
    }
    catch {
        return {};
    }
}
export function saveWordProfileOverrides(overrides) {
    const normalizedEntries = Object.entries(overrides)
        .filter((entry) => typeof entry[0] === 'string')
        .map(([wordId, value]) => {
        const label = typeof value.label === 'string' ? normalizeWordLabel(value.label) : '';
        const imageDataUrl = typeof value.imageDataUrl === 'string' ? value.imageDataUrl : '';
        return [
            wordId,
            {
                ...(label ? { label } : {}),
                ...(imageDataUrl.startsWith('data:image/') ? { imageDataUrl } : {})
            }
        ];
    })
        .filter((entry) => Object.keys(entry[1]).length > 0);
    localStorage.setItem(WORD_PROFILE_STORAGE_KEY, JSON.stringify(Object.fromEntries(normalizedEntries)));
}
export function getWordProfile(wordId, vocabulary = VOCABULARY) {
    const item = vocabulary.find((candidate) => candidate.word === wordId);
    if (!item) {
        throw new Error(`Unknown word profile: ${wordId}`);
    }
    const overrides = loadWordProfileOverrides();
    const override = overrides[wordId];
    const label = override?.label || item.label;
    const imageSrc = override?.imageDataUrl || item.asset || '';
    return {
        ...item,
        label,
        imageSrc,
        hasCustomImage: Boolean(override?.imageDataUrl)
    };
}
export function getAllWordProfiles(vocabulary = VOCABULARY) {
    return vocabulary.map((item) => getWordProfile(item.word, vocabulary));
}
export function updateWordLabel(wordId, label) {
    const normalizedLabel = normalizeWordLabel(label);
    const overrides = loadWordProfileOverrides();
    const current = overrides[wordId] ?? {};
    if (!normalizedLabel || normalizedLabel === getBaseWordItem(wordId).label) {
        delete current.label;
    }
    else {
        current.label = normalizedLabel;
    }
    if (Object.keys(current).length === 0) {
        delete overrides[wordId];
    }
    else {
        overrides[wordId] = current;
    }
    saveWordProfileOverrides(overrides);
}
export function updateWordImage(wordId, imageDataUrl) {
    const overrides = loadWordProfileOverrides();
    const current = overrides[wordId] ?? {};
    current.imageDataUrl = imageDataUrl;
    overrides[wordId] = current;
    saveWordProfileOverrides(overrides);
}
export function clearWordImage(wordId) {
    const overrides = loadWordProfileOverrides();
    const current = overrides[wordId];
    if (!current) {
        return;
    }
    delete current.imageDataUrl;
    if (Object.keys(current).length === 0) {
        delete overrides[wordId];
    }
    else {
        overrides[wordId] = current;
    }
    saveWordProfileOverrides(overrides);
}
function getBaseWordItem(wordId) {
    const item = VOCABULARY.find((candidate) => candidate.word === wordId);
    if (!item) {
        throw new Error(`Unknown base word item: ${wordId}`);
    }
    return item;
}
//# sourceMappingURL=wordProfiles.js.map