---
name: transition
description: Konusu-Yorum/V1 referansından MinaPlay V2 ürün omurgasına geçiş yönünü ve temel karar eksenlerini taşır.
created: 2026-04-17
updated: 2026-04-19
---

# Geçiş

## Özet

Bu belge, `Konusu-Yorum` ve V1 prototipinden `MinaPlay V2` ürün omurgasına geçişi tanımlar.

Ana karar:

- `Konusu-Yorum` referans ve prototip kaynaktır
- V1 yalnız fikir, davranış ve örnekleme referansıdır
- `MinaPlay V2` tamamen yeni ürün versiyonudur
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

`/Users/umitaydin/Documents/MinaGrow` içinde meta ve agent omurgası bulunur. `MinaPlay` klasörü hedef uygulama alanıdır; ancak V2 kararına göre bu alan eski uygulamayı doğrudan taşıyan bir kopya değil, yeni ürün omurgasının kurulacağı alandır.

## Geçişin Amacı

Geçişin amacı V1'i doğrudan ürün temeli olarak taşımak değildir.

Amaç:

- referans davranışı ve ürün derslerini korumak
- ürün adını ve hafızasını `MinaPlay`e çekmek
- `MinaPlay V2`nin temiz ve yeni bir ürün versiyonu olduğunu netleştirmek
- Pofi'yi merkezi davranış sistemi olarak netleştirmek
- repo içindeki meta ve agent yüzeylerini doğru bağlama taşımak
- V1'den yalnız gerekli davranış, veri ve özellik kararlarını V2'ye referans almak
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

### 2. V2 Kurulum Kararı

Hedef:

- V1 referansından hangi davranış ve özelliklerin V2'ye alınacağını, hangi UI/kod/asset parçalarının dışarıda kalacağını netleştirmek

Seçenekler:

- V1 davranışlarını dokümante edip V2'yi temiz kurmak
- belirli mod mantıklarını referans alıp UI/DOM/CSS'i yeniden yazmak
- eski kopyayı yalnız regresyon ve karşılaştırma kaynağı olarak tutmak

Bugünkü öneri:

- önce V2 tasarım sistemi ve MVP çekirdeği kurulur
- sonra V1'de işe yarayan davranışlar seçici biçimde yeni omurgaya uyarlanır

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

- 0-18 yaş genişleme vizyonunu bugünkü V2 MVP işinden ayrı tutmak
- okul öncesi, örgün öğretim, gönüllü eğitimci ağı ve engelli bireylerin okul süreci desteğini gelecek ürün yönü olarak korumak
- terapist/eğitimci dashboard'u, planlama, raporlama ve ev egzersizi sistemini bugünkü çekirdeğe karıştırmamak

## Geçiş Riskleri

- V1 davranışları yeniden kurulurken ürün değeri eksik aktarılabilir
- storage key adları değişirse yerel kayıtlar kaybolabilir
- asset yolları ve service worker cache listesi taşıma sırasında bozulabilir
- package scriptleri hedef klasörde yanlış çalışabilir
- Railway deploy yolu yeni repo yerleşimine göre güncellenmelidir
- Pofi state sistemi dağılırsa modlar arası davranış çakışabilir
- 0-18 ve eğitimci/terapist vizyonu erken uygulanırsa bugünkü çocuk yüzeyi karmaşıklaşabilir

## Kısa Kural

Önce hafıza doğru MinaPlay/Pofi bağlamına çekilir.

Sonra V1'den öğrenilen davranışlar V2 hedef ürün alanına seçici ve temiz biçimde yeniden kurulur.
