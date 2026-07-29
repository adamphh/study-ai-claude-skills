@echo off
title SOI DAU CHAN CA MAP - PHAN TICH XU HUONG CO PHIEU VA CRYPTO
cls
echo ========================================================================
echo   CHUONG TRINH PHAN TICH XU HUONG VA SOI DAU CHAN CA MAP
echo ========================================================================
echo.
echo Nhap danh sach cac ma can phan tich (phan cach bang dau phay).
echo Vi du: SSI, MSN, HPG, FPT, TCB, BTCUSDT, ETHUSDT, SOLUSDT
echo.
set /p SYMBOLS="Nhap ma CP hay Crypto (hoac nhan ENTER de dung mac dinh): "

if "%SYMBOLS%"=="" (
    set SYMBOLS=HPG,FPT,SSI,MSN,VND,BTCUSDT,ETHUSDT
)

echo.
echo ========================================================================
echo Dang ket noi Real-Time API va phan tich cho: %SYMBOLS%
echo ========================================================================
cd /d F:\Working\study-ai-claude-skills
node tools/stock-crypto-analyzer/cli.js --symbols %SYMBOLS%
echo.
echo ========================================================================
echo DA HOAN THANH BAO CAO! Bao cao file Markdown da duoc luu tu dong.
echo ========================================================================
pause
