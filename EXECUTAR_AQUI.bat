@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   CLICK CANNABIS - EXECUTAR PROJETO
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar se esta na pasta certa
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo.
    echo Voce esta na pasta correta?
    echo Esta pasta deve conter: package.json, app/, components/, etc.
    echo.
    pause
    exit /b 1
)

echo [OK] Projeto encontrado!
echo.

:: Verificar Node.js
echo [1/5] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao esta instalado!
    echo Baixe de: https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js encontrado
echo.

:: Instalar dependencias
echo [2/5] Instalando dependencias...
if not exist "node_modules" (
    echo IMPORTANTE: Isso pode levar 2-5 minutos na primeira vez!
    echo.
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias!
        pause
        exit /b 1
    )
    echo OK - Dependencias instaladas!
) else (
    echo OK - Dependencias ja instaladas
)
echo.

:: Criar .env
echo [3/5] Verificando arquivo .env...
if not exist ".env" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026-123456789"
    ) > .env
    echo OK - Arquivo .env criado (usando SQLite)
) else (
    echo OK - Arquivo .env ja existe
)
echo.

:: Configurar Prisma
echo [4/5] Configurando banco de dados...
if exist "prisma\schema.prisma" (
    :: Mudar para SQLite se necessario
    findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
    if errorlevel 1 (
        echo Configurando para SQLite...
        powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma" >nul 2>&1
        powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma" >nul 2>&1
    )
    
    call npx prisma generate
    call npx prisma db push --accept-data-loss
    echo OK - Banco configurado
) else (
    echo AVISO: Schema Prisma nao encontrado
)
echo.

:: Iniciar servidor
echo [5/5] Iniciando servidor...
echo.
echo ========================================
echo   SERVIDOR INICIANDO...
echo ========================================
echo.
echo Aguarde aparecer: "Local: http://localhost:3000"
echo.
echo ENTAO abra o navegador em: http://localhost:3000
echo.
echo Para parar, pressione Ctrl+C
echo.
echo ========================================
echo.

call npm run dev

pause
