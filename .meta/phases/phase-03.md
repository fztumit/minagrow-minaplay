---
name: phase-03
description: MinaPlay MVP ürün sertleştirme fazını, PWA/offline, cihaz fallback ve local-first sınırlarını tanımlar.
created: 2026-06-16
updated: 2026-06-16
---

# Phase 03 - Ürün Sertleştirme

## Amaç

Bu fazın amacı, Faz 2 sonunda çalışan MVP modül yüzeyini yayıma daha yakın, çevrimdışı koşullara dayanıklı ve ebeveyn açısından okunabilir hale getirmektir.

Faz 3 yeni çocuk modu eklemez. Mevcut MVP yüzeyinin PWA, local-first, cihaz izni ve test dayanıklılığı güçlendirilir.

## Kapsam

Dahil:

- service worker cache listesini gerçek client modülleriyle hizalamak
- sakin bir offline fallback sayfası eklemek
- Parent panelde çevrimdışı, kamera, ses/TTS ve yerel kayıt durumunu göstermek
- Dokun kart görsellerinde localStorage kapasite riskini ebeveyne anlaşılır uyarıyla taşımak
- PWA ve Parent panel sertleştirme davranışlarını test kapsamına almak

Hariç:

- kullanıcı hesabı veya bulut senkronu eklemek
- kamera/mikrofon izin akışını zorlamak
- yeni çocuk modu açmak
- backend veri kalıcılığı veya uzak analiz sistemi kurmak
- mevcut Pofi state sistemini yeniden mimarileştirmek

## İş Paketleri

### Paket 01 - PWA Offline Kabuk

Amaç:

- uygulama kabuğunun offline durumda anlamlı fallback taşımasını sağlamak

Kapanış ölçütü:

- `/offline.html` vardır
- service worker cache listesi ana shell, stylesheet, client modülleri ve PWA ikonunu kapsar
- navigasyon istekleri offline durumda cached shell veya offline sayfaya düşer

### Paket 02 - Cihaz ve İzin Görünürlüğü

Amaç:

- ebeveynin cihaz destek durumunu çocuk yüzeyini bozmadan görmesini sağlamak

Kapanış ölçütü:

- Parent panelde çevrimdışı durum, kamera, ses/TTS ve yerel kayıt kartları görünür
- kamera veya ses desteği yoksa akışın metin/görsel fallback ile devam edeceği açıklanır

### Paket 03 - Local-first Kapasite Sınırı

Amaç:

- kart görselleri büyüdüğünde yerel kayıt riskini sessiz bırakmamak

Kapanış ölçütü:

- Dokun ayar kaydı localStorage kota hatasını yakalar
- ebeveyne büyük görselleri azaltması gerektiğini söyleyen sakin uyarı verilir
- IndexedDB yazımı mümkünse devam eder

### Paket 04 - Regresyon Kapsamı

Amaç:

- sertleştirme davranışlarının tekrar kırılmasını zorlaştırmak

Kapanış ölçütü:

- PWA cache/offline manifesti unit testle doğrulanır
- Parent panel cihaz durumu Playwright e2e ile doğrulanır
- build, lint, unit ve e2e hattı temiz geçer

## Faz Kapanışı

Bu faz, MinaPlay MVP yüzeyi çevrimdışı shell, cihaz fallback görünürlüğü, local-first kayıt sınırı ve regresyon testleriyle doğrulandığında kapanır.

Kapanış durumu:

- tamamlandı

Doğrulama:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e`
