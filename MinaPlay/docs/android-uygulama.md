# Android Uygulama Kurulumu

Bu rehber MinaPlay'i Huawei tablette tarayıcıdan açılan bir oyun gibi değil, Android uygulaması olarak kurmak içindir.

MinaPlay'in çocuk yüzeyi yine aynı sade uygulama çekirdeğini kullanır. Android tarafı bu çekirdeği native paket içine alır, ikon/splash ekranı verir ve tablete APK olarak kurulabilir hale getirir.

## Uygulama Bilgileri

- Uygulama adı: `MinaPlay`
- Android paket adı: `com.minagrow.minaplay`
- Native proje klasörü: `/Users/umitaydin/Documents/MinaGrow/MinaPlay/android`
- Web çıktı klasörü: `/Users/umitaydin/Documents/MinaGrow/MinaPlay/public`

## Hazırlık

Bilgisayarda gerekli araçlar:

- Android Studio
- Android SDK
- JDK 21

Bu makinede Android Studio'nun kendi JDK'sı ile APK üretimi yapılabiliyor. Başka bilgisayarda üretim yapılacaksa Android Studio'nun kullandığı Gradle JDK değeri JDK 21'e alınmalı.

Kontrol:

```bash
java -version
```

Beklenen ana sürüm:

```text
21
```

## Android Projeyi Güncelle

Kod değiştikten sonra Android projesine yeni web çıktısını ve asset'leri aktarmak için:

```bash
cd /Users/umitaydin/Documents/MinaGrow/MinaPlay
npm run app:sync
```

Bu komut önce client build alır, sonra Capacitor Android projesini senkronize eder.

## Android Studio'da Aç

```bash
cd /Users/umitaydin/Documents/MinaGrow/MinaPlay
npm run android:open
```

Android Studio açıldıktan sonra:

1. Gradle sync'in bitmesini bekle.
2. `File > Settings` veya `Android Studio > Settings` içinden Gradle JDK değerinin JDK 21 olduğundan emin ol.
3. `Build > Build Bundle(s) / APK(s) > Build APK(s)` seç.

Debug APK üretildiğinde beklenen çıktı yolu:

```text
/Users/umitaydin/Documents/MinaGrow/MinaPlay/android/app/build/outputs/apk/debug/app-debug.apk
```

## Terminalden APK Üret

JDK 21 ve Android SDK hazırsa:

```bash
cd /Users/umitaydin/Documents/MinaGrow/MinaPlay
npm run android:debug
```

APK çıktısı yine şu klasörde oluşur:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Huawei Tablete Geliştirme Paketi Kur

Debug APK yalnız yerel geliştirme ve cihaz testi içindir; Parent panel güncelleme hattında veya production dağıtımında kullanılmaz.

USB ile kurulum:

1. Tablette geliştirici seçeneklerini aç.
2. USB hata ayıklamayı etkinleştir.
3. Tableti bilgisayara bağla.
4. Android Studio'da cihazı seçip `Run` düğmesine bas.

APK dosyasıyla kurulum:

1. `app-debug.apk` dosyasını tablete kopyala.
2. Tablette dosyayı aç.
3. Gerekirse `Bilinmeyen uygulamaları yükle` iznini ver.
4. MinaPlay'i kur.

## Çocuk Kilidi ve Sistem Tuşları

Uyku modunda geri tuşu uygulama içinde yakalanır; çocuk kilidi açıksa çıkış yapmaz. Android'in Home yuvarlak tuşu ve açık uygulamalar kare tuşu ise normal web/PWA koduyla yakalanamaz. Bunun için APK içinde native ekran sabitleme köprüsü vardır.

Tablette şu ayarı aç:

1. `Ayarlar` uygulamasını aç.
2. `Güvenlik`, `Güvenlik ve gizlilik` veya `Biyometri ve şifre` altında `Ekran sabitleme` ayarını bul.
3. `Ekran sabitleme` ayarını aç.
4. MinaPlay'i aç, çocuk moduna veya Uyku moduna gir.
5. Android sabitleme onayı çıkarsa onayla.

İlk açılıştaki sistem penceresinde `Tamam` seçilmelidir. `Hayır, teşekkürler` seçilirse Android ekranı sabitlemez; bu durumda bildirim perdesi, Ana Ekran ve Son Uygulamalar açık kalır. Sabitleme kabul edildiğinde Parent yıldızı + PIN akışı yetişkin çıkışı olarak kullanılır.

Bu ayar açıkken çocuk kilidi MinaPlay ana ekranı ve çocuk modlarında Android `startLockTask()` çağrısıyla ekranı sabitler. Sol üst yıldızdan doğru Parent PIN girildiğinde MinaPlay önce `stopLockTask()` ile ekran sabitlemeyi bırakır, ardından Android launcher'ını açıp kendi görevini arka plana alır. Böylece Huawei ve diğer Android cihazlarda çocuk Home/Son Uygulamalar hareketleriyle çıkamaz; ebeveyn ise uygulamayı Parent şifresiyle doğrudan kapatabilir.

Native çıkış cihaz politikası nedeniyle gerçekleştirilemezse MinaPlay çocuk ekranında kilitli kalmak yerine Parent panelini açar ve Ana Ekran düğmesinin kullanılabileceğini bildirir.

### Parent PIN ile gerçek kiosk çıkışı

Standart Android ekran sabitlemede sistemin uzun geri hareketi uygulama tarafından engellenemez. Uzun geri hareketini kapatıp yalnız MinaPlay Parent PIN çıkışını kullanmak için tablet MinaPlay'e `device owner` olarak provision edilmelidir.

Bu işlem yalnız yeni kurulmuş/fabrika ayarına dönmüş ve üzerinde hesap eklenmemiş cihazda yapılabilir. USB hata ayıklama açıkken bilgisayardan:

```bash
adb shell dpm set-device-owner com.minagrow.minaplay/.MinaPlayDeviceAdminReceiver
```

Komut başarılı olduktan sonra MinaPlay çocuk kilidi uygulamayı lock-task allowlist'ine alır. Bu gerçek kiosk modunda uzun geri, Home, Son Uygulamalar ve bildirim perdesi çıkış yolu olmaz; kilidi MinaPlay yalnız doğru Parent PIN girildiğinde bırakır ve Android ana ekranına döner.

Not: Railway güncellemesi bu native davranışı değiştirmez. Home/Kare tuşu davranışı için yeni APK'nın tablete tekrar kurulması gerekir.

## Parent Panelden Stable Güncelleme

Parent > Kontrol altındaki `Uygulamayı güncelle` kartı Railway üzerindeki `/api/update` sözleşmesini kontrol eder. İndirme düğmesi yalnız daha yüksek `versionCode` taşıyan ve geçerli stable metadata ile gelen sürüm için açılır.

Android kurucu APK'yi açmadan önce şunları doğrular:

- HTTPS indirme ve HTTPS yönlendirme zinciri
- release metadata içindeki SHA-256 değeri
- `com.minagrow.minaplay` paket adı
- yüklü uygulamadan daha yüksek `versionCode`
- yüklü MinaPlay ile aynı imza sertifikası

İlk debug-to-stable geçişi imza değiştiği için temiz kurulumdur. Sonraki stable sürümler mevcut uygulamanın üzerine kurulur ve yerel veri korunur.

Release anahtarı, GitHub secrets ve tag tabanlı yayın adımları için `docs/android-release.md` kullanılır.

## Not

`docs/huawei-tablet-kurulum.md` dosyası hâlâ yerel ağ/PWA denemesi için duruyor. Asıl tablet dağıtım yolu bu Android uygulama paketidir.
