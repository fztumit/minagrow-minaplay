---
name: web
description: MinaPlay PWA yüzeyinin rolünü, ana kullanım akışını, modüllerini ve bugünkü yapı yönünü tanımlar.
created: 2026-04-17
updated: 2026-04-19
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
- Pofi presence katmanı
- modül view'leri
- Parent panel
- PWA manifest ve service worker davranışı

V2 ana ekranı MVP sürecinde yalnız aktif çekirdek modlara odaklanır. Tablet düzeni aktif MVP kartları için 2x2 grid olarak akar. Mobil düzen kartları küçültmez; tek kolon listeye dönüştürür. MVP'de aktif modlar Ana Ekran, Dokun, Eşleme, Ayna ve Uyku ile sınırlıdır. Cümle, Hikaye ve Ceee hazır olsa bile pasif veya "yakında" durumunda tutulabilir. Pofi kartlarda ve sahnede rehberdir; gerektiğinde büyüyebilir, dikkat çekebilir ve sonra geri çekilir.

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

MVP aktif view'leri:

- Ana ekran
- `view-touch`
- `view-match`
- `view-mirror`
- `view-sleep`
- `view-parent`

MVP dışı veya pasif view'ler:

- `view-sentence`
- `view-story`
- `view-peekaboo`
- gelişmiş ebeveyn analizleri

## Ana Kullanım Akışı

1. Çocuk veya ebeveyn uygulamayı açar.
2. Ana ekranda MVP aktif modları görünür; MVP dışı modlar akışı bölmeyecek şekilde pasif tutulur.
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
- veriyi yalnız sayı olarak değil, kısa yorum ve yönlendirme ile anlamlandırmak

İlke:

- güçlü olabilir ama çocuk yüzeyini boğmaz
- ileride terapist/eğitimci araçları ayrı katmanlarda büyüyebilir
- ebeveyn 5 saniyede ilerleme, tekrar ihtiyacı ve kayıt durumunu anlayabilmelidir
- panel destekleyici ve yönlendirici dil kullanır; başarısız, yetersiz, eksik gibi yargılayıcı ifadeler kullanılmaz
- panel çocuk ekranından daha sade, daha ciddi ve daha az renkli ayrılır; teknik veya korkutucu görünmez

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

## V2 Ana Ekran Layout Kararı

Mevcut ana ekran hiyerarşisi doğru kabul edilir; V2 tasarım sisteminde bu hiyerarşi değiştirilmez, yalnız görsel sakinlik ve tutarlılık güçlendirilir.

Kurallar:

- arka plan sakin ve yumuşaktır
- kartlar beyaz veya beyaza yakın yüzey üzerine çok hafif pastel ton taşır
- her kartta tek ana ikon sol tarafta belirgin durur
- başlık ve kısa açıklama sade, okunabilir ve orta/ana metin alanında kalır
- Pofi her kartta yalnız 1 kez görünür
- Pofi sabit biçimde sağ alt köşede küçük yardımcı olarak durur
- kartlar kalabalık hissettirmez
- gölgeler çok hafif ve yumuşaktır
- çocuk ekranında modern kalite hissi korunur ama uyarım artırılmaz

Responsive karar:

- tablet: 2x2 grid
- mobil: tek kolon liste
- layout sıkıştırılmaz; reflow yapılır
- aynı hiyerarşi, aynı boşluk hissi ve aynı Pofi konumu korunur

## Ortak Mod Ekranı Kalıbı

Tüm mod ekranları benzer bir düzen mantığı kullanır.

Kalıp:

- üstte kısa yönlendirme
- ortada tek görev alanı
- sağ altta küçük Pofi
- altta kısa geri bildirim

Kurallar:

- her mod kendi oyunsal davranışını taşıyabilir ama ekran ritmi tutarlı kalır
- çocuk her modda "neredeyim ve ne yapacağım" sorusunu hızlıca anlayabilmelidir
- Pofi rehberlik eder, görev alanını ele geçirmez
- geri bildirim kısa, yumuşak ve yargısız olur

## Çocuk Ekranı Anayasası

Bu kurallar opsiyonel değildir.

- her ekranda yalnız 1 görev, 1 mesaj ve 1 görsel odak bulunur
- aynı anda birden fazla görev veya ikinci dikkat odağı sunulmaz
- "yanlış yaptın" gibi başarısızlık dili kullanılmaz
- Pofi üzülebilir, şaşırabilir veya esprili tepki verebilir; ancak negatif geri bildirim vermez
- tercih edilen dil "bir daha deneyelim" ve "hadi birlikte yapalım" çizgisindedir
- metinler mümkün olduğunca 3-4 kelimeyi aşmaz
- sesli yönlendirme ve tek komutlu ifade tercih edilir
- küçük buton kullanılmaz; yanlış dokunma riski azaltılır
- aynı anda yalnız 1 hareketli öğe bulunur
- ani hareket, hızlı blink ve sürpriz UI değişimi kullanılmaz
- aynı aksiyon aynı sonucu, aynı durum aynı tepkiyi üretir
- her akış mümkün olduğunca 2-3 adımda tamamlanır
- ekran "burada güvendeyim, birlikte yapıyoruz" hissi vermelidir

## Ebeveyn Paneli Anayasası

Parent panel yalnız ayar ekranı değildir; ebeveyne güven, kontrol ve anlam sunan rehber alanıdır.

- panelin temel hissi "çocuğum ilerliyor ve doğru yerdeyim" olmalıdır
- veri yorumla birlikte sunulur; yalnız sayı gösterilmez
- her önemli veri kısa öneri üretir
- ebeveyn içerik ekleyebilir, ses kaydı yapabilir ve ilerlemeyi görebilir
- ebeveyn kontrol hisseder ama çocuğun akışını bozacak müdahaleye zorlanmaz
- ilerleme, tekrar ihtiyacı ve kayıt durumu tek bakışta görünür
- gizlilik ve saygı korunur; gereksiz detaydan kaçınılır

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
