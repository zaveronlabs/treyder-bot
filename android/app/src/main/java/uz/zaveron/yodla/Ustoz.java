package uz.zaveron.yodla;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

// Ustoz eslatmalari: dars vaqti kelganda va boshlamaguncha qayta-qayta.
// Ilova jadvalni (keyingi 14 kun) yuboradi; telefon har safar faqat eng yaqin bitta signalni qo'yadi,
// signal kelganda eslatma chiqadi va keyingisi qo'yiladi. Ilova ochilmasa ham, telefon qayta yonsa ham ishlaydi.
public class Ustoz extends BroadcastReceiver {
    static final String KANAL = "ustoz";
    static final int ID = 77;
    static final String SIGNAL = "uz.zaveron.yodla.USTOZ";
    static final String SINOV = "uz.zaveron.yodla.USTOZ_SINOV";
    static volatile boolean oldinda = false;   // ilova hozir ekranda ochiq

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("ustoz", Context.MODE_PRIVATE); }

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (SINOV.equals(a)) {
            korsat(c, "🔔 Ustoz eslatmasi ishlayapti", "Dars vaqtida shunday eslatma keladi. Bossang, darsga o'tasan.", "");
            return;
        }
        if (SIGNAL.equals(a)) {
            if (i.getBooleanExtra("fb", false)) zaxira(c);
            else otdi(c);
        }
        rejala(c);
    }

    // telefon qayta yonganda, vaqt yoki ilova yangilanganda signal qayta qo'yiladi
    public static class Boot extends BroadcastReceiver {
        @Override public void onReceive(Context c, Intent i) { rejala(c); }
    }

    // ---- ilovadan ----
    static void saqla(Context c, String json) {
        prefs(c).edit().putString("j", json).apply();
        rejala(c);
    }

    static void tugadi(Context c, String key) {
        SharedPreferences p = prefs(c);
        try {
            JSONObject j = new JSONObject(p.getString("j", "{}"));
            JSONArray d = j.optJSONArray("done");
            if (d == null) { d = new JSONArray(); j.put("done", d); }
            d.put(key);
            p.edit().putString("j", j.toString()).apply();
        } catch (Exception e) { }
        if (key.equals(p.getString("korsatildi", "-"))) {
            ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(ID);
        }
    }

    static void sinov(Context c) {
        Intent i = new Intent(c, Ustoz.class).setAction(SINOV);
        PendingIntent pi = PendingIntent.getBroadcast(c, 8, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        signal(c, System.currentTimeMillis() + 5000, pi);
    }

    static String holat(Context c) {
        try {
            JSONObject o = new JSONObject();
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            boolean b = nm.areNotificationsEnabled();
            if (b) { NotificationChannel k = nm.getNotificationChannel(KANAL); if (k != null && k.getImportance() == NotificationManager.IMPORTANCE_NONE) b = false; }
            o.put("bildirish", b);
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            o.put("batareya", pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName()));
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            o.put("aniq", Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms());
            String m = (Build.MANUFACTURER + " " + Build.BRAND).toLowerCase(Locale.ROOT);
            o.put("xiaomi", m.contains("xiaomi") || m.contains("redmi") || m.contains("poco"));
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    // ---- signal kelganda: vaqti kelgan eslatmalardan oxirgisini ko'rsatish ----
    private static void otdi(Context c) {
        SharedPreferences p = prefs(c);
        long now = System.currentTimeMillis(), last = p.getLong("last", 0), yangiLast = last;
        try {
            JSONObject j = new JSONObject(p.getString("j", "{}"));
            JSONArray ev = j.optJSONArray("ev");
            if (ev == null) return;
            JSONObject tanlov = null;
            for (int k = 0; k < ev.length(); k++) {
                JSONObject e = ev.getJSONObject(k);
                long at = e.optLong("at");
                if (at <= last || at > now + 30000) continue;
                yangiLast = Math.max(yangiLast, at);
                if (now - at > 3 * 3600000L) continue;      // juda eski: ko'rsatilmaydi
                if (yopiq(j, e.optString("k"), now)) continue;
                if (tanlov == null || at >= tanlov.optLong("at")) tanlov = e;
            }
            p.edit().putLong("last", yangiLast).apply();
            if (tanlov != null && !oldinda) korsat(c, tanlov.optString("t"), tanlov.optString("m"), tanlov.optString("k"));
        } catch (Exception e) { p.edit().putLong("last", Math.max(last, now)).apply(); }
    }

    // blok tugagan yoki hozir ilovada shu dars qilinayotgan bo'lsa eslatma kerak emas
    private static boolean yopiq(JSONObject j, String k, long now) {
        if (k == null || k.isEmpty()) return false;
        JSONArray d = j.optJSONArray("done");
        if (d != null) for (int i = 0; i < d.length(); i++) if (k.equals(d.optString(i))) return true;
        JSONObject b = j.optJSONObject("busy");
        return b != null && k.equals(b.optString("k")) && b.optLong("until") > now;
    }

    // jadval tugab qolsa (ilova uzoq ochilmagan): har kuni dars vaqtida bitta eslatma
    private static void zaxira(Context c) {
        if (oldinda) return;
        korsat(c, "📚 Ustoz kutyapti", "Bir necha kundan beri dars yo'q. Ilovani och: bugungi reja tayyor.", "");
    }

    // ---- eng yaqin signalni qo'yish ----
    static void rejala(Context c) {
        SharedPreferences p = prefs(c);
        long now = System.currentTimeMillis(), last = p.getLong("last", 0);
        try {
            JSONObject j = new JSONObject(p.getString("j", "{}"));
            JSONArray ev = j.optJSONArray("ev");
            long eng = Long.MAX_VALUE;
            if (ev != null) for (int k = 0; k < ev.length(); k++) {
                long at = ev.getJSONObject(k).optLong("at");
                if (at > last && at >= now - 120000 && at < eng) eng = at;
            }
            Intent i = new Intent(c, Ustoz.class).setAction(SIGNAL);
            if (eng != Long.MAX_VALUE) {
                i.putExtra("at", eng);
            } else {
                JSONObject fb = j.optJSONObject("fb");
                if (fb == null || !j.optBoolean("on", false)) { bekor(c); return; }
                Calendar k = Calendar.getInstance();
                k.set(Calendar.HOUR_OF_DAY, fb.optInt("h", 20)); k.set(Calendar.MINUTE, fb.optInt("m", 0));
                k.set(Calendar.SECOND, 0); k.set(Calendar.MILLISECOND, 0);
                if (k.getTimeInMillis() <= now + 1000) k.add(Calendar.DAY_OF_MONTH, 1);
                eng = k.getTimeInMillis();
                i.putExtra("fb", true);
            }
            PendingIntent pi = PendingIntent.getBroadcast(c, 7, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            signal(c, Math.max(eng, now + 1000), pi);
        } catch (Exception e) { }
    }

    private static void bekor(Context c) {
        Intent i = new Intent(c, Ustoz.class).setAction(SIGNAL);
        PendingIntent pi = PendingIntent.getBroadcast(c, 7, i, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pi != null) { ((AlarmManager) c.getSystemService(Context.ALARM_SERVICE)).cancel(pi); pi.cancel(); }
    }

    private static void signal(Context c, long at, PendingIntent pi) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    // ---- eslatma ----
    static void kanal(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm.getNotificationChannel(KANAL) != null) return;
        NotificationChannel k = new NotificationChannel(KANAL, "Ustoz: dars eslatmalari", NotificationManager.IMPORTANCE_HIGH);
        k.setDescription("Dars vaqti kelganda va dars boshlanmaguncha eslatadi");
        k.enableVibration(true);
        k.setVibrationPattern(new long[]{0, 400, 200, 400, 200, 600});
        k.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        k.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(k);
    }

    static void korsat(Context c, String sarlavha, String matn, String key) {
        kanal(c);
        Intent i = new Intent(c, MainActivity.class).putExtra("ustoz", true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, 77, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(c, KANAL)
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(sarlavha)
                .setContentText(matn)
                .setStyle(new Notification.BigTextStyle().bigText(matn))
                .setCategory(Notification.CATEGORY_REMINDER)
                .setContentIntent(pi)
                .addAction(new Notification.Action.Builder(null, "Darsga o'tish", pi).build())
                .setAutoCancel(true)
                .setShowWhen(true)
                .build();
        ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(ID, n);
        prefs(c).edit().putString("korsatildi", key == null ? "" : key).apply();
    }
}
