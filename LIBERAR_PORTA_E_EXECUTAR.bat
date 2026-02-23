@echo off
cd /d "%~dp0"
title Liberar Porta e Executar
color 0B

cls
echo.
echo ========================================
echo   LIBERAR PORTA 3000 E EXECUTAR
echo ========================================
echo.

:: Matar TODOS os processos Node.js
echo [1/3] Matando processos Node.js...
taskkill /IM node.exe /F >nul 2>&1
if errorlevel 0 (
    echo [OK] Processos Node.js encerrados
) else (
    echo [OK] Nenhum processo encontrado
)
echo.

:: Liberar porta 3000
echo [2/3] Liberando porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Encerrando processo %%a...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 3 >nul

netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo [OK] Porta 3000 liberada
    set PORTA=3000
) else (
    echo [AVISO] Porta 3000 ainda em uso, usando 3001
    set PORTA=3001
)
echo.

:: Executar servidor
echo [3/3] Iniciando servidor...
echo.
timeout /t 1 >nul

:: Chamar script de execucao
call EXECUTAR_CMD.bat
