# iPhone güvenli kullanım

MinaPlay iPhone'da ana ekrana eklenen bir PWA olarak çalışır. Web uygulamaları iOS'un alttan yukarı Ana Ekran hareketini veya uygulama değiştiricisini doğrudan kapatamaz. Bu sistem kilidi için Apple'ın **Denetimli Erişim** özelliği kullanılmalıdır.

## İlk kurulum

1. iPhone'da **Ayarlar → Erişilebilirlik → Denetimli Erişim** yolunu açın.
2. Denetimli Erişim'i etkinleştirin ve bir parola belirleyin. İsterseniz Face ID ile bitirmeyi de açın.
3. MinaPlay'i Safari paylaş menüsünden ana ekrana ekleyin ve ana ekran simgesinden açın.
4. Yan düğmeye üç kez basın, Denetimli Erişim'i seçin ve oturumu başlatın.

Bu oturum açıkken alttan yukarı kaydırma uygulama değiştiriciyi açmaz ve çocuk MinaPlay'den ayrılamaz.

## Ebeveyn çıkışı

1. MinaPlay'in sol üst köşesindeki yıldıza dokunun.
2. Dört haneli Parent şifresini girip **Kilidi aç** düğmesine dokunun.
3. Görünen iPhone çıkış kartından sonra yan düğmeye üç kez basın.
4. Face ID veya Denetimli Erişim parolasını doğrulayın ve **Bitir**'e dokunun.

MinaPlay Parent şifresi çocuk yüzeyini korur; Denetimli Erişim parolası ise iPhone'un sistem kilidini korur. iOS bu iki güvenlik katmanının tek bir web uygulaması şifresiyle kapatılmasına izin vermez.

Apple yönergesi: <https://support.apple.com/tr-tr/guide/iphone/iph7fad0d10/ios>
