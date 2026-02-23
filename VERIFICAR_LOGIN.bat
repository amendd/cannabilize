@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   VERIFICAR LOGIN - DIAGNOSTICO
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    echo.
    echo Baixe e instale de: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

:: Verificar se arquivo existe
if not exist "verificar-login-simples.js" (
    echo [ERRO] Arquivo verificar-login-simples.js nao encontrado!
    echo.
    pause
    exit /b 1
)

echo Verificando usuarios no banco de dados...
echo Aguarde, isso pode levar alguns segundos...
echo.

:: Executar script
node verificar-login-simples.js

echo.
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
