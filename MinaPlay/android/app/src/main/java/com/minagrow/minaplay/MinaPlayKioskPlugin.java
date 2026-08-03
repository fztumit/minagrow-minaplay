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
import java.util.Locale;
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
        Activity activity = getActivity();
        if (activity == null || url.isEmpty()) {
            call.reject("Update URL or activity is unavailable");
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
                HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setConnectTimeout(15_000);
                connection.setReadTimeout(10 * 60_000);
                connection.setRequestProperty("Cache-Control", "no-cache");
                connection.setRequestProperty("Accept", "application/vnd.android.package-archive");
                connection.connect();
                int statusCode = connection.getResponseCode();
                if (statusCode < 200 || statusCode >= 300) {
                    throw new IllegalStateException("Update server returned " + statusCode);
                }
                long expectedLength = connection.getContentLengthLong();

                try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(temporaryFile)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        output.write(buffer, 0, read);
                    }
                } finally {
                    connection.disconnect();
                }

                if (temporaryFile.length() < 1_000_000 || (expectedLength > 0 && temporaryFile.length() != expectedLength)) {
                    throw new IllegalStateException("Downloaded update is incomplete");
                }
                PackageInfo archiveInfo = activity.getPackageManager().getPackageArchiveInfo(
                    temporaryFile.getAbsolutePath(),
                    PackageManager.GET_SIGNING_CERTIFICATES
                );
                if (archiveInfo == null || !activity.getPackageName().equals(archiveInfo.packageName)) {
                    throw new IllegalStateException("Downloaded file is not a MinaPlay update");
                }
                PackageInfo installedInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
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
