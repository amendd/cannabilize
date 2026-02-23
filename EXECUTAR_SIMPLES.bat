@echo off
cd /d "%~dp0"
title Click Cannabis - Servidor
color 0A

:: Script simples que NAO usa PowerShell
setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo   CLICK CANNABIS - SERVIDOR
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    pause
    exit /b 1
)

:: Matar processos Node.js
echo Liberando processos Node.js...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 >nul

:: Liberar porta 3000
echo Liberando porta 3000...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
    netstat -ano | findstr ":3000" >nul
    if errorlevel 0 (
        set PORTA=3001
        echo [AVISO] Usando porta 3001
    ) else (
        set PORTA=3000
        echo [OK] Porta 3000 liberada
    )
) else (
    set PORTA=3000
    echo [OK] Porta 3000 livre
)

:: Verificar dependencias
if not exist "node_modules" (
    echo.
    echo Instalando dependencias...
    call npm.cmd install
    if errorlevel 1 (
        call npm.cmd install --legacy-peer-deps
    )
)

:: Criar .env se nao existir
if not exist ".env" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:%PORTA%"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026"
    ) > .env
)

:: Configurar Prisma
if exist "prisma\schema.prisma" (
    echo.
    echo Configurando banco de dados...
    call npx.cmd prisma generate >nul 2>&1
    call npx.cmd prisma db push --accept-data-loss >nul 2>&1
)

cls
echo.
echo ========================================
echo   SERVIDOR INICIANDO
echo ========================================
echo.
echo Site: http://localhost:%PORTA%
echo.
echo Aguarde aparecer: "Local: http://localhost:%PORTA%"
echo.
echo Para parar: Ctrl+C
echo.
echo ========================================
echo.

:: Executar usando npm.cmd (nao PowerShell)
if "%PORTA%"=="3001" (
    set PORT=3001
    call npm.cmd run dev -- -p 3001
) else (
    call npm.cmd run dev
)

echo.
echo Servidor parou.
pause
