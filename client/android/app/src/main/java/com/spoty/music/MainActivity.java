package com.spoty.music;

import android.os.Bundle;
import android.os.Build;
import android.os.PowerManager;
import android.content.Context;
import android.content.Intent;
import android.webkit.WebView;
import android.webkit.WebSettings;
import androidx.core.app.ActivityCompat;
import android.content.pm.PackageManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Request POST_NOTIFICATIONS permission on Android 13+ for lock screen controls
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // Launch Foreground Media Service to guarantee background CPU & network access
        try {
            Intent serviceIntent = new Intent(this, BackgroundAudioService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Spoty::BackgroundAudio");
                wakeLock.acquire();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Allow media playback without user gesture restrictions
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Prevent Chromium from pausing audio when app is minimized
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.resumeTimers();
            webView.onResume();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        // Prevent Android from freezing WebView when screen is locked
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.resumeTimers();
            webView.onResume();
        }
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
