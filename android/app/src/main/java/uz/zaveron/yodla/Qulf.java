package uz.zaveron.yodla;

import android.Manifest;
import android.accessibilityservice.AccessibilityService;
import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.RouteInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.telecom.TelecomManager;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.Inet4Address;
import java.util.Calendar;
import java.util.Locale;

// Telefon qulfi. Uyda (uy Wi-Fi'ida) dars vaqti kelsa, bugungi dars tugaguncha telefonda faqat Yodla,
// qo'ng'iroq va budilnik ishlaydi; uxlash vaqtida faqat qo'ng'iroq va budilnik.
// Qaysi vaqtda qulf bo'lishini ilova yuboradi (Ustoz jadvalidagi "qulf"), bajarilgan darslar "done" ro'yxatida.
public class Qulf extends AccessibilityService {
    static volatile Qulf men;
    static final long UZOQ = 30 * 60000L;        // uydan shuncha vaqt uzoqda bo'lsa (ekran yoniq), qulf yechiladi
    static final long FAVQ = 10 * 60000L;        // favqulodda ochish: 10 daqiqa
    static final int FAVQ_HAFTA = 2;             // haftasiga 2 marta
    static final long FAVQ_KUT = 60000L;         // ochishdan oldin 1 daqiqa kutish

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("qulf", Context.MODE_PRIVATE); }

    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable tikR = this::tik;
    private String oldPaket = "";
    private View oyna;
    private boolean qoshilgan = false;
    private TextView tSarlavha, tMatn, tKut;
    private Button bDars, bQong, bFavq;
    private long favqKut = 0;
    private long imtiyoz = 0;
    private String uyPaket = "";
    private AudioFocusRequest fokus;
    private ConnectivityManager.NetworkCallback tarmoqCb;
    private BroadcastReceiver ekranR;

    // ---------- xizmat ----------
    @Override
    protected void onServiceConnected() {
        men = this;
        try {
            ResolveInfo r = getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), PackageManager.MATCH_DEFAULT_ONLY);
            if (r != null && r.activityInfo != null) uyPaket = r.activityInfo.packageName;
        } catch (Exception e) { }
        ekranR = new BroadcastReceiver() { @Override public void onReceive(Context c, Intent i) { h.post(Qulf.this::tekshir); } };
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_SCREEN_ON);
        f.addAction(Intent.ACTION_SCREEN_OFF);
        f.addAction(Intent.ACTION_USER_PRESENT);
        try {
            if (Build.VERSION.SDK_INT >= 33) registerReceiver(ekranR, f, Context.RECEIVER_NOT_EXPORTED);
            else registerReceiver(ekranR, f);
        } catch (Exception e) { }
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
            tarmoqCb = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network n) { h.postDelayed(Qulf.this::tekshir, 1500); }
                @Override public void onLost(Network n) { h.postDelayed(Qulf.this::tekshir, 1500); }
            };
            cm.registerNetworkCallback(new NetworkRequest.Builder().addTransportType(NetworkCapabilities.TRANSPORT_WIFI).build(), tarmoqCb);
        } catch (Exception e) { }
        tik();
    }

    @Override
    public void onDestroy() {
        men = null;
        h.removeCallbacksAndMessages(null);
        yashir();
        joyKuzat(false);
        try { if (ekranR != null) unregisterReceiver(ekranR); } catch (Exception e) { }
        try { if (tarmoqCb != null) ((ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE)).unregisterNetworkCallback(tarmoqCb); } catch (Exception e) { }
        super.onDestroy();
    }

    @Override public void onInterrupt() { }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent e) {
        if (e == null || e.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || e.getPackageName() == null) return;
        String pk = e.getPackageName().toString();
        CharSequence cl = e.getClassName();
        if (cl != null && faoliyat(e, pk, cl.toString())) {
            oldPaket = pk;
            tekshir();
        } else if (qoshilgan && soya(pk)) {
            // qulf paytida bildirishnoma pardasi (Wi-Fi, samolyot rejimi) yopiladi
            if (Build.VERSION.SDK_INT >= 31 && !qongiroqda() && !kilitli()) performGlobalAction(GLOBAL_ACTION_DISMISS_NOTIFICATION_SHADE);
        }
    }

    // ilovadan: jadval yoki bajarilganlar o'zgardi
    static void yangila() {
        Qulf q = men;
        if (q != null) q.h.post(q::tekshir);
    }

    private void tik() {
        h.removeCallbacks(tikR);
        tekshir();
        h.postDelayed(tikR, qoshilgan && favqKut > 0 ? 1000 : 20000);
    }

    // oyna haqiqiy ilova sahifasimi (dialog, menyu yoki o'zimizning qulf oynamiz emas)
    private boolean faoliyat(AccessibilityEvent e, String pk, String cl) {
        try { return getPackageManager().getActivityInfo(new ComponentName(pk, cl), 0) != null; }
        catch (Exception x) {
            // Android ba'zi ilovalarni ko'rsatmasligi mumkin: unda butun ekranli oyna bo'lsa, sahifa deb olinadi
            if (pk.equals(getPackageName()) || soya(pk)) return false;
            return e.isFullScreen() && !cl.startsWith("android.widget.") && !cl.startsWith("android.view.") && !cl.startsWith("android.app.");
        }
    }

    private boolean soya(String pk) {
        return "com.android.systemui".equals(pk) || pk.startsWith("miui.systemui");
    }

    // ---------- asosiy tekshiruv ----------
    void tekshir() {
        long now = System.currentTimeMillis();
        if (favqKut > 0 && now >= favqKut) {
            favqKut = 0;
            favqOch(this);
        }
        Holat x = hisobla(this, true);
        joyKuzat(x.joyRejim && x.oyna);
        if (oldPaket.isEmpty()) {
            try { AccessibilityNodeInfo n = getRootInActiveWindow(); if (n != null && n.getPackageName() != null) oldPaket = n.getPackageName().toString(); } catch (Exception e) { }
        }
        boolean kerak = !x.rejim.isEmpty() && !ruxsatli(oldPaket, x.rejim, now) && !qongiroqda() && !kilitli() && yoniq();
        if (kerak) korsat(x, now);
        else yashir();
        if (qoshilgan && favqKut > 0) { h.removeCallbacks(tikR); h.postDelayed(tikR, 1000); }
    }

    private boolean ruxsatli(String pk, String rejim, long now) {
        if (pk == null || pk.isEmpty()) return false;
        boolean dars = !"uyqu".equals(rejim);
        if (dars && (pk.equals(getPackageName()) || pk.equals("com.anthropic.claude"))) return true;
        if (now < imtiyoz && pk.equals(uyPaket)) return true;
        if (telefon(pk)) return true;
        String p = pk.toLowerCase(Locale.ROOT);
        return pk.equals("android") || pk.equals("com.android.systemui") || p.contains("permissioncontroller")
                || p.contains("deskclock") || p.endsWith(".clock") || p.contains("alarm");
    }

    private boolean telefon(String pk) {
        switch (pk) {
            case "com.android.server.telecom": case "com.android.phone": case "com.android.incallui":
            case "com.google.android.dialer": case "com.android.dialer": case "com.android.contacts":
            case "com.google.android.contacts": case "com.android.emergency": case "com.samsung.android.dialer":
            case "com.samsung.android.incallui":
                return true;
        }
        try {
            TelecomManager tm = (TelecomManager) getSystemService(TELECOM_SERVICE);
            if (pk.equals(tm.getDefaultDialerPackage()) || pk.equals(tm.getSystemDialerPackage())) return true;
        } catch (Exception e) { }
        return false;
    }

    private boolean qongiroqda() {
        try {
            int m = ((AudioManager) getSystemService(AUDIO_SERVICE)).getMode();
            return m == AudioManager.MODE_RINGTONE || m == AudioManager.MODE_IN_CALL || m == AudioManager.MODE_IN_COMMUNICATION;
        } catch (Exception e) { return false; }
    }

    private boolean kilitli() {
        try { return ((KeyguardManager) getSystemService(KEYGUARD_SERVICE)).isKeyguardLocked(); } catch (Exception e) { return false; }
    }

    private boolean yoniq() {
        try { return ((PowerManager) getSystemService(POWER_SERVICE)).isInteractive(); } catch (Exception e) { return true; }
    }

    // ---------- hozir qulf kerakmi ----------
    static class Holat {
        String rejim = "", k = "", t = "";
        long gacha = 0;
        boolean uy = false, oyna = false, joyRejim = false;
        long dam = 0;   // uyga keldi: shu vaqtgacha yuvinish va ovqat, keyin qulf
    }

    static Holat hisobla(Context c, boolean yoz) {
        Holat x = new Holat();
        SharedPreferences p = prefs(c);
        long now = System.currentTimeMillis();
        try {
            JSONObject j = new JSONObject(Ustoz.prefs(c).getString("j", "{}"));
            JSONObject q = j.optJSONObject("qulf");
            if (p.getLong("sinov", 0) > now) { x.rejim = "sinov"; x.k = "sinov"; x.gacha = p.getLong("sinov", 0); x.uy = true; return x; }
            if (q == null || !q.optBoolean("on", false)) return x;
            if (p.getLong("favq", 0) > now) return x;
            String usul = q.optString("uy", "wifi");
            boolean har = "har".equals(usul);
            x.joyRejim = "joy".equals(usul);
            int joy = x.joyRejim ? joyda(c) : 0;
            String rej = "", k = "", t = "";
            long gacha = 0, s = 0, aD = 0;
            JSONArray uq = q.optJSONArray("uyqu");
            if (uq != null) for (int i = 0; i < uq.length(); i++) {
                JSONObject w = uq.getJSONObject(i);
                if (w.optLong("a") <= now && now < w.optLong("b")) { rej = "uyqu"; k = "uyqu|" + w.optLong("a"); gacha = w.optLong("b"); s = w.optLong("a"); break; }
            }
            if (rej.isEmpty()) {
                JSONArray dr = q.optJSONArray("dars");
                if (dr != null) for (int i = 0; i < dr.length(); i++) {
                    JSONObject w = dr.getJSONObject(i);
                    String wk = w.optString("k");
                    if (w.optLong("a") <= now && now < w.optLong("b") && !bajarilgan(j, wk)) { rej = "dars"; k = wk; t = w.optString("t"); gacha = w.optLong("b"); s = w.optLong("s", w.optLong("a")); aD = w.optLong("a"); break; }
                }
            }
            // GPS: uyda ekani aniq bo'lsa qulf; joy noma'lum bo'lsa (joylashuv o'chiq) dars vaqtidan boshlab baribir qulf;
            // faqat uzoqda ekani aniq bo'lsa qulf yo'q
            boolean uzoqda;
            if (x.joyRejim) { x.uy = joy == 1 || (joy == 0 && s > 0 && now >= s); uzoqda = joy == -1; }
            else { x.uy = har || uydami(c); uzoqda = !x.uy; }
            x.oyna = !rej.isEmpty();
            String latch = p.getString("latch", "");
            if (rej.isEmpty()) { if (yoz && !latch.isEmpty()) p.edit().remove("latch").remove("uzoq").apply(); return x; }
            // uyga kelgach odat vaqti (yuvinish, ovqat): qulf kelgan paytdan "odat" daqiqa keyin boshlanadi
            int odat = q.optInt("odat", 0);
            if ("dars".equals(rej) && aD < s && odat > 0 && !k.equals(latch)) {
                boolean aniq = x.joyRejim ? joy == 1 : (!har && x.uy);
                long kt = k.equals(p.getString("keldiK", "")) ? p.getLong("keldiT", 0) : 0;
                if (kt == 0 && aniq) {
                    kt = now;
                    if (yoz) {
                        p.edit().putString("keldiK", k).putLong("keldiT", now).apply();
                        Calendar kal = Calendar.getInstance();
                        kal.setTimeInMillis(now + odat * 60000L);
                        Ustoz.korsat(c, "🚿 Uydasan! Avval yuvin, keyin ovqatlan",
                                String.format(Locale.ROOT, "%02d:%02d da dars boshlanadi, o'shanda telefon qulflanadi.", kal.get(Calendar.HOUR_OF_DAY), kal.get(Calendar.MINUTE)), "");
                    }
                }
                if (kt > 0 && now < kt + odat * 60000L) { x.dam = kt + odat * 60000L; return x; }
            }
            if (x.uy) {
                if (yoz && (!k.equals(latch) || p.getLong("uzoq", 0) != 0)) p.edit().putString("latch", k).putLong("uzoq", 0).apply();
            } else if (k.equals(latch) && !uzoqda) {
                // aniq uzoqda emas (masalan GPS hali javob bermadi): qulf turadi
            } else if (k.equals(latch)) {
                // uyda boshlangan qulf Wi-Fi uzilsa ham turadi; ekran yoniq holda 30 daqiqa uydan tashqarida bo'lsa yechiladi
                boolean yoniq = true;
                try { yoniq = ((PowerManager) c.getSystemService(Context.POWER_SERVICE)).isInteractive(); } catch (Exception e) { }
                long uz = p.getLong("uzoq", 0);
                if (yoniq) {
                    if (uz == 0) { if (yoz) p.edit().putLong("uzoq", now).apply(); }
                    else if (now - uz > UZOQ) { if (yoz) p.edit().remove("latch").remove("uzoq").apply(); return x; }
                }
            } else return x;
            x.rejim = rej; x.k = k; x.t = t; x.gacha = gacha;
        } catch (Exception e) { }
        return x;
    }

    private static boolean bajarilgan(JSONObject j, String k) {
        JSONArray d = j.optJSONArray("done");
        if (d != null) for (int i = 0; i < d.length(); i++) if (k.equals(d.optString(i))) return true;
        return false;
    }

    // ---------- uy Wi-Fi ----------
    // [nomi (o'qib bo'lsa), iz (router manzili va tarmoq)] yoki Wi-Fi yo'q bo'lsa null
    static String[] hozirgiWifi(Context c) {
        try {
            ConnectivityManager cm = (ConnectivityManager) c.getSystemService(Context.CONNECTIVITY_SERVICE);
            for (Network n : cm.getAllNetworks()) {
                NetworkCapabilities nc = cm.getNetworkCapabilities(n);
                if (nc == null || !nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) continue;
                LinkProperties lp = cm.getLinkProperties(n);
                String iz = iz(lp), ssid = "";
                try {
                    WifiInfo wi = ((WifiManager) c.getApplicationContext().getSystemService(Context.WIFI_SERVICE)).getConnectionInfo();
                    String s = wi == null ? null : wi.getSSID();
                    if (s != null) {
                        s = s.replace("\"", "").trim();
                        if (!s.isEmpty() && !s.contains("unknown ssid") && !s.equals("0x")) ssid = s;
                    }
                } catch (Exception e) { }
                return new String[]{ssid, iz};
            }
        } catch (Exception e) { }
        return null;
    }

    private static String iz(LinkProperties lp) {
        if (lp == null) return "";
        StringBuilder b = new StringBuilder();
        for (RouteInfo r : lp.getRoutes()) {
            if (r.isDefaultRoute() && r.getGateway() instanceof Inet4Address) { b.append(r.getGateway().getHostAddress()); break; }
        }
        for (LinkAddress a : lp.getLinkAddresses()) {
            if (a.getAddress() instanceof Inet4Address) {
                byte[] ip = a.getAddress().getAddress();
                int pre = a.getPrefixLength(), v = ((ip[0] & 255) << 24) | ((ip[1] & 255) << 16) | ((ip[2] & 255) << 8) | (ip[3] & 255);
                int m = pre == 0 ? 0 : -1 << (32 - pre);
                v &= m;
                b.append('|').append((v >>> 24) & 255).append('.').append((v >>> 16) & 255).append('.').append((v >>> 8) & 255).append('.').append(v & 255).append('/').append(pre);
                break;
            }
        }
        return b.toString();
    }

    static boolean uydami(Context c) {
        SharedPreferences p = prefs(c);
        String ss = p.getString("ssid", ""), iz = p.getString("iz", "");
        if (ss.isEmpty() && iz.isEmpty()) return false;
        String[] w = hozirgiWifi(c);
        if (w == null) return false;
        if (!ss.isEmpty() && !w[0].isEmpty()) return ss.equals(w[0]);
        return !iz.isEmpty() && iz.equals(w[1]);
    }

    // ---------- uy joylashuvi (GPS) ----------
    static final long JOY_YANGI = 12 * 60000L;

    static void joySaqla(Context c, android.location.Location l) {
        if (l == null || !l.hasAccuracy() || l.getAccuracy() > 2000) return;
        SharedPreferences p = prefs(c);
        long t = l.getTime() > 0 ? Math.min(l.getTime(), System.currentTimeMillis()) : System.currentTimeMillis();
        if (t < p.getLong("joyT", 0)) return;
        p.edit().putString("joyLat", String.valueOf(l.getLatitude())).putString("joyLon", String.valueOf(l.getLongitude()))
                .putFloat("joyA", l.getAccuracy()).putLong("joyT", t).apply();
    }

    // 1 = uyda, -1 = aniq uzoqda, 0 = bilmaymiz (joylashuv o'chiq yoki eski)
    static int joyda(Context c) {
        SharedPreferences p = prefs(c);
        String ulat = p.getString("uyLat", ""), ulon = p.getString("uyLon", "");
        if (ulat.isEmpty()) return 0;
        long t = p.getLong("joyT", 0);
        if (System.currentTimeMillis() - t > JOY_YANGI) return 0;
        try {
            float[] d = new float[1];
            android.location.Location.distanceBetween(Double.parseDouble(ulat), Double.parseDouble(ulon),
                    Double.parseDouble(p.getString("joyLat", "0")), Double.parseDouble(p.getString("joyLon", "0")), d);
            float a = p.getFloat("joyA", 1000);
            if (d[0] <= 200 + Math.min(a, 300)) return 1;
            if (d[0] > 500 + a) return -1;
        } catch (Exception e) { }
        return 0;
    }

    static boolean joyYoniq(Context c) {
        try {
            android.location.LocationManager lm = (android.location.LocationManager) c.getSystemService(Context.LOCATION_SERVICE);
            return Build.VERSION.SDK_INT < 28 || lm.isLocationEnabled();
        } catch (Exception e) { return false; }
    }

    static boolean joyRuxsat(Context c) {
        return c.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || c.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    static void uyJoyBelgila(Context c, android.location.Location l) {
        prefs(c).edit().putString("uyLat", String.valueOf(l.getLatitude())).putString("uyLon", String.valueOf(l.getLongitude())).putFloat("uyA", l.getAccuracy()).apply();
        joySaqla(c, l);
        yangila();
    }

    // qulf vaqtida joylashuvni kuzatish (faqat kerak bo'lganda, batareya uchun)
    private android.location.LocationListener joyL;
    private boolean joyFaol = false;

    private void joyKuzat(boolean kerak) {
        if (kerak && !joyRuxsat(this)) kerak = false;
        if (kerak == joyFaol) return;
        android.location.LocationManager lm = (android.location.LocationManager) getSystemService(LOCATION_SERVICE);
        try {
            if (!kerak) { if (joyL != null) lm.removeUpdates(joyL); joyFaol = false; return; }
            if (joyL == null) joyL = new android.location.LocationListener() {
                @Override public void onLocationChanged(android.location.Location l) { joySaqla(Qulf.this, l); h.post(Qulf.this::tekshir); }
                @Override public void onStatusChanged(String pr, int st, android.os.Bundle b) { }
                @Override public void onProviderEnabled(String pr) { h.post(Qulf.this::tekshir); }
                @Override public void onProviderDisabled(String pr) { h.post(Qulf.this::tekshir); }
            };
            boolean bor = false;
            for (String pr : lm.getProviders(true)) {
                if ("passive".equals(pr)) continue;
                try { joySaqla(this, lm.getLastKnownLocation(pr)); } catch (Exception e) { }
            }
            if (Build.VERSION.SDK_INT >= 31 && lm.hasProvider("fused") && lm.isProviderEnabled("fused")) {
                lm.requestLocationUpdates("fused", 60000, 0, joyL, Looper.getMainLooper());
                bor = true;
            } else {
                if (lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)) { lm.requestLocationUpdates(android.location.LocationManager.NETWORK_PROVIDER, 60000, 0, joyL, Looper.getMainLooper()); bor = true; }
                if (lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)) { lm.requestLocationUpdates(android.location.LocationManager.GPS_PROVIDER, 120000, 0, joyL, Looper.getMainLooper()); bor = true; }
            }
            try { lm.requestLocationUpdates(android.location.LocationManager.PASSIVE_PROVIDER, 30000, 0, joyL, Looper.getMainLooper()); bor = true; } catch (Exception e) { }
            joyFaol = bor;
        } catch (SecurityException e) { joyFaol = false; }
    }

    // ilovadan: "Hozirgi Wi-Fi - uyim"
    static String uyBelgila(Context c) {
        try {
            JSONObject o = new JSONObject();
            String[] w = hozirgiWifi(c);
            if (w == null || (w[0].isEmpty() && w[1].isEmpty())) { o.put("ok", false); return o.toString(); }
            prefs(c).edit().putString("ssid", w[0]).putString("iz", w[1]).apply();
            o.put("ok", true);
            o.put("ssid", w[0]);
            yangila();
            return o.toString();
        } catch (Exception e) { return "{\"ok\":false}"; }
    }

    static void sinov(Context c) {
        prefs(c).edit().putLong("sinov", System.currentTimeMillis() + 60000).apply();
        yangila();
    }

    // ---------- favqulodda ochish ----------
    private static String hafta() {
        Calendar k = Calendar.getInstance();
        k.setFirstDayOfWeek(Calendar.MONDAY);
        k.setMinimalDaysInFirstWeek(4);
        return k.getWeekYear() + "-" + k.get(Calendar.WEEK_OF_YEAR);
    }

    static int favqQoldi(Context c) {
        SharedPreferences p = prefs(c);
        int n = hafta().equals(p.getString("favqH", "")) ? p.getInt("favqN", 0) : 0;
        return Math.max(0, FAVQ_HAFTA - n);
    }

    private static void favqOch(Context c) {
        SharedPreferences p = prefs(c);
        String w = hafta();
        int n = w.equals(p.getString("favqH", "")) ? p.getInt("favqN", 0) : 0;
        if (n >= FAVQ_HAFTA) return;
        p.edit().putString("favqH", w).putInt("favqN", n + 1).putLong("favq", System.currentTimeMillis() + FAVQ).apply();
    }

    // ---------- holat ilovaga ----------
    static boolean yoqilgan(Context c) {
        if (men != null) return true;
        try {
            String s = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (s == null) return false;
            ComponentName cn = new ComponentName(c, Qulf.class);
            String a = cn.flattenToString().toLowerCase(Locale.ROOT), b = cn.flattenToShortString().toLowerCase(Locale.ROOT);
            for (String x : s.toLowerCase(Locale.ROOT).split(":")) if (x.equals(a) || x.equals(b)) return true;
        } catch (Exception e) { }
        return false;
    }

    static String holat(Context c) {
        try {
            JSONObject o = new JSONObject();
            SharedPreferences p = prefs(c);
            Holat x = hisobla(c, false);
            o.put("xizmat", yoqilgan(c));
            o.put("joy", c.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED);
            o.put("fon", Build.VERSION.SDK_INT < 29 || c.checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED);
            o.put("uyBor", !p.getString("ssid", "").isEmpty() || !p.getString("iz", "").isEmpty());
            o.put("uyNom", p.getString("ssid", ""));
            String[] w = hozirgiWifi(c);
            o.put("wifi", w != null);
            o.put("wifiNom", w == null ? "" : w[0]);
            o.put("uyda", uydami(c));
            o.put("joyRux", joyRuxsat(c));
            o.put("joyYoniq", joyYoniq(c));
            o.put("uyJoy", !p.getString("uyLat", "").isEmpty());
            o.put("joyda", joyda(c));
            o.put("dam", x.dam);
            o.put("rejim", x.rejim);
            o.put("k", x.k);
            o.put("gacha", x.gacha);
            o.put("favq", Math.max(0, p.getLong("favq", 0) - System.currentTimeMillis()));
            o.put("favqQoldi", favqQoldi(c));
            String m = (Build.MANUFACTURER + " " + Build.BRAND).toLowerCase(Locale.ROOT);
            o.put("xiaomi", m.contains("xiaomi") || m.contains("redmi") || m.contains("poco"));
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    // ---------- qulf oynasi ----------
    private int dp(float v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()); }

    private Button tugma(String matn, int fon, int rang) {
        Button b = new Button(this);
        b.setText(matn);
        b.setAllCaps(false);
        b.setTextSize(17);
        b.setTextColor(rang);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable g = new GradientDrawable();
        g.setColor(fon);
        g.setCornerRadius(dp(18));
        b.setBackground(g);
        b.setPadding(dp(16), dp(14), dp(16), dp(14));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(12);
        b.setLayoutParams(lp);
        return b;
    }

    private void qur() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setGravity(Gravity.CENTER);
        l.setPadding(dp(28), dp(48), dp(28), dp(36));
        l.setBackgroundColor(0xFF053B36);
        l.setClickable(true);
        tSarlavha = new TextView(this);
        tSarlavha.setTextColor(Color.WHITE);
        tSarlavha.setTextSize(26);
        tSarlavha.setTypeface(Typeface.DEFAULT_BOLD);
        tSarlavha.setGravity(Gravity.CENTER);
        tMatn = new TextView(this);
        tMatn.setTextColor(0xFFCCFBF1);
        tMatn.setTextSize(17);
        tMatn.setGravity(Gravity.CENTER);
        tMatn.setLineSpacing(0, 1.2f);
        tMatn.setPadding(0, dp(14), 0, dp(20));
        tKut = new TextView(this);
        tKut.setTextColor(0xFFFDE68A);
        tKut.setTextSize(15);
        tKut.setGravity(Gravity.CENTER);
        bDars = tugma("📚 Darsga o'tish", 0xFF99F6E4, 0xFF053B36);
        bQong = tugma("📞 Qo'ng'iroq qilish", 0x33FFFFFF, Color.WHITE);
        bFavq = tugma("Favqulodda ochish", 0x00000000, 0xFF99F6E4);
        bFavq.setTextSize(14);
        l.addView(tSarlavha);
        l.addView(tMatn);
        l.addView(bDars);
        l.addView(bQong);
        l.addView(bFavq);
        l.addView(tKut);
        bDars.setOnClickListener(v -> {
            imtiyoz = System.currentTimeMillis() + 20000;
            ochIlova(new Intent(this, MainActivity.class).putExtra("ustoz", true)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP));
        });
        bQong.setOnClickListener(v -> {
            imtiyoz = System.currentTimeMillis() + 20000;
            ochIlova(new Intent(Intent.ACTION_DIAL).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        });
        bFavq.setOnClickListener(v -> {
            if (favqKut > 0) { favqKut = 0; tekshir(); return; }
            if (favqQoldi(this) <= 0) return;
            favqKut = System.currentTimeMillis() + FAVQ_KUT;
            tekshir();
        });
        oyna = l;
    }

    // ilovani ochish; telefon (masalan Xiaomi) fondan ochishga yo'l qo'ymasa, bosh ekran 20 soniya ochiq turadi
    private void ochIlova(Intent i) {
        try { startActivity(i); } catch (Exception e) { performGlobalAction(GLOBAL_ACTION_HOME); }
        h.postDelayed(this::tekshir, 1200);
        h.postDelayed(() -> { if (qoshilgan && System.currentTimeMillis() < imtiyoz) { performGlobalAction(GLOBAL_ACTION_HOME); h.postDelayed(this::tekshir, 800); } }, 2500);
    }

    private void korsat(Holat x, long now) {
        if (oyna == null) qur();
        boolean uyqu = "uyqu".equals(x.rejim);
        String vaqt = "";
        if (x.gacha > 0) { Calendar k = Calendar.getInstance(); k.setTimeInMillis(x.gacha); vaqt = String.format(Locale.ROOT, "%02d:%02d", k.get(Calendar.HOUR_OF_DAY), k.get(Calendar.MINUTE)); }
        if (uyqu) {
            tSarlavha.setText("🌙 Uxlash vaqti");
            tMatn.setText("Telefon ertalab " + vaqt + " da ochiladi.\nHozir faqat qo'ng'iroq va budilnik ishlaydi.\nYaxshi uyqu = ertaga yaxshi xotira.");
        } else if ("sinov".equals(x.rejim)) {
            tSarlavha.setText("🔒 Sinov: telefon qulf");
            tMatn.setText("Qulf shunday ko'rinadi. Yodla va qo'ng'iroq ochiq, qolgani yopiq.\n1 daqiqadan keyin o'zi ochiladi.");
        } else {
            tSarlavha.setText("📚 Avval dars");
            tMatn.setText("Uydasan, demak dars vaqti" + (x.t.isEmpty() ? "" : ":\n" + x.t) + ".\nShu darsni tugatsang, telefon o'zi ochiladi.\nHozir faqat Yodla va qo'ng'iroq ishlaydi.");
        }
        bDars.setVisibility(uyqu ? View.GONE : View.VISIBLE);
        int qoldi = favqQoldi(this);
        if (favqKut > 0) {
            long s = Math.max(0, (favqKut - now + 999) / 1000);
            bFavq.setText("Bekor qilish");
            tKut.setText("Favqulodda ochish: " + s + " soniyadan keyin 10 daqiqaga ochiladi");
        } else {
            bFavq.setText(qoldi > 0 ? "Favqulodda ochish (bu hafta " + qoldi + " ta qoldi)" : "Bu hafta favqulodda ochish tugagan");
            bFavq.setEnabled(qoldi > 0);
            tKut.setText("");
        }
        bFavq.setVisibility("sinov".equals(x.rejim) ? View.GONE : View.VISIBLE);
        if (!qoshilgan) {
            WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    PixelFormat.OPAQUE);
            lp.gravity = Gravity.TOP | Gravity.START;
            if (Build.VERSION.SDK_INT >= 28) lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            try {
                ((WindowManager) getSystemService(WINDOW_SERVICE)).addView(oyna, lp);
                qoshilgan = true;
                jimlik(true);
            } catch (Exception e) { }
        }
    }

    private void yashir() {
        if (!qoshilgan) return;
        try { ((WindowManager) getSystemService(WINDOW_SERVICE)).removeView(oyna); } catch (Exception e) { }
        qoshilgan = false;
        favqKut = 0;
        jimlik(false);
    }

    // qulf chiqsa, video yoki musiqa to'xtaydi
    private void jimlik(boolean ol) {
        try {
            AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
            if (ol) {
                if (fokus == null) fokus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                        .setOnAudioFocusChangeListener(f -> { }).build();
                am.requestAudioFocus(fokus);
            } else if (fokus != null) am.abandonAudioFocusRequest(fokus);
        } catch (Exception e) { }
    }
}
