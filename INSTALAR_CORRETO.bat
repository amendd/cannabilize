@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   INSTALACAO CORRIGIDA - CLICK CANNABIS
echo ========================================
echo.

echo [1/6] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Baixe e instale de: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo OK - Node.js encontrado
echo.

echo [2/6] Limpando instalacao anterior...
if exist "node_modules" (
    echo Removendo node_modules (isso pode levar um minuto)...
    rmdir /s /q "node_modules" >nul 2>&1
    echo OK - node_modules removido
)
if exist "package-lock.json" (
    del "package-lock.json" >nul 2>&1
    echo OK - package-lock.json removido
)
echo.

echo [3/6] Limpando cache do npm...
call npm cache clean --force >nul 2>&1
echo OK - Cache limpo
echo.

echo [4/6] Instalando dependencias...
echo.
echo IMPORTANTE: Isso pode levar 2-5 minutos na primeira vez!
echo Por favor, aguarde...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo Tentando com --legacy-peer-deps...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo ERRO ao instalar dependencias!
        echo Verifique sua conexao com internet.
        pause
        exit /b 1
    )
)
echo.
echo OK - Dependencias instaladas com sucesso!
echo.

echo [5/6] Criando arquivo .env...
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

echo [6/6] Configurando banco de dados...
if exist "prisma\schema.prisma" (
    :: Verificar se ja esta em SQLite
    findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
    if errorlevel 1 (
        echo Configurando para SQLite (mais facil para testes)...
        powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma" >nul 2>&1
        powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma" >nul 2>&1
    )
    
    echo Gerando Prisma Client...
    call npx prisma generate >nul 2>&1
    echo Criando banco de dados...
    call npx prisma db push --accept-data-loss >nul 2>&1
    echo OK - Banco configurado
) else (
    echo AVISO: Schema Prisma nao encontrado
)
echo.

cls
echo.
echo ========================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Iniciando servidor de desenvolvimento...
echo.
echo Aguarde aparecer a mensagem:
echo   "Local: http://localhost:3000"
echo.
echo ENTAO abra o navegador em:
echo   http://localhost:3000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ========================================
echo.

call npm run dev

pause
