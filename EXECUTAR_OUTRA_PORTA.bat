@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   EXECUTAR EM OUTRA PORTA
echo ========================================
echo.

:: Verificar se esta na pasta certa
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    pause
    exit /b 1
)

echo Escolha uma porta (padrao: 3001):
set /p PORTA="Porta (Enter para 3001): "

if "%PORTA%"=="" set PORTA=3001

echo.
echo Verificando se porta %PORTA% esta livre...
netstat -ano | findstr ":%PORTA%" >nul
if errorlevel 0 (
    echo [AVISO] Porta %PORTA% esta em uso!
    echo Escolha outra porta.
    pause
    exit /b 1
)

echo [OK] Porta %PORTA% esta livre!
echo.

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    pause
    exit /b 1
)

:: Verificar dependencias
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        call npm install --legacy-peer-deps
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
    findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
    if errorlevel 1 (
        powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma" >nul 2>&1
        powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma" >nul 2>&1
    )
    npx prisma generate >nul 2>&1
    npx prisma db push --accept-data-loss >nul 2>&1
)

echo.
echo ========================================
echo   INICIANDO SERVIDOR NA PORTA %PORTA%
echo ========================================
echo.
echo O site estara disponivel em:
echo    http://localhost:%PORTA%
echo.
echo Aguarde aparecer: "Local: http://localhost:%PORTA%"
echo.
echo Para parar, pressione Ctrl+C
echo.
echo ========================================
echo.

:: Executar com porta customizada
set PORT=%PORTA%
call npm run dev -- -p %PORTA%

pause
