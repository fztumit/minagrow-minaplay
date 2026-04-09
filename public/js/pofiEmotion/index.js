export const POFI_DEFAULT_EMOTION = 'smile';
export const POFI_EMOTION_TRANSITION_MS = 240;
const POFI_EMOTION_SRC = {
    smile: '/assets/pofi/emotions/pofi_smile.png',
    happy: '/assets/pofi/emotions/pofi_happy.png',
    happy_wide: '/assets/pofi/emotions/pofi_happy_wide.png',
    happy_teeth: '/assets/pofi/emotions/pofi_happy_teeth.png',
    grin_soft: '/assets/pofi/emotions/pofi_grin_soft.png',
    smile_open: '/assets/pofi/emotions/pofi_smile_open.png',
    happy_tilt: '/assets/pofi/emotions/pofi_happy_tilt.png',
    smirk: '/assets/pofi/emotions/pofi_smirk.png',
    side_smile: '/assets/pofi/emotions/pofi_side_smile.png',
    cheeky: '/assets/pofi/emotions/pofi_cheeky.png',
    playful: '/assets/pofi/emotions/pofi_playful.png',
    silly: '/assets/pofi/emotions/pofi_silly.png',
    tongue: '/assets/pofi/emotions/pofi_tongue.png',
    nervous: '/assets/pofi/emotions/pofi_nervous.png',
    scared: '/assets/pofi/emotions/pofi_scared.png',
    sad: '/assets/pofi/emotions/pofi_sad.png',
    sad_cry: '/assets/pofi/emotions/pofi_sad_cry.png',
    calm_happy: '/assets/pofi/emotions/pofi_calm_happy.png',
    surprised: '/assets/pofi/emotions/pofi_surprised.png',
    sleep: '/assets/pofi/emotions/pofi_sleep.png'
};
const BEHAVIOR_EMOTION_MAP = {
    default: ['smile'],
    happy: ['happy', 'happy_wide', 'smile_open', 'happy_tilt'],
    very_happy: ['happy_teeth', 'grin_soft'],
    playful: ['playful', 'cheeky', 'silly'],
    fun: ['tongue'],
    calm: ['calm_happy', 'smile'],
    sad: ['sad', 'sad_cry'],
    fear: ['scared'],
    nervous: ['nervous'],
    special: ['smirk', 'side_smile'],
    surprised: ['surprised'],
    sleep: ['sleep']
};
const EMOTION_SRC_TO_EMOTION = Object.entries(POFI_EMOTION_SRC).map(([emotion, src]) => [src.split('/').pop() ?? src, emotion]);
const emotionTimeouts = new WeakMap();
export function pickPofiEmotionForBehavior(behavior, variantIndex = 0) {
    const options = BEHAVIOR_EMOTION_MAP[behavior] ?? BEHAVIOR_EMOTION_MAP.default;
    return options[Math.abs(variantIndex) % options.length] ?? POFI_DEFAULT_EMOTION;
}
export function applyPofiEmotion(imageEl, emotion, options = {}) {
    if (!imageEl) {
        return;
    }
    const nextSrc = POFI_EMOTION_SRC[emotion];
    const currentEmotion = imageEl.dataset.pofiEmotion;
    const currentSrc = imageEl.getAttribute('src') ?? '';
    const transitionMs = POFI_EMOTION_TRANSITION_MS;
    imageEl.dataset.pofiEmotion = emotion;
    imageEl.style.setProperty('--pofi-emotion-transition-ms', `${transitionMs}ms`);
    if (currentEmotion === emotion && currentSrc === nextSrc) {
        return;
    }
    const existingTimeout = emotionTimeouts.get(imageEl);
    if (typeof existingTimeout === 'number') {
        window.clearTimeout(existingTimeout);
        emotionTimeouts.delete(imageEl);
    }
    const finishTransition = () => {
        imageEl.classList.remove('is-emotion-transition');
        imageEl.onload = null;
        imageEl.onerror = null;
    };
    const assignSource = (src) => {
        imageEl.dataset.pofiResolved = 'png';
        imageEl.dataset.pofiLoadState = 'loading';
        imageEl.onload = () => {
            imageEl.dataset.pofiLoadState = 'loaded';
            finishTransition();
        };
        imageEl.onerror = () => {
            imageEl.dataset.pofiLoadState = 'missing';
            finishTransition();
        };
        imageEl.src = src;
    };
    if (options.immediate) {
        assignSource(nextSrc);
        return;
    }
    imageEl.classList.add('is-emotion-transition');
    const timeoutId = window.setTimeout(() => {
        assignSource(nextSrc);
        emotionTimeouts.delete(imageEl);
    }, Math.round(transitionMs * 0.45));
    emotionTimeouts.set(imageEl, timeoutId);
}
export function hydratePofiEmotionImages(root = document) {
    const emotionImages = Array.from(root.querySelectorAll('img.pofi-face-layer'));
    emotionImages.forEach((imageEl) => {
        applyPofiEmotion(imageEl, inferPofiEmotion(imageEl), { immediate: true });
    });
}
export function inferPofiEmotion(imageEl) {
    const explicit = imageEl.dataset.pofiEmotion;
    if (explicit) {
        return explicit;
    }
    const currentSrc = imageEl.getAttribute('src') ?? '';
    const matched = EMOTION_SRC_TO_EMOTION.find(([needle]) => currentSrc.includes(needle))?.[1];
    return matched ?? POFI_DEFAULT_EMOTION;
}
//# sourceMappingURL=index.js.map