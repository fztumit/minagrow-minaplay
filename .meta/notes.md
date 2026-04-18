---
name: notes
description: MinaGrow/MinaPlay için açık soruları, teknik riskleri, görülen eksikleri ve ileri adayları toplar.
created: 2026-04-17
updated: 2026-04-18
---

# Notlar

## Açık Sorular

- `Konusu-Yorum` kodu `MinaGrow/MinaPlay` içine doğrudan mı taşınacak, yoksa önce referans repo temizlenecek mi?
- Git geçmişi korunmalı mı?
- `konusu_yorum_*` localStorage key'leri ürünleşme sırasında korunacak mı, yoksa migration ile `minaplay_*` ailesine mi taşınacak?
- `Pofi`, `Anka`, `Dost Anka` ve asset adları hangi karakter kararına bağlanacak?
- çocuk profili ayrı bir kavram olacak mı?
- ebeveyn kayıtları ileride IndexedDB'ye taşınacak mı?
- Railway deploy yeni repo yerleşimine göre nasıl güncellenecek?

## Teknik Riskler

- MediaRecorder desteği bazı tarayıcı ve izin durumlarında sınırlı olabilir.
- Web Speech API Türkçe telaffuzda cihazdan cihaza değişebilir.
- localStorage içinde data URL ses kayıtları kapasite sınırına yaklaşabilir.
- Service worker cache listesi taşıma sırasında asset yolu kırabilir.
- Legacy CRM/webhook kodu ürün çekirdeğinde kaldıkça mimariyi bulanıklaştırabilir.
- Ebeveyn panelleri mobilde çocuk ekranını kalabalıklaştırabilir.

## Ürün Riskleri

- uygulama eğitim iddiasını tıbbi veya terapötik iddia gibi göstermemelidir.
- çocuk ekranında fazla seçenek dikkat dağıtabilir.
- günlük hedefler ödül baskısı gibi değil, yumuşak rehberlik gibi görünmelidir.
- uyku modu görsel ve ses olarak sakin kalmalıdır.

## İleri Adaylar

- offline fallback ekranı
- çocuk profili
- IndexedDB ses arşivi
- daha zengin yedekleme/geri yükleme
- TR/EN opsiyonel dil paketi
- içerik paketlerini JSON'a ayırma
- ebeveyn panelini ayrı görünüm olarak sadeleştirme
- mobil/tablet screenshot doğrulama seti
- legacy CRM temizliği
