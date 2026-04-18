---
name: meta-update
description: MinaGrow/MinaPlay içindeki proje meta omurgasının nasıl değerlendirileceğini, nasıl güçlendirileceğini ve ne zaman güncelleneceğini tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Meta Update

Bu workflow, `.meta` omurgası güncelleneceği zaman kullanılır.

## Ne Zaman Kullanılır?

- kullanıcı `.meta` düzenlemesi isterse
- ürün yönü değişirse
- Konusu-Yorum referansından yeni davranış MinaPlay yönüne alınırsa
- plan, faz veya not yüzeyleri güncellenecekse
- worklog kapanışı gerekiyorsa

## Dosya Rolleri

- `project.md`: proje kimliği, amaç, kapsam
- `architecture.md`: teknik yapı, modül sınırı, deploy ve test
- `data-model.md`: localStorage, varlıklar, storage key'ler
- `web.md`: PWA akışı, modüller, çocuk ve ebeveyn deneyimi
- `themes.md`: görsel dil, renk, hareket, maskot
- `origins.md`: fikir çıkışı ve Konusu-Yorum evrimi
- `transition.md`: Konusu-Yorum'dan MinaPlay'e geçiş
- `plan.md`: aktif hedef ve yakın sıra
- `notes.md`: açık sorular ve riskler
- `worklog.md`: kapanan işler
- `phases/`: faz ve paket görünümü

## Güncelleme İlkeleri

- aynı bilgi her dosyaya kopyalanmaz
- dosyanın rolü korunur
- frontmatter korunur
- Türkçe karakter kaybı kabul edilmez
- Konusu-Yorum referansı ile MinaPlay kanonik yönü ayrılır
- karar ve açık soru birbirine karıştırılmaz

## Uygulama Eşiği

Kullanıcı açıkça "düzenle", "uygula", "yaz", "değiştir" demişse `.meta` güncellenebilir.

Kullanıcı yalnız "bak", "değerlendir", "sağlık kontrolü" demişse önce öneri çıkarılır.

## Worklog Kuralı

Anlamlı meta değişikliği kapanınca `.meta/worklog.md` güncellenir.

Kayıt formatı:

`tarih | alan | kısa başlık | ne yapıldı | neden önemli`

## Kısa Kural

Meta, ürün hafızasıdır.

Doğru dosyaya, kısa ve kalıcı karar yazılır.
