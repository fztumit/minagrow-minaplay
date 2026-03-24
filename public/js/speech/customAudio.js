const CUSTOM_AUDIO_STORAGE_KEY = 'konusu_yorum_custom_audio_v1';
export function normalizeSpeechKey(text) {
    return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}
export function loadCustomAudioMap() {
    const raw = localStorage.getItem(CUSTOM_AUDIO_STORAGE_KEY);
    if (!raw) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }
        const entries = Object.entries(parsed).filter((entry) => typeof entry[0] === 'string' && typeof entry[1] === 'string');
        return Object.fromEntries(entries);
    }
    catch {
        return {};
    }
}
export function saveCustomAudioMap(map) {
    localStorage.setItem(CUSTOM_AUDIO_STORAGE_KEY, JSON.stringify(map));
}
export function getCustomAudioData(text) {
    const key = normalizeSpeechKey(text);
    if (!key) {
        return null;
    }
    const map = loadCustomAudioMap();
    return map[key] ?? null;
}
export function listCustomAudioEntries(map) {
    return Object.entries(map)
        .filter((entry) => typeof entry[0] === 'string' && typeof entry[1] === 'string' && entry[0].length > 0)
        .map(([key, dataUrl]) => ({
        key,
        dataUrl,
        kind: key.includes(' ') ? 'sentence' : 'word'
    }))
        .sort((left, right) => left.key.localeCompare(right.key, 'tr-TR'));
}
export function buildCustomAudioBackup(map) {
    const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        recordings: map
    };
    return JSON.stringify(payload, null, 2);
}
export function parseCustomAudioBackup(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'recordings' in parsed) {
            const recordings = parsed.recordings;
            return normalizeMap(recordings);
        }
        return normalizeMap(parsed);
    }
    catch {
        return null;
    }
}
export function mergeCustomAudioMaps(currentMap, importedMap) {
    const mergedMap = { ...currentMap };
    let added = 0;
    let replaced = 0;
    for (const [key, value] of Object.entries(importedMap)) {
        if (!mergedMap[key]) {
            added += 1;
        }
        else if (mergedMap[key] !== value) {
            replaced += 1;
        }
        mergedMap[key] = value;
    }
    return { mergedMap, added, replaced };
}
export function renameCustomAudioKey(map, fromText, toText) {
    const fromKey = normalizeSpeechKey(fromText);
    const toKey = normalizeSpeechKey(toText);
    if (!fromKey || !toKey || fromKey === toKey || !map[fromKey]) {
        return { ...map };
    }
    const nextMap = { ...map };
    nextMap[toKey] = nextMap[fromKey];
    delete nextMap[fromKey];
    return nextMap;
}
function normalizeMap(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const entries = Object.entries(value)
        .filter((entry) => typeof entry[0] === 'string' &&
        typeof entry[1] === 'string' &&
        normalizeSpeechKey(entry[0]).length > 0 &&
        entry[1].startsWith('data:audio/'))
        .map(([key, dataUrl]) => [normalizeSpeechKey(key), dataUrl]);
    return Object.fromEntries(entries);
}
//# sourceMappingURL=customAudio.js.map