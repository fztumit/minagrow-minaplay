---
name: transition
description: Konusu-Yorum referans uygulamasından MinaPlay ürün omurgasına geçiş yönünü ve temel karar eksenlerini taşır.
created: 2026-04-17
updated: 2026-04-18
---

# Geçiş

## Özet

Bu belge, çalışan `Konusu-Yorum` uygulamasından `MinaPlay` ürün omurgasına geçişi tanımlar.

Ana karar:

- `Konusu-Yorum` referans ve prototip kaynaktır
- `MinaGrow` repo kökü ürün hafızasını ve hedef yerleşimi taşır
- `MinaPlay` uygulama adı ve hedef ürün kimliğidir
- `Pofi` davranışsal etkileşim sistemidir
- eski hazır bağlam ve eski karakter adları görünür ürün dili için geçerli değildir

## Bugünkü Durum

`/Users/umitaydin/Documents/Konusu-Yorum` içinde çalışan bir PWA uygulaması vardır.

Çalışan veya referans alınan parçalar:

- Dokun/Dinle çekirdeği
- hikaye modülü
- kolay cümle editörü
- özel ses kayıtları
- günlük kelime ve günlük aktivite
- uyku modu
- aile/avatar benzeri yerel destek yüzeyleri
- PWA manifest ve service worker
- Railway deploy uyumu
- build/lint/test/e2e hattı

`/Users/umitaydin/Documents/MinaGrow` içinde ise meta ve agent omurgası bulunur. `MinaPlay` klasörü hedef uygulama alanı olarak açılmıştır fakat ürün kodu henüz bu alana taşınmamıştır.

## Geçişin Amacı

Geçişin amacı çalışan ürünü sıfırdan yazmak değildir.

Amaç:

- referans davranışı korumak
- ürün adını ve hafızasını `MinaPlay`e çekmek
- Pofi'yi merkezi davranış sistemi olarak netleştirmek
- repo içindeki meta ve agent yüzeylerini doğru bağlama taşımak
- uygulama kodunu ileride temiz bir hedef alana almak
- legacy CRM parçalarını ürün çekirdeğinden ayırmak
- eski karakter ve gövde assetlerini görünür ürün dilinden çıkarmak

## İsim Ayrımı

Doğru yorum:

- `Konusu-Yorum`: ilk fikir ve çalışan referans repo
- `MinaGrow`: marka/repo üst bağlamı
- `MinaPlay`: ürün adı
- `Pofi`: ana davranışsal etkileşim sistemi

Yanlış yorum:

- `Konusu-Yorum`u kalıcı ürün adı gibi taşımak
- eski karakter adlarını görünür ürün dili gibi kullanmak
- Pofi'yi yalnız dekoratif karakter gibi ele almak
- `MinaPlay`i boş bir alt klasör olarak bırakıp meta hafızasını ayrı yerde büyütmek

## Geçiş Adımları

### 1. Meta ve Agent Hizalaması

Durum:

- devam ediyor

Hedef:

- eski hazır bağlam izlerini kaldırmak
- MinaPlay, Pofi ve Konusu-Yorum ayrımını kanonik hale getirmek
- 0-5 başlangıç odağı ve 0-18 uzun vadeli vizyonu doğru ayırmak

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
- Pofi adını ve kimliğini korumak
- eski karakter adlarını yalnız legacy/geçiş bağlamında tutmak
- `Konusu-Yorum` storage key'leri ve iç teknik adları için migration ihtiyacını değerlendirmek

Not:

- storage key'leri hemen değiştirmek kullanıcı verisini etkileyebilir
- değişiklik yapılacaksa migration veya geriye uyumluluk düşünülmelidir

### 4. Pofi Sistem Geçişi

Hedef:

- eski gövde katmanlarını kullanmamak
- PNG emoji sistemini ana kaynak yapmak
- `/assets/pofi_emoji` yapısını kanonik kabul etmek
- Pofi state kategorilerini merkezi davranış sistemine bağlamak

### 5. Legacy Parça Ayrımı

Hedef:

- `src/routes/webhooks.ts`
- `src/services/zoho.ts`
- CRM tabanlı eski dosyalar
- eski karakter/asset katmanları

gibi parçaların ürün çekirdeğindeki rolünü netleştirmek.

Seçenekler:

- tamamen silmek
- ayrı legacy klasöre taşımak
- ayrı servis/repo adayı olarak notlamak

### 6. Gelecek Eğitim ve Terapi Destek Vizyonu

Hedef:

- 0-18 yaş genişleme vizyonunu bugünkü taşıma işinden ayrı tutmak
- okul öncesi, örgün öğretim, gönüllü eğitimci ağı ve engelli bireylerin okul süreci desteğini gelecek ürün yönü olarak korumak
- terapist/eğitimci dashboard'u, planlama, raporlama ve ev egzersizi sistemini bugünkü çekirdeğe karıştırmamak

## Geçiş Riskleri

- çalışan prototipi taşırken davranış kırılabilir
- storage key adları değişirse yerel kayıtlar kaybolabilir
- asset yolları ve service worker cache listesi taşıma sırasında bozulabilir
- package scriptleri hedef klasörde yanlış çalışabilir
- Railway deploy yolu yeni repo yerleşimine göre güncellenmelidir
- Pofi state sistemi dağılırsa modlar arası davranış çakışabilir
- 0-18 ve eğitimci/terapist vizyonu erken uygulanırsa bugünkü çocuk yüzeyi karmaşıklaşabilir

## Kısa Kural

Önce hafıza doğru MinaPlay/Pofi bağlamına çekilir.

Sonra çalışan uygulama davranışı korunarak hedef ürün alanına taşınır.
