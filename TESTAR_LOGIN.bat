@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   TESTAR LOGIN - DIAGNOSTICO
echo ========================================
echo.
echo Verificando usuarios e senhas...
echo.

npx tsx testar-login.ts

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
