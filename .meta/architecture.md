---
name: architecture
description: MinaPlay projesinin teknik omurgasını, ana bileşenlerini, veri akışını ve mimari yaklaşımını tanımlar.
created: 2026-04-17
updated: 2026-04-19
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
- Ana yüzeyler: `public`, `src/modules`, `src/app.ts`, `server.ts`
- Çalışma modeli: TypeScript modülleri build ile `public/js` içine çıkar, Express bunları statik olarak servis eder

### Yüzey Rolleri

- `public/index.html`: ana DOM ve view yapısı
- `public/style.css`: ana görsel sistem
- `public/manifest.webmanifest`: PWA kimliği
- `public/sw.js`: service worker
- `src/modules`: ürün modüllerinin TypeScript kaynakları
- `src/app.ts`: Express uygulama kurulumu
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

## Uygulama Modülleri

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
- Rol: Pofi'nin ağız, dil ve yüz egzersizini göstermesi; çocuğun kamera aynasında taklit etmesi
- İlke: katı algılama yoktur, zaman bazlı ödül vardır

### Uyku

- Dosya: `src/modules/sleep/index.ts`
- View: `view-sleep`
- Rol: sakin gece sahnesi, yavaş hareket eden gökyüzü öğeleri, sleepy -> sleep akışı ve düşük uyarımlı sesler sağlamak
- Veri temasları: runtime state
- Kural: Uyku modunda rastgele emotion/guide state çalışmaz

### Ceee

- Dosya: `src/modules/peekaboo/index.ts`
- View: `view-peekaboo`
- Rol: Pofi'nin ce-ee/peekaboo haliyle bonus mini oyun sağlamak
- Kural: ana 6 mod içinde sayılmaz

### Parent Panel

- View: `view-parent`
- Rol: ebeveyn ayarlarını, içerik yönetimini, kayıtları, analizleri ve destek araçlarını çocuk yüzeyinden ayrı tutmak
- Analiz yüzeyi: hangi bölümde ne oynandı, hangi görevler tamamlandı, doğru/yanlış denemeler, tekrar sayısı, tamamlanan egzersizler ve oturum sıklığı
- Gelecek adayları: kullanım limiti, modül kontrolü, screen lock, eğitimci/terapist görünümü, raporlama

### Pofi Davranış Sistemi

- Dosya alanı: `src/modules/pofiEmotion/`
- Rol: Pofi state seçimi, presence seviyesi, render, geçiş ve mod bağlamını yönetmek
- State kategorileri: `emotion`, `exercise`, `guide`, `state`
- Presence seviyeleri: `hidden`, `subtle`, `normal`, `focus`, `stage`
- Asset kökü: `/assets/pofi_emoji`

Kritik kurallar:

- aynı anda tek aktif Pofi state ve tek aktif Pofi presence seviyesi olmalıdır
- aynı container içinde üst üste render olmamalıdır
- eski gövde katmanları kullanılmamalıdır
- geçişler fade/scale ile yumuşak olmalıdır
- Touch ve Matching gibi modlarda hızlı duygu değişimi engellenmelidir
- Mirror egzersizi sırasında ödül/guide yüzü gösterilmemelidir
- Sleep modunda yalnız sleepy ve sleep durumları kullanılmalıdır
- `stage` presence kısa süreli olmalı ve aktiviteyi kalıcı olarak gölgelememelidir

## Veri Akışı

1. Kullanıcı PWA yüzeyini açar.
2. `public/index.html` ana DOM iskeletini sağlar.
3. `src/modules/main.ts` modülleri bootstrap eder, tab/view routing'i yönetir ve testing hook'ları bağlar.
4. Her modül kendi DOM kökünü bulur ve olaylarını bağlar.
5. Etkileşimler localStorage, tarayıcı ses/kamera API'leri ve DOM state attribute'ları üzerinden işlenir.
6. Pofi davranış sistemi aktif mod ve etkileşim sonucuna göre tek state ve tek presence seviyesi render eder.
7. Test ve doğrulama `render_game_to_text` kancasıyla okunabilir state üretir.

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
