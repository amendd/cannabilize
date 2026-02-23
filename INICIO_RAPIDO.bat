@echo off
echo ========================================
echo   Click Cannabis - Inicio Rapido
echo ========================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js de https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js encontrado!
echo.

echo [2/5] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias!
    pause
    exit /b 1
)
echo Dependencias instaladas!
echo.

echo [3/5] Verificando arquivo .env...
if not exist .env (
    echo AVISO: Arquivo .env nao encontrado!
    echo Criando arquivo .env de exemplo...
    (
        echo DATABASE_URL="postgresql://usuario:senha@localhost:5432/clickcannabis?schema=public"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="seu-secret-key-aqui-123456789"
    ) > .env
    echo Arquivo .env criado! Por favor, edite com suas credenciais.
    pause
)
echo.

echo [4/5] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)
echo Prisma Client gerado!
echo.

echo [5/5] Iniciando servidor de desenvolvimento...
echo.
echo ========================================
echo   Servidor iniciando...
echo   Acesse: http://localhost:3000
echo ========================================
echo.

call npm run dev

pause
