@echo off
cd /d "%~dp0"
title Click Cannabis - Resolver Tudo
color 0B

cls
echo.
echo ========================================
echo   RESOLVER TUDO AUTOMATICAMENTE
echo ========================================
echo.
echo Este script vai:
echo 1. Matar TODOS os processos Node.js
echo 2. Liberar porta 3000
echo 3. Instalar dependencias (se necessario)
echo 4. Configurar banco de dados
echo 5. Iniciar servidor
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    pause
    exit /b 1
)

:: PASSO 1: Matar TODOS os processos Node.js
echo.
echo [1/5] Matando processos Node.js...
taskkill /IM node.exe /F >nul 2>&1
if errorlevel 0 (
    echo [OK] Processos Node.js encerrados
) else (
    echo [OK] Nenhum processo Node.js encontrado
)

:: PASSO 2: Liberar porta 3000
echo.
echo [2/5] Liberando porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 >nul
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo [OK] Porta 3000 liberada
    set PORTA=3000
) else (
    echo [AVISO] Porta 3000 ainda em uso, usando porta 3001
    set PORTA=3001
)

:: PASSO 3: Instalar dependencias
echo.
echo [3/5] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias (pode levar alguns minutos)...
    call npm install
    if errorlevel 1 (
        call npm install --legacy-peer-deps
    )
    echo [OK] Dependencias instaladas
) else (
    echo [OK] Dependencias ja instaladas
)

:: PASSO 4: Configurar banco
echo.
echo [4/5] Configurando banco de dados...
if not exist ".env" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:%PORTA%"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026"
    ) > .env
)

if exist "prisma\schema.prisma" (
    findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
    if errorlevel 1 (
        powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma" >nul 2>&1
        powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma" >nul 2>&1
    )
    npx prisma generate >nul 2>&1
    npx prisma db push --accept-data-loss >nul 2>&1
    echo [OK] Banco configurado
)

:: PASSO 5: Iniciar servidor
echo.
echo [5/5] Iniciando servidor...
echo.
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

if "%PORTA%"=="3001" (
    set PORT=3001
    call npm run dev -- -p 3001
) else (
    call npm run dev
)

pause
