#!/bin/bash
mkdir -p natija
P=uz.zaveron.yodla
adb shell settings put system screen_off_timeout 1800000
adb shell svc power stayon true
adb install -r new.apk; echo "ORNATISH=$?"
adb shell dumpsys package $P | grep -m2 -E "versionCode|versionName"
adb shell settings put secure enabled_accessibility_services $P/$P.Qulf
adb shell settings put secure accessibility_enabled 1
sleep 6
adb shell dumpsys accessibility | grep -i -m5 "yodla\|Qulf" > natija/xizmat.txt
cat natija/xizmat.txt
adb logcat -c
adb shell am start -n $P/.MainActivity --ez qulfSinov true
sleep 12
adb exec-out screencap -p > natija/0_yodla.png
adb shell input keyevent KEYCODE_HOME
sleep 4
adb exec-out screencap -p > natija/1_bosh_ekran.png
adb shell am start -a android.settings.SETTINGS
sleep 5
adb exec-out screencap -p > natija/2_sozlamalar.png
adb shell dumpsys window windows | grep -iE "Window\{|mCurrentFocus|ty=ACCESSIBILITY|2032" | grep -iE "yodla|Settings|launcher|focus" > natija/oynalar_qulf.txt
cat natija/oynalar_qulf.txt
adb shell am start -a android.intent.action.DIAL
sleep 5
adb exec-out screencap -p > natija/3_telefon.png
adb shell am start -a android.settings.SETTINGS
sleep 50
adb shell input keyevent KEYCODE_WAKEUP
adb shell am start -a android.settings.SETTINGS
sleep 5
adb exec-out screencap -p > natija/4_ochildi.png
adb shell dumpsys window windows | grep -iE "Window\{|mCurrentFocus" | grep -iE "yodla|Settings|focus" > natija/oynalar_keyin.txt
cat natija/oynalar_keyin.txt
adb logcat -d | grep -iE "FATAL|AndroidRuntime|yodla|Qulf" | tail -60 > natija/logcat.txt
cat natija/logcat.txt
