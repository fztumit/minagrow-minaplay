---
name: business
description: MinaPlay ürün bağlamını, hedef kullanıcıyı, operasyonel gerçekliği ve ürün yönünü tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Business Bağlamı

Bu dosya, `MinaPlay` ürününün iş ve kullanım bağlamını görünür kılar. `MinaGrow` üst marka/repo bağlamıdır; ürün adı `MinaPlay`dir.

## Ürün Ailesi

- Üst bağlam: `MinaGrow`
- Ürün: `MinaPlay`
- Referans prototip: `Konusu-Yorum`
- Ürün tipi: çocuk odaklı konuşma, taklit, duygu ve etkileşim PWA'sı
- Ana davranış sistemi: `Pofi`

## Hedef Kullanıcı

Başlangıç odağı:

- 0-5 yaş çocuk

Destekleyici kullanıcı:

- ebeveyn
- bakım veren
- uygulamayı kuran veya ayarlayan yetişkin

Uzun vadeli vizyon:

- 0-18 yaş aralığında gelişim ve eğitim desteği
- okul öncesi ve örgün öğretim desteği
- engelli bireylerin okul süreci desteği
- gönüllü eğitimci, terapist ve okul destek aktörleriyle kontrollü ağ

## Ürün İhtiyacı

Çocukların konuşma, taklit, duygu ve etkileşim pratiğinde kısa, tekrar edilebilir, sakin ve görsel olarak anlaşılır etkileşimlere ihtiyaç vardır.

`MinaPlay` bu ihtiyacı şu yollarla karşılar:

- dokunulan nesnenin kelimesini veya sesini tekrar eder
- eşleme ve cümle kurma gibi basit etkileşimleri destekler
- Pofi ile yönlendirme, tepki, egzersiz ve sakinleşme davranışları üretir
- ebeveyn sesini TTS yerine kullanabilir
- Ayna modunda ağız, dil ve yüz egzersizlerini gösterir
- Uyku moduyla sakin kapanış alanı sunar
- Parent panel içinde analiz, kontrol ve izleme yüzeyi sağlar

## İş Değeri

Ürünün değeri yalnız oyun olması değildir.

Asıl değer:

- konuşma ve taklit pratiğini gündelik küçük temaslara indirmesi
- çocuğa başarısızlık hissi vermeden tekrar alanı açması
- ebeveyni sürece yük bindirmeden dahil etmesi
- Parent panelde hangi bölümde ne oynandığını, doğru/yanlış denemeleri, tamamlanan egzersizleri, tekrar sayısını ve oturum sıklığını görünür kılabilmesi
- mobil/tablet üzerinde hızlı açılan bir PWA olması
- ileride terapist/eğitimci planlama ve takip sistemine genişleyebilecek yapı taşıması

## Bugünkü Teknik-Gerçeklik Dengesi

Bugünkü ürün erken aşama ama çalışan bir PWA prototipine sahiptir.

Bu nedenle öncelik:

- çalışan davranışı korumak
- ürün kimliğini temizlemek
- Pofi davranış sistemini kanonik hale getirmek
- kodu doğru hedef alana taşımak
- test ve deploy hattını kırmamak
- çocuk deneyimini kalabalıklaştırmadan ebeveyn araçlarını güçlendirmek

## Ürün Sınırları

MinaPlay:

- tıbbi tanı aracı değildir
- terapi yerine geçmez
- çocuk gelişimini, konuşma pratiğini ve okul sürecini destekleyen dijital yüzeydir
- veri güvenliği ve ebeveyn güveni hassasiyetiyle büyütülmelidir
- eğitimci/terapist ağı bugünkü çekirdeğe erken eklenmemelidir

## Yakın Ürün Hedefleri

- Konusu-Yorum referansını MinaPlay ürün omurgasına taşımak
- PWA adlandırmasını ve assetleri temizlemek
- Pofi PNG emoji/state sistemini netleştirmek
- Parent panel analiz ve kontrol yönünü ürün hafızasında tutmak
- mobil/tablet görsel deneyimi iyileştirmek
- legacy CRM parçalarını ayırmak
- offline deneyimi netleştirmek
