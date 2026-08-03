# Medya Kasası Gerçek Cihaz QA

Bu liste, MinaPlay Parent panelindeki şifreli ses/video kaydı ve yedek akışını gerçek cihazlarda doğrulamak için kullanılır. Otomatik test sonucu yerine geçmez; her cihaz ve tarayıcı sürümünde manuel uygulanır.

## Ortak Hazırlık

- Test için gerçek çocuk verisi içermeyen örnek kayıt kullanın.
- En az 6 karakterli geçici bir kasa şifresi belirleyin.
- Cihazda indirme/yükleme için yeterli boş alan bulunduğunu doğrulayın.
- Test sonunda örnek kayıtları ve indirilen yedek dosyasını silin.

## Android Uygulama / Chrome

- Parent > Düzenle > Odak tekrar alanını açın.
- Kasayı oluşturun; uygulamanın kamera ve mikrofon izinlerini istediğini doğrulayın.
- 10 saniye sınırı içinde ses, 12 saniye sınırı içinde video kaydedin.
- Ses ve video önizlemesinin yalnız Parent panelde çalıştığını doğrulayın.
- Kasayı kilitleyin; kayıt ve link içeriğinin görünmediğini doğrulayın.
- `Şifreli yedeği indir` ile JSON dosyasını kaydedin.
- Mevcut kasayı test cihazından silmeden önce yedeği güvenli bir konuma kopyalayın.
- Yedeği geri yükleyin; yanlış şifrenin kasayı açmadığını, doğru şifrenin kayıtları açtığını doğrulayın.
- Uygulamayı arka plana alıp geri dönün; kayıt akışının takılı kalmadığını doğrulayın.

## iOS Safari / Ana Ekran PWA

- Safari ve ana ekrana eklenmiş PWA yüzeyinde kamera/mikrofon izinlerini ayrı ayrı doğrulayın.
- Desteklenen `MediaRecorder` formatında ses ve video kaydının başladığını ve süre sonunda durduğunu doğrulayın.
- İndirme işleminin Dosyalar/Paylaşım yüzeyine güvenli biçimde ulaştığını doğrulayın.
- Dosyalar uygulamasından seçilen şifreli yedeğin MinaPlay'e geri yüklenebildiğini doğrulayın.
- Sekme/PWA kapatılıp açıldıktan sonra kasanın kilitli başladığını doğrulayın.

## Masaüstü Chrome

- Kamera ve mikrofon için izin verme, reddetme ve daha sonra yeniden izin verme yollarını ayrı ayrı deneyin.
- İzin reddinde sakin hata mesajı görüldüğünü ve Parent panelin kullanılabilir kaldığını doğrulayın.
- Yedeği dışa aktarın; dosyada `format`, `version`, `exportedAt` ve şifreli `vault` zarfı dışında düz medya/link/şifre bulunmadığını kontrol edin.
- Yeni bir tarayıcı profiline yedeği aktarın; aynı kasa şifresiyle açın.

## Başarı Ölçütü

- Düz medya, dış link veya kasa şifresi yedek dosyasına sızmaz.
- Yanlış şifre kayıtları açmaz; şifre sıfırlama veya arka kapı yoktur.
- İçe aktarma mevcut kasayı ebeveyn onayı olmadan ezmez.
- Video çocuk ekranında otomatik başlamaz.
- İzin veya format hatası çocuk yüzeyine taşmaz ve Parent paneli kilitlemez.
