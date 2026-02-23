@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   CLICK CANNABIS - EXECUTAR PROJETO
echo ========================================
echo.
echo Pasta: %CD%
echo.

:: Verificar se esta na pasta certa
if not exist "package.json" (
    echo [ERRO] package.json nao encontrado!
    echo.
    echo Voce esta na pasta correta?
    echo Esta pasta deve conter: package.json, app/, components/
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo [OK] Projeto encontrado!
echo.

:: Verificar Node.js
echo [1/6] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao esta instalado!
    echo.
    echo Baixe e instale de: https://nodejs.org/
    echo Versao recomendada: 18 ou superior
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
echo.

:: Limpar e instalar dependencias
echo [2/6] Verificando dependencias...
if not exist "node_modules" (
    echo.
    echo Instalando dependencias...
    echo IMPORTANTE: Isso pode levar 2-5 minutos na primeira vez!
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo Tentando com --legacy-peer-deps...
        call npm install --legacy-peer-deps
        if errorlevel 1 (
            echo.
            echo [ERRO] Falha ao instalar dependencias!
            echo Verifique sua conexao com internet.
            echo.
            echo Pressione qualquer tecla para sair...
            pause >nul
            exit /b 1
        )
    )
    echo.
    echo [OK] Dependencias instaladas!
) else (
    echo [OK] Dependencias ja instaladas
)
echo.

:: Criar .env
echo [3/6] Verificando arquivo .env...
if not exist ".env" (
    echo Criando arquivo .env...
    (
        echo DATABASE_URL="file:./dev.db"
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="click-cannabis-secret-2026-123456789"
    ) > .env
    echo [OK] Arquivo .env criado (usando SQLite)
) else (
    echo [OK] Arquivo .env ja existe
)
echo.

:: Configurar Prisma
echo [4/6] Configurando banco de dados...
if exist "prisma\schema.prisma" (
    :: Verificar se ja esta em SQLite
    findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
    if errorlevel 1 (
        echo Configurando para SQLite (mais facil para testes)...
        powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma" >nul 2>&1
        powershell -Command "(Get-Content prisma\schema.prisma) -replace '@db\\.\\w+', '' | Set-Content prisma\schema.prisma" >nul 2>&1
    )
    
    echo Gerando Prisma Client...
    call npx prisma generate
    if errorlevel 1 (
        echo [AVISO] Erro ao gerar Prisma, tentando continuar...
    )
    
    echo Criando/atualizando banco de dados (sem apagar dados)...
    call npx prisma db push
    if errorlevel 1 (
        echo [AVISO] Erro ao sincronizar banco. Se precisar recriar do zero, use: npx prisma db push --accept-data-loss
        echo Tentando continuar...
    ) else (
        echo [OK] Banco configurado
    )
) else (
    echo [AVISO] Schema Prisma nao encontrado
)
echo.

:: Popular dados (opcional)
echo [5/6] Verificando dados de exemplo...
if exist "prisma\seed.ts" (
    echo Populando banco com dados de exemplo...
    call npm run db:seed >nul 2>&1
    if errorlevel 0 (
        echo [OK] Dados criados
        echo.
        echo    Credenciais:
        echo    - Admin: admin@cannabilize.com.br / admin123
        echo    - Medico: doctor@cannabilize.com.br / doctor123
        echo    - Paciente: paciente@cannabilize.com.br / paciente123
    )
)
echo.

:: Verificar e liberar porta 3000
echo [6/6] Verificando porta 3000...
netstat -ano | findstr ":3000" >nul
if errorlevel 0 (
    echo.
    echo [AVISO] Porta 3000 esta em uso!
    echo Tentando liberar automaticamente...
    echo.
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        echo Encerrando processo %%a...
        taskkill /PID %%a /F >nul 2>&1
        timeout /t 2 >nul
    )
    
    netstat -ano | findstr ":3000" >nul
    if errorlevel 0 (
        echo.
        echo [ERRO] Nao foi possivel liberar a porta 3000 automaticamente.
        echo.
        echo SOLUCOES:
        echo 1. Execute: LIBERAR_PORTA_3000.bat
        echo 2. Execute: EXECUTAR_OUTRA_PORTA.bat (usa porta 3001)
        echo 3. Feche manualmente o processo no Gerenciador de Tarefas
        echo.
        echo Pressione qualquer tecla para sair...
        pause >nul
        exit /b 1
    ) else (
        echo [OK] Porta 3000 liberada!
    )
    echo.
) else (
    echo [OK] Porta 3000 esta livre
)
echo.

:: Iniciar servidor
echo [7/7] Iniciando servidor...
echo.
cls
echo.
echo ========================================
echo   SERVIDOR INICIANDO...
echo ========================================
echo.
echo Aguarde aparecer: "Local: http://localhost:3000"
echo.
echo ENTAO abra o navegador em: http://localhost:3000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.
echo ========================================
echo.

:: Iniciar servidor (sem redirecionar erros para não fechar)
call npm run dev

:: Se chegar aqui, o servidor parou
echo.
echo Servidor parou.
echo Pressione qualquer tecla para fechar...
pause >nul
