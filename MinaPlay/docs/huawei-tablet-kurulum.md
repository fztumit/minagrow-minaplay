# Huawei Tablet PWA Kurulum

Bu rehber MinaPlay'i aynı Wi-Fi ağı içindeki Huawei tablette hızlı PWA denemesi olarak kullanıma hazır hale getirmek içindir.

Asıl uygulama kurulumu için `/Users/umitaydin/Documents/MinaGrow/MinaPlay/docs/android-uygulama.md` dosyasındaki Android APK akışı kullanılmalıdır. Bu dosya tarayıcı üzerinden hızlı test ve yedek kurulum yolu olarak durur.

## 1. Bilgisayarda Sunucuyu Aç

```bash
cd /Users/umitaydin/Documents/MinaGrow/MinaPlay
npm run build
npm run start:tablet
```

Sunucu varsayılan olarak `0.0.0.0:3100` üzerinde açılır. Bu, aynı Wi-Fi ağındaki tabletin bilgisayara bağlanabilmesi içindir.

Bilgisayarın yerel IP adresini bulmak için:

```bash
ipconfig getifaddr en0
```

Bu oturumda görünen IP: `192.168.1.104`

Tablette açılacak adres:

```text
http://192.168.1.104:3100
```

IP değişirse aynı komutla yeni IP'yi alıp tabletteki adresi güncelle.

## 2. Huawei Tablette Aç

1. Tablet ve bilgisayar aynı Wi-Fi ağına bağlı olmalı.
2. Tablette Chrome, Edge veya Huawei Browser aç.
3. Adres çubuğuna bilgisayar IP'si ile MinaPlay adresini yaz: `http://192.168.1.104:3100`
4. MinaPlay ana ekranı gelince bir kez Dokun veya Ceee modunu açıp geri dön. Bu, PWA cache'in dolmasına yardım eder.

## 3. Ana Ekrana Ekle

MinaPlay içinde Parent panelden de kontrol edebilirsin:

1. Parent paneli aç.
2. `Kontrol` sekmesine gir.
3. `Uygulamayı kur` bölümünü aç.
4. Tarayıcı destekliyorsa `Uygulamayı yükle` düğmesine bas.
5. Düğme aktif değilse tarayıcı menüsünden `Ana ekrana ekle` seçeneğini kullan.

Tarayıcı menüsünden:

- Chrome/Edge: `Ana ekrana ekle` veya `Uygulamayı yükle`
- Huawei Browser: menüde görünüyorsa `Ana ekrana ekle`

Ana ekranda `MinaPlay` ikonu oluşmalı. Bundan sonra uygulama tam ekran/standalone PWA gibi açılır.

## 4. Çocuk Kullanımı İçin Kontrol

Parent panele giriş:

1. Sol üst gizli alana 3 kez dokun.
2. Aynı yerden aşağı doğru çek.
3. Parent panel açılmalı.

Kontrol sekmesinde:

- Çocuk kilidi açık kalsın.
- Ekranı açık tut seçeneği açık kalsın.
- Gerekirse görünür modları seç: Dokun, Eşleme, İfade, Hikaye, Ayna, Uyku, Ceee.

## 5. Offline Test

1. Tablet MinaPlay'i bir kez açıkken kullanmış olmalı.
2. Tablette Wi-Fi'yi kapat.
3. Ana ekrandaki MinaPlay ikonundan tekrar aç.
4. Ana yüzey veya offline dönüş sayfası gelmeli.

Not: İlk kurulum için bilgisayardaki sunucu açık olmalı. Sonrasında PWA cache dolduğu ölçüde temel yüzeyler çevrimdışı çalışır; yeni ses/görsel eklenirse tableti tekrar online açıp cache'i yenilemek gerekir.

## 6. Kapanış

Kullanım bitince bilgisayardaki terminalde `Ctrl+C` ile sunucuyu kapatabilirsin.
