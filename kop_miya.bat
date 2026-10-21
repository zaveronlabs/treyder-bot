@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"
title Treyder AI - 30 tanga miya sinovi
echo Kerakli kutubxonalar tekshirilyapti (birinchi marta ~2.5 GB yuklab oladi, sabr qil)...
python -m pip install --quiet numpy pandas
python -c "import torch; assert torch.cuda.is_available()" 2>nul
if errorlevel 1 (
  python -m pip uninstall -y torch >nul 2>&1
  python -m pip install torch --index-url https://download.pytorch.org/whl/cu126
)
python -c "import torch; print('Videokarta:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'TOPILMADI')"
curl -s -f -o katta_miya_yangi.py https://raw.githubusercontent.com/zaveronlabs/treyder-bot/main/katta_miya.py && move /y katta_miya_yangi.py katta_miya.py >nul
python katta_miya.py kop
echo.
echo Tugadi. Oynani yopsang bo'ladi.
pause
