@echo off
echo ========================================
echo   CONFIGURANDO SQLITE LOCAL (MAIS SIMPLES)
echo ========================================
echo.

echo IMPORTANTE: Isso vai alterar seu banco de PRODUCAO para LOCAL
echo.
pause

echo.
echo [1/5] Fazendo backup do schema.prisma...
if exist prisma\schema.prisma.backup (
    echo Backup ja existe, pulando...
) else (
    copy prisma\schema.prisma prisma\schema.prisma.backup
    echo Backup criado!
)

echo.
echo [2/5] Alterando schema.prisma para SQLite...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma"
echo Schema alterado para SQLite!

echo.
echo [3/5] Configurando .env para SQLite...
if not exist .env (
    echo Criando .env a partir do .env.example...
    copy .env.example .env
)

echo Configurando DATABASE_URL...
findstr /C:"DATABASE_URL" .env >nul
if %errorlevel% equ 0 (
    powershell -Command "$content = Get-Content .env -Raw; $content = $content -replace 'DATABASE_URL=\".*\"', 'DATABASE_URL=\"file:./dev.db\"'; Set-Content .env -Value $content"
) else (
    echo DATABASE_URL="file:./dev.db" >> .env
)
echo DATABASE_URL configurado para SQLite!

echo.
echo [4/5] Gerando Prisma Client e criando tabelas...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)

call npx prisma db push
if %errorlevel% neq 0 (
    echo ERRO ao criar tabelas!
    pause
    exit /b 1
)

echo.
echo [5/5] Criando usuarios de teste...
call npx tsx criar-usuarios.ts
if %errorlevel% neq 0 (
    echo ERRO ao criar usuarios!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCESSO! BANCO SQLITE LOCAL CONFIGURADO
echo ========================================
echo.
echo O banco de dados local esta em: dev.db
echo.
echo CREDENCIAIS PARA LOGIN:
echo   Admin: admin@cannabilize.com.br / admin123
echo   Medico: doctor@cannabilize.com.br / doctor123
echo   Paciente: paciente@cannabilize.com.br / paciente123
echo.
echo PROXIMOS PASSOS:
echo   1. Iniciar servidor: npm run dev
echo   2. Acessar: http://localhost:3000/login
echo   3. Fazer login com uma das credenciais acima
echo.
echo IMPORTANTE: Agora voce esta usando banco LOCAL, nao mais de producao!
echo.
pause
