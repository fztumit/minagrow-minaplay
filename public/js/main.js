import { DailyActivityModule } from './dailyactivity/index.js';
import { DailyWordModule } from './dailyword/index.js';
import { VOCABULARY } from './data/vocabulary.js';
import { FamilyAvatarModule } from './family/index.js';
import { MascotGuide } from './mascot/index.js';
import { MatchingGameModule } from './matching/index.js';
import { MirrorModeModule } from './mirror/index.js';
import { PeekabooModeModule } from './peekaboo/index.js';
import { hydratePofiEmotionImages } from './pofiEmotion/index.js';
import { SentenceBuilderModule } from './sentence/index.js';
import { SleepModeModule } from './sleep/index.js';
import { StoriesModule } from './stories/index.js';
import { TouchGameModule } from './touch/index.js';
import { bindParentGesture } from './shared/parentGesture.js';
const DEFAULT_PARENT_PIN = '1234';
const PARENT_PIN_STORAGE_KEY = 'minaplay_parent_pin_v1';
function normalizeParentPin(value) {
    return value.replace(/\D/g, '').slice(0, 4);
}
function loadParentPin() {
    const normalized = normalizeParentPin(localStorage.getItem(PARENT_PIN_STORAGE_KEY) ?? '');
    return normalized.length === 4 ? normalized : DEFAULT_PARENT_PIN;
}
function saveParentPin(pin) {
    const normalized = normalizeParentPin(pin);
    if (normalized.length !== 4 || normalized === DEFAULT_PARENT_PIN) {
        localStorage.removeItem(PARENT_PIN_STORAGE_KEY);
        return;
    }
    localStorage.setItem(PARENT_PIN_STORAGE_KEY, normalized);
}
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.warn('Service worker registration failed:', error);
        });
    });
}
function wireTabs(mascot) {
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const homeLauncherButtons = Array.from(document.querySelectorAll('.home-mode-card, .home-bonus-card'));
    const views = Array.from(document.querySelectorAll('.module-view'));
    const homeRoot = document.getElementById('view-home');
    const speechRoot = document.getElementById('view-speech');
    const matchingRoot = document.getElementById('view-matching');
    const sentenceRoot = document.getElementById('view-sentence');
    const peekabooRoot = document.getElementById('view-peekaboo');
    const mirrorRoot = document.getElementById('view-mirror');
    const storiesRoot = document.getElementById('view-stories');
    const sleepRoot = document.getElementById('view-sleep');
    const parentRoot = document.getElementById('view-parent');
    const parentCloseBtn = document.getElementById('parent-panel-close');
    const authOverlay = document.getElementById('parent-auth-overlay');
    const authForm = document.getElementById('parent-auth-form');
    const authInput = document.getElementById('parent-auth-input');
    const authError = document.getElementById('parent-auth-error');
    const authCancelBtn = document.getElementById('parent-auth-cancel');
    const parentPinForm = document.getElementById('parent-pin-form');
    const parentPinInput = document.getElementById('parent-pin-input');
    const parentPinConfirmInput = document.getElementById('parent-pin-confirm');
    const parentPinStatus = document.getElementById('parent-pin-status');
    let lastPrimaryView = 'home';
    const notifySpeechGuidance = (state) => {
        speechRoot?.dispatchEvent(new CustomEvent(`speech-guidance-${state}`));
    };
    const notifyMatchingGuidance = (state) => {
        matchingRoot?.dispatchEvent(new CustomEvent(`speech-guidance-${state}`));
    };
    const notifySentenceLifecycle = (state) => {
        sentenceRoot?.dispatchEvent(new CustomEvent(`sentence-${state}`));
    };
    const notifyPeekabooLifecycle = (state) => {
        peekabooRoot?.dispatchEvent(new CustomEvent(`peekaboo-${state}`));
    };
    const notifyMirrorLifecycle = (state) => {
        mirrorRoot?.dispatchEvent(new CustomEvent(`mirror-${state}`));
    };
    const notifySleepLifecycle = (state) => {
        sleepRoot?.dispatchEvent(new CustomEvent(`sleep-${state}`));
    };
    const resumeActiveChildModule = () => {
        const activeViewId = document.querySelector('.module-view.active')?.id;
        if (activeViewId === 'view-home') {
            return;
        }
        if (activeViewId === 'view-speech') {
            notifySpeechGuidance('resume');
        }
        if (activeViewId === 'view-matching') {
            notifyMatchingGuidance('resume');
        }
        if (activeViewId === 'view-sentence') {
            notifySentenceLifecycle('resume');
        }
        if (activeViewId === 'view-peekaboo') {
            notifyPeekabooLifecycle('resume');
        }
        if (activeViewId === 'view-mirror') {
            notifyMirrorLifecycle('resume');
        }
        if (activeViewId === 'view-sleep') {
            notifySleepLifecycle('resume');
        }
    };
    const syncParentPinStatus = (message) => {
        if (!parentPinStatus) {
            return;
        }
        if (message) {
            parentPinStatus.textContent = message;
            return;
        }
        const usesDefaultPin = loadParentPin() === DEFAULT_PARENT_PIN;
        parentPinStatus.textContent = usesDefaultPin
            ? `Varsayılan şifre aktif: ${DEFAULT_PARENT_PIN}`
            : 'Özel ebeveyn şifresi kayıtlı.';
    };
    const closeParentAuth = () => {
        authOverlay?.classList.remove('is-active');
        authOverlay?.setAttribute('aria-hidden', 'true');
        if (authInput) {
            authInput.value = '';
        }
        if (authError) {
            authError.textContent = '';
        }
    };
    const bindHiddenParentAccess = (root, triggerId, hotspotId) => {
        if (!root) {
            return;
        }
        const triggerBtn = root.querySelector(`#${triggerId}`);
        const hotspotEl = root.querySelector(`#${hotspotId}`);
        if (!triggerBtn || !hotspotEl) {
            return;
        }
        triggerBtn.addEventListener('click', () => {
            root.dispatchEvent(new CustomEvent('open-parent-panel', { bubbles: true }));
        });
        bindParentGesture({
            hotspotEl,
            onTrigger: () => {
                triggerBtn.click();
            }
        });
    };
    const activatePrimaryView = (selectedView) => {
        lastPrimaryView = selectedView;
        closeParentAuth();
        document.body.setAttribute('data-active-view', selectedView);
        tabButtons.forEach((candidate) => {
            const active = candidate.dataset.view === selectedView;
            candidate.classList.toggle('active', active);
            candidate.setAttribute('aria-selected', String(active));
        });
        views.forEach((view) => {
            view.classList.toggle('active', view.id === `view-${selectedView}`);
        });
        mascot.setSleepMode(selectedView === 'sleep');
        if (selectedView === 'speech') {
            notifySpeechGuidance('resume');
        }
        else {
            notifySpeechGuidance('pause');
        }
        if (selectedView === 'matching') {
            notifyMatchingGuidance('resume');
        }
        else {
            notifyMatchingGuidance('pause');
        }
        if (selectedView === 'sentence') {
            notifySentenceLifecycle('resume');
        }
        else {
            notifySentenceLifecycle('pause');
        }
        if (selectedView === 'peekaboo') {
            notifyPeekabooLifecycle('resume');
        }
        else {
            notifyPeekabooLifecycle('pause');
        }
        if (selectedView === 'mirror') {
            notifyMirrorLifecycle('resume');
        }
        else {
            notifyMirrorLifecycle('pause');
        }
        if (selectedView === 'sleep') {
            notifySleepLifecycle('resume');
        }
        else {
            notifySleepLifecycle('pause');
        }
        if (selectedView === 'home') {
            mascot.setMessage('Bir mod seç.');
        }
        else if (selectedView === 'speech') {
            mascot.sayHint();
        }
        else if (selectedView === 'matching') {
            mascot.setMessage('Eşleme zamanı.');
        }
        else if (selectedView === 'sentence') {
            mascot.setMessage('Cümle kuralım.');
        }
        else if (selectedView === 'peekaboo') {
            mascot.setMessage('Cee zamanı.');
        }
        else if (selectedView === 'mirror') {
            mascot.setMessage('Pofi ile aynaya bakalım.');
        }
        else if (selectedView === 'stories') {
            mascot.setMessage('Hikaye zamanı.');
        }
        else if (selectedView === 'sleep') {
            mascot.setMessage('Uyku zamanı.');
        }
    };
    document.addEventListener('activate-primary-view', (event) => {
        const selectedView = event.detail;
        if (!selectedView) {
            return;
        }
        activatePrimaryView(selectedView);
    });
    const openParentPanel = () => {
        closeParentAuth();
        notifySpeechGuidance('pause');
        notifyMatchingGuidance('pause');
        notifySentenceLifecycle('pause');
        notifyPeekabooLifecycle('pause');
        notifyMirrorLifecycle('pause');
        notifySleepLifecycle('pause');
        document.body.setAttribute('data-active-view', 'parent');
        views.forEach((view) => {
            view.classList.toggle('active', view.id === 'view-parent');
        });
        mascot.setSleepMode(false);
        mascot.setMessage('Ebeveyn paneli.');
    };
    const requestParentPin = () => {
        if (!authOverlay || !authInput) {
            openParentPanel();
            return;
        }
        notifySpeechGuidance('pause');
        notifyMatchingGuidance('pause');
        notifySentenceLifecycle('pause');
        notifyPeekabooLifecycle('pause');
        notifySleepLifecycle('pause');
        authOverlay.classList.add('is-active');
        authOverlay.setAttribute('aria-hidden', 'false');
        authInput.value = '';
        if (authError) {
            authError.textContent = '';
        }
        mascot.setMessage('Şifreyi gir.');
        window.setTimeout(() => {
            authInput.focus();
        }, 40);
    };
    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedView = button.dataset.view;
            if (!selectedView) {
                return;
            }
            if (document.body.getAttribute('data-active-view') === selectedView) {
                activatePrimaryView('home');
                return;
            }
            activatePrimaryView(selectedView);
        });
    });
    homeLauncherButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedView = button.dataset.view;
            if (!selectedView) {
                return;
            }
            activatePrimaryView(selectedView);
        });
    });
    parentCloseBtn?.addEventListener('click', () => {
        activatePrimaryView(lastPrimaryView);
    });
    homeRoot?.addEventListener('open-parent-panel', () => {
        requestParentPin();
    });
    speechRoot?.addEventListener('open-parent-panel', () => {
        requestParentPin();
    });
    matchingRoot?.addEventListener('open-parent-panel', () => {
        requestParentPin();
    });
    sentenceRoot?.addEventListener('open-parent-panel', () => {
        requestParentPin();
    });
    storiesRoot?.addEventListener('open-parent-panel', () => {
        requestParentPin();
    });
    peekabooRoot?.addEventListener('open-parent-panel', () => {
        requestParentPin();
    });
    sleepRoot?.addEventListener('open-parent-panel', () => {
        requestParentPin();
    });
    authInput?.addEventListener('input', () => {
        authInput.value = normalizeParentPin(authInput.value);
    });
    parentPinInput?.addEventListener('input', () => {
        parentPinInput.value = normalizeParentPin(parentPinInput.value);
    });
    parentPinConfirmInput?.addEventListener('input', () => {
        parentPinConfirmInput.value = normalizeParentPin(parentPinConfirmInput.value);
    });
    authForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const enteredPin = normalizeParentPin(authInput?.value ?? '');
        if (enteredPin === loadParentPin()) {
            openParentPanel();
            return;
        }
        if (authError) {
            authError.textContent = 'Şifre yanlış.';
        }
        if (authInput) {
            authInput.value = '';
            authInput.focus();
        }
        mascot.setMessage('Şifre yanlış.');
    });
    authCancelBtn?.addEventListener('click', () => {
        closeParentAuth();
        resumeActiveChildModule();
        mascot.sayHint();
    });
    authOverlay?.addEventListener('click', (event) => {
        if (event.target === authOverlay) {
            closeParentAuth();
            resumeActiveChildModule();
            mascot.sayHint();
        }
    });
    parentPinForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const nextPin = normalizeParentPin(parentPinInput?.value ?? '');
        const confirmPin = normalizeParentPin(parentPinConfirmInput?.value ?? '');
        if (nextPin.length !== 4) {
            syncParentPinStatus('4 haneli sayı gir.');
            return;
        }
        if (nextPin !== confirmPin) {
            syncParentPinStatus('Şifreler aynı değil.');
            return;
        }
        saveParentPin(nextPin);
        if (parentPinInput) {
            parentPinInput.value = '';
        }
        if (parentPinConfirmInput) {
            parentPinConfirmInput.value = '';
        }
        syncParentPinStatus(nextPin === DEFAULT_PARENT_PIN ? `Varsayılan şifre aktif: ${DEFAULT_PARENT_PIN}` : 'Yeni ebeveyn şifresi kaydedildi.');
        mascot.setMessage('Şifre kaydedildi.');
    });
    syncParentPinStatus();
    bindHiddenParentAccess(homeRoot, 'home-parent-trigger', 'home-parent-hotspot');
    bindHiddenParentAccess(speechRoot, 'speech-parent-trigger', 'speech-parent-hotspot');
    bindHiddenParentAccess(sentenceRoot, 'sentence-parent-trigger', 'sentence-parent-hotspot');
    bindHiddenParentAccess(storiesRoot, 'stories-parent-trigger', 'stories-parent-hotspot');
    bindHiddenParentAccess(mirrorRoot, 'mirror-parent-trigger', 'mirror-parent-hotspot');
    bindHiddenParentAccess(sleepRoot, 'sleep-parent-trigger', 'sleep-parent-hotspot');
    if (parentRoot?.classList.contains('active')) {
        openParentPanel();
    }
}
function installTestingHooks() {
    const runtime = window;
    runtime.render_game_to_text = () => {
        const activeViewId = document.querySelector('.module-view.active')?.id ?? null;
        const homeRoot = document.getElementById('view-home');
        const speechRoot = document.getElementById('view-speech');
        const matchingRoot = document.getElementById('view-matching');
        const sentenceRoot = document.getElementById('view-sentence');
        const peekabooRoot = document.getElementById('view-peekaboo');
        const mirrorRoot = document.getElementById('view-mirror');
        const sleepRoot = document.getElementById('view-sleep');
        const familyRoot = document.getElementById('family-panel');
        const storiesRoot = document.getElementById('view-stories');
        const dailyWordRoot = document.getElementById('daily-word-card');
        const dailyActivityRoot = document.getElementById('daily-activity-card');
        const dailyWordText = document.getElementById('daily-word-text')?.textContent ?? null;
        const mascotMessage = document.getElementById('mascot-message')?.textContent ?? null;
        const authOverlay = document.getElementById('parent-auth-overlay');
        return JSON.stringify({
            layout: 'DOM based module layout, no physics coordinates',
            active_view: activeViewId,
            parent_panel_open: activeViewId === 'view-parent',
            parent_auth_open: authOverlay?.classList.contains('is-active') ?? false,
            mascot_message: mascotMessage,
            home: {
                mode_count: homeRoot?.querySelectorAll('.home-mode-card').length ?? 0,
                bonus_count: homeRoot?.querySelectorAll('.home-bonus-card').length ?? 0
            },
            navigation: {
                primary_tab_count: document.querySelectorAll('.module-tabs .tab-btn').length
            },
            daily_word: dailyWordText,
            daily_word_audio: {
                has_recording: dailyWordRoot?.getAttribute('data-daily-word-has-audio') === 'true'
            },
            daily_activity: {
                completed_count: Number(dailyActivityRoot?.getAttribute('data-daily-task-completed-count') ?? 0),
                words: Number(dailyActivityRoot?.getAttribute('data-daily-task-words') ?? 0),
                story: Number(dailyActivityRoot?.getAttribute('data-daily-task-story') ?? 0),
                interaction: Number(dailyActivityRoot?.getAttribute('data-daily-task-interaction') ?? 0),
                date: dailyActivityRoot?.getAttribute('data-daily-task-date') ?? ''
            },
            speech: {
                active_level: speechRoot?.getAttribute('data-active-level') ?? 'classic',
                active_set: speechRoot?.getAttribute('data-active-set') ?? 'featured-scene',
                last_word: speechRoot?.getAttribute('data-last-word') ?? null,
                next_word: speechRoot?.getAttribute('data-next-word') ?? null,
                current_target: speechRoot?.getAttribute('data-current-target') ?? null,
                guided_target: speechRoot?.getAttribute('data-guided-target') ?? null,
                focused_word: speechRoot?.getAttribute('data-focused-word') ?? null,
                guide_prompt: speechRoot?.getAttribute('data-guide-prompt') ?? '',
                guide_active: speechRoot?.getAttribute('data-guide-active') === 'true',
                guide_mode: speechRoot?.getAttribute('data-guide-mode') ?? 'idle',
                scene_phase: speechRoot?.getAttribute('data-scene-phase') ?? 'idle',
                peek_mode: speechRoot?.getAttribute('data-peek-mode') ?? 'hands',
                water_spilled: speechRoot?.getAttribute('data-water-spilled') === 'true',
                water_expanded: speechRoot?.getAttribute('data-water-expanded') === 'true',
                auto_progress: speechRoot?.getAttribute('data-auto-progress') === 'true',
                set_completion: speechRoot?.getAttribute('data-set-completion') ?? '0/0',
                repeat_mode: speechRoot?.getAttribute('data-repeat-mode') ?? 'default',
                custom_audio_count: Number(speechRoot?.getAttribute('data-custom-audio-count') ?? 0),
                word_recording_coverage: speechRoot?.getAttribute('data-word-recording-coverage') ?? '0/0',
                total_word_listens: Number(speechRoot?.getAttribute('data-total-word-listens') ?? 0),
                top_sentence: speechRoot?.getAttribute('data-top-sentence') ?? '',
                top_sentence_count: Number(speechRoot?.getAttribute('data-top-sentence-count') ?? 0)
            },
            matching: {
                active_level: matchingRoot?.getAttribute('data-active-level') ?? 'starter',
                active_set: matchingRoot?.getAttribute('data-active-set') ?? 'starter-first-words',
                last_word: matchingRoot?.getAttribute('data-last-word') ?? null,
                next_word: matchingRoot?.getAttribute('data-next-word') ?? null,
                current_target: matchingRoot?.getAttribute('data-current-target') ?? null,
                guided_target: matchingRoot?.getAttribute('data-guided-target') ?? null,
                focused_word: matchingRoot?.getAttribute('data-focused-word') ?? null,
                guide_prompt: matchingRoot?.getAttribute('data-guide-prompt') ?? '',
                guide_active: matchingRoot?.getAttribute('data-guide-active') === 'true',
                guide_mode: matchingRoot?.getAttribute('data-guide-mode') ?? 'idle',
                scene_phase: matchingRoot?.getAttribute('data-scene-phase') ?? 'idle',
                water_spilled: matchingRoot?.getAttribute('data-water-spilled') === 'true',
                water_expanded: matchingRoot?.getAttribute('data-water-expanded') === 'true',
                auto_progress: matchingRoot?.getAttribute('data-auto-progress') === 'true',
                set_completion: matchingRoot?.getAttribute('data-set-completion') ?? '0/0'
            },
            mirror: {
                current_exercise: mirrorRoot?.getAttribute('data-current-exercise') ?? '',
                current_category: mirrorRoot?.getAttribute('data-current-category') ?? '',
                current_emotion: mirrorRoot?.getAttribute('data-current-emotion') ?? '',
                camera_state: mirrorRoot?.getAttribute('data-camera-state') ?? 'idle',
                cycle_state: mirrorRoot?.getAttribute('data-cycle-state') ?? 'idle',
                rewarding: mirrorRoot?.getAttribute('data-rewarding') === 'true',
                progress: Number(mirrorRoot?.getAttribute('data-progress') ?? 0),
                last_reward: mirrorRoot?.getAttribute('data-last-reward') ?? ''
            },
            sentence: {
                selected_actor: sentenceRoot?.getAttribute('data-selected-actor') ?? '',
                selected_object: sentenceRoot?.getAttribute('data-selected-object') ?? '',
                current_sentence: sentenceRoot?.getAttribute('data-current-sentence') ?? '',
                last_played_sentence: sentenceRoot?.getAttribute('data-last-played-sentence') ?? '',
                has_audio: sentenceRoot?.getAttribute('data-current-sentence-has-audio') === 'true',
                playing: sentenceRoot?.getAttribute('data-playing') === 'true'
            },
            peekaboo: {
                state: peekabooRoot?.getAttribute('data-peek-state') ?? 'idle',
                sequence: peekabooRoot?.getAttribute('data-peek-sequence') ?? 'opening',
                scene: peekabooRoot?.getAttribute('data-peek-scene') ?? 'room',
                hide_mode: peekabooRoot?.getAttribute('data-hide-mode') ?? 'self',
                current_hideout: peekabooRoot?.getAttribute('data-current-hideout') ?? '',
                current_anchor: peekabooRoot?.getAttribute('data-current-anchor') ?? 'center',
                reveals: Number(peekabooRoot?.getAttribute('data-peek-reveals') ?? 0),
                reactions: Number(peekabooRoot?.getAttribute('data-peek-reactions') ?? 0),
                can_tap_reveal: peekabooRoot?.getAttribute('data-can-tap-reveal') === 'true',
                custom_audio: peekabooRoot?.getAttribute('data-peek-custom-audio') === 'true'
            },
            sleep: {
                running: sleepRoot?.getAttribute('data-running') === 'true'
            },
            family: {
                member_count: Number(familyRoot?.getAttribute('data-member-count') ?? 0)
            },
            stories: {
                level: storiesRoot?.getAttribute('data-story-level') ?? 'easy',
                pack: storiesRoot?.getAttribute('data-story-pack') ?? 'core',
                story_count: Number(storiesRoot?.getAttribute('data-story-count') ?? 0),
                custom_easy_sentence_count: Number(storiesRoot?.getAttribute('data-custom-easy-sentence-count') ?? 0),
                audio_record_count: Number(storiesRoot?.getAttribute('data-story-audio-record-count') ?? 0),
                current_sentence_has_audio: storiesRoot?.getAttribute('data-current-story-audio') === 'true',
                active_story_id: storiesRoot?.getAttribute('data-active-story-id') ?? null,
                sentence_index: Number(storiesRoot?.getAttribute('data-sentence-index') ?? 0),
                last_spoken_sentence: storiesRoot?.getAttribute('data-last-spoken-sentence') ?? '',
                pack_recording_coverage: storiesRoot?.getAttribute('data-pack-recording-coverage') ?? '0/0',
                pack_total_listens: Number(storiesRoot?.getAttribute('data-pack-total-listens') ?? 0),
                pack_top_sentence: storiesRoot?.getAttribute('data-pack-top-sentence') ?? '',
                pack_top_sentence_count: Number(storiesRoot?.getAttribute('data-pack-top-sentence-count') ?? 0),
                pack_weekly_current: Number(storiesRoot?.getAttribute('data-pack-weekly-current') ?? 0),
                pack_weekly_change: Number(storiesRoot?.getAttribute('data-pack-weekly-change') ?? 0),
                pack_listened_sentence_count: Number(storiesRoot?.getAttribute('data-pack-listened-sentence-count') ?? 0),
                pack_total_sentence_count: Number(storiesRoot?.getAttribute('data-pack-total-sentence-count') ?? 0),
                compare_leader_pack: storiesRoot?.getAttribute('data-pack-compare-leader') ?? '',
                compare_leader_total: Number(storiesRoot?.getAttribute('data-pack-compare-leader-total') ?? 0)
            }
        });
    };
    runtime.advanceTime = (ms) => new Promise((resolve) => {
        window.setTimeout(resolve, Math.max(0, ms));
    });
}
function bootstrap() {
    const mascotOutput = document.getElementById('mascot-message');
    const speechMascotShell = document.getElementById('speech-guide-mascot');
    const speechMascotFace = speechMascotShell?.querySelector('.pofi-face-layer') ?? null;
    const dailyWordCard = document.getElementById('daily-word-card');
    const dailyActivityCard = document.getElementById('daily-activity-card');
    const homeRoot = document.getElementById('view-home');
    const speechRoot = document.getElementById('view-speech');
    const matchingRoot = document.getElementById('view-matching');
    const sentenceRoot = document.getElementById('view-sentence');
    const peekabooRoot = document.getElementById('view-peekaboo');
    const mirrorRoot = document.getElementById('view-mirror');
    const storiesRoot = document.getElementById('view-stories');
    const sleepRoot = document.getElementById('view-sleep');
    const parentRoot = document.getElementById('view-parent');
    const familyRoot = document.getElementById('family-panel');
    const dailyWordOutput = document.getElementById('daily-word-text');
    if (!mascotOutput ||
        !speechMascotShell ||
        !dailyWordCard ||
        !dailyActivityCard ||
        !homeRoot ||
        !speechRoot ||
        !matchingRoot ||
        !sentenceRoot ||
        !peekabooRoot ||
        !mirrorRoot ||
        !storiesRoot ||
        !sleepRoot ||
        !parentRoot ||
        !familyRoot ||
        !dailyWordOutput) {
        throw new Error('Required app roots not found.');
    }
    const mascot = new MascotGuide(mascotOutput, speechMascotFace, speechMascotShell);
    hydratePofiEmotionImages(document);
    const dailyWordModule = new DailyWordModule(dailyWordCard, dailyWordOutput, VOCABULARY);
    dailyWordModule.init();
    const dailyActivityModule = new DailyActivityModule(dailyActivityCard);
    dailyActivityModule.init();
    const speechModule = new TouchGameModule(speechRoot, mascot, parentRoot);
    speechModule.init();
    const matchingModule = new MatchingGameModule(matchingRoot, mascot, parentRoot, {
        activeViewName: 'matching'
    });
    matchingModule.init();
    const mirrorModule = new MirrorModeModule(mirrorRoot);
    mirrorModule.init();
    const sentenceModule = new SentenceBuilderModule(sentenceRoot, mascot);
    sentenceModule.init();
    const peekabooModule = new PeekabooModeModule(peekabooRoot, mascot);
    peekabooModule.init();
    const sleepModule = new SleepModeModule(sleepRoot, mascot, parentRoot);
    sleepModule.init();
    const familyModule = new FamilyAvatarModule(familyRoot, mascot);
    familyModule.init();
    const storiesModule = new StoriesModule(storiesRoot, mascot, parentRoot);
    storiesModule.init();
    speechRoot.addEventListener('speech-trigger', (event) => {
        const detail = event.detail;
        if (detail?.word) {
            dailyActivityModule.trackWord(detail.word);
        }
        dailyActivityModule.trackInteraction();
    });
    matchingRoot.addEventListener('speech-trigger', (event) => {
        const detail = event.detail;
        if (detail?.word) {
            dailyActivityModule.trackWord(detail.word);
        }
        dailyActivityModule.trackInteraction();
    });
    mirrorRoot.addEventListener('mirror-activity', () => {
        dailyActivityModule.trackInteraction();
    });
    storiesRoot.addEventListener('story-activity', (event) => {
        const detail = event.detail;
        if (detail?.sentence) {
            dailyActivityModule.trackStory(detail.sentence);
        }
        dailyActivityModule.trackInteraction();
    });
    sentenceRoot.addEventListener('sentence-activity', () => {
        dailyActivityModule.trackInteraction();
    });
    const runtime = window;
    runtime.__konusuYorumModules = {
        dailyWord: dailyWordModule,
        dailyActivity: dailyActivityModule,
        speech: speechModule,
        matching: matchingModule,
        mirror: mirrorModule,
        sentence: sentenceModule,
        peekaboo: peekabooModule,
        sleep: sleepModule,
        family: familyModule,
        stories: storiesModule
    };
    wireTabs(mascot);
    const requestedView = new URLSearchParams(window.location.search).get('view');
    const allowedViews = new Set(['home', 'speech', 'matching', 'sentence', 'peekaboo', 'stories', 'mirror', 'sleep']);
    if (requestedView && allowedViews.has(requestedView)) {
        document.dispatchEvent(new CustomEvent('activate-primary-view', { detail: requestedView }));
    }
    else {
        document.dispatchEvent(new CustomEvent('activate-primary-view', { detail: 'home' }));
    }
    installTestingHooks();
    registerServiceWorker();
}
bootstrap();
//# sourceMappingURL=main.js.map