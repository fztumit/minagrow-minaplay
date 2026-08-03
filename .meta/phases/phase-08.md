---
name: phase-08
description: MinaPlay Android stable sürümlerinin imzalı, doğrulanabilir ve HTTPS tabanlı yayın hattını tanımlar.
created: 2026-08-03
updated: 2026-08-03
---

# Phase 08 - Güvenli Yayın ve Android Güncelleme Hattı

## Amaç

Bu fazın amacı MinaPlay'in yerel IP ve debug APK'ye bağlı güncelleme düzenini kaldırmak; stable Android sürümlerini kalıcı release imzası, GitHub Releases ve Railway metadata yüzeyi üzerinden doğrulanabilir biçimde dağıtmaktır.

## Kapsam

Dahil:

- tek `version` ve `versionCode` kaynağı
- secrets zorunlu Android release imzası
- GitHub Actions tag tabanlı stable yayın hattı
- Railway `/api/update` metadata proxy ve doğrulaması
- Parent panelde sayısal sürüm karşılaştırması
- native HTTPS, SHA-256, paket, sürüm ve imza doğrulaması
- debug-to-stable temiz kurulum rehberi

Hariç:

- Google Play dağıtımı
- beta kanalı
- signing key'in repoda tutulması
- iOS native yayın hattı
- bulut veri senkronu

## İş Paketleri

### Paket 01 - Sürüm Kimliği ve İmzalama

Durum:

- kod ve yerel smoke doğrulaması tamamlandı
- production keystore ve GitHub secrets kurulumu bekliyor

Kapanış sonucu:

- `release.json` web ve Android sürümünün kanonik kaynağıdır
- ilk stable kimlik `1.0.36 / 37` olarak tanımlandı
- secrets olmadan `assembleRelease` bilinçli biçimde durur
- release manifest cleartext trafiği kapatır
- geçici test anahtarıyla imzalı APK, paket kimliği ve sürüm doğrulandı; geçici anahtar silindi

### Paket 02 - Güvenli Güncelleme Sözleşmesi

Durum:

- uygulama tamamlandı
- canlı Railway deploy sonrası smoke kontrolü bekliyor

Kapanış sonucu:

- `/api/update` yalnız doğrulanmış stable metadata döndürür; kaynak kullanılamazsa `503` verir
- istemci yalnız daha yüksek `versionCode` için indirme açar
- LAN IP, debug APK route'u ve güvensiz indirme fallback'i kaldırıldı
- native kurucu HTTPS yönlendirme zinciri, SHA-256, paket adı, sürüm kodu ve imza sertifikasını doğrular

### Paket 03 - GitHub Release Otomasyonu

Durum:

- workflow ve yayın scriptleri tamamlandı
- GitHub secrets ve ilk `v1.0.36` tag çalıştırması bekliyor

Kapanış sonucu:

- tag ile `release.json` sürümü uyuşmazsa yayın durur
- build, lint, unit ve e2e geçmeden APK üretilmez
- imzalı APK, checksum ve stable metadata aynı GitHub Release'e eklenir
- manuel workflow yalnız dry-run artifact üretir

### Paket 04 - Tablet Geçişi ve Yayın QA

Durum:

- geçiş ve kabul listesi hazır
- production imzalı APK sonrası gerçek tablet uygulaması bekliyor

Kapanış ölçütü:

- gerekli medya kasası temiz kurulumdan önce şifreli yedeklenir
- debug uygulama kaldırılıp ilk stable sürüm kurulur
- izinler ve kiosk/device-owner davranışı yeniden doğrulanır
- daha yüksek sürümlü ikinci stable paket Parent panelden kurulur
- stable-to-stable güncellemede yerel veri korunur

## Riskler

- production release anahtarı kaybolursa aynı package üzerinde güncelleme yayınlanamaz
- ilk debug-to-stable temiz kurulumda medya dışındaki yerel ilerleme sıfırlanabilir
- ilk GitHub Release yayımlanana kadar Railway metadata kaynağı `503` verir
- Android downgrade kabul etmediği için geri dönüş daha yüksek `versionCode` taşıyan düzeltme sürümü gerektirir

## Faz Kapanışı

Faz 8; production keystore secrets kurulduğunda, `v1.0.36` GitHub Release yayımlandığında, canlı Railway `/api/update` geçerli metadata döndürdüğünde ve gerçek tablette temiz kurulum ile stable-to-stable güncelleme kabulü tamamlandığında kapanır.
