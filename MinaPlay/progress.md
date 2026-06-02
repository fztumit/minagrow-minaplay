Original prompt: Eşleme tasarımı dokun tasarımı gibi sade olsun. Tasarım buna benzeyebilir ancak bizde pofi de olacak. Pofinin altında olan metin bilgilendirmeleri de kaldır.

Progress:
- Eşleme yüzeyi Dokun benzeri sade kart düzenine çekildi.
- Pofi bulut karakter olarak korundu ve altında görünür bilgi metni kaldırıldı.
- Görsel kontrolde Pofi'nin Eşleme butonu içinde 0 genişliğe düşmesi yakalandı; buton/kapsayıcı ölçüsü sabitlendi.
- Seçenek kartları alt menüden ayrılacak şekilde biraz kompaktlaştırıldı ve yukarı alındı.
- Eşleme hint seviyeleri görsel katmanlara ayrıldı: model glow, doğru kart glow, Pofi yönelme/işaret ve belirgin son ipucu.
- Eşleme progress modeli hint seviyeleri, tekrar ihtiyacı, aynı görsel/kavram genelleme ve latency takibini genişletti.
- Yanlış seri sonrası zorluk geçici olarak yumuşatıldı.
- Eşleme için state'e göre yumuşak ses tonları ve başarı/tekrar Pofi tepkileri eklendi.
- Playwright senaryosu hint yükselmesi ve repeatNeeds kaydını kapsayacak şekilde genişletildi.
- Eşleme Pofi davranışı rehber/öğretmen moduna alındı; göz üstüne binen el/tıkla katmanları kaldırıldı, yönlendirme yüz ifadesi ve sakin konumla yapılıyor.
- Pofi model kartına yaklaştırıldı, hint/retry sırasında model-doğru seçenek arasında yumuşak ışık bağı eklendi ve alt navigasyon Eşleme sırasında geri plana çekildi.
- Küçük ekranda Pofi üst rehber şeridine alındı; state'e göre yatayda model/doğru seçenek yönüne kayıyor ve seçenek kartları model metnine bindirmeyecek şekilde aşağı taşındı.
- Eşleme yönerge/model alanı tekrar merkezde sabitlendi; Pofi grid düzeninden çıkarılıp üst katmanda serbest rehber olarak konumlandırıldı, kartların üzerine inmeden model çevresinden yönlendiriyor.
- Dar tablet/yan panel ekranlarında Eşleme için ayrı yerleşim eşiği eklendi; Pofi büyütüldü, model kartı sabit ölçüye alındı ve Pofi ses komutu/state değişiminde yönerge kartının kaymaması doğrulandı.
- Dar ekranda Pofi sol boşluğu dolduran büyük rehber katmanına taşındı; derlenmiş client yenilendi, model kartı Pofi'nin üzerinde okunur kaldı ve komut öncesi/sonrası kart koordinatının aynı kaldığı tekrar doğrulandı.
- İkinci sesli yönergede oluşan kaymanın hint level 1 model kartı transform animasyonundan geldiği tespit edildi; Eşleme model ipucu transform yerine sadece glow animasyonu kullanacak şekilde düzeltildi ve ikinci komut sonrası koordinat sabitliği doğrulandı.
- Cümle modu placeholder'dan çıkarıldı; Pofi bağlam kuran aktif rehber oldu, isim + eksik fiil kartı, üç fiil seçeneği, doğru seçimde tamamlanan kısa ifade ve yumuşak yanlış yönlendirme akışı eklendi.
- Cümle modu için desktop/mobil sade yüzey, Pofi state'leri, tr-TR sesli yönerge ve Playwright e2e kapsamı eklendi.
- Cümle modu gelişmiş öğrenme akışına taşındı: başarıdan sonra `repeat_prompt` eklendi, Pofi cümleyi söyleyip 600ms sonra "Hadi söyle" teşviki veriyor.
- Cümle hedefleri bağlama göre anlamlı fiillerle sınırlandı; kelime/sahne varyasyonları aynı görsele ezberlenmeyecek şekilde döngüye alındı.
- Cümle progress modeli `minaplay_sentence_progress_v1` localStorage anahtarıyla kalıcı hale geldi; success/fail, hint kullanımı, tekrar teşviki ve latency takibi eklenip hedef seçimi ile zorluk buna bağlandı.
- Cümle için düşük başarı oranlı hedefleri daha sık getiren akıllı seçim, aynı context'i üst üste en fazla iki kez gösterme, başarı oranına göre 2/3/4 seçenek adaptasyonu ve başarısız cümleyi Eşleme'ye geri bildiren global hook eklendi.
- Cümle hint sistemi 5/8/11 saniye eşiğiyle ses tekrar, cümle glow, doğru seçenek highlight ve Pofi yönlendirme seviyelerine ayrıldı.
- Cümle Pofi davranışı idle/attention/context/waiting/success/repeat_prompt/hint/retry çizgisine genişletildi; konuşma tonları targeting/success/repeat/hint/retry state'lerine göre farklılaşıyor ve aynı ton üst üste bindirilmiyor.
- Cümle görsel kontrolünde kısa desktop ekranda fiil seçeneklerinin alt menüye yaklaştığı görüldü; seçenek grid'i Pofi ve alt nav ile çakışmayacak güvenli yüksekliğe alındı ve ekran görüntüsüyle doğrulandı.
- Cümle modunda çocuk yüzeyindeki görünür komut/bilgilendirme metinleri kaldırıldı; üst komut balonu, kart başlığı, sahne açıklaması, kelime boşluğu ve "Hadi söyle" yazısı görünmez hale getirildi, akış ses + görsel + simge seçimlerine indirildi.
- Telefon genişliğinde kart/seçenek/alt menü çakışması düzeltildi; fiil seçenekleri yazı yerine ayırt edilebilir simgelerle gösteriliyor.
- Hikaye modu placeholder'dan çıkarıldı; Pofi anlatıcı/rehber olarak attention, narration, interaction, waiting, success, continue ve closure state'leriyle kısa "Top" hikayesini otomatik akıtıyor.
- Hikaye görsel yüzeyi düşük uyarımlı sahne kartı, Pofi anlatıcı, progress noktaları ve yazısız görsel seçimlerden oluşacak şekilde kuruldu; hikaye cümleleri görünür metin değil sesli anlatım ve ekran okuyucu durumunda kalıyor.
- Hikaye etkileşim noktası eklendi: "Topu kim atacak?" adımında görsel seçenek çıkıyor, çocuk seçmezse sistem bekleyip hikayeyi sürdürüyor.
- Hikaye konuşma profilleri yavaş/net anlatım, yönlendirme, tekrar ve kapanış tonlarına ayrıldı; aynı konuşma türü üst üste geldiğinde profil değiştiriliyor.
- Hikaye desktop ve telefon genişliklerinde görsel kontrol edildi; sahne, seçenekler ve alt menü çakışması giderildi.
- Cümle ekranı önceki versiyonla karşılaştırıldı; eski sürümdeki merkez/ilişki netliği korunup metin ağırlığı geri getirilmeden Pofi, hedef kart ve seçenekler yeniden hizalandı.
- Cümle seçenekleri Pofi'nin üstünden çıkarılıp hedef kartın altına bağlandı; Pofi ayrı rehber alanında kaldı ve alt menü Cümle modunda pasif/aşağı dock davranışına alındı.
- Desktop, kısa desktop ve telefon ölçümlerinde Cümle seçeneklerinin Pofi, hedef kart ve alt menüyle çakışmadığı Playwright ekran görüntüsüyle doğrulandı.
- Cümle fiil seçeneklerindeki soyut ok/işaret sembolleri kaldırıldı; seçenekler mini eylem görseli ve kısa fiil etiketiyle anlaşılır hale getirildi.
- Cümle hedef kartı nesne + boş/aktif fiil alanı olarak geliştirildi; ipucu ve başarı anında kart görsel cümleye dönüşüyor.
- Cümle başarı pekiştirmesi biraz uzatıldı ve alt menü erişilebilir kalacak şekilde tekrar dengelendi.
- Cümle modu “Yönlendirmeli İfade Kurma” yönüne çekildi; hedefler temel ihtiyaç, paylaşma, kişiyi çağırma, yeme eylemi ve oyun başlatma gibi işlevsel iletişim amaçlarına bağlandı.
- Cümle sahnelerine içme/yeme/oyun/çağırma/paylaşma için metinsiz sahne ipuçları eklendi; kart artık yalnız nesne değil bağlam + ifade tamamlama alanı olarak çalışıyor.
- `ver` ve `al` fiil görselleri birbirinden ayrıştırıldı; erken aşamada karışıklığı azaltmak için seçenek havuzları daha anlamlı ikililere indirildi.
- Su eylem ailesi mantıksal sıraya alındı: ilk aşama `su ver` / `su al`, ikinci aşama `su iç`, ileri aşama `su dök` / `su akıyor`; Pofi artık “Su ne yapsın?” yerine bağlam cümlesiyle yönlendiriyor.

TODO:
- Şimdilik açık görsel TODO yok; sonraki kullanıcı geri bildirimiyle ince ayar yapılabilir.
