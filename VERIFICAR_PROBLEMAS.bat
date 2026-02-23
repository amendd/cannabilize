@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   VERIFICACAO DE PROBLEMAS
echo ========================================
echo.

echo [1] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js NAO encontrado!
    echo.
    echo SOLUCAO: Instale Node.js de https://nodejs.org/
    echo.
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
)
echo.

echo [2] Verificando pasta atual...
echo Pasta: %CD%
if exist "package.json" (
    echo [OK] package.json encontrado
) else (
    echo [ERRO] package.json NAO encontrado!
    echo.
    echo Voce esta na pasta correta?
    echo Deve estar em: C:\Users\Gabriel\clickcannabis-replica
    echo.
)
echo.

echo [3] Verificando node_modules...
if exist "node_modules" (
    echo [OK] node_modules existe
    if exist "node_modules\next" (
        echo [OK] Next.js instalado
    ) else (
        echo [ERRO] Next.js NAO instalado!
        echo Execute: npm install
    )
) else (
    echo [ERRO] node_modules NAO existe!
    echo Execute: npm install
)
echo.

echo [4] Verificando arquivo .env...
if exist ".env" (
    echo [OK] Arquivo .env existe
) else (
    echo [AVISO] Arquivo .env nao existe
    echo Será criado automaticamente
)
echo.

echo [5] Verificando Prisma...
if exist "prisma\schema.prisma" (
    echo [OK] Schema Prisma encontrado
) else (
    echo [ERRO] Schema Prisma NAO encontrado!
)
echo.

echo [6] Verificando porta 3000...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo [AVISO] Porta 3000 esta em uso!
    echo.
    echo Processos usando a porta:
    netstat -ano | findstr ":3000"
    echo.
    echo SOLUCAO: Feche o processo ou use outra porta
) else (
    echo [OK] Porta 3000 esta livre
)
echo.

echo ========================================
echo   DIAGNOSTICO CONCLUIDO
echo ========================================
echo.
echo Se houver erros acima, corrija antes de executar.
echo.
pause
