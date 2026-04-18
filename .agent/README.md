---
name: agent-readme
description: MinaGrow içindeki agent alanının ne işe yaradığını ve alt yüzeylerin rolünü kısa biçimde açıklar.
created: 2026-04-17
updated: 2026-04-18
---

# Agent Alanı

Bu alan, `MinaGrow` içinde ajanın nasıl çalışacağını taşıyan iç omurgadır.

Amaç, her yeni çalışmada ajanın sıfırdan tahmin yürütmesini engellemek ve `MinaPlay` ürün bağlamına hızlıca hizalanmasını sağlamaktır.

## Alt Yüzeyler

- `context/`
  Ümit, MinaGrow/MinaPlay ürün bağlamı ve iş birliği yaklaşımını taşır.

- `workflows/`
  Uygulama, faz tasarımı, sağlık kontrolü, meta güncelleme ve agent güncelleme akışlarını tanımlar.

- `worklog.md`
  Agent omurgasında yapılan kalıcı güncellemelerin kısa kayıt izini tutar.

## Ana Kural

Bu alan proje yönünün yerine geçmez.

Proje yönü `.meta` altında yaşar.

`.agent` ise Codex'in bu projede nasıl okuyacağını, nasıl karar vereceğini ve nasıl çalışacağını taşır.

## Referans

MinaPlay'in çalışan uygulama referansı:

- `/Users/umitaydin/Documents/Konusu-Yorum`

Hedef proje kökü:

- `/Users/umitaydin/Documents/MinaGrow`
