---
name: web
description: MinaPlay PWA yüzeyinin rolünü, ana kullanım akışını, modüllerini ve bugünkü yapı yönünü tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Web

## Özet

Bu belge `MinaPlay` PWA yüzeyinin rolünü ve bugünkü kanonik bilgi mimarisini görünür kılar.

Ana yorum:

- web yüzeyi ürünün bugünkü ana deneyimidir
- hedef cihaz telefon ve tablettir
- başlangıç odağı 0-5 yaş çocuk kullanıcıdır
- ebeveyn destekleyici role sahiptir ve ayarları ayrı katmandan yönetir
- ekran dili Türkçe, sade, sakin ve düşük baskılı olmalıdır
- ana etkileşim dokunma, dinleme, taklit, duygu tepkisi ve tekrar üzerine kuruludur

## Ürün Yüzeyi

PWA ana kabuğu `public/index.html` içinde yaşar.

Ana parçalar:

- ana ekran kartları
- Pofi davranış ve görsel ifade alanları
- modül view'leri
- Parent panel
- PWA manifest ve service worker davranışı

Ana ekran 6 ana kart gösterir. Kartlar 3x2 düzendedir. Pofi kartlarda rehberdir, ana içerik değildir. İkon veya ana görsel her zaman Pofi'den daha baskın olmalıdır. Pofi standart olarak kartların sağ-alt köşesinde durur. Ceee bonus kart/strip olarak ayrı tutulur ve 6 ana kart sayısına dahil edilmez.

## Bilgi Mimarisi

Ana view eşleşmeleri:

- Dokun Dinle / Touch & Listen: `view-touch`
- Eşleme / Match: `view-match`
- Cümle / Sentence: `view-sentence`
- Hikaye / Story: `view-story`
- Ayna / Mirror: `view-mirror`
- Uyku / Sleep: `view-sleep`
- Ceee / Peekaboo: `view-peekaboo`
- Parent panel: `view-parent`

## Ana Kullanım Akışı

1. Çocuk veya ebeveyn uygulamayı açar.
2. Ana ekranda 6 temel mod ve ayrı bonus Ceee alanı görünür.
3. Pofi mevcut bağlama uygun tek aktif state ile rehberlik eder.
4. Çocuk seçtiği modda dokunur, eşler, cümle kurar, hikaye dinler, taklit eder veya sakinleşir.
5. Yanlış veya hedef dışı etkileşim cezalandırılmaz; Pofi yumuşak yönlendirme yapar.
6. Ebeveyn ayarları ve içerik yönetimi Parent panel içinde ayrı katmanda tutulur.

## Modül Yorumu

### Dokun

Rol:

- çocuğun nesneye dokunup kelime veya ses duymasını sağlamak
- Pofi'nin hedef nesneyi göstermesi veya yönlendirmesi
- doğru hedefte olumlu tepki ve ilerleme üretmek

İlke:

- hedef dışı dokunuş başarısızlık hissi yaratmaz
- ses çalabilir, Pofi yumuşak yönlendirmeye devam eder
- yağmur, kar, rüzgar, dolu, şimşek/yıldırım, pus ve gökkuşağı gibi efektler düşük uyarımlı kalır

### Eşleme

Rol:

- Dokun'dan ayrı bir ana oyun olarak hedef seçme ve eşleme pratiği sağlamak
- Pofi'nin bir hedef seçmesi ve çocuğun aynı nesneyi bulması
- odak + raf/set mantığını taşımak

Not:

- mevcut guided set-temelli oyun bu modda yaşar

### Cümle

Rol:

- çocuğun iki görsel seçerek basit cümle kurmasını sağlamak
- seçilen görselleri birleştirip cümle olarak dinletmek

Akış:

- seç
- birleştir
- dinle

Pofi burada yardımcı ve rehber olabilir; ana iş iki görsel seçimi ve cümle kurmadır.

### Hikaye

Rol:

- kısa, eğitsel ve kolay algılanır hikayeleri dinletmek
- kelimeden cümleye ve basit anlatıya geçişi desteklemek

Akış:

- dinle
- tekrar et
- sonraki

Korunacak parçalar:

- kolay seviye
- pack yapısı
- ebeveyn tarafında kolay cümle ekleme/silme
- story pack ve kayıt ayarları

Pofi anlatıcı veya rehber rolündedir.

### Ayna

Rol:

- Pofi'nin yüz, ağız ve dil egzersizini göstermesi
- çocuğun kamera aynasıyla kendini izleyip taklit etmesi

İlke:

- katı algılama yoktur
- zaman bazlı ödül vardır
- egzersiz sırasında yalnız egzersiz yüzü gösterilir
- ödül yüzü egzersiz tamamlandıktan sonra görünür

Akış:

- egzersiz yüzünü göster
- bekle
- tamamlanınca ödül ver

### Uyku

Rol:

- sakin, düşük uyarımlı gece sahnesi sağlamak
- ay, yıldızlar, yavaş hareket eden gökyüzü öğeleri ve uykulu/uyuyan Pofi kullanmak

İlke:

- çocuk yüzeyinde minimum kontrol olmalı
- ekran kilitleme / Screen Lock ileride değerlendirilebilir
- akış sleepy -> sleep olarak korunur
- rastgele duygu veya guide state çalışmaz

### Ceee

Rol:

- bonus mini oyun olarak Pofi'nin peekaboo/ce-ee halini kullanmak
- ana 6 karttan ayrı kalmak

İlke:

- silinmez
- çekirdek navigasyon içinde ana mod gibi davranmaz

### Parent Panel

Rol:

- ebeveyn ayarlarını çocuk yüzeyinden ayırmak
- içerik, kayıt, kullanım sınırı ve ilerleme gibi destek araçlarını yönetmek
- uygulamanın kullanım analizini göstermek
- hangi bölümde neler oynandığını, neler yapıldığını, doğru/yanlış denemeleri, tamamlanan egzersizleri, tekrar sayısını ve oturum sıklığını görünür yapmak

İlke:

- güçlü olabilir ama çocuk yüzeyini boğmaz
- ileride terapist/eğitimci araçları ayrı katmanlarda büyüyebilir

Kontrol adayları:

- kullanım limitleri
- modül kontrolü
- ekran kilidi / screen lock

Çocuk yapamaz:

- modülden kontrolsüz çıkış
- dış uygulama açma
- ayar değiştirme

## UX İlkeleri

- büyük dokunma alanları kullanılır
- çocuk ekranı mümkün olduğunca tek amacı taşır
- yazılar kısa tutulur
- gereksiz açıklama ve ayar kalabalığı azaltılır
- animasyon dikkat çekici ama yorucu olmayan seviyede kalır
- ebeveyn araçları ayrı katmanda tutulur
- kamera, mikrofon, ses ve tarayıcı desteği durumları açıkça ifade edilir
- olumsuz geri bildirim verilmez
- tekrar ve yumuşak yönlendirme ana yöntemdir

## Gelecek Eğitim Katmanları

MinaPlay ileride 0-18 yaş aralığına, okul öncesi ve örgün öğretim desteğine, gönüllü eğitimci ağına ve engelli bireylerin okul süreci desteğine genişleyebilir.

Bu gelecek katmanlar bugünkü 0-5 çocuk yüzeyine karıştırılmaz. Eğitimci, terapist, okul süreci ve raporlama araçları ayrı roller ve ayrı paneller olarak tasarlanmalıdır.

Gelecek sistem ilkesi:

- çocuk basit etkileşim yüzeyini kullanır
- ebeveyn kontrol ve izleme yapar
- terapist planlama ve takip yapar
- gönüllü eğitimciler okul ve ev sürecinde destek ağına dahil olabilir

Gelecek terapi/eğitim modülleri:

- Dil ve Konuşma Terapisi
- Fizyoterapi
- Özel Eğitim
- Floortime
- Ergoterapi

Ev egzersizi sistemi kısa, anlaşılır ve tekrar edilebilir oturumlara dayanmalıdır. Hedef oturum süresi 2-5 dakika aralığında düşünülür.

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

- `Harika!`
- `Süper!`
- `Bir daha deneyelim.`
- `Hadi dokun.`

## Yakın Web Riskleri

- ebeveyn ayarları çocuk yüzeyini kalabalıklaştırabilir
- Ceee bonus konumu ana modlarla karışabilir
- Ayna modunda ödül yüzü egzersiz sırasında erken görünürse akış bozulabilir
- Uyku modunda rastgele duygu state'leri sakinliği bozabilir
- Türkçe karakterleri olmayan metinler ürün kalitesini düşürebilir

## Kısa Kural

Çocuk yüzeyi önce gelir.

Ebeveyn, eğitimci ve terapist araçları ürünü güçlendirir, ama ana çocuk deneyiminin önüne geçmez.
