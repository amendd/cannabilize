@echo off
chcp 65001 >nul
title Click Cannabis - Executando Site
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     CLICK CANNABIS - CONFIGURAÇÃO E EXECUÇÃO            ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo [✓] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [✗] ERRO: Node.js não está instalado!
    echo.
    echo Por favor, instale Node.js de: https://nodejs.org/
    echo Versão recomendada: 18 ou superior
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [✓] Node.js encontrado: %NODE_VERSION%
echo.

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo [→] Instalando dependências (isso pode levar alguns minutos)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [✗] Erro ao instalar dependências!
        pause
        exit /b 1
    )
    echo.
    echo [✓] Dependências instaladas com sucesso!
    echo.
) else (
    echo [✓] Dependências já instaladas
    echo.
)

:: Verificar arquivo .env
if not exist ".env" (
    echo [→] Criando arquivo .env...
    (
        echo # Configuração do Banco de Dados
        echo # Use SQLite para testes rápidos (sem precisar PostgreSQL)
        echo DATABASE_URL="file:./dev.db"
        echo.
        echo # NextAuth
        echo NEXTAUTH_URL="http://localhost:3000"
        echo NEXTAUTH_SECRET="click-cannabis-secret-key-2026-123456789"
        echo.
        echo # Opcional - Para integrações futuras
        echo # STRIPE_SECRET_KEY=""
        echo # WHATSAPP_API_KEY=""
    ) > .env
    echo [✓] Arquivo .env criado com SQLite (para testes)
    echo.
    echo [⚠] ATENÇÃO: Usando SQLite para facilitar testes
    echo     Para produção, configure PostgreSQL no arquivo .env
    echo.
) else (
    echo [✓] Arquivo .env encontrado
    echo.
)

:: Verificar se precisa mudar para SQLite
findstr /C:"provider = \"postgresql\"" prisma\schema.prisma >nul
if %errorlevel% == 0 (
    echo [→] Configurando para usar SQLite (mais fácil para testes)...
    powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma"
    powershell -Command "(Get-Content prisma\schema.prisma) -replace 'postgresql://', 'file:./' | Set-Content prisma\schema.prisma"
    echo [✓] Configurado para SQLite
    echo.
)

:: Gerar Prisma Client
echo [→] Gerando Prisma Client...
call npx prisma generate >nul 2>&1
if errorlevel 1 (
    echo [✗] Erro ao gerar Prisma Client
    pause
    exit /b 1
)
echo [✓] Prisma Client gerado
echo.

:: Criar banco de dados
echo [→] Criando banco de dados...
call npx prisma db push --accept-data-loss >nul 2>&1
if errorlevel 1 (
    echo [⚠] Aviso: Erro ao criar banco. Tentando continuar...
) else (
    echo [✓] Banco de dados criado
    echo.
)

:: Popular banco (opcional)
if exist "prisma\seed.ts" (
    echo [→] Populando banco com dados de exemplo...
    call npm run db:seed >nul 2>&1
    if errorlevel 0 (
        echo [✓] Dados de exemplo criados
        echo.
        echo    Credenciais:
        echo    - Admin: admin@clickcannabis.com / admin123
        echo    - Médico: doctor@clickcannabis.com / doctor123
        echo.
    )
)

:: Limpar console
cls

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║              🚀 SERVIDOR INICIANDO...                   ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo [✓] Tudo configurado!
echo.
echo 📍 Acesse o site em:
echo    http://localhost:3000
echo.
echo 📍 URLs disponíveis:
echo    - Homepage: http://localhost:3000
echo    - Agendamento: http://localhost:3000/agendamento
echo    - Login: http://localhost:3000/login
echo    - Admin: http://localhost:3000/admin
echo.
echo [⚠] Para parar o servidor, pressione Ctrl+C
echo.
echo ═══════════════════════════════════════════════════════════
echo.

:: Iniciar servidor
call npm run dev

pause
