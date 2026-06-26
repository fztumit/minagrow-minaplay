---
name: architecture
description: MinaPlay projesinin teknik omurgasını, ana bileşenlerini, veri akışını ve mimari yaklaşımını tanımlar.
created: 2026-04-17
updated: 2026-06-25
---

# Mimari

## Özet

Bu belge `MinaPlay` ürününün kanonik teknik omurgasını ve ana mimari yönünü görünür kılar.

Bugünkü yön şudur:

- ana ürün yüzeyi PWA'dır
- frontend sade HTML/CSS ve modüler TypeScript ile çalışır
- backend şimdilik Node.js + Express ile statik servis, health ve legacy endpoint yüzeyidir
- build edilen browser TypeScript çıktısı `public/js` altında oluşur
- veri kalıcılığı ağırlıklı olarak tarayıcı `localStorage` içindedir
- ses, kamera ve medya davranışı tarayıcı API'lerine yaslanır
- deploy Railway üzerinde Dockerfile ile yapılır
- V2 uygulamasının kanonik çalışma alanı `/Users/umitaydin/Documents/MinaGrow/MinaPlay` klasörüdür

## Mimari İlkeler

- uygulama önce mobil/tablet PWA deneyimi olarak düşünülür
- çocuk etkileşimi server round-trip'e bağımlı olmadan hızlı çalışır
- çocuk yüzeyi sade, ebeveyn araçları ayrı katmanda kalır
- Pofi süs karakteri değil, modüller arası davranış/state/presence/render sistemidir
- Pofi için aynı anda tek aktif state ve tek aktif presence seviyesi korunur
- ebeveyn ses kayıtları ve ilerleme verileri local-first tutulur
- server tarafı gereksiz ürün kuralı üretmez
- modüller küçük ve bağımsız kalır
- legacy CRM/webhook parçaları ürün çekirdeğine karıştırılmaz
- test kancaları ürün davranışını bozmayacak şekilde korunur

## Sistem Yapısı

- Sistem tipi: tek uygulama repo yapısında PWA + ince Express servis
- Ana yüzeyler: `public`, `src/core`, `src/pofi`, `src/features`, `src/entities`, `src/services`, `src/server`, `server.ts`
- Çalışma modeli: TypeScript modülleri build ile `public/js` içine çıkar, Express bunları statik olarak servis eder

V2 uygulama kök yapısı:

```html
<div id="app">
  <div id="view-root"></div>
  <div id="pofi-root"></div>
  <div id="tab-bar"></div>
</div>
```

Kök yapı kuralları:

- Pofi her zaman `pofi-root` içinde render edilir
- uygulamada yalnız tek global Pofi instance bulunur
- modüller Pofi görselini doğrudan render etmez
- modüller yalnız olay gönderir; Pofi state/presence kararını merkezi sistem verir
- Pofi PNG assetleri kullanılır; SVG parça/gövde sistemi kullanılmaz

V2 MVP aktif modülleri:

- `home`
- `touch`
- `matching`
- `sentence`
- `stories`
- `mirror`
- `sleep`
- `ceee`

Ceee ana mod değil, bonus/kısa dikkat oyunu olarak yorumlanır. İfade ve Hikaye Faz 6 ile çocuk yüzeyinde aktif hale gelmiştir; gelecek çalışma bu modları büyütmekten önce davranış, kayıt ve Parent panel okunabilirliğini sertleştirmeye odaklanır.

V2 klasör ağacı kararı:

```text
src/
  core/
  pofi/
  entities/
  features/
  services/
  shared/
  server/
```

Bu yapı feature-first + core-first yaklaşımıyla seçilmiştir. Amaç, bugünkü çocuk yüzeyini sade tutarken auth, therapist, çağrı, senkronizasyon ve yeni terapi/oyun alanlarını ileride kırmadan ekleyebilmektir.

### Yüzey Rolleri

- `public/index.html`: ana DOM ve view yapısı
- `public/style.css`: ana görsel sistem
- `public/manifest.webmanifest`: PWA kimliği
- `public/sw.js`: service worker
- `src/core`: uygulama bootstrap, router, shell ve root layout
- `src/pofi`: Pofi Engine V2, event bus, idle timer, renderer ve asset çözümü
- `src/entities`: ürün varlıkları ve veri şekilleri
- `src/features`: çocuk modülleri, parent panel, therapist panel, auth, calls ve ileride aktiviteler
- `src/services`: auth, storage, sync, media, speech, camera, analytics, calls servis katmanı
- `src/shared`: küçük ortak util, type, dom ve sabitler
- `src/server`: Express tarafı route, auth, signaling ve storage adaptörleri
- `src/app.ts`: Express uygulama kurulumu veya `src/core` ile bağlanan server shell
- `server.ts`: runtime giriş noktası
- `tests`: unit ve Playwright doğrulama yüzeyi
- `output`: Playwright/skill doğrulama çıktıları

## Teknoloji Yığını

- Dil ve runtime: `Node.js`, `TypeScript`
- Backend: `Express`
- Frontend: HTML, CSS, modüler browser TypeScript
- PWA: `manifest.webmanifest`, `sw.js`
- Storage: `localStorage`
- Ses: Web Speech API, MediaRecorder, Web Audio API
- Kamera/Ayna: tarayıcı kamera API'leri
- Test: `Vitest`, `Playwright`
- Deploy: Dockerfile + Railway
- Yardımcı bağımlılıklar: `zod`, `dotenv`, `morgan`, `lowdb`, `axios`

## Katman Kararı

MinaPlay V2 ağır bir enterprise katmanlı yapı ile başlamaz. Ancak büyüme yönü açık olduğu için şu ayrımlar erken kabul edilir:

- `core` uygulama kabuğudur
- `pofi` merkezi davranış motorudur
- `features` kullanıcıya görünen ekran ve akışlardır
- `entities` veri varlıklarıdır
- `services` online/offline ve cihaz/sunucu servislerini soyutlar
- `shared` yalnız küçük ortak yardımcılar taşır
- `server` ince backend ve gelecekte signaling/auth uyum katmanıdır

Kural:

- storage, auth, calls veya sync mantığı doğrudan feature içine gömülmez
- doğrudan `localStorage` veya doğrudan uzak servis erişimi her yere dağılmaz
- adapter-first servis mantığı korunur; bugün local implementasyon, yarın sync/remote implementasyon eklenebilir

## Uygulama Modülleri

V2'de modüller `src/features` altında yaşar. Bugünkü dosya örnekleri V1 referansından gelir; V2 implementasyonunda aşağıdaki feature alanları esas alınır:

- `home`
- `touch`
- `matching`
- `mirror`
- `sleep`
- `ceee`
- `sentence`
- `stories`
- `parent-panel`
- `therapist-panel`
- `auth`
- `calls`
- `activities`

### Dokun

- Dosya: `src/modules/speech/index.ts`
- View: `view-touch`
- Rol: nesneye dokununca kelime veya sesi çalmak, hedefe göre Pofi yönlendirmesi üretmek, doğru etkileşimde olumlu geri bildirim vermek
- Veri temasları: kelime listesi, konuşma ayarları, özel ses kayıtları, dinleme ilerlemesi

### Eşleme

- Dosya: `src/modules/matching/index.ts`
- View: `view-match`
- Rol: Pofi'nin seçtiği hedefle çocuğun nesne eşleştirmesini sağlamak
- Veri temasları: set/raf yapısı, hedef seçim state'i, eşleme ilerlemesi
- Not: mevcut guided set-temelli oyun bu modda yaşar

### Cümle

- Dosya: `src/modules/sentence/index.ts`
- View: `view-sentence`
- Rol: çocuğun iki görsel seçip bunları basit cümle olarak dinlemesini sağlamak
- Akış: seç, birleştir, dinle

### Hikaye

- Dosyalar: `src/modules/stories/index.ts`, `src/modules/stories/data.ts`
- View: `view-story`
- Rol: kısa, eğitsel ve kolay algılanır hikaye/cümle pratiklerini yönetmek
- Veri temasları: story level, pack, aktif hikaye, cümle index'i, özel kolay cümleler, hikaye ses kayıtları, paket ilerlemesi

### Ayna

- Dosya: `src/modules/mirror/index.ts`
- View: `view-mirror`
- Rol: Pofi'nin güvenli ağız hareketi, dudak ve yüz ifadesi egzersizini göstermesi; çocuğun kamera aynasında taklit etmesi
- İlke: katı algılama yoktur, zaman bazlı ödül vardır

### Uyku

- Dosya: `src/modules/sleep/index.ts`
- View: `view-sleep`
- Rol: sakin gece sahnesi, yavaş hareket eden gökyüzü öğeleri, sleepy -> sleep akışı ve düşük uyarımlı sesler sağlamak
- Veri temasları: runtime state
- Kural: Uyku modunda rastgele emotion/guide state çalışmaz; Pofi ve ay görünür kalır ama dikkat çekmez

### Ceee

- Dosya: `src/modules/peekaboo/index.ts`
- View: `view-peekaboo`
- Rol: Pofi'nin klasik karşılıklı ce-ee haliyle kısa, neşeli ve dikkat destekleyici oyun sağlamak
- Kural: Ceee ana mod değil bonus/kısa dikkat oyunudur; Pofi merkezde kalır, yüzünü kapatıp açar, arama cümlesi ve kısa sevinçli seslerle ilerler

### Parent Panel

- View: `view-parent`
- Rol: ebeveyn ayarlarını, içerik yönetimini, kayıtları, analizleri ve destek araçlarını çocuk yüzeyinden ayrı tutmak
- Analiz yüzeyi: hangi bölümde ne oynandı, hangi görevler tamamlandı, doğru/yanlış denemeler, tekrar sayısı, tamamlanan egzersizler ve oturum sıklığı
- MVP analiz yüzeyi: kelime/nesne bazlı deneme, doğru, streak, son 5 deneme, öğrenildi durumu, günlük kısa özet ve temel set seçimi
- Gelecek adayları: kullanım limiti, modül kontrolü, screen lock, eğitimci/terapist görünümü, raporlama

### Pofi Davranış Sistemi

- Dosya alanı: `src/modules/pofiEmotion/`
- Rol: Pofi state seçimi, presence seviyesi, render, geçiş ve mod bağlamını yönetmek
- State kategorileri: `role`, `presence`, `asset`, `module`
- Presence seviyeleri: `hidden`, `subtle`, `normal`, `focus`, `stage`
- Asset kökleri:
  - `/assets/pofi/emotion`
  - `/assets/pofi/exercise`
  - `/assets/pofi/sleep`
  - `/assets/pofi/play`

Kritik kurallar:

- aynı anda tek aktif Pofi state ve tek aktif Pofi presence seviyesi olmalıdır
- aynı container içinde üst üste render olmamalıdır
- eski gövde katmanları kullanılmamalıdır
- geçişler fade/scale ile yumuşak olmalıdır
- modüller Pofi'yi doğrudan yönetmez; yalnız olay gönderir
- modüller Pofi DOM'una dokunmaz; yalnız typed event gönderir
- Pofi yalnız `pofi-root` içine render edilir
- render tek persistent `img` ile yapılır; `innerHTML` ile node yenileme yapılmaz
- Touch ve Matching gibi modlarda hızlı duygu değişimi engellenmelidir
- Mirror egzersizi sırasında ödül/guide yüzü gösterilmemelidir
- Sleep modunda yalnız sleepy ve sleep durumları kullanılmalıdır
- `stage` presence kısa süreli olmalı ve aktiviteyi kalıcı olarak gölgelememelidir
- MVP'de random asset seçimi yapılmaz; event -> role/presence -> assetKey çözümü deterministiktir

Pofi Engine V2 sözleşmesi:

```ts
interface PofiState {
  module: PofiModule;
  role: PofiRole;
  presence: PofiPresence;
  assetKey: string;
  locked: boolean;
  updatedAt: number;
}
```

Rol ailesi:

- `idle`
- `attention`
- `success`
- `error_soft`
- `empathy`
- `sleep`
- `play`
- `exercise`

Kritik event mimarisi:

- `APP_START`
- `VIEW_CHANGE`
- `TARGET_SHOWN`
- `CORRECT`
- `WRONG`
- `SUCCESS_STREAK`
- `IDLE_10`
- `IDLE_20`
- `IDLE_30`
- `REPEAT_FAIL_3`
- `STRUGGLE`
- `MIRROR_START`
- `MIRROR_MODEL`
- `MIRROR_SUCCESS`
- `MIRROR_FAIL`
- `SLEEP_ENTER`
- `SLEEP_ACTIVE`
- `CEEE_START`
- `CEEE_HIDE`
- `CEEE_FOUND`
- `CEEE_TIMEOUT`
- `USER_INTERACTION`

Öncelik kuralı:

- kullanıcı olayı sistem olayından güçlüdür
- `CORRECT` ve `WRONG`, aynı anda gelen idle olayını bastırır
- Sleep modunda `sleep` davranışı diğer dikkat toplama akışlarını bastırır

Global idle sistemi:

- 10 saniye: yumuşak ipucu
- 20 saniye: ipucu tekrarı
- 30 saniye: daha belirgin yönlendirme

Idle kuralları:

- her idle seviyesi döngü başına yalnız bir kez tetiklenir
- kullanıcı etkileşimi idle döngüsünü sıfırlar
- idle davranışı modun izin verdiği presence seviyeleriyle sınırlıdır

V2 kurulum sırası:

1. Pofi core sistemi: state, presence ve idle timer
2. Ana ekran
3. Dokun modülü
4. Eşleme modülü
5. Ayna modülü
6. Uyku modülü
7. Ceee modülü

Kural: Her modül stabil olmadan sonraki modül büyütülmez. V2 her şeyi aynı anda kurmaya çalışmaz.

## Veri Akışı

1. Kullanıcı PWA yüzeyini açar.
2. `public/index.html` ana DOM iskeletini sağlar.
3. `src/core/main.ts` veya eşdeğeri bootstrap katmanı shell, router ve Pofi motorunu başlatır.
4. Her feature kendi view DOM kökünü bulur ve olaylarını bağlar.
5. Etkileşimler önce feature event'ine, oradan gerekli entity/service adaptörlerine gider.
6. Storage ve sync erişimi servis adaptörleri üzerinden çözülür; feature katmanına dağılmaz.
7. Pofi davranış sistemi aktif mod ve etkileşim sonucuna göre tek state ve tek presence seviyesi render eder.
8. Test ve doğrulama `render_game_to_text` kancasıyla okunabilir state üretir.

## Server Yorumu

Express server ürünün ana iş kuralı merkezi değildir.

Bugünkü rolleri:

- statik PWA dosyalarını servis etmek
- health endpoint sağlamak
- mevcut legacy webhook/Zoho parçalarını taşımak

Yakın teknik temizlik hedefi:

- PWA ürün çekirdeği ile legacy CRM/webhook kodunu ayırmak
- gerekiyorsa legacy endpointleri ayrı modül veya ayrı repo kararına taşımak

## Gelecek Mimari Adayları

MinaPlay ileride 0-18 yaş aralığına, okul öncesi ve örgün öğretim desteğine, gönüllü eğitimci ağına ve engelli bireylerin okul süreci desteğine büyüyebilir.

Bu büyüme için aday mimari parçalar:

- öğrenci/çocuk profili
- ebeveyn rolü
- gönüllü eğitimci rolü
- terapist/eğitimci dashboard'u
- okul süreci takip sistemi
- kişiselleştirilmiş plan ve hedef sistemi
- günlük görev ve haftalık hedef sistemi
- kısa ev egzersizi oturumları
- raporlama ve tekrar takibi

Bu parçalar bugünkü PWA çekirdeğinin kapsamına alınmaz.

Gelecek terapi/eğitim modülleri:

- Dil ve Konuşma Terapisi
- Fizyoterapi
- Özel Eğitim
- Floortime
- Ergoterapi

## Test ve Doğrulama

Kanonik doğrulama hattı:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e`

Ek doğrulama:

- `render_game_to_text` state çıktısı
- Playwright ekran kontrolleri
- console/page error takibi
- mobil/tablet viewport kontrolü
- Pofi state çakışması ve Sleep/Mirror mod kısıtları
- routing bütün modlarda çalışır
- yalnız tek Pofi instance vardır
- Pofi renderları üst üste binmez
- modüller birbirinden bağımsız davranır

## Mimari Riskler

- localStorage verisinin cihaz bazlı olması ileride senkronizasyon beklentisiyle karışabilir
- MediaRecorder, Web Speech API ve kamera desteği tarayıcıdan tarayıcıya değişebilir
- büyük data URL ses kayıtları localStorage kapasitesine yaklaşabilir
- legacy CRM parçaları temizlenmezse ürün mimarisini bulanıklaştırabilir
- Pofi state sistemi dağılırsa modlar arasında üst üste render veya hızlı duygu değişimi oluşabilir
- eğitimci/terapist vizyonu erken çekirdeğe taşınırsa çocuk yüzeyi karmaşıklaşabilir

## Kısa Kural

Önce çalışan, sakin ve sade PWA deneyimi korunur.

Sonra Pofi davranış sistemi, ürün kimliği, test ve ebeveyn destek araçları güçlendirilir.
