@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   CANNABILIZE - INICIAR SERVIDOR
echo ========================================
echo.
echo Iniciando servidor de desenvolvimento...
echo.
echo Aguarde aparecer: "Local: http://localhost:3000"
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ========================================
echo.

npm run dev

pause
