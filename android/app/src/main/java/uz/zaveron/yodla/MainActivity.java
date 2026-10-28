package uz.zaveron.yodla;

import android.app.Activity;
import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

// Yodla: ilova ichidagi (assets) veb-sahifani internetsiz ochadi
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    // orqaga tugmasi: ochiq mashqdan chiqish, boshqa bo'limdan So'zlarga qaytish, keyin ilovadan chiqish
    private static final String ORQAGA = "(function(){var q=document.getElementById('quit');if(q){q.click();return 1}"
            + "var t=document.querySelector('.tab.on');if(t&&t.dataset.t!=='words'){document.querySelector('.tab[data-t=words]').click();return 1}return 0})()";
    private WebView web;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web = new WebView(this);
        web.setBackgroundColor(0xFF07061A);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
        });
        setContentView(web);
        if (saved == null || web.restoreState(saved) == null) web.loadUrl("https://" + HOST + "/assets/index.html");
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript(ORQAGA, v -> { if (!"1".equals(v)) finish(); });
    }
}
