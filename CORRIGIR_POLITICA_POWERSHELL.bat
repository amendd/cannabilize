@echo off
title Corrigir Politica PowerShell
color 0E

cls
echo.
echo ========================================
echo   CORRIGIR POLITICA POWERSHELL
echo ========================================
echo.
echo Este script vai habilitar execucao de scripts no PowerShell
echo para que o npm funcione corretamente.
echo.
echo IMPORTANTE: Precisa executar como Administrador!
echo.
pause

:: Verificar se e administrador
net session >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Este script precisa ser executado como Administrador!
    echo.
    echo Como fazer:
    echo 1. Clique com botao direito no arquivo
    echo 2. Escolha "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo.
echo [1/2] Alterando politica de execucao...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
if errorlevel 1 (
    echo [ERRO] Falha ao alterar politica!
    pause
    exit /b 1
)
echo [OK] Politica alterada
echo.

echo [2/2] Verificando politica atual...
powershell -Command "Get-ExecutionPolicy -Scope CurrentUser"
echo.

echo ========================================
echo   POLITICA CORRIGIDA!
echo ========================================
echo.
echo Agora pode executar: EXECUTAR_POWERSHELL.bat
echo.
pause
