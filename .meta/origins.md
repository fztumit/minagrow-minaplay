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
- herkes kendine özel karakterler oluşturabilsin
- telefon ve tablette çalışsın
- `baba`, `anne`, `su` gibi temel kelimeler tekrarla pekişsin
- arka plan dikkat dağıtmasın
- karakter ve nesneler çocukla iletişim kursun

Bu fikir hızlıca çalışan bir PWA prototipine dönüştü.

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
- çocukla göz teması kuran sevimli karakterler

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
- maskot rehberliği
- Playwright ve Vitest doğrulama hattı

## Ürün Dönüşümü

`Konusu-Yorum` adı fikir ve prototip kökenini taşır.

`MinaGrow / MinaPlay` ise ürünleşme yönünü taşır.

Bugünkü yorum:

- marka ailesi `MinaGrow`
- uygulama adı `MinaPlay`
- prototip referansı `Konusu-Yorum`

Bu ayrım önemlidir; çünkü prototip adını ürün kimliğiyle karıştırmak ileride belge, deploy, repo ve kullanıcı dili üzerinde dağınıklık üretir.

## Öğrenilen Dersler

### Çalışan Şeyler

- dokun ve söyle akışı doğal çalışır
- kelime + animasyon birleşimi çocuk için güçlüdür
- `su` gibi özel bir nesne tekrar davranışı için iyi örnektir
- kısa hikayeler kelimeden cümleye geçiş sağlar
- kolay seviye iki kelimeyle başlamak için iyi bir eştir
- ebeveyn sesi TTS'e göre daha sıcak ve kişisel bir deneyim verebilir
- günlük aktivite kartı küçük hedefleri görünür kılar

### Dikkat Gerektiren Şeyler

- ebeveyn araçları artınca ekran kalabalıklaşabilir
- ses kayıtları localStorage içinde büyüyebilir
- browser ses ve mikrofon API'leri cihazlara göre değişebilir
- Türkçe telaffuz TTS motoruna bağlı olarak farklılaşabilir
- PWA offline davranışı daha açık hale gelmelidir
- legacy CRM parçaları ürün çekirdeğinden ayrılmalıdır

## MinaPlay'in Ürün Karakteri

MinaPlay bir eğitim paneli gibi değil, çocuğun kısa temaslarla kullanacağı sıcak bir PWA gibi düşünülür.

Ana karakter:

- az metin
- büyük dokunma alanları
- kısa ses tekrarları
- sevimli maskot
- küçük günlük hedefler
- ebeveyn sesi desteği
- aile ve uyku gibi günlük yaşam bağları

## Kısa Kural

Köken `Konusu-Yorum`, ürün yönü `MinaGrow / MinaPlay`dir.

Prototipin çalışan değeri korunur; ürün hafızası MinaPlay adıyla temizlenir.
