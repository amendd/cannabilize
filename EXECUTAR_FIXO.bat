@echo off
cd /d "%~dp0"
title Click Cannabis - Servidor
color 0A

:: Verificar se esta na pasta certa
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    pause
    exit /b 1
)

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    pause
    exit /b 1
)

:: Verificar e liberar porta 3000 (METODO FORTE)
echo Verificando porta 3000...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo.
    echo [AVISO] Porta 3000 esta em uso!
    echo Tentando liberar com forca bruta...
    echo.
    
    :: Tentar matar todos os processos na porta
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        echo Encerrando processo %%a...
        taskkill /PID %%a /F >nul 2>&1
    )
    
    :: Tambem matar todos os Node.js
    echo Encerrando processos Node.js...
    taskkill /IM node.exe /F >nul 2>&1
    
    :: Aguardar
    timeout /t 3 >nul
    
    :: Verificar novamente
    netstat -ano | findstr ":3000" >nul
    if errorlevel 0 (
        echo.
        echo [ERRO] Nao foi possivel liberar a porta 3000.
        echo.
        echo Tentando usar porta 3001 automaticamente...
        echo.
        set PORTA=3001
        set USAR_OUTRA_PORTA=1
    ) else (
        echo [OK] Porta 3000 liberada!
        set PORTA=3000
        set USAR_OUTRA_PORTA=0
    )
    echo.
) else (
    echo [OK] Porta 3000 esta livre
    set PORTA=3000
    set USAR_OUTRA_PORTA=0
)

:: Verificar dependencias
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        call npm install --legacy-peer-deps
    )
)

:: Criar .env
if not exist ".env" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:%PORTA%"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026"
    ) > .env
) else (
    :: Atualizar NEXTAUTH_URL se estiver usando outra porta
    if "%USAR_OUTRA_PORTA%"=="1" (
        powershell -Command "(Get-Content .env) -replace 'NEXTAUTH_URL=.*', 'NEXTAUTH_URL=\"http://localhost:%PORTA%\"' | Set-Content .env"
    )
)

:: Configurar Prisma
if exist "prisma\schema.prisma" (
    findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
    if errorlevel 1 (
        powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma" >nul 2>&1
        powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma" >nul 2>&1
    )
    npx prisma generate >nul 2>&1
    npx prisma db push --accept-data-loss >nul 2>&1
)

cls
echo.
echo ========================================
echo   SERVIDOR INICIANDO...
echo ========================================
echo.
if "%USAR_OUTRA_PORTA%"=="1" (
    echo [AVISO] Usando porta %PORTA% (3000 estava ocupada)
    echo.
) else (
    echo Site: http://localhost:%PORTA%
)
echo.
echo Site: http://localhost:%PORTA%
echo.
echo Aguarde aparecer: "Local: http://localhost:%PORTA%"
echo.
echo Para parar: Ctrl+C
echo.
echo ========================================
echo.

if "%USAR_OUTRA_PORTA%"=="1" (
    set PORT=%PORTA%
    call npm run dev -- -p %PORTA%
) else (
    call npm run dev
)

pause
