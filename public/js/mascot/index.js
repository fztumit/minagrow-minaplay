const GUIDE_MESSAGES = {
    hint: 'Hadi dokun.',
    repeat: 'Bir daha söyle.'
};
export class MascotGuide {
    outputEl;
    praiseFlip = false;
    constructor(outputEl) {
        this.outputEl = outputEl;
    }
    sayHint() {
        this.setMessage(GUIDE_MESSAGES.hint);
    }
    sayPraise() {
        this.setMessage(this.praiseFlip ? 'Harika.' : 'Aferin.');
        this.praiseFlip = !this.praiseFlip;
    }
    sayRepeat() {
        this.setMessage(GUIDE_MESSAGES.repeat);
    }
    setMessage(message) {
        this.outputEl.textContent = message;
    }
}
//# sourceMappingURL=index.js.map