---
name: agent-update
description: MinaGrow/MinaPlay içindeki agent omurgasının nasıl değerlendirileceğini, nasıl güçlendirileceğini ve ne zaman güncelleneceğini tanımlar.
created: 2026-04-17
updated: 2026-04-18
---

# Agent Update

Bu workflow, `.agent` omurgası güncelleneceği zaman kullanılır.

## Ne Zaman Kullanılır?

- kullanıcı `.agent` düzenlemesi isterse
- ajan yanlış kullanıcı veya yanlış proje varsayımıyla başlarsa
- workflow davranışı güncellenecekse
- iş birliği modeli değişirse
- yeni çalışma akışı eklenirse

## Dosya Rolleri

- `README.md`: agent alanının amacı
- `context/profile.md`: Ümit ve proje içi rol bağlamı
- `context/business.md`: MinaGrow/MinaPlay ürün ve iş bağlamı
- `context/collaboration.md`: Ümit + Codex çalışma modeli
- `workflows/implementation-start.md`: aktif işe başlama akışı
- `workflows/phase-design.md`: faz ve paket tasarım akışı
- `workflows/health.md`: sağlık kontrolü akışı
- `workflows/meta-update.md`: meta güncelleme akışı
- `workflows/agent-update.md`: agent güncelleme akışı
- `worklog.md`: agent değişiklik kayıtları

## Güncelleme İlkeleri

- ajan davranışı gereksiz karmaşıklaştırılmaz
- kullanıcı Ümit olarak korunur
- eski hazır bağlam varsayımları taşınmaz
- Konusu-Yorum referansı çalışma kaynağı olarak görünür kalır
- workflow dosyaları kullanıcıya ham dosya adı gibi dayatılmaz
- `.agent` proje yönünün yerine geçmez; `.meta` ile birlikte çalışır

## Uygulama Eşiği

Kullanıcı açıkça `.agent` düzenlemesi veya agent davranış değişikliği isterse uygulama yapılabilir.

Kullanıcı yalnız değerlendirme isterse önce bulgu ve öneri çıkarılır.

## Worklog Kuralı

Anlamlı agent değişikliği kapanınca `.agent/worklog.md` güncellenir.

Kayıt formatı:

`tarih | alan | kısa başlık | ne yapıldı | neden önemli`

## Kısa Kural

Agent omurgası, Codex'in bu projede doğru başlamasını sağlar.

Yanlış varsayım üretmesini engellemek ana görevdir.
