@echo off
cd /d "%~dp0"
title Click Cannabis - Modo Verbose (Mostra Tudo)
color 0E

:: MODO VERBOSE - MOSTRA TODOS OS ERROS
setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo   MODO VERBOSE - VER TODOS OS ERROS
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar pasta
if not exist "package.json" (
    echo [ERRO CRITICO] package.json nao encontrado!
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo [OK] Projeto encontrado!
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

:: Verificar Node.js
echo.
echo Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    pause >nul
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

:: Matar processos Node.js
echo Matando processos Node.js...
taskkill /IM node.exe /F
echo.

:: Liberar porta
echo Liberando porta 3000...
netstat -ano | findstr ":3000"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Matando processo %%a...
    taskkill /PID %%a /F
)
timeout /t 2 >nul
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    set PORTA=3000
) else (
    echo [AVISO] Usando porta 3001
    set PORTA=3001
)
echo.

:: Instalar dependencias
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo Tentando com --legacy-peer-deps...
        npm install --legacy-peer-deps
    )
) else (
    echo Dependencias ja instaladas
)
echo.

:: Criar .env
if not exist ".env" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:%PORTA%"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026"
    ) > .env
)

:: Configurar Prisma
if exist "prisma\schema.prisma" (
    echo Configurando Prisma...
    findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
    if errorlevel 1 (
        powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma"
        powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma"
    )
    echo Gerando Prisma Client...
    npx prisma generate
    echo Criando banco...
    npx prisma db push --accept-data-loss
)
echo.

:: Iniciar servidor
cls
echo.
echo ========================================
echo   INICIANDO SERVIDOR
echo ========================================
echo.
echo Site: http://localhost:%PORTA%
echo.
echo TODOS OS ERROS SERAO MOSTRADOS ABAIXO
echo.
echo ========================================
echo.

if "%PORTA%"=="3001" (
    set PORT=3001
    npm run dev -- -p 3001
) else (
    npm run dev
)

echo.
echo Servidor parou.
pause
