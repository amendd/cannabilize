@echo off
echo ========================================
echo   CONFIGURANDO BANCO LOCAL
echo ========================================
echo.

echo Voce tem duas opcoes:
echo.
echo   1. SQLite (Mais simples - nao precisa instalar nada)
echo   2. PostgreSQL Local (Precisa ter PostgreSQL instalado)
echo.
set /p opcao="Escolha (1 ou 2): "

if "%opcao%"=="1" goto sqlite
if "%opcao%"=="2" goto postgresql
echo Opcao invalida!
pause
exit /b 1

:sqlite
echo.
echo ========================================
echo   CONFIGURANDO SQLITE LOCAL
echo ========================================
echo.

echo [1/4] Alterando schema.prisma para SQLite...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma"
echo Schema alterado para SQLite!

echo.
echo [2/4] Configurando .env para SQLite...
if not exist .env (
    copy .env.example .env
)
powershell -Command "$content = Get-Content .env -Raw; $content = $content -replace 'DATABASE_URL=\".*\"', 'DATABASE_URL=\"file:./dev.db\"'; Set-Content .env -Value $content"
echo DATABASE_URL configurado para SQLite!

echo.
echo [3/4] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)

echo.
echo [4/4] Criando tabelas no banco SQLite local...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERRO ao criar tabelas!
    pause
    exit /b 1
)

echo.
echo [5/5] Criando usuarios de teste...
call npx tsx criar-usuarios.ts
if %errorlevel% neq 0 (
    echo ERRO ao criar usuarios!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCESSO! BANCO SQLITE LOCAL CONFIGURADO
echo ========================================
echo.
echo O banco de dados local esta em: dev.db
echo.
echo CREDENCIAIS PARA LOGIN:
echo   Admin: admin@cannabilize.com.br / admin123
echo   Medico: doctor@cannabilize.com.br / doctor123
echo   Paciente: paciente@cannabilize.com.br / paciente123
echo.
goto fim

:postgresql
echo.
echo ========================================
echo   CONFIGURANDO POSTGRESQL LOCAL
echo ========================================
echo.

echo IMPORTANTE: Voce precisa ter PostgreSQL instalado e rodando!
echo.
set /p db_user="Usuario do PostgreSQL (padrao: postgres): "
if "%db_user%"=="" set db_user=postgres

set /p db_password="Senha do PostgreSQL: "
set /p db_name="Nome do banco (padrao: clickcannabis): "
if "%db_name%"=="" set db_name=clickcannabis

echo.
echo [1/5] Verificando se schema.prisma esta como PostgreSQL...
findstr /C:"provider = \"postgresql\"" prisma\schema.prisma >nul
if %errorlevel% neq 0 (
    echo Alterando schema.prisma para PostgreSQL...
    powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"sqlite\"', 'provider = \"postgresql\"' | Set-Content prisma\schema.prisma"
    echo Schema alterado!
) else (
    echo Schema ja esta configurado para PostgreSQL!
)

echo.
echo [2/5] Configurando .env para PostgreSQL local...
if not exist .env (
    copy .env.example .env
)
set "db_url=postgresql://%db_user%:%db_password%@localhost:5432/%db_name%?schema=public"
powershell -Command "$content = Get-Content .env -Raw; $content = $content -replace 'DATABASE_URL=\".*\"', 'DATABASE_URL=\"%db_url%\"'; Set-Content .env -Value $content"
echo DATABASE_URL configurado!

echo.
echo [3/5] Gerando Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)

echo.
echo [4/5] Criando tabelas no banco PostgreSQL local...
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao criar tabelas!
    echo.
    echo Verifique:
    echo   1. PostgreSQL esta instalado e rodando?
    echo   2. O banco '%db_name%' existe?
    echo   3. As credenciais estao corretas?
    echo.
    echo Para criar o banco, execute:
    echo   createdb %db_name%
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Criando usuarios de teste...
call npx tsx criar-usuarios.ts
if %errorlevel% neq 0 (
    echo ERRO ao criar usuarios!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCESSO! BANCO POSTGRESQL LOCAL CONFIGURADO
echo ========================================
echo.
echo CREDENCIAIS PARA LOGIN:
echo   Admin: admin@cannabilize.com.br / admin123
echo   Medico: doctor@cannabilize.com.br / doctor123
echo   Paciente: paciente@cannabilize.com.br / paciente123
echo.

:fim
echo ========================================
echo   PRONTO PARA USAR!
echo ========================================
echo.
echo Agora voce pode:
echo   1. Iniciar o servidor: npm run dev
echo   2. Acessar: http://localhost:3000/login
echo   3. Fazer login com uma das credenciais acima
echo.
echo IMPORTANTE: O banco agora e LOCAL, nao mais de producao!
echo.
pause
