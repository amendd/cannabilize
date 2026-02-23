@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   TESTAR LOGIN - DIAGNOSTICO
echo ========================================
echo.
echo Verificando usuarios e senhas...
echo.
echo Aguarde, isso pode levar alguns segundos...
echo.

:: Tentar executar o script
npx tsx testar-login.ts 2>&1

:: Verificar se houve erro
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO AO EXECUTAR SCRIPT
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. Dependencias nao instaladas
    echo 2. Problema de conexao com banco
    echo 3. Erro de permissao
    echo.
    echo Tentando metodo alternativo...
    echo.
    
    :: Tentar com node diretamente
    node --version >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Node.js nao encontrado!
        echo.
        echo Instale Node.js de: https://nodejs.org/
    ) else (
        echo [OK] Node.js encontrado
        echo.
        echo Tentando executar com ts-node...
        npx ts-node testar-login.ts 2>&1
    )
)

echo.
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
