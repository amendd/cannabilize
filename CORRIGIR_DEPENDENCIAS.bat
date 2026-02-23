@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   CORRIGINDO DEPENDENCIAS
echo ========================================
echo.

echo [1] Removendo node_modules e package-lock.json...
if exist "node_modules" (
    rmdir /s /q "node_modules" >nul 2>&1
    echo OK - node_modules removido
)
if exist "package-lock.json" (
    del "package-lock.json" >nul 2>&1
    echo OK - package-lock.json removido
)
echo.

echo [2] Limpando cache do npm...
call npm cache clean --force
echo OK - Cache limpo
echo.

echo [3] Instalando dependencias (versoes corrigidas)...
echo Isso pode levar alguns minutos...
echo.

call npm install
if errorlevel 1 (
    echo.
    echo [AVISO] Algumas dependencias podem ter falhado.
    echo Tentando instalar sem as opcionais...
    echo.
    call npm install --legacy-peer-deps
)

echo.
echo [4] Verificando instalacao...
if exist "node_modules\next" (
    echo OK - Next.js instalado
) else (
    echo ERRO - Next.js nao foi instalado!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPENDENCIAS CORRIGIDAS!
echo ========================================
echo.
echo Agora execute: EXECUTAR_AQUI.bat
echo.
pause
