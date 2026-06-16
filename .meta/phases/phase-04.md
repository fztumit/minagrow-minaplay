---
name: phase-04
description: MinaPlay Parent panel yorumlu rehberlik fazını, local-first analizden ebeveyne kısa öneri üretimini tanımlar.
created: 2026-06-16
updated: 2026-06-16
---

# Phase 04 - Parent Panel Yorumlu Rehberlik

## Amaç

Bu fazın amacı, Parent paneli yalnız metrik gösteren bir yüzey olmaktan çıkarıp ebeveyne kısa, sakin ve uygulanabilir yorum veren bir destek katmanına taşımaktır.

Faz 4 çocuk yüzeyine yeni mod eklemez. Mevcut local-first kayıtlar üzerinden ebeveyne bugünkü ritim, tekrar odağı ve sıradaki küçük adım gösterilir.

## Kapsam

Dahil:

- Parent panel günlük özet alanına yorumlu rehberlik kartları eklemek
- mevcut analitik, Dokun ilerlemesi ve Eşleme ilerlemesinden tekrar odağı çıkarmak
- “bugünkü ritim”, “tekrar odağı” ve “sonraki sakin adım” kartlarını üretmek
- yorum üretimini unit testle doğrulamak
- Parent panel rehberlik görünürlüğünü e2e testle korumak

Hariç:

- bulut analitik veya hesap sistemi açmak
- terapist paneli eklemek
- yeni çocuk modu göstermek
- ebeveyne klinik/tıbbi yönlendirme üretmek
- uzun rapor veya performans puanı üretmek

## İş Paketleri

### Paket 01 - Rehberlik Yüzeyi

Amaç:

- Parent panelde yorumlu rehberliğin ayrı ve okunabilir kartlarla görünmesini sağlamak

Kapanış ölçütü:

- Parent panelde üç rehberlik kartı görünür
- kartlar çocuk yüzeyi yerine ebeveyn katmanında kalır

### Paket 02 - Local-first Yorum Mantığı

Amaç:

- mevcut yerel ilerleme ve analitik kayıtlarından ebeveyne sakin öneri üretmek

Kapanış ölçütü:

- oturum ve modül ritmi yorumlanır
- Dokun/Eşleme yönlendirme ve tekrar ihtiyacı tekrar odağına dönüşür
- belirgin tekrar ihtiyacı yoksa öğrenilen alan veya kısa başlangıç önerilir

### Paket 03 - Regresyon Kapsamı

Amaç:

- yorumlu rehberliğin tekrar kırılmasını zorlaştırmak

Kapanış ölçütü:

- helper unit testle doğrulanır
- Parent panel e2e testlerinde rehberlik kartları görünür
- build, lint, unit ve e2e hattı temiz geçer

## Faz Kapanışı

Bu faz, Parent panel mevcut local-first verilerden kısa yorum ve sıradaki adımı üretebildiğinde kapanır.

Kapanış durumu:

- tamamlandı

Doğrulama:

- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e`
