---
name: themes
description: MinaPlay PWA yüzeyindeki görsel dil, tema, renk, hareket, Pofi ve çocuk ekranı ilkelerini tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Tema

## Özet

`MinaPlay`in tema dili sakin, yumuşak, düşük uyarımlı ve premium hissiyatlıdır.

Amaç:

- çocuk için güvenli ve davetkar bir ekran üretmek
- ebeveyn için okunur ve kontrollü bir düzen sağlamak
- dikkat çekici ama yorucu olmayan bir görsel ritim kurmak
- Pofi'yi davranışsal rehber olarak konumlandırmak
- tablet ve telefonda sade, temiz ve erişilebilir bir PWA karakteri korumak

## Görsel İlkeler

- minimal UI
- soft pastel renkler
- düşük duyusal yük
- ferah boşluk kullanımı
- yavaş ve anlamlı hareket
- çocuk yüzeyinde az seçenek
- ebeveyn/terapist/eğitimci araçlarında daha analitik ama yine sakin düzen

Görsel hiyerarşi:

`Content > Icons > Pofi`

İçerik ve ana ikon her zaman Pofi'den daha baskın olmalıdır. Pofi rehberdir; ana içerik değildir.

## Mevcut Renk Dili

Referans `public/style.css` içinde şu ana değişkenler kullanılır:

- `--bg-soft`: `#fff8ed`
- `--bg-soft-2`: `#ffe6d6`
- `--ink`: `#2f3f5a`
- `--card`: `#ffffff`
- `--line`: `#f2c5ab`
- `--accent`: `#ff8f66`
- `--accent-dark`: `#e16f4a`
- `--mint`: `#99dec7`
- `--berry`: `#ff6f91`

Ana karakter:

- sıcak açık zemin
- yumuşak mint destek rengi
- kontrollü canlı vurgu
- metin için koyu mavi-gri ton

## Kartlar

Ana ekran 6 ana kartı 3x2 düzende gösterir.

Kart ilkeleri:

- her kartın ana ikon/görseli baskın olur
- Pofi standart olarak sağ-alt köşede rehber olarak durur
- Ceee ayrı bonus kart/strip olarak gösterilir
- kartlar gereksiz iç içe yığılmaz
- mobilde taşma üretmez

## Pofi Görsel Sistemi

Pofi bir davranışsal etkileşim sistemidir.

Asset kararları:

- Pofi için PNG emoji sistemi esas alınır
- Pofi görselleri `/assets/pofi_emoji` altında tutulur
- UI ikonları için SVG kullanılabilir
- background görselleri için PNG kullanılabilir
- eski gövde katmanı sistemleri kullanılmaz

State ve geçiş ilkeleri:

- aynı anda tek aktif Pofi state olur
- aynı container içinde üst üste render olmaz
- emotion geçişleri fade/scale ile yumuşak olur
- hızlı duygu değişimi engellenir
- Uyku modunda yalnız sleepy ve sleep kullanılır
- Ayna egzersizi sırasında yalnız egzersiz yüzü görünür; ödül yüzü tamamlanınca gelir

## Hareket ve Animasyon

Animasyonlar ürünün öğrenme ve sakinleşme amacını destekler.

Kanonik hareketler:

- düşük uyarımlı hava/ortam efektleri
- Pofi emotion/state geçişleri
- uyku modunda yıldızlı sakin sahne
- dokunma sonrası hafif geri bildirimler
- Ayna modunda egzersiz -> bekleme -> ödül akışı

İlke:

- hareket kısa ve anlamlı olur
- dikkat dağıtan sürekli hareket azaltılır
- uyku modunda kontrast ve hareket sakinleşir
- yanlış cevap veya hedef dışı dokunuşta cezalandırıcı görsel kullanılmaz

## Tipografi

Mevcut font ailesi:

- `Baloo 2`
- `Trebuchet MS`
- `Gill Sans`
- `sans-serif`

Yorum:

- yuvarlak ve çocuk dostu bir karakter hedeflenir
- okunurluk oyun hissinden daha önemlidir
- uzun metinler yerine kısa ürün cümleleri tercih edilir

## Yaşa Göre Genişleme

Bugünkü yüzey 0-5 başlangıç odağına göre sade kalır.

MinaPlay ileride 0-18 yaş aralığına genişlerse görsel ton ve arayüz yoğunluğu yaşa göre farklılaşabilir. Bu farklılaşma bugünkü çocuk yüzeyine erken taşınmaz; okul öncesi, örgün öğretim, gönüllü eğitimci ağı ve terapist/eğitimci araçları ayrı katmanlarda ele alınır.

## Tema Kararları

Bugünkü kararlar:

- tek ana tema yeterlidir
- dark mode veya çoklu tema sistemi erken açılmaz
- uyku modu kendi koyu/sakin sahnesini modül içinde taşır
- ürün adı görünür yüzeyde `MinaPlay` olarak öne çıkar
- Pofi adı ve kimliği korunur
- eski karakter isimleri görünür ürün kopyasında kullanılmaz

## Görsel Riskler

- ebeveyn panelleri artarsa çocuk ekranı fazla yoğunlaşabilir
- Pofi ana içerikten baskın hale gelirse hiyerarşi bozulabilir
- açık pastel palet fazla tekdüze hale gelebilir
- uyku modu ile ana oyun modu arasında geçiş çok sert olmamalıdır
- bazı emoji karakterleri platformdan platforma farklı görünebilir
- SVG ve PNG assetlerin boyutu PWA performansını etkileyebilir

## Yakın İyileştirme Adayları

- MinaPlay logo ve ikon ailesini netleştirmek
- Pofi PNG emoji setini üretim kalitesine çekmek
- eski karakter ve gövde assetlerini legacy olarak ayırmak
- Türkçe karakterleri eksik metinleri düzeltmek
- mobilde ebeveyn panelini daha kompakt ve analitik hale getirmek
- PWA splash/icon setini üretim kalitesine çekmek

## Kısa Kural

Tema çocuğu sakin biçimde çağırmalı, ebeveyne güven vermeli ve Pofi'yi rehber olarak tutmalıdır.
