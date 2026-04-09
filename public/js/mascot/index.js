const GUIDE_MESSAGES = {
    play: 'Hadi oynayalım.',
    hint: 'Hadi dokun.',
    peek: 'Ceee!',
    repeat: 'Bir daha söyle.',
    next: 'Şimdi buna dokun.'
};
const FACE_SRC = {
    idle: '/assets/pofi-pack/face-idle.svg',
    surprised: '/assets/pofi-pack/face-surprised.svg',
    calm: '/assets/pofi-pack/face-calm.svg',
    happy: '/assets/pofi-pack/face-happy.svg',
    sleep: '/assets/pofi-pack/face-sleep.svg'
};
export class MascotGuide {
    outputEl;
    faceEl;
    shellEl;
    praiseFlip = false;
    activeTimeoutId = null;
    faceTimeoutId = null;
    guideAudioContext = null;
    variant = 'normal';
    constructor(outputEl, faceEl, shellEl) {
        this.outputEl = outputEl;
        this.faceEl = faceEl;
        this.shellEl = shellEl;
    }
    sayHint() {
        this.pulse();
        this.setFace('idle');
        this.setMessage(GUIDE_MESSAGES.hint);
    }
    sayPlayStart() {
        this.pulse();
        this.setTransientFace('surprised', 1200);
        this.setMessage(GUIDE_MESSAGES.play);
        this.speakPrompt(GUIDE_MESSAGES.play, {
            rate: 0.9,
            pitch: 1.08,
            volume: 0.88
        });
    }
    sayPeekaboo() {
        this.pulse();
        this.setTransientFace('surprised', 1200);
        this.setMessage(GUIDE_MESSAGES.peek);
        this.playGuideChime();
        this.speakPrompt(GUIDE_MESSAGES.peek, {
            rate: 0.96,
            pitch: 1.16,
            volume: 0.92
        });
    }
    sayPraise() {
        this.pulse();
        this.setTransientFace('happy', 1300);
        const message = this.praiseFlip ? 'Harika.' : 'Aferin.';
        this.setMessage(message);
        this.speakPrompt(message, {
            rate: 0.92,
            pitch: 1.08,
            volume: 0.86
        });
        this.primeGuideAudio();
        this.praiseFlip = !this.praiseFlip;
    }
    sayRepeat() {
        this.pulse();
        this.setFace('calm');
        this.setMessage(GUIDE_MESSAGES.repeat);
    }
    showCalm(message = GUIDE_MESSAGES.repeat, durationMs = 1100) {
        this.pulse();
        this.setTransientFace('calm', durationMs);
        this.setMessage(message);
    }
    showSad(message = 'Aaa... bu değil. Bir daha deneyelim.', durationMs = 980) {
        this.pulse();
        this.setTransientFace('calm', durationMs);
        this.setMessage(message);
        this.playGuideOops();
    }
    showSleepy(message = 'Pofi uyukluyor.', durationMs = 1200) {
        this.setTransientFace('sleep', durationMs);
        this.setMessage(message);
    }
    showIdle(message) {
        this.setFace(this.variant === 'sleep' ? 'sleep' : 'idle');
        if (message) {
            this.setMessage(message);
        }
    }
    sayNextPrompt() {
        this.pulse();
        this.setTransientFace('surprised', 1100);
        this.setMessage(GUIDE_MESSAGES.next);
        this.playGuideChime();
        this.speakPrompt(GUIDE_MESSAGES.next);
    }
    sayAttention(message) {
        this.pulse();
        this.setTransientFace('surprised', 1400);
        this.setMessage(message);
        this.playAttentionChirp();
        this.speakPrompt(message, {
            rate: 0.84,
            pitch: 1.08,
            volume: 0.86
        });
    }
    setSleepMode(enabled) {
        this.variant = enabled ? 'sleep' : 'normal';
        this.setFace(enabled ? 'sleep' : 'idle');
        if (this.shellEl) {
            this.shellEl.dataset.mascotVariant = this.variant;
            if (enabled) {
                this.shellEl.classList.remove('is-active');
            }
        }
    }
    setMessage(message) {
        this.outputEl.textContent = message;
    }
    pulse() {
        if (this.variant === 'sleep' || !this.shellEl) {
            return;
        }
        if (this.activeTimeoutId !== null) {
            window.clearTimeout(this.activeTimeoutId);
        }
        this.shellEl.classList.add('is-active');
        this.activeTimeoutId = window.setTimeout(() => {
            this.shellEl?.classList.remove('is-active');
            this.activeTimeoutId = null;
        }, 1200);
    }
    setTransientFace(face, durationMs) {
        this.setFace(face);
        if (this.faceTimeoutId !== null) {
            window.clearTimeout(this.faceTimeoutId);
        }
        this.faceTimeoutId = window.setTimeout(() => {
            this.setFace(this.variant === 'sleep' ? 'sleep' : 'idle');
            this.faceTimeoutId = null;
        }, durationMs);
    }
    setFace(face) {
        if (!this.faceEl) {
            return;
        }
        const nextSrc = FACE_SRC[face];
        if (this.faceEl.getAttribute('src') !== nextSrc) {
            this.faceEl.src = nextSrc;
        }
        this.faceEl.dataset.face = face;
    }
    speakPrompt(message, options = {}) {
        const runtime = window;
        runtime.__mascotPromptLog = runtime.__mascotPromptLog ?? [];
        runtime.__mascotPromptLog.push(message);
        if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
            return;
        }
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'tr-TR';
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1.04;
        utterance.volume = options.volume ?? 0.82;
        try {
            window.speechSynthesis.speak(utterance);
        }
        catch {
            // Ignore speech prompt errors and keep visual guidance active.
        }
    }
    primeGuideAudio() {
        if (!('AudioContext' in window)) {
            return;
        }
        if (!this.guideAudioContext) {
            try {
                this.guideAudioContext = new AudioContext();
            }
            catch {
                return;
            }
        }
        void this.guideAudioContext.resume().catch(() => {
            // Ignore resume failures; prompt audio is optional.
        });
    }
    playGuideChime() {
        const runtime = window;
        runtime.__mascotSoundLog = runtime.__mascotSoundLog ?? [];
        runtime.__mascotSoundLog.push('guide-chime');
        if (this.variant === 'sleep') {
            return;
        }
        this.primeGuideAudio();
        const context = this.guideAudioContext;
        if (!context || context.state !== 'running') {
            return;
        }
        const start = context.currentTime + 0.01;
        const master = context.createGain();
        master.connect(context.destination);
        master.gain.setValueAtTime(0.0001, start);
        master.gain.exponentialRampToValueAtTime(0.26, start + 0.04);
        master.gain.exponentialRampToValueAtTime(0.0001, start + 0.44);
        this.playGuideTone(context, master, start, 740, 0.18, 'triangle');
        this.playGuideTone(context, master, start + 0.11, 988, 0.2, 'sine');
    }
    playAttentionChirp() {
        const runtime = window;
        runtime.__mascotSoundLog = runtime.__mascotSoundLog ?? [];
        runtime.__mascotSoundLog.push('attention-chirp');
        if (this.variant === 'sleep') {
            return;
        }
        this.primeGuideAudio();
        const context = this.guideAudioContext;
        if (!context || context.state !== 'running') {
            return;
        }
        const start = context.currentTime + 0.01;
        const master = context.createGain();
        master.connect(context.destination);
        master.gain.setValueAtTime(0.0001, start);
        master.gain.exponentialRampToValueAtTime(0.2, start + 0.03);
        master.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
        this.playGuideTone(context, master, start, 622, 0.14, 'triangle');
        this.playGuideTone(context, master, start + 0.09, 784, 0.14, 'sine');
        this.playGuideTone(context, master, start + 0.18, 932, 0.18, 'triangle');
    }
    playGuideOops() {
        const runtime = window;
        runtime.__mascotSoundLog = runtime.__mascotSoundLog ?? [];
        runtime.__mascotSoundLog.push('guide-oops');
        if (this.variant === 'sleep') {
            return;
        }
        this.primeGuideAudio();
        const context = this.guideAudioContext;
        if (!context || context.state !== 'running') {
            return;
        }
        const start = context.currentTime + 0.01;
        const master = context.createGain();
        master.connect(context.destination);
        master.gain.setValueAtTime(0.0001, start);
        master.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
        master.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
        this.playGuideTone(context, master, start, 482, 0.22, 'triangle');
        this.playGuideTone(context, master, start + 0.14, 344, 0.26, 'sine');
    }
    playGuideTone(context, destination, start, frequency, duration, type) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gainNode.gain.setValueAtTime(0.0001, start);
        gainNode.gain.exponentialRampToValueAtTime(0.42, start + 0.025);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gainNode);
        gainNode.connect(destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }
}
//# sourceMappingURL=index.js.map