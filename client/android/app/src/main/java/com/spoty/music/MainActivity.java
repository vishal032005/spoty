package com.spoty.music;

import android.os.Bundle;
import android.os.PowerManager;
import android.content.Context;
import android.webkit.WebView;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Keep CPU awake when screen turns off for uninterrupted audio
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Spoty::BackgroundAudio");
                wakeLock.acquire();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Allow media playback without gesture restrictions
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
