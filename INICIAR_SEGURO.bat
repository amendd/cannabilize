@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   CLICK CANNABIS - INICIAR SERVIDOR
echo   (Versao Segura - Nao deleta dados)
echo ========================================
echo.

:: Verificar se esta na pasta certa
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo.
    pause
    exit /b 1
)

echo [OK] Projeto encontrado!
echo.

:: Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao esta instalado!
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

:: Verificar dependencias
if not exist "node_modules" (
    echo [AVISO] Dependencias nao encontradas!
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        call npm install --legacy-peer-deps
    )
) else (
    echo [OK] Dependencias encontradas
)
echo.

:: Gerar Prisma Client (SEM fazer db push - mais seguro)
echo Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [AVISO] Erro ao gerar Prisma Client
    echo Continuando mesmo assim...
)
echo.

:: Verificar se usuarios existem (opcional)
echo Verificando usuarios no banco...
call npx tsx verificar-usuarios.ts >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Nao foi possivel verificar usuarios
    echo Se o login nao funcionar, execute: npx tsx criar-usuarios.ts
) else (
    echo [OK] Verificacao concluida
)
echo.

:: Verificar porta 3000
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo [AVISO] Porta 3000 esta em uso!
    echo Feche o processo manualmente ou use outra porta
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Porta 3000 esta livre
)
echo.

:: Iniciar servidor
echo ========================================
echo   INICIANDO SERVIDOR...
echo ========================================
echo.
echo Aguarde aparecer: "Local: http://localhost:3000"
echo.
echo Para parar, pressione Ctrl+C
echo.
echo ========================================
echo.

call npm run dev

pause
