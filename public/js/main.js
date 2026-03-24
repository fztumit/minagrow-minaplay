import { DailyActivityModule } from './dailyactivity/index.js';
import { DailyWordModule } from './dailyword/index.js';
import { VOCABULARY } from './data/vocabulary.js';
import { FamilyAvatarModule } from './family/index.js';
import { MascotGuide } from './mascot/index.js';
import { SleepModeModule } from './sleep/index.js';
import { SpeechGameModule } from './speech/index.js';
import { StoriesModule } from './stories/index.js';
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
    const views = Array.from(document.querySelectorAll('.module-view'));
    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedView = button.dataset.view;
            if (!selectedView) {
                return;
            }
            tabButtons.forEach((candidate) => {
                const active = candidate === button;
                candidate.classList.toggle('active', active);
                candidate.setAttribute('aria-selected', String(active));
            });
            views.forEach((view) => {
                view.classList.toggle('active', view.id === `view-${selectedView}`);
            });
            mascot.setSleepMode(selectedView === 'sleep');
            if (selectedView === 'speech') {
                mascot.sayHint();
            }
            else if (selectedView === 'stories') {
                mascot.setMessage('Hikaye zamanı.');
            }
            else if (selectedView === 'sleep') {
                mascot.setMessage('Uyku zamanı.');
            }
            else {
                mascot.setMessage('Aile ekleyelim.');
            }
        });
    });
}
function installTestingHooks() {
    const runtime = window;
    runtime.render_game_to_text = () => {
        const activeViewId = document.querySelector('.module-view.active')?.id ?? null;
        const speechRoot = document.getElementById('view-speech');
        const sleepRoot = document.getElementById('view-sleep');
        const familyRoot = document.getElementById('view-family');
        const storiesRoot = document.getElementById('view-stories');
        const dailyWordRoot = document.getElementById('daily-word-card');
        const dailyActivityRoot = document.getElementById('daily-activity-card');
        const dailyWordText = document.getElementById('daily-word-text')?.textContent ?? null;
        const mascotMessage = document.getElementById('mascot-message')?.textContent ?? null;
        return JSON.stringify({
            layout: 'DOM based module layout, no physics coordinates',
            active_view: activeViewId,
            mascot_message: mascotMessage,
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
                last_word: speechRoot?.getAttribute('data-last-word') ?? null,
                water_spilled: speechRoot?.getAttribute('data-water-spilled') === 'true',
                water_expanded: speechRoot?.getAttribute('data-water-expanded') === 'true',
                repeat_mode: speechRoot?.getAttribute('data-repeat-mode') ?? 'default',
                custom_audio_count: Number(speechRoot?.getAttribute('data-custom-audio-count') ?? 0),
                word_recording_coverage: speechRoot?.getAttribute('data-word-recording-coverage') ?? '0/0',
                total_word_listens: Number(speechRoot?.getAttribute('data-total-word-listens') ?? 0),
                top_sentence: speechRoot?.getAttribute('data-top-sentence') ?? '',
                top_sentence_count: Number(speechRoot?.getAttribute('data-top-sentence-count') ?? 0)
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
    const dailyWordCard = document.getElementById('daily-word-card');
    const dailyActivityCard = document.getElementById('daily-activity-card');
    const speechRoot = document.getElementById('view-speech');
    const storiesRoot = document.getElementById('view-stories');
    const sleepRoot = document.getElementById('view-sleep');
    const familyRoot = document.getElementById('view-family');
    const dailyWordOutput = document.getElementById('daily-word-text');
    const mascotImage = document.getElementById('phoenix-main');
    const mascotShell = document.getElementById('mascot-shell');
    if (!mascotOutput ||
        !dailyWordCard ||
        !dailyActivityCard ||
        !speechRoot ||
        !storiesRoot ||
        !sleepRoot ||
        !familyRoot ||
        !dailyWordOutput ||
        !mascotImage ||
        !mascotShell) {
        throw new Error('Required app roots not found.');
    }
    const mascot = new MascotGuide(mascotOutput, mascotImage, mascotShell);
    const dailyWordModule = new DailyWordModule(dailyWordCard, dailyWordOutput, VOCABULARY);
    dailyWordModule.init();
    const dailyActivityModule = new DailyActivityModule(dailyActivityCard);
    dailyActivityModule.init();
    const speechModule = new SpeechGameModule(speechRoot, mascot);
    speechModule.init();
    const sleepModule = new SleepModeModule(sleepRoot, mascot);
    sleepModule.init();
    const familyModule = new FamilyAvatarModule(familyRoot, mascot);
    familyModule.init();
    const storiesModule = new StoriesModule(storiesRoot, mascot);
    storiesModule.init();
    speechRoot.addEventListener('speech-trigger', (event) => {
        const detail = event.detail;
        if (detail?.word) {
            dailyActivityModule.trackWord(detail.word);
        }
        dailyActivityModule.trackInteraction();
    });
    storiesRoot.addEventListener('story-activity', (event) => {
        const detail = event.detail;
        if (detail?.sentence) {
            dailyActivityModule.trackStory(detail.sentence);
        }
        dailyActivityModule.trackInteraction();
    });
    const runtime = window;
    runtime.__konusuYorumModules = {
        dailyWord: dailyWordModule,
        dailyActivity: dailyActivityModule,
        speech: speechModule,
        sleep: sleepModule,
        family: familyModule,
        stories: storiesModule
    };
    wireTabs(mascot);
    installTestingHooks();
    registerServiceWorker();
}
bootstrap();
//# sourceMappingURL=main.js.map