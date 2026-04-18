---
name: plan
description: MinaGrow/MinaPlay projesinin bugünkü yürütme yönünü, aktif odağını ve yakın çalışma sırasını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Plan

## Aktif Odak

Bugünkü aktif odak:

`MinaGrow` içindeki `.meta`, `.agent` ve agent giriş protokolünü `Konusu-Yorum` referansına göre temizlemek.

Bu odak, eski hazır bağlamdan kalan yanlış yönleri kaldırır ve yeni sohbetlerde ajanın Ümit + MinaGrow/MinaPlay bağlamıyla başlamasını sağlar.

## Bugünkü Kapanış Hedefi

- `.meta` dosyaları MinaGrow/MinaPlay ürün yönüne çekilecek
- `.agent` dosyaları Ümit + Codex çalışma modeline çekilecek
- kök `AGENTS.md` gelecekte yanlış açılış üretmeyecek şekilde güncellenecek
- Konusu-Yorum referansı açık ve doğru yerde tutulacak
- eski hazır bağlam izleri doğrulama taramasıyla temizlenecek

## Yakın Sıra

### 1. Meta ve Agent Hizalaması

Durum:

- aktif

Kapanış ölçütü:

- `.meta` ve `.agent` içinde eski hazır bağlam kalıntısı kalmaması
- `MinaGrow`, `MinaPlay`, `Konusu-Yorum` ayrımının açık olması
- Ümit'in kullanıcı/owner bağlamının doğru yazılması

### 2. Kod Taşıma Planı

Amaç:

- `/Users/umitaydin/Documents/Konusu-Yorum` içindeki çalışan uygulamayı `/Users/umitaydin/Documents/MinaGrow/MinaPlay` alanına taşıma yöntemini netleştirmek

Karar gerektirenler:

- Git geçmişi korunacak mı
- mevcut `node_modules`, `dist`, `output`, `test-results` taşınacak mı
- Railway deploy yeni klasör yapısına göre nasıl güncellenecek
- storage key adları korunacak mı

### 3. PWA Ürün Temizliği

Amaç:

- görünen metinlerde Türkçe karakterleri düzeltmek
- MinaGrow/MinaPlay adlandırmasını tutarlı yapmak
- legacy CRM parçalarını ayırmak
- asset adlarını sadeleştirmek

### 4. Ürün Sertleştirme

Amaç:

- mobil/tablet Playwright görsel kontrolleri
- service worker offline fallback
- mikrofon ve TTS fallback metinleri
- localStorage ses kaydı kapasite stratejisi
- ebeveyn panellerinin mobil sıkışma kontrolü

## Şimdilik Açılmayacaklar

- kullanıcı hesabı
- cloud sync
- ödeme/abonelik
- admin panel
- çok dilli içerik sistemi
- büyük backend veri modeli

## Kapanış Disiplini

Her aktif iş şu sırayla kapanır:

1. bağlam oku
2. tek hedef belirle
3. uygula
4. mümkünse doğrula
5. worklog güncelle
6. gerekiyorsa commit
