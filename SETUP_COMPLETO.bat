@echo off
echo ========================================
echo   Click Cannabis - Setup Completo
echo ========================================
echo.

echo Este script vai:
echo - Instalar dependencias
echo - Configurar banco de dados
echo - Popular com dados de exemplo
echo.

pause

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js de https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js encontrado!
echo.

echo [2/6] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias!
    pause
    exit /b 1
)
echo Dependencias instaladas!
echo.

echo [3/6] Verificando arquivo .env...
if not exist .env (
    echo Criando arquivo .env de exemplo...
    (
        echo DATABASE_URL="postgresql://usuario:senha@localhost:5432/clickcannabis?schema=public"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="seu-secret-key-aqui-123456789"
    ) > .env
    echo.
    echo ========================================
    echo IMPORTANTE: Edite o arquivo .env com suas credenciais do banco!
    echo ========================================
    echo.
    pause
)
echo.

echo [4/6] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)
echo Prisma Client gerado!
echo.

echo [5/6] Criando tabelas no banco...
echo AVISO: Certifique-se de que o PostgreSQL esta rodando e o .env esta configurado!
pause
call npx prisma db push
if errorlevel 1 (
    echo ERRO ao criar tabelas!
    echo Verifique se o banco de dados esta configurado corretamente.
    pause
    exit /b 1
)
echo Tabelas criadas!
echo.

echo [6/6] Populando banco com dados de exemplo...
call npm run db:seed
if errorlevel 1 (
    echo AVISO: Erro ao popular dados. Continuando mesmo assim...
)
echo.

echo ========================================
echo   Setup Completo!
echo ========================================
echo.
echo Credenciais criadas:
echo - Admin: admin@clickcannabis.com / admin123
echo - Medico: doctor@clickcannabis.com / doctor123
echo.
echo Para iniciar o servidor, execute:
echo   npm run dev
echo.
echo Ou use o arquivo: INICIO_RAPIDO.bat
echo.

pause
