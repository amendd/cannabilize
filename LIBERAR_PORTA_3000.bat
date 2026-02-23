@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   LIBERAR PORTA 3000 - FORCA BRUTA
echo ========================================
echo.

:: Verificar se porta 3000 esta em uso
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo [OK] Porta 3000 esta livre!
    echo.
    pause
    exit /b 0
)

echo [AVISO] Porta 3000 esta em uso!
echo.
echo Processos usando a porta 3000:
echo.
netstat -ano | findstr ":3000"
echo.

:: Encontrar TODOS os PIDs usando a porta 3000
echo.
echo Tentando encerrar TODOS os processos...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Encerrando processo PID %%a...
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo   [AVISO] Nao foi possivel encerrar PID %%a
    ) else (
        echo   [OK] Processo %%a encerrado
    )
)

:: Tambem tentar matar processos Node.js que podem estar usando
echo.
echo Verificando processos Node.js...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr "node.exe" >nul
if errorlevel 0 (
    echo Encerrando todos os processos Node.js...
    taskkill /IM node.exe /F >nul 2>&1
    if errorlevel 0 (
        echo [OK] Processos Node.js encerrados
    )
)

:: Aguardar um pouco
echo.
echo Aguardando 3 segundos...
timeout /t 3 >nul

:: Verificar novamente
echo.
echo Verificando se porta esta livre agora...
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo.
    echo [OK] Porta 3000 liberada com sucesso!
    echo.
    echo Pode executar o servidor agora.
    echo.
) else (
    echo.
    echo [ERRO] Porta ainda esta em uso!
    echo.
    echo Processos restantes:
    netstat -ano | findstr ":3000"
    echo.
    echo SOLUCOES:
    echo 1. Reinicie o computador
    echo 2. Use outra porta: EXECUTAR_OUTRA_PORTA.bat
    echo 3. Feche manualmente no Gerenciador de Tarefas:
    echo    - Abra Gerenciador de Tarefas (Ctrl+Shift+Esc)
    echo    - Aba "Detalhes"
    echo    - Procure por "node.exe"
    echo    - Clique com botao direito -^> Finalizar tarefa
    echo.
)

pause
