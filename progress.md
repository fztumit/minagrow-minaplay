Original prompt: Konuşu-yorum gibi özel bir isim bulalım.

Küçük bir oyun yazalım. 
Bu oyunda herkes kendine özel karakterler oluştursun.
Bu oyunun amacı: Konuşmayı öğrenmek.
Tabet ve telefon içindir.
Dokunduğu nesne kelimesini tekrarlar.

Baba karakteri ile baba
Anne karakteri ile anne
1 bardak dökülen su ile su kelimesi tekrar tekrar edilir.
Dikkat dağıtmayacak bir arka fonda bekirgib göz alıcı, dikkat çekici karakter ve nesneler çocukla iletişim kurar.

## Progress Notes
- Skill selected: develop-web-game.
- Initial repo scan completed; current project is Express TypeScript backend.
- Plan: add mobile/tablet-friendly HTML5 canvas speech-learning game under `public/`, serve from Express, and validate with Playwright client.
- TODO: implement profile-based custom characters, touch interactions (`baba`, `anne`, `su` repetition), and deterministic hooks (`render_game_to_text`, `advanceTime`).
- Implemented mobile/tablet-ready `public/index.html` with a single canvas scene, profile creation, touch interactions for `baba`, `anne`, and repeated `su` on spilled water.
- Added speech synthesis loop and on-canvas communication visuals (speech bubble + animated characters/objects).
- Added deterministic hooks: `window.render_game_to_text` and `window.advanceTime(ms)`.
- Updated Express app to serve static files from `public`.
- Verified backend integrity: `npm run build` and `npm test` both pass.
- TODO: run Playwright client loop, inspect screenshots/state, and fix any visual/interaction issues.
- Added default profile name value (`Minik`) to support automated Playwright setup without keyboard text input.
- Installed Playwright in both project (`devDependencies`) and skill client directory; installed Chromium browser binaries.
- Started local server and ran official skill client with multi-step action choreography.
- Verified screenshots visually for all target interactions:
  - `output/web-game-baba/shot-0.png` shows `baba` bubble and matching character.
  - `output/web-game-anne/shot-0.png` shows `anne` bubble and matching character.
  - `output/web-game-su/shot-0.png` shows tipped glass + spilled water and `su` bubble.
- Verified state outputs from `render_game_to_text`:
  - Baba scenario => `last_word: baba`, `water_spilled: false`.
  - Anne scenario => `last_word: anne`, `water_spilled: false`.
  - Su scenario => `last_word: su`, `water_spilled: true`.
- No `errors-*.json` files were produced during Playwright runs (no new console/page errors captured).

## Remaining TODOs / Suggestions
- If desired, add more learning objects (top, kitap, kedi) with selectable lesson packs.
- Add parent settings for per-word repeat count and speech rate.

## New Request: Modular PWA Build
- Reworked project into a modular PWA named `Konuşu-Yorum` with a child-friendly UI and independent feature modules.
- Added PWA surface files:
  - `public/index.html`
  - `public/style.css`
  - `public/manifest.webmanifest`
  - `public/sw.js`
  - `public/assets/phoenix.svg`, `icon-192.svg`, `icon-512.svg`
- Added modular frontend TypeScript architecture:
  - `src/modules/speech/index.ts`
  - `src/modules/sleep/index.ts`
  - `src/modules/family/index.ts`
  - `src/modules/dailyword/index.ts`
  - `src/modules/mascot/index.ts`
  - `src/modules/data/vocabulary.ts`
  - `src/modules/main.ts`
- Added root `server.ts` entry and separate client build config `tsconfig.client.json`.
- Updated scripts for split build (`build:server`, `build:client`) and Playwright e2e (`test:e2e`).
- Adjusted lint/test pipeline to support mixed TS targets (server + browser modules + playwright specs).
- Updated env default so app can run locally without forcing `META_VERIFY_TOKEN`.

## Feature Coverage (MVP)
- Speech Game:
  - Vocabulary: `su, anne, baba, top, araba, kitap, elma, süt, ekmek`
  - Web Speech API trigger on tap
  - `su` repeats 3 times
  - glass tip + spill animation
- Sleep Mode:
  - Starry dark stage + sleeping phoenix
  - Sounds: white, rain, wind, ocean, vacuum, heartbeat, pış pış
  - Timer: 30m, 1h, 2h, all night
- Family Avatar Creator:
  - name, color, camera photo input
  - localStorage persistence
- Daily Word:
  - deterministic per-day highlighted word
- Mascot Guidance:
  - `Hadi dokun.`, `Aferin.`, `Tekrar söyle.` messages

## Verification
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` (Playwright examples) ✅
  - page load
  - object interaction
  - speech trigger
- Ran official skill client: `web_game_playwright_client.js` ✅
  - output states in `output/web-game-pwa/state-0.json` and `state-1.json`
  - no `errors-*.json` produced

## Remaining TODOs / Suggestions
- Add offline fallback page for richer no-network guidance.
- Add parent panel for per-word repeat count and speech rate presets.
- Add optional language packs (`TR/EN`) while keeping Turkish default.

## Continuation Update: Parent Settings
- Added parent controls to speech module UI:
  - Repeat mode selector (`default`, `1`, `2`, `3`)
  - Speech rate slider (`0.60` to `1.20`)
- Implemented speech settings persistence via localStorage key `konusu_yorum_speech_settings_v1`.
- Applied settings to runtime speech behavior:
  - Repeat override now affects all tapped words.
  - Speech synthesis rate now uses saved slider value.
- Extended speech state attributes for testability:
  - `data-repeat-mode`
  - `data-speech-rate`
- Extended `render_game_to_text` payload to include speech settings (`repeat_mode`, `rate`).
- Added Playwright coverage for parent settings override:
  - `tests/playwright/parent-settings.spec.ts`

## Validation (Continuation)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (4 tests)
- Official skill client run ✅ (`output/web-game-parent-settings/*`)
  - `state-0.json` and `state-1.json` include speech settings fields.
  - No `errors-*.json` produced.

## Notes
- Skill client screenshots capture the largest canvas element; in this DOM-first app that may show the sleep stars canvas rather than full page UI.

## Continuation Update: Stories Module
- Added new `Hikayeler` tab and dedicated module view in `public/index.html`.
- Added story UI flow:
  - story list selection
  - sentence display
  - controls: `Dinle`, `Tekrar Et`, `Sonraki Cümle`
- Implemented independent stories module:
  - `src/modules/stories/data.ts`
  - `src/modules/stories/index.ts`
- Integrated stories module in app bootstrap and tab router.
- Extended testing hook payload (`render_game_to_text`) with `stories` state:
  - `story_count`
  - `active_story_id`
  - `sentence_index`
  - `last_spoken_sentence`
- Added Playwright e2e test for stories flow:
  - `tests/playwright/stories.spec.ts`

## Validation (Stories)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (5 tests)
- Official skill client run ✅ (`output/web-game-stories/*`)
  - state confirms `active_view: view-stories`
  - stories payload present and valid
  - no `errors-*.json`

## Notes
- Skill client screenshots still capture the sleep canvas because it is the largest canvas element; state JSON is the reliable assertion source for module checks.

## Continuation Update: Stories Easy Level
- Added `Kolay (2 kelime)` level selector to stories UI.
- Added easy-level starter sentence stories with frequent early phrases:
  - `Su iç`
  - `Top at`
  - `Anne gel`
  - `Abla al`
  - plus additional two-word starters (`Süt iç`, `Kitap aç`, `Ekmek al`, `Baba gel`).
- Refactored stories data model to level-based catalog (`easy` + `standard`).
- Updated Stories module runtime to switch levels dynamically and sync state attributes:
  - `data-story-level`
  - `data-story-count`
  - `data-active-story-id`
  - `data-sentence-index`
  - `data-last-spoken-sentence`
- Extended `render_game_to_text` stories payload with `level`.
- Updated stories e2e test to verify easy-level two-word sentence behavior.

## Validation (Easy Level)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (5 tests)
- Official skill client run ✅ (`output/web-game-stories-easy/*`)
  - state confirms `stories.level: easy`
  - state confirms `story_count: 2`
  - no `errors-*.json`

## Notes
- Skill client screenshots still show the largest canvas element (sleep stars). JSON state remains the primary verification for module-level interactions.

## Continuation Update: Easy Sentence Add/Delete (Parent Editor)
- Added `Kolay Cümle Ekle/Sil` panel under Stories module.
- Implemented localStorage-backed easy sentence editor:
  - add custom two-word sentences
  - delete custom sentences
  - duplicate prevention
  - strict two-word validation for easy level
- Added dynamic custom story injection for easy level:
  - `Özel Cümleler` story appears when custom entries exist
  - removed automatically when custom list becomes empty
- Added stories module state attribute:
  - `data-custom-easy-sentence-count`
- Extended `render_game_to_text` stories payload with:
  - `custom_easy_sentence_count`
- Added Playwright e2e test:
  - `tests/playwright/easy-sentence-editor.spec.ts`

## Validation (Easy Editor)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (6 tests)
- Official skill client run ✅ (`output/web-game-stories-editor/*`)
  - state confirms `custom_easy_sentence_count` field
  - no `errors-*.json`

## Notes
- Skill client screenshots still reflect the largest canvas element; JSON state remains the reliable module behavior source.

## Continuation Update: Modular Home + Sentence Builder
- Added a new child-first modular home screen as the default entry view:
  - `Kelime Öğren`
  - `Cümle Kur`
  - `Ceee Oyunu`
  - `Uyku Modu`
- Added a new independent `SentenceBuilderModule`:
  - two-step visual selection flow (`actor` + `object`)
  - simple sentence preview and playback
  - parent-recorded sentence playback when available, TTS fallback otherwise
- Updated tab routing:
  - default view is now `home`
  - visible child nav now includes `speech`, `sentence`, `peekaboo`, `sleep`
  - `stories` remains independently addressable and testable via direct activation
- Added hidden long-press parent access to:
  - home
  - sentence
  - sleep
- Updated sleep mode options to child-friendly defaults:
  - `ocean`
  - `rain`
  - `wind`
  - `lullaby`

## Validation (Modular Home)
- `npm run build` ✅
- `npm test` ✅
- `npm run lint` ✅
- `npx playwright test --workers=1` ✅
  - 27/27 passed
- Official skill client run completed for:
  - `output/web-game-home/state-0.json`
  - `output/web-game-sentence/state-0.json`
- Skill client state confirmed:
  - home active with `mode_count: 4`
  - sentence mode active with independent `sentence` state payload

## Notes
- Skill client screenshots still captured the largest canvas-like surface (sleep stars) instead of the full DOM layout. State JSON remained correct and was used as the reliable verification source for home/sentence flows.
- Fixed a Playwright regression caused by `page.addInitScript()` re-running on `goto('/?view=stories')`. Added non-navigation helper `openStoriesMode()` for same-session state-preserving transitions.

## Continuation Update: Pronunciation Fix
- Adjusted Stories speech synthesis text preprocessing for clearer Turkish articulation.
- Two-word sentences are now spoken with an inserted pause punctuation (e.g. `Dede, gel.`) before TTS.
- Slowed easy-level story speech rate from `0.83` to `0.74` for better clarity.
- Verified build/lint/unit/e2e and official skill client run after change.

## Continuation Update: Child-First Parent PIN Gate
- Kept the previous full controls screen as the dedicated `Ebeveyn Paneli`.
- Added password gate before opening the parent screen:
  - default PIN: `1234`
  - stored in localStorage key `minaplay_parent_pin_v1`
  - accepts only 4 digits
- Added parent auth overlay UI:
  - PIN input
  - error feedback on wrong entry
  - cancel / close behavior
- Added parent security section inside the parent panel:
  - change PIN
  - confirm PIN
  - reset back to default by saving `1234`
- Updated tab / parent routing:
  - hidden parent access now opens the PIN gate first
  - correct PIN unlocks the parent panel
  - wrong PIN keeps the child screen active
- Updated Playwright coverage:

## Continuation Update: Full-Screen Child Game Scene
- Reworked `view-speech` into a true child-first full-screen play scene:
  - no visible instructions
  - no visible forms or settings
  - only scene objects + bottom navigation
- Scene now uses 5 large guided objects:
  - `su`
  - `baba`
  - `top`
  - `elma`
  - `araba`
- Added new illustrated father object asset:
  - `public/assets/object-father.svg`
- Added stronger room/play-area styling:
  - curtain
  - sofa
  - framed wall art
  - larger rug / mobile-first object spacing
- Updated guided flow:
  - Anka says `Hadi oynayalım.`
  - default peekaboo runs with wing-hide
  - Anka reveals with `Ceee!`
  - target object becomes the only enabled object
  - tap plays object animation + soft sound
  - parent audio still plays when available, otherwise TTS fallback
  - after playback Anka celebrates and advances to the next object
- Added optional environment peek mode support in runtime:
  - mascot can hide behind sofa / basket positions
  - default remains wing-hide
- Added hidden top-corner long-press access for parent/admin panel while keeping the existing hidden trigger for tests.
- Extended speech state output for testing:
  - `current_target`
  - `scene_phase`
  - `peek_mode`

## Validation (Full-Screen Child Game Scene)
- `npm run build` ✅
- `npm test` ✅
- `npm run lint` ✅
- `npx playwright test --workers=1` ✅
  - `21 passed`
- Official skill client run ✅
  - `output/web-game-fullscreen-scene/state-0.json`
  - `output/web-game-fullscreen-scene/state-1.json`
  - no `errors-*.json`

## Notes
- The official skill client still captures the largest canvas element, so its screenshot shows the sleep stars canvas instead of the full DOM game scene.
- The reliable verification for the child scene in that client run is the state JSON:
  - `active_view: view-speech`
  - `current_target: su`
  - `scene_phase: awaiting-tap`
  - `peek_mode: wing`

## Continuation Update: Peekaboo Mode
- Added a new separate child game module: `Peekaboo Mode`
  - new tab: `Cee`
  - no learning text, no settings, no forms on the child scene
  - fully separate from the word-learning game
- Added dedicated DOM scene in `public/index.html`:
  - room background
  - curtain hideout
  - sofa hideout
  - table hideout
  - floating phoenix shell
  - hidden top-corner parent access
- Added dedicated module implementation:
  - `src/modules/peekaboo/index.ts`
  - self hide mode
  - environment hide mode
  - auto reveal after short delay
  - reveal by child tap on hideout
  - `Ceee!` voice + sparkle/giggle style sound effects
  - tap reaction sound and loop restart
- Integrated into app bootstrap and testing hooks:
  - new `peekaboo` state payload in `render_game_to_text`
  - tab lifecycle pause/resume handling
  - parent PIN flow also works from peekaboo view
- Updated PWA cache version:
  - `minaplay-v24`

## Validation (Peekaboo Mode)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test --workers=1` ✅
  - `23 passed`
- Official skill client run ✅
  - command opened `peekaboo` tab before capture
  - state confirms:
    - `active_view: view-peekaboo`
    - `peekaboo.state: revealed`
    - `peekaboo.hide_mode: self`
    - `peekaboo.reveals: 1`
  - no `errors-*.json`

## Notes
- The official skill client screenshot still shows the largest canvas (`sleep-stars`) instead of the DOM-based peekaboo scene.
- For the peekaboo module, JSON state is the reliable verification source.
  - shared parent unlock helper
  - regression updates for all parent-panel tests
  - explicit wrong-PIN test added
- Bumped service worker cache version to `minaplay-v19`.

## Validation (Parent PIN Gate)
- `npm run build` ✅
- `npx playwright test --workers=1` ✅
  - `17 passed`
- Official skill client run ✅
  - output: `output/web-game-parent-pin/*`
  - state JSON confirms child-first screen loads cleanly
  - note: skill client screenshot still captures the sleep stars canvas because it is the largest canvas on the page, so state JSON remains the reliable assertion source for this DOM-first UI

## Remaining TODOs / Suggestions
- Add a softer parent-entry microinteraction (e.g. numeric keypad style) if we want the PIN gate to feel more productized on tablet.
- Optionally add a second hidden parent entry route from `Stories` / `Sleep` to avoid requiring a return to the main play scene.

## Continuation Update: Phoenix Attention Behaviors
- Upgraded Anka from a static guide to an intermittent attention-restoring companion on the child play screen.
- Added idle attention loop for the current target object:
  - waits briefly when the child is inactive
  - plays a soft chirp
  - speaks a short location-aware line (e.g. `Ben suyun yanında bekliyorum.`)
  - boosts the target card again with a stronger pop / glow
- Added richer visual behavior to the floating mascot:
  - spin / tumble style attention burst
  - larger glowing wing flaps
  - brighter aura pulse
  - soft sparkles around the mascot
- Added pause/resume handling for guidance:
  - attention loop pauses when speech view is hidden or parent auth/panel opens
  - resumes when returning to the child play scene
- Extended speech test state with `guide_mode`.
- Added Playwright coverage:
  - `tests/playwright/mascot-attention.spec.ts`

## Validation (Phoenix Attention Behaviors)
- `npm run build` ✅
- `npx playwright test --workers=1` ✅
  - `18 passed`
- Official skill client run ✅
  - output: `output/web-game-anka-attention/*`
  - state JSON confirms idle reminder enters `guide_mode: attention`
  - state JSON confirms prompt text: `Ben suyun yanında bekliyorum.`
  - note: skill client screenshot still captures the sleep stars canvas because it is the largest canvas element on the page, so JSON state remains the reliable assertion source for this DOM-first UI

## Remaining TODOs / Suggestions
- If we want even more character, add per-object idle prompts so Anka’s reminder text varies by target and does not feel repetitive.
- If we want a stronger “hero” moment, add a one-time entrance animation when the speech scene first opens, then keep the current lighter idle loop afterward.

## Continuation Update: Story Pack Voice Recording Flow
- Reworked the parent-side story audio panel so pack recordings are directly usable.
- Added selectable sentence list inside the story audio panel:
  - grouped by story inside the selected pack
  - each sentence shows whether a recording already exists
  - parent can choose the exact sentence target without leaving the parent panel
- Story audio record / play / delete actions now operate on the selected pack sentence, not only the currently visible child reader sentence.
- Renamed the panel to emphasize the main feature:
  - `Ebeveyn / Kardeş Ses Kaydı`
- Added guidance copy to make the flow explicit:
  - choose a sentence from the pack
  - then record the family voice
- Added Playwright coverage:
  - parent can select a sentence directly from the pack audio panel
  - panel reflects active selection and existing recording state
- Bumped service worker cache version to `minaplay-v21`.

## Validation (Story Pack Voice Recording Flow)
- `npm run build` ✅
- `npx playwright test --workers=1` ✅
  - `19 passed`
- Official skill client run ✅
  - output: `output/web-game-story-audio-panel/*`
  - note: this app remains DOM-first, so skill client state JSON is more useful than the canvas screenshot for verifying feature changes

## Remaining TODOs / Suggestions
- Add optional per-sentence quick actions in the pack list itself (`Kaydet`, `Cal`, `Sil`) if we want an even faster workflow.
- Consider a dedicated “Aile Sesleri” summary card that shows word vs story-sentence coverage separately.

## Continuation Update: Inline Word Editing + Image Upload
- Reworked the parent-side word management flow so each word row is directly editable.
- Every word row in `İlerleme Takibi` now supports:
  - inline word rename
  - image upload
  - image removal
  - direct `Kaydet / Cal / Sil` voice controls
- Updated the quick custom-audio panel so the word input and record controls sit together in one inline layout.
- Added persistent word profile storage:
  - custom word label
  - custom image
- Child scene now reflects parent edits:
  - renamed words update the interactive object label
  - uploaded images replace the default object visual where applicable
- Added migration behavior on rename:
  - existing word recording moves to the new label
  - existing word listen progress also moves to the new label
- Daily word display also reads the updated word profile.
- Bumped service worker cache version to `minaplay-v22`.

## Validation (Inline Word Editing + Image Upload)
- `npm run build` ✅
- `npx playwright test --workers=1` ✅
  - `21 passed`
- Official skill client run ✅
  - output: `output/web-game-word-editor/*`
  - note: this app is still DOM-first, so state JSON remains more informative than the canvas screenshot for these parent-panel flows

## Remaining TODOs / Suggestions
- Add drag-and-drop image support for tablet/desktop parent editing.
- Consider a small crop/fit option so uploaded visuals stay more consistent across the play scene.

## Continuation Update: Pronunciation Fix (Turkish Voice + Word Queue)
- Reworked story sentence TTS pipeline for two-word easy sentences to reduce misreads like `gel -> ger` and `iç -> iş`.
- Added Turkish voice selection in `StoriesModule`:
  - detect available voices from `speechSynthesis.getVoices()`
  - keep a preferred Turkish voice (`tr*` lang) with name-priority scoring.
- Replaced comma-joined speech text with word-level utterance queue:
  - two-word sentence now enqueues two utterances (`Word1.` then `Word2.`), creating a cleaner pause and articulation boundary.
- Added Turkish-aware capitalization helper before speech (`toLocaleUpperCase('tr-TR')` / `toLocaleLowerCase('tr-TR')`).
- Tuned story speech rates:
  - easy: `0.70`
  - standard: `0.82`

## Validation (Pronunciation Fix v2)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (6 tests)
- Official skill client run ✅ (`output/web-game-stories-pronunciation-v2/*`)
  - state confirms `active_view: view-stories`
  - no `errors-*.json`

## Notes
- Skill client screenshot still captures the largest canvas (sleep stars). For stories correctness, `state-0.json` is the reliable assertion artifact.

## Continuation Update: Cache Bust for PWA TTS Fix
- Increased service worker cache name in `public/sw.js` from `konusu-yorum-v1` to `konusu-yorum-v2`.
- This forces clients to drop old cached JS and load updated pronunciation logic.

## Validation (After Cache Bust)
- `npm run build` ✅
- `npm run test:e2e` ✅ (6 tests)

## Continuation Update: Turkish Voice Profile (Global TTS)
- Added shared voice utility module:
  - `src/modules/speech/voice.ts`
  - provides Turkish-focused voice scoring, picker sorting, and persisted voice preference helpers.
- Added parent voice selector UI in speech settings:
  - `public/index.html`: `#speech-voice-select`, `#speech-voice-hint`
  - `public/style.css`: `.voice-hint`
- Updated `SpeechGameModule`:
  - loads/stores selected voice preference in localStorage
  - lists available voices with Turkish voices prioritized
  - shows warning when Turkish voice is unavailable
  - applies selected voice to all spoken words
  - exposes voice metadata via DOM attrs:
    - `data-speech-voice-uri`
    - `data-speech-active-voice`
    - `data-has-turkish-voice`
- Updated `StoriesModule`:
  - now resolves and uses the same stored voice preference during story TTS.
- Updated `SleepModeModule` (`pış pış`) to use the same stored voice preference.
- Extended testing hook payload (`render_game_to_text`) with speech voice fields:
  - `voice_uri`, `active_voice`, `has_turkish_voice`
- Bumped service worker cache name:
  - `public/sw.js`: `konusu-yorum-v3` to force fresh JS after voice-system changes.
- Updated Playwright coverage:
  - `tests/playwright/page-load.spec.ts` now also checks `#speech-voice-select`.

## Validation (Turkish Voice Profile)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (6 tests)
- Official skill client run ✅ (`output/web-game-voice-selector/*`)
  - state includes `speech.active_voice` and `speech.has_turkish_voice`
  - no `errors-*.json`

## Continuation Update: Parent Recorded Audio Fallback
- Added custom recorded-audio storage helper:
  - `src/modules/speech/customAudio.ts`
  - supports normalize/load/save/get operations via localStorage.
- Added parent UI for recording fallback audio:
  - `public/index.html` under speech parent settings:
    - `#custom-audio-text`
    - `#custom-audio-record-start`
    - `#custom-audio-record-stop`
    - `#custom-audio-play`
    - `#custom-audio-delete`
    - `#custom-audio-status`
  - styles in `public/style.css` (`.custom-audio-*`).
- Updated `SpeechGameModule`:
  - can record microphone audio for a typed key (word or phrase).
  - stores recordings in localStorage (data URL).
  - plays custom recording instead of TTS when key exists.
  - exposes custom recording count in DOM state (`data-custom-audio-count`).
- Updated `StoriesModule`:
  - checks for full-sentence custom recording first.
  - if not found, checks per-word recordings and plays those (or falls back to TTS).
- Updated `SleepModeModule` already aligned to stored voice preference; no breaking change.
- Extended testing hook payload:
  - `speech.custom_audio_count`.

## Validation (Recorded Audio Fallback)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (6 tests)
- Official skill client run ✅ (`output/web-game-custom-audio-fallback/*`)
  - state includes `speech.custom_audio_count`
  - no `errors-*.json`
- Service worker cache bumped to `konusu-yorum-v4` for immediate client refresh of new audio fallback logic.

## Continuation Update: Removed All Non-Recorded Voiceover
- User requested removal of all other voiceovers after successful recorded-audio flow.
- Speech module was simplified to recorded-audio-only playback:
  - removed Web Speech/TTS usage entirely.
  - removed voice-profile and speech-rate settings.
  - repeat logic now replays recorded word audio only.
  - if no recording exists, app shows guidance text instead of speaking via TTS.
- Stories module now uses only recorded audio:
  - full-sentence recording first, then per-word recordings.
  - no TTS fallback remains.
- Sleep `pış pış` mode no longer uses speech synthesis:
  - replaced with non-voice calming audio layers (wind + soft pink noise).
- Deleted obsolete voice helper module:
  - `src/modules/speech/voice.ts`.
- Updated `render_game_to_text` speech payload:
  - removed `rate/voice_uri/active_voice/has_turkish_voice`
  - kept `repeat_mode` and `custom_audio_count`.
- Updated page-load e2e assertion:
  - now checks custom recording button visibility instead of voice selector.
- Service worker cache bumped again to `konusu-yorum-v5` to force immediate client refresh after TTS removal.

## Validation (Recorded-Only Voice)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (6 tests)
- Official skill client run ✅ (`output/web-game-recorded-only/*`)
  - state confirms reduced speech payload and no errors.
- Follow-up verification run ✅ (`output/web-game-recorded-only-v2/*`) after final UI cleanup.

## Continuation Update: Story-Level Recording Panel
- Added dedicated recording controls directly in Stories view:
  - `public/index.html`:
    - `#story-audio-record-start`
    - `#story-audio-record-stop`
    - `#story-audio-play`
    - `#story-audio-delete`
    - `#story-audio-target`
    - `#story-audio-status`
- Added Stories panel styles in `public/style.css` (`.story-audio-*`).
- Extended `StoriesModule` to support selected-sentence recording:
  - records microphone input for current sentence key.
  - saves/removes recordings via shared custom audio storage.
  - updates panel state as sentence/story changes.
  - listening flow now consumes updated in-memory map immediately.
- Extended stories state attributes:
  - `data-story-audio-record-count`
  - `data-current-story-audio`
- Extended `render_game_to_text` stories payload:
  - `audio_record_count`
  - `current_sentence_has_audio`
- Updated Playwright stories test to assert story recording controls are visible and `current_sentence_has_audio` default state.
- Service worker cache bumped to `konusu-yorum-v6` for immediate UI refresh.

## Validation (Story Recorder)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (6 tests)
- Official skill client run ✅ (`output/web-game-stories-recorder/*`)
  - state includes `stories.audio_record_count` and `stories.current_sentence_has_audio`
  - no `errors-*.json`

## Continuation Update: Story Packs + Recording Library + Backup + Progress Tracking
- Completed the full "Hepsini ekleyelim" scope with modular updates across speech + stories modules.

### Added / Completed
- Speech module:
  - Recording library list with play/re-record/delete actions.
  - JSON backup export/import for custom recordings.
  - Progress panel for word recording coverage and listen counts.
  - Speech root state attributes for testing hooks:
    - `data-word-recording-coverage`
    - `data-total-word-listens`
    - `data-top-sentence`
    - `data-top-sentence-count`
- Stories module:
  - Story pack selection (`core`, `animals`, `daily`) with independent catalogs.
  - Story listen flow now updates sentence/word listen progress when recorded audio is played.
  - Stories testing state includes selected pack (`stories.pack`).
- Data / helpers:
  - Extended custom audio helper with entry listing, backup build/parse, and map merge support.
  - Added listen-progress storage helper module (`src/modules/progress/listening.ts`).

### New Playwright Coverage
- Added `tests/playwright/modular-features.spec.ts`:
  - story pack switching (`stories.pack` + content assertion)
  - recording backup import updates library + state (`speech.custom_audio_count`)
  - progress counters increase after recorded word playback (`speech.total_word_listens`)

### Fixes During Validation
- Fixed TS typing in `listCustomAudioEntries` (`kind` literal narrowing to `"word" | "sentence"`).
- Removed unused constant in progress helper to satisfy lint.

### Validation (All Features)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npm run test:e2e` ✅ (9 tests)
- Official skill client run ✅
  - `output/web-game-all-features/*`
  - `output/web-game-all-features-speech/*`
  - state output includes new speech progress fields and stories pack field
  - no `errors-*.json` artifacts produced

### Cache Bust
- Service worker cache bumped to `konusu-yorum-v7` to ensure clients load latest JS/HTML changes.

## Remaining TODOs / Suggestions
- Optional next step: add a parent-facing “progress reset” button (word/sentence counters reset only, recordings kept).
- Optional next step: add per-pack progress summaries in stories (e.g. most-listened sentence by pack).

## Continuation Update: Parent Progress Reset (Counters Only)
- Added parent-facing progress reset controls under Speech -> Progress panel:
  - `public/index.html`:
    - `#progress-reset-btn`
    - `#progress-reset-status`
  - `public/style.css`:
    - `.progress-actions`
    - `.progress-reset-status`
- Implemented progress reset logic in listening helper:
  - `src/modules/progress/listening.ts`
  - new export: `resetListenProgress()`
- Integrated reset behavior in `SpeechGameModule`:
  - wired button click to reset only listen counters.
  - recordings are preserved (`custom_audio_count` and coverage unchanged).
  - reset button auto-disables when there is no listen progress to clear.
  - status/feedback and mascot message updated on reset.
- Updated PWA cache version:
  - `public/sw.js`: `konusu-yorum-v8`

## New Playwright Coverage
- Extended `tests/playwright/modular-features.spec.ts`:
  - `progress reset clears listen counters and keeps recordings`
  - verifies:
    - listen counters reset to zero
    - recording count and coverage remain intact
    - localStorage progress payload is cleared
- Updated `tests/playwright/page-load.spec.ts`:
  - asserts `#progress-reset-btn` visibility

## Validation (Progress Reset)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test --config=playwright.local.config.ts` equivalent isolated run on port `3100` ✅ (10 tests)
  - note: default `npm run test:e2e` was initially blocked by an unrelated existing server on `3000`; isolated port run was used for deterministic validation.
- Official skill client run ✅
  - `output/web-game-progress-reset/*`
  - `state-0.json` includes speech progress fields with no errors
  - no `errors-*.json` artifact produced

## Remaining TODOs / Suggestions
- Optional next step: add per-pack progress summaries in stories (e.g. most-listened sentence by pack).

## Continuation Update: Per-Pack Progress Summaries (Stories)
- Implemented parent-facing per-pack progress UI in Stories view:
  - `public/index.html`:
    - `#story-pack-progress-summary`
    - `#story-pack-progress-list`
  - `public/style.css`:
    - `.story-pack-progress*` panel styles and rows
- Extended listening progress model for pack-aware sentence tracking:
  - `src/modules/progress/listening.ts`
  - added `packSentenceListens` map in storage schema
  - new helpers:
    - `incrementPackSentenceListen(pack, sentence)`
    - `getPackSentenceProgress(pack, sentences)`
  - `resetListenProgress()` now also clears pack-level counters.
- Updated Stories playback flow:
  - `src/modules/stories/index.ts`
  - when a sentence is played from recording (full sentence or chunked word path), pack-aware listen counters now increment.
  - added runtime pack snapshot calculation:
    - total pack listens
    - top listened sentence + count
    - listened sentence count
    - recording coverage over current pack sentence catalog
  - state attrs now include:
    - `data-pack-recording-coverage`
    - `data-pack-total-listens`
    - `data-pack-top-sentence`
    - `data-pack-top-sentence-count`
    - `data-pack-listened-sentence-count`
    - `data-pack-total-sentence-count`
- Extended testing hook payload (`render_game_to_text`) with new stories pack-progress fields:
  - `pack_recording_coverage`
  - `pack_total_listens`
  - `pack_top_sentence`
  - `pack_top_sentence_count`
  - `pack_listened_sentence_count`
  - `pack_total_sentence_count`
- Updated PWA cache:
  - `public/sw.js`: `konusu-yorum-v9`

## New Playwright Coverage
- Extended `tests/playwright/modular-features.spec.ts`:
  - `stories pack progress summary reflects selected pack metrics`
  - validates selected-pack listen total, top sentence, and recording coverage.
- Updated `tests/playwright/page-load.spec.ts`:
  - now verifies stories progress summary block is visible after switching tabs.

## Validation (Per-Pack Progress)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test --config=playwright.local.config.ts` isolated run on port `3200` ✅ (11 tests)
- Official skill client run ✅
  - `output/web-game-pack-progress/*`
  - `state-0.json` includes new stories pack-progress fields
  - no `errors-*.json` artifact produced

## Remaining TODOs / Suggestions
- Optional next step: add cross-pack comparison cards (e.g. which pack has highest listen momentum this week).

## Continuation Update: Cross-Pack Comparison Cards + Weekly Momentum
- Added cross-pack comparison UI in Stories:
  - `public/index.html`:
    - `#story-pack-compare-summary`
    - `#story-pack-compare-list`
  - `public/style.css`:
    - `.story-pack-compare*` styles for cards/rows/summary
- Extended progress storage model with daily pack listens:
  - `src/modules/progress/listening.ts`
  - new field: `packDailyListens`
  - `incrementPackSentenceListen()` now increments:
    - cumulative pack sentence listens
    - per-day pack listen counter (local date key)
  - new helper: `getPackWeeklyMomentum(pack)`:
    - `currentWeekListens` (last 7 days)
    - `previousWeekListens` (days 8-14)
    - `change` (weekly momentum)
- Updated Stories runtime logic:
  - sentence playback now updates pack-level counters as before, now including daily momentum data.
  - per-pack summary panel now also shows:
    - weekly change (`+/-`)
    - current week listen count
  - new comparison panel renders all packs side-by-side:
    - total listens
    - weekly change + current week count
    - recording coverage
    - top sentence
    - leader pack summary (`Lider paket: ...`)
- Extended stories testing-state attrs and `render_game_to_text` payload:
  - selected pack:
    - `pack_weekly_current`
    - `pack_weekly_change`
  - comparison:
    - `compare_leader_pack`
    - `compare_leader_total`
- Cache bust:
  - `public/sw.js`: `konusu-yorum-v10`

## New Playwright Coverage
- Extended `tests/playwright/modular-features.spec.ts`:
  - `pack comparison cards show leader and weekly momentum`
  - existing pack-summary test now also verifies weekly change/state fields.
- Updated `tests/playwright/page-load.spec.ts`:
  - verifies comparison summary block visibility in Stories tab.

## Validation (Cross-Pack Comparison)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test --config=playwright.local.config.ts` isolated run on `3200` ✅ (12 tests)
- Official skill client run ✅
  - `output/web-game-pack-compare/*`
  - `state-0.json` includes weekly + compare fields
  - no `errors-*.json` artifact produced

## Remaining TODOs / Suggestions
- Optional next step: add date-range selector (7/14/30 gün) for momentum calculations in Stories panel.

## Continuation Update: Daily Word Kaydı + Phoenix Guidance + Daily Activity Card
- Added `Daily Word` parent recording controls and playback:
  - `public/index.html`:
    - `#daily-word-record-start`, `#daily-word-record-stop`, `#daily-word-play`, `#daily-word-delete`, `#daily-word-record-status`
    - root id: `#daily-word-card`
  - `public/style.css`:
    - `.daily-word-actions`, `.daily-word-status`
  - `src/modules/dailyword/index.ts`:
    - deterministic daily word selection preserved
    - MediaRecorder-based parent voice record/play/delete flow
    - shared map integration via `konusu_yorum_custom_audio_v1`
    - state attrs: `data-daily-word`, `data-daily-word-has-audio`
- Added `Phoenix Guidance` message set:
  - `src/modules/mascot/index.ts`:
    - praise alternates between `Aferin.` and `Harika.`
    - repeat: `Bir daha söyle.`
    - hint: `Hadi dokun.`
- Added `Daily Activity Card` with daily reset and completion tracking:
  - `public/index.html`:
    - `#daily-activity-summary`, `#daily-task-words`, `#daily-task-story`, `#daily-task-interaction`, `#daily-activity-date`
    - root id: `#daily-activity-card`
  - `public/style.css`:
    - `.daily-activity-*` card and row styles
  - `src/modules/dailyactivity/index.ts`:
    - tracks daily completion for: 3 words, 1 story, 1 interaction
    - auto-resets when date key changes
    - state attrs include completed count + per-task counters
- Wiring and events:
  - `src/modules/main.ts`:
    - initializes `DailyWordModule` and `DailyActivityModule`
    - tracks interactions from `speech-trigger` and `story-activity`
    - extends `render_game_to_text` with `daily_word_audio` and `daily_activity`
  - `src/modules/stories/index.ts`:
    - dispatches `story-activity` during sentence playback
- Tests updated:
  - `tests/playwright/page-load.spec.ts`:
    - checks daily-word record controls and daily-activity summary visibility
  - `tests/playwright/modular-features.spec.ts`:
    - daily word uses parent recording map for today
    - daily activity progression to `3/3`
    - stale-date reset to `0/3`
- Cache bump:
  - `public/sw.js`: `konusu-yorum-v11`

## Validation (Daily Word + Phoenix + Daily Activity)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test --config=/Users/umitaydin/Documents/Konusu-Yorum/playwright.local.config.ts` isolated run on `3200` ✅ (15 tests)

## Remaining TODOs / Suggestions
- Optional next step: add configurable daily activity goals (e.g. 5 words / 2 stories) in parent settings.

## Continuation Update: SU Bardak Görseli + %50 Ekran Dökülme Animasyonu
- `su` kelime kartı görseli daha gerçekçi bardak SVG ile güncellendi:
  - new asset: `public/assets/water-glass.svg`
  - `src/modules/speech/index.ts` içinde `su` kartı render yapısı:
    - `.water-glass-image`
    - `.water-glass-shimmer`
    - `.spill-stream`
    - `.spill-pool`
- Tıklama sonrası odak animasyonu eklendi:
  - `public/index.html`:
    - `#water-focus-overlay` ve iç sahne elemanları eklendi
  - `public/style.css`:
    - overlay sahnesi (`.water-focus-overlay`, `.water-focus-stage`)
    - bardak eğilmesi + su akışı + sıçrama keyframe animasyonları
    - odak sahnesi boyutu `50vw x 50vh` (ekranın yaklaşık %50 alanı)
  - `src/modules/speech/index.ts`:
    - `triggerWaterFocusVisual()` eklendi
    - root state attrs:
      - `data-water-spilled`
      - `data-water-expanded`
- Testing-state güncellemesi:
  - `src/modules/main.ts`:
    - `render_game_to_text.speech.water_expanded` eklendi
- Playwright test genişletmesi:
  - `tests/playwright/object-interaction.spec.ts`:
    - overlay `is-active` + `is-spilling` doğrulaması
    - odak sahnesi oran doğrulaması (`>= 0.45` width/height ratio)
    - `data-water-expanded` true -> false akış doğrulaması
- PWA cache bump:
  - `public/sw.js`: `konusu-yorum-v12`
  - `water-glass.svg` precache listesine eklendi

## Validation (SU Görsel/Animasyon)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test --config=/Users/umitaydin/Documents/Konusu-Yorum/playwright.local.config.ts` isolated run on `3200` ✅ (15 tests)
- Official skill client run ✅
  - `output/web-game-su-realistic/*`
  - `state-0.json` includes: `speech.last_word=su`, `speech.water_spilled=true`
  - no `errors-*.json` artifact produced
  - note: skill client screenshot still captures largest canvas (`sleep-stars`), state JSON used for interaction verification.

## Remaining TODOs / Suggestions
- Optional next step: add a short water splash sound effect synced with the spill animation.

## Continuation Update: Rebranding (MinaGrow + MinaPlay)
- Brand direction applied:
  - Main brand: `MinaGrow`
  - App name: `MinaPlay`
- Updated visible app identity:
  - `public/index.html`
    - `<title>` -> `MinaPlay`
    - hero heading -> `MinaPlay`
    - subtitle now references `MinaGrow`
    - meta description updated to `MinaPlay by MinaGrow`
- Updated PWA metadata:
  - `public/manifest.webmanifest`
    - `name`: `MinaPlay`
    - `short_name`: `MinaPlay`
    - description updated with MinaGrow reference
- Updated icon accessibility labels:
  - `public/assets/icon-192.svg`
  - `public/assets/icon-512.svg`
- Updated package identity:
  - `package.json` name -> `minagrow-minaplay`
  - `package-lock.json` root names synced
- Updated cache key for clean rollout:
  - `public/sw.js` -> `minaplay-v13`
- Test update:
  - `tests/playwright/page-load.spec.ts` heading expectation -> `MinaPlay`

## Validation (Rebranding)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test tests/playwright/page-load.spec.ts --config=/Users/umitaydin/Documents/Konusu-Yorum/playwright.local.config.ts` ✅

## Remaining TODOs / Suggestions
- Optional next step: rename GitHub repo to `minagrow-minaplay` (or `minaplay`) for naming consistency.

## Continuation Update: Railway Auto-Deploy Verification
- Created a small UI-only subtitle change to verify production auto-deploy:
  - `public/index.html`
  - hero subtitle now includes `Canlı sürüm güncellendi.`
- Pushed commit:
  - `8717807 chore: trigger railway auto deploy test`
- Verified GitHub branch wiring:
  - `origin/main` -> `fztumit/minagrow-minaplay`
- Verified live Railway deployment by fetching production HTML:
  - `https://minagrow-minaplay-production.up.railway.app/`
  - updated subtitle text is now present in live markup
- Verified health endpoint remains healthy:
  - `/health` returns `{"ok":true}`
- Removed the temporary deploy-marker text after verification so production UI stays clean.

## Continuation Update: README Reset to MinaPlay
- Replaced old CRM-focused README with MinaPlay product documentation.
- README now reflects:
  - MinaGrow / MinaPlay branding
  - active user-facing modules
  - local dev commands
  - Railway deploy model
  - note that some legacy CRM backend files still exist in the repo and remain a future cleanup target

## Remaining TODOs / Suggestions
- Remove or isolate legacy CRM webhook/Zoho code from the MinaPlay repo.
- Rename test hook `__konusuYorumModules` when we do the broader cleanup pass.

## Continuation Update: Anka Mascot Refresh
- Reworked the mascot direction around a softer, child-safe `Anka` character.
- Updated `public/assets/phoenix.svg`:
  - warmer golden / orange palette
  - rounder body
  - larger eyes
  - soft glow aura
  - internal SVG animations for:
    - idle floating
    - glow pulse
    - sparkles
    - gentle wing movement
- Added `public/assets/phoenix-sleep.svg`:
  - blue / purple sleep-mode palette
  - eyes closed
  - calmer floating and star twinkle animation
- Updated mascot mounting in `public/index.html`:
  - header mascot now uses `#mascot-shell` + `#phoenix-main`
  - sleep stage now uses dedicated `#sleep-phoenix` image and shell
- Updated mascot behavior model:
  - `src/modules/mascot/index.ts`
  - supports:
    - `normal` variant
    - temporary `active` pulse state
    - `sleep` variant
- Updated app wiring in `src/modules/main.ts`:
  - mascot now switches to sleep variant on sleep tab
  - tab-level guidance messages shortened to calmer phrases
- Updated several runtime guidance messages to stay short and non-overwhelming:
  - `src/modules/sleep/index.ts`
  - `src/modules/stories/index.ts`
  - `src/modules/speech/index.ts`
- Updated `public/style.css`:
  - mascot shell, glow, sparkle, float behavior
  - sleep mascot shell styling
- Cache bust:
  - `public/sw.js` -> `minaplay-v14`
  - added `/assets/phoenix-sleep.svg` to precache list

## Validation (Anka Refresh)
- `npm run build` ✅
- `npm run lint` ✅
- `npx playwright test tests/playwright/page-load.spec.ts` ✅

## Remaining TODOs / Suggestions
- Optional next step: create a third `active-guide` SVG variant just for praise / interaction bursts.
- Optional next step: replace the current test hook name `__konusuYorumModules` during the broader cleanup pass.

## Continuation Update: Anka Silhouette Refinement
- Refined `public/assets/phoenix.svg` to read clearly as a bird: larger head, clearer beak, separated wings, visible feet, more distinct tail ribbons, and a fluffier chest.
- Updated `public/assets/phoenix-sleep.svg` to match the new bird silhouette in the calm sleep palette.
- Goal for this pass: reduce the fish-like silhouette and move closer to the approved glowing phoenix reference while staying child-safe and app-friendly.

## Continuation Update: Simplified UI Anka
- Added `public/assets/phoenix-simple.svg` as a lighter UI/base mascot version.
- Reduced visible detail density by roughly half:
  - removed sparkles
  - softened the glow
  - simplified wing, crest, and tail shapes
  - preserved the round body and large eyes for recognizability
- Intended use: compact UI placements, icon-friendly surfaces, and future guide-state overlays.
- Tuned `public/assets/phoenix-simple.svg` further for small UI use: glow reduced roughly by half, ground shadow softened, and tail ribbons simplified one step more while preserving the same mascot silhouette.
- Refined `public/assets/phoenix-simple.svg` again: wings are broader, tail reads more like feathers than a fin, and sparkle was moved into wing/tail highlights instead of external particles for better small-size readability.
- Added `public/assets/phoenix-ui.svg` as a lighter hero-based mascot variant for continuous UI use.
- This variant keeps the same phoenix identity and broad pose while reducing glow further, removing external sparkles, and simplifying wing/tail structure for small-size clarity.
- Switched the main screen mascot to `public/assets/phoenix-ui.svg`.
- Updated the mascot shell to a cooler cream/sky background so the phoenix stays readable without blending into the same warm orange family.
- Kept the SVG itself transparent, so it still behaves like a PNG-style cutout on the main screen.
- Reworked `public/assets/phoenix-sleep.svg` to match the new lightweight mascot family, so sleep mode now visibly changes too.
- Bumped the service worker cache again so clients pull the refreshed sleep mascot asset.

## Continuation Update: Guided Word Flow
- Added a guided word transition loop in the speech module:
  - tapped object animates
  - word now repeats 2x by default (`su` stays 3x)
  - after the sequence finishes, Anka flies to the next object
  - the next object gets a soft glow + scale emphasis
  - mascot prompt says `Şimdi buna dokun.`
- Added a lightweight in-module guide mascot layer using the new UI Anka asset.
- Restored TTS fallback for word playback when a parent recording does not exist.
- Added a lightweight guide chime for the mascot prompt so `Şimdi buna dokun.` also has a gentle audio cue.
- Extended `render_game_to_text` speech payload with:
  - `next_word`
  - `guide_prompt`
  - `guide_active`
- Added Playwright coverage for the new guided transition.

## Validation (Guided Chime)
- `npm run build` ✅
- `npx playwright test tests/playwright/guided-transition.spec.ts tests/playwright/speech-trigger.spec.ts tests/playwright/parent-settings.spec.ts tests/playwright/object-interaction.spec.ts --workers=1` ✅
- Official `develop-web-game` client run against `http://127.0.0.1:3200` confirmed state:
  - `mascot_message: "Şimdi buna dokun."`
  - `speech.next_word: "anne"`
  - `speech.guide_prompt: "Şimdi buna dokun"`
  - `speech.guide_active: true`
- Note: the skill client's canvas-only screenshot captures the hidden sleep canvas in this DOM-based layout, so visual verification for this pass relies on the passing Playwright assertions plus state output rather than the raw client screenshot.

## Continuation Update: Child-First Main Screen
- Rebuilt the default speech screen as a child-first play scene:
  - removed visible parent controls from the main screen
  - replaced text/emoji cards with 6 large SVG object targets in a simple playroom layout
  - kept only bottom navigation visible by default
- Added a floating in-scene Anka flow:
  - Anka now starts on the first target
  - continues guiding to the next object after each interaction
  - long-pressing Anka opens the hidden parent panel
- Moved main-screen parent controls into a separate parent panel (`view-parent`):
  - daily word recording
  - daily activity tracking
  - speech repeat/custom audio/backup/progress controls
  - family avatar creator
- Added new scene assets:
  - `public/assets/object-ball.svg`
  - `public/assets/object-car.svg`
  - `public/assets/object-book.svg`
  - `public/assets/object-apple.svg`
  - `public/assets/object-milk.svg`
- Updated tests to reflect the new child-first layout and hidden parent access pattern.

## Validation (Child-First UI)
- `npm run build` ✅
- `npx playwright test --workers=1` ✅

## Continuation Update: Parent Panel Expansion
- Moved additional non-child settings out of the visible `Stories` and `Sleep` screens into the same hidden parent panel:
  - stories level / pack selectors
  - pack progress and comparison summaries
  - easy sentence editor
  - story sentence recording controls
  - sleep sound selector
  - sleep timer controls
- Kept child-facing surfaces visible:
  - stories list + reader + listen/repeat/next buttons
  - sleep scene + start/stop action + status
- Updated `StoriesModule` and `SleepModeModule` so their child-facing roots and parent-facing controls can live in different DOM sections.

## Validation (Expanded Parent Panel)
- `npm run build` ✅
- `npx playwright test --workers=1` ✅

## Continuation Update: Peekaboo Scene Refresh
- Reworked `Peekaboo Mode` into two alternating child-friendly scenarios:
  - `room`: Anka glides around a visible playroom, then hides and reveals
  - `center`: Anka moves to the middle platform and plays peekaboo with bigger body motion
- Strengthened the room visuals so the screen is no longer an empty white area:
  - brighter window, curtain, sofa, lamp, table, frames, rug, toys, and center glow
  - more obvious depth and warm room lighting
- Upgraded the peekaboo phoenix presentation:
  - switched to the richer `phoenix.svg` art for this mode
  - larger shell, visible aura, stronger glow, clearer wing cover animation
  - added reveal pop + celebrate jump motion
- Updated peekaboo logic:
  - intro voice: `Hadi oynayalım`
  - varied `Ceee` voice tones
  - room drift between anchor points
  - self-hide in both scenarios
  - occasional environment hide in the room scenario
  - reveal tap now counts as child reaction
- Extended `render_game_to_text` with:
  - `peekaboo.scene`
  - `peekaboo.current_anchor`
- Added a visual regression-style Playwright check:
  - `tests/playwright/peekaboo-visual.spec.ts`
  - saves inspection screenshot to `output/peekaboo-visual.png`

## Validation (Peekaboo Refresh)
- `npm run build` ✅
- `npm run lint` ✅
- `npm test` ✅
- `npx playwright test tests/playwright/peekaboo-mode.spec.ts tests/playwright/peekaboo-visual.spec.ts tests/playwright/page-load.spec.ts --workers=1` ✅
- Official `develop-web-game` client run ✅
  - state confirmed build loads, though the client screenshot itself remained unreliable for this DOM-first scene
  - visual confirmation was completed using Playwright screenshot output at `output/peekaboo-visual.png`

## Continuation Update: Peekaboo State Machine
- Replaced the ad-hoc peekaboo phase flow with an explicit mascot state machine:
  - `idle`
  - `hide`
  - `wait`
  - `reveal`
  - `react`
- The loop now always returns to `idle`, regardless of room/center scenario.
- `hide` handles the wing-cover animation or environment concealment.
- `wait` now holds the mascot for a distinct pause before the reveal.
- `reveal` is the dedicated `Ceee!` sound/wing-open phase.
- `react` is the dedicated jump + glow pulse phase.
- Added initial-view query support (`?view=peekaboo`) to make direct module testing deterministic.
- Official `develop-web-game` client state output now reports the new FSM values (example observed states: `hide`, `idle`).

## Validation (Peekaboo State Machine)
- `npm run build` ✅
- `npx playwright test tests/playwright/peekaboo-mode.spec.ts tests/playwright/peekaboo-visual.spec.ts tests/playwright/page-load.spec.ts --workers=1` ✅
- Official `develop-web-game` client run ✅
  - `active_view: "view-peekaboo"`
  - observed `peekaboo.state: "hide"` and later `peekaboo.state: "idle"`

## Continuation Update: Peekaboo Wing Hide Timing
- Tightened the self-hide wing animation to match the requested rhythm:
  - `hide`: `300ms`
  - `wait`: `1000ms`
  - `reveal`: `200ms`
- Wings now travel upward and inward so they more clearly cover the phoenix face during self-hide.
- Raised wing layer priority above the mascot art so the face-cover motion reads correctly.
- Shortened reveal-side shell/glow/sparkle timing so the wing-open motion feels quick and aligned with the new `200ms` reveal state.
- Adjusted the reveal follow-up sparkle/laugh timing so it still plays inside the shorter reveal window.

## Validation (Wing Hide Timing)
- `npm run build` ✅
- `npx playwright test tests/playwright/peekaboo-mode.spec.ts tests/playwright/peekaboo-visual.spec.ts --workers=1` ✅
- Official `develop-web-game` client run ✅ (`output/web-game-peekaboo-wing-hide/*`)
  - observed `peekaboo.state: "hide"` during the self-hide cycle
  - observed `peekaboo.state: "reveal"` after the wing-open phase

## Notes
- The official client screenshot still captures the largest canvas in this DOM-first app, so the state JSON remains the more reliable assertion source for Peekaboo behavior.

## Continuation Update: Peekaboo Game Finish Pass
- Strengthened the first-play rhythm of `Cee` mode so it behaves more like a finished interaction game:
  - scripted opening sequence for the first 3 cycles
  - faster first two reveal beats
  - clearer alternation between `room` and `center` scenarios
  - more deliberate room-environment hide setup
- Added `peekaboo.sequence` state output (`opening` / `loop`) for debugging and deterministic verification.
- Improved room hide readability:
  - active hideouts lift and glow more clearly
  - environment-hide rounds now feel more intentional
- Added a Playwright assertion that the opening delivers multiple reveals quickly.
- Bumped the PWA cache version to `minaplay-v27`.

## Validation (Peekaboo Finish Pass)
- `npm run build` ✅
- `npx playwright test tests/playwright/peekaboo-mode.spec.ts tests/playwright/peekaboo-visual.spec.ts tests/playwright/page-load.spec.ts --workers=1` ✅
- Official `develop-web-game` client run ✅ (`output/web-game-peekaboo-finish/*`)
  - observed `peekaboo.sequence: "opening"`
  - observed `peekaboo.reveals: 2` in the opening pass

## Suggestions
- If desired, the next polish step is adding a dedicated blink/beak micro-animation during `center` reveals so the mascot feels even more alive.

## Continuation Update: Parent Recorded Peekaboo Reveal Audio
- Added a dedicated `Cee-ee Sesi` section to the parent panel so a parent or sibling can record their own reveal voice for Peekaboo mode.
- Hooked the new controls directly into the existing shared custom-audio storage:
  - record
  - stop
  - preview
  - delete
- Peekaboo reveal playback now checks for a parent recording first.
  - if present, it plays the recorded `Cee-ee`
  - otherwise it falls back to the generated reveal voice + speech
- Extended `render_game_to_text` with `peekaboo.custom_audio` for easier verification.
- Added Playwright coverage for the custom reveal-audio path and for parent-panel visibility of the new controls.
- Bumped the PWA cache version to `minaplay-v28` so the new reveal-audio logic updates reliably on devices.

## Validation (Parent Peekaboo Audio)
- `npm run build` ✅
- `npx playwright test tests/playwright/peekaboo-mode.spec.ts tests/playwright/page-load.spec.ts --workers=1` ✅
- Official `develop-web-game` client run ✅ (`output/web-game-peekaboo-parent-audio/*`)
  - observed `active_view: "view-peekaboo"`
  - observed `peekaboo.custom_audio: false` in the default no-recording state
  - observed the state loop continue into `peekaboo.state: "wait"`

## Notes
- The official client screenshot again captured the largest canvas instead of the DOM-first Peekaboo scene, so the state JSON remained the reliable verification source for this pass.

## Mascot Redesign Iteration (Reference-Led)
- Rebuilt `phoenix.svg`, `phoenix-ui.svg`, and `phoenix-sleep.svg` from scratch to move closer to the user-provided reference image.
- Shifted the mascot away from a flat chick/icon look toward:
  - larger head and eyes
  - taller oval body
  - asymmetric raised wing pose
  - longer flowing tail trail
  - warmer internal glow
- Verified assets build successfully with `npm run build`.
- Generated local preview screenshot at `output/phoenix-preview/shot-0.png` for visual review before integration.
- Current assessment: closer than prior attempt, but still more vector/clean than the soft illustrative reference; likely needs either one more illustration-heavy pass or direct use of the provided raster artwork as a base.

## Phoenix Rig States From User SVG
- Replaced the prior mascot attempt with a simpler state-driven rig derived directly from the user's provided SVG skeleton.
- Updated base app assets:
  - `public/assets/phoenix.svg`
  - `public/assets/phoenix-ui.svg`
  - `public/assets/phoenix-sleep.svg`
- Added new peekaboo/game states:
  - `public/assets/phoenix-guide.svg`
  - `public/assets/phoenix-hide.svg`
  - `public/assets/phoenix-happy.svg`
- Wired peekaboo state transitions to swap mascot assets by state:
  - `idle -> phoenix.svg`
  - `hide/wait(self) -> phoenix-hide.svg`
  - `reveal -> phoenix-guide.svg`
  - `react -> phoenix-happy.svg`
- Updated service worker precache list for new mascot assets (`minaplay-v30`).
- Validation:
  - `npm run build` ✅
  - `npx playwright test tests/playwright/peekaboo-mode.spec.ts tests/playwright/page-load.spec.ts --workers=1` ✅ (`6 passed`)
- Preview screenshot for review: `output/phoenix-preview/shot-0.png`

- 2026-03-28: Aktif oyun maskotu Pofi olarak ayrildi; Anka seti public/assets/archive/anka-set-2026-03-28 altinda korundu.
- 2026-03-28: Pofi maskotu sevimli bulut setine çevrildi; app icon seti de bulut olarak güncellendi.

## Continuation Update: Pofi Hands in Peekaboo
- Replaced the remaining bird-like wing shapes in active `Pofi` cloud assets with rounded cloud hand/arm forms:
  - `public/assets/pofi-ui.svg`
  - `public/assets/pofi.svg`
  - `public/assets/pofi-guide.svg`
  - `public/assets/pofi-hide.svg`
  - `public/assets/pofi-happy.svg`
- Updated the `Ceee` scene shell overlays from `wing` to `hand` elements in `public/index.html`.
- Restyled the peekaboo self-hide animation in `public/style.css` so `Pofi` now covers its face with soft cloud hands instead of orange bird wings.
- Bumped service worker cache to `minaplay-v33` so the new mascot shapes invalidate old cached assets.
- Verification:
  - `npm run build` ✅
  - `npx playwright test tests/playwright/page-load.spec.ts tests/playwright/peekaboo-mode.spec.ts tests/playwright/sentence-builder.spec.ts --workers=1` ✅
  - `npx playwright test tests/playwright/peekaboo-visual.spec.ts --workers=1` ✅
  - Official web-game client run against `?view=peekaboo` captured state successfully in `output/pofi-hands-check/*`.
