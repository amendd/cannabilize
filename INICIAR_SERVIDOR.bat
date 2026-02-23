@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   CLICK CANNABIS - INICIAR SERVIDOR
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar se esta na pasta certa
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo.
    echo Voce esta na pasta correta?
    echo Esta pasta deve conter: package.json, app/, components/
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo [OK] Projeto encontrado!
echo.

:: Verificar Node.js
echo Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao esta instalado!
    echo.
    echo Baixe e instale de: https://nodejs.org/
    echo Versao recomendada: 18 ou superior
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

:: Verificar dependencias
echo Verificando dependencias...
if not exist "node_modules" (
    echo.
    echo [AVISO] Dependencias nao encontradas!
    echo.
    echo Deseja instalar agora? (S/N)
    set /p install="> "
    if /i "%install%"=="S" (
        echo.
        echo Instalando dependencias...
        call npm install
        if errorlevel 1 (
            echo.
            echo Tentando com --legacy-peer-deps...
            call npm install --legacy-peer-deps
        )
    ) else (
        echo.
        echo Instale as dependencias primeiro com: npm install
        echo.
        echo Pressione qualquer tecla para sair...
        pause >nul
        exit /b 1
    )
) else (
    echo [OK] Dependencias encontradas
)
echo.

:: Verificar .env
echo Verificando arquivo .env...
if not exist ".env" (
    echo [AVISO] Arquivo .env nao encontrado!
    echo.
    echo Criando arquivo .env basico...
    (
        echo DATABASE_URL="postgresql://postgres.bveygfmackugdaqjovxu:i48T3%%3Fx6.gwS8dz@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026-123456789"
    ) > .env
    echo [OK] Arquivo .env criado
) else (
    echo [OK] Arquivo .env encontrado
)
echo.

:: Verificar porta 3000
echo Verificando porta 3000...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo.
    echo [AVISO] Porta 3000 esta em uso!
    echo.
    echo Deseja tentar liberar automaticamente? (S/N)
    set /p kill="> "
    if /i "%kill%"=="S" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
            echo Encerrando processo %%a...
            taskkill /PID %%a /F >nul 2>&1
            timeout /t 2 >nul
        )
        echo [OK] Tentativa de liberar porta concluida
    ) else (
        echo.
        echo Feche o processo manualmente ou use outra porta.
        echo.
        echo Pressione qualquer tecla para sair...
        pause >nul
        exit /b 1
    )
) else (
    echo [OK] Porta 3000 esta livre
)
echo.

:: Iniciar servidor
echo ========================================
echo   INICIANDO SERVIDOR...
echo ========================================
echo.
echo Aguarde aparecer: "Local: http://localhost:3000"
echo.
echo ENTAO abra o navegador em: http://localhost:3000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ========================================
echo.

:: Iniciar servidor
call npm run dev

:: Se chegar aqui, o servidor parou
echo.
echo.
echo ========================================
echo   SERVIDOR PAROU
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
