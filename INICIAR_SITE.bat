@echo off
cd /d "%~dp0"
title CannaLize - Iniciar Site
color 0B

:: FORCAR JANELA A PERMANECER ABERTA
setlocal enabledelayedexpansion

:: Verificar pasta
if not exist "package.json" (
    cls
    echo.
    echo [ERRO] package.json nao encontrado!
    echo.
    echo Pasta atual: %CD%
    echo.
    echo Deve estar em: C:\Users\Gabriel\clickcannabis-replica
    echo.
    pause
    exit /b 1
)

cls
echo.
echo ========================================
echo   INICIAR SITE - CANNALIZE
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar Node.js
echo [1/6] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Baixe de: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

:: Matar processos Node.js
echo [2/6] Liberando processos Node.js...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 1 >nul
echo [OK] Processos encerrados
echo.

:: Liberar porta 3000
echo [3/6] Liberando porta 3000...
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
echo.

:: Verificar dependencias
echo [4/6] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        call npm install --legacy-peer-deps
        if errorlevel 1 (
            echo.
            echo [ERRO] Falha ao instalar dependencias!
            echo.
            pause
            exit /b 1
        )
    )
    echo [OK] Dependencias instaladas
) else (
    echo [OK] Dependencias ja instaladas
)
echo.

:: Criar .env
echo [5/6] Verificando .env...
if not exist ".env" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:%PORTA%"
        echo NEXTAUTH_SECRET="cannalize-secret-2026"
    ) > .env
    echo [OK] .env criado
) else (
    echo [OK] .env existe
)
echo.

:: Configurar Prisma
echo [6/6] Configurando Prisma...
if exist "prisma\schema.prisma" (
    echo Validando schema...
    call npx prisma validate 2>&1
    if errorlevel 1 (
        echo.
        echo [ERRO] Schema invalido!
        echo.
        pause
        exit /b 1
    )
    
    echo Gerando Prisma Client...
    call npx prisma generate 2>&1
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao gerar Prisma Client!
        echo.
        pause
        exit /b 1
    )
    
    echo Criando banco...
    call npx prisma db push --accept-data-loss 2>&1
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao criar banco!
        echo.
        pause
        exit /b 1
    )
    echo [OK] Banco configurado
) else (
    echo [AVISO] Schema nao encontrado
)
echo.

:: Iniciar servidor
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

:: Executar servidor (SEM redirecionar - mostra tudo)
if "%PORTA%"=="3001" (
    set PORT=3001
    call npm run dev -- -p 3001
) else (
    call npm run dev
)

:: Se chegou aqui, servidor parou
echo.
echo Servidor parou.
pause
