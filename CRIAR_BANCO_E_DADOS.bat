@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   CRIAR BANCO DE DADOS E DADOS
echo ========================================
echo.
echo Este script vai:
echo 1. Criar todas as tabelas no banco
echo 2. Criar usuarios, medicamentos, etc.
echo.
echo Aguarde, isso pode levar alguns segundos...
echo.

:: Passo 1: Gerar Prisma Client
echo [1/3] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERRO] Falha ao gerar Prisma Client
    echo.
    pause
    exit /b 1
)
echo [OK] Prisma Client gerado
echo.

:: Passo 2: Criar tabelas no banco
echo [2/3] Criando tabelas no banco de dados...
echo IMPORTANTE: Isso vai criar todas as tabelas necessarias
echo.
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao criar tabelas no banco!
    echo.
    echo Verifique:
    echo 1. A DATABASE_URL no arquivo .env esta correta?
    echo 2. O banco Supabase esta ativo?
    echo 3. Sua conexao com internet esta funcionando?
    echo.
    pause
    exit /b 1
)
echo [OK] Tabelas criadas
echo.

:: Passo 3: Criar dados
echo [3/3] Criando usuarios e dados...
echo.
call npx tsx criar-dados-completos.ts
if errorlevel 1 (
    echo.
    echo [AVISO] Erro ao criar dados, mas as tabelas foram criadas
    echo Tente executar novamente: npx tsx criar-dados-completos.ts
    echo.
) else (
    echo.
    echo [OK] Dados criados com sucesso!
)

echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo Agora voce pode:
echo 1. Iniciar o servidor: npm run dev
echo 2. Fazer login com: admin@cannabilize.com.br / admin123
echo.
pause
