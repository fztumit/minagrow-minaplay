---
name: phase-design
description: MinaGrow/MinaPlay içinde faz tasarımı gerektiğinde hangi yüzeylerin okunacağını, faz ile paket ayrımının nasıl kurulacağını ve bunun meta yüzeyine nasıl yansıtılacağını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Phase Design

Bu workflow, `MinaGrow / MinaPlay` içinde faz veya paket tasarımı gerektiğinde kullanılır.

## Ne Zaman Kullanılır?

- kullanıcı "sıradaki faz", "plan", "paket", "yol haritası" derse
- Konusu-Yorum'dan MinaPlay'e taşıma sırası konuşulursa
- PWA ürün sertleştirme aşamaları tasarlanırsa
- meta, kod ve deploy işleri aynı anda görünmeye başlarsa

## Temel Ayrım

Faz:

- daha büyük kapanış alanıdır
- ürün veya repo yönünde anlamlı bir eşiği temsil eder

Paket:

- faz içindeki uygulanabilir iş parçasıdır
- daha kısa ve kapanabilir olmalıdır

## Okuma Sırası

1. `.meta/project.md`
2. `.meta/transition.md`
3. `.meta/plan.md`
4. `.meta/phases/phase-template.md`
5. mevcut `.meta/phases/phase-xx.md` dosyaları
6. gerekiyorsa `Konusu-Yorum/progress.md`

## MinaPlay İçin Faz Mantığı

Bugünkü ana faz adayları:

- meta ve agent hizalaması
- Konusu-Yorum kod taşıma
- ürün kimliği temizliği
- PWA sertleştirme
- ebeveyn araçları iyileştirme
- içerik paketi genişletme
- deploy ve release düzeni

## Paket Yazım Kuralı

Her paket şunları içermelidir:

- amaç
- kapsam
- kapanış ölçütü
- gerekiyorsa doğrulama

Paketler çok büyükse bölünür.

## Onay Kuralı

Kullanıcı yalnız tasarım istediyse faz dosyası değiştirilmez.

Kullanıcı "yaz", "düzenle", "uygula" derse ilgili `.meta/phases/` ve `.meta/plan.md` dosyaları güncellenebilir.

## Kısa Kural

Faz yönü taşır.

Paket kapanışı taşır.
