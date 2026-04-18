---
name: notes
description: MinaPlay için açık soruları, teknik riskleri, görülen eksikleri ve ileri adayları toplar.
created: 2026-04-17
updated: 2026-04-18
---

# Notlar

## Açık Sorular

- `Konusu-Yorum` kodu `MinaGrow/MinaPlay` içine doğrudan mı taşınacak, yoksa önce referans repo temizlenecek mi?
- Git geçmişi korunmalı mı?
- `konusu_yorum_*` localStorage key'leri ürünleşme sırasında korunacak mı, yoksa migration ile `minaplay_*` ailesine mi taşınacak?
- Pofi PNG emoji seti hangi dosya adlandırma standardına bağlanacak?
- eski karakter ve gövde assetleri tamamen silinecek mi, yoksa legacy klasöre mi alınacak?
- çocuk profili ayrı bir kavram olacak mı?
- ebeveyn kayıtları ileride IndexedDB'ye taşınacak mı?
- Parent panel analizleri başlangıçta localStorage özetinden mi üretilecek?
- doğru/yanlış denemeler nasıl tanımlanacak: hedef dışı dokunuş, yanlış eşleme, tamamlanmayan egzersiz?
- Railway deploy yeni repo yerleşimine göre nasıl güncellenecek?

## Teknik Riskler

- MediaRecorder desteği bazı tarayıcı ve izin durumlarında sınırlı olabilir.
- Web Speech API Türkçe telaffuzda cihazdan cihaza değişebilir.
- Kamera izni ve ayna modu bazı cihazlarda beklenenden farklı davranabilir.
- localStorage içinde data URL ses kayıtları kapasite sınırına yaklaşabilir.
- Service worker cache listesi taşıma sırasında asset yolu kırabilir.
- Legacy CRM/webhook kodu ürün çekirdeğinde kaldıkça mimariyi bulanıklaştırabilir.
- Pofi state sistemi merkezi tutulmazsa üst üste render veya hızlı duygu değişimi oluşabilir.
- Parent panel analizleri erken karmaşıklaşırsa bugünkü çocuk yüzeyi ve local-first model zorlanabilir.

## Ürün Riskleri

- uygulama eğitim/terapi destek iddiasını tıbbi tanı veya klinik yönlendirme gibi göstermemelidir.
- çocuk ekranında fazla seçenek dikkat dağıtabilir.
- yanlış cevap veya hedef dışı dokunuş çocuğa başarısızlık hissi vermemelidir.
- günlük hedefler ödül baskısı gibi değil, yumuşak rehberlik gibi görünmelidir.
- uyku modu görsel ve ses olarak sakin kalmalıdır.
- 0-18 vizyonu bugünkü 0-5 başlangıç odağını bulanıklaştırmamalıdır.

## İleri Adaylar

- offline fallback ekranı
- çocuk profili
- öğrenci profili
- ebeveyn kontrol paneli
- Parent panel analiz ekranı
- hangi bölümde ne oynandı özeti
- doğru/yanlış deneme özeti
- tamamlanan egzersizler
- tekrar sayısı
- oturum sıklığı
- kullanım limitleri
- modül kontrolü
- screen lock
- IndexedDB ses arşivi
- daha zengin yedekleme/geri yükleme
- içerik paketlerini JSON'a ayırma
- mobil/tablet screenshot doğrulama seti
- legacy CRM temizliği

## Gelecek Sistem

MinaPlay ileride terapi ve eğitim destek platformuna evrilebilir.

Roller:

- çocuk: basit etkileşim
- ebeveyn: kontrol ve izleme
- terapist: planlama ve takip
- gönüllü eğitimci: okul ve ev süreci desteği

Gelecek terapi/eğitim modülleri:

- Dil ve Konuşma Terapisi
- Fizyoterapi
- Özel Eğitim
- Floortime
- Ergoterapi

## Terapi Plan Sistemi

İleri adaylar:

- kişiselleştirilmiş planlar
- günlük görevler
- haftalık hedefler
- tekrar takibi
- plan tamamlama durumu

## Ev Egzersizi Sistemi

İleri adaylar:

- 2-5 dakikalık kısa oturumlar
- basit yönergeler
- tekrar edilebilir yapı
- egzersiz tamamlama takibi
- ebeveynin kolayca başlatabildiği ev çalışmaları

## Okul ve Destek Ağı

MinaPlay ileride 0-18 yaş aralığında okul öncesi ve örgün öğretim desteğine genişleyebilir.

İleri adaylar:

- engelli bireylerin okul sürecinde desteklenmesi
- gönüllü eğitimci ağı
- öğretmen/eğitimci gözlem notları
- okul uyum süreci takibi
- dönemsel hedef ve raporlama

## Kısa İlke

MinaPlay yalnız bir uygulama değil, çocuğu, ebeveyni ve ileride terapist/eğitimci destek aktörlerini kontrollü, sade ve etkili bir dijital deneyimde buluşturan yapılandırılmış bir gelişim destek sistemi olmalıdır.
