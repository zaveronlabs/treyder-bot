package uz.zaveron.yodla;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

// Yodla: ilova ichidagi (assets) veb-sahifani internetsiz ochadi; gapirish mashqi uchun telefonning ovoz tanish xizmati
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int MIK = 7;
    // orqaga tugmasi: ochiq mashqdan chiqish, boshqa bo'limdan So'zlarga qaytish, keyin ilovadan chiqish
    private static final String ORQAGA = "(function(){var q=document.getElementById('quit');if(q){q.click();return 1}"
            + "var t=document.querySelector('.tab.on');if(t&&t.dataset.t!=='words'){document.querySelector('.tab[data-t=words]').click();return 1}return 0})()";
    private WebView web;
    private SpeechRecognizer sr;
    private String kutilganTil = null;
    private boolean eshityapti = false;

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
        web.addJavascriptInterface(new Kopik(), "YodlaNative");
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

    // JavaScript'dan chaqiriladi: YodlaNative.tingla("en-US"), YodlaNative.toxtat()
    private class Kopik {
        @JavascriptInterface
        public void tingla(final String til) { runOnUiThread(() -> eshit(til)); }

        @JavascriptInterface
        public void toxtat() { runOnUiThread(() -> { eshityapti = false; if (sr != null) sr.cancel(); }); }
    }

    private void js(String kod) { web.evaluateJavascript(kod, null); }

    private void xato(String kod) { js("window.yodlaXato&&window.yodlaXato(" + JSONObject.quote(kod) + ")"); }

    private void eshit(String til) {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            kutilganTil = til;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIK);
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { xato("mavjud-emas"); return; }
        if (sr == null) {
            sr = SpeechRecognizer.createSpeechRecognizer(this);
            sr.setRecognitionListener(new RecognitionListener() {
                @Override public void onResults(Bundle b) {
                    eshityapti = false;
                    ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    js("window.yodlaEshitdi&&window.yodlaEshitdi(" + new JSONArray(r == null ? new ArrayList<String>() : r) + ")");
                }
                @Override public void onError(int e) { eshityapti = false; xato(String.valueOf(e)); }
                @Override public void onReadyForSpeech(Bundle b) { }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float v) { }
                @Override public void onBufferReceived(byte[] b) { }
                @Override public void onEndOfSpeech() { }
                @Override public void onPartialResults(Bundle b) { }
                @Override public void onEvent(int t, Bundle b) { }
            });
        }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, til);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, til);
        i.putExtra("android.speech.extra.EXTRA_ADDITIONAL_LANGUAGES", new String[]{til});
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        sr.cancel();
        eshityapti = true;
        sr.startListening(i);
    }

    @Override
    public void onRequestPermissionsResult(int kod, String[] p, int[] natija) {
        if (kod != MIK) return;
        String til = kutilganTil;
        kutilganTil = null;
        if (natija.length > 0 && natija[0] == PackageManager.PERMISSION_GRANTED && til != null) eshit(til);
        else xato("ruxsat");
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (sr != null && eshityapti) { eshityapti = false; sr.cancel(); xato("aborted"); }
    }

    @Override
    protected void onDestroy() {
        if (sr != null) sr.destroy();
        super.onDestroy();
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
