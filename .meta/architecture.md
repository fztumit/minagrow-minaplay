---
name: architecture
description: MinaGrow/MinaPlay projesinin teknik omurgasını, ana bileşenlerini, veri akışını ve mimari yaklaşımını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Mimari

## Özet

Bu belge `MinaGrow / MinaPlay` ürününün kanonik teknik omurgasını ve ana mimari yönünü görünür kılar.

Bugünkü yön şudur:

- ana ürün yüzeyi PWA'dır
- frontend sade HTML/CSS ve modüler TypeScript ile çalışır
- backend şimdilik Node.js + Express ile statik servis, health ve legacy endpoint yüzeyidir
- veri kalıcılığı ağırlıklı olarak tarayıcı `localStorage` içindedir
- ses ve medya davranışı tarayıcı API'lerine yaslanır
- deploy Railway üzerinde Dockerfile ile yapılır

## Mimari İlkeler

- uygulama önce mobil/tablet PWA deneyimi olarak düşünülür
- çocuk etkileşimi server round-trip'e bağımlı olmadan hızlı çalışır
- ebeveyn ses kayıtları ve ilerleme verileri local-first tutulur
- server tarafı gereksiz ürün kuralı üretmez
- modüller küçük ve bağımsız kalır
- legacy CRM/webhook parçaları ürün çekirdeğine karıştırılmaz
- test kancaları ürün davranışını bozmayacak şekilde korunur

## Sistem Yapısı

- Sistem tipi: tek uygulama repo yapısında PWA + ince Express servis
- Ana yüzeyler: `public`, `src/modules`, `server.ts`, `src/app.ts`
- Çalışma modeli: build edilen TypeScript modülleri `public/js` içine çıkar, Express bunları statik olarak servis eder

### Yüzey Rolleri

- `public`: PWA shell, CSS, manifest, service worker ve assetler
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
- Test: `Vitest`, `Playwright`
- Deploy: Dockerfile + Railway
- Yardımcı bağımlılıklar: `zod`, `dotenv`, `morgan`, `lowdb`, `axios`

## Uygulama Modülleri

### Konuşma Oyunu

- Dosya: `src/modules/speech/index.ts`
- Rol: kelime kartlarına dokununca kelimeyi seslendirmek, tekrar davranışını yönetmek, özel ses kayıtlarını oynatmak
- Veri temasları: kelime listesi, konuşma ayarları, özel ses kayıtları, dinleme ilerlemesi
- Özel davranış: `su` kelimesi varsayılan olarak üç tekrar ve su animasyonuyla çalışır

### Hikayeler

- Dosyalar: `src/modules/stories/index.ts`, `src/modules/stories/data.ts`
- Rol: kolay ve standart hikaye/cümle pratiklerini yönetmek
- Veri temasları: story level, pack, aktif hikaye, cümle index'i, özel kolay cümleler, hikaye ses kayıtları, paket ilerlemesi
- Özel davranış: kolay seviye iki kelimelik cümleleri merkeze alır

### Günlük Kelime

- Dosya: `src/modules/dailyword/index.ts`
- Rol: her gün deterministik bir kelime seçmek ve ebeveyn sesiyle kaydı desteklemek
- Veri temasları: vocabulary ve özel ses kayıtları

### Günlük Aktivite

- Dosya: `src/modules/dailyactivity/index.ts`
- Rol: günlük küçük hedefleri takip etmek
- Hedefler: `3 kelime`, `1 hikaye`, `1 etkileşim`
- Veri temasları: günlük localStorage state'i

### Uyku Modu

- Dosya: `src/modules/sleep/index.ts`
- Rol: uykuya geçiş için sakin görsel yüzey, uyuyan maskot ve tarayıcı tabanlı uyku sesleri sağlamak
- Veri temasları: runtime state
- Ses türleri: white, rain, wind, ocean, vacuum, heartbeat, pış pış

### Aile Avatarları

- Dosya: `src/modules/family/index.ts`
- Rol: aile üyelerini isim, renk ve fotoğrafla yerel olarak tanımlamak
- Veri temasları: localStorage

### Maskot

- Dosya: `src/modules/mascot/index.ts`
- Rol: çocuk ekranına kısa, destekleyici mesajlar vermek
- Kullanım: konuşma, hikaye, uyku ve aile akışlarında rehber ton üretir

## Veri Akışı

### Ana Akış

1. Kullanıcı PWA yüzeyini açar.
2. `public/index.html` ana DOM iskeletini sağlar.
3. `src/modules/main.ts` modülleri bootstrap eder.
4. Her modül kendi DOM kökünü bulur ve olaylarını bağlar.
5. Etkileşimler localStorage, tarayıcı ses API'leri ve DOM state attribute'ları üzerinden işlenir.
6. Test ve doğrulama `render_game_to_text` kancasıyla okunabilir state üretir.

### Kalıcılık

Ana kalıcılık noktası tarayıcıdır.

- konuşma ayarları: `localStorage`
- özel ses kayıtları: `localStorage` içinde data URL haritası
- günlük aktivite: `localStorage`
- dinleme ilerlemesi: `localStorage`
- aile avatarları: `localStorage`
- özel kolay cümleler: `localStorage`

Bu veriler cihaz ve tarayıcıya bağlıdır. Bulut senkronizasyonu mevcut kanonik davranış değildir.

## Server Yorumu

Express server ürünün ana iş kuralı merkezi değildir.

Bugünkü rolleri:

- statik PWA dosyalarını servis etmek
- health endpoint sağlamak
- mevcut legacy webhook/Zoho parçalarını taşımak

Yakın teknik temizlik hedefi:

- PWA ürün çekirdeği ile legacy CRM/webhook kodunu ayırmak
- gerekiyorsa legacy endpointleri ayrı modül veya ayrı repo kararına taşımak

## PWA Yorumu

PWA yüzeyi ürünün ana deneyimidir.

- manifest uygulama kimliğini taşır
- service worker offline davranış için temel zemin sağlar
- mobil ve tablet ekranlar ana hedef kabul edilir
- çocuk kullanımında büyük dokunma alanları ve düşük dikkat dağıtımı önceliklidir

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

## Repo Yerleşimi

Referans repo şu yapıdadır:

```text
public/
  index.html
  style.css
  manifest.webmanifest
  sw.js
  assets/
  js/

src/
  app.ts
  server.ts
  config/
  modules/

tests/
  playwright/
  segmentation.test.ts
  webhook-verify.test.ts
```

`MinaGrow` içinde hedef, bu çalışan yapıyı `MinaPlay` alanında temiz bir ürün omurgası olarak taşımaktır.

## Mimari Riskler

- localStorage verisinin cihaz bazlı olması ileride senkronizasyon beklentisiyle karışabilir
- MediaRecorder ve Web Speech API tarayıcı desteği farklılık gösterebilir
- büyük data URL ses kayıtları localStorage kapasitesine yaklaşabilir
- legacy CRM parçaları temizlenmezse ürün mimarisini bulanıklaştırabilir
- PWA offline davranışı basit kalırsa kullanıcıya yeterli geri bildirim vermeyebilir
- çocuk ekranına ebeveyn araçları fazla yaklaşırsa deneyim karmaşıklaşabilir

## Kısa Kural

Önce çalışan PWA deneyimi korunur.

Sonra ürün kimliği, temizlik, test ve ebeveyn destek araçları güçlendirilir.
