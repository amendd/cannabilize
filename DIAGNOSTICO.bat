@echo off
chcp 65001 >nul
title Click Cannabis - Diagnostico
color 0E

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║           DIAGNÓSTICO DO PROBLEMA                       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo [1] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [✗] Node.js NÃO está instalado!
    echo.
    echo SOLUÇÃO: Instale Node.js de https://nodejs.org/
    echo Versão recomendada: 18 ou superior
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [✓] Node.js: %%i
)
echo.

echo [2] Verificando pasta do projeto...
cd /d "%~dp0"
echo [✓] Pasta atual: %CD%
echo.

echo [3] Verificando package.json...
if exist "package.json" (
    echo [✓] package.json encontrado
) else (
    echo [✗] package.json NÃO encontrado!
    echo     Você está na pasta correta?
    pause
    exit /b 1
)
echo.

echo [4] Verificando node_modules...
if exist "node_modules" (
    echo [✓] node_modules existe
) else (
    echo [✗] node_modules NÃO existe!
    echo     Execute: npm install
    echo.
    set /p INSTALL="Deseja instalar agora? (S/N): "
    if /i "%INSTALL%"=="S" (
        echo.
        echo Instalando dependências...
        call npm install
    )
)
echo.

echo [5] Verificando arquivo .env...
if exist ".env" (
    echo [✓] .env encontrado
) else (
    echo [⚠] .env NÃO encontrado - será criado automaticamente
)
echo.

echo [6] Verificando se porta 3000 está em uso...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo [⚠] Porta 3000 está em uso!
    echo.
    echo Processos usando a porta 3000:
    netstat -ano | findstr ":3000"
    echo.
    echo SOLUÇÃO: Feche o processo ou use outra porta
) else (
    echo [✓] Porta 3000 está livre
)
echo.

echo [7] Verificando Prisma...
if exist "prisma\schema.prisma" (
    echo [✓] Schema Prisma encontrado
) else (
    echo [✗] Schema Prisma NÃO encontrado!
)
echo.

echo ═══════════════════════════════════════════════════════════
echo.
echo DIAGNÓSTICO CONCLUÍDO
echo.
echo Próximos passos:
echo 1. Se node_modules não existe, execute: npm install
echo 2. Execute: npx prisma generate
echo 3. Execute: npx prisma db push
echo 4. Execute: npm run dev
echo.
echo Ou simplesmente execute: EXECUTAR_AGORA.bat
echo.
pause
