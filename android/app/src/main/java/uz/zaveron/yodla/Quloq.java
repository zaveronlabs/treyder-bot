package uz.zaveron.yodla;

import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;

import com.google.mlkit.nl.languageid.IdentifiedLanguage;
import com.google.mlkit.nl.languageid.LanguageIdentification;
import com.google.mlkit.nl.languageid.LanguageIdentificationOptions;
import com.google.mlkit.nl.languageid.LanguageIdentifier;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

// "Quloq": telefonda nima o'ynayotganini (YouTube, Spotify...) nomi va ijrochisidan bilib oladi
// va faqat inglizcha narsa o'ynab turgan soniyalarni sanaydi. Bildirishnomalarga ruxsat kerak.
public class Quloq extends NotificationListenerService {
    static final long QADAM = 5000;
    static volatile boolean ulangan = false;
    static volatile String hozir = "";       // hozir o'ynayotgan narsa
    static volatile int hozirTil = 0;        // 1 inglizcha, -1 boshqa til, 0 aniqlanmoqda
    private static final Map<String, Integer> kesh = new HashMap<>();

    private final Handler h = new Handler(Looper.getMainLooper());
    private MediaSessionManager msm;
    private LanguageIdentifier lid;
    private boolean yuryapti = false;
    private final MediaSessionManager.OnActiveSessionsChangedListener ozgardi = l -> uygot();

    static SharedPreferences prefs(Context c) { return Tinglov.prefs(c); }
    static String bugun() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }

    static boolean ruxsatBor(Context c) {
        String s = Settings.Secure.getString(c.getContentResolver(), "enabled_notification_listeners");
        return s != null && s.contains(c.getPackageName());
    }

    @Override
    public void onListenerConnected() {
        ulangan = true;
        msm = (MediaSessionManager) getSystemService(MEDIA_SESSION_SERVICE);
        lid = LanguageIdentification.getClient(new LanguageIdentificationOptions.Builder().setConfidenceThreshold(0.3f).build());
        try { msm.addOnActiveSessionsChangedListener(ozgardi, new ComponentName(this, Quloq.class), h); } catch (Exception e) { }
        uygot();
    }

    @Override
    public void onListenerDisconnected() {
        ulangan = false;
        try { msm.removeOnActiveSessionsChangedListener(ozgardi); } catch (Exception e) { }
        h.removeCallbacks(tik);
        yuryapti = false;
    }

    @Override
    public void onNotificationPosted(android.service.notification.StatusBarNotification sbn) { uygot(); }

    // biror narsa o'ynasa, har 5 soniyada tekshiruv yuradi; hech narsa o'ynamasa to'xtaydi
    private void uygot() {
        if (!yuryapti) { yuryapti = true; h.postDelayed(tik, QADAM); }
    }

    private final Runnable tik = new Runnable() {
        @Override public void run() {
            boolean oynayapti = false, inglizcha = false;
            String nom = "";
            try {
                List<MediaController> l = msm.getActiveSessions(new ComponentName(Quloq.this, Quloq.class));
                for (MediaController mc : l) {
                    PlaybackState ps = mc.getPlaybackState();
                    if (ps == null || ps.getState() != PlaybackState.STATE_PLAYING) continue;
                    MediaMetadata md = mc.getMetadata();
                    String t = md == null ? "" : matn(md, MediaMetadata.METADATA_KEY_TITLE);
                    String a = md == null ? "" : matn(md, MediaMetadata.METADATA_KEY_ARTIST);
                    if (a.isEmpty() && md != null) a = matn(md, MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
                    if (t.isEmpty()) continue;
                    oynayapti = true;
                    int til = tilniBil(t, a);
                    if (nom.isEmpty() || til == 1) { nom = a.isEmpty() ? t : t + " — " + a; hozirTil = til; }
                    if (til == 1) inglizcha = true;
                }
            } catch (Exception e) { }
            hozir = oynayapti ? nom : "";
            if (!oynayapti) hozirTil = 0;
            if (oynayapti) yoz(nom, inglizcha);
            if (oynayapti) h.postDelayed(this, QADAM); else yuryapti = false;
        }
    };

    private static String matn(MediaMetadata md, String k) { CharSequence s = md.getText(k); return s == null ? "" : s.toString().trim(); }

    // jami inglizcha soniyalar + bugungi ro'yxat (nima qancha o'ynadi, sanaldimi)
    private void yoz(String nom, boolean inglizcha) {
        SharedPreferences sp = prefs(this);
        SharedPreferences.Editor ed = sp.edit();
        long q = QADAM / 1000;
        if (inglizcha) ed.putLong("jami", sp.getLong("jami", 0) + q);
        String kun = bugun();
        try {
            JSONObject j = kun.equals(sp.getString("jurnalKun", "")) ? new JSONObject(sp.getString("jurnal", "{}")) : new JSONObject();
            JSONObject e = j.optJSONObject(nom);
            if (e == null) { if (j.length() > 60) j = new JSONObject(); e = new JSONObject(); j.put(nom, e); }
            e.put("s", e.optLong("s", 0) + q).put("en", inglizcha).put("at", System.currentTimeMillis());
            ed.putString("jurnal", j.toString()).putString("jurnalKun", kun);
        } catch (Exception e) { }
        ed.apply();
    }

    // ---------- til aniqlash ----------
    private static final Set<String> EN = new HashSet<>(Arrays.asList(
            "the", "you", "your", "i", "i'm", "im", "me", "my", "we", "our", "it", "it's", "is", "are", "was", "be", "to", "of", "and", "in", "on",
            "for", "with", "at", "a", "an", "this", "that", "what", "how", "why", "who", "when", "all", "no", "not", "don't", "can't", "just", "love",
            "girl", "boy", "life", "night", "day", "time", "never", "always", "feel", "want", "need", "know", "go", "come", "back", "up", "down",
            "out", "like", "get", "got", "make", "take", "can", "will", "would", "should", "about", "from", "they", "she", "he", "her", "his",
            "dreams", "heart", "world", "dead", "alive", "better", "lonely", "friends", "episode", "season", "interview", "podcast", "explained",
            "talks", "story", "best", "first", "every", "people", "man", "woman", "new", "old", "only", "way", "said", "say", "one", "two"));
    private static final Set<String> UZ = new HashSet<>(Arrays.asList(
            "va", "bilan", "uchun", "men", "sen", "siz", "biz", "ular", "bu", "shu", "u", "emas", "yo'q", "bor", "qo'shiq", "qo'shig'i", "klip", "yangi",
            "sevgi", "sevaman", "jonim", "onam", "dadam", "yurak", "kel", "ket", "hayot", "do'st", "bo'ldi", "qanday", "nima", "nega", "qilib",
            "uchrashuv", "kuni", "yil", "jonli", "efir", "ko'rsatuv", "film", "serial", "qism", "o'zbek", "tilida", "tarjima", "ham", "endi", "seni",
            "meni", "qizlar", "yigit", "ona", "ota", "vatan", "bayram", "to'y", "kecha", "bugun", "xabar", "yangiliklar"));
    // "Official Video", "Lyrics" kabi yorliqlar o'zbekcha videolarda ham bo'ladi, shuning uchun hisobga olinmaydi
    private static String tozala(String s) {
        return s.replaceAll("(?i)[\\(\\[][^\\)\\]]*(official|video|audio|lyric|visuali[sz]er|music|clip|klip|remix|prod|live|hd|4k|mv)[^\\)\\]]*[\\)\\]]", " ")
                .replaceAll("(?i)\\b(official|music video|lyric video|lyrics|audio|video|remix|ft\\.?|feat\\.?|prod\\.?|hd|4k|mv)\\b", " ")
                .replaceAll("[#@|•·_]+", " ").trim();
    }

    private int tilniBil(String t, String a) {
        SharedPreferences sp = prefs(this);
        String ak = a.toLowerCase(Locale.ROOT);
        if (!ak.isEmpty()) {
            if (sp.getBoolean("ha:" + ak, false)) return 1;
            if (sp.getBoolean("yoq:" + ak, false)) return -1;
            if (sp.getString("tanish", "").contains("|" + ak + "|")) return 1;
        }
        String kalit = t + "\n" + a;
        synchronized (kesh) { Integer k = kesh.get(kalit); if (k != null) return k; kesh.put(kalit, 0); }
        String m = tozala(t);
        int oddiy = qoida(m);
        if (oddiy != 0) { synchronized (kesh) { kesh.put(kalit, oddiy); } return oddiy; }
        if (lid == null) { synchronized (kesh) { kesh.put(kalit, -1); } return -1; }
        lid.identifyPossibleLanguages(m).addOnSuccessListener(l -> {
            int natija = -1;
            for (IdentifiedLanguage x : l) {
                if ("en".equals(x.getLanguageTag()) && x.getConfidence() >= 0.5f) natija = 1;
            }
            if (natija != 1 && inglizchaSozlar(m) >= 0.5) natija = 1;
            synchronized (kesh) { kesh.put(kalit, natija); }
        }).addOnFailureListener(e -> { synchronized (kesh) { kesh.put(kalit, inglizchaSozlar(m) >= 0.5 ? 1 : -1); } });
        return 0;
    }

    // aniq belgilar: kirill yoki o'zbekcha so'zlar bo'lsa inglizcha emas, inglizcha so'zlar ko'p bo'lsa inglizcha
    private static int qoida(String m) {
        // kirill, arab, xitoy, koreys va h.k. yozuv: inglizcha emas
        if (m.matches("(?s).*[\\u0400-\\u04FF\\u0590-\\u06FF\\u0900-\\u0DFF\\u3040-\\u30FF\\u4E00-\\u9FFF\\uAC00-\\uD7AF].*")) return -1;
        String k = m.toLowerCase(Locale.ROOT).replaceAll("[ʻʼ’‘`´]", "'");
        if (k.matches(".*[og]'[a-z].*")) return -1;
        String[] s = k.split("[^a-z']+");
        int uz = 0, n = 0;
        for (String w : s) { if (w.isEmpty()) continue; n++; if (UZ.contains(w)) uz++; }
        if (uz > 0 && uz * 4 >= n) return -1;
        if (n >= 3 && inglizchaSozlar(m) >= 0.34) return 1;
        return 0;
    }

    private static double inglizchaSozlar(String m) {
        String[] s = m.toLowerCase(Locale.ROOT).replaceAll("[ʻʼ’‘`´]", "'").split("[^a-z']+");
        int en = 0, n = 0;
        for (String w : s) { if (w.isEmpty()) continue; n++; if (EN.contains(w)) en++; }
        return n == 0 ? 0 : (double) en / n;
    }

    // ilova uchun holat: ruxsat, jami inglizcha soniya, hozir nima o'ynayapti, bugungi ro'yxat
    static String holat(Context c) {
        try {
            SharedPreferences sp = prefs(c);
            JSONObject o = new JSONObject();
            o.put("ruxsat", ruxsatBor(c)).put("ulangan", ulangan).put("jami", sp.getLong("jami", 0));
            o.put("hozir", hozir).put("hozirTil", hozirTil);
            JSONArray r = new JSONArray();
            if (bugun().equals(sp.getString("jurnalKun", ""))) {
                JSONObject j = new JSONObject(sp.getString("jurnal", "{}"));
                for (java.util.Iterator<String> it = j.keys(); it.hasNext(); ) {
                    String k = it.next(); JSONObject e = j.getJSONObject(k);
                    r.put(new JSONObject().put("n", k).put("s", e.optLong("s")).put("en", e.optBoolean("en")).put("at", e.optLong("at")));
                }
            }
            o.put("bugun", r);
            return o.toString();
        } catch (Exception e) { return "{\"ruxsat\":false}"; }
    }

    // foydalanuvchi tuzatsa: shu ijrochi (yoki kanal) bundan keyin inglizcha / inglizcha emas deb sanaladi
    static void belgila(Context c, String nom, boolean en) {
        int i = nom.lastIndexOf(" — ");
        String a = (i >= 0 ? nom.substring(i + 3) : nom).toLowerCase(Locale.ROOT);
        prefs(c).edit().putBoolean("ha:" + a, en).putBoolean("yoq:" + a, !en).apply();
        synchronized (kesh) { kesh.clear(); }
        try {
            SharedPreferences sp = prefs(c);
            JSONObject j = new JSONObject(sp.getString("jurnal", "{}"));
            JSONObject e = j.optJSONObject(nom);
            if (e != null && e.optBoolean("en") != en) {
                // bugun o'ynagan vaqti ham darhol tuzatiladi
                long jami = Math.max(0, sp.getLong("jami", 0) + (en ? 1 : -1) * e.optLong("s"));
                e.put("en", en); sp.edit().putString("jurnal", j.toString()).putLong("jami", jami).apply();
            }
        } catch (Exception e) { }
    }
}
