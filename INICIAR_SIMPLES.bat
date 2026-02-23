@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   CLICK CANNABIS - INICIAR SERVIDOR
echo ========================================
echo.
echo Iniciando servidor...
echo.
echo Aguarde aparecer: "Local: http://localhost:3000"
echo.
echo Para parar, pressione Ctrl+C
echo.
echo ========================================
echo.

npm run dev

pause
