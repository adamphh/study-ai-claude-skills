@echo off
chcp 65001 > nul
echo ===================================================
echo 📈 ĐANG CHẠY PHÂN TÍCH XU HƯỚNG CỔ PHIẾU & CRYPTO...
echo ===================================================
node tools/stock-crypto-analyzer/cli.js --symbols HPG.VN,FPT.VN,SSI.VN,TCB.VN,BTCUSDT,ETHUSDT,SOLUSDT
pause
