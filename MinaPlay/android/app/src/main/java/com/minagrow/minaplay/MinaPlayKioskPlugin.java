package com.minagrow.minaplay;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.view.inputmethod.InputMethodManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "MinaPlayKiosk")
public class MinaPlayKioskPlugin extends Plugin {
    private TextToSpeech textToSpeech;
    private boolean textToSpeechReady;
    private final ExecutorService updateExecutor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void setChildLockActive(PluginCall call) {
        boolean active = call.getBoolean("active", false);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not ready");
            return;
        }

        activity.runOnUiThread(() -> {
            keepFullscreen(activity);
            try {
                ensureDeviceOwnerLockTask(activity);
                if (active && !isLockTaskActive(activity)) {
                    activity.startLockTask();
                } else if (!active && isLockTaskActive(activity)) {
                    activity.stopLockTask();
                }
                JSObject result = new JSObject();
                result.put("active", isLockTaskActive(activity));
                call.resolve(result);
            } catch (IllegalArgumentException | IllegalStateException | SecurityException error) {
                call.reject("Lock task mode is unavailable", error);
            }
        });
    }

    @PluginMethod
    public void exitToLauncher(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not ready");
            return;
        }

        activity.runOnUiThread(() -> {
            try {
                View focused = activity.getCurrentFocus();
                if (focused != null) {
                    InputMethodManager manager = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
                    if (manager != null) {
                        manager.hideSoftInputFromWindow(focused.getWindowToken(), 0);
                    }
                    focused.clearFocus();
                }
                if (isLockTaskActive(activity)) {
                    activity.stopLockTask();
                }
                if (isLockTaskActive(activity)) {
                    call.reject("Android child lock could not be released");
                    return;
                }

                JSObject result = new JSObject();
                result.put("exited", true);
                call.resolve(result);

                Intent launcherIntent = new Intent(Intent.ACTION_MAIN);
                launcherIntent.addCategory(Intent.CATEGORY_HOME);
                launcherIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
                activity.startActivity(launcherIntent);
                activity.moveTaskToBack(true);
            } catch (IllegalArgumentException | IllegalStateException | SecurityException error) {
                call.reject("Android launcher exit is unavailable", error);
            }
        });
    }

    private void ensureDeviceOwnerLockTask(Activity activity) {
        DevicePolicyManager policyManager = (DevicePolicyManager) activity.getSystemService(Context.DEVICE_POLICY_SERVICE);
        if (policyManager == null || !policyManager.isDeviceOwnerApp(activity.getPackageName())) {
            return;
        }
        ComponentName admin = new ComponentName(activity, MinaPlayDeviceAdminReceiver.class);
        policyManager.setLockTaskPackages(admin, new String[] { activity.getPackageName() });
    }

    @PluginMethod
    public void keepFullscreen(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not ready");
            return;
        }

        activity.runOnUiThread(() -> {
            keepFullscreen(activity);
            call.resolve();
        });
    }

    @PluginMethod
    public void dismissInput(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not ready");
            return;
        }
        activity.runOnUiThread(() -> {
            View focused = activity.getCurrentFocus();
            if (focused != null) {
                InputMethodManager manager = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
                if (manager != null) {
                    manager.hideSoftInputFromWindow(focused.getWindowToken(), 0);
                }
                focused.clearFocus();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "").trim();
        if (text.isEmpty()) {
            call.resolve(new JSObject().put("spoken", false));
            return;
        }

        float rate = clamp(call.getFloat("rate", 0.78f), 0.6f, 1.1f);
        float pitch = clamp(call.getFloat("pitch", 1.08f), 0.8f, 1.25f);
        float volume = clamp(call.getFloat("volume", 0.86f), 0.1f, 1.0f);
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is not ready");
            return;
        }

        activity.runOnUiThread(() -> ensureTextToSpeech(activity, () -> {
            if (!textToSpeechReady || textToSpeech == null) {
                call.reject("Turkish text to speech is unavailable");
                return;
            }
            textToSpeech.setSpeechRate(rate);
            textToSpeech.setPitch(pitch);
            android.os.Bundle parameters = new android.os.Bundle();
            parameters.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume);
            int result = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, parameters, "minaplay-touch");
            call.resolve(new JSObject().put("spoken", result == TextToSpeech.SUCCESS));
        }));
    }

    @PluginMethod
    public void downloadAndInstallUpdate(PluginCall call) {
        String url = call.getString("url", "").trim();
        String expectedSha256 = call.getString("sha256", "").trim().toLowerCase(Locale.ROOT);
        Activity activity = getActivity();
        if (activity == null || url.isEmpty() || !expectedSha256.matches("^[a-f0-9]{64}$")) {
            call.reject("Secure update URL, checksum, or activity is unavailable");
            return;
        }

        final URL updateUrl;
        try {
            updateUrl = requireSecureUrl(new URL(url));
        } catch (Exception error) {
            call.reject("MinaPlay updates require a credential-free HTTPS URL", error);
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !activity.getPackageManager().canRequestPackageInstalls()) {
            if (isLockTaskActive(activity)) {
                activity.stopLockTask();
            }
            Intent permissionIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + activity.getPackageName())
            );
            permissionIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(permissionIntent);
            call.resolve(new JSObject().put("status", "permission_required"));
            return;
        }

        updateExecutor.execute(() -> {
            File updateFile = new File(activity.getCacheDir(), "minaplay-update.apk");
            File temporaryFile = new File(activity.getCacheDir(), "minaplay-update-download.apk");
            try {
                HttpURLConnection connection = openSecureConnection(updateUrl);
                int statusCode = connection.getResponseCode();
                if (statusCode < 200 || statusCode >= 300) {
                    throw new IllegalStateException("Update server returned " + statusCode);
                }
                long expectedLength = connection.getContentLengthLong();
                MessageDigest downloadedDigest = MessageDigest.getInstance("SHA-256");

                try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(temporaryFile)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                        downloadedDigest.update(buffer, 0, read);
                    }
                } finally {
                    connection.disconnect();
                }

                if (temporaryFile.length() < 1_000_000 || (expectedLength > 0 && temporaryFile.length() != expectedLength)) {
                    throw new IllegalStateException("Downloaded update is incomplete");
                }
                if (!expectedSha256.equals(hexDigest(downloadedDigest.digest()))) {
                    throw new IllegalStateException("Downloaded update checksum does not match the signed release metadata");
                }
                PackageManager packageManager = activity.getPackageManager();
                PackageInfo archiveInfo = getArchivePackageInfo(packageManager, temporaryFile);
                if (archiveInfo == null || !activity.getPackageName().equals(archiveInfo.packageName)) {
                    throw new IllegalStateException("Downloaded file is not a MinaPlay update");
                }
                PackageInfo installedInfo = getInstalledPackageInfo(packageManager, activity.getPackageName());
                if (!sameSigningCertificates(installedInfo, archiveInfo)) {
                    throw new IllegalStateException("Downloaded MinaPlay signature does not match the installed application");
                }
                long installedVersion = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    ? installedInfo.getLongVersionCode()
                    : installedInfo.versionCode;
                long updateVersion = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    ? archiveInfo.getLongVersionCode()
                    : archiveInfo.versionCode;
                if (updateVersion <= installedVersion) {
                    throw new IllegalStateException("Downloaded MinaPlay version is not newer");
                }
                if (updateFile.exists() && !updateFile.delete()) {
                    throw new IllegalStateException("Old update file could not be removed");
                }
                if (!temporaryFile.renameTo(updateFile)) {
                    throw new IllegalStateException("Update file could not be prepared");
                }

                activity.runOnUiThread(() -> openPackageInstaller(activity, updateFile, call));
            } catch (Exception error) {
                temporaryFile.delete();
                call.reject("Update download failed: " + error.getMessage(), error);
            }
        });
    }

    private URL requireSecureUrl(URL url) {
        if (!"https".equalsIgnoreCase(url.getProtocol()) || url.getUserInfo() != null) {
            throw new IllegalArgumentException("Only credential-free HTTPS URLs are allowed");
        }
        return url;
    }

    private HttpURLConnection openSecureConnection(URL initialUrl) throws Exception {
        URL currentUrl = requireSecureUrl(initialUrl);
        for (int redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
            HttpURLConnection connection = (HttpURLConnection) currentUrl.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(10 * 60_000);
            connection.setRequestProperty("Cache-Control", "no-cache");
            connection.setRequestProperty("Accept", "application/vnd.android.package-archive");
            connection.connect();
            int statusCode = connection.getResponseCode();
            if (statusCode < 300 || statusCode >= 400) {
                return connection;
            }
            String location = connection.getHeaderField("Location");
            connection.disconnect();
            if (location == null || location.trim().isEmpty()) {
                throw new IllegalStateException("Update redirect is missing a destination");
            }
            currentUrl = requireSecureUrl(new URL(currentUrl, location));
        }
        throw new IllegalStateException("Update download has too many redirects");
    }

    private PackageInfo getArchivePackageInfo(PackageManager packageManager, File apkFile) {
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
            ? PackageManager.GET_SIGNING_CERTIFICATES
            : PackageManager.GET_SIGNATURES;
        return packageManager.getPackageArchiveInfo(apkFile.getAbsolutePath(), flags);
    }

    private PackageInfo getInstalledPackageInfo(PackageManager packageManager, String packageName) throws PackageManager.NameNotFoundException {
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
            ? PackageManager.GET_SIGNING_CERTIFICATES
            : PackageManager.GET_SIGNATURES;
        return packageManager.getPackageInfo(packageName, flags);
    }

    private boolean sameSigningCertificates(PackageInfo installedInfo, PackageInfo archiveInfo) throws Exception {
        Set<String> installed = signingCertificateDigests(installedInfo);
        Set<String> archive = signingCertificateDigests(archiveInfo);
        return !installed.isEmpty() && installed.equals(archive);
    }

    @SuppressWarnings("deprecation")
    private Set<String> signingCertificateDigests(PackageInfo packageInfo) throws Exception {
        Signature[] signatures;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && packageInfo.signingInfo != null) {
            signatures = packageInfo.signingInfo.getApkContentsSigners();
        } else {
            signatures = packageInfo.signatures;
        }
        Set<String> digests = new HashSet<>();
        if (signatures == null) {
            return digests;
        }
        for (Signature signature : signatures) {
            MessageDigest certificateDigest = MessageDigest.getInstance("SHA-256");
            digests.add(hexDigest(certificateDigest.digest(signature.toByteArray())));
        }
        return digests;
    }

    private String hexDigest(byte[] digest) {
        StringBuilder result = new StringBuilder(digest.length * 2);
        for (byte value : digest) {
            result.append(String.format(Locale.ROOT, "%02x", value & 0xff));
        }
        return result.toString();
    }

    private void openPackageInstaller(Activity activity, File updateFile, PluginCall call) {
        try {
            if (isLockTaskActive(activity)) {
                activity.stopLockTask();
            }
            Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", updateFile);
            Intent installIntent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            installIntent.setData(uri);
            installIntent.setClipData(ClipData.newRawUri("MinaPlay update", uri));
            installIntent.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            for (ResolveInfo handler : activity.getPackageManager().queryIntentActivities(installIntent, PackageManager.MATCH_DEFAULT_ONLY)) {
                activity.grantUriPermission(handler.activityInfo.packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
            activity.startActivity(installIntent);
            call.resolve(new JSObject().put("status", "installer_opened"));
        } catch (Exception error) {
            call.reject("Package installer could not be opened: " + error.getMessage(), error);
        }
    }

    private void ensureTextToSpeech(Activity activity, Runnable ready) {
        if (textToSpeechReady && textToSpeech != null) {
            ready.run();
            return;
        }
        if (textToSpeech != null) {
            activity.getWindow().getDecorView().postDelayed(() -> ensureTextToSpeech(activity, ready), 80);
            return;
        }
        textToSpeech = new TextToSpeech(activity.getApplicationContext(), status -> {
            textToSpeechReady = status == TextToSpeech.SUCCESS
                && textToSpeech != null
                && textToSpeech.setLanguage(new Locale("tr", "TR")) >= TextToSpeech.LANG_AVAILABLE;
            ready.run();
        });
    }

    private float clamp(Float value, float minimum, float maximum) {
        float safeValue = value == null ? minimum : value;
        return Math.max(minimum, Math.min(maximum, safeValue));
    }

    @Override
    protected void handleOnDestroy() {
        updateExecutor.shutdownNow();
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
            textToSpeech = null;
            textToSpeechReady = false;
        }
        super.handleOnDestroy();
    }

    private boolean isLockTaskActive(Activity activity) {
        ActivityManager activityManager = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
        return activityManager != null && activityManager.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
    }

    private void keepFullscreen(Activity activity) {
        Window window = activity.getWindow();
        View decorView = window.getDecorView();

        WindowCompat.setDecorFitsSystemWindows(window, false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        if (controller != null) {
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            controller.hide(WindowInsetsCompat.Type.systemBars());
        }

        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }
}
