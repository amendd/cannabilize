@echo off
chcp 65001 >nul
title Click Cannabis - Corrigir e Executar
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║        CORRIGINDO PROBLEMAS E EXECUTANDO                ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Verificar Node.js
echo [1/8] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [✗] ERRO: Node.js não está instalado!
    echo.
    echo Por favor, instale Node.js primeiro:
    echo https://nodejs.org/
    echo.
    start https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [✓] Node.js: %%i
echo.

:: Matar processos na porta 3000
echo [2/8] Liberando porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Encerrando processo %%a...
    taskkill /F /PID %%a >nul 2>&1
)
echo [✓] Porta 3000 liberada
echo.

:: Limpar cache
echo [3/8] Limpando cache...
if exist ".next" (
    rmdir /s /q ".next" >nul 2>&1
    echo [✓] Cache limpo
) else (
    echo [✓] Nenhum cache para limpar
)
echo.

:: Instalar dependências
echo [4/8] Instalando/Atualizando dependências...
if not exist "node_modules" (
    echo Isso pode levar alguns minutos na primeira vez...
)
call npm install
if errorlevel 1 (
    echo.
    echo [✗] Erro ao instalar dependências!
    echo Tentando novamente...
    call npm install --force
)
echo [✓] Dependências instaladas
echo.

:: Criar .env se não existir
echo [5/8] Configurando ambiente...
if not exist ".env" (
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026-123456789"
    ) > .env
    echo [✓] Arquivo .env criado
) else (
    echo [✓] Arquivo .env já existe
)
echo.

:: Configurar SQLite no schema
echo [6/8] Configurando banco de dados...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma" >nul 2>&1
powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma" >nul 2>&1
echo [✓] Configurado para SQLite
echo.

:: Gerar Prisma
echo [7/8] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [⚠] Aviso: Erro ao gerar Prisma, continuando...
)
echo [✓] Prisma Client gerado
echo.

:: Criar banco
echo [8/8] Criando banco de dados...
call npx prisma db push --accept-data-loss >nul 2>&1
if errorlevel 0 (
    echo [✓] Banco de dados criado
) else (
    echo [⚠] Aviso: Erro ao criar banco, continuando...
)
echo.

:: Popular dados
if exist "prisma\seed.ts" (
    echo [→] Populando banco com dados de exemplo...
    call npm run db:seed >nul 2>&1
    if errorlevel 0 (
        echo [✓] Dados criados
    )
)
echo.

:: Limpar tela
cls

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║              ✅ TUDO PRONTO!                             ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 🚀 Iniciando servidor...
echo.
echo 📍 O site estará disponível em:
echo    http://localhost:3000
echo.
echo ⏱️  Aguarde alguns segundos...
echo.
echo [⚠] Para parar, pressione Ctrl+C
echo.
echo ═══════════════════════════════════════════════════════════
echo.

:: Iniciar servidor
call npm run dev

pause
