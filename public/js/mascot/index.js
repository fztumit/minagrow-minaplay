const GUIDE_MESSAGES = {
    hint: 'Hadi dokun.',
    repeat: 'Bir daha söyle.'
};
export class MascotGuide {
    outputEl;
    imageEl;
    shellEl;
    praiseFlip = false;
    activeTimeoutId = null;
    variant = 'normal';
    constructor(outputEl, imageEl, shellEl) {
        this.outputEl = outputEl;
        this.imageEl = imageEl;
        this.shellEl = shellEl;
    }
    sayHint() {
        this.pulse();
        this.setMessage(GUIDE_MESSAGES.hint);
    }
    sayPraise() {
        this.pulse();
        this.setMessage(this.praiseFlip ? 'Harika.' : 'Aferin.');
        this.praiseFlip = !this.praiseFlip;
    }
    sayRepeat() {
        this.pulse();
        this.setMessage(GUIDE_MESSAGES.repeat);
    }
    setSleepMode(enabled) {
        this.variant = enabled ? 'sleep' : 'normal';
        if (this.imageEl) {
            this.imageEl.src = enabled ? '/assets/phoenix-sleep.svg' : '/assets/phoenix-ui.svg';
        }
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
}
//# sourceMappingURL=index.js.map