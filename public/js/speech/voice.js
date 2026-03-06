export const VOICE_PREFERENCE_STORAGE_KEY = 'konusu_yorum_voice_pref_v1';
const PREFERRED_NAME_HINTS = [
    'google turkce',
    'google turkish',
    'google türkçe',
    'microsoft emel',
    'microsoft ahmet',
    'turkish',
    'turkce',
    'türkçe',
    'tr-tr'
];
export function loadStoredVoiceURI() {
    const raw = localStorage.getItem(VOICE_PREFERENCE_STORAGE_KEY);
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.voiceURI !== 'string' || parsed.voiceURI.trim().length === 0) {
            return null;
        }
        return parsed.voiceURI.trim();
    }
    catch {
        return null;
    }
}
export function saveStoredVoiceURI(voiceURI) {
    localStorage.setItem(VOICE_PREFERENCE_STORAGE_KEY, JSON.stringify({ voiceURI: voiceURI ?? null }));
}
export function sortVoicesForPicker(voices) {
    return voices.slice().sort((left, right) => scoreVoice(right) - scoreVoice(left));
}
export function hasTurkishVoice(voices) {
    return voices.some((voice) => isTurkishVoice(voice));
}
export function resolvePreferredVoice(voices, selectedVoiceURI) {
    if (voices.length === 0) {
        return null;
    }
    if (selectedVoiceURI) {
        const selected = voices.find((voice) => voice.voiceURI === selectedVoiceURI);
        if (selected) {
            return selected;
        }
    }
    const sorted = sortVoicesForPicker(voices);
    return sorted[0] ?? null;
}
export function isTurkishVoice(voice) {
    return voice.lang.toLocaleLowerCase('en-US').startsWith('tr');
}
function scoreVoice(voice) {
    let score = 0;
    const normalizedLang = voice.lang.toLocaleLowerCase('en-US');
    const normalizedName = normalizeVoiceName(voice.name);
    if (normalizedLang.startsWith('tr')) {
        score += 100;
    }
    if (normalizedLang === 'tr-tr') {
        score += 8;
    }
    if (voice.localService) {
        score += 4;
    }
    if (voice.default) {
        score += 3;
    }
    const preferredIndex = PREFERRED_NAME_HINTS.findIndex((fragment) => normalizedName.includes(fragment));
    if (preferredIndex >= 0) {
        score += 30 - preferredIndex;
    }
    return score;
}
function normalizeVoiceName(name) {
    return name
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}
//# sourceMappingURL=voice.js.map