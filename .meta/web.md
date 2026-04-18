---
name: web
description: MinaPlay PWA yüzeyinin rolünü, ana kullanım akışını, modüllerini ve bugünkü yapı yönünü tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Web

## Özet

Bu belge `MinaPlay` PWA yüzeyinin rolünü ve bugünkü kanonik yönünü görünür kılar.

Ana yorum:

- web yüzeyi ürünün kendisidir
- ana hedef cihaz telefon ve tablettir
- kullanıcı çocuktur; ebeveyn destekleyici role sahiptir
- ekran dili sade, sıcak ve doğrudan olmalıdır
- ana etkileşim dokunma, dinleme ve tekrar üzerine kuruludur

## Ürün Yüzeyi

PWA ana kabuğu `public/index.html` içinde yaşar.

Ana parçalar:

- hero / maskot alanı
- günlük kelime kartı
- günlük aktivite kartı
- modül tabları
- konuşma oyunu
- hikayeler
- uyku modu
- aile avatarları

## Ana Kullanım Akışı

1. Çocuk veya ebeveyn uygulamayı açar.
2. Maskot kısa bir yönlendirme verir.
3. Günün kelimesi ve günlük aktivite hedefleri görünür.
4. Çocuk `Konuşma Oyunu` içinde nesneye dokunur.
5. Kelime sesli tekrar edilir.
6. Etkileşim günlük aktiviteye yazılır.
7. İstenirse hikaye modülüne geçilir.
8. İstenirse ebeveyn kelime veya cümle için kendi sesini kaydeder.
9. Uyku zamanı için uyku modu açılabilir.
10. Aile avatarları yerel olarak tanımlanabilir.

## Modül Yorumu

### Konuşma Oyunu

Rol:

- çocuğun kelimeye dokunup duymasını sağlamak
- kısa tekrarlarla konuşma pratiğini başlatmak

Bugünkü kelimeler:

- `su`
- `anne`
- `baba`
- `top`
- `araba`
- `kitap`
- `elma`
- `süt`
- `ekmek`

Özel davranış:

- `su` için görsel su odağı ve tekrar davranışı önemlidir

### Ebeveyn Ayarları

Rol:

- tekrar sayısını ayarlamak
- TTS yerine ebeveyn sesi kullanabilmek
- kayıtları yedeklemek ve geri yüklemek
- ilerleme sayaçlarını görmek

İlke:

- ebeveyn araçları güçlü olabilir ama çocuk deneyimini boğmamalıdır

### Hikayeler

Rol:

- kelimeden cümleye geçişi desteklemek
- kolay ve standart seviyelerle gelişim basamağı kurmak

Ana alt parçalar:

- seviye seçimi
- paket seçimi
- kolay cümle ekle/sil
- hikaye ses kaydı
- paket ilerleme
- paket karşılaştırma

### Günlük Kelime

Rol:

- her gün küçük bir odak kelime vermek
- ebeveynin bu kelimeyi kendi sesiyle kaydetmesini sağlamak

### Günlük Aktivite

Rol:

- çocuğun gün içinde küçük bir hedefi tamamlamasını görünür kılmak

Hedefler:

- 3 kelime
- 1 hikaye
- 1 etkileşim

### Uyku Modu

Rol:

- uyarıcı olmayan, sakin bir kapanış deneyimi sağlamak
- uyuyan maskot ve düşük tempolu seslerle destek olmak

### Aile Avatarları

Rol:

- aile üyelerini çocuğun tanıyabileceği görsel kayıtlar olarak eklemek

## UX İlkeleri

- büyük dokunma alanları kullanılır
- çocuk ekranı mümkün olduğunca tek amacı taşır
- yazılar kısa tutulur
- gereksiz açıklama ve ayar kalabalığı azaltılır
- animasyon dikkat çekici ama yorucu olmayan seviyede kalır
- ebeveyn araçları ayrı bloklarda tutulur
- mikrofon izni ve tarayıcı desteği durumları açıkça ifade edilir

## Erişilebilirlik ve Cihaz Duyarlılığı

Kanonik hedef:

- telefon dikey kullanım
- tablet yatay/dikey kullanım
- PWA kurulum sonrası ana ekrandan açılma

Dikkat edilecek noktalar:

- buton metinleri taşmamalı
- kayıt butonları net olmalı
- çocuk dokunmalarında hedef alanlar yeterli büyüklükte kalmalı
- uyku modu görseli düşük ışıkta rahatsız etmemeli
- ses ve mikrofon izinleri başarısız olursa kullanıcı kaybolmamalı

## Test Kancaları

PWA yüzeyi test edilebilirlik için özel kancalar taşır:

- `window.render_game_to_text`
- `window.advanceTime(ms)`
- DOM data attribute state'leri

Bu kancalar geliştirici doğrulaması içindir. Kullanıcı deneyimini açıklayan ürün metnine dönüştürülmez.

## İçerik Dili

Ürün dili:

- Türkçe
- kısa
- yumuşak
- çocuğa doğrudan ve teşvik edici
- ebeveyne net ve açıklayıcı

Örnek ton:

- `Hadi dokun.`
- `Aferin.`
- `Tekrar söyle.`
- `Bugünün kelimesini ebeveyn sesiyle kaydedin.`

## Yakın Web Riskleri

- ebeveyn ayarları konuşma oyunu ekranını kalabalıklaştırabilir
- ses kayıt panelleri mobilde fazla yer kaplayabilir
- skill client ekran görüntüsü en büyük canvas'ı yakaladığı için bazı görsel doğrulamalar yanıltıcı olabilir
- Türkçe karakterleri olmayan bazı metinler ürün kalitesini düşürebilir
- kolay cümle telaffuzunda TTS motoru tarayıcıya göre farklı davranabilir

## Kısa Kural

Çocuk ekranı önce gelir.

Ebeveyn araçları ürünü güçlendirir, ama ana deneyimin önüne geçmez.
