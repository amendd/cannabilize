@echo off
cd /d "%~dp0"
title Testar Configuracao
color 0E

cls
echo.
echo ========================================
echo   TESTAR CONFIGURACAO ANTES DE INICIAR
echo ========================================
echo.

:: Verificar Node.js
echo [1/4] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

:: Verificar dependencias
echo [2/4] Verificando dependencias...
if not exist "node_modules" (
    echo [ERRO] node_modules nao existe!
    echo Execute: npm install
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

:: Validar schema
echo [3/4] Validando schema Prisma...
if exist "prisma\schema.prisma" (
    call npx prisma validate
    if errorlevel 1 (
        echo [ERRO] Schema invalido!
        pause
        exit /b 1
    )
    echo [OK] Schema valido
) else (
    echo [ERRO] Schema nao encontrado!
    pause
    exit /b 1
)
echo.

:: Gerar Prisma Client
echo [4/4] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERRO] Falha ao gerar Prisma Client!
    pause
    exit /b 1
)
echo [OK] Prisma Client gerado
echo.

echo ========================================
echo   TUDO OK! Pode executar INICIAR_SITE.bat
echo ========================================
echo.
pause
