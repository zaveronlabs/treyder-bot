package uz.zaveron.yodla;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
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

import java.io.File;
import java.util.ArrayList;
import java.util.Locale;

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
    // AI suhbatdosh: model fayli, yuklab olish va telefon ovozi (AI javoblari oldindan yozilmagan)
    // ikki miya: e2b tez va yengil, e4b aqlliroq (kattaroq)
    private static String modelNomi(String k) { return "e4b".equals(k) ? "gemma-4-E4B-it.litertlm" : "gemma-4-E2B-it.litertlm"; }
    private static String modelUrl(String k) {
        String n = "e4b".equals(k) ? "E4B" : "E2B";
        return "https://huggingface.co/litert-community/gemma-4-" + n + "-it-litert-lm/resolve/main/gemma-4-" + n + "-it.litertlm";
    }
    private String tanlanganModel() { return getPreferences(MODE_PRIVATE).getString("model", "e2b"); }
    private Miya miya;
    private TextToSpeech tts;
    private boolean ttsTayyor = false;

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

        // --- AI suhbatdosh ---
        @JavascriptInterface
        public String aiHolat() { return modelHolati(); }

        @JavascriptInterface
        public void aiYukla() { runOnUiThread(() -> modelniYukla()); }

        // miyani almashtirish: keyingi suhbat yangi model bilan ochiladi
        @JavascriptInterface
        public void aiTanla(String k) {
            getPreferences(MODE_PRIVATE).edit().putString("model", "e4b".equals(k) ? "e4b" : "e2b").apply();
            if (miya != null) { miya.yop(); miya = null; }
        }

        @JavascriptInterface
        public void aiBoshla(String tizim) {
            File f = modelFayli();
            if (!f.exists()) { aiXabar("{\"t\":\"xato\",\"s\":\"model yo'q\"}"); return; }
            if (miya == null) miya = new Miya(getCacheDir().getAbsolutePath(), getPreferences(MODE_PRIVATE), j -> aiXabar(j));
            miya.boshla(f.getAbsolutePath(), tizim);
        }

        @JavascriptInterface
        public void aiYoz(String matn) { if (miya != null) miya.yoz(matn); }

        @JavascriptInterface
        public void aiTarjima(String id, String matn) {
            if (miya != null) miya.tarjima(id, matn);
            else aiXabar("{\"t\":\"tarjima\",\"id\":" + JSONObject.quote(id) + ",\"xato\":\"miya yo'q\"}");
        }

        @JavascriptInterface
        public void gapir(String matn, float tezlik) { runOnUiThread(() -> ovozChiqar(matn, tezlik)); }

        // tashqi havola (YouTube va h.k.) telefonning o'z ilovasida ochiladi
        @JavascriptInterface
        public void och(String url) { runOnUiThread(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { } }); }

        // tinglash sanog'i: faqat telefonda ovoz chiqayotgan vaqt (video pauzada bo'lsa sanalmaydi)
        @JavascriptInterface
        public void tinglashBoshla() {
            runOnUiThread(() -> {
                Tinglov.prefs(MainActivity.this).edit().putLong("sek", 0).apply();
                Intent i = new Intent(MainActivity.this, Tinglov.class);
                try { if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i); } catch (Exception e) { }
            });
        }

        // bildirishnoma ruxsati (sanoq bildirishnomada ko'rinishi uchun), bir marta so'raladi
        @JavascriptInterface
        public void bildirishRuxsat() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 8);
            });
        }

        @JavascriptInterface
        public long tinglashSek() { return Tinglov.prefs(MainActivity.this).getLong("sek", 0); }

        @JavascriptInterface
        public long tinglashTugat() {
            stopService(new Intent(MainActivity.this, Tinglov.class));
            return Tinglov.prefs(MainActivity.this).getLong("sek", 0);
        }

        @JavascriptInterface
        public void gapirToxtat() { runOnUiThread(() -> { if (tts != null) tts.stop(); }); }
    }

    private void aiXabar(String json) { runOnUiThread(() -> js("window.yodlaAI&&window.yodlaAI(" + json + ")")); }

    private File modelFayli() { return modelFayli(tanlanganModel()); }
    private File modelFayli(String k) { return new File(getExternalFilesDir(null), modelNomi(k)); }
    private boolean modelBor(String k) { File f = modelFayli(k); return f.exists() && f.length() > 100_000_000L; }

    private String modelHolati() {
        try {
            JSONObject o = new JSONObject();
            String k = tanlanganModel();
            o.put("model", k);
            o.put("bor", modelBor(k));
            o.put("e2b", modelBor("e2b")); o.put("e4b", modelBor("e4b"));
            long id = getPreferences(MODE_PRIVATE).getLong("yuk", -1);
            if (id >= 0 && !modelBor(k) && k.equals(getPreferences(MODE_PRIVATE).getString("yukModel", "e2b"))) {
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                try (Cursor c = dm.query(new DownloadManager.Query().setFilterById(id))) {
                    if (c != null && c.moveToFirst()) {
                        int st = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                        long got = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                        long all = c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                        o.put("holat", st == DownloadManager.STATUS_FAILED ? "xato" : st == DownloadManager.STATUS_SUCCESSFUL ? "tayyor" : "yuklanmoqda");
                        o.put("olindi", got); o.put("jami", all);
                        o.put("sabab", c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON)));
                    }
                }
            }
            return o.toString();
        } catch (Exception e) { return "{\"bor\":false,\"holat\":\"xato\"}"; }
    }

    private void modelniYukla() {
        DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        long eski = getPreferences(MODE_PRIVATE).getLong("yuk", -1);
        if (eski >= 0) dm.remove(eski);
        String k = tanlanganModel();
        File f = modelFayli(k);
        if (f.exists()) f.delete();
        DownloadManager.Request r = new DownloadManager.Request(Uri.parse(modelUrl(k)))
                .setTitle("Yodla: Andrew miyasi")
                .setDescription("AI suhbatdosh modeli")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalFilesDir(this, null, modelNomi(k));
        long id = dm.enqueue(r);
        getPreferences(MODE_PRIVATE).edit().putLong("yuk", id).putString("yukModel", k).apply();
    }

    private void ovozChiqar(String matn, float tezlik) {
        if (tts == null) {
            tts = new TextToSpeech(this, st -> {
                ttsTayyor = st == TextToSpeech.SUCCESS;
                if (ttsTayyor) { tts.setLanguage(Locale.US); ovozChiqar(matn, tezlik); }
                else js("window.yodlaGapirdi&&window.yodlaGapirdi()");
            });
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { runOnUiThread(() -> js("window.yodlaGapirdi&&window.yodlaGapirdi()")); }
                @Override public void onError(String id) { runOnUiThread(() -> js("window.yodlaGapirdi&&window.yodlaGapirdi()")); }
            });
            return;
        }
        if (!ttsTayyor) return;
        tts.setSpeechRate(tezlik);
        tts.speak(matn, TextToSpeech.QUEUE_FLUSH, null, "yodla");
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
    protected void onResume() {
        super.onResume();
        if (web != null) js("window.yodlaQaytdi&&window.yodlaQaytdi()");
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (sr != null && eshityapti) { eshityapti = false; sr.cancel(); xato("aborted"); }
    }

    @Override
    protected void onDestroy() {
        if (sr != null) sr.destroy();
        if (miya != null) miya.yop();
        if (tts != null) tts.shutdown();
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
