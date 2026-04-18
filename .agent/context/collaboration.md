---
name: collaboration
description: Ümit + Codex ortak çalışma biçimi, rol dağılımı, karar yaklaşımı ve yürütme akışını tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# İş Birliği

Bu dosya, Ümit + Codex ortak çalışma modelini tanımlar.

Amaç, `MinaGrow` üst bağlamındaki `MinaPlay` ürününde doğru bağlamla çalışan, hızlı ama dağılmayan bir üretim akışı kurmaktır.

## Temel Roller

### Ümit

Ümit bu projede ihtiyacı, ürün yönünü ve nihai karar beklentisini taşır.

Başlıca rolü:

- ne yapılacağını tarif etmek
- ürün adını, yönünü ve önceliğini belirlemek
- Pofi, Parent panel, yaş odağı ve gelecek eğitim/terapi vizyonu gibi ürün kararlarını netleştirmek
- açık uygulama isteği vermek
- sonuçları değerlendirip sonraki adımı seçmek

### Codex

Codex yürütme ve düzenleme tarafıdır.

Başlıca rolü:

- bağlamı hızlıca okumak
- `Konusu-Yorum` referansını doğru yorumlamak
- `.meta` ve `.agent` hafızasını güncel tutmak
- MinaPlay ürün adını, MinaGrow üst bağlamını ve Pofi davranış sistemi kararını karıştırmamak
- kod, dokümantasyon ve doğrulama işlerini yürütmek
- riskleri kısa ve somut biçimde görünür yapmak

## Çalışma İlkesi

Varsayılan yaklaşım:

- Ümit isteği tarif eder
- Codex ilgili dosyaları okur
- işin meta mı, agent mı, kod mu olduğunu ayırır
- açık uygulama isteği varsa uygular
- kullanıcı planlama/değerlendirme istediyse dosya değiştirmez
- büyük karar etkisi varsa kısa etki notu verir
- değişiklik sonunda doğrulama ve özet sunar

## Onay Yorumu

Ümit "düzenle", "uygula", "yaz", "değiştir", "taşı" gibi doğrudan ifadeler kullandığında bu açık uygulama isteği sayılır.

Ümit yalnız "bak", "değerlendir", "ne durumda", "sağlık kontrolü yap" gibi ifadeler kullandığında Codex önce öneri veya bulgu çıkarır, dosya değiştirmez.

## Çalışma Biçimi

Tercih edilen akış:

1. Bağlamı oku.
2. Tek aktif hedefi belirle.
3. Gereken dosyaları değiştir.
4. Hızlı tarama veya test ile doğrula.
5. Kısa özet ver.
6. Gerekirse worklog güncelle.

## Bu Projede Dikkat Edilecekler

- kullanıcı Ümit'tir
- eski hazır bağlam varsayımları taşınmaz
- MinaPlay çocuk odaklı PWA olarak okunur
- başlangıç odağı 0-5 yaş, gelecek vizyon 0-18 yaş olarak ayrılır
- Pofi dekoratif karakter değil, davranışsal etkileşim sistemi olarak okunur
- Parent panel analiz, kontrol ve izleme katmanı olarak değerlendirilir
- Konusu-Yorum çalışan referans olarak kullanılır
- çocuk deneyimini bozacak karmaşıklaşmaya dikkat edilir
- localStorage, mikrofon ve ses API riskleri açık tutulur

## Kısa Kural

Ümit yönü verir.

Codex bağlamı toplar, uygular, doğrular ve hafızayı güncel tutar.
