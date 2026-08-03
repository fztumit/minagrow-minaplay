package com.minagrow.minaplay;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import java.util.ArrayList;
import java.util.List;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int MINAPLAY_MEDIA_PERMISSION_REQUEST = 4201;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MinaPlayKioskPlugin.class);
        super.onCreate(savedInstanceState);
        clearStaleWebViewCache();
        requestMediaPermissionsIfNeeded(true, true);
        installMediaPermissionBridge();
        enterImmersiveFullscreen();
    }

    @Override
    public void onResume() {
        super.onResume();
        enterImmersiveFullscreen();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enterImmersiveFullscreen();
        }
    }

    @Override
    public void onBackPressed() {
        enterImmersiveFullscreen();
        if (bridge != null) {
            bridge.triggerDocumentJSEvent("minaplay:native-back");
        }
    }

    private void enterImmersiveFullscreen() {
        Window window = getWindow();
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

    private void clearStaleWebViewCache() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }

        WebView webView = bridge.getWebView();
        webView.clearCache(true);
    }

    private void requestMediaPermissionsIfNeeded(boolean wantsVideo, boolean wantsAudio) {
        List<String> permissions = new ArrayList<>();
        if (wantsVideo && ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }
        if (wantsAudio && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO);
        }
        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), MINAPLAY_MEDIA_PERMISSION_REQUEST);
        }
    }

    private void installMediaPermissionBridge() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }

        bridge.getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsVideo = false;
                    boolean wantsAudio = false;
                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                            wantsVideo = true;
                        }
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            wantsAudio = true;
                        }
                    }

                    boolean videoGranted = !wantsVideo
                        || ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
                    boolean audioGranted = !wantsAudio
                        || ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

                    if ((wantsVideo || wantsAudio) && videoGranted && audioGranted) {
                        request.grant(request.getResources());
                    } else {
                        requestMediaPermissionsIfNeeded(wantsVideo, wantsAudio);
                        request.deny();
                    }
                });
            }
        });
    }
}
