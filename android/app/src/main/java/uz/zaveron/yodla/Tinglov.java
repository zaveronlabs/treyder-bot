package uz.zaveron.yodla;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

// Tinglash vaqtini sanaydi. Quloq ulangan bo'lsa faqat inglizcha narsa o'ynagan soniyalar,
// ulanmagan bo'lsa (ruxsat yo'q) telefonda ovoz chiqib turgan soniyalar hisoblanadi
public class Tinglov extends Service {
    static final String KANAL = "tinglash";
    static final int ID = 42;
    static final long QADAM = 5000;
    private final Handler h = new Handler(Looper.getMainLooper());
    private AudioManager am;
    private SharedPreferences sp;
    private int oxirgiDaq = -1;
    private String oxirgiHozir = "";

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("tinglov", MODE_PRIVATE); }

    private final Runnable tik = new Runnable() {
        @Override public void run() {
            long s = sp.getLong("sek", 0);
            if (Quloq.ulangan) s = Math.max(0, sp.getLong("jami", 0) - sp.getLong("q0", 0));
            else if (am != null && am.isMusicActive()) s += QADAM / 1000;
            sp.edit().putLong("sek", s).apply();
            int d = (int) (s / 60);
            String hz = Quloq.hozir + Quloq.hozirTil;
            if (d != oxirgiDaq || !hz.equals(oxirgiHozir)) { oxirgiDaq = d; oxirgiHozir = hz; xabarYangila(d); }
            h.postDelayed(this, QADAM);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        am = (AudioManager) getSystemService(AUDIO_SERVICE);
        sp = prefs(this);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel k = new NotificationChannel(KANAL, "Tinglash vaqti", NotificationManager.IMPORTANCE_LOW);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(k);
        }
    }

    private Notification xabar(int daq) {
        Intent i = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, KANAL) : new Notification.Builder(this);
        return b.setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle("Yodla: inglizcha tinglash · " + daq + " daqiqa")
                .setContentText(!Quloq.ulangan ? "video to'xtasa, sanash ham to'xtaydi"
                        : Quloq.hozir.isEmpty() ? "hech narsa o'ynamayapti"
                        : (Quloq.hozirTil == 1 ? "✓ sanalmoqda: " : Quloq.hozirTil == -1 ? "✗ inglizcha emas: " : "… aniqlanmoqda: ") + Quloq.hozir)
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
    }

    private void xabarYangila(int daq) {
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(ID, xabar(daq));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        int d = (int) (sp.getLong("sek", 0) / 60);
        if (Build.VERSION.SDK_INT >= 34) startForeground(ID, xabar(d), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(ID, xabar(d));
        h.removeCallbacks(tik);
        h.postDelayed(tik, QADAM);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        h.removeCallbacks(tik);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent i) { return null; }
}
