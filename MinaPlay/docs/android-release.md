# MinaPlay Android Stable Yayını

MinaPlay Android APK'leri yalnız GitHub Actions tarafından, kalıcı release anahtarıyla imzalanarak yayımlanır. Debug APK production güncelleme kaynağı değildir.

## Bir Defalık Kurulum

1. Repo dışında uzun ömürlü bir JKS anahtarı oluşturun ve güvenli yedekleyin.
2. JKS dosyasını base64 biçiminde `MINAPLAY_KEYSTORE_BASE64` GitHub Actions secret'ına kaydedin.
3. `MINAPLAY_KEYSTORE_PASSWORD`, `MINAPLAY_KEY_ALIAS` ve `MINAPLAY_KEY_PASSWORD` secret'larını ekleyin.
4. Railway uygulamasının bu repodaki yayın branch'ini deploy ettiğini doğrulayın.
5. Gerekirse Railway'de `RELEASE_METADATA_URL` değerini stable metadata adresiyle ayarlayın. Varsayılan adres `https://github.com/fztumit/minagrow-minaplay/releases/latest/download/minaplay-release.json` değeridir.

Anahtar ve parolalar hiçbir zaman repoya, `.env` dosyasına veya yayın artifact'ine eklenmez.

Mevcut production sertifikasının SHA-256 parmak izi `F3:E0:6C:5F:10:52:5F:E9:22:4D:52:73:A5:3D:44:6E:1C:32:CB:17:70:38:BD:8E:98:A3:A2:5F:ED:13:80:4E` değeridir. Yeni bir stable APK bu kimlikle imzalanmıyorsa yayımlanmamalıdır.

Canlı stable yüzeyler:

- Release: `https://github.com/fztumit/minagrow-minaplay/releases/tag/v1.0.37`
- Metadata: `https://minagrow-minaplay-production.up.railway.app/api/update`
- Health: `https://minagrow-minaplay-production.up.railway.app/health`

## Yayın Akışı

1. `release.json` içindeki `version` ve daima artan `versionCode` güncellenir.
2. Build, lint, unit, e2e ve Android dry-run doğrulamaları tamamlanır.
3. Değişiklik ana yayın branch'ine alınır.
4. Sürümle birebir eşleşen tag oluşturulur: örneğin `v1.0.37`.
5. Tag push edildiğinde workflow imzalı APK, SHA-256 dosyası ve `minaplay-release.json` üretir.
6. Railway `/api/update` yüzeyi GitHub'daki son stable metadata dosyasını doğrulayıp istemciye iletir.

`workflow_dispatch` aynı kontrolleri ve imzalı artifact üretimini çalıştırır fakat GitHub Release yayımlamaz.

## İlk Tablet Geçişi

Mevcut debug imzası kalıcı release imzasıyla eşleşmeyeceği için ilk geçiş temiz kurulumdur:

1. Gerekli medya kasasını Parent panelden şifreli olarak dışa aktarın.
2. Mevcut debug uygulamayı kaldırın.
3. İlk stable GitHub Release APK'sini kurun.
4. Kamera, mikrofon, bilinmeyen uygulama kurma ve kiosk/device-owner izinlerini yeniden verin.
5. Gerekliyse medya kasası yedeğini aynı şifreyle içe aktarın.

Sonraki stable sürümler Parent panelden yüklenir. Android düşük `versionCode` kurmadığı için geri dönüş, geri alınan kodu daha yüksek `versionCode` ile yayımlayan bir düzeltme sürümüdür.

## Kabul Kontrolü

- `apksigner verify --verbose --print-certs <apk>` başarılıdır.
- Yayındaki APK SHA-256 değeri metadata ve `.sha256` dosyasıyla aynıdır.
- Canlı `/health` `200`, `/api/update` geçerli stable JSON döndürür.
- HTTP, yanlış hash, yanlış paket, eski sürüm veya farklı imza native kurucu tarafından reddedilir.
- Temiz stable kurulumdan sonraki daha yüksek sürüm, uygulama içinden kurulup yerel veriyi korur.
