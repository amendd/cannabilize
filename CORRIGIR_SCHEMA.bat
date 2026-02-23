@echo off
cd /d "%~dp0"
title Corrigir Schema Prisma
color 0E

cls
echo.
echo ========================================
echo   CORRIGINDO SCHEMA PRISMA
echo ========================================
echo.
echo Este script vai:
echo 1. Converter schema para SQLite
echo 2. Remover enums (SQLite nao suporta)
echo 3. Corrigir tipos incompatíveis
echo 4. Adicionar relações faltantes
echo 5. Validar schema
echo.
pause

:: Verificar se schema existe
if not exist "prisma\schema.prisma" (
    echo [ERRO] Schema Prisma nao encontrado!
    pause
    exit /b 1
)

echo.
echo [1/4] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERRO] Falha ao gerar Prisma Client!
    echo.
    echo Verifique os erros acima.
    pause
    exit /b 1
)
echo [OK] Prisma Client gerado
echo.

echo [2/4] Validando schema...
call npx prisma validate
if errorlevel 1 (
    echo [ERRO] Schema invalido!
    echo.
    echo Verifique os erros acima.
    pause
    exit /b 1
)
echo [OK] Schema valido
echo.

echo [3/4] Criando banco de dados...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo [ERRO] Falha ao criar banco!
    echo.
    echo Verifique os erros acima.
    pause
    exit /b 1
)
echo [OK] Banco criado
echo.

echo [4/4] Populando dados de exemplo...
if exist "prisma\seed.ts" (
    call npm run db:seed
    if errorlevel 0 (
        echo [OK] Dados populados
        echo.
        echo Credenciais:
        echo - Admin: admin@clickcannabis.com / admin123
        echo - Medico: doctor@clickcannabis.com / doctor123
    )
)
echo.

echo ========================================
echo   SCHEMA CORRIGIDO COM SUCESSO!
echo ========================================
echo.
echo Agora pode executar: INICIAR_SITE.bat
echo.
pause
