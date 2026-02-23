@echo off
cd /d "%~dp0"
title Diagnostico Completo
color 0E

cls
echo.
echo ========================================
echo   DIAGNOSTICO COMPLETO
echo ========================================
echo.

:: 1. Node.js
echo [1/8] Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js NAO encontrado!
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] %%i
)
echo.

:: 2. Pasta
echo [2/8] Pasta atual...
echo %CD%
if exist "package.json" (
    echo [OK] package.json encontrado
) else (
    echo [ERRO] package.json NAO encontrado!
)
echo.

:: 3. Dependencias
echo [3/8] Dependencias...
if exist "node_modules" (
    echo [OK] node_modules existe
    if exist "node_modules\next" (
        echo [OK] Next.js instalado
    ) else (
        echo [ERRO] Next.js NAO instalado!
    )
) else (
    echo [ERRO] node_modules NAO existe!
)
echo.

:: 4. .env
echo [4/8] Arquivo .env...
if exist ".env" (
    echo [OK] .env existe
) else (
    echo [AVISO] .env nao existe
)
echo.

:: 5. Schema Prisma
echo [5/8] Schema Prisma...
if exist "prisma\schema.prisma" (
    echo [OK] Schema encontrado
    echo Validando...
    call npx prisma validate 2>&1
    if errorlevel 1 (
        echo [ERRO] Schema invalido!
    ) else (
        echo [OK] Schema valido
    )
) else (
    echo [ERRO] Schema NAO encontrado!
)
echo.

:: 6. Prisma Client
echo [6/8] Prisma Client...
if exist "node_modules\.prisma\client\index.js" (
    echo [OK] Prisma Client gerado
) else (
    echo [AVISO] Prisma Client nao gerado
    echo Tentando gerar...
    call npx prisma generate 2>&1
    if errorlevel 1 (
        echo [ERRO] Falha ao gerar!
    ) else (
        echo [OK] Gerado com sucesso
    )
)
echo.

:: 7. Banco de dados
echo [7/8] Banco de dados...
if exist "prisma\dev.db" (
    echo [OK] Banco existe
) else (
    echo [AVISO] Banco nao existe
    echo Tentando criar...
    call npx prisma db push --accept-data-loss 2>&1
    if errorlevel 1 (
        echo [ERRO] Falha ao criar!
    ) else (
        echo [OK] Criado com sucesso
    )
)
echo.

:: 8. Porta 3000
echo [8/8] Porta 3000...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo [AVISO] Porta 3000 em uso!
    echo Processos:
    netstat -ano | findstr ":3000"
) else (
    echo [OK] Porta 3000 livre
)
echo.

echo ========================================
echo   DIAGNOSTICO CONCLUIDO
echo ========================================
echo.
echo Se houver erros acima, corrija antes de executar.
echo.
pause
