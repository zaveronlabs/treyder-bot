@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"
title Treyder AI - real pul tekshiruvi
curl -s -f -o ijro_yangi.py https://raw.githubusercontent.com/zaveronlabs/treyder-bot/main/ijro.py && move /y ijro_yangi.py ijro.py >nul
python ijro.py tekshir
pause
