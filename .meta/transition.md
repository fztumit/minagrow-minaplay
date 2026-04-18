---
name: transition
description: Konusu-Yorum referans uygulamasından MinaGrow/MinaPlay ürün omurgasına geçiş yönünü ve temel karar eksenlerini taşır.
created: 2026-04-17
updated: 2026-04-18
---

# Geçiş

## Özet

Bu belge, çalışan `Konusu-Yorum` uygulamasından `MinaGrow / MinaPlay` ürün omurgasına geçişi tanımlar.

Ana karar:

- `Konusu-Yorum` referans ve prototip kaynaktır
- `MinaGrow` repo kökü ürün hafızasını ve hedef yerleşimi taşır
- `MinaPlay` uygulama adı ve hedef ürün alanıdır
- eski hazır bağlam bu repo için geçerli değildir

## Bugünkü Durum

`/Users/umitaydin/Documents/Konusu-Yorum` içinde çalışan bir PWA uygulaması vardır.

Çalışan parçalar:

- konuşma oyunu
- hikaye modülü
- kolay cümle editörü
- özel ses kayıtları
- günlük kelime
- günlük aktivite
- uyku modu
- aile avatarları
- PWA manifest ve service worker
- Railway deploy uyumu
- build/lint/test/e2e hattı

`/Users/umitaydin/Documents/MinaGrow` içinde ise meta ve agent omurgası bulunur. `MinaPlay` klasörü hedef uygulama alanı olarak açılmıştır fakat henüz ürün kodu bu alana taşınmamıştır.

## Geçişin Amacı

Geçişin amacı çalışan ürünü sıfırdan yazmak değildir.

Amaç:

- referans davranışı korumak
- ürün adını ve hafızasını `MinaGrow / MinaPlay`e çekmek
- repo içindeki meta ve agent yüzeylerini doğru bağlama taşımak
- uygulama kodunu ileride temiz bir hedef alana almak
- legacy CRM parçalarını ürün çekirdeğinden ayırmak

## İsim Ayrımı

Doğru yorum:

- `Konusu-Yorum`: ilk fikir ve çalışan referans repo
- `MinaGrow`: marka ve üst proje alanı
- `MinaPlay`: çocuk konuşma pratiği PWA ürün adı

Yanlış yorum:

- `Konusu-Yorum`u kalıcı ürün adı gibi taşımak
- `MinaGrow`u yalnız klasör adı gibi görmek
- `MinaPlay`i boş bir alt klasör olarak bırakıp meta hafızasını ayrı yerde büyütmek

## Geçiş Adımları

### 1. Meta ve Agent Hizalaması

Durum:

- bu faz başlatıldı

Hedef:

- eski hazır bağlam izlerini kaldırmak
- Ümit/MinaGrow/MinaPlay bağlamını kanonik hale getirmek
- Konusu-Yorum referansını doğru yere yazmak

### 2. Kod Taşıma Kararı

Hedef:

- `Konusu-Yorum` içindeki çalışan uygulamanın `MinaGrow/MinaPlay` içine nasıl taşınacağına karar vermek

Seçenekler:

- doğrudan kopyalama ve repo temizliği
- Git geçmişiyle taşıma
- önce referans repo üzerinde temizlik, sonra taşıma

Bugünkü öneri:

- önce temiz taşıma planı çıkarılır
- sonra tek kapanış hedefiyle uygulama kodu `MinaPlay` içine alınır

### 3. Ürün Kimliği Temizliği

Hedef:

- görünen ürün adını `MinaPlay` olarak korumak
- açıklamalarda `MinaGrow` markasını doğru kullanmak
- `Konusu-Yorum` storage key'leri ve iç teknik adları için migration ihtiyacını değerlendirmek

Not:

- storage key'leri hemen değiştirmek kullanıcı verisini etkileyebilir
- değişiklik yapılacaksa migration veya geriye uyumluluk düşünülmelidir

### 4. Legacy Parça Ayrımı

Hedef:

- `src/routes/webhooks.ts`
- `src/services/zoho.ts`
- CRM tabanlı eski dosyalar

gibi parçaların ürün çekirdeğindeki rolünü netleştirmek.

Seçenekler:

- tamamen silmek
- ayrı legacy klasöre taşımak
- ayrı servis/repo adayı olarak notlamak

### 5. Ürün Sertleştirme

Hedef:

- mobil/tablet görsel doğrulama
- PWA offline davranışı
- mikrofon ve ses fallbackleri
- localStorage kapasite ve backup stratejisi
- test kapsamı

## Geçiş Riskleri

- çalışan prototipi taşırken davranış kırılabilir
- storage key adları değişirse yerel kayıtlar kaybolabilir
- asset yolları ve service worker cache listesi taşıma sırasında bozulabilir
- package scriptleri hedef klasörde yanlış çalışabilir
- Railway deploy yolu yeni repo yerleşimine göre güncellenmelidir
- meta ile gerçek kod farklı klasörlerde kalırsa agent yanlış bağlamla çalışabilir

## Kısa Kural

Önce hafıza doğru bağlama çekilir.

Sonra çalışan uygulama davranışı korunarak hedef ürün alanına taşınır.
