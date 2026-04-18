---
name: themes
description: MinaPlay PWA yüzeyindeki görsel dil, tema, renk, hareket ve çocuk ekranı ilkelerini tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Tema

## Özet

`MinaPlay`in tema dili sıcak, yumuşak ve çocuk dostudur.

Amaç:

- çocuk için davetkar bir ekran üretmek
- ebeveyn için güven veren ve okunur bir düzen sağlamak
- dikkat çekici ama yorucu olmayan bir görsel ritim kurmak
- MinaGrow markası altında sevecen, temiz ve mobil PWA karakterini korumak

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

- sıcak şeftali ve krem zemin
- yumuşak mint destek rengi
- çocuk ekranlarında canlı ama kontrollü vurgu
- metin için koyu mavi-gri ton

## Görsel Roller

### Zemin

Zemin sıcak, açık ve düşük gerilimli kalır.

İlke:

- aşırı koyu, yoğun ve tek renkli bir evren kurulmaz
- çocuk ekranı nefes alır
- modül ayrımları yumuşak bloklarla görünür olur

### Kartlar

Kartlar çocuk için dokunulabilir alanları belirginleştirir.

Kullanım:

- kelime kartları
- günlük kelime
- günlük aktivite
- aile avatarları
- ebeveyn ayar panelleri

İlke:

- kartlar gereksiz iç içe yığılmaz
- her kartın rolü net olur
- mobilde taşma üretmez

### Maskot

Maskot `Dost Anka` karakteri olarak okunur.

Roller:

- karşılama
- yönlendirme
- başarı hissi
- uyku modunda sakinleşme

Maskot ürünün kişiliğini taşır; fakat bütün ekranı ele geçirmez.

## Hareket ve Animasyon

Animasyonlar ürünün öğrenme amacını destekler.

Kanonik hareketler:

- su bardağı ve dökülme odağı
- maskot varyantları
- uyku modunda yıldızlı sakin sahne
- dokunma sonrası hafif geri bildirimler

İlke:

- hareket kısa ve anlamlı olur
- dikkat dağıtan sürekli hareket azaltılır
- uyku modunda kontrast ve hareket daha sakinleşir

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

## Tema Kararları

Bugünkü kararlar:

- tek ana tema yeterlidir
- dark mode veya çoklu tema sistemi erken açılmaz
- uyku modu kendi koyu sahnesini modül içinde taşır
- marka dili `MinaGrow` ve ürün dili `MinaPlay` üzerinden okunur
- `Konusu-Yorum` adı tarihsel referans olarak kalır; görünen ürün adında `MinaPlay` öne çıkar

## Görsel Riskler

- ebeveyn panelleri artarsa çocuk ekranı fazla yoğunlaşabilir
- şeftali/krem palet fazla baskın hale gelirse görsel tekdüzelik oluşabilir
- uyku modu ile ana oyun modu arasında geçiş çok sert olmamalıdır
- bazı emoji karakterleri platformdan platforma farklı görünebilir
- SVG ve PNG assetlerin boyutu PWA performansını etkilememelidir

## Yakın İyileştirme Adayları

- MinaGrow/MinaPlay logo ve ikon ailesini netleştirmek
- Pofi/Anka asset adlarını ürün kararına göre sadeleştirmek
- Türkçe karakterleri eksik metinleri düzeltmek
- mobilde ebeveyn panellerini daha kompakt hale getirmek
- PWA splash/icon setini üretim kalitesine çekmek

## Kısa Kural

Tema çocuğu çağırmalı, ebeveyne güven vermeli, ürünü yormamalıdır.
