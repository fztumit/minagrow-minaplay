---
name: origins
description: MinaPlay fikrinin çıkışını, Konusu-Yorum prototipinden gelen dersleri ve MinaGrow yönüne dönüşümünü taşır.
created: 2026-04-17
updated: 2026-04-18
---

# Kökenler

## Özet

`MinaPlay` fikrinin pratik çıkışı `Konusu-Yorum` adıyla başlayan küçük bir konuşma oyunu isteğidir.

İlk niyet:

- çocuk konuşmayı öğrenirken dokunacağı nesnelerle kelimeyi duysun
- telefon ve tablette çalışsın
- `baba`, `anne`, `su` gibi temel kelimeler tekrarla pekişsin
- arka plan dikkat dağıtmasın
- karakter ve nesneler çocukla iletişim kursun
- ebeveyn gerektiğinde kendi sesiyle destek verebilsin

Bu fikir hızlıca çalışan bir PWA prototipine dönüştü. Bugünkü kanonik ürün yönü ise MinaPlay adı altında Pofi davranış sistemi, 0-5 başlangıç odağı ve ileride 0-18 yaşa genişleyebilen eğitim/gelişim destek vizyonudur.

## İlk Ürün Fikri

İlk cümle şuydu:

`Konuşu-yorum gibi özel bir isim bulalım.`

Bu cümle, ürünün iki yönünü birlikte taşıyordu:

- konuşma öğrenimini oyunlaştırmak
- çocuğun yorumlamadan, karmaşadan ve uzun yönergelerden uzak, doğrudan dokunarak öğrenmesini sağlamak

İlk oyun fikri şuna dayanıyordu:

- baba karakteri ile `baba`
- anne karakteri ile `anne`
- dökülen su bardağı ile `su`
- dokununca kelimeyi tekrar eden nesneler
- çocukla göz teması kuran sıcak karakterler

Bu ilk çizgi, bugünkü MinaPlay yönünde daha yapılandırılmış bir gelişim destek sistemine dönüştü.

## Konusu-Yorum Prototipi

Referans repo:

- `/Users/umitaydin/Documents/Konusu-Yorum`

Bu repo ilk aşamada Express TypeScript backend yapısından evrilmiş, sonra PWA ağırlıklı bir çocuk uygulamasına dönüşmüştür.

Öne çıkan kazanımlar:

- mobil/tablet uyumlu konuşma oyunu
- PWA shell
- modüler TypeScript frontend
- hikaye modülü
- kolay cümle editörü
- ebeveyn ses kaydı
- kayıt yedekleme ve geri yükleme
- günlük kelime
- günlük aktivite kartı
- uyku modu
- aile avatarları
- Pofi benzeri rehberlik ihtiyacı
- Playwright ve Vitest doğrulama hattı

## Ürün Dönüşümü

`Konusu-Yorum` adı fikir ve prototip kökenini taşır.

`MinaGrow` üst marka/repo bağlamını, `MinaPlay` ise ürünleşme yönünü taşır.

Bugünkü yorum:

- marka ve üst bağlam: `MinaGrow`
- uygulama adı: `MinaPlay`
- prototip referansı: `Konusu-Yorum`
- ana davranış sistemi: `Pofi`

Bu ayrım önemlidir; çünkü prototip adını ürün kimliğiyle karıştırmak ileride belge, deploy, repo ve kullanıcı dili üzerinde dağınıklık üretir.

## Pofi'nin Köken Rolü

İlk fikirde karakterler çocukla iletişim kuran sevimli görsel varlıklar olarak düşünülüyordu.

Bugünkü MinaPlay yönünde Pofi yalnız dekoratif bir karakter değildir. Pofi:

- çocuğu yönlendirir
- doğru ve hedef dışı etkileşimlere tepki verir
- ağız, dil ve yüz egzersizlerini gösterir
- uyku modunda sakinleşir
- her modda rolüne göre görsel ifade değiştirir

Bu yüzden Pofi, MinaPlay içinde davranışsal etkileşim sistemi olarak ele alınır.

## Öğrenilen Dersler

### Çalışan Şeyler

- dokun ve söyle akışı doğal çalışır
- kelime + animasyon birleşimi çocuk için güçlüdür
- `su` gibi özel bir nesne tekrar davranışı için iyi örnektir
- kısa hikayeler kelimeden cümleye geçiş sağlar
- kolay seviye iki kelimeyle başlamak için iyi bir eştir
- ebeveyn sesi TTS'e göre daha sıcak ve kişisel bir deneyim verebilir
- günlük aktivite kartı küçük hedefleri görünür kılar
- Parent panel analizleri ebeveyne hangi bölümde ne yapıldığını anlatmak için değerli olabilir

### Dikkat Gerektiren Şeyler

- ebeveyn araçları artınca ekran kalabalıklaşabilir
- ses kayıtları localStorage içinde büyüyebilir
- browser ses, kamera ve mikrofon API'leri cihazlara göre değişebilir
- Türkçe telaffuz TTS motoruna bağlı olarak farklılaşabilir
- PWA offline davranışı daha açık hale gelmelidir
- Pofi state sistemi merkezi tutulmazsa üst üste render veya hızlı duygu değişimi oluşabilir
- legacy CRM parçaları ürün çekirdeğinden ayrılmalıdır

## MinaPlay'in Ürün Karakteri

MinaPlay bir eğitim paneli gibi başlamaz; çocuğun kısa temaslarla kullanacağı sakin, yumuşak ve premium hissiyatlı bir PWA olarak başlar.

Başlangıç karakteri:

- 0-5 yaş odağı
- az metin
- büyük dokunma alanları
- kısa ses tekrarları
- Pofi davranış rehberliği
- küçük günlük hedefler
- ebeveyn sesi desteği
- uyku, taklit ve duygu etkileşimi

İlerleyen vizyon:

- 0-18 yaş aralığına genişleme
- okul öncesi ve örgün öğretim desteği
- engelli bireylerin okul sürecinde desteklenmesi
- ebeveyn, terapist, gönüllü eğitimci ve okul destek aktörleri arasında kontrollü ağ
- kişiselleştirilmiş planlar, ev egzersizleri, tekrar takibi ve raporlama

## Kısa Kural

Köken `Konusu-Yorum`, ürün yönü `MinaPlay`, üst bağlam `MinaGrow`dur.

Prototipin çalışan değeri korunur; ürün hafızası MinaPlay ve Pofi kanonuyla temizlenir.
