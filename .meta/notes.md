---
name: notes
description: MinaPlay için açık soruları, teknik riskleri, görülen eksikleri ve ileri adayları toplar.
created: 2026-04-17
updated: 2026-04-19
---

# Notlar

## Açık Sorular

- `MinaPlay V2` temiz ürün omurgası hangi sırayla kurulacak?
- Git geçmişi korunmalı mı?
- `konusu_yorum_*` localStorage key'leri ürünleşme sırasında korunacak mı, yoksa migration ile `minaplay_*` ailesine mi taşınacak?
- Pofi PNG emoji seti hangi dosya adlandırma standardına bağlanacak?
- Pofi presence seviyelerinin piksel/ölçek üst sınırları nasıl belirlenecek?
- eski karakter ve gövde assetleri tamamen silinecek mi, yoksa legacy klasöre mi alınacak?
- çocuk profili ayrı bir kavram olacak mı?
- ebeveyn kayıtları ileride IndexedDB'ye taşınacak mı?
- Parent panel analizleri başlangıçta localStorage özetinden mi üretilecek?
- doğru/yanlış denemeler nasıl tanımlanacak: hedef dışı dokunuş, yanlış eşleme, tamamlanmayan egzersiz?
- Railway deploy yeni repo yerleşimine göre nasıl güncellenecek?
- uyku çıkış gesture'ı sol üst 3 tık + aşağı çekme olarak teknik açıdan nasıl güvenilir uygulanacak?
- kamera ile yüz/egzersiz ölçümü hangi hassasiyet ve gizlilik sınırlarıyla yapılacak?

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
- pasif ekran kullanımı problemi özel marka adıyla değil, genel davranış problemi olarak anlatılmalıdır.
- çocuk ekranında fazla seçenek dikkat dağıtabilir.
- yanlış cevap veya hedef dışı dokunuş çocuğa başarısızlık hissi vermemelidir.
- günlük hedefler ödül baskısı gibi değil, yumuşak rehberlik gibi görünmelidir.
- uyku modu görsel ve ses olarak sakin kalmalıdır.
- 0-18 vizyonu bugünkü 0-5 başlangıç odağını bulanıklaştırmamalıdır.
- Pofi sahne seviyesine çıktığında aktiviteyi kalıcı olarak gölgelememelidir.
- 30 saniye tepkisizlik sonrası Pofi'nin büyüme/sesli dikkat davranışı çocuğu ürkütmemelidir.
- üst üste 10 doğru cevapla "öğrenildi" kabulü ebeveyne baskı veya performans yarışı gibi sunulmamalıdır.
- uyku modunda çıkış gesture'ı ebeveyn için erişilebilir, çocuk için kazara tetiklenmesi zor olmalıdır.

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
- MVP aktif 5 alan: Dokun, Eşleme, Ayna, Uyku, Ceee
- Cümle ve Hikaye için gizli/yakında durumu
- eşleme sol hedef + sağ 3 seçenek düzeni
- 30 saniye tepkisizlik Pofi dikkat akışı
- üst üste 10 doğru cevapla öğrenildi kabulü
- uyku touch lock ve özel çıkış gesture'ı
- anne/baba ses kaydı ve uyku sesi tercihleri

## Bilimsel Dayanak Notu

MinaPlay V2'nin tasarım ve davranış ilkeleri erken çocukluk gelişimi, oyun temelli öğrenme ve güvenli dijital deneyim literatürüne yaslanır.

Kısa dayanaklar:

- çocuklar aktif katılım, tekrar ve oyun içinde deneyimle daha iyi öğrenir
- düşük uyarımlı ekranlar dikkat ve öğrenme yükünü korumaya yardımcı olur
- pastel/muted renkler, dengeli kontrast ve sade kompozisyon göz yorgunluğunu azaltır
- hareketler yavaş, öngörülebilir ve sınırlı olmalıdır
- saniyede 3'ten fazla flaş veya hızlı blink epileptik tetikleyici riskini artırabileceği için yasaktır
- büyük dokunma alanları hata payını artırır ve çocuk kullanımını kolaylaştırır

Kısa kaynak türleri:

- UNICEF oyun temelli öğrenme yaklaşımı
- W3C Three Flashes ilkesi
- W3C Target Size ilkesi

## Güncel Başarı Ölçütleri

MinaPlay V2 için başarı yalnız teknik çalışma anlamına gelmez. Başarı davranışsal ve duygusal olarak değerlendirilir.

Ölçütler:

- çocuk aktiviteyi anlıyor mu?
- çocuk Pofi'ye bakıp taklit veya tekrar davranışı gösteriyor mu?
- çocuk başarısız hissetmeden yeniden deniyor mu?
- çocuk akışta kalıyor mu?
- çocuk kendi isteğiyle tekrar ediyor mu?
- Pofi dikkat çekiyor ama bölmüyor mu?
- Pofi sonrası doğru aksiyon artıyor mu?
- ebeveyn uygulamaya güven duyuyor mu?
- Parent panel ebeveyne yorum ve yönlendirme sunuyor mu?
- uygulama çocuğu yormadan kısa süreli odağı koruyor mu?

Genel başarı tanımı:

Ürün başarılıdır eğer çocuk anlıyor, tekrar ediyor, taklit ediyor, akışta kalıyor ve ebeveyn uygulamanın doğru yerde güvenli destek verdiğini hissediyorsa.

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
