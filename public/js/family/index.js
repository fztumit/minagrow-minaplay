const STORAGE_KEY = 'konusu_yorum_family_members_v1';
export class FamilyAvatarModule {
    rootEl;
    formEl;
    nameInput;
    colorInput;
    photoInput;
    listEl;
    mascot;
    members = [];
    constructor(rootEl, mascot) {
        const formEl = rootEl.querySelector('#family-form');
        const nameInput = rootEl.querySelector('#family-name');
        const colorInput = rootEl.querySelector('#family-color');
        const photoInput = rootEl.querySelector('#family-photo');
        const listEl = rootEl.querySelector('#family-list');
        if (!formEl || !nameInput || !colorInput || !photoInput || !listEl) {
            throw new Error('Family module missing required elements.');
        }
        this.rootEl = rootEl;
        this.formEl = formEl;
        this.nameInput = nameInput;
        this.colorInput = colorInput;
        this.photoInput = photoInput;
        this.listEl = listEl;
        this.mascot = mascot;
    }
    init() {
        this.loadFromStorage();
        this.renderMembers();
        this.formEl.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.handleSubmit();
        });
    }
    async handleSubmit() {
        const name = this.nameInput.value.trim();
        const color = this.colorInput.value;
        if (!name) {
            return;
        }
        const file = this.photoInput.files?.[0] ?? null;
        const photoDataUrl = file ? await this.fileToDataUrl(file) : this.createFallbackAvatar(name, color);
        const member = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name,
            color,
            photoDataUrl,
            createdAt: new Date().toISOString()
        };
        this.members.unshift(member);
        this.saveToStorage();
        this.renderMembers();
        this.formEl.reset();
        this.colorInput.value = '#ff8f66';
        this.mascot.sayPraise();
    }
    renderMembers() {
        this.rootEl.setAttribute('data-member-count', String(this.members.length));
        if (this.members.length === 0) {
            this.listEl.innerHTML = '<p>Henüz kayıt yok. İlk aile üyesini ekleyin.</p>';
            return;
        }
        this.listEl.innerHTML = this.members
            .map((member) => `
          <article class="family-card" data-member-id="${member.id}">
            <img class="family-photo" src="${member.photoDataUrl}" alt="${member.name} fotoğrafı" />
            <div class="family-meta">
              <span class="family-swatch" style="background:${member.color}"></span>
              <strong>${member.name}</strong>
            </div>
          </article>
        `)
            .join('');
    }
    loadFromStorage() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            this.members = [];
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                this.members = parsed.filter((item) => item &&
                    typeof item.id === 'string' &&
                    typeof item.name === 'string' &&
                    typeof item.color === 'string' &&
                    typeof item.photoDataUrl === 'string' &&
                    typeof item.createdAt === 'string');
            }
        }
        catch {
            this.members = [];
        }
    }
    saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.members));
    }
    async fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(new Error('Fotoğraf okunamadı.'));
            reader.readAsDataURL(file);
        });
    }
    createFallbackAvatar(name, color) {
        const firstLetter = name[0]?.toUpperCase() ?? '?';
        const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" rx="44" fill="${color}" />
        <circle cx="128" cy="106" r="52" fill="#fff2dc" />
        <text x="128" y="202" text-anchor="middle" font-size="88" font-family="Trebuchet MS" fill="#ffffff">${firstLetter}</text>
      </svg>
    `;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
}
//# sourceMappingURL=index.js.map