@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Real pul ijrochisi: har ishga tushganda eng yangi ijro.py ni GitHub'dan oladi.
rem Birinchi marta kalitlarni so'raydi (ular faqat shu kompyuterda qoladi).
:qayta
curl -s -f -o ijro_yangi.py https://raw.githubusercontent.com/zaveronlabs/treyder-bot/main/ijro.py && move /y ijro_yangi.py ijro.py >nul
if not exist ijro_sozlama.json python ijro.py sozla
python ijro.py
echo Ijrochi to'xtadi, 30 soniyadan keyin qayta ishga tushadi...
timeout /t 30 /nobreak >nul
goto qayta
