@echo off
cd /d "%~dp0"
title Click Cannabis - Debug Mode
color 0E

echo.
echo ========================================
echo   MODO DEBUG - VER TODOS OS ERROS
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar package.json
if not exist "package.json" (
    echo [ERRO CRITICO] package.json nao encontrado!
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO CRITICO] Node.js nao encontrado!
    pause >nul
    exit /b 1
)

:: Verificar dependencias
if not exist "node_modules" (
    echo [AVISO] node_modules nao existe. Instalando...
    echo.
    npm install
    if errorlevel 1 (
        echo.
        echo Tentando com --legacy-peer-deps...
        npm install --legacy-peer-deps
    )
    echo.
)

:: Criar .env
if not exist ".env" (
    echo Criando .env...
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:3000"
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
    npx prisma generate
    npx prisma db push --accept-data-loss
)

echo.
echo ========================================
echo   INICIANDO SERVIDOR (MODO DEBUG)
echo ========================================
echo.
echo Todos os erros serao mostrados aqui.
echo.
echo Aguarde aparecer: "Local: http://localhost:3000"
echo.
echo ========================================
echo.

:: Executar sem redirecionar erros
npm run dev

echo.
echo.
echo Servidor parou.
echo.
pause
